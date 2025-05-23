import { useState, useEffect } from 'react';
import { UserRole } from '@/types';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  UserCircleIcon, 
  EnvelopeIcon, 
  ShieldCheckIcon,
  ArrowPathIcon,
  LockClosedIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/common/Button';
import { toast } from 'react-toastify';
import { 
  getAllUsers, 
  deleteUser, 
  resetUserPassword,
  createUser,
  updateUser,
  User,
  CreateUserData
} from '@/services/userService';

// Định nghĩa interface cho cấu trúc phân trang từ API
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const UsersManagementPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<CreateUserData>({
    username: '',
    email: '',
    full_name: '',
    password: '',
    role: UserRole.DOAN_VIEN,
    phone_number: '',
    address: ''
  });
  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    full_name?: string;
    password?: string;
  }>({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await getAllUsers();
      console.log('Danh sách người dùng từ API:', response);
      
      // Kiểm tra nếu response có cấu trúc phân trang
      if (response && 'results' in response && Array.isArray(response.results)) {
        setUsers(response.results);
        setFilteredUsers(response.results);
      } else if (Array.isArray(response)) {
        // Nếu response là mảng trực tiếp
        setUsers(response);
        setFilteredUsers(response);
      } else {
        // Nếu không đúng định dạng
        console.error('Dữ liệu không đúng định dạng:', response);
        setUsers([]);
        setFilteredUsers([]);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Không thể tải dữ liệu người dùng từ server');
      setIsLoading(false);
      setUsers([]);
      setFilteredUsers([]);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [search, roleFilter, statusFilter, users]);

  const applyFilters = () => {
    if (!Array.isArray(users)) {
      console.error('users is not an array:', users);
      setFilteredUsers([]);
      return;
    }
    
    let result = [...users];
    
    // Lọc theo từ khóa tìm kiếm
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(user => 
        (user.username?.toLowerCase() || '').includes(searchLower) || 
        (user.full_name?.toLowerCase() || '').includes(searchLower) ||
        (user.email?.toLowerCase() || '').includes(searchLower)
      );
    }
    
    // Lọc theo vai trò
    if (roleFilter !== 'all') {
      result = result.filter(user => user.role === roleFilter);
    }
    
    // Lọc theo trạng thái
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      result = result.filter(user => user.is_active === isActive);
    }
    
    setFilteredUsers(result);
  };

  const handleCreateUser = () => {
    setNewUser({
      username: '',
      email: '',
      full_name: '',
      password: '',
      role: UserRole.DOAN_VIEN,
      phone_number: '',
      address: ''
    });
    setErrors({});
    setShowCreateModal(true);
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!newUser.username.trim()) {
      newErrors.username = 'Tên đăng nhập không được để trống';
    } else if (newUser.username.length < 4) {
      newErrors.username = 'Tên đăng nhập phải có ít nhất 4 ký tự';
    }
    
    if (!newUser.email.trim()) {
      newErrors.email = 'Email không được để trống';
    } else if (!/\S+@\S+\.\S+/.test(newUser.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (!newUser.full_name.trim()) {
      newErrors.full_name = 'Họ tên không được để trống';
    }
    
    if (!newUser.password) {
      newErrors.password = 'Mật khẩu không được để trống';
    } else if (newUser.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitNewUser = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      const response = await createUser(newUser);
      
      // Thêm người dùng mới vào danh sách
      setUsers(prevUsers => [...prevUsers, response]);
      
      // Đóng modal
      setShowCreateModal(false);
      
      toast.success('Tạo người dùng mới thành công');
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      // Xử lý lỗi từ API
      if (error.response && error.response.data) {
        const apiErrors = error.response.data;
        const formattedErrors: typeof errors = {};
        
        // Chuyển đổi lỗi từ API sang định dạng của form
        Object.entries(apiErrors).forEach(([key, value]) => {
          if (key === 'username' || key === 'email' || key === 'full_name' || key === 'password') {
            formattedErrors[key as keyof typeof errors] = Array.isArray(value) ? value[0] : String(value);
          }
        });
        
        setErrors(formattedErrors);
      } else {
        toast.error('Không thể tạo người dùng mới');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
    
    // Xóa lỗi khi người dùng nhập lại
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleEditUser = (id: number) => {
    const userToEdit = users.find(u => u.id === id);
    if (userToEdit) {
      // Đây là nơi sẽ hiển thị form chỉnh sửa người dùng
      // Hiện tại chỉ hiển thị thông báo
      toast.info('Chức năng đang được phát triển');
    }
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      await deleteUser(selectedUser.id);
      
      // Cập nhật state
      const updatedUsers = users.filter(u => u.id !== selectedUser.id);
      setUsers(updatedUsers);
      
      toast.success('Xóa người dùng thành công');
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Không thể xóa người dùng');
    }
  };

  const openResetPasswordModal = (user: User) => {
    setSelectedUser(user);
    setShowResetPasswordModal(true);
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    
    try {
      await resetUserPassword(selectedUser.id);
      
      toast.success('Đặt lại mật khẩu thành công');
      setShowResetPasswordModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Không thể đặt lại mật khẩu');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa đăng nhập';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <ShieldCheckIcon className="h-3 w-3 mr-1" />
            Quản trị viên
          </span>
        );
      case UserRole.CAN_BO_DOAN:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <UserCircleIcon className="h-3 w-3 mr-1" />
            Cán bộ Đoàn
          </span>
        );
      case UserRole.DOAN_VIEN:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <UserCircleIcon className="h-3 w-3 mr-1" />
            Đoàn viên
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircleIcon className="h-3 w-3 mr-1" />
        Đang hoạt động
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XMarkIcon className="h-3 w-3 mr-1" />
        Bị khóa
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý tài khoản người dùng trong hệ thống
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={fetchUsers} 
            className="flex items-center justify-center bg-gray-100 text-gray-800 hover:bg-gray-200"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Làm mới
          </Button>
          <Button onClick={handleCreateUser} className="flex items-center justify-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            Thêm người dùng mới
          </Button>
        </div>
      </div>

      {/* Bộ lọc và tìm kiếm */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm
            </label>
            <input
              type="text"
              id="search"
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Tên đăng nhập, họ tên hoặc email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Vai trò
            </label>
            <select
              id="roleFilter"
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">Tất cả vai trò</option>
              <option value={UserRole.ADMIN}>Quản trị viên</option>
              <option value={UserRole.CAN_BO_DOAN}>Cán bộ Đoàn</option>
              <option value={UserRole.DOAN_VIEN}>Đoàn viên</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              id="statusFilter"
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Bị khóa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Danh sách người dùng */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
                  Email
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Vai trò
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Đăng nhập gần đây
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Trạng thái
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <UserCircleIcon className="h-8 w-8 text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.username}
                        </div>
                        <div className="text-sm text-gray-500">{user.full_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.last_login)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user.is_active)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEditUser(user.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Chỉnh sửa"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => openResetPasswordModal(user)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Đặt lại mật khẩu"
                      >
                        <LockClosedIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(user)}
                        className="text-red-600 hover:text-red-900"
                        title="Xóa người dùng"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <UserCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Không tìm thấy người dùng</h3>
          <p className="mt-1 text-sm text-gray-500">Không có người dùng nào phù hợp với tiêu chí tìm kiếm.</p>
        </div>
      )}

      {/* Modal xóa người dùng */}
      {showDeleteModal && (
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
                    <h3 className="text-lg font-medium text-gray-900">Xóa người dùng</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Bạn có chắc chắn muốn xóa người dùng {selectedUser?.username}? Mọi dữ liệu liên quan đến người dùng này sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDeleteUser}
                >
                  Xóa
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal đặt lại mật khẩu */}
      {showResetPasswordModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                    <LockClosedIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-medium text-gray-900">Đặt lại mật khẩu</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Bạn có chắc chắn muốn đặt lại mật khẩu của người dùng {selectedUser?.username}? Mật khẩu mới sẽ được gửi đến email của người dùng.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-600 text-base font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleResetPassword}
                >
                  Đặt lại mật khẩu
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowResetPasswordModal(false)}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal tạo người dùng mới */}
      {showCreateModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <UserCircleIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg font-medium text-gray-900">Thêm người dùng mới</h3>
                    <div className="mt-4 space-y-4">
                      {/* Tên đăng nhập */}
                      <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                          Tên đăng nhập <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="username"
                          name="username"
                          value={newUser.username}
                          onChange={handleInputChange}
                          className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.username ? 'border-red-500' : ''}`}
                        />
                        {errors.username && (
                          <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                        )}
                      </div>
                      
                      {/* Họ tên */}
                      <div>
                        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                          Họ tên <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="full_name"
                          name="full_name"
                          value={newUser.full_name}
                          onChange={handleInputChange}
                          className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.full_name ? 'border-red-500' : ''}`}
                        />
                        {errors.full_name && (
                          <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
                        )}
                      </div>
                      
                      {/* Email */}
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={newUser.email}
                          onChange={handleInputChange}
                          className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.email ? 'border-red-500' : ''}`}
                        />
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
                      </div>
                      
                      {/* Mật khẩu */}
                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                          Mật khẩu <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          id="password"
                          name="password"
                          value={newUser.password}
                          onChange={handleInputChange}
                          className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.password ? 'border-red-500' : ''}`}
                        />
                        {errors.password && (
                          <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                        )}
                      </div>
                      
                      {/* Vai trò */}
                      <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                          Vai trò <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="role"
                          name="role"
                          value={newUser.role}
                          onChange={handleInputChange}
                          className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        >
                          <option value={UserRole.DOAN_VIEN}>Đoàn viên</option>
                          <option value={UserRole.CAN_BO_DOAN}>Cán bộ Đoàn</option>
                          <option value={UserRole.ADMIN}>Quản trị viên</option>
                        </select>
                      </div>
                      
                      {/* Số điện thoại */}
                      <div>
                        <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                          Số điện thoại
                        </label>
                        <input
                          type="text"
                          id="phone_number"
                          name="phone_number"
                          value={newUser.phone_number || ''}
                          onChange={handleInputChange}
                          className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                      
                      {/* Địa chỉ */}
                      <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                          Địa chỉ
                        </label>
                        <input
                          type="text"
                          id="address"
                          name="address"
                          value={newUser.address || ''}
                          onChange={handleInputChange}
                          className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleSubmitNewUser}
                >
                  Tạo mới
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowCreateModal(false)}
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

export default UsersManagementPage; 