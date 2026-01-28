import { IsString, IsOptional, IsBoolean, IsDateString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCompanyDto {
  
  @ApiProperty({ required: false, description: 'Şirket adı' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, description: 'Şirket domain adresi' })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiProperty({ required: false, description: 'Şirket aktif mi?' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false, description: 'Abonelik bitiş tarihi (ISO String)' })
  @IsOptional()
  @IsDateString()
  subscriptionEndsAt?: Date;

  @ApiProperty({ required: false, description: 'Maksimum depolama alanı (MB)', example: 1000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxStorage?: number;

  @ApiProperty({ required: false, description: 'Maksimum API anahtarı sayısı', example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxApiKeys?: number;

  @ApiProperty({ required: false, description: 'Maksimum sahne sayısı', example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxScenes?: number;

  @ApiProperty({ required: false, description: 'Logo dosyası (base64)', example: 'data:image/png;base64,iVBORw0KGgoAAAANS...' })
  @IsOptional()
  @IsString()
  logoBase64?: string;
}