import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CalendarIcon, BellIcon, DocumentTextIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { ChatBubbleOvalLeftEllipsisIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { useAuth } from '@/contexts/AuthContext';
import { Notification, Post, Activity, UserRole } from '@/types';
import { 
  getNotifications, 
  getUnionInfo, 
  sendChatbotQuery, 
  UnionInfo,
} from '@/services/dashboardService';
import { PaginatedResponse } from '@/types';
import { Bars3BottomLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unionInfo, setUnionInfo] = useState<UnionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'bot', content: string, sources?: string[]}[]>([
    {role: 'bot', content: 'Xin chào! Tôi là trợ lý ảo của Đoàn trường. Bạn có câu hỏi gì về hoạt động, quy định của Đoàn không?'}
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [registeredActivities, setRegisteredActivities] = useState<Activity[]>([]);
  const [chatOpen, setChatOpen] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;
  const isCanBoDoan = user?.role === UserRole.CAN_BO_DOAN;
  const isDoanVien = user?.role === UserRole.DOAN_VIEN;
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch data in parallel
        const [notificationsData, unionInfoData] = await Promise.all([
          getNotifications(),
          getUnionInfo()
        ]);
        
        setNotifications(notificationsData.results || []);
        setUnionInfo(unionInfoData);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isDoanVien]);

  useEffect(() => {
    // Scroll to bottom of chat when chat history changes
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    // Add user message to chat history
    setChatHistory(prev => [...prev, { role: 'user', content: chatMessage }]);
    
    // Simulate bot typing
    setIsTyping(true);
    
    try {
      // Call chatbot API
      const response = await sendChatbotQuery(chatMessage);
      
      // Add bot response to chat history
      setIsTyping(false);
      setChatHistory(prev => [...prev, { 
        role: 'bot', 
        content: response.answer,
        sources: response.sources 
      }]);
    } catch (error) {
      // Handle error
      setIsTyping(false);
      setChatHistory(prev => [...prev, { 
        role: 'bot', 
        content: 'Xin lỗi, tôi không thể xử lý câu hỏi của bạn lúc này. Vui lòng thử lại sau.'
      }]);
    }
    
    // Clear input field
    setChatMessage('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Chào mừng */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-8 mb-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Chào mừng đến với Đoàn Trường!</h1>
        <p className="mb-4 text-blue-100">Xin chào, {user?.full_name || 'đoàn viên'}, chúc bạn một ngày làm việc và học tập hiệu quả.</p>
        <div className="flex space-x-4 mt-4">
          <Link 
            to="/dashboard" 
            className="bg-white text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-md font-medium flex items-center"
          >
            <span>Bảng điều khiển</span>
            <ArrowRightIcon className="w-4 h-4 ml-2" />
          </Link>
          <Link 
            to="/activities" 
            className="bg-blue-700 text-white hover:bg-blue-600 px-4 py-2 rounded-md font-medium border border-blue-400"
          >
            Hoạt động đoàn
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cột bên trái */}
        <div className="lg:col-span-2 space-y-8">
          {/* Thông báo quan trọng */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <BellIcon className="w-6 h-6 mr-2 text-red-500" />
                Thông báo quan trọng
              </h2>
              <Link to="/notifications" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Xem tất cả
              </Link>
            </div>
            <div className="p-6">
              {notifications.length > 0 ? (
                <div className="space-y-4">
                  {notifications.filter(n => !n.is_read).slice(0, 3).map((notification) => (
                    <div 
                      key={notification.id} 
                      className="p-4 border border-orange-100 bg-orange-50 rounded-lg"
                    >
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <span className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center text-white text-sm">
                            !
                          </span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm text-gray-700">{notification.content}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.created_at).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {notifications.filter(n => n.is_read).slice(0, 2).map((notification) => (
                    <div 
                      key={notification.id} 
                      className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                    >
                      <div className="flex">
                        <div className="ml-2">
                          <p className="text-sm text-gray-600">{notification.content}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.created_at).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Không có thông báo mới
                </div>
              )}
            </div>
          </div>

          {/* Giới thiệu về Đoàn trường */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-800">Giới thiệu về Đoàn trường</h2>
            </div>
            <div className="p-6">
              <div className="prose max-w-none">
                {unionInfo ? (
                  <>
                    <p>{unionInfo.description}</p>

                    <h3 className="text-lg font-semibold mt-4">Sứ mệnh của Đoàn trường</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {unionInfo.mission.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>

                    <div className="bg-blue-50 p-4 rounded-lg mt-4">
                      <h4 className="font-medium text-blue-800">Thông tin liên hệ:</h4>
                      <p className="text-sm">
                        <strong>Địa chỉ:</strong> {unionInfo.contact.address}<br />
                        <strong>Điện thoại:</strong> {unionInfo.contact.phone}<br />
                        <strong>Email:</strong> {unionInfo.contact.email}<br />
                        <strong>Facebook:</strong> {unionInfo.contact.facebook}
                      </p>
                    </div>
                  </>
                ) : (
                  <p>
                    Đoàn trường Đại học là tổ chức cơ sở Đoàn trực thuộc Thành Đoàn, được thành lập nhằm tập hợp, 
                    đoàn kết thanh niên, sinh viên trong trường đại học tham gia các hoạt động do Đoàn tổ chức. 
                    Đoàn trường thực hiện nhiệm vụ giáo dục chính trị, tư tưởng, đạo đức, lối sống cho đoàn viên, 
                    thanh niên.
                  </p>
                )}

                <div className="text-center mt-4">
                  <a
                    href="#"
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    Xem thêm về Đoàn trường →
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quy định của Đoàn */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <DocumentTextIcon className="w-6 h-6 mr-2 text-blue-500" />
                Quy định của Đoàn
              </h2>
            </div>
            <div className="p-6">
              <div className="prose max-w-none">
                {unionInfo ? (
                  <>
                    <p className="font-medium">{unionInfo.regulations_summary}</p>
                    
                    <h3 className="text-lg font-semibold mt-4">Cơ cấu tổ chức Đoàn trường</h3>
                    <div className="mt-2 space-y-4">
                      {unionInfo.structure.map((item, index) => (
                        <div key={index} className="border-l-4 border-blue-500 pl-4">
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold">Quy định chung về đoàn viên</h3>
                    <p>
                      Đoàn viên phải chấp hành nghiêm chỉnh các quy định, điều lệ của Đoàn TNCS Hồ Chí Minh, 
                      tham gia đầy đủ các hoạt động, sinh hoạt của chi đoàn và Đoàn trường.
                    </p>

                    <h3 className="text-lg font-semibold mt-4">Quy định về sinh hoạt đoàn</h3>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Tham gia đầy đủ các buổi sinh hoạt đoàn định kỳ hàng tháng</li>
                      <li>Đóng đoàn phí đầy đủ, đúng hạn</li>
                      <li>Tham gia ít nhất 70% các hoạt động do Đoàn trường tổ chức</li>
                      <li>Thực hiện nghiêm túc các nghị quyết của Đoàn</li>
                    </ol>

                    <h3 className="text-lg font-semibold mt-4">Quy định về chuyển sinh hoạt đoàn</h3>
                    <p>
                      Khi chuyển nơi học tập, công tác, đoàn viên cần làm thủ tục chuyển sinh hoạt đoàn
                      trong thời hạn 30 ngày kể từ ngày có quyết định.
                    </p>
                  </>
                )}

                <div className="text-center mt-4">
                  <a
                    href="#"
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    Xem đầy đủ quy định của Đoàn →
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quản lý đoàn - Chỉ hiển thị cho Admin và Cán bộ đoàn */}
          {(isAdmin || isCanBoDoan) && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-xl font-bold text-gray-800">Quản lý đoàn</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link 
                    to="/activities-management" 
                    className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition hover:border-blue-200"
                  >
                    <h3 className="font-semibold text-blue-700">Quản lý hoạt động</h3>
                    <p className="text-sm text-gray-600 mt-1">Thêm, sửa, xóa các hoạt động đoàn</p>
                  </Link>
                  <Link 
                    to="/members" 
                    className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition hover:border-blue-200"
                  >
                    <h3 className="font-semibold text-blue-700">Quản lý đoàn viên</h3>
                    <p className="text-sm text-gray-600 mt-1">Theo dõi, quản lý đoàn viên</p>
                  </Link>
                  <Link 
                    to="/reports" 
                    className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition hover:border-blue-200"
                  >
                    <h3 className="font-semibold text-blue-700">Báo cáo thống kê</h3>
                    <p className="text-sm text-gray-600 mt-1">Xem báo cáo hoạt động đoàn</p>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cột bên phải */}
        <div>
          {/* Thông báo mới */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-blue-700 mb-4">Thông báo mới</h2>
            {notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.slice(0, 5).map((notification) => (
                  <div key={notification.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <h3 className="font-medium text-gray-800">{notification.content}</h3>
                    <p className="text-sm text-gray-600 mt-1">{new Date(notification.created_at).toLocaleString('vi-VN')}</p>
                  </div>
                ))}
                <div className="mt-4 text-right">
                  <Link to="/notifications" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Xem tất cả →
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">Không có thông báo mới.</p>
            )}
          </div>

          {/* Hoạt động đã đăng ký (chỉ hiển thị cho đoàn viên) */}
          {isDoanVien && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold text-blue-700 mb-4">Hoạt động đã đăng ký</h2>
              {registeredActivities.length > 0 ? (
                <div className="space-y-4">
                  {registeredActivities.map((activity) => (
                    <div key={activity.id} className="border-l-4 border-green-500 pl-4 py-2">
                      <h3 className="font-medium text-gray-800">{activity.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(activity.start_date).toLocaleString('vi-VN')} - {new Date(activity.end_date).toLocaleString('vi-VN')}
                      </p>
                      <p className="text-sm text-gray-600">Địa điểm: {activity.location}</p>
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Đã được phê duyệt
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 text-right">
                    <Link to="/activities" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Xem tất cả →
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic">Bạn chưa đăng ký hoạt động nào.</p>
              )}
            </div>
          )}

          {/* Liên kết nhanh */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-blue-700 mb-4">Liên kết nhanh</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/dashboard" className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold py-4 px-4 rounded-lg text-center transition-colors">
                Bảng điều khiển
              </Link>
              <Link to="/activities" className="bg-green-100 hover:bg-green-200 text-green-800 font-bold py-4 px-4 rounded-lg text-center transition-colors">
                Hoạt động Đoàn
              </Link>
              <Link to="/member-book" className="bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold py-4 px-4 rounded-lg text-center transition-colors">
                Sổ Đoàn viên
              </Link>
              <Link to="/work-schedules" className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-bold py-4 px-4 rounded-lg text-center transition-colors">
                Lịch công tác
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 