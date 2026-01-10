import { IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';
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
}