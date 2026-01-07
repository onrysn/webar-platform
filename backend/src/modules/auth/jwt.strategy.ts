import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service'; // Prisma servisinin yolu

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService, // 1. Prisma'yı buraya enjekte ediyoruz
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET not defined');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Token geçerliyse bu metod çalışır.
   * Buradan dönen obje, Controller'larda 'request.user' (veya @User()) içine yerleşir.
   */
  async validate(payload: any) {
    // payload.sub genellikle user ID'dir (AuthService'de nasıl imzaladığına bağlı)
    // Eğer payload.userId kullanıyorsan onu al.
    const userId = payload.sub || payload.userId;

    if (!userId) {
        throw new UnauthorizedException('Token hatalı');
    }

    // 2. Veritabanından kullanıcının EN GÜNCEL halini çekiyoruz
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true, 
        role: true,       // Rol değişikliği varsa anında yakalarız
        companyId: true,  // Hangi şirkette olduğunu anında yakalarız
        // isActive: true // Eğer sisteminde "Pasif Kullanıcı" varsa buraya ekle
      }
    });

    // Kullanıcı veritabanından silinmişse token olsa bile girememeli
    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı');
    }

    // (Opsiyonel) Kullanıcı pasife çekildiyse engelle
    // if (!user.isActive) throw new UnauthorizedException('Hesabınız pasif');

    // 3. Controller'a gidecek temiz objeyi döndür
    return { 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      companyId: user.companyId 
    };
  }
}