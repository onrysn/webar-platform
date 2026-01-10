import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class CompanyActiveGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 1. Kullanıcı yoksa (Auth guard'dan geçmemişse) devam et (veya hata ver)
    if (!user) return true;

    // 2. SUPER_ADMIN her zaman geçer, şirketi pasif olsa bile (ki olmaz genelde)
    if (user.role === Role.SUPER_ADMIN) return true;

    // 3. Kullanıcının şirketi var mı?
    if (!user.companyId) return true; // Şirketsiz kullanıcı (varsa)

    // 4. Şirketin güncel durumunu veritabanından sorgula
    // (User objesindeki company bilgisi token eskidiği için bayat olabilir, DB'den taze çekiyoruz)
    const company = await this.prisma.company.findUnique({
      where: { id: user.companyId },
      select: { isActive: true, subscriptionEndsAt: true }
    });

    if (!company) throw new UnauthorizedException('Şirket bulunamadı.');

    // KONTROL A: Şirket Aktif mi?
    if (company.isActive === false) {
      throw new ForbiddenException('Şirket üyeliği askıya alınmıştır. Lütfen sistem yöneticisiyle iletişime geçin.');
    }

    // KONTROL B: Abonelik Süresi Dolmuş mu?
    if (company.subscriptionEndsAt) {
      const now = new Date();
      if (new Date(company.subscriptionEndsAt) < now) {
        throw new ForbiddenException('Şirket abonelik süresi dolmuştur. Hizmet alımı durduruldu.');
      }
    }

    return true;
  }
}