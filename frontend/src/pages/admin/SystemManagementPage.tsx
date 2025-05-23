import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  ServerIcon,
  CogIcon,
  ClockIcon,
  BeakerIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  CalendarIcon,
  AdjustmentsHorizontalIcon,
  Cog6ToothIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/common/Button';
import { toast } from 'react-toastify';
import { 
  getAllSystemConfigs, 
  getSystemConfigsByGroup, 
  createSystemConfig, 
  updateSystemConfig, 
  deleteSystemConfig,
  SystemConfig
} from '@/services/systemService';

const SystemManagementPage = () => {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [filteredConfigs, setFilteredConfigs] = useState<SystemConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<SystemConfig | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    description: '',
    group: ''
  });
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setIsLoading(true);
    try {
      const response = await getAllSystemConfigs();
      console.log('Danh sách cấu hình từ API:', response);
      setConfigs(response);
      
      // Trích xuất các nhóm khác nhau từ cấu hình
      const groups = Array.from(new Set(response.map(config => config.group)));
      setAvailableGroups(groups);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching system configs:', error);
      toast.error('Không thể tải dữ liệu cấu hình từ server');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [search, groupFilter, configs]);

  const applyFilters = () => {
    let result = [...configs];
    
    // Lọc theo từ khóa tìm kiếm
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(config => 
        config.key.toLowerCase().includes(searchLower) || 
        config.value.toLowerCase().includes(searchLower) ||
        config.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Lọc theo nhóm
    if (groupFilter !== 'all') {
      result = result.filter(config => config.group === groupFilter);
    }
    
    setFilteredConfigs(result);
  };

  const handleCreateConfig = () => {
    setIsCreating(true);
    setFormData({
      key: '',
      value: '',
      description: '',
      group: availableGroups.length > 0 ? availableGroups[0] : 'general'
    });
    setShowEditModal(true);
  };

  const handleEditConfig = (config: SystemConfig) => {
    setIsCreating(false);
    setSelectedConfig(config);
    setFormData({
      key: config.key,
      value: config.value,
      description: config.description,
      group: config.group
    });
    setShowEditModal(true);
  };

  const handleSubmitForm = async () => {
    // Kiểm tra dữ liệu
    if (!formData.key || !formData.value) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      if (isCreating) {
        // Tạo cấu hình mới
        const newConfig = await createSystemConfig({
          key: formData.key,
          value: formData.value,
          description: formData.description,
          group: formData.group
        });
        
        setConfigs([...configs, newConfig]);
        toast.success('Tạo cấu hình thành công');
      } else if (selectedConfig) {
        // Cập nhật cấu hình hiện có
        const updatedConfig = await updateSystemConfig(selectedConfig.id, {
          key: formData.key,
          value: formData.value,
          description: formData.description,
          group: formData.group
        });
        
        const updatedConfigs = configs.map(config => 
          config.id === selectedConfig.id ? updatedConfig : config
        );
        setConfigs(updatedConfigs);
        toast.success('Cập nhật cấu hình thành công');
      }
      
      setShowEditModal(false);
    } catch (error) {
      console.error('Error saving system config:', error);
      toast.error('Không thể lưu cấu hình hệ thống');
    }
  };

  const openDeleteModal = (config: SystemConfig) => {
    setSelectedConfig(config);
    setShowDeleteModal(true);
  };

  const handleDeleteConfig = async () => {
    if (!selectedConfig) return;
    
    try {
      await deleteSystemConfig(selectedConfig.id);
      
      // Cập nhật state
      const updatedConfigs = configs.filter(c => c.id !== selectedConfig.id);
      setConfigs(updatedConfigs);
      
      toast.success('Xóa cấu hình thành công');
      setShowDeleteModal(false);
      setSelectedConfig(null);
    } catch (error) {
      console.error('Error deleting system config:', error);
      toast.error('Không thể xóa cấu hình');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGroupIcon = (group: string) => {
    switch (group) {
      case 'Hệ thống':
        return <ServerIcon className="h-5 w-5 text-gray-400" />;
      case 'Email':
        return <EnvelopeIcon className="h-5 w-5 text-gray-400" />;
      case 'Bảo mật':
        return <ShieldCheckIcon className="h-5 w-5 text-gray-400" />;
      case 'Hoạt động':
        return <CalendarIcon className="h-5 w-5 text-gray-400" />;
      case 'Lưu trữ':
        return <DocumentTextIcon className="h-5 w-5 text-gray-400" />;
      default:
        return <CogIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl font-bold text-gray-900">Quản lý cấu hình hệ thống</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý các tham số và cấu hình hoạt động của hệ thống
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={fetchConfigs}
            className="flex items-center justify-center bg-gray-100 text-gray-800 hover:bg-gray-200"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Làm mới
          </Button>
          <Button onClick={handleCreateConfig} className="flex items-center justify-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            Thêm cấu hình mới
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
              placeholder="Tên, giá trị hoặc mô tả"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="groupFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Nhóm cấu hình
            </label>
            <select
              id="groupFilter"
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
            >
              <option value="all">Tất cả nhóm</option>
              {availableGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Danh sách cấu hình */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredConfigs.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Khóa
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Giá trị
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Mô tả
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Nhóm
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
              {filteredConfigs.map((config) => (
                <tr key={config.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <AdjustmentsHorizontalIcon className="flex-shrink-0 h-5 w-5 text-blue-500 mr-3" />
                      <span className="text-sm font-medium text-gray-900">{config.key}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono bg-gray-100 p-1 rounded">
                      {config.value}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">{config.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <TagIcon className="h-3 w-3 mr-1" />
                      {config.group}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEditConfig(config)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Chỉnh sửa"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(config)}
                        className="text-red-600 hover:text-red-900"
                        title="Xóa cấu hình"
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
          <Cog6ToothIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Không tìm thấy cấu hình</h3>
          <p className="mt-1 text-sm text-gray-500">
            Không có cấu hình nào phù hợp với tiêu chí tìm kiếm.
          </p>
        </div>
      )}

      {/* Modal chỉnh sửa/tạo cấu hình */}
      {showEditModal && (
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
                    <Cog6ToothIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg font-medium text-gray-900">
                      {isCreating ? 'Thêm cấu hình mới' : 'Chỉnh sửa cấu hình'}
                    </h3>
                    <div className="mt-4 space-y-3">
                      <div>
                        <label htmlFor="configKey" className="block text-sm font-medium text-gray-700 mb-1">
                          Khóa cấu hình <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="configKey"
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Ví dụ: app.name, system.maintenance"
                          value={formData.key}
                          onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                          disabled={!isCreating} // Chỉ cho phép sửa key khi tạo mới
                        />
                      </div>
                      <div>
                        <label htmlFor="configValue" className="block text-sm font-medium text-gray-700 mb-1">
                          Giá trị <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="configValue"
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Nhập giá trị cấu hình"
                          value={formData.value}
                          onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                        />
                      </div>
                      <div>
                        <label htmlFor="configGroup" className="block text-sm font-medium text-gray-700 mb-1">
                          Nhóm cấu hình
                        </label>
                        <div className="flex space-x-2">
                          <select
                            id="configGroup"
                            className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            value={formData.group}
                            onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                          >
                            {availableGroups.length > 0 ? (
                              availableGroups.map((group) => (
                                <option key={group} value={group}>
                                  {group}
                                </option>
                              ))
                            ) : (
                              <option value="general">general</option>
                            )}
                            <option value="other">-- Nhóm khác --</option>
                          </select>
                          {formData.group === 'other' && (
                            <input
                              type="text"
                              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              placeholder="Tên nhóm mới"
                              onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                            />
                          )}
                        </div>
                      </div>
                      <div>
                        <label htmlFor="configDescription" className="block text-sm font-medium text-gray-700 mb-1">
                          Mô tả
                        </label>
                        <textarea
                          id="configDescription"
                          rows={3}
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Nhập mô tả về cấu hình"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  onClick={handleSubmitForm}
                >
                  {isCreating ? 'Tạo cấu hình' : 'Cập nhật'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowEditModal(false)}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal xóa cấu hình */}
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
                    <h3 className="text-lg font-medium text-gray-900">Xóa cấu hình</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Bạn có chắc chắn muốn xóa cấu hình "{selectedConfig?.key}"? Hành động này có thể ảnh hưởng đến hoạt động của hệ thống và không thể hoàn tác.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDeleteConfig}
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

export default SystemManagementPage; 