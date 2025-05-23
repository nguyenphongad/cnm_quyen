import api from './api';
import { User, Activity, PaginatedResponse } from '@/types';

/**
 * Lấy thông tin hồ sơ của user hiện tại
 */
export const getProfile = async (): Promise<User> => {
  try {
    const response = await api.get('/users/me/');
    return response.data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

/**
 * Cập nhật thông tin hồ sơ
 */
export const updateProfile = async (data: Partial<User>): Promise<User> => {
  try {
    const response = await api.patch('/users/me/', data);
    return response.data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

/**
 * Đổi mật khẩu
 */
export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  try {
    await api.post('/users/change-password/', {
      current_password: currentPassword,
      new_password: newPassword
    });
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

/**
 * Tải ảnh đại diện mới
 */
export const uploadAvatar = async (file: File): Promise<{ avatar: string }> => {
  try {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await api.post('/users/upload-avatar/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};

/**
 * Lấy danh sách hoạt động mà user đã tham gia
 */
export const getUserActivities = async (page = 1, pageSize = 10): Promise<PaginatedResponse<Activity>> => {
  try {
    const response = await api.get('/users/me/activities/', {
      params: { page, page_size: pageSize }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user activities:', error);
    throw error;
  }
};

/**
 * Lấy thống kê của user
 */
export interface UserStats {
  activitiesCount: number;
  activityPoints: number;
  ranking: number;
  totalMembers: number;
  badges: number;
  attendanceRate: number;
}

export const getUserStats = async (): Promise<UserStats> => {
  try {
    const response = await api.get('/users/me/stats/');
    return response.data;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
}; 