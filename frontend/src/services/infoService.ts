import api from './api';

interface UnionInfo {
  description: string;
  regulations: string;
}

// Flag to use mock data instead of real API
const USE_MOCK_API = true; // Change to false when real API is ready

/**
 * Fetches general information about the student union
 * @returns Information about the union, including description and regulations
 */
export const getUnionInfo = async (): Promise<UnionInfo> => {
  try {
    if (USE_MOCK_API) {
      return getMockUnionInfo();
    }
    
    const response = await api.get<UnionInfo>('/union-info/');
    return response.data;
  } catch (error) {
    console.error('Error fetching union information:', error);
    return {
      description: 'Không thể tải thông tin đoàn.',
      regulations: 'Không thể tải quy định đoàn.'
    };
  }
};

/**
 * Mock function for union information
 * @returns Mock union information
 */
const getMockUnionInfo = (): UnionInfo => {
  return {
    description: `
      <p><strong>Đoàn Thanh niên Cộng sản Hồ Chí Minh</strong> là tổ chức chính trị - xã hội của thanh niên Việt Nam do Đảng Cộng sản Việt Nam và Chủ tịch Hồ Chí Minh sáng lập, lãnh đạo và rèn luyện.</p>
      
      <p>Đoàn là đội dự bị tin cậy của Đảng, là trường học xã hội chủ nghĩa của thanh niên, là đại diện chăm lo và bảo vệ quyền lợi hợp pháp của tuổi trẻ, phụ trách Đội Thiếu niên Tiền phong Hồ Chí Minh.</p>
      
      <p>Mục tiêu của Đoàn là tập hợp, đoàn kết, giáo dục thanh niên, xây dựng đội ngũ thanh niên Việt Nam có lý tưởng cách mạng, bản lĩnh chính trị vững vàng, giàu lòng yêu nước; có đạo đức, lối sống văn hóa, trách nhiệm, tuân thủ pháp luật; có tri thức, sức khỏe, kỹ năng thực hành xã hội, khát vọng vươn lên; làm chủ khoa học, công nghệ hiện đại, tiên phong trong sự nghiệp đổi mới, công nghiệp hóa, hiện đại hóa đất nước vì mục tiêu dân giàu, nước mạnh, dân chủ, công bằng, văn minh.</p>
      
      <h3>Các hoạt động chính của Đoàn:</h3>
      <ul>
        <li>Giáo dục lý tưởng cách mạng, đạo đức, lối sống văn hóa cho thanh niên.</li>
        <li>Tham gia xây dựng, bảo vệ Đảng và chính quyền nhân dân; tham gia xây dựng và thực hiện các chủ trương, chính sách, pháp luật; phản biện xã hội; kiểm tra, giám sát, phòng, chống tham nhũng, lãng phí, tiêu cực.</li>
        <li>Chăm lo, bảo vệ quyền, lợi ích hợp pháp, chính đáng của thanh niên.</li>
        <li>Đoàn kết, tập hợp thanh niên, xây dựng tổ chức Đoàn vững mạnh; tham gia xây dựng Hội Liên hiệp Thanh niên Việt Nam và các tổ chức khác của thanh niên do Đoàn làm nòng cốt.</li>
        <li>Phụ trách Đội Thiếu niên Tiền phong Hồ Chí Minh, chăm sóc, giáo dục thiếu niên, nhi đồng.</li>
        <li>Xây dựng, củng cố tình đoàn kết hữu nghị với thanh niên các nước; nghiên cứu, theo dõi tình hình thanh niên thế giới; trau dồi, phát triển lý luận thanh niên, công tác thanh niên.</li>
      </ul>
    `,
    regulations: `
      <h3>Quy định về Đoàn viên</h3>
      
      <h4>Điều 1: Đoàn viên</h4>
      <p>Công dân Việt Nam từ 16 đến 30 tuổi, tán thành Điều lệ Đoàn, tự nguyện hoạt động trong tổ chức Đoàn, có tinh thần xung kích cách mạng, gương mẫu trong học tập, lao động, công tác, rèn luyện và sinh hoạt, được tổ chức Đoàn Thanh niên Cộng sản Hồ Chí Minh xem xét và kết nạp vào Đoàn.</p>
      
      <h4>Điều 2: Nhiệm vụ của đoàn viên</h4>
      <ol>
        <li>Tích cực học tập, rèn luyện, thực hiện tốt nhiệm vụ của người đoàn viên.</li>
        <li>Chấp hành nghiêm túc nội quy, quy chế của nhà trường, cơ quan, đơn vị.</li>
        <li>Tham gia đầy đủ các buổi sinh hoạt chi đoàn và các hoạt động do Đoàn tổ chức.</li>
        <li>Đóng đoàn phí đầy đủ và đúng hạn theo quy định.</li>
        <li>Tuyên truyền, vận động thanh niên vào tổ chức Đoàn.</li>
      </ol>
      
      <h4>Điều 3: Quyền của đoàn viên</h4>
      <ol>
        <li>Được thảo luận, chất vấn và biểu quyết các công việc của Đoàn.</li>
        <li>Được ứng cử, đề cử và bầu cử vào các cơ quan lãnh đạo của Đoàn các cấp theo quy định.</li>
        <li>Được đề xuất ý kiến, nguyện vọng và phê bình đối với tổ chức Đoàn và đoàn viên.</li>
        <li>Được tham gia các hoạt động do Đoàn tổ chức.</li>
        <li>Được tổ chức Đoàn bảo vệ quyền, lợi ích hợp pháp, chính đáng khi bị xâm phạm.</li>
      </ol>
      
      <h4>Điều 4: Đoàn phí</h4>
      <p>Đoàn viên có trách nhiệm đóng đoàn phí hàng tháng theo quy định. Mức đoàn phí là 5,000 đồng/tháng đối với sinh viên và 10,000 đồng/tháng đối với cán bộ đoàn.</p>
      
      <h4>Điều 5: Khen thưởng và kỷ luật</h4>
      <p>Đoàn viên có thành tích xuất sắc trong công tác, học tập và hoạt động Đoàn sẽ được xem xét khen thưởng. Đoàn viên vi phạm kỷ luật sẽ bị xử lý theo quy định của Điều lệ Đoàn.</p>
    `
  };
};

/**
 * Fetches detailed information for a specific topic
 * @param topic Topic identifier
 * @returns Detailed information about the topic
 */
export const getTopicInfo = async (topic: string): Promise<string> => {
  try {
    if (USE_MOCK_API) {
      return getMockTopicInfo(topic);
    }
    
    const response = await api.get<{ content: string }>(`/topics/${topic}/`);
    return response.data.content;
  } catch (error) {
    console.error(`Error fetching topic ${topic} information:`, error);
    return 'Không thể tải thông tin chi tiết.';
  }
};

/**
 * Mock function for topic information
 * @param topic Topic identifier
 * @returns Mock topic information
 */
const getMockTopicInfo = (topic: string): string => {
  const topics: Record<string, string> = {
    'introduction': `
      <h3>Giới thiệu về Đoàn TNCS Hồ Chí Minh</h3>
      <p>Đoàn Thanh niên Cộng sản Hồ Chí Minh là tổ chức chính trị - xã hội của thanh niên Việt Nam do Đảng Cộng sản Việt Nam và Chủ tịch Hồ Chí Minh sáng lập, lãnh đạo và rèn luyện.</p>
      <p>Đoàn TNCS Hồ Chí Minh là một tổ chức quần chúng rộng lớn của thanh niên Việt Nam có tính quần chúng và tính tiên phong, là một tổ chức chính trị - xã hội, là lực lượng dự bị đáng tin cậy và là cánh tay đắc lực của Đảng Cộng sản Việt Nam, là trường học xã hội chủ nghĩa của thanh niên.</p>
    `,
    'activities': `
      <h3>Các hoạt động của Đoàn</h3>
      <p>Đoàn TNCS Hồ Chí Minh tổ chức nhiều hoạt động đa dạng như:</p>
      <ul>
        <li>Các hoạt động tình nguyện: Mùa hè xanh, Tiếp sức mùa thi, Xuân tình nguyện...</li>
        <li>Các hoạt động học tập, nghiên cứu khoa học</li>
        <li>Các hoạt động văn hóa, văn nghệ, thể dục thể thao</li>
        <li>Các hoạt động chăm lo, hỗ trợ thanh thiếu nhi có hoàn cảnh khó khăn</li>
      </ul>
    `,
    'membership': `
      <h3>Quy định về Đoàn viên</h3>
      <p>Để trở thành đoàn viên, thanh niên cần đáp ứng các điều kiện sau:</p>
      <ol>
        <li>Công dân Việt Nam từ 16 đến 30 tuổi</li>
        <li>Tán thành Điều lệ Đoàn</li>
        <li>Tự nguyện hoạt động trong tổ chức Đoàn</li>
        <li>Có tinh thần xung kích cách mạng</li>
        <li>Gương mẫu trong học tập, lao động, công tác, rèn luyện và sinh hoạt</li>
      </ol>
    `,
    'structure': `
      <h3>Cơ cấu tổ chức của Đoàn</h3>
      <p>Đoàn TNCS Hồ Chí Minh được tổ chức theo nguyên tắc tập trung dân chủ, thống nhất từ trung ương đến cơ sở với các cấp:</p>
      <ul>
        <li>Trung ương Đoàn TNCS Hồ Chí Minh</li>
        <li>Đoàn cấp tỉnh, thành phố trực thuộc trung ương</li>
        <li>Đoàn cấp huyện, quận, thị xã, thành phố thuộc tỉnh</li>
        <li>Đoàn cơ sở (xã, phường, thị trấn, trường học, cơ quan, doanh nghiệp...)</li>
        <li>Chi đoàn (thôn, ấp, bản, tổ dân phố, lớp học, đơn vị sản xuất...)</li>
      </ul>
    `
  };
  
  return topics[topic] || 'Không có thông tin về chủ đề này.';
}; 