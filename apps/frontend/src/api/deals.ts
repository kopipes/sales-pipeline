import { api } from './client';
import type { Deal } from '../types';

export const dealsApi = {
  getAll: (params?: { stageId?: string; dealTypeId?: string; search?: string }) =>
    api.get<Deal[]>('/deals', { params }).then((r) => r.data),

  getOne: (id: string) => api.get<Deal>(`/deals/${id}`).then((r) => r.data),

  getAtRisk: () => api.get('/deals/at-risk').then((r) => r.data),

  create: (data: Partial<Deal>) => api.post<Deal>('/deals', data).then((r) => r.data),

  update: (id: string, data: Partial<Deal>) =>
    api.put<Deal>(`/deals/${id}`, data).then((r) => r.data),

  changeStage: (id: string, toStageId: string, note?: string) =>
    api
      .post(`/deals/${id}/change-stage`, { toStageId, note })
      .then((r) => r.data),

  remove: (id: string) => api.delete(`/deals/${id}`).then((r) => r.data),
};
