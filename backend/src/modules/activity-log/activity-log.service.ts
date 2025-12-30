import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ActivityLogService {
  constructor(private prisma: PrismaService) {}

  async log(userId: number, action: string, description: string, metadata?: any) {
    return this.prisma.activityLog.create({
      data: {
        userId,
        action,
        description,
        metadata: metadata || {},
      },
    });
  }

  /**
   * Son aktiviteleri getirir.
   * @param limit Kaç adet kayıt getirileceği
   * @param excludeActions Listede görmek istemediğin aksiyon tipleri (örn: ['VIEW_SCENE'])
   */
  async getLatest(limit: number = 5, excludeActions: string[] = []) {
    return this.prisma.activityLog.findMany({
      take: limit,
      where: excludeActions.length > 0 
        ? { action: { notIn: excludeActions } }
        : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, role: true }
        }
      }
    });
  }

  /**
   * Grafik verisi için belirli bir tarih aralığındaki spesifik aksiyonları getirir.
   * @param action Filtrelenecek aksiyon (örn: 'VIEW_SCENE')
   * @param startDate Başlangıç tarihi
   */
  async getLogsByAction(action: string, startDate: Date) {
    return this.prisma.activityLog.findMany({
      where: {
        action: action,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' }
    });
  }
}