import api from './api';
import { Post, PostStatus, PaginatedResponse } from '@/types';

export interface PostStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  deletedPosts: number;
}

/**
 * Lấy danh sách bài viết
 */
export const getPosts = async (
  page: number = 1,
  pageSize: number = 10,
  status?: string,
  search?: string
): Promise<PaginatedResponse<Post>> => {
  try {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());
    
    if (status) {
      params.append('status', status);
    }
    
    if (search) {
      params.append('search', search);
    }
    
    const response = await api.get(`/posts/?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

/**
 * Lấy thông tin một bài viết
 */
export const getPost = async (id: number): Promise<Post> => {
  try {
    const response = await api.get(`/posts/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching post ${id}:`, error);
    throw error;
  }
};

/**
 * Tạo bài viết mới
 */
export const createPost = async (postData: Partial<Post>): Promise<Post> => {
  try {
    const response = await api.post('/posts/', postData);
    return response.data;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

/**
 * Cập nhật thông tin bài viết
 */
export const updatePost = async (id: number, postData: Partial<Post>): Promise<Post> => {
  try {
    const response = await api.put(`/posts/${id}/`, postData);
    return response.data;
  } catch (error) {
    console.error(`Error updating post ${id}:`, error);
    throw error;
  }
};

/**
 * Xóa bài viết (chuyển trạng thái thành "Deleted")
 */
export const deletePost = async (id: number): Promise<void> => {
  try {
    await api.delete(`/posts/${id}/`);
  } catch (error) {
    console.error(`Error deleting post ${id}:`, error);
    throw error;
  }
};

/**
 * Khôi phục bài viết đã xóa
 */
export const restorePost = async (id: number): Promise<Post> => {
  try {
    const response = await api.post(`/posts/${id}/restore/`);
    return response.data;
  } catch (error) {
    console.error(`Error restoring post ${id}:`, error);
    throw error;
  }
};

/**
 * Xuất bản bài viết (chuyển trạng thái thành "Published")
 */
export const publishPost = async (id: number): Promise<Post> => {
  try {
    const response = await api.post(`/posts/${id}/publish/`);
    return response.data;
  } catch (error) {
    console.error(`Error publishing post ${id}:`, error);
    throw error;
  }
};

/**
 * Lấy thống kê bài viết
 */
export const getPostStats = async (): Promise<PostStats> => {
  try {
    const response = await api.get('/posts/stats/');
    return response.data;
  } catch (error) {
    console.error('Error fetching post stats:', error);
    throw error;
  }
};

/**
 * Tìm kiếm bài viết
 */
export const searchPosts = async (
  query: string,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<Post>> => {
  try {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());
    params.append('search', query);
    
    const response = await api.get(`/posts/search/?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error(`Error searching posts with query "${query}":`, error);
    throw error;
  }
};

export default {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  restorePost,
  publishPost,
  getPostStats,
  searchPosts
}; 