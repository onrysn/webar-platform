import { IsString, IsNotEmpty, IsNumber, IsOptional, ValidateNested, IsArray, IsEnum, IsBoolean, Min, Max, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// --- YARDIMCI DTO'LAR (Sub-Classes) ---

// 1. Koordinat Sistemi (X, Y, Z) için Ortak DTO
export class Vector3Dto {
  @ApiProperty({ example: 0 })
  @IsNumber()
  x: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  y: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  z: number;
}

export class PerimeterLayerDto {
  @ApiProperty({ description: 'Frontend UUID', example: 'uuid-v4' })
  @IsString()
  id: string;

  @ApiProperty({ enum: ['wall', 'sidewalk', 'grass', 'curb'], description: 'Katman Tipi' })
  @IsEnum(['wall', 'sidewalk', 'grass', 'curb'])
  type: 'wall' | 'sidewalk' | 'grass' | 'curb';

  @ApiProperty({ description: 'Genişlik/Kalınlık (metre)', example: 0.5 })
  @IsNumber()
  width: number;

  @ApiProperty({ description: 'Yükseklik (metre)', example: 1.0 })
  @IsNumber()
  height: number;

  @ApiProperty({ description: 'Renk (Hex)', example: '#94a3b8' })
  @IsString()
  color: string;

  @ApiProperty({ description: 'Zemin seviyesinden yükseklik', example: 0 })
  @IsNumber()
  elevation: number;

  @ApiPropertyOptional({ description: 'Doku URL (Legacy Simple Texture)', example: '/textures/brick.jpg' })
  @IsOptional()
  @IsString()
  textureUrl?: string;

  @ApiPropertyOptional({ description: 'Doku ID (PBR Texture)', example: 1 })
  @IsOptional()
  @IsNumber()
  textureId?: number;

  @ApiPropertyOptional({ description: 'Doku Ölçeği', example: 1 })
  @IsOptional()
  @IsNumber()
  textureScale?: number;
}

// Özel Şekil (Poligon) Noktaları için
export class FloorPointDto {
  @ApiProperty({ example: 0 })
  @IsNumber()
  x: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  z: number;
}

export class FloorLayerDto {
  @ApiProperty({ description: 'Frontend tarafında üretilen UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  id: string;

  @ApiProperty({ 
    description: 'Şekil Tipi (Kütüphanedeki ID)', 
    example: 'rect', 
    enum: ['rect', 'circle', 'triangle', 'arrow', 'l-shape', 'star', 'warning', 'hexagon'] 
  })
  @IsString()
  shapeId: string;

  @ApiProperty({ description: 'Kullanıcının verdiği isim', example: 'Güvenlik Alanı' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Merkez X konumu' })
  @IsNumber()
  x: number;

  @ApiProperty({ description: 'Merkez Z konumu' })
  @IsNumber()
  z: number;

  @ApiProperty({ description: 'Genişlik (Scale X)' })
  @IsNumber()
  width: number;

  @ApiProperty({ description: 'Yükseklik/Derinlik (Scale Y)' })
  @IsNumber()
  height: number;

  @ApiProperty({ description: 'Dönme Açısı (Derece)', example: 0 })
  @IsNumber()
  rotation: number;

  @ApiProperty({ description: 'Renk Kodu (Hex)', example: '#3b82f6' })
  @IsString()
  color: string;

  @ApiProperty({ description: 'Şeffaflık (0.0 - 1.0 arası)', example: 0.8 })
  @IsNumber()
  @Min(0)
  @Max(1)
  opacity: number;

  @ApiProperty({ description: 'Katman sırası', example: 1 })
  @IsNumber()
  zIndex: number;
}

// 3. Sahne Ayarları (Settings JSON İçeriği)
export class SceneSettingsDto {
  @ApiPropertyOptional({ enum: ['rectangle', 'custom'], description: 'Zemin tipi' })
  @IsOptional()
  @IsEnum(['rectangle', 'custom'])
  floorType?: 'rectangle' | 'custom';

  @ApiPropertyOptional({ description: 'Sahne genişliği (Dikdörtgen ise)' })
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiPropertyOptional({ description: 'Sahne derinliği (Dikdörtgen ise)' })
  @IsOptional()
  @IsNumber()
  depth?: number;

  @ApiPropertyOptional({ type: [FloorPointDto], description: 'Özel şekil köşe noktaları' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FloorPointDto)
  floorPoints?: FloorPointDto[];

  @ApiPropertyOptional({ example: '#ffffff', description: 'Arkaplan rengi' })
  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @ApiPropertyOptional({ example: '#ffffff', description: 'Zemin rengi' })
  @IsOptional()
  @IsString()
  floorColor?: string; 

  // ---> YENİ EKLENEN ALAN <---
  @ApiPropertyOptional({ example: '/textures/wood.jpg', description: 'Zemin dokusu URL (Legacy Simple Texture)' })
  @IsOptional()
  @IsString()
  floorTextureUrl?: string; 

  @ApiPropertyOptional({ example: 1, description: 'Zemin dokusu ID (PBR Texture)' })
  @IsOptional()
  @IsNumber()
  floorTextureId?: number;

  @ApiPropertyOptional({ description: 'Izgara görünsün mü?' })
  @IsOptional()
  @IsBoolean()
  gridVisible?: boolean;

  @IsOptional()
  @IsNumber()
  wallHeight?: number;

  @IsOptional()
  @IsNumber()
  textureScale?: number;

  @ApiPropertyOptional({ type: [FloorLayerDto], description: 'Zemin üzerine çizilen şekiller ve işaretler' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FloorLayerDto)
  floorLayers?: FloorLayerDto[];

  @ApiPropertyOptional({ type: [PerimeterLayerDto], description: 'Zemin etrafındaki duvar, kaldırım vb. katmanlar' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PerimeterLayerDto)
  perimeterLayers?: PerimeterLayerDto[];

  @ApiPropertyOptional({ 
    description: 'Sahne aydınlatma ayarları',
    example: {
      ambientIntensity: 0.7,
      ambientColor: '#ffffff',
      directionalIntensity: 1.2,
      directionalColor: '#ffffff',
      directionalX: 15,
      directionalY: 30,
      directionalZ: 15
    }
  })
  @IsOptional()
  @IsObject()
  lighting?: {
    ambientIntensity?: number;
    ambientColor?: string;
    directionalIntensity?: number;
    directionalColor?: string;
    directionalX?: number;
    directionalY?: number;
    directionalZ?: number;
  };
}

// --- ANA DTO'LAR ---

// 1. Yeni (Boş) Sahne Oluştur
export class CreateSceneDto {
  @ApiProperty({ example: 'Oturma Odası Projesi' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  companyId?: number;

  @ApiPropertyOptional({ type: SceneSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SceneSettingsDto)
  settings?: SceneSettingsDto;

  @ApiPropertyOptional({ description: 'Sahne gizli mi? (Liste dışı)', default: false })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({ description: 'Member rolündekiler düzenleyebilir mi?', default: true })
  @IsOptional()
  @IsBoolean()
  memberCanEdit?: boolean;
}

// 2. Sahne Ayarlarını Güncelle
export class UpdateSceneDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ type: SceneSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SceneSettingsDto)
  settings?: SceneSettingsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  memberCanEdit?: boolean;
}

// 3. Sahneye Yeni Bir Eşya (Model) Ekle
export class AddSceneItemDto {
  @ApiProperty({ description: 'Hangi sahneye eklenecek?' })
  @IsNumber()
  sceneId: number;

  @ApiProperty({ description: 'Hangi ARModel kullanılacak?' })
  @IsNumber()
  modelId: number;

  @ApiProperty({ required: false, description: 'Örn: "Masa başı sandalye"' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ type: Vector3Dto })
  @IsOptional()
  @ValidateNested()
  @Type(() => Vector3Dto)
  position?: Vector3Dto;

  @ApiPropertyOptional({ type: Vector3Dto })
  @IsOptional()
  @ValidateNested()
  @Type(() => Vector3Dto)
  rotation?: Vector3Dto;

  @ApiPropertyOptional({ type: Vector3Dto })
  @IsOptional()
  @ValidateNested()
  @Type(() => Vector3Dto)
  scale?: Vector3Dto;
}

// 4. Sahnedeki Eşyanın Konumunu Güncelle
export class UpdateSceneItemDto {
  @ApiPropertyOptional({ type: Vector3Dto })
  @IsOptional()
  @ValidateNested()
  @Type(() => Vector3Dto)
  position?: Vector3Dto;

  @ApiPropertyOptional({ type: Vector3Dto })
  @IsOptional()
  @ValidateNested()
  @Type(() => Vector3Dto)
  rotation?: Vector3Dto;

  @ApiPropertyOptional({ type: Vector3Dto })
  @IsOptional()
  @ValidateNested()
  @Type(() => Vector3Dto)
  scale?: Vector3Dto;

  @IsOptional()
  @IsObject() 
  materialConfig?: Record<string, any>;
}

// 5. Texture Oluşturma DTO
export class CreateFloorTextureDto {
  @ApiProperty({ example: 'Ahşap Parke' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ['SIMPLE', 'PBR'], example: 'PBR', required: false })
  @IsEnum(['SIMPLE', 'PBR'])
  @IsOptional()
  type?: 'SIMPLE' | 'PBR';

  // Simple Texture için
  @ApiProperty({ example: '/textures/wood.jpg', required: false })
  @IsString()
  @IsOptional()
  textureUrl?: string;

  // PBR Texture için
  @ApiProperty({ example: '/textures/pbr/wood/baseColor.jpg', required: false })
  @IsString()
  @IsOptional()
  baseColorUrl?: string;

  @ApiProperty({ example: '/textures/pbr/wood/normal.jpg', required: false })
  @IsString()
  @IsOptional()
  normalUrl?: string;

  @ApiProperty({ example: '/textures/pbr/wood/roughness.jpg', required: false })
  @IsString()
  @IsOptional()
  roughnessUrl?: string;

  @ApiProperty({ example: '/textures/pbr/wood/metallic.jpg', required: false })
  @IsString()
  @IsOptional()
  metallicUrl?: string;

  @ApiProperty({ example: '/textures/pbr/wood/ao.jpg', required: false })
  @IsString()
  @IsOptional()
  aoUrl?: string;

  @ApiProperty({ example: '/textures/wood-thumb.jpg', required: false })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  // PBR Ayarları
  @ApiProperty({ example: 2.0, required: false })
  @IsNumber()
  @IsOptional()
  defaultScale?: number;

  @ApiProperty({ example: 0.9, required: false })
  @IsNumber()
  @IsOptional()
  roughnessValue?: number;

  @ApiProperty({ example: 0.0, required: false })
  @IsNumber()
  @IsOptional()
  metalnessValue?: number;

  @ApiProperty({ example: 1.2, required: false })
  @IsNumber()
  @IsOptional()
  aoIntensity?: number;

  @ApiProperty({ example: 2.0, required: false })
  @IsNumber()
  @IsOptional()
  normalScale?: number;

  // Kategori ve Etiketler
  @ApiProperty({ example: 'wood', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: ['natural', 'indoor'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ example: 0, required: false })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

// 6. Texture Güncelleme DTO
export class UpdateFloorTextureDto {
  @ApiProperty({ example: 'Ahşap Parke', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ enum: ['SIMPLE', 'PBR'], required: false })
  @IsEnum(['SIMPLE', 'PBR'])
  @IsOptional()
  type?: 'SIMPLE' | 'PBR';

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  textureUrl?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  baseColorUrl?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  normalUrl?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  roughnessUrl?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  metallicUrl?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  aoUrl?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  defaultScale?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  roughnessValue?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  metalnessValue?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  aoIntensity?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  normalScale?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}