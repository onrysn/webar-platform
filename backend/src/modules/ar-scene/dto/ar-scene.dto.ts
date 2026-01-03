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

  @ApiPropertyOptional({ description: 'Doku URL', example: '/textures/brick.jpg' })
  @IsOptional()
  @IsString()
  textureUrl?: string;

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
  @ApiPropertyOptional({ example: '/textures/wood.jpg', description: 'Zemin dokusu URL' })
  @IsOptional()
  @IsString()
  floorTextureUrl?: string; 

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
}

// --- ANA DTO'LAR ---

// 1. Yeni (Boş) Sahne Oluştur
export class CreateSceneDto {
  @ApiProperty({ example: 'Oturma Odası Projesi' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNumber()
  companyId: number;

  @ApiPropertyOptional({ type: SceneSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SceneSettingsDto)
  settings?: SceneSettingsDto;
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

  @ApiProperty({ example: '/textures/wood.jpg' })
  @IsString()
  textureUrl: string;

  @ApiProperty({ example: '/textures/wood-thumb.jpg', required: false })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}