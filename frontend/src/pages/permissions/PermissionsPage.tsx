import { useState, useEffect } from 'react';
import { User, UserRole } from '@/types';
import api from '@/services/api';
import { toast } from 'react-toastify';

const PermissionsPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.DOANVIEN);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Mô phỏng API call
      // const response = await api.get('/users/');
      // setUsers(response.data);
      
      // Dữ liệu mẫu
      setTimeout(() => {
        setUsers([
          {
            id: 1,
            username: 'nguyenvana',
            email: 'nguyenvana@example.com',
            full_name: 'Nguyễn Văn A',
            role: UserRole.ADMIN,
            is_active: true,
            date_joined: '2023-01-15T08:00:00Z'
          },
        ]);
        setIsLoading(false);
      }, 800);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Có lỗi xảy ra khi tải dữ liệu người dùng');
    }
  };

  return (
    <div>
      {/* Render component content here */}
    </div>
  );
};

export default PermissionsPage; 