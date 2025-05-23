import React, { useState, useEffect } from 'react';
import { BellIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/dateUtils';
import { Notification } from '@/types';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/services/notificationService';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        const response = await getNotifications(page);
        setNotifications(response.results);
        setTotalCount(response.count);
        setHasMore(!!response.next);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        alert('Không thể tải thông báo');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [page]);

  const loadMore = () => {
    if (hasMore && !isLoading) {
      setPage(prev => prev + 1);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(
        notifications.map(notification =>
          notification.id === id ? { ...notification, is_read: true } : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      alert('Không thể đánh dấu thông báo đã đọc');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(
        notifications.map(notification => ({ ...notification, is_read: true }))
      );
      alert('Đã đánh dấu tất cả thông báo là đã đọc');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      alert('Không thể đánh dấu tất cả thông báo đã đọc');
    }
  };

  return (
    <div className="py-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">Thông báo & Kế hoạch</h1>
          <p className="mt-1 text-sm text-gray-500">
            Theo dõi thông báo và kế hoạch hoạt động
          </p>
        </div>
        {notifications.some(n => !n.is_read) && (
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="btn btn-secondary btn-sm flex items-center"
            >
              <CheckCircleIcon className="w-5 h-5 mr-1" />
              Đánh dấu tất cả là đã đọc
            </button>
          </div>
        )}
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {isLoading && page === 1 ? (
          <div className="h-60 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Không có thông báo nào</h3>
            <p className="mt-1 text-sm text-gray-500">Thông báo mới sẽ xuất hiện ở đây.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div key={notification.id} className={`p-6 ${notification.is_read ? 'bg-white' : 'bg-blue-50'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`text-gray-900 ${!notification.is_read ? 'font-medium' : ''}`}>
                      {notification.content}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(notification.created_at, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  
                  {!notification.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {hasMore && (
              <div className="text-center py-4">
                <button 
                  onClick={loadMore}
                  className="px-4 py-2 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang tải...' : 'Tải thêm'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage; 