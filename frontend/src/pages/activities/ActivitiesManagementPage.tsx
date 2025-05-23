import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusIcon, FunnelIcon, PencilIcon, TrashIcon, CheckCircleIcon, ClockIcon, MapPinIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { Activity, ActivityStatus, UserRole } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/common/Button';
import { toast } from 'react-toastify';
import { getActivities, deleteActivity, getActivityStats, ActivityStats } from '@/services/activityService';

interface FilterParams {
  page: number;
  pageSize: number;
  status?: ActivityStatus;
  type?: string;
  search?: string;
}

const ActivitiesManagementPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [stats, setStats] = useState<ActivityStats>({
    totalActivities: 0,
    upcomingActivities: 0,
    ongoingActivities: 0,
    completedActivities: 0,
    totalParticipants: 0,
    averageParticipation: 0,
    activityByType: []
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchActivities();
    fetchStats();
  }, [currentPage, filterStatus, filterType]);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const params: FilterParams = {
        page: currentPage,
        pageSize: pageSize
      };

      // Add status filter if not "all"
      if (filterStatus !== 'all') {
        params.status = filterStatus as ActivityStatus;
      }

      // Add type filter if not "all"
      if (filterType !== 'all') {
        params.type = filterType;
      }

      // Add search term if present
      if (search.trim()) {
        params.search = search;
      }

      const response = await getActivities(
        params.page,
        params.pageSize,
        params.status,
        params.type,
        params.search
      );
      
      setActivities(response.results);
      setFilteredActivities(response.results);
      setTotalPages(Math.ceil(response.count / pageSize));
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Không thể tải dữ liệu hoạt động');
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await getActivityStats();
      console.log('Dữ liệu thống kê nhận được:', statsData);
      
      // Nếu API trả về dữ liệu đã chuẩn hóa, sử dụng luôn
      if (statsData && statsData.totalActivities !== undefined) {
        setStats(statsData);
      } else {
        // Nếu API không trả về dữ liệu hoặc dữ liệu không đúng định dạng, tính toán từ danh sách hoạt động
        calculateStatsFromActivities();
      }
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      toast.error('Không thể tải dữ liệu thống kê hoạt động');
      // Nếu API gặp lỗi, tính toán thống kê từ danh sách hoạt động
      calculateStatsFromActivities();
    }
  };

  // Tính toán thống kê từ danh sách hoạt động khi API không trả về đúng dữ liệu
  const calculateStatsFromActivities = () => {
    // Đếm số lượng hoạt động theo từng trạng thái
    const upcoming = activities.filter(a => {
      const status = String(a.status);
      return status === 'Upcoming' || status === ActivityStatus.DRAFT;
    }).length;
    
    const ongoing = activities.filter(a => {
      const status = String(a.status);
      return status === 'Ongoing' || status === ActivityStatus.ONGOING;
    }).length;
    
    const completed = activities.filter(a => {
      const status = String(a.status);
      return status === 'Completed' || status === ActivityStatus.COMPLETED;
    }).length;
    
    // Tính tổng số người tham gia
    const totalParticipants = activities.reduce((sum, activity) => sum + (activity.current_participants || 0), 0);
    
    // Tính trung bình số người tham gia
    const averageParticipation = activities.length > 0 ? totalParticipants / activities.length : 0;
    
    // Đếm số lượng hoạt động theo từng loại
    const activityTypeMap = new Map<string, number>();
    activities.forEach(activity => {
      const type = activity.type || 'Không phân loại';
      activityTypeMap.set(type, (activityTypeMap.get(type) || 0) + 1);
    });
    
    const activityByType = Array.from(activityTypeMap.entries()).map(([type, count]) => ({ type, count }));
    
    // Cập nhật state
    setStats({
      totalActivities: activities.length,
      upcomingActivities: upcoming,
      ongoingActivities: ongoing,
      completedActivities: completed,
      totalParticipants,
      averageParticipation,
      activityByType
    });
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchActivities();
  };

  const handleCreateActivity = () => {
    navigate('/activities-management/create');
  };

  const openDeleteModal = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowDeleteModal(true);
  };

  const handleDeleteActivity = async () => {
    if (!selectedActivity) return;
    
    try {
      await deleteActivity(selectedActivity.id);
      
      toast.success('Xóa hoạt động thành công');
      setShowDeleteModal(false);
      setSelectedActivity(null);
      
      // Refresh data
      fetchActivities();
      fetchStats();
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast.error('Không thể xóa hoạt động');
    }
  };

  const getStatusBadge = (status: ActivityStatus) => {
    switch (status) {
      case 'Upcoming':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <ClockIcon className="h-3 w-3 mr-1" />
            Sắp diễn ra
          </span>
        );
      case 'Ongoing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Đang diễn ra
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Hoàn thành
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <ClockIcon className="h-3 w-3 mr-1" />
            Đã hủy
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Chưa có thời gian';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl font-bold text-gray-900">Quản lý hoạt động</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tạo, quản lý và theo dõi các hoạt động đoàn
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => {
              fetchActivities();
              fetchStats();
            }}
            className="flex items-center justify-center bg-gray-100 text-gray-800 hover:bg-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Làm mới
          </Button>
          <Button onClick={handleCreateActivity} className="flex items-center justify-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            Tạo hoạt động mới
          </Button>
        </div>
      </div>

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
              <FunnelIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 truncate">Tổng số hoạt động</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">{stats.totalActivities}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 truncate">Sắp diễn ra</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">{stats.upcomingActivities}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 truncate">Đang diễn ra</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">{stats.ongoingActivities}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
              <UserGroupIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 truncate">Tổng số tham gia</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">{stats.totalParticipants}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bộ lọc và tìm kiếm */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm
            </label>
            <div className="flex">
              <input
                type="text"
                id="search"
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md rounded-r-none"
                placeholder="Tên hoặc mô tả hoạt động"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                className="bg-primary-600 text-white px-4 rounded-r-md hover:bg-primary-700"
                onClick={handleSearch}
              >
                Tìm
              </button>
            </div>
          </div>
          
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              id="statusFilter"
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Upcoming">Sắp diễn ra</option>
              <option value="Ongoing">Đang diễn ra</option>
              <option value="Completed">Đã hoàn thành</option>
              <option value="Cancelled">Đã hủy</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="typeFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Loại hoạt động
            </label>
            <select
              id="typeFilter"
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Tất cả loại</option>
              {stats.activityByType.map((type, index) => (
                <option key={index} value={type.type}>{type.type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Danh sách hoạt động */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="bg-white shadow rounded-lg py-8">
          <div className="text-center">
            <p className="text-gray-500">Không tìm thấy hoạt động nào</p>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên hoạt động
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Địa điểm
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người tham gia
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {activity.title}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {activity.type || 'Không phân loại'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(activity.start_date)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        đến {formatDate(activity.end_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {activity.location || 'Chưa có địa điểm'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(activity.status as any)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <UserGroupIcon className="h-4 w-4 mr-1 text-gray-400" />
                        <span>{activity.current_participants || 0} / {activity.max_participants || 'không giới hạn'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/activities-management/edit/${activity.id}`)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(activity)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Phân trang */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  currentPage === 1 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Trước
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  currentPage === totalPages 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Sau
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{filteredActivities.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> đến <span className="font-medium">{Math.min(currentPage * pageSize, (currentPage - 1) * pageSize + filteredActivities.length)}</span> trong tổng số <span className="font-medium">{stats.totalActivities}</span> hoạt động
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === 1 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Trước</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {/* Hiển thị trang hiện tại và các trang lân cận */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageToShow = Math.min(
                      Math.max(currentPage - 2, 1) + i,
                      totalPages
                    );
                    
                    if (pageToShow <= 0 || pageToShow > totalPages) return null;
                    
                    return (
                      <button
                        key={pageToShow}
                        onClick={() => setCurrentPage(pageToShow)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageToShow
                            ? 'z-10 bg-primary-50 border-primary-500 text-primary-600 hover:bg-primary-100'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageToShow}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === totalPages 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Sau</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Xác nhận xóa hoạt động
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Bạn có chắc chắn muốn xóa hoạt động <span className="font-semibold">{selectedActivity?.title}</span>? Hành động này không thể hoàn tác.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                  onClick={handleDeleteActivity}
                >
                  Xóa
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedActivity(null);
                  }}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivitiesManagementPage;