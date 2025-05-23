import apiService from './apiService.js';

// Cache dữ liệu
const cache = {
    activities: { data: null, timestamp: 0 },
    members: { data: null, timestamp: 0 },
    posts: { data: null, timestamp: 0 }
};

// Thời gian cache hết hạn (1 giờ)
const CACHE_EXPIRY = 60 * 60 * 1000;

// Hàm lấy dữ liệu từ cache hoặc API
export const getActivitiesData = async (forceRefresh = false) => {
    const now = Date.now();

    if (forceRefresh || !cache.activities.data || (now - cache.activities.timestamp) > CACHE_EXPIRY) {
        try {
            const data = await apiService.getActivities(1, 50);
            cache.activities = { data, timestamp: now };
        } catch (error) {
            // console.error('Lỗi khi cập nhật cache hoạt động:', error);
            if (!cache.activities.data) throw error; // Nếu không có dữ liệu cũ, ném lỗi
        }
    }

    return cache.activities.data;
};

// export const getMembersData = async (forceRefresh = false) => {
//     const now = Date.now();

//     if (forceRefresh || !cache.members.data || (now - cache.members.timestamp) > CACHE_EXPIRY) {
//         try {
//             const data = await apiService.getMembers(1, 100);
//             cache.members = { data, timestamp: now };
//         } catch (error) {
//             // console.error('Lỗi khi cập nhật cache thành viên:', error);
//             if (!cache.members.data) throw error;
//         }
//     }

//     return cache.members.data;
// };

// export const getPostsData = async (forceRefresh = false) => {
//     const now = Date.now();

//     if (forceRefresh || !cache.posts.data || (now - cache.posts.timestamp) > CACHE_EXPIRY) {
//         try {
//             const data = await apiService.getPosts(1, 20);
//             cache.posts = { data, timestamp: now };
//         } catch (error) {
//             // console.error('Lỗi khi cập nhật cache bài viết:', error);
//             if (!cache.posts.data) throw error;
//         }
//     }

//     return cache.posts.data;
// };

// // Cập nhật tất cả cache
export const refreshAllCaches = async () => {
    try {
        const ref = await Promise.all([
            getActivitiesData(true),
            // getMembersData(true),
            // getPostsData(true)
        ]);


        console.log("ref abc : ", ref);

        console.log('Đã cập nhật tất cả cache dữ liệu');
        return true;
    } catch (error) {
        console.error('Lỗi khi cập nhật cache:', error);
        return false;
    }
};

// // Thiết lập cập nhật tự động
export const setupAutomaticRefresh = (intervalMinutes = 60) => {
    console.log(`Thiết lập cập nhật cache tự động mỗi ${intervalMinutes} phút`);

    // Cập nhật lần đầu
    refreshAllCaches();

    // Thiết lập interval
    const intervalMs = intervalMinutes * 60 * 1000;
    const intervalId = setInterval(refreshAllCaches, intervalMs);

    return intervalId; // Trả về ID để có thể hủy nếu cần
};

export default {
    getActivitiesData,
    // getMembersData,
    // getPostsData,
    // refreshAllCaches,
    // setupAutomaticRefresh
};