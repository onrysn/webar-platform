# 1. Base Image
FROM node:20-bookworm-slim AS base

# Çalışma dizini
WORKDIR /app

# 2. Sistem bağımlılıklarını yükle
# Not: Debian 12 (Bookworm) kullandığın için freecad paketini doğrudan apt'den alabiliriz.
RUN apt-get update && apt-get install -y \
    # Node ve Prisma için gerekli araçlar
    python3 \
    python3-pip \
    build-essential \
    openssl \
    # Blender indirmek için
    wget \
    xz-utils \
    # [YENİ] FreeCAD Kurulumu (STEP dosyalarını okumak için)
    freecad \
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

# [YENİ] Python Kütüphanelerini Yükle
# Scriptin çalışması için trimesh ve numpy gerekiyor.
# Debian 12'de pip kullanırken '--break-system-packages' flag'i gerekebilir (Docker içinde güvenlidir).
RUN pip3 install trimesh numpy scipy --break-system-packages

# 3. Blender Kurulumu (Cache mekanizması için package.json'dan önce)
WORKDIR /opt/blender
RUN wget https://download.blender.org/release/Blender4.0/blender-4.0.2-linux-x64.tar.xz \
    && tar -xvf blender-4.0.2-linux-x64.tar.xz --strip-components=1 \
    && rm blender-4.0.2-linux-x64.tar.xz

# Blender'ı PATH'e ekle
ENV PATH="/opt/blender:$PATH"

RUN npm install -g @gltf-transform/cli

# Kurulum doğrulama
RUN echo "🔍 Kurulum kontrolü..." && \
    blender --version && \
    python3 --version && \
    gltf-transform --version && \
    echo "✅ Tüm araçlar hazır!"

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

# ==========================================
# 2. DEVELOPMENT STAGE (Local Geliştirme)
# ==========================================
FROM base AS dev
# Localde kod değişikliklerini anlık görmek için 'start:dev' çalıştırılır.
# Not: docker-compose.dev.yml'de volume bind edileceği için kodlar oradan gelir.
CMD ["npm", "run", "start:dev"]

# ==========================================
# 3. PRODUCTION STAGE (Canlı Sunucu)
# ==========================================
FROM base AS prod
# Production ortamı için Typescript kodunu Javascript'e derle
RUN npm run build

# Ortam değişkenini production olarak ayarla
ENV NODE_ENV=production

# Uygulamayı derlenmiş (dist) klasöründen başlat
CMD ["npm", "run", "start:prod"]