import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class ActivityLogService {
  constructor(private prisma: PrismaService) {}

  /**
   * Log oluşturma (Değişiklik yok)
   */
  async log(userId: number | null, companyId: number | null, action: string, description: string, metadata?: any) {
    return this.prisma.activityLog.create({
      data: {
        action,
        description,
        metadata: metadata || {},
        userId,
        companyId,
      },
    });
  }

  /**
   * GÜNCELLENDİ: Yeni Role Enum'ına göre yetki filtresi
   */
  private getPermissionFilter(user: CurrentUser): Prisma.ActivityLogWhereInput {
    if (user.role === Role.SUPER_ADMIN) {
      return {}; 
    }

    if (user.role === Role.COMPANY_ADMIN) {
      return { companyId: user.companyId };
    }

    return { userId: user.id };
  }

  /**
   * Son aktiviteleri getirir
   */
  async getLatest(user: CurrentUser, limit: number = 5, excludeActions: string[] = []) {
    const permissionFilter = this.getPermissionFilter(user);

    return this.prisma.activityLog.findMany({
      take: limit,
      where: {
        ...permissionFilter,
        ...(excludeActions.length > 0 ? { action: { notIn: excludeActions } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, role: true, email: true }
        }
      }
    });
  }

  /**
   * İstatistik verisi için
   */
  async getLogsByAction(user: CurrentUser, action: string, startDate: Date) {
    const permissionFilter = this.getPermissionFilter(user);

    return this.prisma.activityLog.findMany({
      where: {
        ...permissionFilter,
        action: action,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });
  }
}