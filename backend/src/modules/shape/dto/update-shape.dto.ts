import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, IsArray, IsInt } from 'class-validator';
import { ShapeCategory } from '@prisma/client';

export class UpdateShapeDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  icon?: string;

  @IsOptional()
  @IsString()
  svgPath?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  labelTR?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  labelEN?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  descTR?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  descEN?: string;

  @IsOptional()
  @IsEnum(ShapeCategory)
  category?: ShapeCategory;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
