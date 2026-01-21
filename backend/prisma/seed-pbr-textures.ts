/**
 * PBR Texture'ları veritabanına ekleyen seed scripti
 * Çalıştırmak için: npx ts-node scripts/seed-pbr-textures.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PBR_TEXTURES = [
  {
    name: 'Asfalt',
    type: 'PBR',
    category: 'concrete',
    thumbnailUrl: '/textures/pbr/asphalt/baseColor.jpg',
    baseColorUrl: '/textures/pbr/asphalt/baseColor.jpg',
    normalUrl: '/textures/pbr/asphalt/normal.jpg',
    roughnessUrl: '/textures/pbr/asphalt/roughness.jpg',
    aoUrl: '/textures/pbr/asphalt/ao.jpg',
    defaultScale: 3.0,
    roughnessValue: 0.9,
    metalnessValue: 0.0,
    aoIntensity: 1.2,
    normalScale: 2.0,
    tags: ['outdoor', 'road', 'urban'],
    isActive: true,
    sortOrder: 1,
  },
  {
    name: 'Beton',
    type: 'PBR',
    category: 'concrete',
    thumbnailUrl: '/textures/pbr/concrete/baseColor.jpg',
    baseColorUrl: '/textures/pbr/concrete/baseColor.jpg',
    normalUrl: '/textures/pbr/concrete/normal.jpg',
    roughnessUrl: '/textures/pbr/concrete/roughness.jpg',
    aoUrl: '/textures/pbr/concrete/ao.jpg',
    defaultScale: 2.5,
    roughnessValue: 0.85,
    metalnessValue: 0.0,
    aoIntensity: 1.0,
    normalScale: 1.5,
    tags: ['indoor', 'industrial', 'modern'],
    isActive: true,
    sortOrder: 2,
  },
  {
    name: 'Çim',
    type: 'PBR',
    category: 'fabric',
    thumbnailUrl: '/textures/pbr/grass/baseColor.jpg',
    baseColorUrl: '/textures/pbr/grass/baseColor.jpg',
    normalUrl: '/textures/pbr/grass/normal.jpg',
    roughnessUrl: '/textures/pbr/grass/roughness.jpg',
    aoUrl: '/textures/pbr/grass/ao.jpg',
    defaultScale: 2.0,
    roughnessValue: 0.95,
    metalnessValue: 0.0,
    aoIntensity: 1.5,
    normalScale: 2.5,
    tags: ['outdoor', 'nature', 'garden'],
    isActive: true,
    sortOrder: 3,
  },
  {
    name: 'Toprak Zemin',
    type: 'PBR',
    category: 'stone',
    thumbnailUrl: '/textures/pbr/ground/baseColor.jpg',
    baseColorUrl: '/textures/pbr/ground/baseColor.jpg',
    normalUrl: '/textures/pbr/ground/normal.jpg',
    roughnessUrl: '/textures/pbr/ground/roughness.jpg',
    aoUrl: '/textures/pbr/ground/ao.jpg',
    defaultScale: 2.5,
    roughnessValue: 0.9,
    metalnessValue: 0.0,
    aoIntensity: 1.3,
    normalScale: 2.0,
    tags: ['outdoor', 'nature', 'terrain'],
    isActive: true,
    sortOrder: 4,
  },
  {
    name: 'Mermer',
    type: 'PBR',
    category: 'stone',
    thumbnailUrl: '/textures/pbr/marble/baseColor.jpg',
    baseColorUrl: '/textures/pbr/marble/baseColor.jpg',
    normalUrl: '/textures/pbr/marble/normal.jpg',
    roughnessUrl: '/textures/pbr/marble/roughness.jpg',
    defaultScale: 2.0,
    roughnessValue: 0.3,
    metalnessValue: 0.1,
    aoIntensity: 0.8,
    normalScale: 1.0,
    tags: ['indoor', 'luxury', 'elegant'],
    isActive: true,
    sortOrder: 5,
  },
  {
    name: 'Kauçuk',
    type: 'PBR',
    category: 'fabric',
    thumbnailUrl: '/textures/pbr/rubber/baseColor.jpg',
    baseColorUrl: '/textures/pbr/rubber/baseColor.jpg',
    normalUrl: '/textures/pbr/rubber/normal.jpg',
    roughnessUrl: '/textures/pbr/rubber/roughness.jpg',
    defaultScale: 1.5,
    roughnessValue: 0.7,
    metalnessValue: 0.0,
    aoIntensity: 1.0,
    normalScale: 1.5,
    tags: ['indoor', 'gym', 'sports'],
    isActive: true,
    sortOrder: 6,
  },
  // Legacy Simple Textures
  {
    name: 'Ahşap (Basit)',
    type: 'SIMPLE',
    category: 'wood',
    thumbnailUrl: '/textures/wood.jpg',
    textureUrl: '/textures/wood.jpg',
    defaultScale: 2.0,
    roughnessValue: 0.8,
    metalnessValue: 0.1,
    tags: ['indoor', 'classic', 'warm'],
    isActive: true,
    sortOrder: 10,
  },
  {
    name: 'Fayans (Basit)',
    type: 'SIMPLE',
    category: 'ceramic',
    thumbnailUrl: '/textures/tiles.jpg',
    textureUrl: '/textures/tiles.jpg',
    defaultScale: 2.0,
    roughnessValue: 0.5,
    metalnessValue: 0.2,
    tags: ['indoor', 'bathroom', 'kitchen'],
    isActive: true,
    sortOrder: 11,
  },
  {
    name: 'Çim (Basit)',
    type: 'SIMPLE',
    category: 'fabric',
    thumbnailUrl: '/textures/grass.jpg',
    textureUrl: '/textures/grass.jpg',
    defaultScale: 2.0,
    roughnessValue: 0.9,
    metalnessValue: 0.0,
    tags: ['outdoor', 'simple'],
    isActive: true,
    sortOrder: 12,
  },
  {
    name: 'Kauçuk (Basit)',
    type: 'SIMPLE',
    category: 'fabric',
    thumbnailUrl: '/textures/rubber.jpg',
    textureUrl: '/textures/rubber.jpg',
    defaultScale: 1.5,
    roughnessValue: 0.7,
    metalnessValue: 0.0,
    tags: ['indoor', 'simple'],
    isActive: true,
    sortOrder: 13,
  },
];

async function main() {
  console.log('🎨 PBR Texture seed başlıyor...\n');

  // Mevcut texture'ları temizle (opsiyonel)
  const deleteCount = await prisma.floorTexture.deleteMany({});
  console.log(`✅ Mevcut ${deleteCount.count} texture silindi.\n`);

  // Yeni texture'ları ekle
  for (const texture of PBR_TEXTURES) {
    const created = await prisma.floorTexture.create({
      data: texture as any,
    });
    console.log(`✅ ${created.name} (${created.type}) eklendi - ID: ${created.id}`);
  }

  console.log(`\n🎉 Toplam ${PBR_TEXTURES.length} texture başarıyla eklendi!`);
}

main()
  .catch((e) => {
    console.error('❌ Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
