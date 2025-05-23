import { useState, useEffect } from 'react';
import { UserRole, PermissionType } from '@/types';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  ShieldCheckIcon,
  XMarkIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/common/Button';
import { toast } from 'react-toastify';

interface Permission {
  id: number;
  name: string;
  description: string;
  module: string;
  roles: UserRole[];
}

interface RolePermission {
  role: UserRole;
  permissions: number[];
}

const PermissionsPage = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      // Mô phỏng API call
      setTimeout(() => {
        const mockPermissions: Permission[] = [
          {
            id: 1,
            name: 'user.view',
            description: 'Xem thông tin người dùng',
            module: 'Người dùng',
            roles: [UserRole.ADMIN, UserRole.CANBODOAN]
          },
          {
            id: 2,
            name: 'user.create',
            description: 'Tạo người dùng mới',
            module: 'Người dùng',
            roles: [UserRole.ADMIN]
          },
          {
            id: 3,
            name: 'user.edit',
            description: 'Chỉnh sửa thông tin người dùng',
            module: 'Người dùng',
            roles: [UserRole.ADMIN]
          },
          {
            id: 4,
            name: 'user.delete',
            description: 'Xóa người dùng',
            module: 'Người dùng',
            roles: [UserRole.ADMIN]
          },
          {
            id: 5,
            name: 'permission.view',
            description: 'Xem phân quyền',
            module: 'Phân quyền',
            roles: [UserRole.ADMIN]
          },
          {
            id: 6,
            name: 'permission.edit',
            description: 'Chỉnh sửa phân quyền',
            module: 'Phân quyền',
            roles: [UserRole.ADMIN]
          },
          {
            id: 7,
            name: 'activity.view',
            description: 'Xem hoạt động',
            module: 'Hoạt động',
            roles: [UserRole.ADMIN, UserRole.CANBODOAN, UserRole.DOANVIEN]
          },
          {
            id: 8,
            name: 'activity.create',
            description: 'Tạo hoạt động mới',
            module: 'Hoạt động',
            roles: [UserRole.ADMIN, UserRole.CANBODOAN]
          },
          {
            id: 9,
            name: 'activity.edit',
            description: 'Chỉnh sửa hoạt động',
            module: 'Hoạt động',
            roles: [UserRole.ADMIN, UserRole.CANBODOAN]
          },
          {
            id: 10,
            name: 'activity.delete',
            description: 'Xóa hoạt động',
            module: 'Hoạt động',
            roles: [UserRole.ADMIN, UserRole.CANBODOAN]
          },
          {
            id: 11,
            name: 'post.view',
            description: 'Xem bài viết',
            module: 'Bài viết',
            roles: [UserRole.ADMIN, UserRole.CANBODOAN, UserRole.DOANVIEN]
          },
          {
            id: 12,
            name: 'post.create',
            description: 'Tạo bài viết mới',
            module: 'Bài viết',
            roles: [UserRole.ADMIN, UserRole.CANBODOAN]
          }
        ];
        
        // Tạo danh sách role_permissions
        const mockRolePermissions: RolePermission[] = [
          {
            role: UserRole.ADMIN,
            permissions: mockPermissions.filter(p => p.roles.includes(UserRole.ADMIN)).map(p => p.id)
          },
          {
            role: UserRole.CANBODOAN,
            permissions: mockPermissions.filter(p => p.roles.includes(UserRole.CANBODOAN)).map(p => p.id)
          },
          {
            role: UserRole.DOANVIEN,
            permissions: mockPermissions.filter(p => p.roles.includes(UserRole.DOANVIEN)).map(p => p.id)
          }
        ];
        
        setPermissions(mockPermissions);
        setRolePermissions(mockRolePermissions);
        setSelectedRole(UserRole.ADMIN);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Không thể tải dữ liệu phân quyền');
      setIsLoading(false);
    }
  };

  // Lấy danh sách module duy nhất từ permissions
  const modules = Array.from(new Set(permissions.map(p => p.module)));

  // Lấy danh sách quyền của một role
  const getPermissionsForRole = (role: UserRole) => {
    const rolePermission = rolePermissions.find(rp => rp.role === role);
    return rolePermission ? rolePermission.permissions : [];
  };

  // Kiểm tra xem một quyền có thuộc về một role hay không
  const hasPermission = (permissionId: number, role: UserRole) => {
    const rolePermission = rolePermissions.find(rp => rp.role === role);
    return rolePermission ? rolePermission.permissions.includes(permissionId) : false;
  };

  // Thay đổi quyền của một role
  const togglePermission = (permissionId: number, role: UserRole) => {
    const newRolePermissions = [...rolePermissions];
    const roleIndex = newRolePermissions.findIndex(rp => rp.role === role);
    
    if (roleIndex !== -1) {
      const permissions = newRolePermissions[roleIndex].permissions;
      const permissionIndex = permissions.indexOf(permissionId);
      
      if (permissionIndex !== -1) {
        // Xóa quyền nếu đã có
        permissions.splice(permissionIndex, 1);
      } else {
        // Thêm quyền nếu chưa có
        permissions.push(permissionId);
      }
      
      newRolePermissions[roleIndex] = {
        ...newRolePermissions[roleIndex],
        permissions: [...permissions]
      };
      
      setRolePermissions(newRolePermissions);
      
      // Mô phỏng cập nhật API
      toast.success('Đã cập nhật phân quyền');
    }
  };

  const handleCreatePermission = () => {
    toast.info('Chức năng đang được phát triển');
  };

  const handleEditPermission = (permission: Permission) => {
    toast.info('Chức năng đang được phát triển');
  };

  const openDeleteModal = (permission: Permission) => {
    setSelectedPermission(permission);
    setShowDeleteModal(true);
  };

  const handleDeletePermission = async () => {
    if (!selectedPermission) return;
    
    try {
      // Mô phỏng API call
      // await api.delete(`/permissions/${selectedPermission.id}/`);
      
      // Cập nhật state
      const updatedPermissions = permissions.filter(p => p.id !== selectedPermission.id);
      setPermissions(updatedPermissions);
      
      // Cập nhật role_permissions
      const newRolePermissions = rolePermissions.map(rp => ({
        ...rp,
        permissions: rp.permissions.filter(id => id !== selectedPermission.id)
      }));
      setRolePermissions(newRolePermissions);
      
      toast.success('Xóa quyền thành công');
      setShowDeleteModal(false);
      setSelectedPermission(null);
    } catch (error) {
      console.error('Error deleting permission:', error);
      toast.error('Không thể xóa quyền');
    }
  };

  const getRoleName = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Quản trị viên';
      case UserRole.CANBODOAN:
        return 'Cán bộ Đoàn';
      case UserRole.DOANVIEN:
        return 'Đoàn viên';
      default:
        return '';
    }
  };

  const getPermissionsByModule = (module: string) => {
    return permissions.filter(p => p.module === module);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl font-bold text-gray-900">Quản lý phân quyền</h1>
          <p className="mt-1 text-sm text-gray-500">
            Phân quyền truy cập cho các vai trò trong hệ thống
          </p>
        </div>
        <Button onClick={handleCreatePermission} className="flex items-center justify-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Thêm quyền mới
        </Button>
      </div>

      {/* Tab chọn vai trò */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {Object.values(UserRole).map((role) => (
            <button
              key={role}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${selectedRole === role
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
              onClick={() => setSelectedRole(role)}
            >
              {getRoleName(role)}
            </button>
          ))}
        </nav>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Danh sách quyền phân theo module */}
          {modules.map((module) => (
            <div key={module} className="border-b border-gray-200 last:border-b-0">
              <div className="px-4 py-4 bg-gray-50 flex items-center">
                <h3 className="text-lg font-medium text-gray-900">{module}</h3>
              </div>
              
              <div className="divide-y divide-gray-200">
                {getPermissionsByModule(module).map((permission) => (
                  <div key={permission.id} className="px-4 py-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <ShieldCheckIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{permission.name}</p>
                          <p className="text-sm text-gray-500">{permission.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    {selectedRole && (
                      <div className="ml-4">
                        <button
                          onClick={() => togglePermission(permission.id, selectedRole)}
                          className={`
                            relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                            ${hasPermission(permission.id, selectedRole) ? 'bg-primary-600' : 'bg-gray-200'}
                          `}
                        >
                          <span
                            className={`
                              pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200
                              ${hasPermission(permission.id, selectedRole) ? 'translate-x-5' : 'translate-x-0'}
                            `}
                          />
                        </button>
                      </div>
                    )}
                    
                    <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                      <button
                        onClick={() => handleEditPermission(permission)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Chỉnh sửa"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(permission)}
                        className="text-red-600 hover:text-red-900"
                        title="Xóa"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal xác nhận xóa */}
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
                    <h3 className="text-lg font-medium text-gray-900">Xóa quyền</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Bạn có chắc chắn muốn xóa quyền "{selectedPermission?.name}"? Hành động này không thể phục hồi và có thể ảnh hưởng đến quyền truy cập của nhiều người dùng.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDeletePermission}
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
    </div>
  );
};

export default PermissionsPage; 