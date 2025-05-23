import api from './api';
import { ChartData, MemberStat, ActivityStat, ReportData } from '@/types';

export interface DateRange {
  start_date: string;
  end_date: string;
}

export interface ReportParams {
  date_range?: DateRange;
  period?: 'thisMonth' | 'lastMonth' | 'lastQuarter' | 'thisYear' | 'lastYear';
  activity_type?: string;
}

/**
 * Lấy dữ liệu báo cáo thống kê
 */
export const getReportData = async (params?: ReportParams): Promise<ReportData> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params?.period) {
      queryParams.append('period', params.period);
    }
    
    if (params?.activity_type && params.activity_type !== 'all') {
      queryParams.append('activity_type', params.activity_type);
    }
    
    if (params?.date_range) {
      queryParams.append('start_date', params.date_range.start_date);
      queryParams.append('end_date', params.date_range.end_date);
    }
    
    const response = await api.get(`/reports/dashboard/?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching report data:', error);
    throw error;
  }
};

/**
 * Lấy thống kê về hoạt động
 */
export const getActivityStats = async (params?: ReportParams): Promise<ActivityStat> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params?.period) {
      queryParams.append('period', params.period);
    }
    
    if (params?.activity_type && params.activity_type !== 'all') {
      queryParams.append('activity_type', params.activity_type);
    }
    
    if (params?.date_range) {
      queryParams.append('start_date', params.date_range.start_date);
      queryParams.append('end_date', params.date_range.end_date);
    }
    
    const response = await api.get(`/reports/activities/?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    throw error;
  }
};

/**
 * Lấy thống kê về thành viên
 */
export const getMemberStats = async (): Promise<MemberStat> => {
  try {
    const response = await api.get('/reports/members/');
    return response.data;
  } catch (error) {
    console.error('Error fetching member stats:', error);
    throw error;
  }
};

/**
 * Lấy thống kê hoạt động theo tháng
 */
export const getActivityByMonth = async (year?: number): Promise<ChartData> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (year) {
      queryParams.append('year', year.toString());
    }
    
    const response = await api.get(`/reports/activities-by-month/?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching activities by month:', error);
    throw error;
  }
};

/**
 * Lấy thống kê tham gia hoạt động theo tháng
 */
export const getParticipationByMonth = async (year?: number): Promise<ChartData> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (year) {
      queryParams.append('year', year.toString());
    }
    
    const response = await api.get(`/reports/participation-by-month/?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching participation by month:', error);
    throw error;
  }
};

/**
 * Lấy thống kê phân loại hoạt động
 */
export const getActivityTypeDistribution = async (params?: ReportParams): Promise<ChartData> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params?.period) {
      queryParams.append('period', params.period);
    }
    
    if (params?.date_range) {
      queryParams.append('start_date', params.date_range.start_date);
      queryParams.append('end_date', params.date_range.end_date);
    }
    
    const response = await api.get(`/reports/activity-types/?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching activity type distribution:', error);
    throw error;
  }
};

/**
 * Tải xuống báo cáo
 */
export const downloadReport = async (
  format: 'pdf' | 'excel' | 'csv',
  params?: ReportParams
): Promise<Blob> => {
  try {
    const queryParams = new URLSearchParams();
    
    queryParams.append('format', format);
    
    if (params?.period) {
      queryParams.append('period', params.period);
    }
    
    if (params?.activity_type && params.activity_type !== 'all') {
      queryParams.append('activity_type', params.activity_type);
    }
    
    if (params?.date_range) {
      queryParams.append('start_date', params.date_range.start_date);
      queryParams.append('end_date', params.date_range.end_date);
    }
    
    const response = await api.get(`/reports/download/?${queryParams.toString()}`, {
      responseType: 'blob'
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error downloading report as ${format}:`, error);
    throw error;
  }
};

/**
 * Tạo báo cáo tùy chỉnh
 */
export const createCustomReport = async (
  reportConfig: {
    title: string;
    description?: string;
    sections: string[];
    filters: Record<string, any>;
  }
): Promise<ReportData> => {
  try {
    const response = await api.post('/reports/custom/', reportConfig);
    return response.data;
  } catch (error) {
    console.error('Error creating custom report:', error);
    throw error;
  }
};

export default {
  getReportData,
  getActivityStats,
  getMemberStats,
  getActivityByMonth,
  getParticipationByMonth,
  getActivityTypeDistribution,
  downloadReport,
  createCustomReport
}; 