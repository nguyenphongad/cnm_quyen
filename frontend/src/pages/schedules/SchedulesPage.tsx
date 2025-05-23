import { useState, useEffect } from 'react';
import { Schedule } from '@/types';
import { PlusIcon, CalendarIcon } from '@heroicons/react/24/outline';
import api from '@/services/api';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

const SchedulesPage = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'list' | 'month'>('list');
  const { user } = useAuth();

  const canCreateSchedule = user?.role === UserRole.ADMIN || user?.role === UserRole.CANBODOAN;

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setIsLoading(true);
    try {
      // Mô phỏng API call
      // const response = await api.get('/schedules/');
      // setSchedules(response.data);
      
      // Dữ liệu mẫu
      setTimeout(() => {
        setSchedules([
          {
            id: 1,
            title: 'Họp Ban Chấp hành Đoàn trường',
            description: 'Thảo luận kế hoạch hoạt động tháng 12 và chuẩn b'
          }
        ]);
      }, 1000);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Không thể tải danh sách lịch họp');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Rest of the component code remains unchanged */}
    </div>
  );
};

export default SchedulesPage; 