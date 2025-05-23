import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, MemberData } from '@/types';
import { getMemberBook } from '@/services/memberService';

const MemberBookPage: React.FC = () => {
  const { user } = useAuth();
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [activeTab, setActiveTab] = useState('thong-tin');
  const [isLoading, setIsLoading] = useState(true);

  // Lấy dữ liệu đoàn viên từ API
  useEffect(() => {
    const fetchMemberData = async () => {
      setIsLoading(true);
      try {
        // Sử dụng service thay vì trực tiếp dùng api
        const data = await getMemberBook();
        setMemberData(data);
      } catch (error) {
        console.error('Error fetching member data:', error);
        // Không sử dụng dữ liệu mẫu nữa, hiển thị thông báo lỗi
        alert('Không thể tải dữ liệu sổ đoàn viên. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMemberData();
  }, [user]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Tính số năm tham gia đoàn
  const calculateYearsInUnion = (joinDate: string) => {
    const joinDateObj = new Date(joinDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - joinDateObj.getTime());
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(diffYears);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!memberData) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500">Không thể tải dữ liệu sổ đoàn viên. Vui lòng thử lại sau.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Sổ Đoàn Viên</h1>

      {/* Thẻ Đoàn */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="p-6 flex flex-col md:flex-row">
          <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
            <div className="h-32 w-32 rounded-full bg-white border-4 border-white overflow-hidden flex items-center justify-center">
              {memberData.avatar ? (
                <img 
                  src={memberData.avatar} 
                  alt={memberData.full_name} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-blue-500">
                  {memberData.full_name.charAt(0)}
                </span>
              )}
            </div>
          </div>
          <div className="flex-grow text-white">
            <h2 className="text-2xl font-bold mb-2">{memberData.full_name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
              <div>
                <p className="text-blue-100">MSSV: <span className="font-medium text-white">{memberData.student_id}</span></p>
                <p className="text-blue-100">Khoa: <span className="font-medium text-white">{memberData.department}</span></p>
                <p className="text-blue-100">Chức vụ: <span className="font-medium text-white">{memberData.position}</span></p>
              </div>
              <div>
                <p className="text-blue-100">Ngày vào Đoàn: <span className="font-medium text-white">{formatDate(memberData.member_since)}</span></p>
                <p className="text-blue-100">Số năm trong Đoàn: <span className="font-medium text-white">{calculateYearsInUnion(memberData.member_since)} năm</span></p>
                <p className="text-blue-100">Xếp loại: <span className="font-medium text-white">{memberData.stats.rank}</span></p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-blue-900 px-6 py-3">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-blue-100 text-sm">Hoạt động tham gia</p>
              <p className="text-white font-bold text-xl">{memberData.stats.total_activities}</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Điểm rèn luyện</p>
              <p className="text-white font-bold text-xl">{memberData.stats.total_points}</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Tỷ lệ tham gia</p>
              <p className="text-white font-bold text-xl">{memberData.stats.attendance_rate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('thong-tin')}
            className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${
              activeTab === 'thong-tin'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Thông tin cá nhân
          </button>
          <button
            onClick={() => setActiveTab('hoat-dong')}
            className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${
              activeTab === 'hoat-dong'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Hoạt động tham gia
          </button>
          <button
            onClick={() => setActiveTab('thanh-tich')}
            className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${
              activeTab === 'thanh-tich'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Thành tích
          </button>
          <button
            onClick={() => setActiveTab('doan-phi')}
            className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${
              activeTab === 'doan-phi'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Đoàn phí
          </button>
        </nav>
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Thông tin cá nhân */}
        {activeTab === 'thong-tin' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin cá nhân</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Họ và tên</p>
                  <p className="font-medium">{memberData.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">MSSV</p>
                  <p className="font-medium">{memberData.student_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Khoa/Ngành</p>
                  <p className="font-medium">{memberData.department}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Chức vụ</p>
                  <p className="font-medium">{memberData.position}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ngày vào Đoàn</p>
                  <p className="font-medium">{formatDate(memberData.member_since)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Số năm trong Đoàn</p>
                  <p className="font-medium">{calculateYearsInUnion(memberData.member_since)} năm</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Tổng kết hoạt động</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm">Tổng số hoạt động tham gia</p>
                  <p className="text-2xl font-bold text-blue-600">{memberData.stats.total_activities}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm">Tổng điểm rèn luyện</p>
                  <p className="text-2xl font-bold text-green-600">{memberData.stats.total_points}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm">Tỷ lệ tham gia</p>
                  <p className="text-2xl font-bold text-purple-600">{memberData.stats.attendance_rate}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hoạt động tham gia */}
        {activeTab === 'hoat-dong' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Hoạt động tham gia</h3>
              <div className="text-sm text-gray-500">
                Tổng số: <span className="font-medium">{memberData.activities.length}</span>
              </div>
            </div>
            
            {memberData.activities.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên hoạt động</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tham gia</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {memberData.activities.map((activity, index) => (
                      <tr key={activity.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{activity.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(activity.date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                            ${activity.type === 'Tình nguyện' ? 'bg-green-100 text-green-800' : 
                              activity.type === 'Học tập' ? 'bg-blue-100 text-blue-800' : 
                              'bg-purple-100 text-purple-800'}`}>
                            {activity.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                            ${activity.status === 'Hoàn thành' ? 'bg-green-100 text-green-800' : 
                              activity.status === 'Đang diễn ra' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'}`}>
                            {activity.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{activity.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Bạn chưa tham gia hoạt động nào. Hãy tìm kiếm các hoạt động đoàn tại trang Hoạt động.
              </div>
            )}
          </div>
        )}

        {/* Thành tích */}
        {activeTab === 'thanh-tich' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Thành tích</h3>
            
            {memberData.achievements.length > 0 ? (
              <div className="space-y-4">
                {memberData.achievements.map(achievement => (
                  <div key={achievement.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between">
                      <h4 className="font-medium text-lg text-blue-600">{achievement.title}</h4>
                      <span className="text-sm text-gray-500">{formatDate(achievement.date)}</span>
                    </div>
                    <p className="mt-2 text-gray-600">{achievement.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Bạn chưa có thành tích nào được ghi nhận. Hãy tham gia nhiều hoạt động hơn để đạt được thành tích!
              </div>
            )}
          </div>
        )}

        {/* Đoàn phí */}
        {activeTab === 'doan-phi' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Đoàn phí</h3>
            
            {memberData.union_fee_status.length > 0 ? (
              <div className="space-y-6">
                {memberData.union_fee_status.map(yearData => (
                  <div key={yearData.year} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                      <h4 className="font-medium">Năm {yearData.year}</h4>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {yearData.quarters.map(quarter => (
                          <div 
                            key={quarter.quarter} 
                            className={`border rounded-lg p-4 text-center ${
                              quarter.paid 
                                ? 'border-green-200 bg-green-50' 
                                : 'border-red-200 bg-red-50'
                            }`}
                          >
                            <p className="text-sm text-gray-600">Quý {quarter.quarter}</p>
                            <p className={`font-medium ${
                              quarter.paid 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {quarter.paid ? 'Đã đóng' : 'Chưa đóng'}
                            </p>
                            {quarter.paid && quarter.date_paid && (
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(quarter.date_paid)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Không có thông tin đoàn phí.
              </div>
            )}
            
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-700 mb-2">Thông tin đóng đoàn phí</h4>
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                <li>Đoàn phí: 5.000 đồng/tháng (15.000 đồng/quý)</li>
                <li>Thời hạn đóng: Trước ngày 15 của tháng đầu tiên mỗi quý</li>
                <li>Phương thức đóng: Chuyển khoản hoặc nộp trực tiếp tại Văn phòng Đoàn trường</li>
                <li>Thông tin chuyển khoản:
                  <ul className="list-none ml-4 mt-1">
                    <li>Tên TK: Đoàn Trường Đại học XYZ</li>
                    <li>Số TK: 1234567890</li>
                    <li>Ngân hàng: Vietcombank</li>
                    <li>Nội dung: [MSSV] - Đoàn phí Q[số quý]/[năm]</li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberBookPage; 