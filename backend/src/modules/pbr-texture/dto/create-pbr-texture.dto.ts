import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { TextureType } from '@prisma/client';

export class CreatePbrTextureDto {
  @ApiProperty({ description: 'Texture adı' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Thumbnail URL (baseColor kullanılır)' })
  @IsString()
  thumbnailUrl: string;

  @ApiProperty({ enum: TextureType, description: 'Texture tipi' })
  @IsEnum(TextureType)
  type: TextureType;

  @ApiPropertyOptional({ description: 'Base Color/Albedo harita URL' })
  @IsString()
  @IsOptional()
  baseColorUrl?: string;

  @ApiPropertyOptional({ description: 'Normal map URL' })
  @IsString()
  @IsOptional()
  normalUrl?: string;

  @ApiPropertyOptional({ description: 'Roughness map URL' })
  @IsString()
  @IsOptional()
  roughnessUrl?: string;

  @ApiPropertyOptional({ description: 'Metallic map URL' })
  @IsString()
  @IsOptional()
  metallicUrl?: string;

  @ApiPropertyOptional({ description: 'Ambient Occlusion map URL' })
  @IsString()
  @IsOptional()
  aoUrl?: string;

  @ApiPropertyOptional({ description: 'Varsayılan scale değeri', default: 2.0 })
  @IsNumber()
  @IsOptional()
  @Min(0.1)
  @Max(10)
  defaultScale?: number;

  @ApiPropertyOptional({ description: 'Roughness değeri', default: 0.9 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  roughnessValue?: number;

  @ApiPropertyOptional({ description: 'Metalness değeri', default: 0.0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  metalnessValue?: number;

  @ApiPropertyOptional({ description: 'AO yoğunluğu', default: 1.2 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(3)
  aoIntensity?: number;

  @ApiPropertyOptional({ description: 'Normal map ölçeği', default: 2.0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(5)
  normalScale?: number;

  @ApiPropertyOptional({ description: 'Kategori (wood, stone, metal, vb.)' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Etiketler', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Aktif mi?', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Sıralama önceliği', default: 0 })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
