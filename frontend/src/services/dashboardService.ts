// src/services/dashboardService.ts
import { apiService } from './httpService/apiService';
import type { DashboardStats, ActivityLog, ChartData } from '../modules/dashboard/dto/dashboard.dto';

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await apiService.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },

  async getActivities(): Promise<ActivityLog[]> {
    const response = await apiService.get<ActivityLog[]>('/dashboard/activities');
    return response.data;
  },

  async getChartData(): Promise<ChartData[]> {
    const response = await apiService.get<ChartData[]>('/dashboard/chart');
    return response.data;
  }
};