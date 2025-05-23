import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  LoginCredentials,
  login as apiLogin,
  logout as apiLogout,
  getCurrentUser,
  getAuthTokens,
  isAuthenticated as checkAuth
} from '../services/auth';

// Định nghĩa kiểu dữ liệu cho state
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

// Tạo context
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: async () => {},
  logout: () => {},
  setUser: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Hàm để tải thông tin người dùng
  const loadUserData = async () => {
    if (checkAuth()) {
      try {
        console.log('AuthContext: Đang lấy thông tin người dùng từ API...');
        const user = await getCurrentUser();
        console.log('AuthContext: Lấy thông tin người dùng thành công:', user);
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      } catch (error: any) {
        console.error('AuthContext: Lỗi khi lấy thông tin người dùng:', error);
        let errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        
        if (error.response) {
          if (error.response.status === 401) {
            errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
          } else if (error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
          }
        }
        
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: errorMessage,
        });
        
        // Xóa token lưu trữ
        apiLogout();
        return false;
      }
    } else {
      console.log('AuthContext: Không tìm thấy token, người dùng chưa đăng nhập');
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      return false;
    }
  };

  // Kiểm tra đăng nhập khi component mount
  useEffect(() => {
    console.log('AuthContext: Khởi tạo - Kiểm tra trạng thái đăng nhập');
    loadUserData();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      console.log(`AuthContext: Đang gửi yêu cầu đăng nhập cho tài khoản: ${credentials.username}`);
      
      // Gọi API đăng nhập
      await apiLogin(credentials);
      
      console.log('AuthContext: Đăng nhập API thành công, đang lấy thông tin người dùng...');
      
      // Lấy thông tin người dùng sau khi đăng nhập thành công
      const user = await getCurrentUser();
      
      console.log('AuthContext: Đăng nhập hoàn tất, thông tin người dùng:', user);
      
      // Cập nhật trạng thái với setTimeout để đảm bảo state thay đổi trước khi render
      setTimeout(() => {
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        console.log('AuthContext: Đã cập nhật trạng thái sau đăng nhập - isAuthenticated = true');
      }, 10);
    } catch (error: any) {
      console.error('AuthContext: Đăng nhập thất bại:', error);
      let errorMessage = 'Đăng nhập thất bại. Vui lòng kiểm tra tên đăng nhập và mật khẩu.';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Tên đăng nhập hoặc mật khẩu không đúng.';
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      });
    }
  };

  const logout = () => {
    console.log('AuthContext: Đăng xuất khỏi hệ thống');
    apiLogout();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  const setUser = (user: User | null) => {
    setState({
      ...state,
      user,
      isAuthenticated: !!user,
    });
  };

  // Debug info cho phát triển
  useEffect(() => {
    console.log('AuthContext: Trạng thái hiện tại:', {
      user: state.user?.username || null,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      error: state.error || null,
    });
  }, [state]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 