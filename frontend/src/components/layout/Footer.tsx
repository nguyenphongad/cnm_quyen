const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-4">
      <div className="container mx-auto px-4">
        <div className="text-center text-sm text-gray-600">
          <p>Hệ thống Quản lý Đoàn viên và Hoạt động © {new Date().getFullYear()}</p>
          <p>Đoàn Thanh niên Cộng sản Hồ Chí Minh - Trường Đại học XYZ</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 