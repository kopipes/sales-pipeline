import { api } from './client';

export const adminApi = {
  // Roles
  getRoles: () => api.get('/admin/roles').then((r) => r.data),

  // Divisions CRUD
  getDivisions: () => api.get('/divisions').then((r) => r.data),
  createDivision: (data: { name: string; code: string; colorTag?: string }) =>
    api.post('/divisions', data).then((r) => r.data),
  updateDivision: (id: string, data: any) =>
    api.put(`/divisions/${id}`, data).then((r) => r.data),
  deleteDivision: (id: string) =>
    api.delete(`/divisions/${id}`).then((r) => r.data),
};
