import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarIcon, ClockIcon, MapPinIcon, UserGroupIcon, FunnelIcon, MagnifyingGlassIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/dateUtils';
import { Activity, ActivityStatus, PaginatedResponse } from '@/types';

// Extended activity interface with additional properties needed by this component
interface ExtendedActivity extends Activity {
  type: string;
  is_registered?: boolean;
  points?: number;
}

import { getActivities, registerForActivity, cancelRegistration } from '@/services/activityService';

const ActivitiesPage = () => {
  const [activities, setActivities] = useState<ExtendedActivity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ExtendedActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [myActivities, setMyActivities] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Function to map filter value to ActivityStatus
  const getStatusFilter = (filterValue: string): ActivityStatus | undefined => {
    if (filterValue === 'all') return undefined;
    if (filterValue === 'upcoming') return ActivityStatus.PUBLISHED;
    if (filterValue === 'ongoing') return ActivityStatus.PUBLISHED;
    if (filterValue === 'completed') return ActivityStatus.COMPLETED;
    return undefined;
  };

  // Lấy danh sách hoạt động từ API
  const fetchActivities = async (resetPage = false) => {
    try {
      setIsLoading(true);
      const currentPage = resetPage ? 1 : page;
      if (resetPage) {
        setPage(1);
      }

      // Use correct parameters for getActivities
      const response = await getActivities(
        currentPage, 
        10, 
        getStatusFilter(filter),
        typeFilter !== 'all' ? typeFilter : undefined,
        search
      ) as PaginatedResponse<ExtendedActivity>;

      const activitiesList = response.results;
      
      if (resetPage) {
        setActivities(activitiesList);
        setFilteredActivities(activitiesList);
      } else {
        setActivities(prev => [...prev, ...activitiesList]);
        setFilteredActivities(prev => [...prev, ...activitiesList]);
      }
      
      setTotalCount(response.count);
      setHasMore(!!response.next);
    } catch (error) {
      console.error('Error fetching activities:', error);
      alert('Không thể tải danh sách hoạt động');
    } finally {
      setIsLoading(false);
    }
  };

  // Lấy danh sách ban đầu
  useEffect(() => {
    fetchActivities(true);
  }, []);

  // Lấy lại danh sách khi thay đổi bộ lọc
  useEffect(() => {
    fetchActivities(true);
  }, [filter, typeFilter, myActivities]);

  // Xử lý tìm kiếm
  const handleSearch = () => {
    fetchActivities(true);
  };

  // Xử lý tải thêm
  const loadMore = () => {
    if (hasMore && !isLoading) {
      setPage(prev => prev + 1);
    }
  };

  // Theo dõi thay đổi trang
  useEffect(() => {
    if (page > 1) {
      fetchActivities();
    }
  }, [page]);

  const handleRegister = async (activityId: number) => {
    try {
      await registerForActivity(activityId);
      
      // Cập nhật UI
      const updatedActivities = activities.map(activity =>
        activity.id === activityId
          ? {
              ...activity,
              current_participants: activity.current_participants + 1,
              is_registered: true,
            }
          : activity
      );
      
      setActivities(updatedActivities);
      setFilteredActivities(updatedActivities);
      alert('Đăng ký hoạt động thành công!');
    } catch (error) {
      console.error('Error registering for activity:', error);
      alert('Không thể đăng ký hoạt động. Vui lòng thử lại sau.');
    }
  };

  const handleCancelRegistration = async (activityId: number) => {
    try {
      await cancelRegistration(activityId);
      
      // Cập nhật UI
      const updatedActivities = activities.map(activity =>
        activity.id === activityId
          ? {
              ...activity,
              current_participants: activity.current_participants - 1,
              is_registered: false,
            }
          : activity
      );
      
      setActivities(updatedActivities);
      setFilteredActivities(updatedActivities);
      alert('Hủy đăng ký thành công!');
    } catch (error) {
      console.error('Error cancelling registration:', error);
      alert('Không thể hủy đăng ký. Vui lòng thử lại sau.');
    }
  };

  const getActivityTypeBadge = (type: string) => {
    switch (type) {
      case 'volunteer':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Tình nguyện
          </span>
        );
      case 'academic':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Học thuật
          </span>
        );
      case 'cultural':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Văn hóa
          </span>
        );
      case 'sports':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Thể thao
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {type}
          </span>
        );
    }
  };

  // Update the condition check for completed activities
  const isActivityCompleted = (activity: ExtendedActivity): boolean => {
    return activity.status === ActivityStatus.COMPLETED;
  };

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">Hoạt động đoàn</h1>
          <p className="mt-1 text-sm text-gray-500">
            Khám phá và tham gia các hoạt động đoàn trong trường
          </p>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="sr-only">
                Tìm kiếm
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="search"
                  id="search"
                  className="form-input pl-10"
                  placeholder="Tìm kiếm hoạt động..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-auto">
                <div className="relative">
                  <select
                    id="status-filter"
                    name="status-filter"
                    className="form-select pr-10 pl-4 py-2 text-base border-gray-300 focus:outline-none focus:ring-youth focus:border-youth rounded-md"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="upcoming">Sắp diễn ra</option>
                    <option value="ongoing">Đang diễn ra</option>
                    <option value="completed">Đã hoàn thành</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <FunnelIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                </div>
              </div>
              
              <div className="w-full sm:w-auto">
                <div className="relative">
                  <select
                    id="type-filter"
                    name="type-filter"
                    className="form-select pr-10 pl-4 py-2 text-base border-gray-300 focus:outline-none focus:ring-youth focus:border-youth rounded-md"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="all">Tất cả loại</option>
                    <option value="volunteer">Tình nguyện</option>
                    <option value="academic">Học thuật</option>
                    <option value="cultural">Văn hóa</option>
                    <option value="sports">Thể thao</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <FunnelIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  id="my-activities"
                  name="my-activities"
                  type="checkbox"
                  className="h-4 w-4 text-youth focus:ring-youth border-gray-300 rounded"
                  checked={myActivities}
                  onChange={(e) => setMyActivities(e.target.checked)}
                />
                <label htmlFor="my-activities" className="ml-2 block text-sm text-gray-900">
                  Hoạt động của tôi
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-60 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-base font-medium text-gray-900">Không tìm thấy hoạt động nào</h3>
          <p className="mt-1 text-sm text-gray-500">
            Thử thay đổi bộ lọc để tìm hoạt động phù hợp.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {filteredActivities.map((activity) => (
            <div 
              key={activity.id} 
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="relative">
                {/* Có thể thay bằng ảnh thực tế của hoạt động */}
                <div className={`h-40 ${
                  activity.type === 'volunteer' 
                    ? 'bg-green-100' 
                    : activity.type === 'academic' 
                    ? 'bg-blue-100' 
                    : activity.type === 'cultural' 
                    ? 'bg-purple-100' 
                    : 'bg-orange-100'
                }`}>
                  {activity.is_registered && (
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckBadgeIcon className="w-4 h-4 mr-1" />
                        Đã đăng ký
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  {getActivityTypeBadge(activity.type)}
                  <span className="text-xs text-gray-500">
                    {activity.points} điểm
                  </span>
                </div>
                
                <Link to={`/activities/${activity.id}`} className="block mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 hover:text-youth">
                    {activity.title}
                  </h3>
                </Link>
                
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {activity.description}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                    {formatDate(activity.start_time, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <ClockIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                    {formatDate(activity.start_time, { hour: '2-digit', minute: '2-digit' })} - 
                    {formatDate(activity.end_time, { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPinIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                    {activity.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <UserGroupIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                    {activity.current_participants}/{activity.max_participants} người tham gia
                    <div className="ml-2 w-16 h-1.5 bg-gray-200 rounded-full">
                      <div 
                        className="h-1.5 bg-blue-600 rounded-full" 
                        style={{ width: `${(activity.current_participants / activity.max_participants) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <Link 
                    to={`/activities/${activity.id}`} 
                    className="text-youth hover:text-youth-dark text-sm font-medium"
                  >
                    Xem chi tiết
                  </Link>
                  
                  {activity.status !== ActivityStatus.COMPLETED && (
                    !activity.is_registered ? (
                      <button
                        onClick={() => handleRegister(activity.id)}
                        disabled={activity.current_participants >= activity.max_participants}
                        className={`btn-sm btn-primary ${activity.current_participants >= activity.max_participants ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Đăng ký
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCancelRegistration(activity.id)}
                        className="btn-sm btn-outline-red"
                      >
                        Hủy đăng ký
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivitiesPage; 