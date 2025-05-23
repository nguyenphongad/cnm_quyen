import { useState, useEffect } from 'react';
import { ChartPieIcon, ChartBarIcon, ArrowDownTrayIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { Activity, UserRole } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { LineChart, BarChart, PieChart } from '@/components/common/Charts';
import Button from '@/components/common/Button';
import { toast } from 'react-toastify';
import { getReportData, downloadReport, ReportParams } from '@/services/reportService';

const ReportsPage = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('thisMonth');
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [reportData, setReportData] = useState({
    memberStats: {
      totalMembers: 0,
      activeMembers: 0,
      inactiveMembers: 0,
      newMembers: 0
    },
    activityStats: {
      total: 0,
      upcoming: 0,
      ongoing: 0,
      completed: 0,
      totalParticipants: 0,
      averageParticipation: 0
    },
    activityByMonth: {
      labels: [] as string[],
      datasets: [{
        label: 'Số lượng hoạt động',
        data: [] as number[],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)' as string | string[],
        fill: true
      }]
    },
    participationByMonth: {
      labels: [] as string[],
      datasets: [{
        label: 'Số lượng đoàn viên tham gia',
        data: [] as number[],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)' as string | string[],
        fill: true
      }]
    },
    activityTypeDistribution: {
      labels: [] as string[],
      datasets: [{
        label: 'Phân loại hoạt động',
        data: [] as number[],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(239, 68, 68, 0.7)',
          'rgba(139, 92, 246, 0.7)'
        ] as string | string[],
        borderWidth: 0
      }]
    },
    memberParticipationRate: {
      labels: [] as string[],
      datasets: [{
        label: 'Tỷ lệ tham gia',
        data: [] as number[],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(209, 213, 219, 0.7)'
        ] as string | string[],
        borderWidth: 0
      }]
    }
  });

  useEffect(() => {
    fetchReportData();
  }, [dateRange, activityTypeFilter]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      // Tạo đối tượng params cho API request
      const params: ReportParams = {
        period: dateRange as any,
        activity_type: activityTypeFilter !== 'all' ? activityTypeFilter : undefined
      };
      
      // Gọi API để lấy dữ liệu báo cáo
      const data = await getReportData(params);
      
      // Ensure data conforms to the expected structure before setting state
      const safeData = {
        memberStats: {
          totalMembers: data.memberStats?.totalMembers || 0,
          activeMembers: data.memberStats?.activeMembers || 0,
          inactiveMembers: data.memberStats?.inactiveMembers || 0,
          newMembers: data.memberStats?.newMembers || 0
        },
        activityStats: {
          total: data.activityStats?.total || 0,
          upcoming: data.activityStats?.upcoming || 0,
          ongoing: data.activityStats?.ongoing || 0,
          completed: data.activityStats?.completed || 0,
          totalParticipants: data.activityStats?.totalParticipants || 0,
          averageParticipation: data.activityStats?.averageParticipation || 0
        },
        activityByMonth: {
          labels: data.activityByMonth?.labels || [],
          datasets: [{
            label: data.activityByMonth?.datasets?.[0]?.label || 'Số lượng hoạt động',
            data: data.activityByMonth?.datasets?.[0]?.data || [],
            borderColor: data.activityByMonth?.datasets?.[0]?.borderColor || '#3B82F6',
            backgroundColor: data.activityByMonth?.datasets?.[0]?.backgroundColor || 'rgba(59, 130, 246, 0.1)' as string | string[],
            fill: data.activityByMonth?.datasets?.[0]?.fill !== undefined ? data.activityByMonth.datasets[0].fill : true
          }]
        },
        participationByMonth: {
          labels: data.participationByMonth?.labels || [],
          datasets: [{
            label: data.participationByMonth?.datasets?.[0]?.label || 'Số lượng đoàn viên tham gia',
            data: data.participationByMonth?.datasets?.[0]?.data || [],
            borderColor: data.participationByMonth?.datasets?.[0]?.borderColor || '#10B981',
            backgroundColor: data.participationByMonth?.datasets?.[0]?.backgroundColor || 'rgba(16, 185, 129, 0.1)' as string | string[],
            fill: data.participationByMonth?.datasets?.[0]?.fill !== undefined ? data.participationByMonth.datasets[0].fill : true
          }]
        },
        activityTypeDistribution: {
          labels: data.activityTypeDistribution?.labels || [],
          datasets: [{
            label: data.activityTypeDistribution?.datasets?.[0]?.label || 'Phân loại hoạt động',
            data: data.activityTypeDistribution?.datasets?.[0]?.data || [],
            backgroundColor: data.activityTypeDistribution?.datasets?.[0]?.backgroundColor || [
              'rgba(59, 130, 246, 0.7)',
              'rgba(16, 185, 129, 0.7)',
              'rgba(245, 158, 11, 0.7)',
              'rgba(239, 68, 68, 0.7)',
              'rgba(139, 92, 246, 0.7)'
            ] as string | string[],
            borderWidth: data.activityTypeDistribution?.datasets?.[0]?.borderWidth || 0
          }]
        },
        memberParticipationRate: {
          labels: data.memberParticipationRate?.labels || [],
          datasets: [{
            label: data.memberParticipationRate?.datasets?.[0]?.label || 'Tỷ lệ tham gia',
            data: data.memberParticipationRate?.datasets?.[0]?.data || [],
            backgroundColor: data.memberParticipationRate?.datasets?.[0]?.backgroundColor || [
              'rgba(59, 130, 246, 0.7)',
              'rgba(209, 213, 219, 0.7)'
            ] as string | string[],
            borderWidth: data.memberParticipationRate?.datasets?.[0]?.borderWidth || 0
          }]
        }
      };
      
      setReportData(safeData);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Không thể tải dữ liệu báo cáo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      toast.info(`Đang tải xuống báo cáo dạng ${format}...`);
      
      // Tạo đối tượng params cho API request
      const params: ReportParams = {
        period: dateRange as any,
        activity_type: activityTypeFilter !== 'all' ? activityTypeFilter : undefined
      };
      
      // Gọi API để tải xuống báo cáo
      const blob = await downloadReport(format, params);
      
      // Tạo URL cho blob và tải xuống
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `bao-cao-doan-${dateRange}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Đã tải xuống báo cáo dạng ${format} thành công`);
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error(`Không thể tải xuống báo cáo dạng ${format}`);
    }
  };

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case 'thisMonth':
        return 'Tháng này';
      case 'lastMonth':
        return 'Tháng trước';
      case 'lastQuarter':
        return 'Quý vừa rồi';
      case 'thisYear':
        return 'Năm nay';
      case 'lastYear':
        return 'Năm trước';
      default:
        return 'Tháng này';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl font-bold text-gray-900">Báo cáo và thống kê</h1>
          <p className="mt-1 text-sm text-gray-500">
            Dữ liệu hoạt động và đoàn viên
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div>
            <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-1">
              Khoảng thời gian
            </label>
            <select
              id="dateRange"
              className="focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="thisMonth">Tháng này</option>
              <option value="lastMonth">Tháng trước</option>
              <option value="lastQuarter">Quý vừa rồi</option>
              <option value="thisYear">Năm nay</option>
              <option value="lastYear">Năm trước</option>
            </select>
          </div>
          <div>
            <label htmlFor="activityType" className="block text-sm font-medium text-gray-700 mb-1">
              Loại hoạt động
            </label>
            <select
              id="activityType"
              className="focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={activityTypeFilter}
              onChange={(e) => setActivityTypeFilter(e.target.value)}
            >
              <option value="all">Tất cả loại</option>
              <option value="academic">Học tập</option>
              <option value="volunteer">Tình nguyện</option>
              <option value="culture">Văn hóa</option>
              <option value="sports">Thể thao</option>
              <option value="other">Khác</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Thống kê tổng quan */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Tổng quan hoạt động ({getDateRangeLabel()})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white shadow rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
                    <CalendarIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Tổng hoạt động</p>
                    <p className="text-lg font-semibold text-gray-900">{reportData?.activityStats?.total || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white shadow rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-full p-3">
                    <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Tổng lượt tham gia</p>
                    <p className="text-lg font-semibold text-gray-900">{reportData?.activityStats?.totalParticipants || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white shadow rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-100 rounded-full p-3">
                    <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Sắp diễn ra</p>
                    <p className="text-lg font-semibold text-gray-900">{reportData?.activityStats?.upcoming || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white shadow rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-100 rounded-full p-3">
                    <svg className="h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Trung bình tham gia</p>
                    <p className="text-lg font-semibold text-gray-900">{reportData?.activityStats?.averageParticipation || 0} người/hoạt động</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Thống kê đoàn viên */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Thống kê đoàn viên</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white shadow rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
                    <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Tổng đoàn viên</p>
                    <p className="text-lg font-semibold text-gray-900">{reportData?.memberStats?.totalMembers || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white shadow rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-full p-3">
                    <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Đoàn viên hoạt động</p>
                    <p className="text-lg font-semibold text-gray-900">{reportData?.memberStats?.activeMembers || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white shadow rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-red-100 rounded-full p-3">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Đoàn viên không hoạt động</p>
                    <p className="text-lg font-semibold text-gray-900">{reportData?.memberStats?.inactiveMembers || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white shadow rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-100 rounded-full p-3">
                    <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Đoàn viên mới</p>
                    <p className="text-lg font-semibold text-gray-900">{reportData?.memberStats?.newMembers || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Biểu đồ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Hoạt động theo tháng</h3>
                <div className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">{getDateRangeLabel()}</div>
              </div>
              <div className="p-4">
                <LineChart data={reportData?.activityByMonth || {
                  labels: [],
                  datasets: [{
                    label: 'Số lượng hoạt động',
                    data: [],
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)' as string | string[],
                    fill: true
                  }]
                }} height={300} />
              </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Đoàn viên tham gia theo tháng</h3>
                <div className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">{getDateRangeLabel()}</div>
              </div>
              <div className="p-4">
                <LineChart data={reportData?.participationByMonth || {
                  labels: [],
                  datasets: [{
                    label: 'Số lượng đoàn viên tham gia',
                    data: [],
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)' as string | string[],
                    fill: true
                  }]
                }} height={300} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Phân loại hoạt động</h3>
                <div className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">{getDateRangeLabel()}</div>
              </div>
              <div className="p-4">
                <PieChart data={reportData?.activityTypeDistribution || {
                  labels: [],
                  datasets: [{
                    label: 'Phân loại hoạt động',
                    data: [],
                    backgroundColor: [
                      'rgba(59, 130, 246, 0.7)',
                      'rgba(16, 185, 129, 0.7)',
                      'rgba(245, 158, 11, 0.7)',
                      'rgba(239, 68, 68, 0.7)',
                      'rgba(139, 92, 246, 0.7)'
                    ] as string | string[],
                    borderWidth: 0
                  }]
                }} height={300} />
              </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Tỷ lệ tham gia của đoàn viên</h3>
                <div className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">{getDateRangeLabel()}</div>
              </div>
              <div className="p-4">
                <PieChart data={reportData?.memberParticipationRate || {
                  labels: [],
                  datasets: [{
                    label: 'Tỷ lệ tham gia',
                    data: [],
                    backgroundColor: [
                      'rgba(59, 130, 246, 0.7)',
                      'rgba(209, 213, 219, 0.7)'
                    ] as string | string[],
                    borderWidth: 0
                  }]
                }} height={300} />
              </div>
            </div>
          </div>

          {/* Tải xuống báo cáo */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Tải xuống báo cáo</h2>
            <p className="text-sm text-gray-600 mb-4">
              Tải xuống báo cáo chi tiết về hoạt động và đoàn viên trong khoảng thời gian bạn đã chọn.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button
                onClick={() => handleDownloadReport('pdf')}
                className="flex items-center justify-center"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Tải xuống PDF
              </Button>
              <Button
                onClick={() => handleDownloadReport('excel')}
                className="flex items-center justify-center"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Tải xuống Excel
              </Button>
              <Button
                onClick={() => handleDownloadReport('csv')}
                className="flex items-center justify-center"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Tải xuống CSV
              </Button>
            </div>
          </div>

          {/* Ghi chú */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  Báo cáo được cập nhật vào cuối mỗi ngày. Dữ liệu có thể không đồng bộ với tình trạng hiện tại trong vài giờ.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage; 