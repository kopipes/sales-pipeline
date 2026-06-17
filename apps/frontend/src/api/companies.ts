import { api } from './client';
import type { Company } from '../types';

export const companiesApi = {
  getAll: (params?: { search?: string; industryId?: string }) =>
    api.get<Company[]>('/companies', { params }).then((r) => r.data),

  getOne: (id: string) => api.get<Company>(`/companies/${id}`).then((r) => r.data),

  create: (data: Partial<Company> & { name: string }) =>
    api.post<Company>('/companies', data).then((r) => r.data),

  update: (id: string, data: Partial<Company>) =>
    api.put<Company>(`/companies/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete(`/companies/${id}`).then((r) => r.data),
};
