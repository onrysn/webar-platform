console.log(" Seeding database...");
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding started...");

  // ------------------------------
  // 1) Admin kullanıcı
  // ------------------------------
  const adminPassword = await argon2.hash("217070");

  const admin = await prisma.user.upsert({
    where: { email: "onur@gmail.com" },
    update: {},
    create: {
      name: "System Admin",
      email: "onur@gmail.com",
      passwordHash: adminPassword,
      role: "admin",
    },
  });

  console.log("✓ Admin oluşturuldu:", admin.email);

  // ------------------------------
  // 2) Şirketler
  // ------------------------------
  const companyA = await prisma.company.upsert({
    where: { apiKey: "COMPANY_A_KEY" }, // artık unique alanı kullanıyoruz
    update: {},
    create: {
      name: "Company A",
      domain: "companyA.com",
      apiKey: "COMPANY_A_KEY",
    },
  });

  const companyB = await prisma.company.upsert({
    where: { apiKey: "COMPANY_B_KEY" }, // unique alan
    update: {},
    create: {
      name: "Company B",
      domain: "companyB.com",
      apiKey: "COMPANY_B_KEY",
    },
  });


  console.log("✓ Şirketler oluşturuldu");

  // ------------------------------
  // 3) Normal kullanıcılar
  // ------------------------------
  const user1Password = await argon2.hash("Test123!");
  const user2Password = await argon2.hash("Test123!");

  const user1 = await prisma.user.upsert({
    where: { email: "editor@companyA.com" },
    update: {},
    create: {
      name: "Company A Editor",
      email: "editor@companyA.com",
      passwordHash: user1Password,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "member@companyB.com" },
    update: {},
    create: {
      name: "Company B Member",
      email: "member@companyB.com",
      passwordHash: user2Password,
    },
  });

  console.log("✓ Kullanıcılar oluşturuldu");

  // ------------------------------
  // 4) UserCompany ilişkileri
  // ------------------------------

  // Admin → Her iki şirkette admin
  await prisma.userCompany.upsert({
    where: { userId_companyId: { userId: admin.id, companyId: companyA.id } },
    update: {},
    create: {
      userId: admin.id,
      companyId: companyA.id,
      role: "admin"
    },
  });

  await prisma.userCompany.upsert({
    where: { userId_companyId: { userId: admin.id, companyId: companyB.id } },
    update: {},
    create: {
      userId: admin.id,
      companyId: companyB.id,
      role: "admin"
    },
  });

  // Editor → Company A
  await prisma.userCompany.upsert({
    where: { userId_companyId: { userId: user1.id, companyId: companyA.id } },
    update: {},
    create: {
      userId: user1.id,
      companyId: companyA.id,
      role: "editor"
    },
  });

  // Member → Company B
  await prisma.userCompany.upsert({
    where: { userId_companyId: { userId: user2.id, companyId: companyB.id } },
    update: {},
    create: {
      userId: user2.id,
      companyId: companyB.id,
      role: "member"
    },
  });

  console.log("✓ UserCompany ilişkileri oluşturuldu");

  const textures = [
    { name: 'Ahşap Parke', url: '/textures/wood.jpg' },
    { name: 'Seramik', url: '/textures/tiles.jpg' },
    { name: 'Çim', url: '/textures/grass.jpg' },
    { name: 'Kauçuk Zemin', url: '/textures/rubber.jpg' },
  ];

  console.log('Zemin dokuları yükleniyor...');

  for (const tex of textures) {
    // Aynı isimde varsa tekrar ekleme
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
      console.log(`+ Eklendi: ${tex.name}`);
    } else {
      console.log(`- Zaten var: ${tex.name}`);
    }
  }

  console.log("🌱 Seed başarıyla tamamlandı!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
