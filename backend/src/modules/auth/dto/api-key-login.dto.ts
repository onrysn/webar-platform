import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ApiKeyLoginDto {
  @ApiProperty({
    description: 'Şirketin API anahtarı',
    example: 'COMPANY_A_KEY'
  })
  @IsNotEmpty()
  @IsString()
  apiKey: string;
}
