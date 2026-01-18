import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import type { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';
import { Role } from '@prisma/client';

@Injectable()
export class ProductSeriesService {
  constructor(private prisma: PrismaService, private activity: ActivityLogService) {}

  async list(companyId: number) {
    return this.prisma.series.findMany({
      where: { companyId, isDeleted: false },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getById(id: number) {
    return this.prisma.series.findUnique({ where: { id } });
  }

  async create(user: CurrentUser, dto: CreateSeriesDto & { companyId: number }) {
    if (user.role !== Role.SUPER_ADMIN && user.companyId !== dto.companyId) {
      throw new ForbiddenException('Bu işlem için yetkiniz yok');
    }
    const created = await this.prisma.series.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        companyId: dto.companyId,
      }
    });

    await this.activity.log(user.id, dto.companyId, 'SERIES_CREATE', `Seri oluşturuldu: ${created.name}`, { seriesId: created.id });
    return created;
  }

  async update(user: CurrentUser, id: number, dto: UpdateSeriesDto) {
    const s = await this.prisma.series.findUnique({ where: { id } });
    if (!s) throw new NotFoundException('Seri bulunamadı');
    if (user.role !== Role.SUPER_ADMIN && user.companyId !== s.companyId) {
      throw new ForbiddenException('Bu işlem için yetkiniz yok');
    }
    const updated = await this.prisma.series.update({
      where: { id },
      data: {
        name: dto.name ?? s.name,
        code: dto.code ?? s.code,
        description: dto.description ?? s.description,
      }
    });

    await this.activity.log(user.id, s.companyId, 'SERIES_UPDATE', `Seri güncellendi: ${updated.name}`, { seriesId: updated.id });
    return updated;
  }

  async remove(user: CurrentUser, id: number) {
    const s = await this.prisma.series.findUnique({ where: { id } });
    if (!s) throw new NotFoundException('Seri bulunamadı');
    if (user.role !== Role.SUPER_ADMIN && user.companyId !== s.companyId) {
      throw new ForbiddenException('Bu işlem için yetkiniz yok');
    }
    const removed = await this.prisma.series.update({ where: { id }, data: { isDeleted: true } });
    await this.activity.log(user.id, s.companyId, 'SERIES_DELETE', `Seri silindi: ${removed.name}`, { seriesId: id });
    return { success: true };
  }
}
