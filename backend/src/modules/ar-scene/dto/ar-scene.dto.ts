import { IsString, IsNotEmpty, IsNumber, IsOptional, ValidateNested, IsArray, IsEnum, IsBoolean } from 'class-validator';
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

// 2. Özel Şekil (Poligon) Noktaları için
export class FloorPointDto {
  @ApiProperty({ example: 0 })
  @IsNumber()
  x: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  z: number;
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