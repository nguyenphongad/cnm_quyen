import api from './api';

export interface SystemConfig {
  id: number;
  key: string;
  value: string;
  description: string;
  group: string;
  is_editable: boolean;
  updated_at: string;
}

export interface CreateSystemConfigData {
  key: string;
  value: string;
  description: string;
  group: string;
  is_editable?: boolean;
}

export interface UpdateSystemConfigData {
  value?: string;
  description?: string;
  group?: string;
  is_editable?: boolean;
}

export const getAllSystemConfigs = async (): Promise<SystemConfig[]> => {
  try {
    const response = await api.get('/system-configs/');
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách cấu hình hệ thống:', error);
    throw error;
  }
};

export const getSystemConfigById = async (id: number): Promise<SystemConfig> => {
  try {
    const response = await api.get(`/system-configs/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy thông tin cấu hình hệ thống id=${id}:`, error);
    throw error;
  }
};

export const getSystemConfigByKey = async (key: string): Promise<SystemConfig> => {
  try {
    const response = await api.get(`/system-configs/by-key/${key}/`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy thông tin cấu hình hệ thống với key=${key}:`, error);
    throw error;
  }
};

export const createSystemConfig = async (configData: CreateSystemConfigData): Promise<SystemConfig> => {
  try {
    const response = await api.post('/system-configs/', configData);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo cấu hình hệ thống mới:', error);
    throw error;
  }
};

export const updateSystemConfig = async (
  id: number, 
  configData: UpdateSystemConfigData
): Promise<SystemConfig> => {
  try {
    const response = await api.patch(`/system-configs/${id}/`, configData);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi cập nhật cấu hình hệ thống id=${id}:`, error);
    throw error;
  }
};

export const deleteSystemConfig = async (id: number): Promise<void> => {
  try {
    await api.delete(`/system-configs/${id}/`);
  } catch (error) {
    console.error(`Lỗi khi xóa cấu hình hệ thống id=${id}:`, error);
    throw error;
  }
};

// Lấy cấu hình theo nhóm
export const getSystemConfigsByGroup = async (group: string): Promise<SystemConfig[]> => {
  try {
    const response = await api.get(`/system-configs/?group=${group}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy cấu hình hệ thống theo nhóm ${group}:`, error);
    throw error;
  }
}; 