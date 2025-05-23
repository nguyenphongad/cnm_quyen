import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { youth } from '../assets/images';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const { login, isAuthenticated, isLoading: authLoading, error: authError } = useAuth();
  const navigate = useNavigate();

  // Cập nhật lỗi từ context
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  // Nếu người dùng đã đăng nhập, chuyển hướng đến trang chủ
  useEffect(() => {
    if (isAuthenticated) {
      console.log('Người dùng đã đăng nhập, chuyển hướng đến trang chủ');
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Kiểm tra lại token sau khi đăng nhập thành công 
  useEffect(() => {
    if (loginSuccess) {
      console.log('Đã đăng nhập thành công, kiểm tra token sau 500ms...');
      const timer = setTimeout(() => {
        const token = localStorage.getItem('authTokens');
        if (token) {
          console.log('Tìm thấy token trong localStorage, chuyển hướng thủ công');
          navigate('/', { replace: true });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loginSuccess, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Xác thực đầu vào
    if (!username.trim()) {
      setError('Vui lòng nhập tên đăng nhập');
      return;
    }
    
    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }
    
    setError(null);
    setIsLoading(true);
    setLoginSuccess(false);

    try {
      console.log('Bắt đầu đăng nhập với:', username);
      await login({ username, password });
      console.log('Đăng nhập thành công, đang chờ chuyển hướng...');
      
      // Đánh dấu đã đăng nhập thành công
      setLoginSuccess(true);
      
      // Thử chuyển hướng trực tiếp nếu đã xác thực
      if (localStorage.getItem('authTokens')) {
        console.log('Token đã có trong localStorage, thử chuyển hướng ngay');
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 100);
      }
    } catch (err: any) {
      console.error('Lỗi khi đăng nhập:', err);
      setLoginSuccess(false);
      // Xử lý lỗi chi tiết
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không đúng');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Nếu đang xác thực, hiển thị component loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Nếu đã đăng nhập thành công nhưng chưa chuyển hướng, hiển thị trang loading
  if (loginSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-600">Đăng nhập thành công, đang chuyển hướng...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image and Brand */}
      <div className="hidden lg:block lg:w-1/2 bg-gradient-to-r from-primary-700 to-primary-900">
        <div className="flex flex-col justify-center items-center h-full px-16 text-white">
          <img src={youth.loginHero} alt="Đoàn TNCS Hồ Chí Minh" className="h-64 mb-8" />
          <h1 className="text-3xl font-bold mb-4 text-center">Hệ thống Quản lý Hoạt động Đoàn</h1>
          <p className="text-lg mb-6 text-center opacity-90">
            Đoàn TNCS Hồ Chí Minh - Trường Đại học XYZ
          </p>
          <div className="p-6 bg-white bg-opacity-10 rounded-lg shadow-lg">
            <h3 className="font-medium mb-3 text-center text-xl">Sứ mệnh</h3>
            <p className="text-sm opacity-90 text-center leading-relaxed">
              "Xây dựng thế hệ trẻ Việt Nam phát triển toàn diện, giàu lòng yêu nước, 
              có ý thức tự lực, tự cường, có lý tưởng sống cao đẹp."
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-10">
            <div className="h-16 w-16 rounded-full bg-primary-600 flex items-center justify-center text-white overflow-hidden">
              <img src={youth.logo} alt="Logo" className="h-10" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">
            Đăng nhập
          </h2>
          <p className="text-center text-gray-600 mb-8">
            Vui lòng đăng nhập để truy cập hệ thống
          </p>

          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6 shadow-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Tên đăng nhập
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm 
                           focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Mật khẩu
                </label>
                <div className="text-xs">
                  <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                    Quên mật khẩu?
                  </a>
                </div>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm 
                           focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember_me"
                  name="remember_me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-700">
                  Ghi nhớ đăng nhập
                </label>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm 
                           text-sm font-medium text-white bg-primary-600 hover:bg-primary-700
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                           transition duration-150 ease-in-out"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0v4c3.092 0 5.9 1.143 8.197 3.126z"></path>
                    </svg>
                    Đang đăng nhập...
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Tài khoản demo:</p>
            <p className="mt-1"><strong>admin</strong> / <strong>password</strong> (Quản trị viên)</p>
            <p><strong>canbo</strong> / <strong>password</strong> (Cán bộ Đoàn)</p>
            <p><strong>doanvien</strong> / <strong>password</strong> (Đoàn viên)</p>
            <p><strong>tri</strong> / <strong>password</strong> (Quản trị viên)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 