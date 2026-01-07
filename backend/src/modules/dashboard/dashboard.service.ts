import { Injectable } from '@nestjs/common';
import { DashboardStatsDto, ActivityDto, ChartDataDto } from './dto/dashboard-stats.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, Prisma } from '@prisma/client'; // Prisma namespace'ini ekledik

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityLogService
  ) { }

  async getStats(user: CurrentUser): Promise<DashboardStatsDto> {
    const isSuperAdmin = user.role === Role.SUPER_ADMIN;

    let companyWhere: Prisma.CompanyWhereInput = { isDeleted: false };
    let commonWhere: Prisma.ARSceneWhereInput = { isDeleted: false };

    if (!isSuperAdmin) {
      // Eğer Super Admin değilse ve companyId yoksa bu bir hatadır veya boş dönmelidir.
      if (!user.companyId) {
        return {
          totalCompanies: 0,
          activeScenes: 0,
          totalUsers: 0,
          storage: { used: '0.00', unit: 'GB', percentage: 0 }
        };
      }

      // TypeScript'e bunun artık 'number' olduğunu garanti ediyoruz (!)
      companyWhere = {
        id: user.companyId,
        isDeleted: false
      };

      commonWhere = {
        companyId: user.companyId,
        isDeleted: false
      };
    }

    // 2. PARALEL SORGULAR
    const [companyCount, activeSceneCount, userCount, modelsAggregate] = await Promise.all([
      this.prisma.company.count({ where: companyWhere }),
      this.prisma.aRScene.count({ where: commonWhere }),
      this.prisma.user.count({ where: { ...commonWhere, companyId: commonWhere.companyId } as Prisma.UserWhereInput }), // User için tip uyumu
      this.prisma.aRModel.aggregate({
        where: commonWhere as Prisma.ARModelWhereInput, // Tip dönüşümü
        _sum: { fileSize: true },
      }),
    ]);

    const totalBytes = modelsAggregate._sum?.fileSize ?? 0;

    const totalGB = (totalBytes / (1024 * 1024 * 1024)).toFixed(2);
    const limitGB = 5;
    const percentage = Math.min(100, Math.round((parseFloat(totalGB) / limitGB) * 100));

    return {
      totalCompanies: companyCount,
      activeScenes: activeSceneCount,
      totalUsers: userCount,
      storage: {
        used: totalGB,
        unit: 'GB',
        percentage: percentage,
      },
    };
  }

  async getRecentActivities(user: CurrentUser): Promise<ActivityDto[]> {
    const logs = await this.activityService.getLatest(user, 10, ['VIEW_SCENE']);

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      description: log.description,
      user: log.user?.name || 'Sistem',
      date: log.createdAt,
      status: 'Tamamlandı',
    }));
  }

  async getChartData(user: CurrentUser): Promise<ChartDataDto[]> {
    const today = new Date();
    const last7Days = new Date();
    last7Days.setDate(today.getDate() - 6);
    last7Days.setHours(0, 0, 0, 0);

    const logs = await this.activityService.getLogsByAction(user, 'VIEW_SCENE', last7Days);

    const grouped = logs.reduce((acc, log) => {
      const dateKey = log.createdAt.toISOString().split('T')[0];
      acc[dateKey] = (acc[dateKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const chartData: ChartDataDto[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() - (6 - i));
      const dateKey = d.toISOString().split('T')[0];
      chartData.push({
        date: dateKey,
        count: grouped[dateKey] || 0,
      });
    }

    return chartData;
  }
}