import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) { }

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
    return company;
  }

  /** Kullanıcının şirkete ait yetkisini kontrol et */
  private async checkUserRole(userId: number, companyId: number, allowedRoles: string[]) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.role === 'admin') return 'admin';

    const userCompany = await this.prisma.userCompany.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });

    if (!userCompany)
      throw new ForbiddenException('Access denied: Not a member of this company');
    if (!allowedRoles.includes(userCompany.role))
      throw new ForbiddenException(`Access denied: Requires role ${allowedRoles.join(', ')}`);

    return userCompany.role;
  }

  /** Şirketi güncelleme (sadece admin) */
  async updateCompany(userId: number, companyId: number, data: { name?: string; domain?: string }) {
    await this.checkUserRole(userId, companyId, ['admin']);
    const company = await this.prisma.company.update({
      where: { id: companyId },
      data,
    });
    return company;
  }

  /** Şirket silme (sadece admin) */
  async deleteCompany(userId: number, companyId: number) {
    await this.checkUserRole(userId, companyId, ['admin']);
    const company = await this.prisma.company.delete({
      where: { id: companyId },
    });
    return company;
  }

  /** Kullanıcıyı şirkete ekleme (admin) */
  async addUserToCompany(userId: number, targetUserId: number, companyId: number, role = 'member') {
    await this.checkUserRole(userId, companyId, ['admin']);
    return this.prisma.userCompany.create({
      data: { userId: targetUserId, companyId, role },
    });
  }

  /** Kullanıcıyı şirketten çıkarma (admin) */
  async removeUserFromCompany(userId: number, targetUserId: number, companyId: number) {
    await this.checkUserRole(userId, companyId, ['admin']);
    return this.prisma.userCompany.delete({
      where: { userId_companyId: { userId: targetUserId, companyId } },
    });
  }

  /** Kullanıcının şirketlerini listeleme */
  async getUserCompanies(userId: number) {
    return this.prisma.userCompany.findMany({
      where: { userId },
      include: { company: true },
    });
  }

  /** Şirket detaylarını alma (her rol görebilir) */
  async getCompanyById(userId: number, companyId: number) {
    await this.checkUserRole(userId, companyId, ['admin', 'editor', 'member']);
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { users: { include: { user: true } } },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  /** API key yenileme (admin) */
  async regenerateApiKey(userId: number, companyId: number) {
    await this.checkUserRole(userId, companyId, ['admin']);
    const newApiKey = uuidv4();
    return this.prisma.company.update({
      where: { id: companyId },
      data: { apiKey: newApiKey },
    });
  }

  /** API key ile şirket doğrulama */
  async getCompanyByApiKey(apiKey: string) {
    const company = await this.prisma.company.findUnique({
      where: { apiKey },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }
}
