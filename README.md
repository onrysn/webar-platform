# Backend
# 1️⃣ Projeyi klonla
git clone <repository-url>
cd webar-platform

# 2️⃣ Docker container’larını build et ve başlat
docker compose up -d --build

# 3️⃣ Backend container içine gir (Prisma migrate ve prisma studio için)
docker exec -it webar-platform-backend-1 sh

# 4️⃣ Prisma migrate çalıştır (tabloları oluştur)
npx prisma migrate dev --name init

# 5️⃣ (Opsiyonel) Prisma Studio ile veritabanını gör
npx prisma studio

# 6️⃣ Tarayıcıdan erişim:
# Adminer: http://localhost:8080  (DB: arapp_dev, User: dev, Password: dev)
# Backend API: http://localhost:3000
# Prisma Studio: http://localhost:5555