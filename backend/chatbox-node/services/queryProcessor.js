import apiService from './apiService.js';
import { askGemini } from './geminiService.js';
import { getActivitiesData } from './dataCache.js';

import { 
  API_MAPPINGS, 
  COMMON_EXPRESSIONS, 
  SPELLING_CORRECTIONS,
  normalizeText 
} from './trainingData.js';

// Hàm phân tích yêu cầu của người dùng
const analyzeQuery = (query) => {
  // Chuẩn hóa câu hỏi để dễ so sánh
  const normalizedQuery = normalizeText(query);
  
  // Sửa lỗi chính tả phổ biến
  let correctedQuery = query.toLowerCase();
  Object.entries(SPELLING_CORRECTIONS).forEach(([mistake, correction]) => {
    const regex = new RegExp(`\\b${mistake}\\b`, 'gi');
    correctedQuery = correctedQuery.replace(regex, correction);
  });

  // Tính điểm cho mỗi intent dựa trên từ khóa
  const scores = API_MAPPINGS.map(mapping => {
    let score = 0;
    
    // Kiểm tra từng từ khóa trong danh sách từ khóa của intent
    mapping.keywords.forEach(keyword => {
      const normalizedKeyword = normalizeText(keyword);
      if (normalizedQuery.includes(normalizedKeyword)) {
        // Càng dài từ khóa càng có trọng số cao
        score += normalizedKeyword.length;
      }
    });
    
    return { intent: mapping.intent, score };
  });
  
  // Sắp xếp theo điểm số giảm dần và lấy intent có điểm cao nhất
  scores.sort((a, b) => b.score - a.score);
  
  // Nếu không có intent nào phù hợp (điểm = 0), trả về null
  if (scores.length === 0 || scores[0].score === 0) {
    return { intent: null, params: {} };
  }
  
  // Lấy intent có điểm cao nhất
  const topIntent = scores[0].intent;
  const apiMapping = API_MAPPINGS.find(mapping => mapping.intent === topIntent);
  
  // Phân tích thêm để lấy các tham số
  const params = { ...apiMapping.params };  // Bắt đầu với tham số mặc định
  
  // Xác định các tham số bổ sung dựa trên nội dung câu hỏi
  if (topIntent === "tìm kiếm hoạt động") {
    // Trích xuất từ khóa tìm kiếm
    const searchTerms = extractSearchTerms(correctedQuery);
    if (searchTerms) {
      params.search = searchTerms;
    }
  } else if (topIntent === "hoạt động theo thể loại") {
    // Xác định thể loại hoạt động
    const type = extractActivityType(correctedQuery);
    if (type) {
      params.type = type;
    }
  } else if (topIntent === "chi tiết hoạt động") {
    // Cố gắng trích xuất ID hoặc tên hoạt động
    const activityIdentifier = extractActivityIdentifier(correctedQuery);
    if (activityIdentifier) {
      if (Number.isInteger(Number(activityIdentifier))) {
        params.id = activityIdentifier;
      } else {
        params.search = activityIdentifier;
      }
    }
  } else if (topIntent === "hoạt động sắp tới") {
    // Xác định khoảng thời gian
    const timeRange = extractTimeRange(correctedQuery);
    if (timeRange) {
      params.time_range = timeRange;
    }
  }
  
  return { intent: topIntent, params };
};

// Trích xuất từ khóa tìm kiếm
const extractSearchTerms = (query) => {
  // Các mẫu để nhận dạng từ khóa tìm kiếm
  const patterns = [
    /tìm (?:hoạt động|sự kiện|hđ|sk) (?:về|liên quan|liên quan đến|về|) (.+)/i,
    /tìm kiếm (?:hoạt động|sự kiện|hđ|sk) (?:về|liên quan|liên quan đến|về|) (.+)/i,
    /hoạt động (?:về|liên quan|liên quan đến) (.+)/i,
    /sự kiện (?:về|liên quan|liên quan đến) (.+)/i,
    /(?:có|liệt kê|xem|cho xem) (?:hoạt động|sự kiện|hđ|sk) (?:về|liên quan|liên quan đến|) (.+)/i
  ];
  
  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // Nếu không tìm thấy mẫu cụ thể, trích xuất sau "về", "liên quan đến"
  const keywords = ["về ", "liên quan đến ", "liên quan ", "chủ đề "];
  for (const keyword of keywords) {
    const index = query.indexOf(keyword);
    if (index !== -1) {
      return query.substring(index + keyword.length).trim();
    }
  }
  
  return null;
};


// Trích xuất thể loại hoạt động
const extractActivityType = (query) => {
  const types = [
    { keywords: ["tình nguyện", "tinh nguyen"], type: "Tình nguyện" },
    { keywords: ["học tập", "hoc tap", "học thuật", "hoc thuat"], type: "Học tập" },
    { keywords: ["văn nghệ", "van nghe", "văn hóa", "van hoa"], type: "Văn nghệ" },
    { keywords: ["thể thao", "the thao", "thể dục", "the duc"], type: "Thể thao" },
    { keywords: ["hội thảo", "hoi thao", "seminar", "workshop"], type: "Hội thảo" },
    { keywords: ["câu lạc bộ", "clb", "cau lac bo"], type: "Câu lạc bộ" }
  ];
  
  for (const typeEntry of types) {
    for (const keyword of typeEntry.keywords) {
      if (query.includes(keyword)) {
        return typeEntry.type;
      }
    }
  }
  
  return null;
};


// Trích xuất ID hoặc tên hoạt động
const extractActivityIdentifier = (query) => {
  // Kiểm tra ID (số)
  const idPattern = /hoạt động (?:số |#|id |mã |ma )(\d+)/i;
  const idMatch = query.match(idPattern);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }
  
  // Kiểm tra tên hoạt động
  const namePatterns = [
    /chi tiết (?:về |của |)(?:hoạt động|sự kiện|hđ|sk) (.+)/i,
    /thông tin (?:về |của |)(?:hoạt động|sự kiện|hđ|sk) (.+)/i,
    /(?:hoạt động|sự kiện|hđ|sk) (.+?) (?:diễn ra|tổ chức|khi nào|ở đâu|như thế nào)/i
  ];
  
  for (const pattern of namePatterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
};


// Trích xuất khoảng thời gian
const extractTimeRange = (query) => {
  if (query.includes("tuần này") || query.includes("tuần tới") || query.includes("tuan nay") || query.includes("tuan toi")) {
    return "week";
  } else if (query.includes("tháng này") || query.includes("tháng tới") || query.includes("thang nay") || query.includes("thang toi")) {
    return "month";
  } else if (query.includes("hôm nay") || query.includes("ngày mai") || query.includes("hom nay") || query.includes("ngay mai")) {
    return "day";
  }
  
  return null;
};


// Xử lý truy vấn
export const processQuery = async (query) => {
  try {
    // Phân tích câu hỏi
    const { intent, params } = analyzeQuery(query);
    
    console.log("Đã phân tích intent:", intent);
    console.log("Với các tham số:", params);
    
    // Nếu không xác định được intent
    if (!intent) {
      const geminiPrompt = `
        Người dùng hỏi: "${query}"
        
        Tôi không thể xác định chính xác ý định của câu hỏi này. 
        Hãy trả lời câu hỏi này một cách thân thiện và hữu ích, dựa trên kiến thức chung về Đoàn trường.
        Nếu câu hỏi liên quan đến dữ liệu cụ thể mà tôi không có, hãy gợi ý người dùng đặt câu hỏi rõ ràng hơn.
      `;
      return await askGemini(geminiPrompt);
    }
    
    // Lấy thông tin API mapping
    const apiMapping = API_MAPPINGS.find(mapping => mapping.intent === intent);
    if (!apiMapping) {
      throw new Error(`Không tìm thấy API mapping cho intent: ${intent}`);
    }
    
    // Thực hiện cuộc gọi API
    let data;
    let apiParams = { ...params };
    
    // Xử lý các trường hợp đặc biệt
    if (intent === "chi tiết hoạt động" && params.search) {
      // Nếu chỉ có search term mà không có ID, trước tiên tìm hoạt động theo tên
      const activities = await apiService.getActivities(1, 5, { search: params.search });
      if (activities.results && activities.results.length > 0) {
        // Lấy chi tiết hoạt động đầu tiên tìm thấy
        const activityId = activities.results[0].id;
        data = await apiService.getActivityById(activityId);
      } else {
        // Không tìm thấy hoạt động phù hợp
        return `Tôi không tìm thấy thông tin về hoạt động "${params.search}". Vui lòng kiểm tra lại tên hoạt động.`;
      }
    } else {
      // Xử lý các trường hợp thông thường
      try {
        // Sử dụng cached data nếu có thể
        if (intent === "danh sách hoạt động" || intent === "hoạt động sắp tới") {
          const activitiesData = await getActivitiesData();
          
          // Lọc dữ liệu theo tham số
          let filteredData = {...activitiesData};
          
          if (intent === "hoạt động sắp tới") {
            // Lọc chỉ lấy hoạt động sắp tới
            const now = new Date();
            filteredData.results = activitiesData.results.filter(activity => 
              new Date(activity.start_date) > now
            );
            // Sắp xếp theo thời gian gần nhất
            filteredData.results.sort((a, b) => 
              new Date(a.start_date) - new Date(b.start_date)
            );
            // Giới hạn số lượng
            filteredData.results = filteredData.results.slice(0, params.page_size || 5);
          }
          
          data = filteredData;
        } else {
          // Gọi API trực tiếp
          data = await apiService.callAPI(apiMapping.apiEndpoint, apiMapping.method, apiParams);
        }
      } catch (error) {
        console.error("Lỗi khi gọi API:", error);
        return `Tôi gặp sự cố khi truy cập thông tin. Vui lòng thử lại sau. (Lỗi: ${error.message})`;
      }
    }
    
    // Định dạng kết quả dựa trên intent và dữ liệu nhận được
    return await formatResponse(intent, data, query);
  } catch (error) {
    console.error("Lỗi xử lý truy vấn:", error);
    return `Tôi không thể xử lý câu hỏi của bạn vào lúc này. Vui lòng thử lại sau. (Lỗi: ${error.message})`;
  }
};


// Định dạng kết quả trả về một cách thân thiện
const formatResponse = async (intent, data, originalQuery) => {
  // Sử dụng Gemini để tạo phản hồi tự nhiên
  const context = `
    Intent: ${intent}
    Dữ liệu: ${JSON.stringify(data)}
    Câu hỏi gốc: "${originalQuery}"
    
    Hãy trả lời câu hỏi trên một cách tự nhiên, thân thiện và đầy đủ thông tin. Sử dụng dữ liệu đã cung cấp.
    Nếu là danh sách, đưa ra số lượng và một vài mục đầu tiên, không cần liệt kê tất cả.
    Nếu là thông tin chi tiết, tập trung vào các thông tin quan trọng như tiêu đề, thời gian, địa điểm, mô tả.
    Sử dụng tiếng Việt có dấu, dễ đọc.
    Đảm bảo trả lời ngắn gọn nhưng đầy đủ thông tin, không quá 3-4 đoạn văn.
  `;
  
  return await askGemini(context);
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

// // Hàm xử lý tổng thể một truy vấn
// export const processQuery = async (userQuery) => {
//     try {
//         // Bước 1: Phân tích truy vấn
//         const queryAnalysis = await analyzeQuery(userQuery);

//         // Bước 2: Thực hiện truy vấn để lấy dữ liệu (nếu cần)
//         let data = null;
//         if (queryAnalysis.needData) {
//             data = await executeQuery(queryAnalysis);
//         }

//         // Bước 3: Sử dụng Gemini để tạo phản hồi dựa trên dữ liệu
//         const prompt = `
//     Trả lời câu hỏi sau dựa trên dữ liệu được cung cấp. Hãy trình bày câu trả lời một cách tự nhiên, 
//     thân thiện và có cấu trúc rõ ràng. Nếu dữ liệu không đầy đủ, hãy thông báo một cách lịch sự.
    
//     Câu hỏi: "${userQuery}"
    
//     Dữ liệu: ${JSON.stringify(data)}
    
//     Loại truy vấn: ${queryAnalysis.queryType}
//     Ý định: ${queryAnalysis.intent}
//     `;

//         const response = await askGemini(prompt);
//         return response;
//     } catch (error) {
//         console.error("Lỗi trong quá trình xử lý truy vấn:", error);
//         return "Xin lỗi, tôi đang gặp sự cố khi truy xuất thông tin. Vui lòng thử lại sau.";
//     }
// };

export default {
  processQuery,
  analyzeQuery
};