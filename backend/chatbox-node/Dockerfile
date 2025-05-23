FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Thêm các biến môi trường mặc định
ENV PORT=9999
ENV NODE_ENV=production
ENV API_BASE_URL=http://backend:8000/api

EXPOSE 9999

CMD ["node", "app.js"]