import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, PencilIcon, TrashIcon, CalendarIcon, MapPinIcon, UserGroupIcon, ClockIcon } from '@heroicons/react/24/outline';
import { youth } from '@/assets/images';
import { formatDate } from '@/utils/dateUtils';
import ActivityModal from '@/components/activities/ActivityModal';
import ConfirmModal from '@/components/common/ConfirmModal';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

// Định nghĩa kiểu dữ liệu cho Activity
interface Activity {
  id?: string;
  title: string;
  description: string;
  start_date: string;  // API trả về
  end_date: string;    // API trả về
  startDate: string;   // Cho modal
  endDate: string;     // Cho modal
  location: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
  maxParticipants: number;
  type: string;
  points: number;
  organizer: {
    id: number;
    full_name: string;
  };
  registration_deadline?: string;
}

// Định nghĩa kiểu dữ liệu cho Participant
interface Participant {
  id: number;
  full_name: string;
  email: string;
  avatar?: string;
}

// Định nghĩa kiểu dữ liệu cho form data - giống với Activity trong ActivityModal
interface ActivityFormData {
  id?: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  maxParticipants: number;
  type: string;
  status: 'draft' | 'published' | 'canceled' | 'completed';
  points: number;
}

const ActivityDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isParticipating, setIsParticipating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Kiểm tra người dùng có quyền quản lý hoạt động không
  const canManageActivity = user?.role === UserRole.ADMIN || user?.role === UserRole.CAN_BO_DOAN;

  // Hàm chuyển đổi từ Activity sang FormData
  const mapActivityToForm = (act: Activity): ActivityFormData => {
    return {
      id: act.id,
      title: act.title,
      description: act.description,
      startDate: act.start_date,  // Chuyển từ API format sang format cho modal
      endDate: act.end_date,      // Chuyển từ API format sang format cho modal
      location: act.location,
      maxParticipants: act.maxParticipants || 0,
      type: act.type || 'volunteer',
      status: act.status.toLowerCase() as 'draft' | 'published' | 'canceled' | 'completed',
      points: act.points || 0
    };
  };

  // Tải thông tin hoạt động và người tham gia
  useEffect(() => {
    const fetchActivityData = async () => {
      setIsLoading(true);
      try {
        // Lấy thông tin hoạt động
        const response = await api.get(`/activities/${id}/`);
        setActivity(response.data);
        
        // Lấy danh sách người tham gia
        try {
          const participantsResponse = await api.get(`/activities/${id}/participants/`);
          setParticipants(participantsResponse.data.results || []);
          
          // Kiểm tra người dùng hiện tại có trong danh sách người tham gia không
          if (user?.id) {
            const isUserParticipating = (participantsResponse.data.results || []).some(
              (p: Participant) => p.id === user.id
            );
            setIsParticipating(isUserParticipating);
          }
        } catch (error) {
          console.error('Error fetching participants:', error);
          setParticipants([]);
        }
        
        // Kiểm tra trạng thái đăng ký
        try {
          // Kiểm tra tình trạng đăng ký hiện tại của người dùng
          const registrationsResponse = await api.get(`/activity-registrations/`, {
            params: { activity: id, user: user?.id }
          });
          
          if (registrationsResponse.data.results && registrationsResponse.data.results.length > 0) {
            const registration = registrationsResponse.data.results[0];
            setIsParticipating(registration.status === 'Approved' || registration.status === 'Attended');
          }
        } catch (error) {
          console.error('Error checking registration status:', error);
        }
      } catch (error) {
        console.error('Error fetching activity:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchActivityData();
    }
  }, [id, user?.id]);

  const handleEditActivity = () => {
    setShowEditModal(true);
  };

  const handleDeleteActivity = () => {
    setShowDeleteModal(true);
  };

  const handleParticipation = async () => {
    if (!activity) return;
    
    try {
      if (isParticipating) {
        await api.post(`/activities/${activity.id}/cancel-registration/`);
        setIsParticipating(false);
      } else {
        await api.post(`/activities/${activity.id}/register/`);
        setIsParticipating(true);
      }
      
      // Làm mới danh sách người tham gia
      const participantsResponse = await api.get(`/activities/${activity.id}/participants/`);
      setParticipants(participantsResponse.data.results || []);
    } catch (error) {
      console.error('Error handling participation:', error);
    }
  };

  const handleSaveActivity = async (updatedActivity: ActivityFormData) => {
    if (!activity) return;
    
    try {
      // Chuyển đổi dữ liệu từ form sang định dạng API
      const apiData = {
        title: updatedActivity.title,
        description: updatedActivity.description,
        start_date: updatedActivity.startDate,
        end_date: updatedActivity.endDate,
        location: updatedActivity.location,
        max_participants: updatedActivity.maxParticipants,
        type: updatedActivity.type,
        status: updatedActivity.status === 'draft' ? 'Upcoming' : 
                updatedActivity.status === 'published' ? 'Ongoing' :
                updatedActivity.status === 'completed' ? 'Completed' : 'Upcoming',
        points: updatedActivity.points
      };
      
      const response = await api.put(`/activities/${activity.id}/`, apiData);
      setActivity(response.data);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  };

  const confirmDeleteActivity = async () => {
    if (!activity) return;
    
    try {
      await api.delete(`/activities/${activity.id}/`);
      navigate('/activities');
    } catch (error) {
      console.error('Error deleting activity:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Không tìm thấy thông tin hoạt động
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <button
          onClick={() => navigate('/activities')}
          className="flex items-center text-primary-600 hover:text-primary-800"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Quay lại danh sách
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Details */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{activity.title}</h1>
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2
                      ${activity.status === 'Upcoming' ? 'bg-blue-100 text-blue-800' : 
                      activity.status === 'Ongoing' ? 'bg-green-100 text-green-800' : 
                      'bg-gray-100 text-gray-800'}`}>
                      {activity.status === 'Upcoming' ? 'Sắp diễn ra' : 
                      activity.status === 'Ongoing' ? 'Đang diễn ra' : 'Đã hoàn thành'}
                    </span>
                  </div>
                </div>
                
                {canManageActivity && (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleEditActivity}
                      className="p-2 text-gray-400 hover:text-primary-600 rounded-full hover:bg-gray-100"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleDeleteActivity}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="prose max-w-none mb-6">
                <p>{activity.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start">
                  <CalendarIcon className="flex-shrink-0 mt-1 mr-2 h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Thời gian</div>
                    <div className="text-sm text-gray-500">
                      <div>Bắt đầu: {formatDate(activity.start_date)}</div>
                      <div>Kết thúc: {formatDate(activity.end_date)}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPinIcon className="flex-shrink-0 mt-1 mr-2 h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Địa điểm</div>
                    <div className="text-sm text-gray-500">{activity.location || 'Chưa cập nhật'}</div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <UserGroupIcon className="flex-shrink-0 mt-1 mr-2 h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Ban tổ chức</div>
                    <div className="text-sm text-gray-500">
                      {activity.organizer?.full_name || 'Không xác định'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <ClockIcon className="flex-shrink-0 mt-1 mr-2 h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Trạng thái</div>
                    <div className="text-sm text-gray-500">
                      {activity.status === 'Upcoming' ? 'Sắp diễn ra' : 
                      activity.status === 'Ongoing' ? 'Đang diễn ra' : 'Đã hoàn thành'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Participation button */}
              {activity.status !== 'Completed' && (
                <div className="flex justify-center">
                  <button
                    onClick={handleParticipation}
                    className={`btn ${isParticipating ? 'btn-secondary' : 'btn-primary'} w-full md:w-auto`}
                  >
                    {isParticipating ? 'Hủy tham gia' : 'Đăng ký tham gia'}
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Additional activity details could go here */}
          <div className="card mt-8">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Thông tin chi tiết</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-500">Sẽ cập nhật thêm thông tin chi tiết khi có.</p>
            </div>
          </div>
        </div>
        
        {/* Participants */}
        <div>
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Người tham gia</h3>
              <span className="badge badge-primary">{participants.length}</span>
            </div>
            
            <div className="divide-y divide-gray-200">
              {participants.length > 0 ? (
                participants.map((participant) => (
                  <div key={participant.id} className="p-4 flex items-center">
                    <img
                      className="h-10 w-10 rounded-full mr-4"
                      src={participant.avatar || youth.avatarDefault}
                      alt={participant.full_name}
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{participant.full_name}</div>
                      <div className="text-xs text-gray-500">{participant.email}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500">
                  Chưa có người tham gia
                </div>
              )}
            </div>
          </div>
          
          {/* Activity Timeline */}
          <div className="card mt-8">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Lịch trình</h3>
            </div>
            <div className="p-4">
              <ol className="relative border-l border-gray-200 ml-3">
                <li className="mb-6 ml-6">
                  <span className="absolute flex items-center justify-center w-6 h-6 bg-primary-100 rounded-full -left-3 ring-8 ring-white">
                    <CalendarIcon className="w-3 h-3 text-primary-600" />
                  </span>
                  <h3 className="flex items-center mb-1 text-sm font-semibold text-gray-900">
                    Đăng ký tham gia
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded ml-3">
                      Hiện tại
                    </span>
                  </h3>
                  <time className="block mb-2 text-xs font-normal leading-none text-gray-400">
                    {new Date().toLocaleDateString('vi-VN')}
                  </time>
                  <p className="text-sm font-normal text-gray-500">
                    Đăng ký tham gia hoạt động
                  </p>
                </li>
                <li className="mb-6 ml-6">
                  <span className="absolute flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full -left-3 ring-8 ring-white">
                    <CalendarIcon className="w-3 h-3 text-gray-500" />
                  </span>
                  <h3 className="mb-1 text-sm font-semibold text-gray-900">Bắt đầu hoạt động</h3>
                  <time className="block mb-2 text-xs font-normal leading-none text-gray-400">
                    {formatDate(activity.start_date)}
                  </time>
                  <p className="text-sm font-normal text-gray-500">
                    Hoạt động chính thức bắt đầu
                  </p>
                </li>
                <li className="ml-6">
                  <span className="absolute flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full -left-3 ring-8 ring-white">
                    <CalendarIcon className="w-3 h-3 text-gray-500" />
                  </span>
                  <h3 className="mb-1 text-sm font-semibold text-gray-900">Kết thúc hoạt động</h3>
                  <time className="block mb-2 text-xs font-normal leading-none text-gray-400">
                    {formatDate(activity.end_date)}
                  </time>
                  <p className="text-sm font-normal text-gray-500">
                    Hoạt động kết thúc
                  </p>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
      
      {/* Edit Modal */}
      {showEditModal && (
        <ActivityModal
          isOpen={showEditModal}
          activity={activity ? mapActivityToForm(activity) : null}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveActivity}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <ConfirmModal
          isOpen={showDeleteModal}
          title="Xóa hoạt động"
          message={`Bạn có chắc chắn muốn xóa hoạt động "${activity.title}"? Hành động này không thể hoàn tác.`}
          confirmText="Xóa"
          cancelText="Hủy"
          confirmButtonClass="btn-danger"
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDeleteActivity}
        />
      )}
    </div>
  );
};

export default ActivityDetailPage; 