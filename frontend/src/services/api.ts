import axios, { AxiosError, AxiosResponse } from 'axios';

// Đọc URL API từ biến môi trường hoặc sử dụng giá trị mặc định
const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api';
console.log('API URL được cấu hình:', API_URL);

// Helper function để lấy token từ localStorage
const getAuthTokens = () => {
  const tokensStr = localStorage.getItem('authTokens');
  if (tokensStr) {
    try {
      return JSON.parse(tokensStr);
    } catch (error) {
      console.error('Lỗi parse token:', error);
      return null;
    }
  }
  return null;
};

// Helper function để xóa token
const clearAuthTokens = (): void => {
  localStorage.removeItem('authTokens');
};

// Tạo instance axios với config mặc định
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000, // 30 giây timeout
});

// Interceptor cho request - thêm token vào header
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.data);
    
    const tokens = getAuthTokens();
    if (tokens && tokens.access) {
      config.headers.Authorization = `Bearer ${tokens.access}`;
      console.log('Token được thêm vào request');
    } else {
      console.log('Không có token để thêm vào request');
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Interceptor cho response - xử lý refresh token khi token hết hạn
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    if (!originalRequest) {
      return Promise.reject(error);
    }
    
    console.error('API Error:', error.message, originalRequest.url);
    
    // Nếu là lỗi 401 (Unauthorized) và chưa thử refresh token
    if (error.response?.status === 401 && !originalRequest.headers._retry) {
      try {
        console.log('Token hết hạn, đang thử refresh token...');
        
        // Đánh dấu request là đã thử refresh
        originalRequest.headers._retry = true;
        
        // Lấy refresh token
        const tokens = getAuthTokens();
        if (!tokens || !tokens.refresh) {
          console.log('Không tìm thấy refresh token, chuyển hướng về trang đăng nhập');
          // Không có refresh token, đăng xuất
          clearAuthTokens();
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        // Gọi API để refresh token
        console.log('Đang refresh token...');
        const response = await axios.post(`${API_URL}/token/refresh/`, {
          refresh: tokens.refresh,
        });
        
        if (response.data && response.data.access) {
          console.log('Refresh token thành công, cập nhật token mới');
          // Lưu token mới
          localStorage.setItem('authTokens', JSON.stringify({
            access: response.data.access,
            refresh: tokens.refresh,
          }));
          
          // Cập nhật token cho request gốc và thử lại
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        console.error('Refresh token thất bại:', refreshError);
        // Nếu refresh thất bại, đăng xuất
        clearAuthTokens();
        window.location.href = '/login?expired=true';
        return Promise.reject(refreshError);
      }
    }
    
    // Xử lý lỗi mạng
    if (!error.response) {
      console.error('Lỗi mạng hoặc không thể kết nối đến server');
    }
    
    return Promise.reject(error);
  }
);

// Xóa mock API cho member-book (từ dòng 100-205) và thay bằng
// Interceptor cho mock API nếu cần đặt ở đây
api.interceptors.request.use(
  async (config) => {
    // Thêm mock API cho các endpoint khác tại đây nếu cần
    return config;
  },
  (error) => Promise.reject(error)
);

export default api; 