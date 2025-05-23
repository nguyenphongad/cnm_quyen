import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { registerForActivity } from '@/services/activityService';
import { Activity } from '@/types';

interface ActivityRegistrationFormProps {
  activity: Activity;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ActivityRegistrationForm: React.FC<ActivityRegistrationFormProps> = ({
  activity,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    reason: '',
    additionalInfo: '',
    phoneNumber: '',
    emergencyContact: '',
    hasRequirements: false,
    dietaryRequirements: '',
    agreement: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.reason.trim()) {
      newErrors.reason = 'Vui lòng cho biết lý do tham gia hoạt động';
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Vui lòng cung cấp số điện thoại liên hệ';
    } else if (!/^(\+84|84|0)[35789][0-9]{8}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Số điện thoại không hợp lệ';
    }
    
    if (!formData.agreement) {
      newErrors.agreement = 'Bạn cần đồng ý với các điều khoản và quy định';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Chuẩn bị dữ liệu đăng ký
      const registrationData = {
        reason: formData.reason,
        phoneNumber: formData.phoneNumber,
        emergencyContact: formData.emergencyContact || '',
        dietaryRequirements: formData.hasRequirements ? formData.dietaryRequirements : '',
        additionalInfo: formData.additionalInfo || ''
      };
      
      // Gọi API đăng ký tham gia hoạt động với thông tin bổ sung
      await registerForActivity(Number(activity.id), registrationData);
      
      // Đăng ký thành công
      setIsSuccess(true);
      setRegistrationStatus('Pending');
      
      // Thông báo thành công cho component cha
      onSuccess();
    } catch (error: any) {
      console.error('Error registering for activity:', error);
      
      // Ghi log chi tiết để debug
      console.log('Error details:', JSON.stringify(error));
      console.log('Error response:', error.response?.data);
      
      // Xử lý lỗi đã đăng ký trước đó
      if (error.response?.data) {
        const errorData = error.response.data;
        let errorMessage = errorData.detail || 'Có lỗi xảy ra khi đăng ký tham gia';
        const errorStatus = errorData.status || null;
        
        // Cập nhật trạng thái đăng ký
        setRegistrationStatus(errorStatus);
        
        // Hiển thị thông báo trạng thái cụ thể
        if (errorStatus === 'Pending' || errorStatus?.toLowerCase() === 'pending') {
          errorMessage = 'Bạn đã đăng ký tham gia hoạt động này và đang chờ phê duyệt.';
          // Đánh dấu là "thành công" để hiển thị UI thích hợp
          setIsSuccess(true);
        } else if (errorStatus === 'Approved' || errorStatus?.toLowerCase() === 'approved') {
          errorMessage = 'Bạn đã được phê duyệt tham gia hoạt động này.';
          setIsSuccess(true);
        } else if (errorStatus === 'Attended' || errorStatus?.toLowerCase() === 'attended') {
          errorMessage = 'Bạn đã tham gia hoạt động này trước đó.';
          setIsSuccess(true);
        }
        
        setErrors({
          submit: errorMessage
        });
      } else {
        setRegistrationStatus(null);
        setIsSuccess(false);
        setErrors({
          submit: error.message || 'Có lỗi xảy ra khi đăng ký tham gia. Vui lòng thử lại sau.'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Hiển thị thông tin trạng thái sau khi đăng ký hoặc đã đăng ký
  const renderStatusInfo = () => {
    if (!isSuccess || !registrationStatus) return null;
    
    let statusText = '';
    let statusClass = '';
    
    if (registrationStatus === 'Pending') {
      statusText = 'Đang chờ phê duyệt';
      statusClass = 'bg-yellow-100 text-yellow-800';
    } else if (registrationStatus === 'Approved') {
      statusText = 'Đã được phê duyệt';
      statusClass = 'bg-green-100 text-green-800';
    } else if (registrationStatus === 'Attended') {
      statusText = 'Đã tham gia';
      statusClass = 'bg-blue-100 text-blue-800';
    } else if (registrationStatus === 'Cancelled') {
      statusText = 'Đã hủy';
      statusClass = 'bg-gray-100 text-gray-800';
    }
    
    return (
      <div className="mb-4 mt-2 text-center">
        <div className={`inline-flex items-center px-3 py-2 rounded-full ${statusClass}`}>
          <span className="font-medium">{statusText}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 overflow-y-auto z-50">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Đăng ký tham gia hoạt động
              </h3>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-900">{activity.title}</h4>
              <p className="text-sm text-gray-500">
                Thời gian: {new Date(activity.start_date).toLocaleDateString()} - {new Date(activity.end_date).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">
                Địa điểm: {activity.location}
              </p>
            </div>
            
            {renderStatusInfo()}
            
            <form onSubmit={handleSubmit}>
              {errors.submit && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                  {errors.submit}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                    Lý do tham gia <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    rows={3}
                    disabled={isSuccess}
                    className={`mt-1 block w-full border rounded-md shadow-sm ${errors.reason ? 'border-red-500' : 'border-gray-300'} ${isSuccess ? 'bg-gray-100' : ''}`}
                    placeholder="Chia sẻ lý do bạn muốn tham gia hoạt động này"
                  />
                  {errors.reason && <p className="mt-1 text-sm text-red-500">{errors.reason}</p>}
                </div>
                
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                    Số điện thoại liên hệ <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="text"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    disabled={isSuccess}
                    className={`mt-1 block w-full border rounded-md shadow-sm ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'} ${isSuccess ? 'bg-gray-100' : ''}`}
                    placeholder="Nhập số điện thoại"
                  />
                  {errors.phoneNumber && <p className="mt-1 text-sm text-red-500">{errors.phoneNumber}</p>}
                </div>
                
                <div>
                  <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700">
                    Người liên hệ khẩn cấp
                  </label>
                  <input
                    id="emergencyContact"
                    name="emergencyContact"
                    type="text"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    disabled={isSuccess}
                    className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm ${isSuccess ? 'bg-gray-100' : ''}`}
                    placeholder="Tên và số điện thoại"
                  />
                </div>
                
                <div>
                  <div className="flex items-center">
                    <input
                      id="hasRequirements"
                      name="hasRequirements"
                      type="checkbox"
                      checked={formData.hasRequirements}
                      onChange={handleChange}
                      disabled={isSuccess}
                      className={`h-4 w-4 text-primary-600 border-gray-300 rounded ${isSuccess ? 'opacity-70' : ''}`}
                    />
                    <label htmlFor="hasRequirements" className="ml-2 block text-sm font-medium text-gray-700">
                      Tôi có yêu cầu đặc biệt (ăn kiêng, y tế, v.v.)
                    </label>
                  </div>
                </div>
                
                {formData.hasRequirements && (
                  <div>
                    <label htmlFor="dietaryRequirements" className="block text-sm font-medium text-gray-700">
                      Chi tiết yêu cầu đặc biệt
                    </label>
                    <textarea
                      id="dietaryRequirements"
                      name="dietaryRequirements"
                      value={formData.dietaryRequirements}
                      onChange={handleChange}
                      rows={2}
                      disabled={isSuccess}
                      className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm ${isSuccess ? 'bg-gray-100' : ''}`}
                      placeholder="Mô tả chi tiết yêu cầu đặc biệt của bạn"
                    />
                  </div>
                )}
                
                <div>
                  <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700">
                    Thông tin bổ sung
                  </label>
                  <textarea
                    id="additionalInfo"
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleChange}
                    rows={2}
                    disabled={isSuccess}
                    className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm ${isSuccess ? 'bg-gray-100' : ''}`}
                    placeholder="Thông tin bổ sung khác (nếu có)"
                  />
                </div>
                
                {!isSuccess && (
                  <div>
                    <div className="flex items-start">
                      <input
                        id="agreement"
                        name="agreement"
                        type="checkbox"
                        checked={formData.agreement}
                        onChange={handleChange}
                        className={`h-4 w-4 mt-1 text-primary-600 border-gray-300 rounded ${errors.agreement ? 'border-red-500' : ''}`}
                      />
                      <label htmlFor="agreement" className="ml-2 block text-sm text-gray-700">
                        Tôi xác nhận thông tin trên là chính xác và đồng ý tuân thủ các quy định của hoạt động. <span className="text-red-500">*</span>
                      </label>
                    </div>
                    {errors.agreement && <p className="mt-1 text-sm text-red-500">{errors.agreement}</p>}
                  </div>
                )}
              </div>
              
              <div className="mt-6 sm:flex sm:flex-row-reverse">
                {!isSuccess ? (
                  <>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto sm:ml-3"
                    >
                      {isSubmitting ? 'Đang xử lý...' : 'Đăng ký tham gia'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      onClick={onClose}
                      className="mt-3 w-full sm:mt-0 sm:w-auto"
                    >
                      Hủy
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={onClose}
                    className="w-full sm:w-auto"
                  >
                    Đóng
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityRegistrationForm; 