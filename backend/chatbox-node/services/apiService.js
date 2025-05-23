import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// Cấu hình API
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000/api';
let authToken = null;

// Hàm để đăng nhập và lấy token
const authenticate = async () => {
    try {

        console.log("API_BASE_URL : ", API_BASE_URL);

        const response = await axios.post(`${API_BASE_URL}token/`, {
            username: process.env.API_USERNAME,
            password: process.env.API_PASSWORD
        });

        // console.log("response api service log: ", response);

        authToken = response.data.access;
        console.log('Đã xác thực API thành công');
        return authToken;
    } catch (error) {


        console.error('Lỗi xác thực:', error.message);
        throw new Error('Không thể xác thực với API');
    }
};

// Hàm để gọi API với token
const callAPI = async (endpoint, method = 'GET', params = {}, data = null) => {
    // Đảm bảo có token
    if (!authToken) {
        await authenticate();
    }

    try {
        const config = {
            method: method,
            url: `${API_BASE_URL}${endpoint}`,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            params: params
        };

        if (data) {
            config.data = data;
        }
        

        const response = await axios(config);

        console.log("response api service log: ", response.data);

        return response.data;
    } catch (error) {
        // Nếu token hết hạn, thử xác thực lại
        if (error.response && error.response.status === 401) {
            authToken = null;
            await authenticate();
            return callAPI(endpoint, method, params, data); // Gọi lại API sau khi xác thực
        }

        console.error(`Lỗi gọi API ${endpoint}:`, error.message);
        throw error;
    }
};

// Các hàm truy vấn dữ liệu cụ thể
export const getActivities = async (page = 1, pageSize = 10) => {
    return callAPI('activities/', 'GET', { page, page_size: pageSize });
};

export const getActivityById = async (activityId) => {
    return callAPI(`activities/${activityId}/`);
};

// export const getMembers = async (page = 1, pageSize = 10, filters = {}) => {
//     return callAPI('/members/', 'GET', { page, page_size: pageSize, ...filters });
// };

// export const getEvents = async (page = 1, pageSize = 10) => {
//     return callAPI('/events/', 'GET', { page, page_size: pageSize });
// };

// export const getPosts = async (page = 1, pageSize = 10) => {
//     return callAPI('/posts/', 'GET', { page, page_size: pageSize });
// };

// Xuất các hàm
export default {
    getActivities,
    getActivityById,
    // getMembers,
    // getEvents,
    // getPosts,
    callAPI // Export phương thức chung để có thể gọi bất kỳ API nào
};