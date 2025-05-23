import { ReactNode } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children?: ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  console.log("ProtectedRoute - Path:", location.pathname);
  console.log("ProtectedRoute - User:", user?.role);
  console.log("ProtectedRoute - Allowed Roles:", allowedRoles);

  // Hiển thị loading nếu đang kiểm tra xác thực
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <svg className="animate-spin h-10 w-10 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  // Nếu người dùng chưa đăng nhập, chuyển hướng đến trang đăng nhập
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Nếu có quy định về vai trò, kiểm tra xem người dùng có quyền hay không
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    console.log("ProtectedRoute - Access Denied, redirecting to unauthorized");
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  // Nếu mọi điều kiện đều thỏa mãn, hiển thị trang được bảo vệ
  // Sử dụng children nếu được cung cấp, nếu không sử dụng Outlet cho các route lồng nhau
  return <>{children || <Outlet />}</>;
};

export default ProtectedRoute; 