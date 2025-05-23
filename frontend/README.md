# Frontend cho Ứng dụng Quản lý Đoàn viên và Hoạt động

Đây là phần Frontend cho ứng dụng Quản lý Đoàn viên và Hoạt động, được xây dựng bằng ReactJS, TypeScript, và Tailwind CSS.

## Công nghệ sử dụng

- ReactJS với TypeScript
- Vite làm build tool
- Tailwind CSS cho styling
- Axios để gọi API
- React Router DOM cho routing
- JWT cho authentication

## Cài đặt

### Yêu cầu hệ thống

- Node.js (phiên bản 14.x trở lên)
- npm hoặc yarn

### Các bước cài đặt

1. Clone repository về máy (nếu chưa có)

2. Di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```

3. Cài đặt các dependencies:
   ```bash
   npm install
   # hoặc
   yarn install
   ```

4. Tạo file `.env` trong thư mục gốc của `frontend/` với nội dung:
   ```
   VITE_API_URL=http://localhost:8000/api
   ```

## Chạy ứng dụng

### Development

```bash
npm run dev
# hoặc
yarn dev
```

Ứng dụng sẽ chạy ở địa chỉ [http://localhost:3000](http://localhost:3000).

### Production

```bash
npm run build
# hoặc
yarn build
```

Sau khi build, các file tĩnh sẽ được tạo trong thư mục `dist/`.

## Cấu trúc dự án 

## Sử dụng với Docker

### Yêu cầu
- Docker và Docker Compose đã được cài đặt

### Các bước thực hiện
1. Xây dựng và khởi động container:
   ```
   docker-compose up --build
   ```

2. Truy cập ứng dụng tại:
   ```
   http://localhost:3000
   ```

3. Để chạy ở chế độ nền:
   ```
   docker-compose up -d
   ```

4. Để dừng container:
   ```
   docker-compose down
   ```

### Chạy toàn bộ ứng dụng (Frontend + Backend)
Để chạy cả frontend và backend cùng một lúc, vào thư mục gốc của dự án và chạy:
```
docker-compose up --build
```

### Lưu ý quan trọng
- File .env đã được cấu hình để kết nối với API backend tại `http://localhost:8000/api`
- Khi chạy riêng frontend, cần đảm bảo backend đã được khởi động trước 