import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserRole } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/common/Button';
import Table from '@/components/common/Table';
import SearchBar from '@/components/common/SearchBar';
import Alert from '@/components/common/Alert';
import api from '@/services/api';

interface ActivityRegistration {
  id: number;
  user: {
    id: number;
    username: string;
    full_name: string;
    email: string;
    student_id: string;
  };
  activity_id: number;
  registration_date: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Attended';
  attendance_date?: string;
  notes?: string;
}

interface Activity {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  location: string;
  max_participants: number;
  current_participants: number;
  status: 'Draft' | 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
}

const ActivityManageRegistrationsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [registrations, setRegistrations] = useState<ActivityRegistration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<ActivityRegistration[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<ActivityRegistration | null>(null);
  const [attendanceNote, setAttendanceNote] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if user has permission to manage registrations
  useEffect(() => {
    if (user?.role !== UserRole.ADMIN && user?.role !== UserRole.CAN_BO_DOAN) {
      navigate('/unauthorized');
    }
  }, [user, navigate]);

  // Fetch activity and registrations
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch activity details
        const activityResponse = await api.get(`/activities/${id}/`);
        setActivity(activityResponse.data);
        
        // Fetch registrations for this activity
        const registrationsResponse = await api.get(`/activities/${id}/registrations/`);
        setRegistrations(registrationsResponse.data.results || []);
        setFilteredRegistrations(registrationsResponse.data.results || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  // Filter registrations based on search term and status
  useEffect(() => {
    let result = registrations;
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(reg => 
        reg.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.user.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(reg => reg.status === statusFilter);
    }
    
    setFilteredRegistrations(result);
  }, [searchTerm, statusFilter, registrations]);

  // Handle status change
  const handleStatusChange = async (registrationId: number, newStatus: 'Approved' | 'Rejected') => {
    try {
      await api.patch(`/activity-registrations/${registrationId}/`, {
        status: newStatus
      });
      
      // Update local state
      setRegistrations(prev => prev.map(reg => 
        reg.id === registrationId ? { ...reg, status: newStatus } : reg
      ));
      
      setSuccessMessage(`Đã ${newStatus === 'Approved' ? 'chấp nhận' : 'từ chối'} đăng ký thành công!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error updating registration status:', error);
      setError('Có lỗi xảy ra khi cập nhật trạng thái. Vui lòng thử lại.');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Handle recording attendance
  const handleRecordAttendance = (registration: ActivityRegistration) => {
    setSelectedRegistration(registration);
    setAttendanceNote('');
    setShowAttendanceForm(true);
  };

  // Submit attendance
  const submitAttendance = async () => {
    if (!selectedRegistration) return;
    
    try {
      await api.patch(`/activity-registrations/${selectedRegistration.id}/`, {
        status: 'Attended',
        attendance_date: new Date().toISOString(),
        notes: attendanceNote
      });
      
      // Update local state
      setRegistrations(prev => prev.map(reg => 
        reg.id === selectedRegistration.id 
          ? { 
              ...reg, 
              status: 'Attended', 
              attendance_date: new Date().toISOString(),
              notes: attendanceNote
            } 
          : reg
      ));
      
      setShowAttendanceForm(false);
      setSuccessMessage(`Đã ghi nhận tham gia thành công!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error recording attendance:', error);
      setError('Có lỗi xảy ra khi ghi nhận tham gia. Vui lòng thử lại.');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Export registrations to CSV
  const exportToCSV = () => {
    if (!registrations.length) return;
    
    // Create CSV content
    let csvContent = "ID,Họ và tên,MSSV,Email,Ngày đăng ký,Trạng thái,Ngày tham gia,Ghi chú\n";
    
    registrations.forEach(reg => {
      const row = [
        reg.id,
        reg.user.full_name,
        reg.user.student_id,
        reg.user.email,
        new Date(reg.registration_date).toLocaleDateString(),
        reg.status,
        reg.attendance_date ? new Date(reg.attendance_date).toLocaleDateString() : '',
        reg.notes || ''
      ].join(',');
      
      csvContent += row + "\n";
    });
    
    // Create download link
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `activity-${id}-registrations.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert type="error" message={error} />
        <Button onClick={() => navigate('/activities-management')} className="mt-4">
          Quay lại danh sách hoạt động
        </Button>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert type="error" message="Không tìm thấy hoạt động" />
        <Button onClick={() => navigate('/activities-management')} className="mt-4">
          Quay lại danh sách hoạt động
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quản lý đăng ký hoạt động</h1>
          <h2 className="text-xl text-gray-700 mt-1">{activity.title}</h2>
        </div>
        <div>
          <Button 
            onClick={() => navigate('/activities-management')}
            variant="secondary"
            className="mr-2"
          >
            Quay lại
          </Button>
          <Button 
            onClick={exportToCSV}
            variant="primary"
            disabled={!registrations.length}
          >
            Xuất CSV
          </Button>
        </div>
      </div>

      {successMessage && (
        <Alert type="success" message={successMessage} className="mb-4" />
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-medium mb-4">Thông tin hoạt động</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Thời gian bắt đầu</p>
            <p className="font-medium">{new Date(activity.start_date).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Thời gian kết thúc</p>
            <p className="font-medium">{new Date(activity.end_date).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Hạn đăng ký</p>
            <p className="font-medium">{new Date(activity.registration_deadline).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Địa điểm</p>
            <p className="font-medium">{activity.location}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Số người tham gia tối đa</p>
            <p className="font-medium">{activity.max_participants}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Số người đã đăng ký</p>
            <p className="font-medium">{activity.current_participants}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Trạng thái</p>
            <p className="font-medium">
              <span className={`px-2 py-1 rounded-full text-xs font-medium
                ${activity.status === 'Draft' ? 'bg-gray-200 text-gray-800' : 
                activity.status === 'Upcoming' ? 'bg-yellow-100 text-yellow-800' :
                activity.status === 'Ongoing' ? 'bg-green-100 text-green-800' :
                activity.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'}`}>
                {activity.status === 'Draft' ? 'Bản nháp' :
                 activity.status === 'Upcoming' ? 'Sắp diễn ra' :
                 activity.status === 'Ongoing' ? 'Đang diễn ra' :
                 activity.status === 'Completed' ? 'Đã hoàn thành' :
                 'Đã hủy'}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-wrap justify-between items-center mb-6">
          <h3 className="text-lg font-medium">Danh sách đăng ký ({filteredRegistrations.length})</h3>
          <div className="flex flex-wrap items-center space-x-4 mt-2 md:mt-0">
            <div>
              <select
                className="border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="Pending">Chờ duyệt</option>
                <option value="Approved">Đã duyệt</option>
                <option value="Rejected">Từ chối</option>
                <option value="Attended">Đã tham gia</option>
              </select>
            </div>
            <SearchBar
              placeholder="Tìm kiếm theo tên, MSSV, email..."
              onSearch={setSearchTerm}
              className="w-full md:w-64"
            />
          </div>
        </div>

        {filteredRegistrations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sinh viên
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MSSV
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày đăng ký
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thông tin bổ sung
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRegistrations.map((registration) => (
                  <tr key={registration.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="font-medium text-gray-900">{registration.user?.full_name || registration.user_detail?.full_name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{registration.user?.email || registration.user_detail?.email || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{registration.user?.student_id || registration.user_detail?.student_id || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(registration.registration_date).toLocaleDateString()} 
                        <span className="text-gray-500 ml-1">
                          {new Date(registration.registration_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${registration.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                        registration.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        registration.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'}`}>
                        {registration.status === 'Pending' ? 'Chờ duyệt' :
                        registration.status === 'Approved' ? 'Đã duyệt' :
                        registration.status === 'Rejected' ? 'Từ chối' :
                        'Đã tham gia'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => {
                          // Hiển thị thông tin chi tiết
                          setSelectedRegistration(registration);
                          setAttendanceNote(registration.notes || '');
                          setShowAttendanceForm(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 text-sm"
                      >
                        Xem chi tiết
                      </button>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        {registration.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(registration.id, 'Approved')}
                              className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                            >
                              Phê duyệt
                            </button>
                            <button
                              onClick={() => handleStatusChange(registration.id, 'Rejected')}
                              className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                            >
                              Từ chối
                            </button>
                          </>
                        )}
                        {registration.status === 'Approved' && (
                          <button
                            onClick={() => handleRecordAttendance(registration)}
                            className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                          >
                            Điểm danh
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500">Không có đăng ký nào phù hợp với bộ lọc hiện tại</p>
          </div>
        )}
      </div>

      {showAttendanceForm && selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">
              {selectedRegistration.status === 'Attended' ? 'Thông tin tham gia' : 'Ghi nhận tham gia'}
            </h3>
            <p className="mb-2">
              <span className="font-medium">Sinh viên:</span> {selectedRegistration.user.full_name}
            </p>
            <p className="mb-2">
              <span className="font-medium">MSSV:</span> {selectedRegistration.user.student_id}
            </p>
            <p className="mb-2">
              <span className="font-medium">Email:</span> {selectedRegistration.user.email}
            </p>
            <p className="mb-2">
              <span className="font-medium">Ngày đăng ký:</span> {new Date(selectedRegistration.registration_date).toLocaleString()}
            </p>
            <p className="mb-4">
              <span className="font-medium">Trạng thái:</span> 
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium
                ${selectedRegistration.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                selectedRegistration.status === 'Approved' ? 'bg-green-100 text-green-800' :
                selectedRegistration.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'}`}>
                {selectedRegistration.status === 'Pending' ? 'Chờ duyệt' :
                 selectedRegistration.status === 'Approved' ? 'Đã duyệt' :
                 selectedRegistration.status === 'Rejected' ? 'Từ chối' :
                 'Đã tham gia'}
              </span>
            </p>
            <div className="mb-4">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Ghi chú
              </label>
              <textarea
                id="notes"
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={attendanceNote}
                onChange={(e) => setAttendanceNote(e.target.value)}
                disabled={selectedRegistration.status === 'Attended'}
                placeholder={selectedRegistration.status === 'Attended' ? 'Không có ghi chú' : 'Nhập ghi chú (nếu có)'}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => setShowAttendanceForm(false)}
                variant="secondary"
              >
                Đóng
              </Button>
              {selectedRegistration.status === 'Approved' && (
                <Button
                  onClick={submitAttendance}
                  variant="primary"
                >
                  Xác nhận tham gia
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityManageRegistrationsPage; 