import api from './api';
import { Notification, PaginatedResponse } from '@/types';

/**
 * Lấy danh sách thông báo
 */
export const getNotifications = async (page = 1, pageSize = 10): Promise<PaginatedResponse<Notification>> => {
  try {
    const response = await api.get('/notifications/', {
      params: { page, page_size: pageSize }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Đánh dấu thông báo đã đọc
 */
export const markNotificationAsRead = async (id: number): Promise<void> => {
  try {
    await api.patch(`/notifications/${id}/`, { is_read: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Đánh dấu tất cả thông báo đã đọc
 */
export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    await api.patch('/notifications/mark_all_read/');
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}; 