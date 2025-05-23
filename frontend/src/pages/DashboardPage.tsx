import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarIcon, EyeIcon, UserPlusIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { UserRole } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import SearchBar from '@/components/common/SearchBar';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Alert from '@/components/common/Alert';
import { LineChart, BarChart } from '@/components/common/Charts';
import ActivityRegistrationForm from '@/components/activities/ActivityRegistrationForm';

import { 
  getActivities, 
  getPosts, 
  getWorkSchedules, 
  getNotifications, 
  getDashboardStats,
  getParticipationChartData,
  getActivityTypeChartData,
  DashboardStats,
  ChartData
} from '@/services/dashboardService';
import { registerForActivity, cancelRegistration } from '@/services/activityService';
import { Activity, Post, Schedule as WorkSchedule, Notification, PaginatedResponse } from '@/types';
import api from '@/services/api';
import axios from 'axios';

const DashboardPage = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    totalActivities: 0,
    totalPosts: 0,
    totalNotifications: 0,
    recentActivities: [],
    upcomingDeadlines: []
  });
  const [participationChartData, setParticipationChartData] = useState<ChartData>({
    labels: [],
    datasets: []
  });
  const [activityTypeChartData, setActivityTypeChartData] = useState<ChartData>({
    labels: [],
    datasets: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [registrationStatus, setRegistrationStatus] = useState<Record<number, boolean>>({});
  const [isRegistering, setIsRegistering] = useState<Record<number, boolean>>({});
  const [alertMessage, setAlertMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [registrationDetailsStatus, setRegistrationDetailsStatus] = useState<Record<number, {status: string, registered: boolean}>>({});
  
  const isAdmin = user?.role === UserRole.ADMIN;
  const isCanBoDoan = user?.role === UserRole.CAN_BO_DOAN;
  const isDoanVien = user?.role === UserRole.DOAN_VIEN;
  const isAdminOrCanBoDoan = isAdmin || isCanBoDoan;

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Create an array of promises to fetch data
        const promises = [];
        
        // All roles need activities and notifications
        promises.push(getActivities());
        promises.push(getNotifications());
        
        // Add role-specific data fetching
        if (isAdminOrCanBoDoan) {
          promises.push(getPosts());
          promises.push(getDashboardStats());
          promises.push(getParticipationChartData());
          promises.push(getActivityTypeChartData());
        } else {
          // For regular members (DOAN_VIEN), only load necessary data
          promises.push(null); // placeholder for posts
          promises.push(null); // placeholder for stats
          promises.push(null); // placeholder for participation chart
          promises.push(null); // placeholder for activity type chart
        }
        
        // All users need schedules, but admin/can bo doan may see all schedules
        promises.push(getWorkSchedules());
        
        const [
          activitiesRes, 
          notificationsRes,
          postsRes, 
          statsRes,
          participationChartRes,
          activityTypeChartRes, 
          schedulesRes, 
        ] = await Promise.all(promises);

        // Update state with fetched data
        if (activitiesRes) {
          setActivities((activitiesRes as PaginatedResponse<Activity>).results || []);
          
          // Kiểm tra trạng thái đăng ký cho từng hoạt động
          if (isDoanVien) {
            const activitiesList = (activitiesRes as PaginatedResponse<Activity>).results || [];
            const registrationStatusMap: Record<number, {status: string, registered: boolean}> = {};
            
            // Lặp qua các hoạt động để lấy trạng thái đăng ký
            try {
              // Sử dụng endpoint mới để kiểm tra trạng thái đăng ký
              const checkPromises = activitiesList.map(async (activity) => {
                try {
                  // Gọi endpoint registration-status
                  const response = await api.get(`/activities/${activity.id}/registration-status/`);
                  
                  // Xử lý phản hồi
                  if (response.data && response.data.registered) {
                    return { 
                      id: activity.id, 
                      status: response.data.status, 
                      registered: true 
                    };
                  }
                  
                  // Nếu response.data.registered là false, người dùng chưa đăng ký
                  return { id: activity.id, status: '', registered: false };
                } catch (error) {
                  console.error(`Error checking registration status for activity ${activity.id}:`, error);
                  // Mặc định chưa đăng ký nếu có lỗi
                  return { id: activity.id, status: '', registered: false };
                }
              });
              
              // Đợi tất cả các promise hoàn thành
              const results = await Promise.all(checkPromises);
              
              // Cập nhật map trạng thái đăng ký
              results.forEach(result => {
                registrationStatusMap[result.id] = {
                  status: result.status,
                  registered: result.registered
                };
              });
              
              // Cập nhật state
              setRegistrationStatus(
                Object.fromEntries(
                  Object.entries(registrationStatusMap).map(
                    ([key, value]) => [key, value.registered]
                  )
                )
              );
              
              // Lưu thông tin chi tiết về trạng thái
              setRegistrationDetailsStatus(registrationStatusMap);
            } catch (e) {
              console.error('Error checking registration status:', e);
            }
          }
        }
        
        if (notificationsRes) {
          setNotifications((notificationsRes as PaginatedResponse<Notification>).results || []);
        }
        
        if (isAdminOrCanBoDoan) {
          if (postsRes) {
            setPosts((postsRes as PaginatedResponse<Post>).results || []);
          }
          
          if (statsRes) {
            setStats(statsRes as DashboardStats || {
              totalMembers: 0,
              totalActivities: 0,
              totalPosts: 0,
              totalNotifications: 0,
              recentActivities: [],
              upcomingDeadlines: []
            });
          }
          
          if (participationChartRes) {
            setParticipationChartData(participationChartRes as ChartData || { labels: [], datasets: [] });
          }
          
          if (activityTypeChartRes) {
            setActivityTypeChartData(activityTypeChartRes as ChartData || { labels: [], datasets: [] });
          }
        }
        
        if (schedulesRes) {
          setSchedules((schedulesRes as PaginatedResponse<WorkSchedule>).results || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAdmin, isCanBoDoan, isDoanVien, isAdminOrCanBoDoan]);

  // Hàm mở form đăng ký tham gia
  const openRegistrationForm = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowRegistrationForm(true);
  };

  // Hàm xử lý khi đăng ký tham gia thành công
  const handleRegistrationSuccess = (activityId: number) => {
    // Cập nhật trạng thái đăng ký thành công
    setRegistrationStatus(prev => ({ ...prev, [activityId]: true }));
    
    // Cập nhật thông tin chi tiết với trạng thái Pending
    setRegistrationDetailsStatus(prev => ({
      ...prev,
      [activityId]: { status: 'Pending', registered: true }
    }));
    
    // Hiển thị thông báo thành công
    setAlertMessage({
      type: 'success',
      text: 'Đăng ký tham gia hoạt động thành công! Vui lòng chờ cán bộ đoàn xét duyệt.'
    });
    
    // Ẩn thông báo sau 5 giây
    setTimeout(() => {
      setAlertMessage(null);
    }, 5000);
    
    // Cập nhật danh sách hoạt động để hiển thị trạng thái mới
    getActivities().then(res => {
      if (res && res.results) {
        setActivities(res.results);
      }
    }).catch(err => {
      console.error("Không thể làm mới danh sách hoạt động:", err);
    });
  };
  
  // Hàm xử lý hủy đăng ký tham gia
  const handleCancelRegistration = async (activityId: number) => {
    try {
      setIsRegistering(prev => ({ ...prev, [activityId]: true }));
      
      // Gọi API hủy đăng ký tham gia
      await cancelRegistration(activityId);
      console.log('Hủy đăng ký thành công cho hoạt động', activityId);
      
      // Cập nhật trạng thái đăng ký
      setRegistrationStatus(prev => ({ ...prev, [activityId]: false }));
      
      // Hiển thị thông báo thành công
      setAlertMessage({
        type: 'success',
        text: 'Hủy đăng ký tham gia hoạt động thành công!'
      });
      
      // Ẩn thông báo sau 5 giây
      setTimeout(() => {
        setAlertMessage(null);
      }, 5000);
    } catch (error) {
      console.error('Error canceling registration:', error);
      // Hiển thị thông báo lỗi
      setAlertMessage({
        type: 'error', 
        text: 'Có lỗi xảy ra khi hủy đăng ký tham gia. Vui lòng thử lại sau.'
      });
      
      // Ẩn thông báo sau 5 giây
      setTimeout(() => {
        setAlertMessage(null);
      }, 5000);
    } finally {
      setIsRegistering(prev => ({ ...prev, [activityId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen px-4 py-16">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Render different dashboard layouts based on user role
  return (
    <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
      <h1 className="text-2xl font-bold mb-6">
        {isAdmin ? 'Trang quản trị hệ thống' : 
         isCanBoDoan ? 'Trang quản lý hoạt động đoàn' : 
         'Trang hoạt động đoàn viên'}
      </h1>

      {/* Stats Cards - Only for Admin and CanBoDoan */}
      {isAdminOrCanBoDoan && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tổng đoàn viên</p>
                <p className="text-lg font-semibold text-gray-900">{stats.totalMembers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-full p-3">
                <CalendarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Hoạt động</p>
                <p className="text-lg font-semibold text-gray-900">{stats.totalActivities}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-full p-3">
                <EyeIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Bài viết</p>
                <p className="text-lg font-semibold text-gray-900">{stats.totalPosts}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-amber-100 rounded-full p-3">
                <UserPlusIcon className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Thông báo</p>
                <p className="text-lg font-semibold text-gray-900">{stats.totalNotifications}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts - Only for Admin and CanBoDoan */}
      {isAdminOrCanBoDoan && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Đoàn viên tham gia hoạt động</h3>
              <div className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Năm {new Date().getFullYear()}</div>
            </div>
            <div className="p-4">
              <LineChart data={participationChartData} height={300} />
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Phân loại hoạt động</h3>
              <div className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Tổng hợp</div>
            </div>
            <div className="p-4">
              <BarChart data={activityTypeChartData} height={300} />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`grid grid-cols-1 ${isAdminOrCanBoDoan ? 'lg:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
        {/* Left column (takes 2/3 width for admin/can bo doan, 1/2 for doan vien) */}
        <div className={isAdminOrCanBoDoan ? 'lg:col-span-2' : ''}>
          {/* Upcoming Activities - For all roles */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                {isAdmin ? 'Quản lý hoạt động sắp diễn ra' : 
                 isCanBoDoan ? 'Hoạt động sắp diễn ra cần quản lý' : 
                 'Hoạt động sắp diễn ra'}
              </h3>
              <Link to="/activities" className="text-sm text-primary-600 hover:text-primary-800 font-medium">
                Xem tất cả
              </Link>
            </div>
            <div className="divide-y divide-gray-200">
              {activities.length > 0 ? (
                activities
                  .filter(a => {
                    // Lọc theo trạng thái Upcoming
                    if (a.status !== 'Upcoming') return false;
                    
                    // Kiểm tra hạn đăng ký, chỉ hiển thị nếu chưa hết hạn
                    const registrationDeadline = new Date(a.registration_deadline);
                    const now = new Date();
                    
                    return registrationDeadline > now;
                  })
                  .slice(0, 3)
                  .map((activity) => (
                    <div key={activity.id} className="p-4">
                      <h4 className="font-medium text-lg mb-2">{activity.title}</h4>
                      <p className="text-gray-600 mb-3 line-clamp-2">{activity.description}</p>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {new Date(activity.start_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {activity.location || 'Chưa có địa điểm'}
                        </div>
                        <div className="flex items-center">
                          <UserGroupIcon className="h-4 w-4 mr-1" />
                          {activity.current_participants || 0} người tham gia
                        </div>
                      </div>
                      {isDoanVien && (
                        <div className="mt-3">
                          {registrationStatus[activity.id] ? (
                            <>
                              <div className="flex flex-col sm:flex-row gap-2 mb-2">
                                <span className={`px-2 py-1 text-xs inline-flex items-center font-medium rounded-full
                                  ${!registrationDetailsStatus[activity.id]?.status ? 'bg-gray-100 text-gray-800' : 
                                  registrationDetailsStatus[activity.id]?.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                                  registrationDetailsStatus[activity.id]?.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                                  registrationDetailsStatus[activity.id]?.status === 'Attended' ? 'bg-blue-100 text-blue-800' : 
                                  'bg-gray-100 text-gray-800'}`}>
                                  {!registrationDetailsStatus[activity.id]?.status ? 'Đã đăng ký' : 
                                  registrationDetailsStatus[activity.id]?.status === 'Pending' ? 'Chờ duyệt' : 
                                  registrationDetailsStatus[activity.id]?.status === 'Approved' ? 'Đã duyệt' : 
                                  registrationDetailsStatus[activity.id]?.status === 'Attended' ? 'Đã tham gia' : 
                                  'Đã đăng ký'}
                                </span>
                              </div>
                              <Button 
                                onClick={() => handleCancelRegistration(activity.id)}
                                type="button" 
                                variant="danger" 
                                size="sm"
                                className="mr-2"
                                disabled={isRegistering[activity.id] || registrationDetailsStatus[activity.id]?.status === 'Attended'}
                              >
                                {isRegistering[activity.id] ? 'Đang xử lý...' : 'Hủy đăng ký'}
                              </Button>
                            </>
                          ) : (
                            <Button 
                              onClick={() => openRegistrationForm(activity)}
                              type="button" 
                              variant="primary" 
                              size="sm"
                            >
                              Đăng ký tham gia
                            </Button>
                          )}
                          <Link to={`/activities/${activity.id}`}>
                            <Button 
                              type="button" 
                              variant="secondary" 
                              size="sm"
                            >
                              Chi tiết
                            </Button>
                          </Link>
                        </div>
                      )}
                      {isAdminOrCanBoDoan && (
                        <div className="mt-3">
                          <Link to={`/activities-management/${activity.id}/registrations`}>
                            <Button 
                              type="button" 
                              variant="primary" 
                              size="sm"
                              className="mr-2"
                            >
                              Quản lý tham gia
                            </Button>
                          </Link>
                          <Link to={`/activities-management/edit/${activity.id}`}>
                            <Button 
                              type="button" 
                              variant="secondary" 
                              size="sm"
                              className="mr-2"
                            >
                              Chỉnh sửa
                            </Button>
                          </Link>
                          <Link to={`/activities-management/detail/${activity.id}`}>
                            <Button 
                              type="button" 
                              variant="danger" 
                              size="sm"
                            >
                              Xem chi tiết
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  ))
              ) : (
                <div className="p-6 text-center text-gray-500">
                  Không có hoạt động sắp tới
                </div>
              )}
            </div>
          </div>
          
          {/* Recent Posts - Only for Admin and CanBoDoan */}
          {isAdminOrCanBoDoan && (
            <div className="bg-white shadow rounded-lg overflow-hidden mt-6">
              <div className="px-4 py-5 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Bài đăng mới nhất</h3>
                <Link to="/posts" className="text-sm text-primary-600 hover:text-primary-800 font-medium">
                  Xem tất cả
                </Link>
              </div>
              <div className="divide-y divide-gray-200">
                {posts.length > 0 ? (
                  posts.slice(0, 3).map((post) => (
                    <div key={post.id} className="p-4">
                      <div className="flex justify-between mb-2">
                        <h4 className="font-medium">{post.title}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full 
                          ${post.status === 'Draft' ? 'bg-gray-100 text-gray-800' : 
                          post.status === 'Published' ? 'bg-green-100 text-green-800' : 
                          'bg-red-100 text-red-800'}`}>
                          {post.status}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-2">{post.content.substring(0, 100)}...</p>
                      <div className="text-xs text-gray-500">
                        {new Date(post.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    Không có bài đăng
                  </div>
                )}
              </div>
            </div>
          )}
          
        </div>

        {/* Right sidebar - For all roles (notifications and schedules) */}
        <div className="space-y-6">
          {/* Notifications - For all roles */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Thông báo mới</h3>
              <Link to="/notifications" className="text-sm text-primary-600 hover:text-primary-800 font-medium">
                Xem tất cả
              </Link>
            </div>
            <div>
              {notifications.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {notifications.slice(0, 5).map((notification) => (
                    <div key={notification.id} className={`p-4 ${notification.is_read ? 'opacity-70' : ''}`}>
                      <p className="text-sm text-gray-700 mb-2">{notification.content}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleString()}
                        </span>
                        {!notification.is_read && (
                          <span className="px-2 text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            Mới
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  Không có thông báo
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Schedule - For all roles */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Lịch sắp tới</h3>
              <Link to="/schedules" className="text-sm text-primary-600 hover:text-primary-800 font-medium">
                Xem tất cả
              </Link>
            </div>
            <div className="p-4">
              {schedules.length > 0 ? (
                <div className="space-y-3">
                  {schedules.slice(0, 3).map((schedule) => (
                    <Link 
                      key={schedule.id}
                      to={`/schedules/${schedule.id}`}
                      className="block p-3 hover:bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div className="flex justify-between">
                        <h4 className="font-medium text-gray-900">{schedule.title}</h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                          ${(schedule as any).status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                          {(schedule as any).status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        {new Date((schedule as any).schedule_date).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  Không có lịch sắp tới
                </div>
              )}
            </div>
          </div>
          
          {/* Quick Links - Admin only */}
          {isAdmin && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Truy cập nhanh</h3>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  <Link to="/admin/users" className="block p-2 hover:bg-gray-50 rounded-lg text-primary-600 hover:text-primary-800">
                    Quản lý người dùng
                  </Link>
                  <Link to="/admin/permissions" className="block p-2 hover:bg-gray-50 rounded-lg text-primary-600 hover:text-primary-800">
                    Quản lý quyền hạn
                  </Link>
                  <Link to="/admin/system" className="block p-2 hover:bg-gray-50 rounded-lg text-primary-600 hover:text-primary-800">
                    Cấu hình hệ thống
                  </Link>
                  <Link to="/admin/logs" className="block p-2 hover:bg-gray-50 rounded-lg text-primary-600 hover:text-primary-800">
                    Nhật ký hệ thống
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hiển thị form đăng ký khi người dùng click vào nút đăng ký */}
      {selectedActivity && showRegistrationForm && (
        <ActivityRegistrationForm 
          activity={selectedActivity}
          isOpen={showRegistrationForm}
          onClose={() => setShowRegistrationForm(false)}
          onSuccess={() => handleRegistrationSuccess(Number(selectedActivity.id))}
        />
      )}
      
      {/* Alert message */}
      {alertMessage && (
        <div className="fixed top-16 right-4 z-50 max-w-sm">
          <Alert type={alertMessage.type} message={alertMessage.text} />
        </div>
      )}
    </div>
  );
};

export default DashboardPage;