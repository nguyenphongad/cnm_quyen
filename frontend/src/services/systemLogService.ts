import api from './api';

export type LogLevel = 'info' | 'warning' | 'error' | 'success';
export type LogSource = 'authentication' | 'activity' | 'system' | 'admin';

export interface SystemLog {
  id: number;
  timestamp: string;
  level: LogLevel;
  message: string;
  source: LogSource;
  user?: string;
  details?: string;
  ip_address?: string;
}

export interface SystemLogFilter {
  level?: LogLevel;
  source?: LogSource;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export const getAllSystemLogs = async (filters?: SystemLogFilter): Promise<SystemLog[]> => {
  try {
    // Xây dựng query parameters
    let url = '/system-logs/';
    const params: string[] = [];
    
    if (filters) {
      if (filters.level) params.push(`level=${filters.level}`);
      if (filters.source) params.push(`source=${filters.source}`);
      if (filters.startDate) params.push(`start_date=${filters.startDate}`);
      if (filters.endDate) params.push(`end_date=${filters.endDate}`);
      if (filters.search) params.push(`search=${encodeURIComponent(filters.search)}`);
    }
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách nhật ký hệ thống:', error);
    throw error;
  }
};

export const getSystemLogById = async (id: number): Promise<SystemLog> => {
  try {
    const response = await api.get(`/system-logs/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy thông tin nhật ký hệ thống id=${id}:`, error);
    throw error;
  }
};

export const clearSystemLogs = async (): Promise<void> => {
  try {
    await api.delete('/system-logs/');
  } catch (error) {
    console.error('Lỗi khi xóa nhật ký hệ thống:', error);
    throw error;
  }
};

export const exportSystemLogs = async (): Promise<Blob> => {
  try {
    const response = await api.get('/system-logs/export/', {
      responseType: 'blob' 
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi xuất nhật ký hệ thống:', error);
    throw error;
  }
}; 