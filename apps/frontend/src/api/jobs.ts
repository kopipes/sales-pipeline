import { api } from './client';
import type { Job } from '../types';

export const jobsApi = {
  getAll: (params?: { periodYear?: string; periodMonth?: string; companyId?: string }) =>
    api.get<Job[]>('/jobs', { params }).then((r) => r.data),

  getOne: (id: string) => api.get<Job>(`/jobs/${id}`).then((r) => r.data),

  getSummary: (periodYear?: string) =>
    api.get('/jobs/summary', { params: { periodYear } }).then((r) => r.data),

  create: (data: Partial<Job>) => api.post<Job>('/jobs', data).then((r) => r.data),

  update: (id: string, data: Partial<Job>) =>
    api.put<Job>(`/jobs/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete(`/jobs/${id}`).then((r) => r.data),
};
