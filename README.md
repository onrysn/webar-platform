# Backend
# 1️⃣ Projeyi klonla
git clone <repository-url>
cd webar-platform

# 2️⃣ Docker container’larını durdur build et ve başlat
docker compose down
docker compose up -d --build
docker compose -f docker-compose.dev.yml up -d --build
docker compose -f docker-compose.prod.yml up -d --build

# 3️⃣ Backend container içine gir (Prisma migrate ve prisma studio için)
docker exec -it webar-platform-backend-1 sh

# 4️⃣ Prisma migrate çalıştır (tabloları oluştur)
npx prisma migrate dev --name init

# 4️⃣4️⃣ Prisma update çalıştır
npx prisma migrate deploy

# 4️⃣4️⃣ Prisma seed çalıştır
npx ts-node prisma/seed.ts

# 5️⃣ (Opsiyonel) Prisma Studio ile veritabanını gör
npx prisma studio

# 6️⃣ Backend restart
docker compose restart backend

# 7️⃣ Frontend restart
docker compose restart frontend

# 8️⃣ Hot Reload Notları
# Backend npm run start:dev ile çalışıyor ve host kodları container ile paylaşılıyor.
# dist mount edilmediği için değişiklikler anında hot reload ile yansıyacak.
# Swagger UI bazen cache nedeniyle eski versiyonu gösterebilir; hard refresh (Ctrl+Shift+R) önerilir.

# 9️⃣ Öneriler
# Kod değişikliklerinden sonra backend’in hot reload ile otomatik güncellenmesini istiyorsanız dist mount edilmemeli.
# Frontend değişiklikleri Vite sayesinde anında güncellenecektir.

# 🔟 Tarayıcıdan erişim:
# Adminer: http://localhost:8080  (DB: arapp_dev, User: dev, Password: dev)
# Backend API: http://localhost:3000
# Prisma Studio: http://localhost:5555