# Backend cho Ứng dụng Quản lý Đoàn viên và Hoạt động

Backend này cung cấp các API cho ứng dụng quản lý đoàn viên và hoạt động, được xây dựng bằng Django và Django REST Framework.

## Công nghệ sử dụng

- Django (Python)
- Django REST Framework
- JWT Authentication
- PostgreSQL
- Swagger (drf-yasg)

## Cài đặt

### Yêu cầu hệ thống

- Python 3.8+ 
- PostgreSQL

### Các bước cài đặt

1. **Tạo và kích hoạt môi trường ảo**:
   
   ```bash
   # Tạo môi trường ảo
   python -m venv venv
   
   # Kích hoạt môi trường ảo
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```

2. **Cài đặt các gói phụ thuộc**:
   
   ```bash
   pip install -r requirements.txt
   ```

3. **Tạo file .env**:
   
   Tạo một file `.env` trong thư mục gốc của dự án với các biến môi trường sau:
   
   ```
   SECRET_KEY=your-secret-key
   DEBUG=True
   DATABASE_NAME=quanlydoanvien_db
   DATABASE_USER=postgres
   DATABASE_PASSWORD=postgres
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   ```

4. **Tạo cơ sở dữ liệu PostgreSQL**:
   
   Đảm bảo PostgreSQL đã được cài đặt và đang chạy. Sau đó tạo database:
   
   ```sql
   CREATE DATABASE quanlydoanvien_db;
   ```

5. **Chạy migration để tạo cấu trúc cơ sở dữ liệu**:
   
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Tạo tài khoản admin**:
   
   ```bash
   python manage.py createsuperuser
   ```
   
   Làm theo hướng dẫn trên màn hình để tạo tài khoản admin.

7. **Chạy server**:
   
   ```bash
   python manage.py runserver
   ```
   
   Server sẽ chạy tại địa chỉ [http://127.0.0.1:8000/](http://127.0.0.1:8000/).

## Docker Setup

### Prerequisites
- Docker and Docker Compose installed on your machine

### Running with Docker
1. Build and start the containers:
   ```
   docker-compose up --build
   ```

2. For running in detached mode:
   ```
   docker-compose up -d
   ```

3. To stop the containers:
   ```
   docker-compose down
   ```

### Docker Commands
- View running containers:
  ```
  docker ps
  ```

- Execute commands in the container:
  ```
  docker-compose exec backend python manage.py createsuperuser
  ```

- View logs:
  ```
  docker-compose logs -f backend
  ```

## API Endpoints

Sau khi chạy server, bạn có thể truy cập Swagger UI để xem tài liệu API đầy đủ:

- Swagger UI: [http://127.0.0.1:8000/swagger/](http://127.0.0.1:8000/swagger/)
- ReDoc: [http://127.0.0.1:8000/redoc/](http://127.0.0.1:8000/redoc/)

### Các endpoint chính:

- **/api/token/**: Đăng nhập và nhận JWT token
- **/api/token/refresh/**: Làm mới JWT token
- **/api/users/**: Quản lý người dùng
- **/api/posts/**: Quản lý bài đăng
- **/api/activities/**: Quản lý hoạt động
- **/api/work-schedules/**: Quản lý lịch công tác
- **/api/activity-registrations/**: Quản lý đăng ký hoạt động
- **/api/notifications/**: Quản lý thông báo
- **/api/permissions/**: Quản lý phân quyền

## Vai trò và quyền hạn

- **Admin**: Có toàn quyền trên hệ thống, có thể phân quyền và quản lý mọi đối tượng.
- **Cán bộ đoàn**: Có thể quản lý đoàn viên, bài đăng, hoạt động, lịch công tác.
- **Đoàn viên**: Có thể xem thông tin, đăng ký hoạt động, xem thông báo và lịch công tác.

## Chạy kiểm thử

```bash
python manage.py test
```

## Giải thích chi tiết về mã nguồn:

### 1. Cấu trúc dự án

Dự án được tổ chức theo cấu trúc chuẩn của Django, với một ứng dụng chính là `core` chứa tất cả các models, views, serializers và URLs.

### 2. Models

- **User**: Mô hình người dùng tùy chỉnh kế thừa từ `AbstractBaseUser` để có thể định nghĩa vai trò (Admin, Cán bộ đoàn, Đoàn viên).
- **Post**: Mô hình bài đăng với các trường như tiêu đề, nội dung, trạng thái.
- **Activity**: Mô hình hoạt động với các trường như tiêu đề, mô tả, ngày bắt đầu, ngày kết thúc, trạng thái.
- **WorkSchedule**: Mô hình lịch công tác.
- **ActivityRegistration**: Mô hình đăng ký tham gia hoạt động.
- **Notification**: Mô hình thông báo.
- **Permission**: Mô hình phân quyền.

### 3. Serializers

Các serializers được tạo để chuyển đổi giữa các đối tượng Python và JSON/XML, phục vụ cho API.

### 4. Views

Sử dụng ViewSet để cung cấp các thao tác CRUD tiêu chuẩn cho mỗi mô hình. Bổ sung thêm các hành động tùy chỉnh như `search` hoặc `mark_read`.

### 5. Permissions

Hệ thống phân quyền được định nghĩa để bảo vệ các API endpoint dựa trên vai trò của người dùng.

### 6. URLs

Đường dẫn API được tạo tự động thông qua Router của Django REST Framework.

### 7. Xác thực

Sử dụng JWT (JSON Web Tokens) thông qua `djangorestframework-simplejwt` cho xác thực người dùng.

### 8. Tài liệu API

Swagger UI được tích hợp thông qua `drf-yasg` để cung cấp tài liệu API tương tác.

### 9. Testing

Các unit tests cơ bản được cung cấp để kiểm tra chức năng của API.

### 10. Admin Interface

Django Admin được tùy chỉnh để quản lý dữ liệu một cách trực quan.

## Thông tin thêm

Backend này đã được thiết kế để đáp ứng đầy đủ các yêu cầu được mô tả trong ERD và Use Case. Cấu trúc mã nguồn tuân thủ các nguyên tắc thiết kế phổ biến của Django và cung cấp một API RESTful hoàn chỉnh, dễ mở rộng và bảo trì. 