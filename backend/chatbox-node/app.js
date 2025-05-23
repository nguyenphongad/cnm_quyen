import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRoutes from "./routes/chatRoutes.js";
import { setupAutomaticRefresh } from "./services/dataCache.js";
import { generateTrainingPrompt } from "./services/trainingData.js";
import { askGemini } from "./services/geminiService.js";

dotenv.config();

const app = express();

// Kiểm tra API Key
if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY không được cấu hình trong file .env");
    process.exit(1);
}

const PORT = process.env.PORT || 9999;

app.use(cors());
app.use(express.json());

// Đăng ký routes
app.use("/api/chat", chatRoutes);

// Thêm route kiểm tra sức khỏe
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Khởi động cập nhật cache tự động mỗi 30 phút
setupAutomaticRefresh(30);

// Chuẩn bị chatbot với context 
const initChatbot = async () => {
    try {
        const trainingPrompt = generateTrainingPrompt();
        console.log("Khởi tạo chatbot với training prompt...");

        // Gửi một câu hỏi đơn giản để khởi tạo model với context
        await askGemini(`${trainingPrompt}\n\nCâu hỏi: "Bạn là ai?"\n\nTrả lời:`);
        console.log("Khởi tạo chatbot thành công!");
    } catch (error) {
        console.error("Lỗi khi khởi tạo chatbot:", error);
    }
};

// Khởi động server
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);

    // Khởi tạo chatbot sau khi server đã khởi động
    initChatbot();
});