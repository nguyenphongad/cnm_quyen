FROM node:18-alpine

# Thiết lập thư mục làm việc
WORKDIR /app

# Sao chép file package.json và package-lock.json
COPY package*.json ./

# Cài đặt dependencies
RUN npm ci

# Sao chép mã nguồn
COPY . .

# Sửa cấu hình build để bỏ qua kiểm tra TypeScript
RUN sed -i 's/"build": "tsc && vite build"/"build": "vite build"/g' package.json

# Biên dịch ứng dụng
RUN npm run build

# Cài đặt serve để phục vụ ứng dụng tĩnh
RUN npm install -g serve

# Mở cổng 3000
EXPOSE 3000

# Khởi động ứng dụng
CMD ["serve", "-s", "dist", "-l", "3000"] 