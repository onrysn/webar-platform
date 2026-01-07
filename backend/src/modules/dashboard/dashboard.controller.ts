import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { User } from 'src/common/decorators/current-user.decorator';
import type { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard) // Hem Token hem Rol kontrolü
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR) // Member dashboard görmesin (İş kuralına göre değişebilir)
  @ApiOperation({ summary: 'Dashboard istatistik kartları verisi' })
  async getStats(@User() user: CurrentUser) {
    // Servise kullanıcıyı gönderiyoruz, filtreleme orada yapılacak
    return this.dashboardService.getStats(user);
  }

  @Get('activities')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Son aktiviteler listesi (Görüntülenmeler hariç)' })
  async getActivities(@User() user: CurrentUser) {
    return this.dashboardService.getRecentActivities(user);
  }

  @Get('chart')
  @Roles(Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Son 7 günün görüntülenme grafiği verisi' })
  async getChartData(@User() user: CurrentUser) {
    return this.dashboardService.getChartData(user);
  }
}