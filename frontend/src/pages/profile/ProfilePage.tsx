import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, UserRole, Activity } from '@/types';
import { getProfile, updateProfile, changePassword, uploadAvatar, getUserActivities, getUserStats, UserStats } from '@/services/profileService';
import { toast } from 'react-toastify';
import { youth } from '@/assets/images';
import {
UserIcon,
  EnvelopeIcon,
  KeyIcon,
  CalendarIcon,
  AcademicCapIcon,
  IdentificationIcon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  TrophyIcon,
  ChartBarIcon,
  ArrowUpIcon,
  CheckBadgeIcon,
  CameraIcon,
  BellIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import { formatDate } from '@/utils/dateUtils';

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Thông tin học vấn và liên hệ bổ sung
  const [studentId, setStudentId] = useState('');
  const [faculty, setFaculty] = useState('');
  const [classroom, setClassroom] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  
  // Danh sách hoạt động đã tham gia
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  
  // Số liệu thống kê
  const [stats, setStats] = useState<UserStats>({
    activitiesCount: 0,
    activityPoints: 0,
    ranking: 0,
    totalMembers: 0,
    badges: 0,
    attendanceRate: 0
  });
  
  // Tab quản lý
  const [activeTab, setActiveTab] = useState<'info' | 'activities' | 'settings'>('info');
  
  useEffect(() => {
    // Tải thông tin profile
    const fetchProfileData = async () => {
      try {
        const profileData = await getProfile();
        if (profileData) {
          setFullName(profileData.full_name);
          setEmail(profileData.email);
          setAvatarPreview(profileData.avatar || null);
          
          // Thiết lập các thông tin bổ sung nếu có
          setStudentId(profileData.student_id || '');
          setFaculty(profileData.department || '');
          setPhoneNumber(profileData.phone_number || '');
          
          // Cập nhật thông tin user trong auth context
          setUser(profileData);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Không thể tải thông tin người dùng');
      }
    };
    
    // Tải thống kê
    const fetchUserStats = async () => {
      try {
        const userStats = await getUserStats();
        setStats(userStats);
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    };
    
    fetchProfileData();
    fetchUserStats();
    fetchActivities();
  }, [user?.id]);
  
  const fetchActivities = async () => {
    setIsLoadingActivities(true);
    try {
      const response = await getUserActivities();
      setActivities(response.results);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Không thể tải danh sách hoạt động đã tham gia');
    } finally {
      setIsLoadingActivities(false);
    }
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const validateProfileForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ tên';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Vui lòng nhập số điện thoại';
    } else if (!/^\d{10,11}$/.test(phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Số điện thoại không hợp lệ';
    }
    
    if (!dateOfBirth) {
      newErrors.dateOfBirth = 'Vui lòng chọn ngày sinh';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validatePasswordForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!currentPassword) {
      newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    }
    
    if (!newPassword) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Mật khẩu phải có ít nhất 8 ký tự';
    }
    
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Cập nhật avatar trước nếu có thay đổi
      let avatarUrl = user?.avatar;
      
      if (avatarFile) {
        const uploadResult = await uploadAvatar(avatarFile);
        avatarUrl = uploadResult.avatar;
      }
      
      // Cập nhật thông tin profile
      const profileData = {
        full_name: fullName,
        email,
        phone_number: phoneNumber,
        student_id: studentId,
        department: faculty,
        // Các trường khác nếu cần
      };
      
      const updatedUser = await updateProfile(profileData);
      
      // Cập nhật lại user trong context
      if (updatedUser) {
        setUser({
          ...updatedUser,
          avatar: avatarUrl // Đảm bảo avatar mới được cập nhật
        });
        
        toast.success('Cập nhật thông tin thành công');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Không thể cập nhật thông tin. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await changePassword(currentPassword, newPassword);
      
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      toast.success('Đổi mật khẩu thành công');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Các huy hiệu và thành tựu
  const badges = [
    { id: 1, name: 'Tình nguyện viên xuất sắc', icon: '🌟', year: 2023 },
    { id: 2, name: 'Đoàn viên tiêu biểu', icon: '🏆', year: 2023 },
    { id: 3, name: 'Hiến máu tình nguyện', icon: '❤️', year: 2022 }
  ];
  
  if (!user) {
    return (
      <div className="text-center py-10">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
        <p className="mt-4 text-gray-500">Đang tải thông tin...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Hồ sơ cá nhân</h1>
      
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative rounded-full overflow-hidden h-32 w-32 mb-4 bg-gray-100">
              <img
                src={avatarPreview || user.avatar || youth.avatarDefault}
                alt={user.full_name}
                className="h-full w-full object-cover"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
              >
                <span className="text-white text-sm font-medium">Thay đổi</span>
              </label>
              <input
                id="avatar-upload"
                name="avatar"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{user.full_name}</h2>
            <div className="mt-1 flex items-center justify-center">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${user.role === UserRole.ADMIN ? 'bg-red-100 text-red-800' : 
                user.role === UserRole.CANBODOAN ? 'bg-blue-100 text-blue-800' : 
                'bg-green-100 text-green-800'}`}>
                {user.role === UserRole.ADMIN ? 'Quản trị viên' : 
                user.role === UserRole.CANBODOAN ? 'Cán bộ Đoàn' : 'Đoàn viên'}
              </span>
            </div>
          </div>
          
          {/* User info */}
          <div className="flex-1 md:ml-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start">
                <UserIcon className="flex-shrink-0 mr-2 h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-500">Họ và tên</div>
                  <div className="text-sm text-gray-900">{user.full_name}</div>
                </div>
              </div>
              
              <div className="flex items-start">
                <EnvelopeIcon className="flex-shrink-0 mr-2 h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-500">Email</div>
                  <div className="text-sm text-gray-900">{user.email}</div>
                </div>
              </div>
              
              <div className="flex items-start">
                <IdentificationIcon className="flex-shrink-0 mr-2 h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-500">MSSV</div>
                  <div className="text-sm text-gray-900">{studentId || 'Chưa cập nhật'}</div>
                </div>
              </div>
              
              <div className="flex items-start">
                <AcademicCapIcon className="flex-shrink-0 mr-2 h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-500">Khoa</div>
                  <div className="text-sm text-gray-900">{faculty || 'Chưa cập nhật'}</div>
                </div>
              </div>
              
              <div className="flex items-start">
                <PhoneIcon className="flex-shrink-0 mr-2 h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-500">Số điện thoại</div>
                  <div className="text-sm text-gray-900">{phoneNumber || 'Chưa cập nhật'}</div>
                </div>
              </div>
              
              <div className="flex items-start">
                <CalendarIcon className="flex-shrink-0 mr-2 h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-500">Ngày sinh</div>
                  <div className="text-sm text-gray-900">
                    {dateOfBirth ? new Date(dateOfBirth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-start">
                <MapPinIcon className="flex-shrink-0 mr-2 h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-500">Địa chỉ</div>
                  <div className="text-sm text-gray-900">{address || 'Chưa cập nhật'}</div>
                </div>
              </div>
              
              <div className="flex items-start">
                <ClockIcon className="flex-shrink-0 mr-2 h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-500">Ngày tham gia</div>
                  <div className="text-sm text-gray-900">
                    {new Date(user.date_joined).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={() => setActiveTab('settings')}
                className="btn btn-primary"
              >
                Chỉnh sửa thông tin
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-primary-100 text-primary-600">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Hoạt động đã tham gia</h3>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold text-gray-900">{stats.activitiesCount}</span>
                <span className="ml-2 text-sm text-green-600">+3 tháng này</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-green-100 text-green-600">
              <TrophyIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Điểm hoạt động</h3>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold text-gray-900">{stats.activityPoints}</span>
                <span className="ml-2 text-sm text-green-600">+15 tháng này</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center">
            <div className="p-3 rounded-md bg-blue-100 text-blue-600">
              <UserIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Xếp hạng</h3>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold text-gray-900">{stats.ranking}/{stats.totalMembers}</span>
                <span className="ml-2 text-sm text-green-600">Top 10%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'info'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('info')}
          >
            Thông tin
          </button>
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'activities'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('activities')}
          >
            Hoạt động đã tham gia
          </button>
          <button
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('settings')}
          >
            Cài đặt
          </button>
        </nav>
      </div>
      
      {/* Tab content */}
      {activeTab === 'info' && (
        <div>
          {/* Badges */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Huy hiệu và thành tựu</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {badges.map(badge => (
                <div key={badge.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex items-center">
                    <div className="text-3xl mr-3">{badge.icon}</div>
                    <div>
                      <h3 className="font-medium text-gray-900">{badge.name}</h3>
                      <p className="text-sm text-gray-500">Năm {badge.year}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Additional Information */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Thông tin bổ sung</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
              <div>
                <dt className="text-sm font-medium text-gray-500">Chức vụ</dt>
                <dd className="mt-1 text-sm text-gray-900">Lớp trưởng</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Chi đoàn</dt>
                <dd className="mt-1 text-sm text-gray-900">Chi đoàn CNTT 2</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Đợt kết nạp</dt>
                <dd className="mt-1 text-sm text-gray-900">26/03/2020</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Ngày đóng đoàn phí gần nhất</dt>
                <dd className="mt-1 text-sm text-gray-900">15/09/2023</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Điểm rèn luyện</dt>
                <dd className="mt-1 text-sm text-gray-900">85/100 (Học kỳ 1 năm 2023-2024)</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Kỹ năng</dt>
                <dd className="mt-1 text-sm text-gray-900">Tổ chức sự kiện, Truyền thông, Lập trình</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
      
      {activeTab === 'activities' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Hoạt động đã tham gia</h2>
          </div>
          
          {isLoadingActivities ? (
            <div className="p-6 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
              <p className="mt-4 text-gray-500">Đang tải danh sách hoạt động...</p>
            </div>
          ) : activities.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {activities.map(activity => (
                <div key={activity.id} className="p-6 hover:bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{activity.title}</h3>
                      <p className="mt-1 text-sm text-gray-600">{activity.description}</p>
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                          <span>{formatDate(activity.start_date)}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPinIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                          <span>{activity.location}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${activity.attendance_status === 'Attended' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {activity.attendance_status === 'Attended' ? 'Đã tham gia' : 'Đăng ký'}
                      </span>
                      {activity.attendance_status === 'Attended' && (
                        <div className="mt-2 flex items-center">
                          <span className="text-sm text-gray-500 mr-2">Điểm nhận được:</span>
                          <span className="font-medium text-green-600">+5</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              Bạn chưa tham gia hoạt động nào
            </div>
          )}
          
          {activities.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{activities.length}</span> trong số{' '}
                  <span className="font-medium">{stats.activitiesCount}</span> hoạt động
                </div>
                <div className="flex items-center space-x-2">
                  <button className="btn btn-sm bg-white text-gray-700 border border-gray-300">
                    Trước
                  </button>
                  <button className="btn btn-sm bg-white text-gray-700 border border-gray-300">
                    Tiếp
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Update profile form - Thiết kế form đẹp hơn */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-3">
                <UserIcon className="h-5 w-5 text-primary-600" />
                <h2 className="text-xl font-bold text-gray-900">Cập nhật thông tin cá nhân</h2>
              </div>
              <div className="p-8">
                <form onSubmit={handleUpdateProfile} className="space-y-8">
                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-1">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        className={`block w-full rounded-lg px-4 py-3 bg-gray-50 border ${errors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-200'} focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition-colors duration-200`}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                      {errors.fullName && <p className="mt-2 text-sm text-red-600">{errors.fullName}</p>}
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        className={`block w-full rounded-lg px-4 py-3 bg-gray-50 border ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-200'} focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition-colors duration-200`}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                    </div>
                    
                    <div>
                      <label htmlFor="studentId" className="block text-sm font-semibold text-gray-700 mb-1">
                        MSSV
                      </label>
                      <input
                        type="text"
                        id="studentId"
                        className="block w-full rounded-lg px-4 py-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition-colors duration-200"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="faculty" className="block text-sm font-semibold text-gray-700 mb-1">
                        Khoa
                      </label>
                      <input
                        type="text"
                        id="faculty"
                        className="block w-full rounded-lg px-4 py-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition-colors duration-200"
                        value={faculty}
                        onChange={(e) => setFaculty(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="classroom" className="block text-sm font-semibold text-gray-700 mb-1">
                        Lớp
                      </label>
                      <input
                        type="text"
                        id="classroom"
                        className="block w-full rounded-lg px-4 py-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition-colors duration-200"
                        value={classroom}
                        onChange={(e) => setClassroom(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-700 mb-1">
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phoneNumber"
                        className={`block w-full rounded-lg px-4 py-3 bg-gray-50 border ${errors.phoneNumber ? 'border-red-500 bg-red-50' : 'border-gray-200'} focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition-colors duration-200`}
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                      {errors.phoneNumber && <p className="mt-2 text-sm text-red-600">{errors.phoneNumber}</p>}
                    </div>
                    
                    <div>
                      <label htmlFor="dateOfBirth" className="block text-sm font-semibold text-gray-700 mb-1">
                        Ngày sinh <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="dateOfBirth"
                        className={`block w-full rounded-lg px-4 py-3 bg-gray-50 border ${errors.dateOfBirth ? 'border-red-500 bg-red-50' : 'border-gray-200'} focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition-colors duration-200`}
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                      />
                      {errors.dateOfBirth && <p className="mt-2 text-sm text-red-600">{errors.dateOfBirth}</p>}
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-1">
                        Địa chỉ
                      </label>
                      <input
                        type="text"
                        id="address"
                        className="block w-full rounded-lg px-4 py-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition-colors duration-200"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Đang lưu...
                        </>
                      ) : (
                        'Lưu thay đổi'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            
            {/* Upload new avatar - Thiết kế mới */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-8">
              <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-3">
                <CameraIcon className="h-5 w-5 text-primary-600" />
                <h2 className="text-xl font-bold text-gray-900">Ảnh đại diện</h2>
              </div>
              <div className="p-8">
                <div className="flex flex-col sm:flex-row items-center gap-8">
                  <div className="relative rounded-full overflow-hidden h-32 w-32 bg-gray-100 border-4 border-gray-100 shadow-md">
                    <img
                      src={avatarPreview || user.avatar || youth.avatarDefault}
                      alt={user.full_name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Thay đổi ảnh đại diện
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        id="avatar"
                        name="avatar"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleAvatarChange}
                      />
                      <label
                        htmlFor="avatar"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <CameraIcon className="-ml-1 mr-2 h-4 w-4" />
                        Chọn ảnh
                      </label>
                      {avatarFile && (
                        <button
                          type="button"
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          onClick={() => {
                            // Handle avatar upload
                            toast.success('Cập nhật ảnh đại diện thành công');
                          }}
                        >
                          <ArrowUpIcon className="-ml-1 mr-2 h-4 w-4" />
                          Tải lên
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Chấp nhận các định dạng JPG, GIF hoặc PNG. Kích thước tối đa 2MB.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Change password - Thiết kế form đẹp hơn */}
          <div>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-3">
                <KeyIcon className="h-5 w-5 text-primary-600" />
                <h2 className="text-xl font-bold text-gray-900">Đổi mật khẩu</h2>
              </div>
              <div className="p-8">
                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-semibold text-gray-700 mb-1">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      className={`block w-full rounded-lg px-4 py-3 bg-gray-50 border ${errors.currentPassword ? 'border-red-500 bg-red-50' : 'border-gray-200'} focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition-colors duration-200`}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    {errors.currentPassword && <p className="mt-2 text-sm text-red-600">{errors.currentPassword}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-1">
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      className={`block w-full rounded-lg px-4 py-3 bg-gray-50 border ${errors.newPassword ? 'border-red-500 bg-red-50' : 'border-gray-200'} focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition-colors duration-200`}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    {errors.newPassword && <p className="mt-2 text-sm text-red-600">{errors.newPassword}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1">
                      Xác nhận mật khẩu mới
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      className={`block w-full rounded-lg px-4 py-3 bg-gray-50 border ${errors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-gray-200'} focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition-colors duration-200`}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    {errors.confirmPassword && <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>}
                  </div>
                  
                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            
            {/* Additional Settings */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden mt-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Cài đặt thông báo</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="email-notifications"
                        name="email-notifications"
                        type="checkbox"
                        className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        defaultChecked
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="email-notifications" className="font-medium text-gray-700">
                        Nhận thông báo qua email
                      </label>
                      <p className="text-gray-500">Nhận email khi có hoạt động mới hoặc thông báo quan trọng</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="activity-reminder"
                        name="activity-reminder"
                        type="checkbox"
                        className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        defaultChecked
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="activity-reminder" className="font-medium text-gray-700">
                        Nhắc nhở hoạt động
                      </label>
                      <p className="text-gray-500">Gửi nhắc nhở trước khi hoạt động bắt đầu</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="new-activities"
                        name="new-activities"
                        type="checkbox"
                        className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        defaultChecked
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="new-activities" className="font-medium text-gray-700">
                        Hoạt động mới
                      </label>
                      <p className="text-gray-500">Thông báo khi có hoạt động mới được tạo</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <button className="btn btn-primary" onClick={() => toast.success('Cập nhật cài đặt thành công')}>
                    Lưu cài đặt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage; 