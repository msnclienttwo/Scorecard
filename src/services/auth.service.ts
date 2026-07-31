import { api } from './api';
import type { User } from '@/types';

export class AuthService {
  static async login(
    email: string,
    password: string
  ): Promise<{ token: string; user: User }> {
    const response = await api.post<{ token: string; user: User }>('/api/auth/login', {
      email,
      password,
    });
    return response.data!;
  }

  static async register(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ token: string; user: User }> {
    const response = await api.post<{ token: string; user: User }>(
      '/api/auth/register',
      data
    );
    return response.data!;
  }

  static async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/api/auth/forgot-password', {
      email,
    });
    return response.data!;
  }

  static async resetPassword(
    token: string,
    password: string
  ): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/api/auth/reset-password', {
      token,
      password,
    });
    return response.data!;
  }

  static async getMe(): Promise<User> {
    const response = await api.get<User>('/api/auth/me');
    return response.data!;
  }

  static async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put<User>('/api/auth/profile', data);
    return response.data!;
  }

  static async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    const response = await api.put<{ message: string }>(
      '/api/auth/change-password',
      data
    );
    return response.data!;
  }
}
