import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  ArrowDownTrayIcon,
  TrashIcon,
  ClockIcon,
  UserIcon,
  ServerIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  XCircleIcon,
  CloudArrowDownIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/common/Button';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  getAllSystemLogs, 
  clearSystemLogs, 
  exportSystemLogs,
  SystemLog,
  LogLevel,
  LogSource,
  SystemLogFilter
} from '@/services/systemLogService';

const SystemLogsPage = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Các bộ lọc
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<LogSource | 'all'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Thông tin phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(10);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    // Theo dõi thay đổi kích thước màn hình để điều chỉnh giao diện
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [search, levelFilter, sourceFilter, startDate, endDate, logs]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const filters: SystemLogFilter = {};
      
      if (levelFilter !== 'all') {
        filters.level = levelFilter;
      }
      
      if (sourceFilter !== 'all') {
        filters.source = sourceFilter;
      }
      
      if (startDate) {
        filters.startDate = startDate;
      }
      
      if (endDate) {
        filters.endDate = endDate;
      }
      
      if (search) {
        filters.search = search;
      }
      
      const response = await getAllSystemLogs(filters);
      console.log('Danh sách log từ API:', response);
      setLogs(response);
      setFilteredLogs(response);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching system logs:', error);
      toast.error('Không thể tải dữ liệu log từ server');
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...logs];
    
    // Lọc theo từ khóa tìm kiếm
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(log => 
        log.message.toLowerCase().includes(searchLower) || 
        (log.details && log.details.toLowerCase().includes(searchLower)) ||
        (log.user && log.user.toLowerCase().includes(searchLower))
      );
    }
    
    // Lọc theo mức độ
    if (levelFilter !== 'all') {
      result = result.filter(log => log.level === levelFilter);
    }
    
    // Lọc theo nguồn
    if (sourceFilter !== 'all') {
      result = result.filter(log => log.source === sourceFilter);
    }
    
    // Lọc theo ngày bắt đầu
    if (startDate) {
      const start = new Date(startDate);
      result = result.filter(log => new Date(log.timestamp) >= start);
    }
    
    // Lọc theo ngày kết thúc
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Đặt thời gian cuối ngày
      result = result.filter(log => new Date(log.timestamp) <= end);
    }
    
    setFilteredLogs(result);
    setCurrentPage(1); // Reset về trang đầu tiên khi thay đổi bộ lọc
  };

  // Tính toán phân trang
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  // Thay đổi trang
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Làm mới dữ liệu
  const handleRefresh = () => {
    fetchLogs();
    toast.success('Đã làm mới dữ liệu nhật ký');
  };

  // Xóa nhật ký
  const handleClearLogs = async () => {
    try {
      await clearSystemLogs();
      setLogs([]);
      setFilteredLogs([]);
      toast.success('Đã xóa toàn bộ log hệ thống');
      setShowClearModal(false);
    } catch (error) {
      console.error('Error clearing logs:', error);
      toast.error('Không thể xóa log hệ thống');
    }
  };

  // Xuất nhật ký
  const handleExportLogs = async () => {
    try {
      const blob = await exportSystemLogs();
      
      // Tạo URL từ blob
      const url = window.URL.createObjectURL(blob);
      
      // Tạo một thẻ a ảo
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `system-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      
      // Thêm thẻ a vào body
      document.body.appendChild(a);
      
      // Click vào thẻ a để tải xuống
      a.click();
      
      // Xóa thẻ a và URL
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast.success('Đã xuất log hệ thống thành công');
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast.error('Không thể xuất log hệ thống');
    }
  };

  // Format thời gian
  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm:ss', { locale: vi });
    } catch (error) {
      return dateString;
    }
  };

  // Lấy biểu tượng tương ứng với level
  const getLevelIcon = (level: 'info' | 'warning' | 'error' | 'success') => {
    switch (level) {
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  // Lấy biểu tượng tương ứng với nguồn
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'authentication':
        return <UserIcon className="h-5 w-5 text-purple-500" />;
      case 'activity':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'system':
        return <ServerIcon className="h-5 w-5 text-gray-500" />;
      case 'admin':
        return <UserIcon className="h-5 w-5 text-green-500" />;
      default:
        return <ServerIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  // Lấy tên hiển thị của nguồn
  const getSourceName = (source: string) => {
    switch (source) {
      case 'authentication':
        return 'Xác thực';
      case 'activity':
        return 'Hoạt động';
      case 'system':
        return 'Hệ thống';
      case 'admin':
        return 'Quản trị';
      default:
        return source;
    }
  };

  // Lấy tên hiển thị của level
  const getLevelName = (level: string) => {
    switch (level) {
      case 'info':
        return 'Thông tin';
      case 'warning':
        return 'Cảnh báo';
      case 'error':
        return 'Lỗi';
      case 'success':
        return 'Thành công';
      default:
        return level;
    }
  };

  // Lấy màu nền của dòng theo level
  const getRowClassName = (level: 'info' | 'warning' | 'error' | 'success') => {
    switch (level) {
      case 'error':
        return 'bg-red-50';
      case 'warning':
        return 'bg-yellow-50';
      case 'success':
        return 'bg-green-50';
      default:
        return '';
    }
  };

  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case 'ERROR':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-3 w-3 mr-1" />
            Lỗi
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
            Cảnh báo
          </span>
        );
      case 'INFO':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <InformationCircleIcon className="h-3 w-3 mr-1" />
            Thông tin
          </span>
        );
      case 'DEBUG':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <DocumentDuplicateIcon className="h-3 w-3 mr-1" />
            Debug
          </span>
        );
      default:
        return null;
    }
  };

  const getSourceLabel = (source: LogSource) => {
    switch (source) {
      case 'AUTH':
        return 'Xác thực';
      case 'USER':
        return 'Người dùng';
      case 'ACTIVITY':
        return 'Hoạt động';
      case 'SYSTEM':
        return 'Hệ thống';
      case 'API':
        return 'API';
      default:
        return source;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl font-bold text-gray-900">Nhật ký hệ thống</h1>
          <p className="mt-1 text-sm text-gray-500">
            Theo dõi các hoạt động và sự kiện trong hệ thống
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={handleRefresh} 
            className="flex items-center justify-center bg-gray-100 text-gray-800 hover:bg-gray-200"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Làm mới
          </Button>
          <Button 
            onClick={handleExportLogs} 
            className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white"
          >
            <CloudArrowDownIcon className="h-5 w-5 mr-2" />
            Xuất CSV
          </Button>
          <Button
            onClick={() => setShowClearModal(true)}
            className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white"
          >
            <TrashIcon className="h-5 w-5 mr-2" />
            Xóa tất cả
          </Button>
        </div>
      </div>

      {/* Bộ lọc và tìm kiếm */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm
            </label>
            <input
              type="text"
              id="search"
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Nội dung, chi tiết hoặc người dùng"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="levelFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Mức độ
            </label>
            <select
              id="levelFilter"
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as LogLevel | 'all')}
            >
              <option value="all">Tất cả mức độ</option>
              <option value="ERROR">Lỗi</option>
              <option value="WARNING">Cảnh báo</option>
              <option value="INFO">Thông tin</option>
              <option value="DEBUG">Debug</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="sourceFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Nguồn
            </label>
            <select
              id="sourceFilter"
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as LogSource | 'all')}
            >
              <option value="all">Tất cả nguồn</option>
              <option value="AUTH">Xác thực</option>
              <option value="USER">Người dùng</option>
              <option value="ACTIVITY">Hoạt động</option>
              <option value="SYSTEM">Hệ thống</option>
              <option value="API">API</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Từ ngày
            </label>
            <input
              type="date"
              id="startDate"
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              Đến ngày
            </label>
            <input
              type="date"
              id="endDate"
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Danh sách log */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredLogs.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Thời gian
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Mức độ
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Nguồn
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Nội dung
                  </th>
                  {!isMobile && (
                    <>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Người dùng
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Địa chỉ IP
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getLevelBadge(log.level)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getSourceLabel(log.source)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="mb-1">{log.message}</div>
                      {log.details && (
                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded max-w-xl break-words">
                          {log.details}
                        </div>
                      )}
                    </td>
                    {!isMobile && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.user || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.ip_address || '-'}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <DocumentDuplicateIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Không tìm thấy log</h3>
          <p className="mt-1 text-sm text-gray-500">
            Không có log nào phù hợp với tiêu chí tìm kiếm hoặc hệ thống chưa ghi nhận log nào.
          </p>
        </div>
      )}

      {/* Modal xóa tất cả log */}
      {showClearModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <TrashIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-medium text-gray-900">Xóa tất cả log</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Bạn có chắc chắn muốn xóa tất cả log hệ thống? Hành động này không thể hoàn tác.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleClearLogs}
                >
                  Xóa tất cả
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowClearModal(false)}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemLogsPage; 