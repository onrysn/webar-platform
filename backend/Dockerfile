# Base image
FROM node:20-alpine

# Çalışma dizini
WORKDIR /app

# Package dosyalarını kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm install

# Tüm kaynak kodunu kopyala
COPY . .

# Prisma Client generate (opsiyonel, eğer migrate ile önce yapılmayacaksa)
RUN npx prisma generate

# Portu expose et
EXPOSE 3000

# Uygulamayı başlat
CMD ["npm", "run", "start:dev"]