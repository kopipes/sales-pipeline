import { api } from './client';
import type { Activity } from '../types';

export const activitiesApi = {
  getAll: (params?: { companyId?: string; dealId?: string; search?: string; medium?: string; dateFrom?: string; dateTo?: string }) =>
    api.get<Activity[]>('/activities', { params }).then((r) => r.data),

  getOne: (id: string) => api.get<Activity>(`/activities/${id}`).then((r) => r.data),

  create: (data: Partial<Activity> & { activityDate: string; medium: string; objective: string; companyId: string }) =>
    api.post<Activity>('/activities', data).then((r) => r.data),

  update: (id: string, data: Partial<Activity>) =>
    api.put<Activity>(`/activities/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete(`/activities/${id}`).then((r) => r.data),

  promoteToDeal: (id: string, data: { dealName?: string; dealTypeId: string; estimatedValue?: number; probabilityPct?: number; ipAssetName?: string; jobCategoryId?: string; billingType?: string }) =>
    api.post(`/activities/${id}/promote-to-deal`, data).then((r) => r.data),
};
