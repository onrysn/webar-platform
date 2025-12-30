import { Injectable, BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ActivityLogService } from '../activity-log/activity-log.service'; // Log servisini import et

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private activityLogger: ActivityLogService // Inject et
  ) { }

  async register(registerDto: RegisterDto) {
    const { name, email, password } = registerDto;
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new BadRequestException('Bu e-posta adresi zaten kullanımda.');

    const passwordHash = await argon2.hash(password);

    const user = await this.prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    const token = this.jwtService.sign({ userId: user.id, role: user.role });

    await this.activityLogger.log(
      user.id,
      'REGISTER',
      `Yeni kullanıcı kaydoldu: "${user.name}"`,
      { email: user.email }
    );

    return { user, token };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('E-posta veya şifre hatalı.');

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) throw new BadRequestException('E-posta veya şifre hatalı.');

    const token = this.jwtService.sign({ userId: user.id, role: user.role });

    await this.activityLogger.log(
      user.id,
      'LOGIN',
      `${user.name} sisteme giriş yaptı.`,
      { email: user.email }
    );

    const { passwordHash, ...userWithoutPass } = user;

    return { user: userWithoutPass, token };
  }

  async me(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });
  }
}