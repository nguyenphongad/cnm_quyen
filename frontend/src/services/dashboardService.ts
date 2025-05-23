import api from './api';
import { PaginatedResponse, Activity, Post, Schedule, Notification } from '@/types';

export interface DashboardStats {
  totalMembers: number;
  totalActivities: number;
  totalPosts: number;
  totalNotifications: number;
  recentActivities: Activity[];
  upcomingDeadlines: {
    id: number;
    title: string;
    deadline: string;
    type: string;
  }[];
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
    borderWidth?: number;
  }[];
}

/**
 * Lấy danh sách hoạt động gần đây
 */
export const getActivities = async (
  page = 1,
  pageSize = 5
): Promise<PaginatedResponse<Activity>> => {
  try {
    const response = await api.get(`/activities/?page=${page}&page_size=${pageSize}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw error;
  }
};

/**
 * Lấy danh sách bài viết gần đây
 */
export const getPosts = async (
  page = 1,
  pageSize = 5
): Promise<PaginatedResponse<Post>> => {
  try {
    const response = await api.get(`/posts/?page=${page}&page_size=${pageSize}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

/**
 * Lấy danh sách lịch công tác
 */
export const getWorkSchedules = async (
  page = 1,
  pageSize = 5
): Promise<PaginatedResponse<Schedule>> => {
  try {
    const response = await api.get(`/work-schedules/?page=${page}&page_size=${pageSize}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching work schedules:', error);
    throw error;
  }
};

/**
 * Lấy danh sách thông báo
 */
export const getNotifications = async (
  page = 1,
  pageSize = 5
): Promise<PaginatedResponse<Notification>> => {
  try {
    const response = await api.get(`/notifications/?page=${page}&page_size=${pageSize}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Lấy các số liệu thống kê cho dashboard
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await api.get('/dashboard/stats/');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

/**
 * Lấy dữ liệu biểu đồ tham gia hoạt động theo thời gian
 */
export const getParticipationChartData = async (
  timeRange: 'week' | 'month' | 'year' = 'month'
): Promise<ChartData> => {
  try {
    const response = await api.get(`/dashboard/participation-chart/?time_range=${timeRange}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching participation chart data:', error);
    throw error;
  }
};

/**
 * Lấy dữ liệu biểu đồ phân loại hoạt động
 */
export const getActivityTypeChartData = async (): Promise<ChartData> => {
  try {
    const response = await api.get('/dashboard/activity-type-chart/');
    return response.data;
  } catch (error) {
    console.error('Error fetching activity type chart data:', error);
    throw error;
  }
};

interface ChatbotResponse {
  response: string;
};

export const sendChatbotQuery = async (query: string): Promise<ChatbotResponse> => {
  try {
    const response = await api.post('http://localhost:9999/api/chat/ask', { message: query });
    return response.data;
  } catch (error) {
    console.error('Error fetching activity type chart data:', error);
    throw error;
  }
}

// export const sendChatbotQuery = async (query: string): Promise<{answer: string, sources: string[]}> => {
//   // Mock response
//   await new Promise(resolve => setTimeout(resolve, 1000)); // Fake delay

//   const answers: {[key: string]: {answer: string, sources: string[]}} = {
//     'giới thiệu về đoàn': {
//       answer: 'Đoàn TNCS Hồ Chí Minh là tổ chức chính trị - xã hội của thanh niên Việt Nam do Đảng Cộng sản Việt Nam và Chủ tịch Hồ Chí Minh sáng lập, lãnh đạo và rèn luyện. Đoàn bao gồm những thanh niên tiên tiến, phấn đấu vì mục tiêu, lý tưởng của Đảng là độc lập dân tộc gắn liền với chủ nghĩa xã hội, dân giàu, nước mạnh, dân chủ, công bằng, văn minh.',
//       sources: ['Điều lệ Đoàn TNCS Hồ Chí Minh']
//     },
//     'quy định đoàn phí': {
//       answer: 'Đoàn phí là 5.000 đồng/tháng (15.000 đồng/quý). Đoàn viên cần đóng trước ngày 15 của tháng đầu tiên mỗi quý. Việc đóng đoàn phí đầy đủ, đúng hạn là một trong những tiêu chí đánh giá đoàn viên.',
//       sources: ['Hướng dẫn thực hiện Điều lệ Đoàn', 'Quy định về đoàn phí']
//     },
//     'đoàn viên xuất sắc': {
//       answer: 'Để đạt danh hiệu Đoàn viên xuất sắc, bạn cần đáp ứng các tiêu chí sau: 1) Tham gia ít nhất 80% các hoạt động do Đoàn tổ chức, 2) Đóng đoàn phí đầy đủ, đúng hạn, 3) Có thành tích học tập hoặc công tác tốt, 4) Được tập thể Chi đoàn công nhận và biểu quyết.',
//       sources: ['Hướng dẫn xét danh hiệu thi đua', 'Quy định công tác thi đua khen thưởng']
//     },
//     'hoạt động sắp tới': {
//       answer: 'Các hoạt động sắp tới gồm: 1) Hiến máu nhân đạo (15/10/2023), 2) Hội thảo kỹ năng mềm (25/10/2023), 3) Cuộc thi Ý tưởng sáng tạo sinh viên (01/11 - 15/12/2023). Bạn có thể đăng ký tham gia qua website hoặc liên hệ trực tiếp với Ban chấp hành Đoàn trường.',
//       sources: ['Kế hoạch hoạt động Quý 4/2023', 'Thông báo của BCH Đoàn trường']
//     }
//   };

//   // Tìm câu trả lời phù hợp nhất
//   let bestMatch = {answer: '', sources: [] as string[]};
//   let highestMatchScore = 0;

//   const normalizedQuery = query.toLowerCase();

//   for (const key in answers) {
//     if (normalizedQuery.includes(key)) {
//       const matchScore = key.length;
//       if (matchScore > highestMatchScore) {
//         highestMatchScore = matchScore;
//         bestMatch = answers[key];
//       }
//     }
//   }

//   // Nếu không tìm thấy kết quả phù hợp
//   if (highestMatchScore === 0) {
//     return {
//       answer: 'Xin lỗi, tôi không có thông tin về câu hỏi này. Bạn có thể hỏi về quy định đoàn phí, giới thiệu về đoàn, tiêu chí đoàn viên xuất sắc hoặc các hoạt động sắp tới.',
//       sources: []
//     };
//   }

//   return bestMatch;
// };

export interface UnionInfo {
  name: string;
  description: string;
  established: string;
  mission: string[];
  structure: Array<{
    name: string;
    description: string;
  }>;
  regulations_summary: string;
  contact: {
    address: string;
    phone: string;
    email: string;
    facebook: string;
  };
}

export const getUnionInfo = async (): Promise<UnionInfo> => {
  try {
    const response = await api.get('/union/info/');
    return response.data;
  } catch (error) {
    console.error('Error fetching union info:', error);
    return {
      name: 'Đoàn Thanh niên',
      description: 'Thông tin không khả dụng',
      established: '',
      mission: [],
      structure: [],
      regulations_summary: '',
      contact: {
        address: '',
        phone: '',
        email: '',
        facebook: ''
      }
    };
  }
};
