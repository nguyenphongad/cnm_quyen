import { useState, useEffect } from 'react';
import { XIcon } from '@heroicons/react/24/outline';

interface User {
  id?: string;
  username: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'CAN_BO_DOAN' | 'DOAN_VIEN';
  studentId?: string;
  faculty?: string;
  classroom?: string;
  phoneNumber?: string;
  active?: boolean;
  createdAt?: string;
}

interface UserModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (user: User) => void;
}

const UserModal = ({ isOpen, user, onClose, onSave }: UserModalProps) => {
  const [formData, setFormData] = useState<User>({
    username: '',
    fullName: '',
    email: '',
    role: 'DOAN_VIEN',
    studentId: '',
    faculty: '',
    classroom: '',
    phoneNumber: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        ...user,
        studentId: user.studentId || '',
        faculty: user.faculty || '',
        classroom: user.classroom || '',
        phoneNumber: user.phoneNumber || '',
      });
      setPassword('');
      setConfirmPassword('');
    } else {
      setFormData({
        username: '',
        fullName: '',
        email: '',
        role: 'DOAN_VIEN',
        studentId: '',
        faculty: '',
        classroom: '',
        phoneNumber: '',
      });
      setPassword('');
      setConfirmPassword('');
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Tên đăng nhập không được để trống';
    }
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ và tên không được để trống';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (!user && !password) {
      newErrors.password = 'Mật khẩu không được để trống';
    }
    
    if (password && password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    if (password && password !== confirmPassword) {
      newErrors.confirmPassword = 'Xác nhận mật khẩu không khớp';
    }
    
    if (formData.role === 'DOAN_VIEN' || formData.role === 'CAN_BO_DOAN') {
      if (!formData.studentId) {
        newErrors.studentId = 'MSSV không được để trống';
      }
      if (!formData.faculty) {
        newErrors.faculty = 'Khoa không được để trống';
      }
      if (!formData.classroom) {
        newErrors.classroom = 'Lớp không được để trống';
      }
    }
    
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Số điện thoại không được để trống';
    } else if (!/^[0-9]{10,11}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Số điện thoại không hợp lệ';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Add password to user data if it's a new user or password was changed
    const userData = {
      ...formData,
      ...(password ? { password } : {}),
    };
    
    onSave(userData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 overflow-y-auto z-50">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {user ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
              </h3>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                      Tên đăng nhập <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="username"
                      id="username"
                      value={formData.username}
                      onChange={handleChange}
                      className={`mt-1 form-input ${errors.username ? 'border-red-500' : ''}`}
                      disabled={!!user} // Disable for existing users
                    />
                    {errors.username && <p className="mt-1 text-sm text-red-500">{errors.username}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      id="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`mt-1 form-input ${errors.fullName ? 'border-red-500' : ''}`}
                    />
                    {errors.fullName && <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`mt-1 form-input ${errors.email ? 'border-red-500' : ''}`}
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                      Vai trò <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="role"
                      id="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="mt-1 form-select"
                    >
                      <option value="ADMIN">Quản trị viên</option>
                      <option value="CAN_BO_DOAN">Cán bộ Đoàn</option>
                      <option value="DOAN_VIEN">Đoàn viên</option>
                    </select>
                  </div>
                </div>
                
                {!user && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Mật khẩu <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="password"
                        id="password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) {
                            setErrors({
                              ...errors,
                              password: '',
                            });
                          }
                        }}
                        className={`mt-1 form-input ${errors.password ? 'border-red-500' : ''}`}
                      />
                      {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                    </div>
                    
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                        Xác nhận mật khẩu <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (errors.confirmPassword) {
                            setErrors({
                              ...errors,
                              confirmPassword: '',
                            });
                          }
                        }}
                        className={`mt-1 form-input ${errors.confirmPassword ? 'border-red-500' : ''}`}
                      />
                      {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
                    </div>
                  </div>
                )}
                
                {(formData.role === 'DOAN_VIEN' || formData.role === 'CAN_BO_DOAN') && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
                          MSSV <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="studentId"
                          id="studentId"
                          value={formData.studentId}
                          onChange={handleChange}
                          className={`mt-1 form-input ${errors.studentId ? 'border-red-500' : ''}`}
                        />
                        {errors.studentId && <p className="mt-1 text-sm text-red-500">{errors.studentId}</p>}
                      </div>
                      
                      <div>
                        <label htmlFor="faculty" className="block text-sm font-medium text-gray-700">
                          Khoa <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="faculty"
                          id="faculty"
                          value={formData.faculty}
                          onChange={handleChange}
                          className={`mt-1 form-input ${errors.faculty ? 'border-red-500' : ''}`}
                        />
                        {errors.faculty && <p className="mt-1 text-sm text-red-500">{errors.faculty}</p>}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="classroom" className="block text-sm font-medium text-gray-700">
                          Lớp <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="classroom"
                          id="classroom"
                          value={formData.classroom}
                          onChange={handleChange}
                          className={`mt-1 form-input ${errors.classroom ? 'border-red-500' : ''}`}
                        />
                        {errors.classroom && <p className="mt-1 text-sm text-red-500">{errors.classroom}</p>}
                      </div>
                      
                      <div>
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                          Số điện thoại <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="phoneNumber"
                          id="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          className={`mt-1 form-input ${errors.phoneNumber ? 'border-red-500' : ''}`}
                        />
                        {errors.phoneNumber && <p className="mt-1 text-sm text-red-500">{errors.phoneNumber}</p>}
                      </div>
                    </div>
                  </>
                )}
                
                {formData.role === 'ADMIN' && (
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="phoneNumber"
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className={`mt-1 form-input ${errors.phoneNumber ? 'border-red-500' : ''}`}
                    />
                    {errors.phoneNumber && <p className="mt-1 text-sm text-red-500">{errors.phoneNumber}</p>}
                  </div>
                )}
                
                {user && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Mật khẩu mới (để trống nếu không thay đổi)
                      </label>
                      <input
                        type="password"
                        name="password"
                        id="password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) {
                            setErrors({
                              ...errors,
                              password: '',
                            });
                          }
                        }}
                        className={`mt-1 form-input ${errors.password ? 'border-red-500' : ''}`}
                      />
                      {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                    </div>
                    
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                        Xác nhận mật khẩu mới
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (errors.confirmPassword) {
                            setErrors({
                              ...errors,
                              confirmPassword: '',
                            });
                          }
                        }}
                        className={`mt-1 form-input ${errors.confirmPassword ? 'border-red-500' : ''}`}
                      />
                      {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {user ? 'Lưu thay đổi' : 'Tạo người dùng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserModal; 