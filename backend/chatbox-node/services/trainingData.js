export const API_MAPPINGS = [
  {
    intent: "danh sách hoạt động",
    keywords: ["hoạt động", "event", "sự kiện", "chương trình", "danh sách hoạt động"],
    apiEndpoint: "/activities/",
    method: "GET",
    params: { page: 1, page_size: 10 },
    description: "Lấy danh sách các hoạt động của Đoàn trường"
  },
  {
    intent: "chi tiết hoạt động",
    keywords: ["chi tiết hoạt động", "thông tin hoạt động", "hoạt động cụ thể"],
    apiEndpoint: "/activities/{id}/",
    method: "GET",
    params: {},
    description: "Lấy thông tin chi tiết về một hoạt động cụ thể"
  },
  {
    intent: "danh sách đoàn viên",
    keywords: ["đoàn viên", "thành viên", "sinh viên", "danh sách đoàn viên"],
    apiEndpoint: "/members/",
    method: "GET",
    params: { page: 1, page_size: 10 },
    description: "Lấy danh sách các đoàn viên"
  },
  {
    intent: "danh sách bài viết",
    keywords: ["bài viết", "tin tức", "thông báo", "post", "news"],
    apiEndpoint: "/posts/",
    method: "GET",
    params: { page: 1, page_size: 10 },
    description: "Lấy danh sách các bài viết, tin tức của Đoàn trường"
  },
  {
    intent: "thống kê",
    keywords: ["thống kê", "báo cáo", "report", "statistic"],
    apiEndpoint: "/dashboard/stats/",
    method: "GET",
    params: {},
    description: "Lấy thông tin thống kê tổng quan"
  }
];

export const EXAMPLE_QUERIES = [
  {
    query: "Cho tôi biết các hoạt động sắp tới",
    mapping: "danh sách hoạt động",
    params: { page: 1, page_size: 5, upcoming: true }
  },
  {
    query: "Liệt kê tất cả đoàn viên khoa CNTT",
    mapping: "danh sách đoàn viên",
    params: { page: 1, page_size: 10, department: "CNTT" }
  },
  {
    query: "Các tin tức gần đây",
    mapping: "danh sách bài viết",
    params: { page: 1, page_size: 5, sort: "-created_at" }
  },
  {
    query: "Báo cáo số lượng đoàn viên tham gia hoạt động tháng này",
    mapping: "thống kê",
    params: { period: "month", activity_participation: true }
  }
];

export const generateTrainingPrompt = () => {
  return `
  Tôi là một trợ lý ảo của Đoàn trường, có thể truy cập các API sau:
  
  ${API_MAPPINGS.map(mapping => 
    `- ${mapping.description}: ${mapping.apiEndpoint} (${mapping.method})`
  ).join('\n')}
  
  Một số ví dụ về cách tôi phân tích câu hỏi:
  ${EXAMPLE_QUERIES.map(example => 
    `Câu hỏi: "${example.query}"
    -> Sử dụng API: ${API_MAPPINGS.find(m => m.intent === example.mapping).apiEndpoint}
    -> Params: ${JSON.stringify(example.params)}`
  ).join('\n\n')}
  
  Khi người dùng đặt câu hỏi, tôi sẽ:
  1. Phân tích ý định
  2. Xác định API phù hợp
  3. Xác định tham số cần thiết
  4. Gọi API và xử lý kết quả
  5. Trình bày kết quả một cách dễ hiểu
  
  Luôn trả lời một cách thân thiện và hữu ích.
  `;
};

export default {
  API_MAPPINGS,
  EXAMPLE_QUERIES,
  generateTrainingPrompt
};