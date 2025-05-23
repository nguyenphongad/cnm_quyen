import { LoginCredentials, User, AuthTokens } from './auth';

// Dữ liệu người dùng giả lập
const mockUsers: Record<string, User> = {
  admin: {
    id: '1',
    username: 'admin',
    fullName: 'Quản trị viên',
    email: 'admin@example.com',
    role: 'ADMIN',
    avatar: '',
  },
  canbo: {
    id: '2',
    username: 'canbo',
    fullName: 'Cán bộ Đoàn',
    email: 'canbo@example.com',
    role: 'CAN_BO_DOAN',
    avatar: '',
  },
  doanvien: {
    id: '3',
    username: 'doanvien',
    fullName: 'Đoàn viên',
    email: 'doanvien@example.com',
    role: 'DOAN_VIEN',
    avatar: '',
  },
  tri: {
    id: '4',
    username: 'tri',
    fullName: 'Đặng Hữu Trí',
    email: 'tri@example.com',
    role: 'ADMIN',
    avatar: '',
  }
};

// Hàm giả lập đăng nhập
export const mockLogin = async (credentials: LoginCredentials): Promise<AuthTokens> => {
  console.log('MOCK API - Đăng nhập với tài khoản:', credentials.username);
  
  // Giả lập độ trễ mạng
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const { username, password } = credentials;
  
  // Kiểm tra thông tin đăng nhập - chấp nhận mọi mật khẩu để demo dễ dàng hơn
  if (mockUsers[username]) {
    console.log('MOCK API - Đăng nhập thành công với tài khoản:', username);
    
    // Tạo token giả
    const token = btoa(JSON.stringify({ 
      username, 
      role: mockUsers[username].role,
      timestamp: new Date().getTime()
    }));
    
    // Trả về token
    return {
      access: token,
      refresh: token + '_refresh',
    };
  }
  
  console.log('MOCK API - Đăng nhập thất bại với tài khoản:', username);
  
  // Giả lập lỗi đăng nhập
  throw {
    response: {
      status: 401,
      data: {
        detail: 'Tên đăng nhập hoặc mật khẩu không đúng',
      },
    },
  };
};

// Hàm giả lập lấy thông tin người dùng
export const mockGetCurrentUser = async (): Promise<User> => {
  console.log('MOCK API - Lấy thông tin người dùng');
  
  // Giả lập độ trễ mạng
  await new Promise(resolve => setTimeout(resolve, 300));
  
  try {
    // Lấy thông tin từ token
    const tokensStr = localStorage.getItem('authTokens');
    if (!tokensStr) {
      console.log('MOCK API - Không tìm thấy token trong localStorage');
      throw new Error('No auth token');
    }
    
    const tokens = JSON.parse(tokensStr);
    if (!tokens || !tokens.access) {
      console.log('MOCK API - Token không hợp lệ');
      throw new Error('Invalid token format');
    }
    
    const tokenData = JSON.parse(atob(tokens.access));
    console.log('MOCK API - Thông tin giải mã từ token:', tokenData);
    
    // Trả về thông tin người dùng
    if (mockUsers[tokenData.username]) {
      const user = mockUsers[tokenData.username];
      console.log('MOCK API - Lấy thông tin người dùng thành công:', user);
      return user;
    }
    
    console.log('MOCK API - Không tìm thấy người dùng với username:', tokenData.username);
  } catch (error) {
    console.error('MOCK API - Lỗi khi lấy thông tin người dùng:', error);
  }
  
  throw {
    response: {
      status: 401,
      data: {
        detail: 'Phiên đăng nhập không hợp lệ',
      },
    },
  };
}; 