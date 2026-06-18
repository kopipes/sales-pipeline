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

  getRecentActivities: (filters?: { divisionId?: string; limit?: number; offset?: number }) =>
    api
      .get<{ items: Activity[]; total: number; limit: number; offset: number }>('/dashboard/recent-activities', { params: filters })
      .then((r) => r.data),

  getLeadSource: (filters?: DashboardFilters) =>
    api.get<{ source: string; count: number; value: number; percentage: number }[]>('/dashboard/lead-source', { params: filters }).then((r) => r.data),

  getRevenueForecast: (filters?: { year?: string; month?: string; divisionId?: string }) =>
    api.get<{ year: number; monthly: { month: number; count: number; estimatedValue: number; weightedValue: number }[] }>('/dashboard/revenue-forecast', { params: filters }).then((r) => r.data),

  getOverview: (filters?: DashboardFilters) =>
    api.get('/dashboard/overview', { params: filters }).then((r) => r.data),
};
