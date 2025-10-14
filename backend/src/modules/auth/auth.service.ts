import { Injectable, BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) { }

  async register(registerDto: RegisterDto) {
    const { name, email, password } = registerDto;

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new BadRequestException('Email already in use');

    const passwordHash = await argon2.hash(password);
    const user = await this.prisma.user.create({
      data: { name, email, passwordHash },
    });

    const token = this.jwtService.sign({ userId: user.id });
    return { user, token };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('Invalid credentials');

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) throw new BadRequestException('Invalid credentials');

    const token = this.jwtService.sign({ userId: user.id });
    return { user, token };
  }

  async me(userId: number) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }
}
