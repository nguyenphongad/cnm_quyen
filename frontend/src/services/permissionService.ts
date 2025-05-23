import api from './api';
import { User } from './userService';

export interface Permission {
  id: number;
  name: string;
  description: string;
  module: string;
  roles: string[];
}

export interface RolePermission {
  role: string;
  permissions: number[];
}

export const getAllPermissions = async (): Promise<Permission[]> => {
  try {
    const response = await api.get('/permissions/');
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách quyền:', error);
    throw error;
  }
};

export const getPermissionById = async (id: number): Promise<Permission> => {
  try {
    const response = await api.get(`/permissions/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy thông tin quyền id=${id}:`, error);
    throw error;
  }
};

export const createPermission = async (permissionData: Omit<Permission, 'id'>): Promise<Permission> => {
  try {
    const response = await api.post('/permissions/', permissionData);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo quyền mới:', error);
    throw error;
  }
};

export const updatePermission = async (
  id: number, 
  permissionData: Partial<Omit<Permission, 'id'>>
): Promise<Permission> => {
  try {
    const response = await api.patch(`/permissions/${id}/`, permissionData);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi cập nhật quyền id=${id}:`, error);
    throw error;
  }
};

export const deletePermission = async (id: number): Promise<void> => {
  try {
    await api.delete(`/permissions/${id}/`);
  } catch (error) {
    console.error(`Lỗi khi xóa quyền id=${id}:`, error);
    throw error;
  }
};

// Lấy danh sách quyền theo vai trò
export const getPermissionsByRole = async (role: string): Promise<Permission[]> => {
  try {
    const response = await api.get(`/permissions/?role=${role}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy danh sách quyền cho vai trò ${role}:`, error);
    throw error;
  }
};

// Thêm quyền cho vai trò
export const addPermissionToRole = async (role: string, permissionId: number): Promise<void> => {
  try {
    await api.post(`/roles/${role}/permissions/`, { permission_id: permissionId });
  } catch (error) {
    console.error(`Lỗi khi thêm quyền cho vai trò ${role}:`, error);
    throw error;
  }
};

// Xóa quyền khỏi vai trò
export const removePermissionFromRole = async (role: string, permissionId: number): Promise<void> => {
  try {
    await api.delete(`/roles/${role}/permissions/${permissionId}/`);
  } catch (error) {
    console.error(`Lỗi khi xóa quyền khỏi vai trò ${role}:`, error);
    throw error;
  }
}; 