import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatDateForInput } from '../../utils/dateUtils';

interface Activity {
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
  participants?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ActivityModalProps {
  isOpen: boolean;
  activity: Activity | null;
  onClose: () => void;
  onSave: (activity: Activity) => void;
}

const ActivityModal = ({ isOpen, activity, onClose, onSave }: ActivityModalProps) => {
  const [formData, setFormData] = useState<Activity>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    maxParticipants: 0,
    type: 'volunteer',
    status: 'draft',
    points: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (activity) {
      setFormData({
        ...activity,
        startDate: formatDateForInput(activity.startDate),
        endDate: formatDateForInput(activity.endDate),
      });
    } else {
      // Set default dates for new activity
      const now = new Date();
      const startDate = new Date(now.getTime() + 86400000); // Tomorrow
      const endDate = new Date(startDate.getTime() + 7200000); // 2 hours after start

      setFormData({
        title: '',
        description: '',
        startDate: formatDateForInput(startDate.toISOString()),
        endDate: formatDateForInput(endDate.toISOString()),
        location: '',
        maxParticipants: 50,
        type: 'volunteer',
        status: 'draft',
        points: 5,
      });
    }
  }, [activity]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Tiêu đề không được để trống';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Mô tả không được để trống';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Ngày bắt đầu không được để trống';
    }
    
    if (!formData.endDate) {
      newErrors.endDate = 'Ngày kết thúc không được để trống';
    }
    
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Địa điểm không được để trống';
    }
    
    if (formData.maxParticipants <= 0) {
      newErrors.maxParticipants = 'Số người tham gia phải lớn hơn 0';
    }
    
    if (formData.points < 0) {
      newErrors.points = 'Điểm hoạt động không được âm';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 overflow-y-auto z-50">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {activity ? 'Chỉnh sửa hoạt động' : 'Tạo hoạt động mới'}
              </h3>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6 mb-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Tiêu đề
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleChange}
                    className="mt-1 block w-full"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Mô tả
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="mt-1 block w-full"
                  />
                </div>
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                    Ngày bắt đầu
                  </label>
                  <input
                    id="startDate"
                    name="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="mt-1 block w-full"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                    Ngày kết thúc
                  </label>
                  <input
                    id="endDate"
                    name="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="mt-1 block w-full"
                  />
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Địa điểm
                  </label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange}
                    className="mt-1 block w-full"
                  />
                </div>
                <div>
                  <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700">
                    Số người tham gia
                  </label>
                  <input
                    id="maxParticipants"
                    name="maxParticipants"
                    type="number"
                    value={formData.maxParticipants}
                    onChange={handleChange}
                    className="mt-1 block w-full"
                  />
                </div>
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    Loại hoạt động
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="mt-1 block w-full"
                  >
                    <option value="volunteer">Tình nguyện</option>
                    <option value="education">Giáo dục</option>
                    <option value="environment">Môi trường</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Trạng thái
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="mt-1 block w-full"
                  >
                    <option value="draft">Nháp</option>
                    <option value="published">Đã đăng</option>
                    <option value="canceled">Đã hủy</option>
                    <option value="completed">Đã hoàn thành</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="points" className="block text-sm font-medium text-gray-700">
                    Điểm hoạt động
                  </label>
                  <input
                    id="points"
                    name="points"
                    type="number"
                    value={formData.points}
                    onChange={handleChange}
                    className="mt-1 block w-full"
                  />
                </div>
              </div>
              <div className="mt-4">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityModal; 