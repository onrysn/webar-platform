import { IsString, IsOptional } from 'class-validator';
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
}