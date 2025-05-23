import api from './api';
import { PaginatedResponse, Schedule } from '@/types';

/**
 * Lấy danh sách lịch công tác
 */
export const getWorkSchedules = async (
  page = 1, 
  pageSize = 20, 
  startDate?: string, 
  endDate?: string
): Promise<PaginatedResponse<Schedule>> => {
  try {
    const params: Record<string, any> = {
      page,
      page_size: pageSize
    };
    
    if (startDate) {
      params.start_date = startDate;
    }
    
    if (endDate) {
      params.end_date = endDate;
    }
    
    const response = await api.get('/work-schedules/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching work schedules:', error);
    throw error;
  }
};

/**
 * Lấy chi tiết lịch công tác
 */
export const getWorkSchedule = async (id: number): Promise<Schedule> => {
  try {
    const response = await api.get(`/work-schedules/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching work schedule ${id}:`, error);
    throw error;
  }
};

/**
 * Tạo lịch công tác mới (chỉ cho Admin và Cán bộ Đoàn)
 */
export const createWorkSchedule = async (data: Partial<Schedule>): Promise<Schedule> => {
  try {
    const response = await api.post('/work-schedules/', data);
    return response.data;
  } catch (error) {
    console.error('Error creating work schedule:', error);
    throw error;
  }
};

/**
 * Cập nhật lịch công tác (chỉ cho Admin và Cán bộ Đoàn)
 */
export const updateWorkSchedule = async (id: number, data: Partial<Schedule>): Promise<Schedule> => {
  try {
    const response = await api.put(`/work-schedules/${id}/`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating work schedule ${id}:`, error);
    throw error;
  }
};

/**
 * Xóa lịch công tác (chỉ cho Admin và Cán bộ Đoàn)
 */
export const deleteWorkSchedule = async (id: number): Promise<void> => {
  try {
    await api.delete(`/work-schedules/${id}/`);
  } catch (error) {
    console.error(`Error deleting work schedule ${id}:`, error);
    throw error;
  }
}; 