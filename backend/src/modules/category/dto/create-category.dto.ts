import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsInt()
  parentId?: number;

  // Sadece Super Admin için opsiyonel
  @IsOptional()
  @IsInt()
  companyId?: number;
}
