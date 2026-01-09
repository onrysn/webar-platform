import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role, Prisma } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';
import * as argon2 from 'argon2';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private activityLogger: ActivityLogService
  ) { }

  // 1. LİSTELEME
  async findAll(user: CurrentUser, filterCompanyId?: number) {
    // Filtreleme Mantığı:
    // Super Admin -> İsterse belirli şirketi, istemezse hepsini görür.
    // Diğerleri -> SADECE kendi şirketini görür.

    let whereClause: Prisma.UserWhereInput = { isDeleted: false };

    if (user.role === Role.SUPER_ADMIN) {
      if (filterCompanyId) {
        whereClause.companyId = filterCompanyId;
      }
    } else {
      // Güvenlik: Kullanıcının kendi şirketi zorunlu
      if (!user.companyId) throw new BadRequestException('Şirket bilgisi bulunamadı');
      whereClause.companyId = user.companyId;
    }

    return this.prisma.user.findMany({
      where: whereClause,
      select: { // Hassas verileri (passwordHash) dönmüyoruz
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        company: { select: { name: true } },
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // 2. DETAY GETİRME
  async findOne(currentUser: CurrentUser, id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { company: { select: { name: true } } }
    });

    if (!user || user.isDeleted) throw new NotFoundException('Kullanıcı bulunamadı');

    // GÜVENLİK: Başkasının şirketindeki kullanıcıyı göremez (Super Admin hariç)
    if (currentUser.role !== Role.SUPER_ADMIN && user.companyId !== currentUser.companyId) {
      throw new NotFoundException('Kullanıcı bulunamadı'); // Gizlilik için 404 dönüyoruz
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  // 3. GÜNCELLEME
  async update(currentUser: CurrentUser, id: number, dto: UpdateUserDto) {
    const userToUpdate = await this.prisma.user.findUnique({ where: { id } });
    if (!userToUpdate || userToUpdate.isDeleted) throw new NotFoundException('Kullanıcı bulunamadı');

    // 1. Şirket Erişimi Kontrolü (Super Admin değilse sadece kendi şirketini/kendini güncelleyebilir)
    if (currentUser.role !== Role.SUPER_ADMIN && userToUpdate.companyId !== currentUser.companyId) {
      throw new ForbiddenException('Bu işlem için yetkiniz yok.');
    }

    // 2. Rol Değiştirme Kontrolü (KRİTİK)
    if (dto.role) {
      if (currentUser.role !== Role.SUPER_ADMIN && currentUser.role !== Role.COMPANY_ADMIN) {
        throw new ForbiddenException('Rol değiştirme yetkiniz yok.');
      }

      if (dto.role === Role.SUPER_ADMIN && currentUser.role !== Role.SUPER_ADMIN) {
        throw new ForbiddenException('Super Admin rolü atayamazsınız.');
      }
    }

    if (dto.companyId && currentUser.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Şirket değiştirme yetkiniz yok.');
    }

    const passwordHash = dto.password ? await argon2.hash(dto.password) : undefined;

    const updateData: any = {
      name: dto.name,
      email: dto.email,
      passwordHash: passwordHash,
    };

    // Rolü sadece yetkili kişiler değiştirebiliyorsa ekle
    if (dto.role && (currentUser.role === Role.SUPER_ADMIN || currentUser.role === Role.COMPANY_ADMIN)) {
      updateData.role = dto.role;
    }

    // Şirketi sadece Super Admin değiştirebiliyorsa ekle
    if (dto.companyId && currentUser.role === Role.SUPER_ADMIN) {
      updateData.companyId = dto.companyId;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    await this.activityLogger.log(
      currentUser.id,
      userToUpdate.companyId,
      'UPDATE_USER',
      `"${updatedUser.name}" kullanıcısı güncellendi.`,
      { targetUserId: id, changes: Object.keys(dto) }
    );

    const { passwordHash: ph, ...result } = updatedUser;
    return result;
  }

  // 4. SİLME
  async remove(currentUser: CurrentUser, id: number) {
    const userToDelete = await this.prisma.user.findUnique({ where: { id } });
    if (!userToDelete || userToDelete.isDeleted) throw new NotFoundException('Kullanıcı bulunamadı');

    // GÜVENLİK
    if (currentUser.role !== Role.SUPER_ADMIN && userToDelete.companyId !== currentUser.companyId) {
      throw new ForbiddenException('Yetkiniz yok.');
    }

    // Kendini silemez
    if (currentUser.id === id) {
      throw new BadRequestException('Kendinizi silemezsiniz.');
    }

    await this.prisma.user.update({
      where: { id },
      data: { isDeleted: true }
    });

    await this.activityLogger.log(
      currentUser.id,
      userToDelete.companyId,
      'DELETE_USER',
      `"${userToDelete.name}" kullanıcısı silindi.`,
      { targetUserId: id }
    );

    return { message: 'Kullanıcı başarıyla silindi' };
  }
}