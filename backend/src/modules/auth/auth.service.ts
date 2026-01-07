import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { Role } from '@prisma/client'; // Enum importu
import { v4 as uuidv4 } from 'uuid'; // API Key üretimi için

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private activityLogger: ActivityLogService
  ) { }

  /**
   * SaaS Kayıt Mantığı:
   * 1. Kullanıcı mailini kontrol et.
   * 2. Transaction başlat:
   * a) Yeni bir Şirket oluştur.
   * b) Kullanıcıyı oluştur ve bu şirkete bağla.
   * c) Kullanıcı rolünü 'COMPANY_ADMIN' yap.
   */
  async register(registerDto: RegisterDto) {
    // Not: RegisterDto'ya 'companyName' alanını eklemen gerekecek!
    const { name, email, password, companyName } = registerDto as any; // DTO'yu güncellemediysen 'as any' geçici çözüm

    // 1. Email Kontrolü
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new BadRequestException('Bu e-posta adresi zaten kullanımda.');

    const passwordHash = await argon2.hash(password);

    // 2. Transaction (Ya hepsi oluşur ya hiçbiri)
    const result = await this.prisma.$transaction(async (tx) => {
      // A) Şirketi Oluştur
      const company = await tx.company.create({
        data: {
          name: companyName || `${name}'s Company`, // DTO'da yoksa varsayılan isim
          domain: '', // İleride doldurulabilir
          apiKey: uuidv4(), // Benzersiz API Key
        }
      });

      // B) Kullanıcıyı Oluştur (Şirket Yöneticisi Olarak)
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: Role.COMPANY_ADMIN, // <--- ÖNEMLİ: İlk kullanıcı yöneticidir
          companyId: company.id,    // <--- ÖNEMLİ: İlişki kuruldu
        }
      });

      return { user, company };
    });

    const { user, company } = result;

    // 3. Token Oluştur (JwtStrategy standardına uygun 'sub')
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role
    });

    // 4. Logla
    await this.activityLogger.log(
      user.id,
      company.id, // <--- Artık companyId var
      'REGISTER',
      `Yeni şirket (${company.name}) ve yönetici (${user.name}) oluşturuldu.`,
      { email: user.email }
    );

    return {
      message: 'Kayıt başarılı',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: { id: company.id, name: company.name }
      }
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { company: true } // Şirket bilgisini de alalım (Log ve kontrol için)
    });

    if (!user) throw new BadRequestException('E-posta veya şifre hatalı.');

    // Silinmiş kullanıcı kontrolü
    if (user.isDeleted) throw new UnauthorizedException('Hesabınız erişime kapatılmıştır.');

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) throw new BadRequestException('E-posta veya şifre hatalı.');

    // Token Payload
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role
    });

    // Log (CompanyId null olabilir - Super Admin ise)
    await this.activityLogger.log(
      user.id,
      user.companyId,
      'LOGIN',
      `${user.name} sisteme giriş yaptı.`,
      { ip: '::1' } // IP bilgisini controllerdan almak daha iyidir ama şimdilik opsiyonel
    );

    // Hassas veriyi çıkar
    const { passwordHash, ...userWithoutPass } = user;

    return { user: userWithoutPass, token };
  }

  async me(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        company: { // Şirket detayını da dönelim
          select: { id: true, name: true, domain: true }
        }
      }
    });

    if (!user) throw new UnauthorizedException('Kullanıcı bulunamadı');
    return user;
  }
}