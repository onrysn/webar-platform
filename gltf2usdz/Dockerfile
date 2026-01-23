FROM marlon360/usd-from-gltf:latest

ENV NODE_ENV production
ENV APP_DIR /usr/app/gltf2usdz

WORKDIR ${APP_DIR}

# Debian Buster EOL sorunu için archive.debian.org kullan
RUN echo "deb http://archive.debian.org/debian buster main contrib non-free" > /etc/apt/sources.list && \
    echo "deb http://archive.debian.org/debian-security buster/updates main contrib non-free" >> /etc/apt/sources.list

# Apt update ve kurulum
RUN apt-get -o Acquire::Check-Valid-Until=false update || true
RUN apt-get install -y --allow-unauthenticated curl unzip

# Bun kurulumu
RUN curl -fsSL https://bun.sh/install | bash -s "bun-v1.0.32"
ENV BUN_INSTALL="$HOME/.bun"
ENV PATH=$BUN_INSTALL/bin:$PATH

# Proje dosyalarını kopyala
COPY . .

# Backend/Frontend portu 3000 olacak şekilde EXPOSE
EXPOSE 3001

# Server dizinine geç ve bağımlılıkları yükle
WORKDIR ${APP_DIR}/server
RUN bun install

# Container başlatma komutu
ENTRYPOINT ["bun", "run", "start"]
