import { api } from './client';
import type { KpiData, FunnelStage, DivisionPipeline, WinLoss, Activity } from '../types';

interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  divisionId?: string;
}

export const dashboardApi = {
  getKpis: (filters?: DashboardFilters) =>
    api.get<KpiData>('/dashboard/kpis', { params: filters }).then((r) => r.data),

  getFunnel: (filters?: DashboardFilters) =>
    api
      .get<{ stages: FunnelStage[]; overallConversionRate: number }>('/dashboard/funnel', {
        params: filters,
      })
      .then((r) => r.data),

  getPipelineByDivision: (filters?: DashboardFilters) =>
    api
      .get<DivisionPipeline[]>('/dashboard/pipeline-by-division', { params: filters })
      .then((r) => r.data),

  getWinLoss: (filters?: DashboardFilters) =>
    api.get<WinLoss>('/dashboard/win-loss', { params: filters }).then((r) => r.data),

  getRecentActivities: (filters?: { divisionId?: string }) =>
    api
      .get<Activity[]>('/dashboard/recent-activities', { params: filters })
      .then((r) => r.data),

  getOverview: (filters?: DashboardFilters) =>
    api.get('/dashboard/overview', { params: filters }).then((r) => r.data),
};
