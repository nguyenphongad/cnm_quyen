import apiService from './apiService.js';
import { askGemini } from './geminiService.js';

// Hàm phân tích yêu cầu của người dùng
export const analyzeQuery = async (userQuery) => {
    try {
        // Dùng Gemini để phân loại truy vấn
        const prompt = `
    Phân tích câu hỏi sau và trả về một đối tượng JSON có cấu trúc như sau (chỉ trả về JSON thuần):
    {
      "queryType": "ACTIVITIES|GENERAL",
      "intent": "Mô tả ngắn về ý định của người dùng",
      "params": {
        "page": 1,
        "pageSize": 10,
        "filters": {}
      },
      "needData": true|false
    }
    
    Nếu câu hỏi cần truy xuất dữ liệu, đặt needData là true.
    Chú ý: KHÔNG bao gồm dấu backticks hoặc định dạng markdown. Chỉ trả về JSON thuần.
    
    Câu hỏi: "${userQuery}"
    `;

        const analysisResult = await askGemini(prompt);
        let parsedResult;
        
        // Loại bỏ markdown và các ký tự không cần thiết trước khi parse JSON
        let cleanResult = analysisResult
            .replace(/```json/g, '')   // Xóa ```json
            .replace(/```/g, '')        // Xóa ```
            .trim();                    // Xóa khoảng trắng thừa
            
        console.log('JSON được làm sạch:', cleanResult);
        
        try {
            parsedResult = JSON.parse(cleanResult);
        } catch (e) {
            console.error("Lỗi phân tích JSON:", e);
            console.log("JSON gốc:", analysisResult);
            
            // Thử trích xuất nội dung JSON bằng regex
            const jsonRegex = /{[\s\S]*?}/;
            const match = analysisResult.match(jsonRegex);
            
            if (match && match[0]) {
                try {
                    parsedResult = JSON.parse(match[0]);
                } catch (innerError) {
                    console.error("Thử lần 2 vẫn lỗi:", innerError);
                    
                    // Fallback khi tất cả cách thử đều thất bại
                    parsedResult = {
                        queryType: "ACTIVITIES",
                        intent: "Truy vấn mặc định về hoạt động",
                        params: { page: 1, pageSize: 10, filters: {} },
                        needData: true
                    };
                }
            } else {
                // Fallback khi không tìm thấy JSON
                parsedResult = {
                    queryType: "ACTIVITIES",
                    intent: "Truy vấn mặc định về hoạt động",
                    params: { page: 1, pageSize: 10, filters: {} },
                    needData: true
                };
            }
        }

        return parsedResult;
    } catch (error) {
        console.error("Lỗi khi phân tích truy vấn:", error);
        return {
            queryType: "ACTIVITIES",
            intent: "Truy vấn mặc định về hoạt động",
            params: { page: 1, pageSize: 10, filters: {} },
            needData: true
        };
    }
};

// Hàm thực hiện truy vấn dựa trên phân tích
export const executeQuery = async (queryAnalysis) => {
    try {
        let data = null;

        if (queryAnalysis.needData) {
            const { page, pageSize, filters } = queryAnalysis.params;

            switch (queryAnalysis.queryType) {
                case 'ACTIVITIES':
                    data = await apiService.getActivities(page, pageSize);
                    break;
                case 'MEMBERS':
                    data = await apiService.getMembers(page, pageSize, filters);
                    break;
                case 'POSTS':
                    data = await apiService.getPosts(page, pageSize);
                    break;
                case 'STATISTICS':
                    // Gọi API thống kê hoặc tổng hợp từ nhiều API
                    const activities = await apiService.getActivities(1, 5);
                    const members = await apiService.getMembers(1, 5);
                    data = { activities, members, summary: { total: activities.count } };
                    break;
                default:
                    // Truy vấn không xác định, không cần dữ liệu
                    break;
            }
        }

        return data;
    } catch (error) {
        console.error("Lỗi khi thực hiện truy vấn:", error);
        throw error;
    }
};

// Hàm xử lý tổng thể một truy vấn
export const processQuery = async (userQuery) => {
    try {
        // Bước 1: Phân tích truy vấn
        const queryAnalysis = await analyzeQuery(userQuery);

        // Bước 2: Thực hiện truy vấn để lấy dữ liệu (nếu cần)
        let data = null;
        if (queryAnalysis.needData) {
            data = await executeQuery(queryAnalysis);
        }

        // Bước 3: Sử dụng Gemini để tạo phản hồi dựa trên dữ liệu
        const prompt = `
    Trả lời câu hỏi sau dựa trên dữ liệu được cung cấp. Hãy trình bày câu trả lời một cách tự nhiên, 
    thân thiện và có cấu trúc rõ ràng. Nếu dữ liệu không đầy đủ, hãy thông báo một cách lịch sự.
    
    Câu hỏi: "${userQuery}"
    
    Dữ liệu: ${JSON.stringify(data)}
    
    Loại truy vấn: ${queryAnalysis.queryType}
    Ý định: ${queryAnalysis.intent}
    `;

        const response = await askGemini(prompt);
        return response;
    } catch (error) {
        console.error("Lỗi trong quá trình xử lý truy vấn:", error);
        return "Xin lỗi, tôi đang gặp sự cố khi truy xuất thông tin. Vui lòng thử lại sau.";
    }
};

export default {
    analyzeQuery,
    executeQuery,
    processQuery
};