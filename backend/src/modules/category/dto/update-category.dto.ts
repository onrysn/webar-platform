import { IsInt, IsOptional, IsString, MaxLength, IsEnum } from 'class-validator';
import { CategoryType } from '@prisma/client';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsEnum(CategoryType)
  categoryType?: CategoryType;

  @IsOptional()
  @IsInt()
  parentId?: number | null;
}
