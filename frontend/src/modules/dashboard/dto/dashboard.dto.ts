export interface StorageStats {
  used: string;
  unit: string;
  percentage: number;
}

export interface DashboardStats {
  totalCompanies: number;
  activeScenes: number;
  totalUsers: number;
  storage: StorageStats;
}

export interface ActivityLog {
  id: number;
  action: string;
  description: string;
  user: string;
  date: string;
  status: string;
}

export interface ChartData {
  date: string;
  count: number;
}