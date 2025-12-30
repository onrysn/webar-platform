import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class CompanyService {
  constructor(
    private prisma: PrismaService,
    private activityLogger: ActivityLogService
  ) { }

  /** Şirket oluşturma */
  async createCompany(userId: number, name: string, domain: string) {
    const apiKey = uuidv4();
    const company = await this.prisma.company.create({
      data: { name, domain, apiKey },
    });

    // Oluşturan kullanıcıyı admin olarak ekle
    await this.prisma.userCompany.create({
      data: { userId, companyId: company.id, role: 'admin' },
    });

    await this.activityLogger.log(
      userId,
      'CREATE_COMPANY',
      `"${company.name}" şirketi oluşturuldu.`,
      { companyId: company.id, domain: company.domain }
    );

    return company;
  }

  /** Yetki Kontrolü (Helper) */
  private async checkUserRole(userId: number, companyId: number, allowedRoles: string[]) {
    // 1. Sistem admini ise her yere erişebilir
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.role === 'admin') return 'admin';

    // 2. Şirket üyesi mi kontrol et
    const userCompany = await this.prisma.userCompany.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });

    if (!userCompany)
      throw new ForbiddenException('Bu şirkete erişim yetkiniz yok.');

    if (!allowedRoles.includes(userCompany.role))
      throw new ForbiddenException(`Bu işlem için yetkiniz yetersiz. Gereken: ${allowedRoles.join(', ')}`);

    return userCompany.role;
  }

  /** Şirketi güncelleme */
  async updateCompany(userId: number, companyId: number, data: { name?: string; domain?: string }) {
    await this.checkUserRole(userId, companyId, ['admin']);

    const company = await this.prisma.company.update({
      where: { id: companyId },
      data,
    });

    await this.activityLogger.log(
      userId,
      'UPDATE_COMPANY',
      `"${company.name}" bilgileri güncellendi.`,
      { companyId: company.id, changes: data }
    );

    return company;
  }

  /** Şirket silme */
  async deleteCompany(userId: number, companyId: number) {
    await this.checkUserRole(userId, companyId, ['admin']);

    const company = await this.prisma.company.delete({
      where: { id: companyId },
    });

    await this.activityLogger.log(
      userId,
      'DELETE_COMPANY',
      `"${company.name}" şirketi silindi.`,
      { companyId: company.id, domain: company.domain }
    );

    return company;
  }

  /** Kullanıcıyı şirkete ekleme */
  async addUserToCompany(userId: number, targetUserId: number, companyId: number, role = 'member') {
    await this.checkUserRole(userId, companyId, ['admin']);

    // Kullanıcı zaten ekli mi kontrol et
    const existing = await this.prisma.userCompany.findUnique({
      where: { userId_companyId: { userId: targetUserId, companyId } }
    });
    if (existing) throw new BadRequestException('Kullanıcı zaten bu şirkete üye.');

    const result = await this.prisma.userCompany.create({
      data: { userId: targetUserId, companyId, role },
      include: { user: { select: { name: true, email: true } } } // Log için isim lazım
    });

    // [LOG EKLENDİ]
    await this.activityLogger.log(
      userId,
      'ADD_USER',
      `"${result.user.name}" şirkete eklendi (${role}).`,
      { companyId, targetUserId, role }
    );

    return result;
  }

  /** Kullanıcıyı şirketten çıkarma */
  async removeUserFromCompany(userId: number, targetUserId: number, companyId: number) {
    await this.checkUserRole(userId, companyId, ['admin']);

    // Kendini silememeli (Opsiyonel ama güvenli)
    if (userId === targetUserId) {
      throw new BadRequestException('Kendinizi şirketten çıkaramazsınız.');
    }

    const removed = await this.prisma.userCompany.delete({
      where: { userId_companyId: { userId: targetUserId, companyId } },
      include: { user: { select: { name: true } } }
    });

    // [LOG EKLENDİ]
    await this.activityLogger.log(
      userId,
      'REMOVE_USER',
      `"${removed.user.name}" şirketten çıkarıldı.`,
      { companyId, targetUserId }
    );

    return removed;
  }

  /** Kullanıcının dahil olduğu şirketleri listeleme */
  async getUserCompanies(userId: number) {
    return this.prisma.userCompany.findMany({
      where: { userId },
      include: { company: true },
    });
  }

  /** (SÜPER ADMIN) Tüm şirketleri listeleme (Dashboard için) */
  async getAllCompanies() {
    return this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { users: true, scenes: true } } } // İstatistik için count
    });
  }

  /** Şirket detaylarını alma */
  async getCompanyById(userId: number, companyId: number) {
    await this.checkUserRole(userId, companyId, ['admin', 'editor', 'member']);

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        users: {
          include: {
            // [GÜVENLİK DÜZELTMESİ] PasswordHash'i gizlemek için select kullandık
            user: {
              select: { id: true, name: true, email: true, role: true, createdAt: true }
            }
          }
        },
        // Şirketin aktivitelerini de getirebiliriz (Opsiyonel)
        // activities: { take: 10, orderBy: { createdAt: 'desc' } }
      },
    });

    if (!company) throw new NotFoundException('Şirket bulunamadı');
    return company;
  }

  /** API key yenileme */
  async regenerateApiKey(userId: number, companyId: number) {
    await this.checkUserRole(userId, companyId, ['admin']);

    const newApiKey = uuidv4();
    const company = await this.prisma.company.update({
      where: { id: companyId },
      data: { apiKey: newApiKey },
    });

    // [LOG EKLENDİ] - Bu işlem entegrasyonları bozar, kesinlikle loglanmalı
    await this.activityLogger.log(
      userId,
      'REGENERATE_KEY',
      `API Anahtarı yenilendi.`,
      { companyId }
    );

    return company;
  }

  /** Public API veya middleware için doğrulama */
  async getCompanyByApiKey(apiKey: string) {
    const company = await this.prisma.company.findUnique({
      where: { apiKey },
    });
    if (!company) throw new NotFoundException('Geçersiz API Anahtarı');
    return company;
  }
}