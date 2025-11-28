# Base image
FROM node:20-alpine

# Çalışma dizini
WORKDIR /app

# Sistem bağımlılıklarını yükle - Python ve gerekli kütüphaneler
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    mesa-dev \
    libxi-dev \
    libx11-dev \
    libxext-dev \
    libxrender-dev \
    libxrandr-dev \
    libxcursor-dev \
    && ln -sf python3 /usr/bin/python

# Package dosyalarını kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm install

# Tüm kaynak kodunu kopyala
COPY . .

# Prisma Client generate
RUN npx prisma generate

# Portu expose et
EXPOSE 3000

# Uygulamayı başlat
CMD ["npm", "run", "start:dev"]