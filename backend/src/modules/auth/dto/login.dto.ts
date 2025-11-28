// src/modules/auth/dto/login.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'onur@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '217070' })
  @IsNotEmpty()
  password: string;
}
