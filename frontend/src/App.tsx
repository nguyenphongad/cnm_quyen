import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Trang công khai
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// Trang chung
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/profile/ProfilePage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import CalendarPage from './pages/calendar/CalendarPage';

// Trang cho Đoàn viên
import ActivitiesPage from './pages/activities/ActivitiesPage';
import ActivityDetailPage from './pages/activities/ActivityDetailPage';
import MemberBookPage from './pages/members/MemberBookPage';

// Trang cho Cán bộ đoàn
import UsersPage from './pages/UsersPage';
import ReportsPage from './pages/reports/ReportsPage';
import ActivitiesManagementPage from './pages/activities/ActivitiesManagementPage';
import MembersManagementPage from './pages/members/MembersManagementPage';
import PostsManagementPage from './pages/posts/PostsManagementPage';
import ActivityCreatePage from './pages/activities/ActivityCreatePage';
import ActivityManageRegistrationsPage from './pages/activities/ActivityManageRegistrationsPage';

// Trang cho Admin
import UsersManagementPage from './pages/admin/UsersManagementPage';
import PermissionsPage from './pages/admin/PermissionsPage';
import SystemManagementPage from './pages/admin/SystemManagementPage';
import SystemLogsPage from './pages/admin/SystemLogsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Trang công khai */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          
          {/* Trang yêu cầu đăng nhập */}
          <Route element={<ProtectedRoute requireAuth={true} />}>
            {/* Trang chung */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            
            {/* Trang cho Đoàn viên */}
            <Route path="/activities" element={<ActivitiesPage />} />
            <Route path="/activities/:id" element={<ActivityDetailPage />} />
            <Route path="/member-book" element={<MemberBookPage />} />
            
            {/* Trang cho Cán bộ đoàn */}
            <Route path="/users" element={<UsersPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/activities-management" element={<ActivitiesManagementPage />} />
            <Route path="/activities-management/create" element={<ActivityCreatePage />} />
            <Route path="/activities-management/edit/:id" element={<ActivityCreatePage />} />
            <Route path="/activities-management/:id/registrations" element={<ActivityManageRegistrationsPage />} />
            <Route path="/activities-management/detail/:id" element={<ActivityDetailPage />} />
            <Route path="/members" element={<MembersManagementPage />} />
            <Route path="/posts" element={<PostsManagementPage />} />
            
            {/* Trang cho Admin */}
            <Route path="/admin/users" element={<UsersManagementPage />} />
            <Route path="/admin/permissions" element={<PermissionsPage />} />
            <Route path="/admin/system" element={<SystemManagementPage />} />
            <Route path="/admin/logs" element={<SystemLogsPage />} />
          </Route>
          
          {/* Xử lý 404 */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App; 