import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSeriesDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  // Sadece Super Admin için opsiyonel
  @IsOptional()
  @IsInt()
  companyId?: number;
}
