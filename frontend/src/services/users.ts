import { PaginatedResponse, User, UserCreate, UserUpdate } from '@/types';
import api from './api';

export const getUsers = async (): Promise<PaginatedResponse<User>> => {
  const response = await api.get<PaginatedResponse<User>>('/users/');
  return response.data;
};

export const getUserById = async (id: number): Promise<User> => {
  const response = await api.get<User>(`/users/${id}/`);
  return response.data;
};

export const createUser = async (user: UserCreate): Promise<User> => {
  const response = await api.post<User>('/users/', user);
  return response.data;
};

export const updateUser = async (id: number, user: UserUpdate): Promise<User> => {
  const response = await api.patch<User>(`/users/${id}/`, user);
  return response.data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`/users/${id}/`);
};

export const searchUsers = async (query: string): Promise<PaginatedResponse<User>> => {
  const response = await api.get<PaginatedResponse<User>>('/users/search/', {
    params: { q: query },
  });
  return response.data;
}; 