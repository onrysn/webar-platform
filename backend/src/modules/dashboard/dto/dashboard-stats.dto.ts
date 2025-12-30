export class StorageStatsDto {
  used: string;
  unit: string;
  percentage: number;
}

export class DashboardStatsDto {
  totalCompanies: number;
  activeScenes: number;
  totalUsers: number;
  storage: StorageStatsDto;
}

export class ActivityDto {
  id: number;
  action: string;
  description?: string;
  user: string;
  date: Date;
  status: string;
}

export class ChartDataDto {
  date: string;
  count: number;
}