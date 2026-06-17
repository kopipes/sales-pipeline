import { api } from './client';
import type { User } from '../types';

export const usersApi = {
  getAll: () => api.get<User[]>('/users').then((r) => r.data),

  getRoles: () => api.get<Array<{ id: string; name: string; scopeLevel: string }>>('/users/roles').then((r) => r.data),

  getOne: (id: string) => api.get<User>(`/users/${id}`).then((r) => r.data),

  create: (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    jobTitle?: string;
    divisionId: string;
    roleId: string;
    managerId?: string;
  }) => api.post<User>('/users', data).then((r) => r.data),

  update: (id: string, data: Partial<User> & { password?: string }) =>
    api.put<User>(`/users/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete(`/users/${id}`).then((r) => r.data),
};
