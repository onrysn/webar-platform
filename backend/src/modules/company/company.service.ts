import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import * as argon2 from 'argon2'; // Şifreleme için
import { ActivityLogService } from '../activity-log/activity-log.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateCompanyDto } from './dto/createCompany.dto';
import { UpdateCompanyDto } from './dto/updateCompany.dto';
import { AddUserToCompanyDto } from './dto/add-user.dto';
import { Role } from '@prisma/client';
import { unlink, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

@Injectable()
export class CompanyService {
  constructor(
    private prisma: PrismaService,
    private activityLogger: ActivityLogService
  ) { }

  // 1. Şirket Oluşturma (Sadece Super Admin)
  async createCompany(user: CurrentUser, data: CreateCompanyDto) {
    let logoUrl: string | null = null;

    // Base64 logo varsa kaydet
    if (data.logoBase64) {
      logoUrl = await this.saveBase64Logo(data.logoBase64);
    }

    const company = await this.prisma.company.create({
      data: {
        name: data.name,
        domain: data.domain,
        maxScenes: data.maxScenes ?? 10, // Default 10
        logoUrl,
      },
    });

    await this.activityLogger.log(
      user.id,
      company.id, // Yeni şirketin ID'si
      'CREATE_COMPANY',
      `"${company.name}" şirketi oluşturuldu (Super Admin).`,
      { companyId: company.id, domain: company.domain }
    );

    return company;
  }

  // 2. Şirket Güncelleme
  async updateCompany(user: CurrentUser, companyId: number, data: UpdateCompanyDto) {
    const existingCompany = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!existingCompany) throw new NotFoundException('Şirket bulunamadı');

    const updateData: any = { ...data };
    delete updateData.logoBase64; // DTO'dan logoBase64'ü çıkar

    // Base64 logo varsa kaydet
    if (data.logoBase64) {
      // Eski logoyu sil
      if (existingCompany.logoUrl) {
        try {
          const oldLogoPath = join(process.cwd(), existingCompany.logoUrl);
          await unlink(oldLogoPath);
        } catch (error) {
          console.warn('Eski logo silinemedi:', error);
        }
      }

      updateData.logoUrl = await this.saveBase64Logo(data.logoBase64);
    }

    const company = await this.prisma.company.update({
      where: { id: companyId },
      data: updateData,
    });

    await this.activityLogger.log(
      user.id,
      company.id,
      'UPDATE_COMPANY',
      `"${company.name}" bilgileri güncellendi.`,
      { companyId: company.id, changes: data }
    );

    return company;
  }

  // 3. Şirket Silme
  async deleteCompany(user: CurrentUser, companyId: number) {
    const company = await this.prisma.company.delete({
      where: { id: companyId },
    });

    await this.activityLogger.log(
      user.id,
      company.id,
      'DELETE_COMPANY',
      `"${company.name}" şirketi silindi.`,
      { companyId: company.id }
    );

    return company;
  }

  // 4. Şirkete Yeni Kullanıcı Ekleme (Alt Kullanıcı Oluşturma)
  // Eski "addUserToCompany" yerine, sıfırdan kullanıcı oluşturma
  async createSubUser(adminUser: CurrentUser, dto: AddUserToCompanyDto, forcedCompanyId?: number) {

    // Email kontrolü
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
      throw new BadRequestException('Bu e-posta adresi zaten kullanımda.');
    }

    // HEDEF ŞİRKET BELİRLEME
    // Eğer forcedCompanyId varsa (Super Admin) onu kullan, yoksa adminUser.companyId'yi kullan.
    const targetCompanyId = forcedCompanyId || adminUser.companyId;

    if (!targetCompanyId) {
      throw new BadRequestException('Hedef şirket belirlenemedi.');
    }

    // Yetki Kontrolü: Super Admin değilse ve kendi şirketi değilse hata ver (gerçi companyId kendi id'si ama yine de güvenlik)
    if (adminUser.role !== Role.SUPER_ADMIN && targetCompanyId !== adminUser.companyId) {
      throw new ForbiddenException('Bu işlem için yetkiniz yok.');
    }

    // Rol Kontrolü
    if (dto.role === Role.SUPER_ADMIN || dto.role === Role.COMPANY_ADMIN) {
      throw new ForbiddenException('Alt kullanıcılara yönetici yetkisi verilemez.');
    }

    const passwordHash = await argon2.hash(dto.password);

    const newUser = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: dto.role,
        companyId: targetCompanyId, // Belirlenen ID'yi kullan
      },
      select: { id: true, name: true, email: true, role: true }
    });

    await this.activityLogger.log(
      adminUser.id,
      targetCompanyId,
      'ADD_USER',
      `"${newUser.name}" şirkete eklendi (${dto.role}).`,
      { targetUserId: newUser.id, role: dto.role }
    );

    return newUser;
  }

  // 5. Kullanıcıyı Şirketten Çıkarma (Silme veya Pasife Alma)
  async removeUserFromCompany(adminUser: CurrentUser, targetUserId: number, forcedCompanyId?: number) {

    const targetUser = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) throw new NotFoundException('Kullanıcı bulunamadı.');

    const targetCompanyId = forcedCompanyId || adminUser.companyId;

    // GÜVENLİK: 
    // Super Admin ise her şeyi silebilir.
    // Değilse, silinmek istenen kullanıcı adminin şirketinde mi?
    if (adminUser.role !== Role.SUPER_ADMIN) {
      if (targetUser.companyId !== adminUser.companyId) {
        throw new ForbiddenException('Bu kullanıcı sizin şirketinize ait değil.');
      }
    } else {
      // Super Admin ise, belirtilen şirketten mi siliyor kontrolü (Opsiyonel ama iyi olur)
      if (forcedCompanyId && targetUser.companyId !== forcedCompanyId) {
        throw new BadRequestException('Kullanıcı belirtilen şirkete ait değil.');
      }
    }

    if (adminUser.id === targetUserId) {
      throw new BadRequestException('Kendinizi silemezsiniz.');
    }

    const deletedUser = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { isDeleted: true }
    });

    await this.activityLogger.log(
      adminUser.id,
      targetCompanyId || 0,
      'REMOVE_USER',
      `"${deletedUser.name}" kullanıcısı silindi.`,
      { targetUserId }
    );

    return { message: 'Kullanıcı başarıyla silindi.' };
  }

  // 6. Şirket Detayını Getir
  async getCompanyById(companyId: number) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        // İstatistikler
        _count: { select: { users: true, scenes: true, arModels: true } }
      },
    });

    if (!company) throw new NotFoundException('Şirket bulunamadı');
    return company;
  }

  // 7. Şirket Çalışanlarını Listele
  async getCompanyUsers(companyId: number) {
    return this.prisma.user.findMany({
      where: { companyId, isDeleted: false },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  // 8. Tüm Şirketleri Listele (Super Admin)
  async getAllCompanies() {
    return this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { users: true, scenes: true, apiKeys: true } }
      }
    });
  }

  // 9. API Key Yönetimi (ApiKey tablosu)
  async listApiKeys(companyId: number) {
    return this.prisma.apiKey.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createApiKey(
    user: CurrentUser,
    companyId: number,
    body: {
      name?: string;
      description?: string;
      allowedOrigins?: string[];
      allowedDomains?: string[];
      permissions?: any;
      rateLimit?: number | null;
      rateLimitWindow?: number | null;
      expiresAt?: Date | null;
    }
  ) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Şirket bulunamadı');

    // maxApiKeys kontrolü
    const currentCount = await this.prisma.apiKey.count({ where: { companyId } });
    if (company.maxApiKeys != null && currentCount >= company.maxApiKeys) {
      throw new BadRequestException('Maksimum API anahtarı limitine ulaşıldı.');
    }

    const created = await this.prisma.apiKey.create({
      data: {
        companyId,
        name: body.name || 'API Key',
        description: body.description,
        allowedOrigins: body.allowedOrigins || [],
        allowedDomains: body.allowedDomains || [],
        permissions: body.permissions || {},
        rateLimit: body.rateLimit ?? null,
        rateLimitWindow: body.rateLimitWindow ?? 3600,
        expiresAt: body.expiresAt ?? null,
      },
    });

    await this.activityLogger.log(
      user.id,
      companyId,
      'CREATE_API_KEY',
      `Yeni API anahtarı oluşturuldu.`,
      { apiKeyId: created.id }
    );

    return created;
  }

  async deleteApiKey(user: CurrentUser, keyId: number) {
    const existing = await this.prisma.apiKey.findUnique({ where: { id: keyId } });
    if (!existing) throw new NotFoundException('API anahtarı bulunamadı');
    const deleted = await this.prisma.apiKey.delete({ where: { id: keyId } });
    await this.activityLogger.log(
      user.id,
      deleted.companyId,
      'DELETE_API_KEY',
      `API anahtarı silindi.`,
      { apiKeyId: deleted.id }
    );
    return { message: 'API anahtarı silindi.' };
  }

  async updateApiKey(
    user: CurrentUser,
    keyId: number,
    body: {
      name?: string;
      description?: string;
      allowedOrigins?: string[];
      allowedDomains?: string[];
      permissions?: any;
      rateLimit?: number | null;
      rateLimitWindow?: number | null;
      isActive?: boolean;
      expiresAt?: Date | null;
    }
  ) {
    const existing = await this.prisma.apiKey.findUnique({ where: { id: keyId } });
    if (!existing) throw new NotFoundException('API anahtarı bulunamadı');
    const updated = await this.prisma.apiKey.update({
      where: { id: keyId },
      data: {
        name: body.name,
        description: body.description,
        allowedOrigins: body.allowedOrigins,
        allowedDomains: body.allowedDomains,
        permissions: body.permissions,
        rateLimit: body.rateLimit,
        rateLimitWindow: body.rateLimitWindow,
        isActive: body.isActive,
        expiresAt: body.expiresAt,
      },
    });
    await this.activityLogger.log(
      user.id,
      updated.companyId,
      'UPDATE_API_KEY',
      `API anahtarı güncellendi.`,
      { apiKeyId: updated.id }
    );
    return updated;
  }

  async updateCompanyLimits(
    user: CurrentUser,
    companyId: number,
    body: { maxApiKeys?: number | null; maxStorage?: number | null; maxScenes?: number | null }
  ) {
    const updated = await this.prisma.company.update({
      where: { id: companyId },
      data: {
        maxApiKeys: body.maxApiKeys ?? undefined,
        maxStorage: body.maxStorage ?? undefined,
        maxScenes: body.maxScenes ?? undefined,
      },
    });
    await this.activityLogger.log(
      user.id,
      companyId,
      'UPDATE_COMPANY_LIMITS',
      `Şirket limitleri güncellendi.`,
      { maxApiKeys: updated.maxApiKeys, maxStorage: updated.maxStorage, maxScenes: updated.maxScenes }
    );
    return updated;
  }

  // Base64 logo'yu dosyaya kaydet
  private async saveBase64Logo(base64String: string): Promise<string> {
    try {
      // Data URL'den base64 kısmını ayır (data:image/png;base64,...)
      const matches = base64String.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new BadRequestException('Geçersiz base64 formatı');
      }

      const imageType = matches[1]; // png, jpeg, etc.
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      // Dosya boyutu kontrolü (5MB)
      if (buffer.length > 5 * 1024 * 1024) {
        throw new BadRequestException('Logo dosyası 5MB\'dan küçük olmalıdır');
      }

      // Uploads klasörünü oluştur
      const uploadsDir = join(process.cwd(), 'uploads', 'logo');
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      // Benzersiz dosya adı oluştur
      const filename = `logo-${Date.now()}-${uuidv4()}.${imageType}`;
      const filepath = join(uploadsDir, filename);

      // Dosyayı kaydet
      await writeFile(filepath, buffer);

      // Public URL döndür
      return `/uploads/logo/${filename}`;
    } catch (error) {
      console.error('Logo kaydetme hatası:', error);
      throw new BadRequestException('Logo kaydedilemedi');
    }
  }
}