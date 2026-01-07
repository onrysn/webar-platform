import { PrismaClient, Role } from '@prisma/client'; // Role Enum'ını import etmeyi unutma
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding started...");

  // ------------------------------
  // 1. ADIM: Şirketleri Oluştur (Önce bunlar lazım ki ID'lerini alalım)
  // ------------------------------
  console.log("🏢 Şirketler hazırlanıyor...");

  const companyA = await prisma.company.upsert({
    where: { apiKey: "COMPANY_A_KEY" },
    update: {},
    create: {
      name: "Company A (Teknoloji A.Ş.)",
      domain: "companya.com",
      apiKey: "COMPANY_A_KEY",
    },
  });

  const companyB = await prisma.company.upsert({
    where: { apiKey: "COMPANY_B_KEY" },
    update: {},
    create: {
      name: "Company B (Mimarlık Ofisi)",
      domain: "companyb.com",
      apiKey: "COMPANY_B_KEY",
    },
  });

  console.log("✓ Şirketler hazır.");

  // ------------------------------
  // 2. ADIM: Kullanıcıları Oluştur
  // ------------------------------
  console.log("👤 Kullanıcılar hazırlanıyor...");

  // Ortak şifre
  const commonPassword = await argon2.hash("Test123!");
  const adminPassword = await argon2.hash("217070");

  // --- A) SUPER ADMIN (Sen) ---
  // Super Admin'in şirketi olmaz (companyId: null)
  const superAdmin = await prisma.user.upsert({
    where: { email: "onur@gmail.com" },
    update: {
      role: Role.SUPER_ADMIN,
      companyId: null, // Super admin bağımsızdır
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

  // --- B) COMPANY ADMIN (Company A Yöneticisi) ---
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

  // --- C) EDITOR (Company A Çalışanı) ---
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

  // --- D) MEMBER (Company B İzleyicisi) ---
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
    } else {
      // console.log(`  - Doku zaten var: ${tex.name}`);
    }
  }

  console.log("\n🌱 Seed işlemi başarıyla tamamlandı!");
}

main()
  .catch((e) => {
    console.error("❌ Seed hatası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });