import { useState, useEffect } from 'react';
import { Post, UserRole } from '@/types';
import { PlusIcon } from '@heroicons/react/24/outline';
import api from '@/services/api';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

const PostsPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const canCreatePost = user?.role === UserRole.ADMIN || user?.role === UserRole.CANBODOAN;

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      // Mô phỏng API call
      // const response = await api.get('/posts/');
      // setPosts(response.data);
      
      // Dữ liệu mẫu
      setTimeout(() => {
        setPosts([
          {
            id: 1,
            title: 'Thông báo về Đại hội Đoàn trường nhiệm kỳ 2023-2025',
            content: 'Đại hội Đoàn trường sẽ được tổ chức vào ngày 15/01/2024 tại Hội trường lớn...',
            created_at: '2023-12-05T10:00:00Z',
            updated_at: '2023-12-05T10:00:00Z',
            status: 'Published',
            author: {
              id: 1,
              full_name: 'Nguyễn Văn A',
              email: 'nguyenvana@example.com'
            }
          },
          {
            id: 2,
            title: 'Kết quả cuộc thi "Sinh viên với biển đảo quê hương"',
            content: 'Cuộc thi đã khép lại với sự tham gia nhiệt tình của các bạn sinh viên. Giải nhất thuộc về...',
            created_at: '2023-12-01T14:30:00Z',
            updated_at: '2023-12-02T09:15:00Z',
            status: 'Published',
            author: {
              id: 2,
              full_name: 'Trần Thị B',
              email: 'tranthib@example.com'
            }
          },
          {
            id: 3,
            title: 'Hướng dẫn đăng ký tham gia chương trình Xuân tình nguyện 2024',
            content: 'Các bạn sinh viên có thể đăng ký tham gia chương trình Xuân tình nguyện 2024 theo các bước sau...',
            created_at: '2023-11-28T08:45:00Z',
            updated_at: '2023-11-28T08:45:00Z',
            status: 'Published',
            author: {
              id: 1,
              full_name: 'Nguyễn Văn A',
              email: 'nguyenvana@example.com'
            }
          }
        ]);
        setIsLoading(false);
      }, 800);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Không thể tải bài viết');
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bài viết</h1>
        
        {canCreatePost && (
          <button
            type="button"
            className="btn btn-primary"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Tạo bài viết mới
          </button>
        )}
      </div>
      
      {isLoading ? (
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
          <p className="mt-4 text-gray-500">Đang tải bài viết...</p>
        </div>
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link 
              key={post.id} 
              to={`/posts/${post.id}`}
              className="card hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{post.title}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                    ${post.status === 'Published' ? 'bg-green-100 text-green-800' : 
                    post.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'}`}>
                    {post.status === 'Published' ? 'Đã đăng' : 
                    post.status === 'Draft' ? 'Bản nháp' : 'Đã xóa'}
                  </span>
                </div>
                
                <p className="mt-1 text-sm text-gray-500">{post.content}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Không có bài viết nào</h3>
          <p className="mt-1 text-sm text-gray-500">Bài viết mới sẽ xuất hiện ở đây.</p>
        </div>
      )}
    </div>
  );
};

export default PostsPage; 