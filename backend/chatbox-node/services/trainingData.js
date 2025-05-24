export const API_MAPPINGS = [
  {
    intent: "danh sách hoạt động",
    keywords: [
      // Từ khóa chuẩn
      "hoạt động", "event", "sự kiện", "chương trình", "danh sách hoạt động",
      // Không dấu
      "hoat dong", "su kien", "chuong trinh", "danh sach hoat dong",
      // Lỗi chính tả phổ biến
      "hoạt dộng", "sư kiện", "hoạt đông", "chuong trìn", "hoat đong",
      // Viết tắt
      "hđ", "sk", "ds hoạt động", "events", "activities",
      // Cách diễn đạt khác
      "có những hoạt động nào", "tổ chức gì", "sắp diễn ra", "sự kiện gì"
    ],
    apiEndpoint: "/activities/",
    method: "GET",
    params: { page: 1, page_size: 10 },
    description: "Lấy danh sách các hoạt động của Đoàn trường"
  },
  {
    intent: "chi tiết hoạt động",
    keywords: [
      // Từ khóa chuẩn
      "chi tiết hoạt động", "thông tin hoạt động", "hoạt động cụ thể",
      // Không dấu
      "chi tiet hoat dong", "thong tin hoat dong", "hoat dong cu the",
      // Lỗi chính tả phổ biến
      "chi tiêt hoạt đông", "thông tin hoạt dộng", "chi tiet su kien",
      // Cách diễn đạt khác
      "mô tả hoạt động", "thời gian hoạt động", "địa điểm hoạt động", "khi nào",
      "ở đâu", "ai tham gia", "yêu cầu", "event detail", "chi tiết sự kiện"
    ],
    apiEndpoint: "/activities/{id}/",
    method: "GET",
    params: {},
    description: "Lấy thông tin chi tiết về một hoạt động cụ thể"
  },
  // {
  //   intent: "danh sách đoàn viên",
  //   keywords: ["đoàn viên", "thành viên", "sinh viên", "danh sách đoàn viên"],
  //   apiEndpoint: "/members/",
  //   method: "GET",
  //   params: { page: 1, page_size: 10 },
  //   description: "Lấy danh sách các đoàn viên"
  // },
  // {
  //   intent: "danh sách bài viết",
  //   keywords: ["bài viết", "tin tức", "thông báo", "post", "news"],
  //   apiEndpoint: "/posts/",
  //   method: "GET",
  //   params: { page: 1, page_size: 10 },
  //   description: "Lấy danh sách các bài viết, tin tức của Đoàn trường"
  // },
  // {
  //   intent: "thống kê",
  //   keywords: ["thống kê", "báo cáo", "report", "statistic"],
  //   apiEndpoint: "/dashboard/stats/",
  //   method: "GET",
  //   params: {},
  //   description: "Lấy thông tin thống kê tổng quan"
  // }
];

export const EXAMPLE_QUERIES = [
  {
    query: "Cho tôi biết các hoạt động sắp tới",
    mapping: "hoạt động sắp tới",
    params: { upcoming: true, page: 1, page_size: 5 }
  },
  // Viết không dấu
  {
    query: "cho toi biet cac hoat dong sap toi",
    mapping: "hoạt động sắp tới",
    params: { upcoming: true, page: 1, page_size: 5 }
  },
  // Sai chính tả
  {
    query: "Cho tôi biêt các hoạt đông sắp tơi",
    mapping: "hoạt động sắp tới",
    params: { upcoming: true, page: 1, page_size: 5 }
  },
  // Câu hỏi dạng ng/hỏi
  {
    query: "Sắp tới có những sự kiện gì?",
    mapping: "hoạt động sắp tới",
    params: { upcoming: true, page: 1, page_size: 5 }
  },
  // Câu hỏi không hoàn chỉnh
  {
    query: "sự kiện sắp tới?",
    mapping: "hoạt động sắp tới",
    params: { upcoming: true, page: 1, page_size: 5 }
  },
  // Câu hỏi chi tiết hoạt động - chuẩn
  {
    query: "Chi tiết hoạt động hiến máu tình nguyện",
    mapping: "chi tiết hoạt động",
    params: { id: null, search: "hiến máu tình nguyện" }
  },
  // Câu hỏi chi tiết hoạt động - không dấu
  {
    query: "chi tiet hoat dong hien mau tinh nguyen",
    mapping: "chi tiết hoạt động",
    params: { id: null, search: "hiến máu tình nguyện" }
  },
  // Viết tắt và lỗi chính tả
  {
    query: "tìm hđ ve tinh nguyen ạ",
    mapping: "tìm kiếm hoạt động",
    params: { search: "tình nguyện", page: 1, page_size: 10 }
  },
  // Dùng từ khóa khác nhưng cùng ý
  {
    query: "Liệt kê các sự kiện sắp diễn ra vào tuần tới",
    mapping: "hoạt động sắp tới",
    params: { upcoming: true, page: 1, page_size: 5, time_range: "week" }
  },
  // Câu hỏi mang tính thảo luận
  {
    query: "Tôi muốn tham gia hoạt động tình nguyện thì có những hoạt động nào?",
    mapping: "hoạt động theo thể loại",
    params: { type: "tình nguyện", page: 1, page_size: 10 }
  },
  // Câu hỏi dùng từ khoá viết tắt
  {
    query: "ds hđ của clb tin học",
    mapping: "tìm kiếm hoạt động",
    params: { search: "câu lạc bộ tin học", page: 1, page_size: 10 }
  }
];

export const COMMON_EXPRESSIONS = [
  {
    variants: ["cho tôi biết", "cho mình biết", "cho toi biet", "cho tớ xem", "cho tao xem", "liệt kê", "liet ke", "hiển thị", "hien thi"],
    intent: "yêu cầu thông tin"
  },
  {
    variants: ["ở đâu", "o dau", "địa điểm", "dia diem", "địa chỉ", "dia chi", "tại đâu", "tai dau", "chỗ nào", "cho nao"],
    intent: "hỏi địa điểm"
  },
  {
    variants: ["khi nào", "lúc nào", "khi nao", "luc nao", "thời gian", "thoi gian", "ngày", "ngay", "giờ", "gio"],
    intent: "hỏi thời gian"
  },
  {
    variants: ["như thế nào", "nhu the nao", "làm sao", "lam sao", "bằng cách nào", "bang cach nao", "thế nào", "the nao"],
    intent: "hỏi cách thức"
  }
];


export const SPELLING_CORRECTIONS = {
  // Các lỗi chính tả phổ biến
  "hoat dong": "hoạt động",
  "hoat đong": "hoạt động",
  "hoạt đông": "hoạt động",
  "hoat đông": "hoạt động",
  "su kien": "sự kiện",
  "su kiện": "sự kiện",
  "sư kien": "sự kiện",
  "thong tin": "thông tin",
  "tin tuc": "tin tức",
  "tinh nguyen": "tình nguyện"
};


export const generateTrainingPrompt = () => {
  return `
  Tôi là một trợ lý ảo của Đoàn trường, có thể truy cập các API sau:
  
  ${API_MAPPINGS.map(mapping => 
    `- ${mapping.description}: ${mapping.apiEndpoint} (${mapping.method})`
  ).join('\n')}
  
  Tôi có khả năng hiểu và xử lý câu hỏi của người dùng kể cả khi:
  - Viết không dấu (hoat dong thay vì hoạt động)
  - Sai chính tả (hoạt đông thay vì hoạt động)
  - Dùng các từ viết tắt (hđ thay vì hoạt động, clb thay vì câu lạc bộ)
  - Câu hỏi không hoàn chỉnh (sự kiện sắp tới?)
  
  Một số ví dụ về cách tôi phân tích câu hỏi:
  ${EXAMPLE_QUERIES.map(example => 
    `Câu hỏi: "${example.query}"
    -> Sử dụng API: ${API_MAPPINGS.find(m => m.intent === example.mapping)?.apiEndpoint || "Không tìm thấy API"}
    -> Params: ${JSON.stringify(example.params)}`
  ).join('\n\n')}
  
  Khi người dùng đặt câu hỏi, tôi sẽ:
  1. Phân tích ý định (ngay cả khi có lỗi chính tả hoặc không dấu)
  2. Xác định API phù hợp
  3. Xác định tham số cần thiết
  4. Gọi API và xử lý kết quả
  5. Trình bày kết quả một cách dễ hiểu, đầy đủ dấu
  
  Tôi luôn trả lời một cách thân thiện và hữu ích, sử dụng tiếng Việt có dấu đầy đủ.
  Nếu tôi không hiểu câu hỏi, tôi sẽ yêu cầu người dùng giải thích rõ hơn.
  Nếu không tìm thấy thông tin, tôi sẽ thông báo rõ ràng cho người dùng.
  
  Tôi cũng hiểu được các cách diễn đạt khác nhau như:
  - "có những hoạt động nào" = "danh sách hoạt động"
  - "sắp tới có gì" = "hoạt động sắp tới" 
  - "tìm hđ về..." = "tìm kiếm hoạt động"
  
  Nếu câu hỏi không liên quan đến dữ liệu hoặc các API có sẵn, tôi sẽ cung cấp thông tin chung về Đoàn trường hoặc hướng dẫn người dùng liên hệ với các kênh chính thức.
  `;
};

// Hàm giúp chuẩn hóa từ khóa để so sánh
export const normalizeText = (text) => {
  if (!text) return "";
  
  // Chuyển thành chữ thường
  let normalized = text.toLowerCase();
  
  // Loại bỏ dấu
  normalized = normalized
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, "");
  
  // Loại bỏ các ký tự đặc biệt
  normalized = normalized
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  
  return normalized;
};

export default {
  API_MAPPINGS,
  EXAMPLE_QUERIES,
  COMMON_EXPRESSIONS,
  SPELLING_CORRECTIONS,
  generateTrainingPrompt,
  normalizeText
};