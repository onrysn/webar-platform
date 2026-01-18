import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import type { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Role } from '@prisma/client';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService, private activity: ActivityLogService) {}

  async list(companyId: number, parentId?: number) {
    return this.prisma.category.findMany({
      where: { companyId, isDeleted: false, ...(parentId !== undefined ? { parentId } : {}) },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getById(id: number) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  async create(user: CurrentUser, dto: CreateCategoryDto & { companyId: number }) {
    if (user.role !== Role.SUPER_ADMIN && user.companyId !== dto.companyId) {
      throw new ForbiddenException('Bu işlem için yetkiniz yok');
    }
    const created = await this.prisma.category.create({
      data: {
        name: dto.name,
        description: dto.description,
        parentId: dto.parentId,
        companyId: dto.companyId,
      }
    });

    await this.activity.log(user.id, dto.companyId, 'CATEGORY_CREATE', `Kategori oluşturuldu: ${created.name}`, { categoryId: created.id });
    return created;
  }

  async update(user: CurrentUser, id: number, dto: UpdateCategoryDto) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Kategori bulunamadı');
    if (user.role !== Role.SUPER_ADMIN && user.companyId !== cat.companyId) {
      throw new ForbiddenException('Bu işlem için yetkiniz yok');
    }
    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name ?? cat.name,
        description: dto.description ?? cat.description,
        parentId: dto.parentId === undefined ? cat.parentId : dto.parentId,
      }
    });

    await this.activity.log(user.id, cat.companyId, 'CATEGORY_UPDATE', `Kategori güncellendi: ${updated.name}`, { categoryId: updated.id });
    return updated;
  }

  async remove(user: CurrentUser, id: number) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Kategori bulunamadı');
    if (user.role !== Role.SUPER_ADMIN && user.companyId !== cat.companyId) {
      throw new ForbiddenException('Bu işlem için yetkiniz yok');
    }
    const removed = await this.prisma.category.update({ where: { id }, data: { isDeleted: true } });
    await this.activity.log(user.id, cat.companyId, 'CATEGORY_DELETE', `Kategori silindi: ${removed.name}`, { categoryId: id });
    return { success: true };
  }
}
