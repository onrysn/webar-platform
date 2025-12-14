import { IsString, IsNotEmpty, IsNumber, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// 1. Yeni (Boş) Sahne Oluştur
export class CreateSceneDto {
  @ApiProperty({ example: 'Oturma Odası Projesi' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNumber()
  companyId: number;
}

// 2. Sahneye Yeni Bir Eşya (Model) Ekle
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

  @ApiProperty({ example: { x: 0, y: 0, z: 0 } })
  @IsOptional()
  position?: any; // Prisma Json tipine gider

  @ApiProperty({ example: { x: 0, y: 0, z: 0 } })
  @IsOptional()
  rotation?: any;

  @ApiProperty({ example: { x: 1, y: 1, z: 1 } })
  @IsOptional()
  scale?: any;
}

// 3. Sahnedeki Eşyanın Konumunu Güncelle
export class UpdateSceneItemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  position?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  rotation?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  scale?: any;
}