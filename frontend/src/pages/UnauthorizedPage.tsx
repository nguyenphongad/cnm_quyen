import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-12">
      <div className="text-youth mb-4">
        <ShieldExclamationIcon className="h-24 w-24" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 text-center">Không có quyền truy cập</h1>
      <p className="text-gray-600 text-center text-lg mt-4 mb-8">
        Bạn không có quyền để truy cập trang này.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <Link to="/" className="btn btn-primary text-center flex-1">
          Về trang chủ
        </Link>
        <button 
          onClick={() => navigate(-1)} 
          className="btn btn-secondary text-center flex-1"
        >
          Quay lại
        </button>
      </div>
    </div>
  );
};

export default UnauthorizedPage; 