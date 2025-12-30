import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Dashboard istatistik kartları verisi' })
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('activities')
  @ApiOperation({ summary: 'Son aktiviteler listesi (Görüntülenmeler hariç)' })
  async getActivities() {
    return this.dashboardService.getRecentActivities();
  }

  @Get('chart')
  @ApiOperation({ summary: 'Son 7 günün görüntülenme grafiği verisi' })
  async getChartData() {
    return this.dashboardService.getChartData();
  }
}