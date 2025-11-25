# Uzbek Taxi — O'rtacha murakkablikdagi demo (to'lovsiz)

Tavsif
- Foydalanuvchi registratsiya/login (JWT).
- SQLite bilan in-memory emas, faylga yoziladigan ma'lumotlar bazasi (better-sqlite3).
- Socket.IO orqali real-vaqt haydovchi joylashuvlari va tayinlash.
- Haydovchi paneli: haydovchi o'z mavjudligini yoqadi/o‘chiradi va joylashuv yuboradi.
- Xarita: Leaflet (OpenStreetMap).
- To'lovlar yo'q.

Tez ishga tushirish
1) Backend:
   cd server
   npm install
   # .env fayl yarating, masalan:
   # JWT_SECRET=some_long_secret
   # PORT=5000
   npm run dev

2) Client:
   cd client
   npm install
   npm start
   Brauzerda http://localhost:3000 ni oching.

Qisqacha ishlash
- Foydalanuvchi registratsiya/login orqali token oladi.
- Frontend token bilan xaritaga kiradi va Socket.IO ga ulanadi.
- "Call Taxi" bosilganda /rides endpoint chaqiriladi. Server yaqin bo‘sh haydovchini tanlaydi, ride yozuvini yaratadi va mijoz socketId ga rideAssigned yuboradi.
- Haydovchi Driver Panel orqali joylashuv yuboradi yoki server tarafdan simulyatsiya qilinadi.
- Hech qanday to'lov jarayoni yo'q.

Keyingi takliflar
- Real marshrut va navigatsiya (OSRM yoki OpenRouteService).
- Push notification, SMS.
- Admin panel.
- Docker + CI/CD.