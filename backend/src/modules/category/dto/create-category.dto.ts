import { IsInt, IsOptional, IsString, MaxLength, IsEnum } from 'class-validator';
import { CategoryType } from '@prisma/client';

export class CreateCategoryDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsEnum(CategoryType)
  categoryType!: CategoryType;

  @IsOptional()
  @IsInt()
  parentId?: number;

  // Sadece Super Admin için opsiyonel
  @IsOptional()
  @IsInt()
  companyId?: number;
}
