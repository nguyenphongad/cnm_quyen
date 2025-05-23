import React, { useState, useEffect } from 'react';
import { CalendarIcon, MapPinIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/dateUtils';
import { getWorkSchedules } from '@/services/calendarService';
import { Schedule } from '@/types';

const CalendarPage = () => {
  const [events, setEvents] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        
        // Lấy ngày đầu tiên và cuối cùng của tháng hiện tại để filter
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // Format dates as ISO strings for API
        const startDate = firstDay.toISOString().split('T')[0];
        const endDate = lastDay.toISOString().split('T')[0];
        
        const response = await getWorkSchedules(1, 100, startDate, endDate);
        setEvents(response.results);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching events:', error);
        alert('Không thể tải lịch công tác');
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [currentMonth]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const getMonthData = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Ngày đầu tiên của tháng
    const firstDay = new Date(year, month, 1);
    // Ngày cuối cùng của tháng
    const lastDay = new Date(year, month + 1, 0);
    
    // Lấy ngày trong tuần của ngày đầu tiên (0: Chủ nhật, 1: Thứ 2, ...)
    const firstDayIndex = firstDay.getDay();
    // Số ngày trong tháng
    const daysInMonth = lastDay.getDate();
    
    // Số ô cần hiển thị trước ngày đầu tiên của tháng
    const prevMonthDays = firstDayIndex;
    
    // Lấy số ngày của tháng trước
    const prevLastDay = new Date(year, month, 0).getDate();
    
    // Mảng chứa dữ liệu của các ngày hiển thị trên lịch
    const days = [];
    
    // Thêm ngày của tháng trước
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevLastDay - i),
        isCurrentMonth: false,
        events: [],
      });
    }
    
    // Thêm ngày của tháng hiện tại
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      // Lọc các sự kiện xảy ra vào ngày này
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.start_time);
        return (
          eventDate.getDate() === date.getDate() &&
          eventDate.getMonth() === date.getMonth() &&
          eventDate.getFullYear() === date.getFullYear()
        );
      });
      
      days.push({
        date,
        isCurrentMonth: true,
        events: dayEvents,
      });
    }
    
    // Số ô cần thêm để đủ 42 ô (6 hàng x 7 cột)
    const nextMonthDays = 42 - days.length;
    
    // Thêm ngày của tháng sau
    for (let i = 1; i <= nextMonthDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        events: [],
      });
    }
    
    return days;
  };

  const days = getMonthData();

  const getEventTypeClass = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-500';
      case 'Medium':
        return 'bg-orange-500';
      case 'Low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">Lịch công tác</h1>
          <p className="mt-1 text-sm text-gray-500">
            Theo dõi lịch hoạt động và công tác của Đoàn trường
          </p>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="h-60 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="p-4 flex items-center justify-between border-b border-gray-200">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-xl font-semibold text-gray-900">
                {currentMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-7 bg-gray-50">
              <div className="py-2 text-center text-sm font-medium text-gray-500">CN</div>
              <div className="py-2 text-center text-sm font-medium text-gray-500">T2</div>
              <div className="py-2 text-center text-sm font-medium text-gray-500">T3</div>
              <div className="py-2 text-center text-sm font-medium text-gray-500">T4</div>
              <div className="py-2 text-center text-sm font-medium text-gray-500">T5</div>
              <div className="py-2 text-center text-sm font-medium text-gray-500">T6</div>
              <div className="py-2 text-center text-sm font-medium text-gray-500">T7</div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {days.map((day, index) => {
                const isToday = day.date.toDateString() === new Date().toDateString();
                
                return (
                  <div 
                    key={index} 
                    className={`bg-white min-h-[100px] ${
                      !day.isCurrentMonth ? 'text-gray-400' : ''
                    }`}
                  >
                    <div className={`p-2 ${isToday ? 'bg-blue-100' : ''}`}>
                      <span className={`inline-block w-6 h-6 text-center ${
                        isToday 
                          ? 'bg-blue-500 text-white rounded-full' 
                          : ''
                      }`}>
                        {day.date.getDate()}
                      </span>
                    </div>
                    <div className="p-1">
                      {day.events.map(event => (
                        <div 
                          key={event.id} 
                          className={`px-2 py-1 mb-1 text-xs rounded truncate text-white ${getEventTypeClass(event.priority)}`}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Hiển thị danh sách sự kiện sắp tới */}
      <div className="mt-8 bg-white shadow-md rounded-lg overflow-hidden">
        <div className="border-b border-gray-200 px-4 py-4">
          <h2 className="text-lg font-medium text-gray-900">Sự kiện sắp tới</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-500">
              Không có sự kiện nào trong tháng này
            </div>
          ) : (
            events
              .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
              .slice(0, 5)
              .map((event) => (
                <div key={event.id} className="px-4 py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-medium text-gray-900">{event.title}</h3>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">{event.description}</p>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <CalendarIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                        {formatDate(event.start_time, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        {event.end_time && ` - ${formatDate(event.end_time, { day: '2-digit', month: '2-digit', year: 'numeric' })}`}
                      </div>
                      {event.location && (
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <MapPinIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                          {event.location}
                        </div>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getEventTypeClass(event.priority).replace('bg-', 'bg-opacity-20 text-').replace('500', '700')
                    }`}>
                      {event.priority === 'High' ? 'Quan trọng' : 
                       event.priority === 'Medium' ? 'Trung bình' : 'Thông thường'}
                    </span>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage; 