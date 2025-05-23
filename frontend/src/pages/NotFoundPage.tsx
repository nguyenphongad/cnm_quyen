import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-12">
      <h1 className="text-9xl font-bold text-youth">404</h1>
      <div className="absolute rotate-12 rounded-lg bg-youth px-2 text-sm text-white">
        Không tìm thấy trang
      </div>
      <div className="mt-5">
        <p className="text-gray-600 text-center text-xl mt-8 mb-8">
          Xin lỗi, trang bạn đang tìm kiếm không tồn tại.
        </p>
        <Link to="/" className="btn btn-primary w-full text-center">
          Trở về trang chủ
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage; 