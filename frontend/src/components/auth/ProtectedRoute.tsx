import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../layout/Layout';

// Định nghĩa quyền truy cập cho từng route
const routePermissions: Record<string, string[]> = {
  '/': ['ADMIN', 'CAN_BO_DOAN', 'DOAN_VIEN'],
  '/home': ['ADMIN', 'CAN_BO_DOAN', 'DOAN_VIEN'],
  '/dashboard': ['ADMIN', 'CAN_BO_DOAN', 'DOAN_VIEN'],
  '/profile': ['ADMIN', 'CAN_BO_DOAN', 'DOAN_VIEN'],
  '/notifications': ['ADMIN', 'CAN_BO_DOAN', 'DOAN_VIEN'],
  '/calendar': ['ADMIN', 'CAN_BO_DOAN', 'DOAN_VIEN'],
  
  // Quyền dành cho DOAN_VIEN
  '/activities': ['ADMIN', 'CAN_BO_DOAN', 'DOAN_VIEN'],
  '/activity-details': ['ADMIN', 'CAN_BO_DOAN', 'DOAN_VIEN'],
  '/member-book': ['ADMIN', 'CAN_BO_DOAN', 'DOAN_VIEN'],
  
  // Quyền dành cho CAN_BO_DOAN
  '/activities-management': ['ADMIN', 'CAN_BO_DOAN'],
  '/activities-management/create': ['ADMIN', 'CAN_BO_DOAN'],
  '/members': ['ADMIN', 'CAN_BO_DOAN'],
  '/posts': ['ADMIN', 'CAN_BO_DOAN'],
  '/reports': ['ADMIN', 'CAN_BO_DOAN'],
  '/activities-management/test/:id': ['ADMIN', 'CAN_BO_DOAN'],
  '/activities-management/edit/:id': ['ADMIN', 'CAN_BO_DOAN'],
  '/activities-management/:id/registrations': ['ADMIN', 'CAN_BO_DOAN'],
  '/activities-management/detail/:id': ['ADMIN', 'CAN_BO_DOAN', 'DOAN_VIEN'],
  // Quyền dành riêng cho ADMIN
  '/users': ['ADMIN'],
  '/permissions': ['ADMIN'],
  '/system': ['ADMIN'],
  '/logs': ['ADMIN'],
  // Thêm đường dẫn admin mới
  '/admin/users': ['ADMIN'],
  '/admin/permissions': ['ADMIN'],
  '/admin/system': ['ADMIN'],
  '/admin/logs': ['ADMIN'],
};

type ProtectedRouteProps = {
  requireAuth?: boolean;
  children?: React.ReactNode;
};

const ProtectedRoute = ({ requireAuth = true, children }: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  // Kiểm tra xem người dùng hiện tại có quyền truy cập đường dẫn hiện tại không
  const hasPermission = () => {
    // Mặc định cho phép truy cập trang chủ nếu đã đăng nhập
    if (location.pathname === '/' || location.pathname === '/home') return true;
    
    console.log('Kiểm tra quyền truy cập:', {
      pathname: location.pathname,
      user: user?.username,
      role: user?.role
    });
    
    // Nếu không có user, trả về false
    if (!user) {
      console.log('Không có thông tin người dùng');
      return false;
    }
    
    // Kiểm tra đường dẫn có trong routePermissions không
    const exactPath = routePermissions[location.pathname];
    if (exactPath) {
      // Nếu có đường dẫn chính xác, kiểm tra quyền
      const hasAccess = exactPath.includes(user.role);
      console.log(`Người dùng ${user.username} (${user.role}) ${hasAccess ? 'có' : 'không có'} quyền truy cập vào ${location.pathname}. Quyền cần có: ${exactPath.join(', ')}`);
      return hasAccess;
    }
    
    // Kiểm tra các đường dẫn có tham số động
    // Ví dụ: Nếu đường dẫn là /activities-management/edit/123, kiểm tra quyền của /activities-management/edit/:id
    for (const [path, roles] of Object.entries(routePermissions)) {
      if (path.includes(':') && matchPathWithPattern(location.pathname, path)) {
        const hasAccess = roles.includes(user.role);
        console.log(`Đường dẫn động: ${location.pathname} khớp với mẫu ${path}`);
        console.log(`Người dùng ${user.username} (${user.role}) ${hasAccess ? 'có' : 'không có'} quyền truy cập. Quyền cần có: ${roles.join(', ')}`);
        return hasAccess;
      }
    }
    
    console.log(`Đường dẫn ${location.pathname} không được định nghĩa trong routePermissions`);
    return false;
  };
  
  // Hàm kiểm tra đường dẫn có khớp với mẫu không
  // Ví dụ: /activities-management/edit/123 sẽ khớp với /activities-management/edit/:id
  const matchPathWithPattern = (pathname: string, pattern: string) => {
    const patternParts = pattern.split('/');
    const pathParts = pathname.split('/');
    
    if (patternParts.length !== pathParts.length) return false;
    
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) continue; // Bỏ qua các phần tham số động
      if (patternParts[i] !== pathParts[i]) return false;
    }
    
    return true;
  };

  // Đang loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Nếu yêu cầu xác thực nhưng người dùng chưa đăng nhập, chuyển hướng đến trang đăng nhập
  if (requireAuth && !isAuthenticated) {
    console.log('Người dùng chưa đăng nhập, chuyển hướng đến trang đăng nhập');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Nếu yêu cầu xác thực, người dùng đã đăng nhập nhưng không có quyền truy cập, chuyển hướng đến trang Unauthorized
  if (requireAuth && isAuthenticated && !hasPermission()) {
    console.log('Người dùng không có quyền truy cập, chuyển hướng đến trang Unauthorized');
    return <Navigate to="/unauthorized" replace />;
  }

  // Nếu không yêu cầu xác thực nhưng người dùng đã đăng nhập, chuyển hướng đến trang chủ
  if (!requireAuth && isAuthenticated) {
    console.log('Người dùng đã đăng nhập nhưng đang truy cập trang không yêu cầu xác thực, chuyển hướng đến trang chủ');
    return <Navigate to="/" replace />;
  }

  // Nếu đã đăng nhập và có quyền truy cập, hiển thị route
  console.log('Hiển thị route cho người dùng:', user?.username);
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default ProtectedRoute; 