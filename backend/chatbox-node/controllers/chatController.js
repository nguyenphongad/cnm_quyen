import { askGemini } from '../services/geminiService.js';
import { processQuery } from '../services/queryProcessor.js';

// Ngữ cảnh cho chatbot
const CONTEXT = `
Bạn là trợ lý ảo của Đoàn trường, hỗ trợ sinh viên và cán bộ đoàn.
Bạn có thể trả lời các câu hỏi về hoạt động, thành viên, tin tức và các thông tin khác liên quan đến Đoàn trường.
Hãy trả lời một cách thân thiện, ngắn gọn và chính xác.
`;

export const askQuestion = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Thiếu thông tin tin nhắn' });
        }

        // Kiểm tra xem câu hỏi có liên quan đến dữ liệu hay không
        const dataRelatedKeywords = [
            'hoạt động', 'sự kiện', 'thành viên', 'đoàn viên',
            'tin tức', 'thông báo', 'thống kê', 'báo cáo',
            'ai', 'khi nào', 'ở đâu', 'bao nhiêu', 'danh sách'
        ];

        // Đếm số từ khóa liên quan đến dữ liệu trong câu hỏi
        const isDataQuery = dataRelatedKeywords.some(keyword =>
            message.toLowerCase().includes(keyword));

        let response;

        if (isDataQuery) {
            // Xử lý truy vấn liên quan đến dữ liệu
            response = await processQuery(message);
        } else {
            // Xử lý câu hỏi chung
            const prompt = `${CONTEXT}\n\nCâu hỏi: ${message}\n\nTrả lời:`;
            response = await askGemini(prompt);
        }

        return res.json({ response });
    } catch (error) {
        console.error('Lỗi xử lý câu hỏi:', error);
        return res.status(500).json({ error: 'Lỗi server khi xử lý câu hỏi' });
    }
};

export default {
    askQuestion
};