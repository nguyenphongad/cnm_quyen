import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Post } from '@/types';
import api from '@/services/api';
import { toast } from 'react-toastify';

const PostDetailPage = () => {
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canEditPost, setCanEditPost] = useState(false);

  useEffect(() => {
    fetchPost();
  }, []);

  const fetchPost = async () => {
    setIsLoading(true);
    try {
      // Mô phỏng API call
      // const response = await api.get('/posts/1');
      // setPost(response.data);
      
      // Dữ liệu mẫu
      setTimeout(() => {
        setPost({
          id: 1,
          title: 'Bài viết mẫu',
          content: 'Nội dung bài viết mẫu',
          author: {
            id: 1,
            full_name: 'Nguyễn Văn A',
            email: 'nguyenvana@example.com'
          },
          created_at: '2024-04-01T10:00:00',
          updated_at: '2024-04-01T12:00:00',
          status: 'Published'
        });
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Lỗi khi tải bài viết:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <button
          onClick={() => navigate('/posts')}
          className="flex items-center text-primary-600 hover:text-primary-800"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Quay lại danh sách
        </button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
          <p className="mt-4 text-gray-500">Đang tải bài viết...</p>
        </div>
      ) : post ? (
        <div className="card">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
              
              {canEditPost && (
                <div className="flex space-x-2">
                  <button
                    className="p-2 text-gray-400 hover:text-primary-600 rounded-full hover:bg-gray-100"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between mb-6 text-sm">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                  {post.author.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="ml-2">
                  <span className="font-medium text-gray-900">{post.author.full_name}</span>
                  <div className="text-gray-500">{post.author.email}</div>
                </div>
              </div>
              
              <div className="text-right text-gray-500">
                <div>
                  Đăng lúc: {new Date(post.created_at).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                {post.updated_at !== post.created_at && (
                  <div>
                    Cập nhật: {new Date(post.updated_at).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}
              </div>
            </div>
            
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: post.content }}>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button className="flex items-center text-gray-500 hover:text-primary-600">
                    <svg className="h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                    </svg>
                    Tải xuống
                  </button>
                  <button className="flex items-center text-gray-500 hover:text-primary-600">
                    <svg className="h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                    </svg>
                    Chia sẻ
                  </button>
                </div>
                
                <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                    ${post.status === 'Published' ? 'bg-green-100 text-green-800' : 
                    post.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'}`}>
                    {post.status === 'Published' ? 'Đã đăng' : 
                    post.status === 'Draft' ? 'Bản nháp' : 'Đã xóa'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <p className="text-gray-500">Không tìm thấy bài viết</p>
          <button
            onClick={() => navigate('/posts')}
            className="mt-4 btn btn-primary"
          >
            Quay lại danh sách
          </button>
        </div>
      )}
    </div>
  );
};

export default PostDetailPage; 