import { ReactNode, useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatbotButton from '../ui/ChatbotButton';

interface LayoutProps {
  children?: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Kiểm tra kích thước màn hình lúc khởi tạo
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };

    // Gọi hàm lần đầu
    handleResize();

    // Thiết lập event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Đọc trạng thái thu gọn từ localStorage nếu có
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      setSidebarCollapsed(savedState === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleSidebarCollapse = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', newState.toString());
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar cho desktop - hiển thị cố định */}
      <div className={`hidden md:block transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <Sidebar isOpen={true} toggle={toggleSidebar} isCollapsed={sidebarCollapsed} toggleCollapse={toggleSidebarCollapse} />
      </div>

      {/* Sidebar cho mobile - hiển thị khi toggle */}
      <div className={`fixed inset-0 z-40 md:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div 
          className={`fixed inset-0 bg-gray-600 ${sidebarOpen ? 'opacity-75' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}
          onClick={toggleSidebar}
        ></div>
        <div className={`fixed inset-y-0 left-0 flex flex-col z-40 w-80 max-w-sm bg-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
          <Sidebar isOpen={sidebarOpen} toggle={toggleSidebar} isCollapsed={false} />
        </div>
      </div>

      {/* Phần nội dung */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          toggleSidebar={toggleSidebar}
          toggleSidebarCollapse={toggleSidebarCollapse}
          isSidebarCollapsed={sidebarCollapsed}
        />
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {children || <Outlet />}
          </div>
        </main>
      </div>

      {/* Chatbot Button - hiển thị ở mọi trang */}
      <ChatbotButton />
    </div>
  );
};

export default Layout; 