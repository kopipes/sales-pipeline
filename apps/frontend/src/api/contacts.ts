import { api } from './client';
import type { Contact } from '../types';

export const contactsApi = {
  getAll: (params?: { search?: string; companyId?: string }) =>
    api.get<Contact[]>('/contacts', { params }).then((r) => r.data),

  getOne: (id: string) => api.get<Contact>(`/contacts/${id}`).then((r) => r.data),

  create: (data: Partial<Contact> & { companyId: string; fullName: string }) =>
    api.post<Contact>('/contacts', data).then((r) => r.data),

  update: (id: string, data: Partial<Contact>) =>
    api.put<Contact>(`/contacts/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete(`/contacts/${id}`).then((r) => r.data),
};
