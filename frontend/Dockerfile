# frontend/Dockerfile
FROM node:20-alpine as base

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# ==========================================
# 2. DEVELOPMENT STAGE (Local Geliştirme)
# ==========================================
FROM base as dev
# Vite varsayılan portu
EXPOSE 5173
# Host 0.0.0.0 ile dışarıdan erişime aç
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ==========================================
# 3. BUILD STAGE (Derleme Aşaması)
# ==========================================
FROM base as build
# Projeyi production için derle (/dist klasörü oluşturur)
RUN npm run build

# ==========================================
# 4. PRODUCTION STAGE (Canlı Sunucu - Nginx)
# ==========================================
FROM nginx:stable-alpine as prod

# Build aşamasında oluşan dist klasörünü Nginx'in html klasörüne kopyala
COPY --from=build /app/dist /usr/share/nginx/html

# SPA (Single Page App) Router ayarı için Nginx varsayılan config'i gerekirse güncellenebilir.
# Şimdilik standart config yeterli olacaktır.

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]