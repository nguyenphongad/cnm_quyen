import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Bars3Icon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline';
import api from '@/services/api';

interface HeaderProps {
  toggleSidebar?: () => void;
  toggleSidebarCollapse?: () => void;
  isSidebarCollapsed?: boolean;
}

const Header = ({ toggleSidebar, toggleSidebarCollapse, isSidebarCollapsed }: HeaderProps) => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  // Lấy số lượng thông báo chưa đọc khi component được mount
  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      try {
        const response = await api.get('/notifications/', {
          params: { is_read: false }
        });
        
        // Đếm số lượng thông báo chưa đọc
        if (response.data && response.data.results) {
          setUnreadNotifications(response.data.results.length);
        } else if (response.data && Array.isArray(response.data)) {
          // Nếu API không phân trang
          setUnreadNotifications(response.data.length);
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông báo chưa đọc:', error);
      }
    };

    if (user) {
      fetchUnreadNotifications();
    }
  }, [user]);

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Mở menu</span>
              <Bars3Icon className="h-6 w-6" />
            </button>
            
            {/* Desktop sidebar toggle button */}
            {toggleSidebarCollapse && (
              <button
                type="button"
                onClick={toggleSidebarCollapse}
                className="hidden md:inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none ml-1"
              >
                <span className="sr-only">{isSidebarCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}</span>
                {isSidebarCollapsed ? (
                  <ChevronDoubleRightIcon className="h-5 w-5" />
                ) : (
                  <ChevronDoubleLeftIcon className="h-5 w-5" />
                )}
              </button>
            )}
            
            <div className="ml-6 flex items-center">
              <span className="text-lg font-semibold text-gray-900">
                Quản lý hoạt động Đoàn viên
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Link to="/notifications" className="text-gray-400 hover:text-gray-500 relative">
              <span className="sr-only">Xem thông báo</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {/* {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center text-xs text-white font-semibold">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )} */}
            </Link>

            {/* Profile dropdown */}
            <div className="relative">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <button 
                    onClick={toggleProfileMenu}
                    className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {user?.full_name?.charAt(0) || 'U'}
                  </button>
                </div>
                
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-gray-900">{user?.full_name}</div>
                  <div className="text-xs text-gray-500">
                    {user?.role === 'ADMIN' && 'Quản trị viên'}
                    {user?.role === 'CAN_BO_DOAN' && 'Cán bộ Đoàn'}
                    {user?.role === 'DOAN_VIEN' && 'Đoàn viên'}
                  </div>
                </div>
                
                <button
                  onClick={logout}
                  className="text-sm text-red-600 hover:text-red-900"
                >
                  Đăng xuất
                </button>
              </div>
              
              {/* Dropdown menu */}
              {showProfileMenu && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-50">
                  <div className="py-1">
                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Hồ sơ cá nhân
                    </Link>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 