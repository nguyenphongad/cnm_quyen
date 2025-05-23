import { useState, useEffect } from 'react';
import { UserRole, User } from '@/types';
import { PlusIcon, PencilIcon, TrashIcon, UserCircleIcon, EnvelopeIcon, PhoneIcon, AcademicCapIcon, BuildingOfficeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/common/Button';
import { toast } from 'react-toastify';
import { getMembers, deleteMember, getMemberStats, MemberStats } from '@/services/memberService';
import { useNavigate } from 'react-router-dom';
import { navigateTo } from '@/services/navigationService';

const MembersManagementPage = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>(UserRole.DOAN_VIEN);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [stats, setStats] = useState<MemberStats>({
    totalMembers: 0,
    activeMembers: 0,
    inactiveMembers: 0,
    newMembersThisMonth: 0,
    membersByRole: []
  });
  const [faculties, setFaculties] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;
  const [activeTab, setActiveTab] = useState('list');

  const navigation = useNavigate();


  useEffect(() => {
    fetchMembers();
    fetchStats();
  }, [currentPage]);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      // Gọi API thực tế để lấy danh sách thành viên
      const response = await getMembers(
        currentPage, 
        pageSize, 
        roleFilter === 'all' ? undefined : roleFilter, 
        facultyFilter === 'all' ? undefined : facultyFilter,
        search || undefined
      );
      
      setMembers(response.results);
      setFilteredMembers(response.results);
      setTotalPages(Math.ceil(response.count / pageSize));
      
      // Lấy danh sách các khoa từ kết quả trả về
      const uniqueFaculties = Array.from(new Set(
        response.results
          .map(m => m.department || m.faculty)
          .filter(faculty => faculty && faculty.trim() !== '') as string[]
      ));
      setFaculties(uniqueFaculties);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Không thể tải dữ liệu đoàn viên từ server');
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await getMemberStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching member stats:', error);
      toast.error('Không thể tải dữ liệu thống kê đoàn viên');
    }
  };

  useEffect(() => {
    applyFilters();
  }, [members, facultyFilter, roleFilter]);

  const applyFilters = () => {
    if (!Array.isArray(members)) {
      console.error('members is not an array:', members);
      setFilteredMembers([]);
      return;
    }
    
    let result = [...members];
    
    // Lọc theo khoa (client-side filtering bổ sung, khi đã gọi API với các bộ lọc)
    if (facultyFilter !== 'all') {
      result = result.filter(member => 
        (member.department || member.faculty) === facultyFilter
      );
    }
    
    // Lọc thêm theo vai trò (client-side filtering bổ sung)
    if (roleFilter === UserRole.DOAN_VIEN) {
      result = result.filter(member => member.role === UserRole.DOAN_VIEN);
    } else if (roleFilter === UserRole.ADMIN) {
      result = result.filter(member => member.role === UserRole.ADMIN);
    } else if (roleFilter === UserRole.CAN_BO_DOAN) {
      result = result.filter(member => member.role === UserRole.CAN_BO_DOAN);
    }
    
    setFilteredMembers(result);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchMembers();
  };

  const handleCreateMember = () => {
    // Chuyển hướng đến trang tạo thành viên
    navigateTo('/members/create');
  };

  const handleEditMember = (id: number) => {
    // Chuyển hướng đến trang chỉnh sửa thành viên
    // window.location.href = `/members/edit/${id}`;
   navigateTo(`/members/edit/${id}`);
  };

  const openDeleteModal = (member: User) => {
    setSelectedMember(member);
    setShowDeleteModal(true);
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    
    try {
      await deleteMember(selectedMember.id);
      
      toast.success('Xóa đoàn viên thành công');
      setShowDeleteModal(false);
      setSelectedMember(null);
      
      // Làm mới dữ liệu
      fetchMembers();
      fetchStats();
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error('Không thể xóa đoàn viên');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl font-bold text-gray-900">Quản lý đoàn viên</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý thông tin và điểm hoạt động của đoàn viên
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => {
              fetchMembers();
              fetchStats();
            }}
            className="flex items-center justify-center bg-gray-100 text-gray-800 hover:bg-gray-200"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Làm mới
          </Button>
          <Button onClick={handleCreateMember} className="flex items-center justify-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            Thêm đoàn viên mới
          </Button>
        </div>
      </div>

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
              <UserCircleIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 truncate">Tổng số đoàn viên</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">{stats.totalMembers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <UserCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 truncate">Đoàn viên hoạt động</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">{stats.activeMembers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
              <UserCircleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 truncate">Đoàn viên không hoạt động</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">{stats.inactiveMembers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
              <AcademicCapIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 truncate">Đoàn viên mới (tháng này)</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">{stats.newMembersThisMonth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bộ lọc và tìm kiếm */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm
            </label>
            <div className="flex">
              <input
                type="text"
                id="search"
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md rounded-r-none"
                placeholder="Họ tên, email hoặc mã sinh viên"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                className="bg-primary-600 text-white px-4 rounded-r-md hover:bg-primary-700"
                onClick={handleSearch}
              >
                Tìm
              </button>
            </div>
          </div>
          
          <div>
            <label htmlFor="facultyFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Khoa
            </label>
            <select
              id="facultyFilter"
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={facultyFilter}
              onChange={(e) => setFacultyFilter(e.target.value)}
            >
              <option value="all">Tất cả các khoa</option>
              {faculties.map((faculty, index) => (
                <option key={index} value={faculty}>{faculty}</option>
              ))}
            </select>
          </div>
          
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('list')}
            className={`${
              activeTab === 'list'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Danh sách đoàn viên
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`${
              activeTab === 'stats'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Thống kê chi tiết
          </button>
        </nav>
      </div>

      {/* Hiển thị tab nội dung */}
      {activeTab === 'list' ? (
        isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="bg-white shadow rounded-lg py-8 mt-6">
            <div className="text-center">
              <p className="text-gray-500">Không tìm thấy đoàn viên nào</p>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Họ tên
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email & Số điện thoại
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mã SV & Khoa
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vai trò
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày tham gia
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {member.profile_picture ? (
                              <img 
                                className="h-10 w-10 rounded-full" 
                                src={member.profile_picture} 
                                alt={member.full_name} 
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <UserCircleIcon className="h-6 w-6 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {member.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{member.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" />
                          {member.email}
                        </div>
                        {member.phone_number && (
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                            {member.phone_number}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {member.student_id && (
                          <div className="text-sm text-gray-900">
                            {member.student_id}
                          </div>
                        )}
                        {member.faculty && (
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <BuildingOfficeIcon className="h-4 w-4 mr-1 text-gray-400" />
                            {member.faculty}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          member.role === UserRole.ADMIN 
                            ? 'bg-purple-100 text-purple-800' 
                            : member.role === UserRole.CAN_BO_DOAN 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {member.role === UserRole.ADMIN 
                            ? 'Quản trị viên'
                            : member.role === UserRole.CAN_BO_DOAN 
                            ? 'Cán bộ Đoàn'
                            : 'Đoàn viên'
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(member.date_joined)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          member.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {member.is_active ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditMember(member.id)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(member)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Phân trang */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === 1 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Trước
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === totalPages 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Sau
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Hiển thị <span className="font-medium">{filteredMembers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> đến <span className="font-medium">{Math.min(currentPage * pageSize, (currentPage - 1) * pageSize + filteredMembers.length)}</span> trong tổng số <span className="font-medium">{stats.totalMembers}</span> đoàn viên
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => {
                        setCurrentPage(prev => Math.max(prev - 1, 1));
                        setTimeout(() => fetchMembers(), 0);
                      }}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Trước</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {/* Hiển thị trang hiện tại và các trang lân cận */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageToShow = Math.min(
                        Math.max(currentPage - 2, 1) + i,
                        totalPages
                      );
                      
                      if (pageToShow <= 0 || pageToShow > totalPages) return null;
                      
                      return (
                        <button
                          key={pageToShow}
                          onClick={() => {
                            setCurrentPage(pageToShow);
                            setTimeout(() => fetchMembers(), 0);
                          }}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageToShow
                              ? 'z-10 bg-primary-50 border-primary-500 text-primary-600 hover:bg-primary-100'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageToShow}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => {
                        setCurrentPage(prev => Math.min(prev + 1, totalPages));
                        setTimeout(() => fetchMembers(), 0);
                      }}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Sau</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="bg-white shadow rounded-lg p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Thống kê chi tiết đoàn viên</h2>
          {/* Stats content goes here */}
        </div>
      )}
      
      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Xác nhận xóa</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Bạn có chắc chắn muốn xóa đoàn viên <strong>{selectedMember?.full_name}</strong>?
                  Hành động này không thể hoàn tác.
                </p>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  onClick={handleDeleteMember}
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersManagementPage; 