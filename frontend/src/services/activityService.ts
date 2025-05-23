import api from './api';
import { Activity, ActivityStatus, PaginatedResponse, RegistrationStatus } from '@/types';
import axios, { AxiosError } from 'axios';

// Helper function để xử lý lỗi một cách an toàn với type
const logApiError = (message: string, error: unknown): void => {
  console.error(message, error);
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    console.error('Response status:', axiosError.response?.status);
    console.error('Response data:', axiosError.response?.data);
  }
};

export interface ActivityRegistration {
  id: number;
  user: {
    id: number;
    full_name: string;
    username: string;
  };
  activity: {
    id: number;
    title: string;
  };
  registration_date: string;
  status: RegistrationStatus;
  attendance: boolean;
  feedback?: string;
  rating?: number;
}

export interface ActivityStats {
  // camelCase (front-end)
  totalActivities: number;
  upcomingActivities: number;
  ongoingActivities: number;
  completedActivities: number;
  totalParticipants: number;
  averageParticipation: number;
  activityByType: Array<{ type: string; count: number }>;
  
  // snake_case (từ backend - API)
  total_activities?: number;
  upcoming_activities?: number;
  ongoing_activities?: number;
  completed_activities?: number;
  total_participants?: number;
  average_participation?: number;
  activity_by_type?: Array<{ type: string; count: number }>;
}

/**
 * Lấy danh sách hoạt động
 */
export const getActivities = async (
  page: number = 1,
  pageSize: number = 10,
  status?: ActivityStatus,
  type?: string,
  search?: string
): Promise<PaginatedResponse<Activity>> => {
  try {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());
    
    if (status) {
      params.append('status', status);
    }
    
    if (type) {
      params.append('type', type);
    }
    
    if (search) {
      params.append('search', search);
    }
    
    const response = await api.get(`/activities/?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw error;
  }
};

/**
 * Lấy chi tiết hoạt động
 */
export const getActivity = async (id: number): Promise<Activity> => {
  try {
    console.log(`Making API request to /activities/${id}/`);
    const response = await api.get(`/activities/${id}/`);
    console.log('Activity API response:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching activity ${id}:`, error);
    throw error;
  }
};

/**
 * Tạo hoạt động mới
 */
export const createActivity = async (activityData: Partial<Activity> | FormData): Promise<Activity> => {
  try {
    const headers = activityData instanceof FormData ? 
      { 'Content-Type': 'multipart/form-data' } : 
      { 'Content-Type': 'application/json' };
    
    // Log dữ liệu activity, bao gồm cả trường send_notification
    if (activityData instanceof FormData) {
      console.log('Creating activity with notification option:', activityData.get('send_notification'));
    } else {
      console.log('Creating activity with data:', activityData);
    }
    
    const response = await api.post('/activities/', activityData, { headers });
    return response.data;
  } catch (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
};

/**
 * Cập nhật thông tin hoạt động
 */
export const updateActivity = async (id: number, activityData: Partial<Activity> | FormData): Promise<Activity> => {
  try {
    const headers = activityData instanceof FormData ? 
      { 'Content-Type': 'multipart/form-data' } : 
      { 'Content-Type': 'application/json' };
    
    // Log dữ liệu activity khi cập nhật, bao gồm cả trường send_notification
    if (activityData instanceof FormData) {
      console.log(`Updating activity ${id} with notification option:`, activityData.get('send_notification'));
    } else {
      console.log(`Updating activity ${id} with data:`, activityData);
    }
    
    const response = await api.put(`/activities/${id}/`, activityData, { headers });
    return response.data;
  } catch (error) {
    console.error(`Error updating activity ${id}:`, error);
    throw error;
  }
};

/**
 * Xóa hoạt động
 */
export const deleteActivity = async (id: number): Promise<void> => {
  try {
    await api.delete(`/activities/${id}/`);
  } catch (error) {
    console.error(`Error deleting activity ${id}:`, error);
    throw error;
  }
};

/**
 * Đăng ký tham gia hoạt động
 */
export const registerForActivity = async (activityId: number, registrationData?: {
  reason?: string;
  phoneNumber?: string;
  emergencyContact?: string;
  dietaryRequirements?: string;
  additionalInfo?: string;
}): Promise<any> => {
  try {
    // API URL đúng là /activities/{id}/register/ không có tiền tố /api/
    // vì đã được cấu hình trong API_URL của api.ts
    console.log(`Đăng ký tham gia hoạt động ${activityId}`);
    console.log(`Gửi request đến: ${api.defaults.baseURL}/activities/${activityId}/register/`);
    
    // Gửi kèm thông tin bổ sung nếu có
    let response;
    if (registrationData) {
      console.log('Thông tin đăng ký bổ sung:', registrationData);
      response = await api.post(`/activities/${activityId}/register/`, registrationData);
    } else {
      response = await api.post(`/activities/${activityId}/register/`);
    }
    
    console.log(`Đăng ký thành công cho hoạt động ${activityId}`);
    return response.data;
  } catch (error: unknown) {
    logApiError(`Error registering for activity ${activityId}:`, error);
    
    // Nếu lỗi là do người dùng đã đăng ký trước đó, xử lý đặc biệt
    if (axios.isAxiosError(error) && error.response?.data) {
      console.log("Phản hồi lỗi từ server:", error.response.data);
      
      // Trích xuất thông tin trạng thái đăng ký từ phản hồi lỗi
      const errorData = error.response.data;
      const registrationStatus = errorData.status || '';
      
      // Ghi log chi tiết
      console.log(`Registration status from error response: '${registrationStatus}'`);
      
      // Trả về lỗi từ server để frontend hiển thị
      throw {
        message: errorData.detail || 'Có lỗi xảy ra khi đăng ký tham gia hoạt động',
        status: registrationStatus,
        code: error.response.status,
        registration_id: errorData.registration_id
      };
    }
    
    throw error;
  }
};

/**
 * Hủy đăng ký tham gia hoạt động
 */
export const cancelRegistration = async (activityId: number): Promise<void> => {
  try {
    // API URL đúng là /activities/{id}/cancel-registration/ không có tiền tố /api/
    // vì đã được cấu hình trong API_URL của api.ts
    console.log(`Hủy đăng ký tham gia hoạt động ${activityId}`);
    console.log(`Gửi request đến: ${api.defaults.baseURL}/activities/${activityId}/cancel-registration/`);
    
    await api.post(`/activities/${activityId}/cancel-registration/`);
    console.log(`Hủy đăng ký thành công cho hoạt động ${activityId}`);
  } catch (error) {
    logApiError(`Error canceling registration for activity ${activityId}:`, error);
    throw error;
  }
};

/**
 * Lấy danh sách đăng ký tham gia hoạt động
 */
export const getActivityRegistrations = async (
  activityId: number,
  page = 1,
  pageSize = 10
): Promise<PaginatedResponse<ActivityRegistration>> => {
  try {
    const response = await api.get(`/activities/${activityId}/registrations/`, {
      params: {
        page,
        page_size: pageSize
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching registrations for activity ${activityId}:`, error);
    throw error;
  }
};

/**
 * Đánh dấu tham gia hoạt động
 */
export const markAttendance = async (
  activityId: number,
  userId: number,
  attended: boolean
): Promise<void> => {
  try {
    await api.post(`/activities/${activityId}/attendance/`, {
      user_id: userId,
      attended
    });
  } catch (error) {
    console.error(`Error marking attendance for activity ${activityId}:`, error);
    throw error;
  }
};

/**
 * Lấy thống kê hoạt động
 */
export const getActivityStats = async (): Promise<ActivityStats> => {
  try {
    const response = await api.get('/dashboard/stats/');
    const data = response.data;
    
    // Kiểm tra và chuyển đổi định dạng dữ liệu
    // Backend trả về activity_stats trong một đối tượng lớn hơn
    const activityStatsData = data.activity_stats || data;
    
    const normalizedData: ActivityStats = {
      totalActivities: activityStatsData.totalActivities || activityStatsData.total_activities || activityStatsData.total || 0,
      upcomingActivities: activityStatsData.upcomingActivities || activityStatsData.upcoming_activities || activityStatsData.upcoming || 0,
      ongoingActivities: activityStatsData.ongoingActivities || activityStatsData.ongoing_activities || activityStatsData.ongoing || 0,
      completedActivities: activityStatsData.completedActivities || activityStatsData.completed_activities || activityStatsData.completed || 0,
      totalParticipants: activityStatsData.totalParticipants || activityStatsData.total_participants || activityStatsData.participants || 0,
      averageParticipation: activityStatsData.averageParticipation || activityStatsData.average_participation || activityStatsData.average || 0,
      activityByType: activityStatsData.activityByType || activityStatsData.activity_by_type || activityStatsData.by_type || []
    };
    
    console.log("Dữ liệu thống kê đã chuẩn hóa:", normalizedData);
    return normalizedData;
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    // Trả về dữ liệu mặc định nếu có lỗi
    return {
      totalActivities: 0,
      upcomingActivities: 0,
      ongoingActivities: 0,
      completedActivities: 0,
      totalParticipants: 0,
      averageParticipation: 0,
      activityByType: []
    };
  }
};

export const getActivityParticipants = async (
  activityId: number,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<any>> => {
  try {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());
    
    const response = await api.get(`/activities/${activityId}/participants/?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching participants for activity ${activityId}:`, error);
    throw error;
  }
};

export const getRegisteredActivities = async (
  page: number = 1,
  pageSize: number = 10,
  status?: string
): Promise<PaginatedResponse<Activity>> => {
  try {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());
    
    if (status) {
      params.append('status', status);
    }
    
    const response = await api.get(`/user/activities/?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching registered activities:', error);
    throw error;
  }
};

export default {
  getActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
  getActivityStats,
  registerForActivity,
  cancelRegistration,
  getActivityParticipants,
  markAttendance,
  getRegisteredActivities
}; 