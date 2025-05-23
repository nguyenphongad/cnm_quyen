import api from './api';
import { User, UserRole, PaginatedResponse, MemberData } from '@/types';

export interface MemberStats {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  newMembersThisMonth: number;
  membersByDepartment?: Array<{ department: string; count: number }>;
  membersByRole: Array<{ role: string; count: number }>;
}

/**
 * Lấy danh sách thành viên
 */
export const getMembers = async (
  page: number = 1,
  pageSize: number = 10,
  role?: UserRole,
  department?: string,
  search?: string
): Promise<PaginatedResponse<User>> => {
  try {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());
    
    if (role) {
      params.append('role', role);
    }
    
    if (department) {
      params.append('department', department);
    }
    
    if (search) {
      params.append('search', search);
    }
    
    const response = await api.get(`/users/?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching members:', error);
    throw error;
  }
};

/**
 * Lấy thông tin một thành viên
 */
export const getMember = async (id: number): Promise<User> => {
  try {
    const response = await api.get(`/users/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching member ${id}:`, error);
    throw error;
  }
};

/**
 * Tạo thành viên mới
 */
export const createMember = async (memberData: { 
  username: string;
  email: string;
  full_name: string;
  password: string;
  role: UserRole;
  student_id?: string;
  department?: string;
  position?: string;
  phone_number?: string;
}): Promise<User> => {
  try {
    const response = await api.post('/users/', memberData);
    return response.data;
  } catch (error) {
    console.error('Error creating member:', error);
    throw error;
  }
};

/**
 * Cập nhật thông tin thành viên
 */
export const updateMember = async (id: number, memberData: Partial<User>): Promise<User> => {
  try {
    const response = await api.put(`/users/${id}/`, memberData);
    return response.data;
  } catch (error) {
    console.error(`Error updating member ${id}:`, error);
    throw error;
  }
};

/**
 * Xóa thành viên
 */
export const deleteMember = async (id: number): Promise<void> => {
  try {
    await api.delete(`/users/${id}/`);
  } catch (error) {
    console.error(`Error deleting member ${id}:`, error);
    throw error;
  }
};

/**
 * Kích hoạt hoặc vô hiệu hóa tài khoản thành viên
 */
export const toggleMemberStatus = async (id: number, isActive: boolean): Promise<User> => {
  try {
    const response = await api.patch(`/users/${id}/`, { is_active: isActive });
    return response.data;
  } catch (error) {
    console.error(`Error toggling member ${id} status:`, error);
    throw error;
  }
};

/**
 * Thay đổi mật khẩu thành viên
 */
export const changeMemberPassword = async (
  id: number,
  oldPassword: string,
  newPassword: string
): Promise<void> => {
  try {
    await api.post(`/users/${id}/change-password/`, {
      old_password: oldPassword,
      new_password: newPassword
    });
  } catch (error) {
    console.error(`Error changing password for member ${id}:`, error);
    throw error;
  }
};

/**
 * Lấy danh sách vai trò
 */
export const getRoles = async (): Promise<Array<{ id: string; name: string }>> => {
  try {
    const response = await api.get('/users/roles/');
    return response.data;
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
};

/**
 * Lấy danh sách khoa/ban
 */
export const getDepartments = async (): Promise<Array<{ id: string; name: string }>> => {
  try {
    const response = await api.get('/users/departments/');
    return response.data;
  } catch (error) {
    console.error('Error fetching departments:', error);
    throw error;
  }
};

/**
 * Lấy thống kê thành viên
 */
export const getMemberStats = async (): Promise<MemberStats> => {
  try {
    const response = await api.get('/dashboard/member-stats/');
    
    const data = response.data;
    return {
      totalMembers: data.totalMembers || 0,
      activeMembers: data.activeMembers || 0,
      inactiveMembers: data.inactiveMembers || 0,
      newMembersThisMonth: data.newMembersThisMonth || 0,
      membersByRole: data.membersByRole || [],
      membersByDepartment: data.membersByDepartment || []
    };
  } catch (error) {
    console.error('Error fetching member stats:', error);
    // Trả về dữ liệu mặc định trong trường hợp lỗi
    return {
      totalMembers: 0,
      activeMembers: 0,
      inactiveMembers: 0,
      newMembersThisMonth: 0,
      membersByRole: []
    };
  }
};

/**
 * Tải lên avatar thành viên
 */
export const uploadMemberAvatar = async (id: number, file: File): Promise<{ avatar_url: string }> => {
  try {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await api.post(`/users/${id}/upload-avatar/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error uploading avatar for member ${id}:`, error);
    throw error;
  }
};

/**
 * Lấy dữ liệu sổ đoàn viên
 */
export const getMemberBook = async (id: number): Promise<MemberData> => {
  try {
    const response = await api.get(`/users/${id}/member-book/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching member book for member ${id}:`, error);
    throw error;
  }
};

/**
 * Kiểm tra quyền của thành viên
 */
export const checkMemberPermissions = async (
  id: number,
  permissions: string[]
): Promise<Record<string, boolean>> => {
  try {
    const response = await api.post(`/users/${id}/check-permissions/`, { permissions });
    return response.data;
  } catch (error) {
    console.error(`Error checking permissions for member ${id}:`, error);
    throw error;
  }
};

export default {
  getMembers,
  getMember,
  createMember,
  updateMember,
  deleteMember,
  toggleMemberStatus,
  changeMemberPassword,
  getRoles,
  getDepartments,
  getMemberStats,
  uploadMemberAvatar,
  getMemberBook,
  checkMemberPermissions
}; 