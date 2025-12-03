# 1. Base Image
FROM node:20-bookworm-slim

# Çalışma dizini
WORKDIR /app

# 2. Sistem bağımlılıklarını yükle
RUN apt-get update && apt-get install -y \
    # Node ve Prisma için gerekli araçlar
    python3 \
    build-essential \
    openssl \
    # Blender indirmek için
    wget \
    xz-utils \
    # Blender GUI/Headless kütüphaneleri
    libgl1 \
    libxi6 \
    libxrender1 \
    libxxf86vm1 \
    libxfixes3 \
    libxkbcommon0 \
    libsm6 \
    libxext6 \
    libxcursor1 \
    libxinerama1 \
    libdbus-1-3 \
    libasound2 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 3. Blender Kurulumu (Cache mekanizması için package.json'dan önce)
WORKDIR /opt/blender
RUN wget https://download.blender.org/release/Blender4.0/blender-4.0.2-linux-x64.tar.xz \
    && tar -xvf blender-4.0.2-linux-x64.tar.xz --strip-components=1 \
    && rm blender-4.0.2-linux-x64.tar.xz

# Blender'ı PATH'e ekle
ENV PATH="/opt/blender:$PATH"

# Uygulama dizinine dön
WORKDIR /app

# 4. Bağımlılıkları yükle
COPY package*.json ./
RUN npm install

# 5. Kaynak kodları kopyala
COPY . .

# 6. Prisma Generate (openssl gerektirir)
RUN npx prisma generate

# Port
EXPOSE 3000

# Başlat
CMD ["npm", "run", "start:dev"]