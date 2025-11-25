// Oddiy haydovchi simulyatsiyasi (in-memory)
const haversine = (lat1, lon1, lat2, lon2) => {
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
};

// Tashkent markaziy koordinatalari taxminiy
const BASE_LAT = 41.311081;
const BASE_LNG = 69.240562;

let drivers = [];

// Dastlab 6 haydovchi yaratiladi (tasodifiy joylashuv)
for (let i = 1; i <= 6; i++) {
  drivers.push({
    id: 'drv' + i,
    name: 'Haydovchi ' + i,
    plate: 'UZ ' + (1000 + i),
    lat: BASE_LAT + (Math.random() - 0.5) * 0.1,
    lng: BASE_LNG + (Math.random() - 0.5) * 0.1,
    available: true,
    speed: 10 + Math.random() * 10, // m/s (simulyatsiya uchun)
    assignedTo: null
  });
}

function getAllDrivers() {
  return drivers;
}

function findNearestDriver(lat, lng) {
  let best = null;
  let bestDist = Infinity;
  drivers.forEach(d => {
    if (!d.available) return;
    const dist = haversine(lat, lng, d.lat, d.lng);
    if (dist < bestDist) {
      bestDist = dist;
      best = d;
    }
  });
  return best;
}

function startDriverSimulation(io) {
  // Har 3 soniyada haydovchilarni ozgina "siljitatamiz" va barcha mijozlarga yuboramiz
  setInterval(() => {
    drivers.forEach(d => {
      // agar tayinlangan bo'lsa, d.assignedTo ga qarab harakatni o'zgartirish mumkin.
      // Hozircha tasodifiy kichik siljitish
      const dx = (Math.random() - 0.5) * 0.001;
      const dy = (Math.random() - 0.5) * 0.001;
      d.lat += dx;
      d.lng += dy;

      // Agar haydovchi mijozga tayinlangan bo'lsa, unga maxsus event yubor
      if (d.assignedTo && d.assignedTo.socketId) {
        io.to(d.assignedTo.socketId).emit('driverLocation', {
          driverId: d.id,
          lat: d.lat,
          lng: d.lng
        });
      }
    });

    // Umumiy haydovchi joylashuvlarini ham tarmoqqa tarqatamiz (front uchun)
    io.emit('drivers', drivers.map(d => ({
      id: d.id, lat: d.lat, lng: d.lng, available: d.available, name: d.name
    })));
  }, 3000);
}

module.exports = { startDriverSimulation, findNearestDriver, getAllDrivers };