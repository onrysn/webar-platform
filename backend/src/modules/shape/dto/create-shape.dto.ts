import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, IsArray, ArrayNotEmpty, IsInt } from 'class-validator';
import { ShapeCategory } from '@prisma/client';

export class CreateShapeDto {
  @IsString()
  @MaxLength(50)
  code!: string;

  @IsString()
  @MaxLength(10)
  icon!: string;

  @IsString()
  svgPath!: string;

  @IsString()
  @MaxLength(120)
  labelTR!: string;

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

  @IsEnum(ShapeCategory)
  category!: ShapeCategory;

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
