import { api } from './client';
import type { LoginResponse, User } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data),

  getProfile: () =>
    api.get<User>('/auth/profile').then((r) => r.data),
};
