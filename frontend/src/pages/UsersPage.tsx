import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { UserRole } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import SearchBar from '@/components/common/SearchBar';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Alert from '@/components/common/Alert';
import api from '@/services/api';

const UsersPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchResults, setSearchResults] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    role: UserRole.DOANVIEN,
    phone_number: '',
    address: '',
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/users/');
      setUsers(response.data.results);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError('Không thể tải danh sách người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query) => {
    if (!query) {
      setSearchResults(null);
      return;
    }
    
    try {
      const response = await api.get(`/users/search/?q=${query}`);
      setSearchResults(response.data.results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleCreateUser = async () => {
    try {
      await api.post('/users/', formData);
      setSuccess('Tạo người dùng thành công');
      setShowCreateModal(false);
      fetchUsers();
      resetForm();
    } catch (error) {
      console.error('Failed to create user:', error);
      setError('Không thể tạo người dùng. Vui lòng kiểm tra thông tin.');
    }
  };

  const handleEditUser = async () => {
    try {
      const { id } = selectedUser;
      const { password, ...updateData } = formData;
      
      // Chỉ gửi mật khẩu nếu có thay đổi
      if (password) {
        await api.patch(`/users/${id}/`, formData);
      } else {
        await api.patch(`/users/${id}/`, updateData);
      }
      
      setSuccess('Cập nhật người dùng thành công');
      setShowEditModal(false);
      fetchUsers();
      resetForm();
    } catch (error) {
      console.error('Failed to update user:', error);
      setError('Không thể cập nhật người dùng');
    }
  };

  const handleDeleteUser = async () => {
    try {
      await api.delete(`/users/${selectedUser.id}/`);
      setSuccess('Xóa người dùng thành công');
      setShowDeleteModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      setError('Không thể xóa người dùng');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      full_name: '',
      password: '',
      role: UserRole.DOANVIEN,
      phone_number: '',
      address: '',
    });
  };

  return (
    <div>
      {/* Rest of the component code */}
    </div>
  );
};

export default UsersPage; 