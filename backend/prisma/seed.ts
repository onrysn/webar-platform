import { PrismaClient, Role, ShapeCategory } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding started...");

  // ------------------------------
  // 1. ADIM: Şirketleri Oluştur
  // ------------------------------
  console.log("🏢 Şirketler hazırlanıyor...");

  // Create or reuse Company A by domain (not unique in schema, so findFirst + create)
  let companyA = await prisma.company.findFirst({ where: { domain: "companya.com" } });
  if (!companyA) {
    companyA = await prisma.company.create({
      data: {
        name: "Company A (Teknoloji A.Ş.)",
        domain: "companya.com",
      },
    });
  }

  // Ensure a default API key exists for Company A
  await prisma.apiKey.upsert({
    where: { key: "COMPANY_A_KEY" },
    update: {
      name: "Company A Default API Key",
      companyId: companyA.id,
      isActive: true,
    },
    create: {
      key: "COMPANY_A_KEY",
      name: "Company A Default API Key",
      companyId: companyA.id,
    },
  });

  // Create or reuse Company B by domain
  let companyB = await prisma.company.findFirst({ where: { domain: "companyb.com" } });
  if (!companyB) {
    companyB = await prisma.company.create({
      data: {
        name: "Company B (Mimarlık Ofisi)",
        domain: "companyb.com",
      },
    });
  }

  // Ensure a default API key exists for Company B
  await prisma.apiKey.upsert({
    where: { key: "COMPANY_B_KEY" },
    update: {
      name: "Company B Default API Key",
      companyId: companyB.id,
      isActive: true,
    },
    create: {
      key: "COMPANY_B_KEY",
      name: "Company B Default API Key",
      companyId: companyB.id,
    },
  });

  console.log("✓ Şirketler hazır.");

  // ------------------------------
  // 2. ADIM: Kullanıcıları Oluştur
  // ------------------------------
  console.log("👤 Kullanıcılar hazırlanıyor...");

  const commonPassword = await argon2.hash("Test123!");
  const adminPassword = await argon2.hash("217070");

  const superAdmin = await prisma.user.upsert({
    where: { email: "onur@gmail.com" },
    update: {
      role: Role.SUPER_ADMIN,
      companyId: null,
    },
    create: {
      name: "Onur (Super Admin)",
      email: "onur@gmail.com",
      passwordHash: adminPassword,
      role: Role.SUPER_ADMIN,
      companyId: null,
    },
  });
  console.log(`✓ Super Admin: ${superAdmin.email}`);

  const companyAdminA = await prisma.user.upsert({
    where: { email: "admin@companya.com" },
    update: {
      role: Role.COMPANY_ADMIN,
      companyId: companyA.id,
    },
    create: {
      name: "Ahmet Yönetici",
      email: "admin@companya.com",
      passwordHash: commonPassword,
      role: Role.COMPANY_ADMIN,
      companyId: companyA.id,
    },
  });
  console.log(`✓ Company Admin (A): ${companyAdminA.email}`);

  const editorA = await prisma.user.upsert({
    where: { email: "editor@companya.com" },
    update: {
      role: Role.EDITOR,
      companyId: companyA.id,
    },
    create: {
      name: "Ayşe Editör",
      email: "editor@companya.com",
      passwordHash: commonPassword,
      role: Role.EDITOR,
      companyId: companyA.id,
    },
  });
  console.log(`✓ Editor (A): ${editorA.email}`);

  const memberB = await prisma.user.upsert({
    where: { email: "member@companyb.com" },
    update: {
      role: Role.MEMBER,
      companyId: companyB.id,
    },
    create: {
      name: "Mehmet İzleyici",
      email: "member@companyb.com",
      passwordHash: commonPassword,
      role: Role.MEMBER,
      companyId: companyB.id,
    },
  });
  console.log(`✓ Member (B): ${memberB.email}`);

  // ------------------------------
  // 3. ADIM: Zemin Dokuları
  // ------------------------------
  console.log('🎨 Zemin dokuları yükleniyor...');

  const textures = [
    { name: 'Ahşap Parke', url: '/textures/wood.jpg' },
    { name: 'Seramik', url: '/textures/tiles.jpg' },
    { name: 'Çim', url: '/textures/grass.jpg' },
    { name: 'Kauçuk Zemin', url: '/textures/rubber.jpg' },
    { name: 'Mermer', url: '/textures/marble.jpg' },
  ];

  for (const tex of textures) {
    const exists = await prisma.floorTexture.findFirst({ where: { name: tex.name } });
    
    if (!exists) {
      await prisma.floorTexture.create({
        data: {
          name: tex.name,
          textureUrl: tex.url,
          thumbnailUrl: tex.url,
          isActive: true,
        },
      });
      console.log(`  + Doku eklendi: ${tex.name}`);
    }
  }

  // ------------------------------
  // 4. ADIM: Shape Kütüphanesi
  // ------------------------------
  console.log('🔷 Shape kütüphanesi yükleniyor...');

  const shapes = [
    // BASIC - Temel Şekiller
    { code: 'rect', labelTR: 'Kare/Dikdörtgen', labelEN: 'Rectangle', icon: '⬛', path: 'M -0.5 -0.5 L 0.5 -0.5 L 0.5 0.5 L -0.5 0.5 Z', category: ShapeCategory.BASIC, sortOrder: 1, tags: ['temel', 'geometrik'] },
    { code: 'circle', labelTR: 'Daire', labelEN: 'Circle', icon: '⚪', path: 'M 0 0 m -0.5 0 a 0.5 0.5 0 1 0 1 0 a 0.5 0.5 0 1 0 -1 0', category: ShapeCategory.BASIC, sortOrder: 2, tags: ['temel', 'geometrik'] },
    { code: 'triangle', labelTR: 'Üçgen', labelEN: 'Triangle', icon: '🔺', path: 'M 0 -0.5 L 0.5 0.5 L -0.5 0.5 Z', category: ShapeCategory.BASIC, sortOrder: 3, tags: ['temel', 'geometrik'] },
    { code: 'right-triangle', labelTR: 'Dik Üçgen', labelEN: 'Right Triangle', icon: '📐', path: 'M -0.5 -0.5 L 0.5 0.5 L -0.5 0.5 Z', category: ShapeCategory.BASIC, sortOrder: 4, tags: ['temel', 'geometrik'] },
    { code: 'diamond', labelTR: 'Eşkenar Dörtgen', labelEN: 'Diamond', icon: '🔶', path: 'M 0 -0.5 L 0.5 0 L 0 0.5 L -0.5 0 Z', category: ShapeCategory.BASIC, sortOrder: 5, tags: ['temel', 'geometrik'] },

    // GEOMETRIC - Geometrik Şekiller
    { code: 'trapezoid', labelTR: 'Yamuk', labelEN: 'Trapezoid', icon: '⏢', path: 'M -0.3 -0.5 L 0.3 -0.5 L 0.5 0.5 L -0.5 0.5 Z', category: ShapeCategory.GEOMETRIC, sortOrder: 10, tags: ['geometrik'] },
    { code: 'parallelogram', labelTR: 'Paralelkenar', labelEN: 'Parallelogram', icon: '▰', path: 'M -0.5 -0.5 L 0.3 -0.5 L 0.5 0.5 L -0.3 0.5 Z', category: ShapeCategory.GEOMETRIC, sortOrder: 11, tags: ['geometrik'] },
    { code: 'pentagon', labelTR: 'Beşgen', labelEN: 'Pentagon', icon: '⬠', path: 'M 0 -0.5 L 0.48 -0.15 L 0.29 0.45 L -0.29 0.45 L -0.48 -0.15 Z', category: ShapeCategory.GEOMETRIC, sortOrder: 12, tags: ['geometrik'] },
    { code: 'hexagon', labelTR: 'Altıgen', labelEN: 'Hexagon', icon: '🛑', path: 'M -0.25 -0.43 L 0.25 -0.43 L 0.5 0 L 0.25 0.43 L -0.25 0.43 L -0.5 0 Z', category: ShapeCategory.GEOMETRIC, sortOrder: 13, tags: ['geometrik'] },
    { code: 'octagon', labelTR: 'Sekizgen', labelEN: 'Octagon', icon: '✴️', path: 'M -0.2 -0.5 L 0.2 -0.5 L 0.5 -0.2 L 0.5 0.2 L 0.2 0.5 L -0.2 0.5 L -0.5 0.2 L -0.5 -0.2 Z', category: ShapeCategory.GEOMETRIC, sortOrder: 14, tags: ['geometrik'] },
    { code: 'star-5', labelTR: 'Yıldız (5)', labelEN: '5-Point Star', icon: '⭐', path: 'M 0 -0.5 L 0.11 -0.15 L 0.47 -0.15 L 0.18 0.06 L 0.29 0.4 L 0 0.19 L -0.29 0.4 L -0.18 0.06 L -0.47 -0.15 L -0.11 -0.15 Z', category: ShapeCategory.GEOMETRIC, sortOrder: 15, tags: ['geometrik', 'dekoratif'] },
    { code: 'star-4', labelTR: 'Yıldız (4)', labelEN: '4-Point Star', icon: '✨', path: 'M 0 -0.5 Q 0.1 -0.1 0.5 0 Q 0.1 0.1 0 0.5 Q -0.1 0.1 -0.5 0 Q -0.1 -0.1 0 -0.5 Z', category: ShapeCategory.GEOMETRIC, sortOrder: 16, tags: ['geometrik', 'dekoratif'] },
    { code: 'donut', labelTR: 'Halka', labelEN: 'Ring', icon: '⭕', path: 'M 0 0 m -0.5 0 a 0.5 0.5 0 1 0 1 0 a 0.5 0.5 0 1 0 -1 0 M 0 0 m -0.3 0 a 0.3 0.3 0 1 1 0.6 0 a 0.3 0.3 0 1 1 -0.6 0', category: ShapeCategory.GEOMETRIC, sortOrder: 17, tags: ['geometrik'] },

    // ARCHITECTURAL - Mimari Şekiller
    { code: 'l-shape', labelTR: 'L Köşe', labelEN: 'L-Shape', icon: 'L', path: 'M -0.5 -0.5 L 0.5 -0.5 L 0.5 -0.1 L -0.1 -0.1 L -0.1 0.5 L -0.5 0.5 Z', category: ShapeCategory.ARCHITECTURAL, sortOrder: 20, tags: ['mimari', 'profil'] },
    { code: 't-shape', labelTR: 'T Profil', labelEN: 'T-Shape', icon: 'T', path: 'M -0.5 -0.5 L 0.5 -0.5 L 0.5 -0.15 L 0.15 -0.15 L 0.15 0.5 L -0.15 0.5 L -0.15 -0.15 L -0.5 -0.15 Z', category: ShapeCategory.ARCHITECTURAL, sortOrder: 21, tags: ['mimari', 'profil'] },
    { code: 'u-shape', labelTR: 'U Profil', labelEN: 'U-Shape', icon: '∪', path: 'M -0.5 -0.5 L -0.15 -0.5 L -0.15 0.15 L 0.15 0.15 L 0.15 -0.5 L 0.5 -0.5 L 0.5 0.5 L -0.5 0.5 Z', category: ShapeCategory.ARCHITECTURAL, sortOrder: 22, tags: ['mimari', 'profil'] },
    { code: 'stairs', labelTR: 'Merdiven', labelEN: 'Stairs', icon: '📶', path: 'M -0.5 0.5 L -0.5 -0.5 L -0.2 -0.5 L -0.2 -0.2 L 0.1 -0.2 L 0.1 0.1 L 0.4 0.1 L 0.4 0.5 Z', category: ShapeCategory.ARCHITECTURAL, sortOrder: 23, tags: ['mimari'] },
    { code: 'door', labelTR: 'Kapı Yayı', labelEN: 'Door Arc', icon: '🚪', path: 'M -0.5 0.5 L -0.5 -0.5 L -0.4 -0.5 L -0.4 0.5 Z M -0.4 -0.5 A 1 1 0 0 1 0.6 0.5 L 0.5 0.5 A 0.9 0.9 0 0 0 -0.4 -0.4 Z', category: ShapeCategory.ARCHITECTURAL, sortOrder: 24, tags: ['mimari'] },
    { code: 'arc-wall', labelTR: 'Yay Duvar', labelEN: 'Arc Wall', icon: '🌈', path: 'M -0.5 0.5 L -0.5 0.2 A 0.5 0.5 0 0 1 0.5 0.2 L 0.5 0.5 L 0.2 0.5 A 0.2 0.2 0 0 0 -0.2 0.5 Z', category: ShapeCategory.ARCHITECTURAL, sortOrder: 25, tags: ['mimari'] },
    { code: 'pillar', labelTR: 'Kolon', labelEN: 'Pillar', icon: '🏛️', path: 'M -0.3 -0.5 L 0.3 -0.5 L 0.3 -0.4 L 0.2 -0.4 L 0.2 0.4 L 0.3 0.4 L 0.3 0.5 L -0.3 0.5 L -0.3 0.4 L -0.2 0.4 L -0.2 -0.4 L -0.3 -0.4 Z', category: ShapeCategory.ARCHITECTURAL, sortOrder: 26, tags: ['mimari'] },

    // ARROWS - Oklar
    { code: 'arrow-up', labelTR: 'İleri Ok', labelEN: 'Arrow Up', icon: '⬆️', path: 'M -0.15 0.5 L -0.15 -0.1 L -0.4 -0.1 L 0 -0.5 L 0.4 -0.1 L 0.15 -0.1 L 0.15 0.5 Z', category: ShapeCategory.ARROWS, sortOrder: 30, tags: ['ok', 'yön'] },
    { code: 'arrow-down', labelTR: 'Geri Ok', labelEN: 'Arrow Down', icon: '⬇️', path: 'M -0.15 -0.5 L -0.15 0.1 L -0.4 0.1 L 0 0.5 L 0.4 0.1 L 0.15 0.1 L 0.15 -0.5 Z', category: ShapeCategory.ARROWS, sortOrder: 31, tags: ['ok', 'yön'] },
    { code: 'arrow-left', labelTR: 'Sola Ok', labelEN: 'Arrow Left', icon: '⬅️', path: 'M 0.5 -0.15 L -0.1 -0.15 L -0.1 -0.4 L -0.5 0 L -0.1 0.4 L -0.1 0.15 L 0.5 0.15 Z', category: ShapeCategory.ARROWS, sortOrder: 32, tags: ['ok', 'yön'] },
    { code: 'arrow-right', labelTR: 'Sağa Ok', labelEN: 'Arrow Right', icon: '➡️', path: 'M -0.5 -0.15 L 0.1 -0.15 L 0.1 -0.4 L 0.5 0 L 0.1 0.4 L 0.1 0.15 L -0.5 0.15 Z', category: ShapeCategory.ARROWS, sortOrder: 33, tags: ['ok', 'yön'] },
    { code: 'arrow-double-v', labelTR: 'Dikey Çift Ok', labelEN: 'Double Vertical', icon: '↕️', path: 'M -0.15 -0.2 L -0.4 -0.2 L 0 -0.5 L 0.4 -0.2 L 0.15 -0.2 L 0.15 0.2 L 0.4 0.2 L 0 0.5 L -0.4 0.2 L -0.15 0.2 Z', category: ShapeCategory.ARROWS, sortOrder: 34, tags: ['ok', 'yön'] },
    { code: 'arrow-double-h', labelTR: 'Yatay Çift Ok', labelEN: 'Double Horizontal', icon: '↔️', path: 'M -0.2 -0.15 L -0.2 -0.4 L -0.5 0 L -0.2 0.4 L -0.2 0.15 L 0.2 0.15 L 0.2 0.4 L 0.5 0 L 0.2 -0.4 L 0.2 -0.15 Z', category: ShapeCategory.ARROWS, sortOrder: 35, tags: ['ok', 'yön'] },
    { code: 'chevron-up', labelTR: 'Yön (Chevron)', labelEN: 'Chevron', icon: '⏫', path: 'M -0.5 -0.1 L 0 -0.5 L 0.5 -0.1 L 0.5 0.2 L 0 -0.2 L -0.5 0.2 Z M -0.5 0.2 L 0 -0.2 L 0.5 0.2 L 0.5 0.5 L 0 0.1 L -0.5 0.5 Z', category: ShapeCategory.ARROWS, sortOrder: 36, tags: ['ok', 'yön'] },
    { code: 'u-turn-left', labelTR: 'U Dönüşü', labelEN: 'U-Turn', icon: '↩️', path: 'M 0.2 0.5 L 0.2 -0.1 A 0.2 0.2 0 0 0 -0.2 -0.1 L -0.2 0.1 L 0 0.1 L -0.35 0.5 L -0.7 0.1 L -0.5 0.1 L -0.5 -0.1 A 0.5 0.5 0 0 1 0.5 -0.1 L 0.5 0.5 Z', category: ShapeCategory.ARROWS, sortOrder: 37, tags: ['ok', 'dönüş'] },
    { code: 'curve-arrow', labelTR: 'Dönüş Oku', labelEN: 'Curve Arrow', icon: '⤴️', path: 'M -0.4 0.4 L -0.4 0 A 0.4 0.4 0 0 1 0 -0.4 L 0.1 -0.4 L 0.1 -0.55 L 0.5 -0.25 L 0.1 0.05 L 0.1 -0.1 L 0 -0.1 A 0.1 0.1 0 0 0 -0.1 0 L -0.1 0.4 Z', category: ShapeCategory.ARROWS, sortOrder: 38, tags: ['ok', 'dönüş'] },

    // SYMBOLS - Semboller
    { code: 'plus', labelTR: 'Artı', labelEN: 'Plus', icon: '➕', path: 'M -0.15 -0.5 L 0.15 -0.5 L 0.15 -0.15 L 0.5 -0.15 L 0.5 0.15 L 0.15 0.15 L 0.15 0.5 L -0.15 0.5 L -0.15 0.15 L -0.5 0.15 L -0.5 -0.15 L -0.15 -0.15 Z', category: ShapeCategory.SYMBOLS, sortOrder: 40, tags: ['sembol', 'işaret'] },
    { code: 'cross', labelTR: 'Çarpı', labelEN: 'Cross', icon: '❌', path: 'M -0.4 -0.3 L -0.3 -0.4 L 0 -0.1 L 0.3 -0.4 L 0.4 -0.3 L 0.1 0 L 0.4 0.3 L 0.3 0.4 L 0 0.1 L -0.3 0.4 L -0.4 0.3 L -0.1 0 Z', category: ShapeCategory.SYMBOLS, sortOrder: 41, tags: ['sembol', 'işaret'] },
    { code: 'check', labelTR: 'Onay', labelEN: 'Check', icon: '✅', path: 'M -0.4 0 L -0.15 0.25 L 0.4 -0.3 L 0.3 -0.4 L -0.15 0.05 L -0.3 -0.1 Z', category: ShapeCategory.SYMBOLS, sortOrder: 42, tags: ['sembol', 'onay'] },
    { code: 'info', labelTR: 'Bilgi', labelEN: 'Info', icon: 'ℹ️', path: 'M -0.1 -0.1 L 0.1 -0.1 L 0.1 0.4 L -0.1 0.4 Z M 0 -0.4 A 0.1 0.1 0 1 1 0 -0.2 A 0.1 0.1 0 1 1 0 -0.4 Z', category: ShapeCategory.SYMBOLS, sortOrder: 43, tags: ['sembol', 'bilgi'] },
    { code: 'warning', labelTR: 'Uyarı', labelEN: 'Warning', icon: '⚠️', path: 'M 0 -0.5 L 0.45 0.35 L -0.45 0.35 Z M -0.05 -0.1 L 0.05 -0.1 L 0.05 0.15 L -0.05 0.15 Z M -0.05 0.2 L 0.05 0.2 L 0.05 0.3 L -0.05 0.3 Z', category: ShapeCategory.SYMBOLS, sortOrder: 44, tags: ['sembol', 'uyarı'] },
    { code: 'question', labelTR: 'Soru', labelEN: 'Question', icon: '❓', path: 'M -0.1 0.2 L 0.1 0.2 L 0.1 0.4 L -0.1 0.4 Z M -0.2 -0.1 L -0.1 -0.1 C -0.1 0.1 0.1 0.1 0.1 -0.1 C 0.1 -0.3 -0.2 -0.3 -0.2 -0.5 C -0.2 -0.8 0.4 -0.8 0.4 -0.5 L 0.2 -0.5 C 0.2 -0.6 -0.0 -0.6 -0.0 -0.5 C -0.0 -0.4 0.2 -0.3 0.2 -0.1 C 0.2 0.3 -0.2 0.1 -0.2 0.1 Z', category: ShapeCategory.SYMBOLS, sortOrder: 45, tags: ['sembol', 'soru'] },

    // CONTROLS - Kontroller
    { code: 'pause', labelTR: 'Duraklat', labelEN: 'Pause', icon: '⏸️', path: 'M -0.3 -0.4 L -0.1 -0.4 L -0.1 0.4 L -0.3 0.4 Z M 0.1 -0.4 L 0.3 -0.4 L 0.3 0.4 L 0.1 0.4 Z', category: ShapeCategory.CONTROLS, sortOrder: 50, tags: ['kontrol', 'medya'] },
    { code: 'play', labelTR: 'Oynat', labelEN: 'Play', icon: '▶️', path: 'M -0.2 -0.4 L 0.4 0 L -0.2 0.4 Z', category: ShapeCategory.CONTROLS, sortOrder: 51, tags: ['kontrol', 'medya'] },
    { code: 'stop', labelTR: 'Dur', labelEN: 'Stop', icon: '⏹️', path: 'M -0.4 -0.4 L 0.4 -0.4 L 0.4 0.4 L -0.4 0.4 Z', category: ShapeCategory.CONTROLS, sortOrder: 52, tags: ['kontrol', 'medya'] },
    { code: 'menu', labelTR: 'Menü', labelEN: 'Menu', icon: '☰', path: 'M -0.4 -0.4 L 0.4 -0.4 L 0.4 -0.2 L -0.4 -0.2 Z M -0.4 -0.1 L 0.4 -0.1 L 0.4 0.1 L -0.4 0.1 Z M -0.4 0.2 L 0.4 0.2 L 0.4 0.4 L -0.4 0.4 Z', category: ShapeCategory.CONTROLS, sortOrder: 53, tags: ['kontrol', 'navigasyon'] },

    // ICONS - İkonlar
    { code: 'pin', labelTR: 'Konum/Pin', labelEN: 'Location Pin', icon: '📍', path: 'M 0 -0.5 A 0.3 0.3 0 1 1 0 0.1 L 0 0.5 L 0 0.1 A 0.3 0.3 0 1 1 0 -0.5 Z M 0 -0.35 A 0.1 0.1 0 1 0 0 -0.15 A 0.1 0.1 0 1 0 0 -0.35 Z', category: ShapeCategory.ICONS, sortOrder: 60, tags: ['ikon', 'konum'] },
    { code: 'home', labelTR: 'Ev', labelEN: 'Home', icon: '🏠', path: 'M 0 -0.5 L 0.5 -0.1 L 0.4 -0.1 L 0.4 0.5 L 0.1 0.5 L 0.1 0.1 L -0.1 0.1 L -0.1 0.5 L -0.4 0.5 L -0.4 -0.1 L -0.5 -0.1 Z', category: ShapeCategory.ICONS, sortOrder: 61, tags: ['ikon'] },
    { code: 'flag', labelTR: 'Bayrak', labelEN: 'Flag', icon: '🚩', path: 'M -0.4 -0.5 L -0.4 0.5 L -0.3 0.5 L -0.3 0 L 0.4 -0.25 L -0.3 -0.5 Z', category: ShapeCategory.ICONS, sortOrder: 62, tags: ['ikon'] },
    { code: 'map', labelTR: 'Harita', labelEN: 'Map', icon: '🗺️', path: 'M -0.5 -0.4 L -0.2 -0.5 L 0.2 -0.4 L 0.5 -0.5 L 0.5 0.4 L 0.2 0.5 L -0.2 0.4 L -0.5 0.5 Z M -0.2 -0.5 L -0.2 0.4 M 0.2 -0.4 L 0.2 0.5', category: ShapeCategory.ICONS, sortOrder: 63, tags: ['ikon', 'navigasyon'] },
    { code: 'user', labelTR: 'Kullanıcı', labelEN: 'User', icon: '👤', path: 'M 0 -0.4 A 0.2 0.2 0 1 1 0 0 A 0.2 0.2 0 1 1 0 -0.4 Z M -0.4 0.5 A 0.4 0.4 0 0 1 0.4 0.5 L -0.4 0.5 Z', category: ShapeCategory.ICONS, sortOrder: 64, tags: ['ikon', 'kullanıcı'] },
    { code: 'heart', labelTR: 'Kalp', labelEN: 'Heart', icon: '❤️', path: 'M 0 0.2 C 0.1 -0.1 0.5 -0.4 0.5 -0.15 C 0.5 0.1 0.1 0.3 0 0.5 C -0.1 0.3 -0.5 0.1 -0.5 -0.15 C -0.5 -0.4 -0.1 -0.1 0 0.2 Z', category: ShapeCategory.ICONS, sortOrder: 65, tags: ['ikon', 'dekoratif'] },

    // NATURE - Doğa
    { code: 'lightning', labelTR: 'Şimşek', labelEN: 'Lightning', icon: '⚡', path: 'M 0.1 -0.5 L -0.3 0 L 0 0 L -0.1 0.5 L 0.3 0 L 0 0 Z', category: ShapeCategory.NATURE, sortOrder: 70, tags: ['doğa'] },
    { code: 'cloud', labelTR: 'Bulut', labelEN: 'Cloud', icon: '☁️', path: 'M -0.2 0.2 L 0.2 0.2 A 0.15 0.15 0 0 0 0.2 -0.1 A 0.2 0.2 0 0 0 -0.2 -0.1 A 0.15 0.15 0 0 0 -0.2 0.2 Z', category: ShapeCategory.NATURE, sortOrder: 71, tags: ['doğa', 'hava'] },
    { code: 'moon', labelTR: 'Hilal', labelEN: 'Moon', icon: '🌙', path: 'M 0.1 -0.4 A 0.4 0.4 0 1 1 0.1 0.4 A 0.3 0.3 0 1 0 0.1 -0.4 Z', category: ShapeCategory.NATURE, sortOrder: 72, tags: ['doğa', 'gece'] },
    { code: 'sun', labelTR: 'Güneş', labelEN: 'Sun', icon: '☀️', path: 'M 0 0 m -0.2 0 a 0.2 0.2 0 1 0 0.4 0 a 0.2 0.2 0 1 0 -0.4 0 M 0 -0.3 L 0 -0.45 M 0.21 -0.21 L 0.32 -0.32 M 0.3 0 L 0.45 0 M 0.21 0.21 L 0.32 0.32 M 0 0.3 L 0 0.45 M -0.21 0.21 L -0.32 0.32 M -0.3 0 L -0.45 0 M -0.21 -0.21 L -0.32 -0.32', category: ShapeCategory.NATURE, sortOrder: 73, tags: ['doğa', 'gündüz'] },
    { code: 'drop', labelTR: 'Su Damlası', labelEN: 'Water Drop', icon: '💧', path: 'M 0 -0.5 Q 0.4 0 0.4 0.25 A 0.4 0.4 0 1 1 -0.4 0.25 Q -0.4 0 0 -0.5 Z', category: ShapeCategory.NATURE, sortOrder: 74, tags: ['doğa', 'su'] },
    { code: 'fire', labelTR: 'Ateş', labelEN: 'Fire', icon: '🔥', path: 'M 0 -0.5 Q 0.4 0 0.3 0.3 A 0.3 0.3 0 1 1 -0.3 0.3 Q -0.4 0 0 -0.5 Z M 0 0 Q 0.1 0.2 0 0.4 Q -0.1 0.2 0 0 Z', category: ShapeCategory.NATURE, sortOrder: 75, tags: ['doğa', 'ateş'] },
    { code: 'leaf', labelTR: 'Yaprak', labelEN: 'Leaf', icon: '🍃', path: 'M -0.4 0.4 Q -0.4 -0.4 0.4 -0.4 Q 0.4 0.4 -0.4 0.4 Z M -0.4 0.4 L 0.2 -0.2', category: ShapeCategory.NATURE, sortOrder: 76, tags: ['doğa', 'bitki'] },

    // OBJECTS - Nesneler
    { code: 'box', labelTR: 'Kutu', labelEN: 'Box', icon: '📦', path: 'M -0.4 -0.3 L 0.4 -0.3 L 0.4 0.4 L -0.4 0.4 Z M -0.4 -0.3 L -0.5 -0.5 L 0.5 -0.5 L 0.4 -0.3 M 0 -0.3 L 0 0.4', category: ShapeCategory.OBJECTS, sortOrder: 80, tags: ['nesne'] },
    { code: 'lock', labelTR: 'Kilit', labelEN: 'Lock', icon: '🔒', path: 'M -0.3 0 L 0.3 0 L 0.3 0.5 L -0.3 0.5 Z M -0.2 0 L -0.2 -0.2 A 0.2 0.2 0 1 1 0.2 -0.2 L 0.2 0 Z', category: ShapeCategory.OBJECTS, sortOrder: 81, tags: ['nesne', 'güvenlik'] },
    { code: 'key', labelTR: 'Anahtar', labelEN: 'Key', icon: '🔑', path: 'M -0.3 -0.3 A 0.2 0.2 0 1 1 -0.1 -0.1 L 0.4 0.4 L 0.4 0.5 L 0.3 0.5 L 0.3 0.4 L 0.2 0.4 L 0.2 0.3 L -0.1 -0.1 Z M -0.25 -0.25 A 0.05 0.05 0 1 0 -0.2 -0.2 Z', category: ShapeCategory.OBJECTS, sortOrder: 82, tags: ['nesne', 'güvenlik'] },
    { code: 'tool', labelTR: 'Tamir/Ayarlar', labelEN: 'Tool', icon: '🔧', path: 'M -0.4 -0.2 L -0.2 -0.4 L 0.4 0.2 L 0.2 0.4 Z M -0.5 -0.5 L -0.3 -0.5 L -0.3 -0.3 L -0.5 -0.3 Z', category: ShapeCategory.OBJECTS, sortOrder: 83, tags: ['nesne', 'araç'] },
    { code: 'camera', labelTR: 'Kamera', labelEN: 'Camera', icon: '📷', path: 'M -0.4 -0.2 L -0.1 -0.2 L 0 -0.3 L 0.3 -0.3 L 0.4 -0.2 L 0.4 0.3 L -0.4 0.3 Z M 0 0.05 A 0.15 0.15 0 1 0 0 0.06 Z', category: ShapeCategory.OBJECTS, sortOrder: 84, tags: ['nesne', 'elektronik'] },
    { code: 'mail', labelTR: 'Mektup', labelEN: 'Mail', icon: '✉️', path: 'M -0.5 -0.3 L 0.5 -0.3 L 0.5 0.3 L -0.5 0.3 Z M -0.5 -0.3 L 0 0.1 L 0.5 -0.3', category: ShapeCategory.OBJECTS, sortOrder: 85, tags: ['nesne', 'iletişim'] },
    { code: 'bubble', labelTR: 'Balon', labelEN: 'Speech Bubble', icon: '💬', path: 'M -0.5 -0.3 L 0.5 -0.3 L 0.5 0.2 L 0.1 0.2 L -0.2 0.5 L -0.2 0.2 L -0.5 0.2 Z', category: ShapeCategory.OBJECTS, sortOrder: 86, tags: ['nesne', 'iletişim'] },
  ];

  for (const shape of shapes) {
    await prisma.shape.upsert({
      where: { code: shape.code },
      update: {
        labelTR: shape.labelTR,
        labelEN: shape.labelEN,
        icon: shape.icon,
        svgPath: shape.path,
        category: shape.category,
        tags: shape.tags,
        sortOrder: shape.sortOrder,
      },
      create: {
        code: shape.code,
        labelTR: shape.labelTR,
        labelEN: shape.labelEN,
        icon: shape.icon,
        svgPath: shape.path,
        category: shape.category,
        tags: shape.tags,
        sortOrder: shape.sortOrder,
        isActive: true,
      },
    });
  }

  console.log(`✓ ${shapes.length} adet shape yüklendi.`);

  console.log("\n🌱 Seed işlemi başarıyla tamamlandı!");
  console.log("📊 Özet:");
  console.log(`  - ${await prisma.user.count()} kullanıcı`);
  console.log(`  - ${await prisma.company.count()} şirket`);
  console.log(`  - ${await prisma.floorTexture.count()} zemin dokusu`);
  console.log(`  - ${await prisma.shape.count()} shape`);
}

main()
  .catch((e) => {
    console.error("❌ Seed hatası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });