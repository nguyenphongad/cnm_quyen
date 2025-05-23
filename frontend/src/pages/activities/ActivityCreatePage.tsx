import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Activity, ActivityStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { createActivity, getActivity, updateActivity } from '@/services/activityService';
import Button from '@/components/common/Button';
import { toast } from 'react-toastify';
import { ArrowLeftIcon, CalendarIcon, MapPinIcon, DocumentTextIcon, UserGroupIcon, ClockIcon, PhotoIcon } from '@heroicons/react/24/outline';

const ACTIVITY_TYPES = [
  { value: 'Học tập', label: 'Học tập' },
  { value: 'Tình nguyện', label: 'Tình nguyện' },
  { value: 'Văn hóa', label: 'Văn hóa' },
  { value: 'Thể thao', label: 'Thể thao' },
  { value: 'Khác', label: 'Khác' },
];

interface ActivityForm {
  title: string;
  description: string;
  location: string;
  start_time: string; 
  end_time: string;
  registration_deadline: string;
  type: string;
  max_participants: number | null;
  status: ActivityStatus;
  image?: File | null;
  sendNotification: boolean;
}

interface FormErrors {
  title?: string;
  description?: string;
  location?: string;
  start_time?: string;
  end_time?: string;
  registration_deadline?: string;
  type?: string;
  max_participants?: string;
  image?: string;
}

const ActivityCreatePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState<ActivityForm>({
    title: '',
    description: '',
    location: '',
    start_time: '',
    end_time: '',
    registration_deadline: '',
    type: ACTIVITY_TYPES[0].value,
    max_participants: null,
    status: ActivityStatus.DRAFT,
    image: null,
    sendNotification: true
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Nếu người dùng không phải là admin hoặc cán bộ đoàn, chuyển hướng về trang chủ
    if (user && user.role !== 'ADMIN' && user.role !== 'CAN_BO_DOAN') {
      navigate('/unauthorized');
    }
    
    // Trong chế độ chỉnh sửa, tải thông tin hoạt động
    if (isEditMode && id) {
      console.log("Attempting to fetch activity with ID:", id);
      fetchActivityDetails(parseInt(id));
    }
  }, [user, navigate, isEditMode, id]);

  const fetchActivityDetails = async (activityId: number) => {
    setIsLoading(true);
    try {
      console.log("Fetching activity details with ID:", activityId);
      const activityData = await getActivity(activityId);
      console.log("Activity data received:", activityData);
      
      // Format dates for datetime-local inputs
      const formatDateForInput = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16); // Format to "yyyy-MM-ddThh:mm"
      };
      
      setFormData({
        title: activityData.title || '',
        description: activityData.description || '',
        location: activityData.location || '',
        start_time: formatDateForInput(activityData.start_date),
        end_time: formatDateForInput(activityData.end_date),
        registration_deadline: formatDateForInput(activityData.registration_deadline || ''),
        type: activityData.type || ACTIVITY_TYPES[0].value,
        max_participants: activityData.max_participants || null,
        status: activityData.status as ActivityStatus || ActivityStatus.DRAFT,
        image: null,
        sendNotification: true
      });
      
      // Hiển thị ảnh hiện tại nếu có
      if (activityData.image) {
        setImagePreview(activityData.image);
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
      toast.error('Không thể tải thông tin hoạt động');
      navigate('/activities-management');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Xóa lỗi khi người dùng nhập lại
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Kiểm tra kích thước file (giới hạn 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ 
          ...prev, 
          image: 'Kích thước ảnh không được vượt quá 5MB' 
        }));
        return;
      }
      
      // Kiểm tra định dạng file
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ 
          ...prev, 
          image: 'Định dạng ảnh không hợp lệ. Chấp nhận: JPG, PNG, GIF, WEBP' 
        }));
        return;
      }
      
      // Tạo URL preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      setFormData(prev => ({ ...prev, image: file }));
      setErrors(prev => ({ ...prev, image: undefined }));
    } else {
      setFormData(prev => ({ ...prev, image: null }));
      setImagePreview(null);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Tiêu đề không được để trống';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Mô tả không được để trống';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Địa điểm không được để trống';
    }
    
    if (!formData.start_time) {
      newErrors.start_time = 'Thời gian bắt đầu không được để trống';
    }
    
    if (!formData.end_time) {
      newErrors.end_time = 'Thời gian kết thúc không được để trống';
    } else if (formData.start_time && new Date(formData.end_time) <= new Date(formData.start_time)) {
      newErrors.end_time = 'Thời gian kết thúc phải lớn hơn thời gian bắt đầu';
    }
    
    if (!formData.registration_deadline) {
      newErrors.registration_deadline = 'Hạn đăng ký không được để trống';
    } else if (formData.start_time && new Date(formData.registration_deadline) >= new Date(formData.start_time)) {
      newErrors.registration_deadline = 'Hạn đăng ký phải trước thời gian bắt đầu';
    }
    
    if (!formData.type) {
      newErrors.type = 'Loại hoạt động không được để trống';
    }
    
    if (formData.max_participants !== null && formData.max_participants <= 0) {
      newErrors.max_participants = 'Số người tham gia tối đa phải lớn hơn 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Vui lòng điền đầy đủ thông tin hợp lệ');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Chuẩn bị dữ liệu gửi lên API
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('location', formData.location);
      // Đảm bảo tên trường khớp với backend
      formDataToSend.append('start_date', formData.start_time);
      formDataToSend.append('end_date', formData.end_time);
      formDataToSend.append('registration_deadline', formData.registration_deadline);
      // Gửi loại hoạt động với tên trường 'type' để khớp với model backend
      formDataToSend.append('type', formData.type);
      
      // Đảm bảo giá trị status đúng định dạng cho backend
      console.log('Status gửi lên API:', formData.status);
      formDataToSend.append('status', formData.status);
      
      // Thêm option gửi thông báo
      formDataToSend.append('send_notification', formData.sendNotification.toString());
      
      // Thêm user ID nếu đang đăng nhập
      if (user && user.id) {
        formDataToSend.append('user', user.id.toString());
      }
      
      if (formData.max_participants !== null) {
        formDataToSend.append('max_participants', formData.max_participants.toString());
      }
      
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }
      
      // Log dữ liệu để debug
      console.log('Dữ liệu gửi lên API:', Object.fromEntries(formDataToSend));
      
      if (isEditMode && id) {
        // Cập nhật hoạt động
        await updateActivity(parseInt(id), formDataToSend as any);
        toast.success('Cập nhật hoạt động thành công');
      } else {
        // Tạo hoạt động mới
        await createActivity(formDataToSend);
        toast.success('Tạo hoạt động mới thành công');
      }
      
      // Chuyển hướng về trang quản lý hoạt động
      navigate('/activities-management');
    } catch (error: any) {
      console.error('Error creating activity:', error);
      
      // Xử lý lỗi từ API
      if (error.response && error.response.data) {
        const apiErrors = error.response.data;
        const formattedErrors: FormErrors = {};
        
        console.log('API response errors:', apiErrors);
        
        // Chuyển đổi lỗi từ API sang định dạng của form
        Object.entries(apiErrors).forEach(([key, value]) => {
          // Chuyển đổi tên trường từ backend sang frontend
          let fieldName = key;
          if (key === 'start_date') fieldName = 'start_time';
          if (key === 'end_date') fieldName = 'end_time';
          if (key === 'type') fieldName = 'type';
          
          if (key === 'non_field_errors') {
            toast.error(Array.isArray(value) ? value[0] : String(value));
          } else {
            formattedErrors[fieldName as keyof FormErrors] = Array.isArray(value) ? value[0] : String(value);
          }
        });
        
        setErrors(formattedErrors);
        toast.error('Không thể tạo hoạt động. Vui lòng kiểm tra lại thông tin');
      } else {
        toast.error('Có lỗi xảy ra khi tạo hoạt động');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center">
        <button 
          onClick={() => navigate('/activities-management')}
          className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeftIcon className="h-6 w-6 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Chỉnh sửa hoạt động' : 'Tạo hoạt động mới'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isEditMode 
              ? 'Cập nhật thông tin hoạt động' 
              : 'Tạo hoạt động mới cho đoàn viên tham gia'
            }
          </p>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tiêu đề */}
            <div className="col-span-full">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`pl-10 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.title ? 'border-red-500' : ''}`}
                  placeholder="Nhập tiêu đề hoạt động"
                />
              </div>
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>
            
            {/* Mô tả */}
            <div className="col-span-full">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Mô tả <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.description ? 'border-red-500' : ''}`}
                  placeholder="Nhập mô tả chi tiết về hoạt động"
                />
              </div>
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>
            
            {/* Địa điểm */}
            <div className="col-span-full md:col-span-1">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Địa điểm <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPinIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className={`pl-10 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.location ? 'border-red-500' : ''}`}
                  placeholder="Nhập địa điểm tổ chức"
                />
              </div>
              {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
            </div>
            
            {/* Loại hoạt động */}
            <div className="col-span-full md:col-span-1">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Loại hoạt động <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className={`focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.type ? 'border-red-500' : ''}`}
                >
                  {ACTIVITY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
            </div>
            
            {/* Thời gian bắt đầu */}
            <div>
              <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
                Thời gian bắt đầu <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="datetime-local"
                  id="start_time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  className={`pl-10 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.start_time ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.start_time && <p className="mt-1 text-sm text-red-600">{errors.start_time}</p>}
            </div>
            
            {/* Thời gian kết thúc */}
            <div>
              <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">
                Thời gian kết thúc <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="datetime-local"
                  id="end_time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  className={`pl-10 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.end_time ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.end_time && <p className="mt-1 text-sm text-red-600">{errors.end_time}</p>}
            </div>
            
            {/* Hạn đăng ký */}
            <div>
              <label htmlFor="registration_deadline" className="block text-sm font-medium text-gray-700">
                Hạn đăng ký <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="datetime-local"
                  id="registration_deadline"
                  name="registration_deadline"
                  value={formData.registration_deadline}
                  onChange={handleInputChange}
                  className={`pl-10 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.registration_deadline ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.registration_deadline && <p className="mt-1 text-sm text-red-600">{errors.registration_deadline}</p>}
            </div>
            
            {/* Số người tham gia tối đa */}
            <div>
              <label htmlFor="max_participants" className="block text-sm font-medium text-gray-700">
                Số người tham gia tối đa
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserGroupIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="max_participants"
                  name="max_participants"
                  value={formData.max_participants === null ? '' : formData.max_participants}
                  onChange={(e) => {
                    const value = e.target.value === '' ? null : parseInt(e.target.value);
                    setFormData(prev => ({ ...prev, max_participants: value }));
                    if (errors.max_participants) {
                      setErrors(prev => ({ ...prev, max_participants: undefined }));
                    }
                  }}
                  className={`pl-10 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.max_participants ? 'border-red-500' : ''}`}
                  placeholder="Để trống nếu không giới hạn"
                  min="1"
                />
              </div>
              {errors.max_participants ? (
                <p className="mt-1 text-sm text-red-600">{errors.max_participants}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">Để trống nếu không giới hạn số lượng người tham gia</p>
              )}
            </div>
            
            {/* Trạng thái */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Trạng thái
              </label>
              <div className="mt-1">
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                >
                  <option value={ActivityStatus.DRAFT}>Sắp diễn ra</option>
                  <option value={ActivityStatus.ONGOING}>Đang diễn ra</option>
                  <option value={ActivityStatus.COMPLETED}>Đã hoàn thành</option>
                </select>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Chọn "Sắp diễn ra" nếu hoạt động chưa bắt đầu, "Đang diễn ra" nếu hoạt động đang diễn ra, hoặc "Đã hoàn thành" nếu hoạt động đã kết thúc
              </p>
            </div>
            
            {/* Gửi thông báo */}
            <div>
              <div className="flex items-center mt-4">
                <input
                  id="sendNotification"
                  name="sendNotification"
                  type="checkbox"
                  checked={formData.sendNotification}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      sendNotification: e.target.checked
                    }));
                  }}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="sendNotification" className="ml-2 block text-sm text-gray-700">
                  Gửi thông báo đến tất cả đoàn viên
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500 ml-6">
                Khi bật tùy chọn này, hệ thống sẽ gửi thông báo về hoạt động mới đến tất cả đoàn viên
              </p>
            </div>
            
            {/* Ảnh */}
            <div className="col-span-full">
              <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                Hình ảnh
              </label>
              <div className="mt-1 flex items-center space-x-4">
                <div className="flex justify-center items-center w-32 h-32 border-2 border-gray-300 border-dashed rounded-md overflow-hidden">
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="space-y-1 text-center">
                      <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="text-xs text-gray-500">Chưa có ảnh</div>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="image-upload"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 cursor-pointer"
                  >
                    <PhotoIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
                    Chọn ảnh
                  </label>
                  <input
                    id="image-upload"
                    name="image"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleImageChange}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Ảnh sẽ được hiển thị trong trang chi tiết hoạt động. Kích thước tối đa 5MB, định dạng JPG, PNG, GIF, WEBP.
                  </p>
                </div>
              </div>
              {errors.image && <p className="mt-1 text-sm text-red-600">{errors.image}</p>}
            </div>
          </div>
          
          <div className="mt-8 flex items-center justify-end space-x-4">
            <Button 
              type="button" 
              onClick={() => navigate('/activities-management')}
              className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            >
              Hủy
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className={`${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xử lý...
                </>
              ) : isEditMode ? 'Cập nhật' : 'Tạo hoạt động'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActivityCreatePage; 