require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const db = require('./db');
const { register, login, authMiddleware } = require('./auth');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Socket map: userId/driverId -> socketId(s)
const sockets = {
  users: new Map(),
  drivers: new Map()
};

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  socket.on('registerSocket', (payload) => {
    // payload: { type: 'user'|'driver', id }
    if (!payload || !payload.type || !payload.id) return;
    if (payload.type === 'user') sockets.users.set(payload.id, socket.id);
    if (payload.type === 'driver') sockets.drivers.set(payload.id, socket.id);
    console.log('Registered socket', payload.type, payload.id, socket.id);
  });

  socket.on('driverLocationUpdate', (payload) => {
    // payload: { driverId, lat, lng }
    if (!payload || !payload.driverId) return;
    db.prepare('UPDATE drivers SET lat = ?, lng = ? WHERE id = ?').run(payload.lat, payload.lng, payload.driverId);
    // agar haydovchi tayinlangan ride bor-yo'qligini tekshirib, userga yuborish mumkin
    // barchaga umumiy drivers event yuboramiz:
    const drivers = db.prepare('SELECT id, name, plate, lat, lng, available FROM drivers').all();
    io.emit('drivers', drivers);
  });

  socket.on('disconnect', () => {
    console.log('socket disconnected', socket.id);
    // remove from maps if present
    for (const [k, v] of sockets.users) if (v === socket.id) sockets.users.delete(k);
    for (const [k, v] of sockets.drivers) if (v === socket.id) sockets.drivers.delete(k);
  });
});

// Auth endpoints
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username va password kerak' });
  try {
    const user = register(username, password);
    const { token, user: u } = login(username, password);
    res.json({ token, user: u });
  } catch (e) {
    res.status(400).json({ error: 'username mavjud yoki xato' });
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const data = login(username, password);
  if (!data) return res.status(401).json({ error: 'invalid credentials' });
  res.json(data);
});

// Ochiq: haydovchilar ro'yxati
app.get('/api/drivers', (req, res) => {
  const drivers = db.prepare('SELECT id, name, plate, lat, lng, available FROM drivers').all();
  res.json(drivers);
});

// Ride so'rov — foydalanuvchi must be auth
app.post('/api/rides', authMiddleware, (req, res) => {
  const { pickupLat, pickupLng } = req.body;
  if (typeof pickupLat !== 'number' || typeof pickupLng !== 'number') return res.status(400).json({ error: 'coords kerak' });

  // eng yaqin available haydovchini topish (haversine)
  const drivers = db.prepare('SELECT * FROM drivers WHERE available = 1').all();
  if (!drivers || drivers.length === 0) return res.status(404).json({ error: 'Bo\'sh haydovchi yo\'q' });

  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const toRad = (d) => d * Math.PI / 180;
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  let best = null;
  let bestDist = Infinity;
  drivers.forEach(d => {
    const dist = haversine(pickupLat, pickupLng, d.lat, d.lng);
    if (dist < bestDist) { bestDist = dist; best = d; }
  });

  if (!best) return res.status(404).json({ error: 'Haydovchi topilmadi' });

  // ride yozuvi yarataylik
  const insert = db.prepare('INSERT INTO rides (userId, driverId, status, pickupLat, pickupLng) VALUES (?, ?, ?, ?, ?)');
  const info = insert.run(req.user.id, best.id, 'assigned', pickupLat, pickupLng);
  db.prepare('UPDATE drivers SET available = 0 WHERE id = ?').run(best.id);

  // mijoz socketiga yubormoq
  const userSocket = sockets.users.get(String(req.user.id));
  if (userSocket) {
    io.to(userSocket).emit('rideAssigned', {
      rideId: info.lastInsertRowid,
      driver: { id: best.id, name: best.name, plate: best.plate, lat: best.lat, lng: best.lng },
      etaSeconds: Math.round(bestDist / 10) // oddiy estimat (10 m/s)
    });
  }

  res.json({ ok: true, rideId: info.lastInsertRowid, driverId: best.id });
});

// Driver panel: haydovchi mavjudligini o'zgartirish uchun endpoint (auth required)
app.post('/api/driver/:id/available', (req, res) => {
  const id = req.params.id;
  const { available } = req.body;
  db.prepare('UPDATE drivers SET available = ? WHERE id = ?').run(available ? 1 : 0, id);
  const drivers = db.prepare('SELECT id, name, plate, lat, lng, available FROM drivers').all();
  io.emit('drivers', drivers);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('Server started on', PORT);
});