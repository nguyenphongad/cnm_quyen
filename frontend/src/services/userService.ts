import api from './api';
import { UserRole } from '@/types';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  date_joined: string;
  last_login?: string;
  phone_number?: string;
  address?: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  full_name: string;
  password: string;
  role: UserRole;
  phone_number?: string;
  address?: string;
}

export interface UpdateUserData {
  email?: string;
  full_name?: string;
  role?: UserRole;
  is_active?: boolean;
  phone_number?: string;
  address?: string;
}

// Interface cho cấu trúc phân trang từ Django REST framework
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getAllUsers = async (): Promise<PaginatedResponse<User>> => {
  try {
    const response = await api.get('/users/');
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách người dùng:', error);
    throw error;
  }
};

export const getUserById = async (id: number): Promise<User> => {
  try {
    const response = await api.get(`/users/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy thông tin người dùng id=${id}:`, error);
    throw error;
  }
};

export const createUser = async (userData: CreateUserData): Promise<User> => {
  try {
    const response = await api.post('/users/', userData);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo người dùng mới:', error);
    throw error;
  }
};

export const updateUser = async (id: number, userData: UpdateUserData): Promise<User> => {
  try {
    const response = await api.patch(`/users/${id}/`, userData);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi cập nhật người dùng id=${id}:`, error);
    throw error;
  }
};

export const deleteUser = async (id: number): Promise<void> => {
  try {
    await api.delete(`/users/${id}/`);
  } catch (error) {
    console.error(`Lỗi khi xóa người dùng id=${id}:`, error);
    throw error;
  }
};

export const resetUserPassword = async (id: number): Promise<void> => {
  try {
    await api.post(`/users/${id}/reset-password/`);
  } catch (error) {
    console.error(`Lỗi khi reset mật khẩu người dùng id=${id}:`, error);
    throw error;
  }
};

export const searchUsers = async (query: string): Promise<User[]> => {
  try {
    const response = await api.get(`/users/search/?q=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tìm kiếm người dùng:', error);
    throw error;
  }
}; 