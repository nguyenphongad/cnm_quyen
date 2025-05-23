import React, { useState } from 'react';
import { sendChatbotQuery } from '@/services/dashboardService';

const ChatbotButton: React.FC = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState('');
  const [chatResponses, setChatResponses] = useState<{query: string, response: string}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const chatContainerRef = React.useRef<HTMLDivElement>(null);

  // Tự động cuộn xuống khi có tin nhắn mới
  React.useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatResponses]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim() || isProcessing) return;

    setIsProcessing(true);
    // Thêm tin nhắn của người dùng trước
    const newMessage = { query: chatQuery, response: 'Đang xử lý...' };
    setChatResponses(prev => [...prev, newMessage]);
    
    try {
      const response = await sendChatbotQuery(chatQuery);
      
      // Cập nhật phản hồi
      setChatResponses(prev => 
        prev.map((item, index) => 
          index === prev.length - 1 
            ? { query: chatQuery, response: response.answer } 
            : item
        )
      );
    } catch (error) {
      console.error('Error sending chatbot query:', error);
      setChatResponses(prev => 
        prev.map((item, index) => 
          index === prev.length - 1 
            ? { query: chatQuery, response: 'Xin lỗi, tôi không thể trả lời câu hỏi này lúc này.' } 
            : item
        )
      );
    } finally {
      setChatQuery('');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!chatOpen ? (
        <button
          onClick={() => setChatOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg flex items-center justify-center transition-all"
          aria-label="Mở trợ lý ảo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-xl w-80 sm:w-96 flex flex-col overflow-hidden border border-gray-200 max-h-[70vh]">
          <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
            <h3 className="font-medium">Trợ lý Đoàn trường</h3>
            <button 
              onClick={() => setChatOpen(false)}
              className="text-white hover:text-gray-200"
              aria-label="Đóng"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div 
            className="flex-1 p-4 overflow-y-auto max-h-80 min-h-[250px] bg-gray-50"
            ref={chatContainerRef}
          >
            {chatResponses.length === 0 ? (
              <div className="text-gray-500 italic text-center mt-6">
                <p>Xin chào! Tôi là trợ lý ảo của Đoàn trường.</p>
                <p className="mt-2">Bạn có thể hỏi tôi về:</p>
                <ul className="text-left list-disc pl-8 mt-2">
                  <li>Thông tin về Đoàn trường</li>
                  <li>Quy định, điều lệ Đoàn</li>
                  <li>Hoạt động sắp diễn ra</li>
                  <li>Cách thức tham gia các hoạt động</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-4">
                {chatResponses.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-end">
                      <div className="bg-blue-100 p-3 rounded-lg max-w-[80%] break-words">
                        <p className="text-gray-800 text-sm">{item.query}</p>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-white p-3 rounded-lg border border-gray-200 max-w-[80%] break-words shadow-sm">
                        <p className="text-gray-800 text-sm">{item.response}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <form onSubmit={handleChatSubmit} className="p-3 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={isProcessing || !chatQuery.trim()}
                className={`p-2 rounded-lg ${
                  isProcessing || !chatQuery.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                aria-label="Gửi"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatbotButton; 