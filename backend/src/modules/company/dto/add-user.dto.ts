import { Role } from '@prisma/client';
import { IsEmail, IsString, IsEnum } from 'class-validator';

export class AddUserToCompanyDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsString()
  password: string;

  @IsEnum(Role)
  role: Role; // EDITOR veya MEMBER (ADMIN olamaz)
}