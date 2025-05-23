import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  HomeIcon,
  CalendarIcon,
  UserGroupIcon,
  BellIcon,
  DocumentTextIcon,
  UsersIcon,
  CogIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  UserIcon,
  UserCircleIcon,
  FlagIcon,
  ChartPieIcon,
  RectangleGroupIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen?: boolean;
  toggle?: () => void;
  isCollapsed?: boolean;
  toggleCollapse?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggle, isCollapsed, toggleCollapse }) => {
  const { pathname } = useLocation();
  const { user } = useAuth();

  // Xử lý đóng sidebar sau khi chuyển trang trên mobile
  React.useEffect(() => {
    if (window.innerWidth < 768 && toggle) {
      toggle();
    }
  }, [pathname, toggle]);

  const getMenuItems = () => {
    // Menu items cho DoanVien
    if (user?.role === 'DOAN_VIEN') {
      return [
        { name: 'Trang chủ', path: '/home', icon: HomeIcon },
        { name: 'Bảng điều khiển', path: '/dashboard', icon: RectangleGroupIcon },
        { name: 'Thông báo & Kế hoạch', path: '/notifications', icon: BellIcon },
        { name: 'Lịch công tác', path: '/calendar', icon: CalendarIcon },
        { name: 'Hoạt động', path: '/activities', icon: FlagIcon },
        { name: 'Sổ đoàn viên', path: '/member-book', icon: DocumentTextIcon },
        { name: 'Hồ sơ cá nhân', path: '/profile', icon: UserCircleIcon },
      ];
    }
    
    // Menu items cho CanBoDoan
    if (user?.role === 'CAN_BO_DOAN') {
      return [
        { name: 'Trang chủ', path: '/home', icon: HomeIcon },
        { name: 'Bảng điều khiển', path: '/dashboard', icon: RectangleGroupIcon },
        { name: 'Thông báo & Kế hoạch', path: '/notifications', icon: BellIcon },
        { name: 'Lịch công tác', path: '/calendar', icon: CalendarIcon },
        { name: 'Quản lý hoạt động', path: '/activities-management', icon: FlagIcon },
        { name: 'Quản lý đoàn viên', path: '/members', icon: UserGroupIcon },
        { name: 'Đăng bài', path: '/posts', icon: DocumentTextIcon },
        { name: 'Báo cáo & Thống kê', path: '/reports', icon: ChartPieIcon },
        { name: 'Hồ sơ cá nhân', path: '/profile', icon: UserCircleIcon },
      ];
    }
    
    // Menu items cho Admin
    if (user?.role === 'ADMIN') {
      return [
        { name: 'Trang chủ', path: '/home', icon: HomeIcon },
        { name: 'Bảng điều khiển', path: '/dashboard', icon: RectangleGroupIcon },
        { name: 'Quản lý người dùng', path: '/admin/users', icon: UsersIcon },
        { name: 'Phân quyền', path: '/admin/permissions', icon: ShieldCheckIcon },
        { name: 'Quản lý hệ thống', path: '/admin/system', icon: CogIcon },
        { name: 'Logs hệ thống', path: '/admin/logs', icon: DocumentTextIcon },
        { name: 'Hồ sơ cá nhân', path: '/profile', icon: UserCircleIcon },
      ];
    }
    
    // Default menu items
    return [
      { name: 'Trang chủ', path: '/home', icon: HomeIcon },
      { name: 'Bảng điều khiển', path: '/dashboard', icon: RectangleGroupIcon },
      { name: 'Hồ sơ cá nhân', path: '/profile', icon: UserCircleIcon },
    ];
  };

  const menuItems = getMenuItems();

  return (
    <div className="h-full overflow-hidden flex flex-col bg-white">
      {/* Logo and toggle button */}
      <div className="flex items-center justify-between px-4 py-6 border-b border-gray-200">
        {!isCollapsed ? (
          <>
            <Link to="/home" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-md bg-blue-600 flex items-center justify-center text-white">
                <span className="text-lg font-bold">Đ</span>
              </div>
              <span className="text-lg font-bold text-blue-600">Đoàn Trường</span>
            </Link>
            {toggle && (
              <button 
                className="md:hidden"
                onClick={toggle}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
              </button>
            )}
            {toggleCollapse && (
              <button 
                className="hidden md:flex items-center justify-center p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                onClick={toggleCollapse}
                title="Thu gọn menu"
              >
                <ChevronDoubleLeftIcon className="h-5 w-5" />
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center mx-auto">
            <div className="h-8 w-8 rounded-md bg-blue-600 flex items-center justify-center text-white">
              <span className="text-lg font-bold">Đ</span>
            </div>
            {toggleCollapse && (
              <button 
                className="mt-4 flex items-center justify-center p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                onClick={toggleCollapse}
                title="Mở rộng menu"
              >
                <ChevronDoubleRightIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* User info - chỉ hiển thị khi không thu gọn */}
      {!isCollapsed && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-500 overflow-hidden flex items-center justify-center text-white">
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.full_name} className="h-full w-full object-cover" />
              ) : (
                <UserIcon className="h-6 w-6" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.full_name || 'Người dùng'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.role === 'ADMIN' && 'Quản trị viên'}
                {user?.role === 'CAN_BO_DOAN' && 'Cán bộ Đoàn'}
                {user?.role === 'DOAN_VIEN' && 'Đoàn viên'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* User info thu gọn - chỉ hiển thị avatar */}
      {isCollapsed && (
        <div className="py-4 flex justify-center border-b border-gray-200">
          <div className="h-10 w-10 rounded-full bg-blue-500 overflow-hidden flex items-center justify-center text-white">
            {user?.avatar ? (
              <img src={user.avatar} alt={user?.full_name} className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="h-6 w-6" />
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="py-4 px-2 flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-4'} py-2.5 text-sm font-medium rounded-lg ${
                  pathname === item.path
                    ? 'text-white bg-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={isCollapsed ? item.name : ''}
              >
                <item.icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar; 