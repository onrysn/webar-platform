// src/auth/dto/register.dto.ts
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Ahmet Yılmaz' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'ahmet@sirket.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'GucluSifre123!' })
  @IsString()
  @MinLength(6)
  password: string;

  // --- YENİ EKLENEN ---
  @ApiProperty({ example: 'Teknoloji A.Ş.', description: 'Kullanıcının oluşturacağı şirket adı' })
  @IsString()
  @IsNotEmpty()
  companyName: string;
}