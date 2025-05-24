import React, { useState, useRef, useEffect } from 'react';
import { sendChatbotQuery } from '@/services/dashboardService';
import './ChatbotButton.css';

const ChatbotButton: React.FC = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState('');
  const [chatResponses, setChatResponses] = useState<{query: string, response: string, isTyping?: boolean}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Tự động cuộn xuống khi có tin nhắn mới
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatResponses]);

  const handleToggleChat = (open: boolean) => {
    setIsAnimating(true);
    if (open) {
      setChatOpen(true);
    } else {
      // Chờ animation hoàn thành trước khi đóng
      setTimeout(() => {
        setChatOpen(false);
        setIsAnimating(false);
      }, 300); // Thời gian animation
    }
  };

  // Hàm xử lý định dạng tin nhắn
  const formatMessage = (text: string) => {
    // Thay thế các ký tự xuống dòng
    let formattedText = text.replace(/\\n/g, '<br>');
    formattedText = formattedText.replace(/\n/g, '<br>');
    
    // Xử lý định dạng đậm (text giữa hai dấu **)
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Xử lý danh sách có dấu •
    formattedText = formattedText.replace(/• (.*?)(?=<br>|$)/g, '<li>$1</li>');
    
    // Xử lý danh sách có dấu *
    formattedText = formattedText.replace(/\* (.*?)(?=<br>|$)/g, '<li>$1</li>');
    
    // Bọc các thẻ li trong ul
    if (formattedText.includes('<li>')) {
      formattedText = formattedText.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
    }
    
    return formattedText;
  };

  // Hàm tách nội dung thành từng chữ hoặc thẻ HTML
  const splitContentIntoParts = (text: string) => {
    // Định dạng text
    const formattedText = formatMessage(text);
    
    // Phân tích HTML để tách các thẻ và text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formattedText;
    
    // Kết quả là mảng các phần: text hoặc thẻ HTML
    const parts: Array<{type: string, content?: string, tag?: string, attrs?: Record<string, string>}> = [];
    
    // Hàm đệ quy để xử lý các node
    function processNode(node: ChildNode) {
      if (node.nodeType === Node.TEXT_NODE) { // Text node
        // Chia text thành từng từ để hiển thị mượt mà
        const words = node.textContent?.split(/(\s+)/) || [];
        words.forEach(word => {
          if (word !== '') {
            parts.push({ type: 'text', content: word });
          }
        });
      } else if (node.nodeType === Node.ELEMENT_NODE) { // Element node
        const element = node as Element;
        // Lưu thẻ mở
        parts.push({ 
          type: 'tagOpen', 
          tag: element.nodeName.toLowerCase(), 
          attrs: getAttributes(element) 
        });
        
        // Xử lý các node con
        Array.from(element.childNodes).forEach(child => processNode(child));
        
        // Lưu thẻ đóng
        parts.push({ type: 'tagClose', tag: element.nodeName.toLowerCase() });
      }
    }
    
    // Lấy các thuộc tính của node
    function getAttributes(node: Element) {
      const attrs: Record<string, string> = {};
      Array.from(node.attributes).forEach(attr => {
        attrs[attr.name] = attr.value;
      });
      return attrs;
    }
    
    // Bắt đầu xử lý từ các node gốc
    Array.from(tempDiv.childNodes).forEach(node => {
      processNode(node);
    });
    
    return parts;
  };

  // Tạo hiệu ứng typing
  const typeResponse = async (response: string, index: number) => {
    const parts = splitContentIntoParts(response);
    let visibleParts: typeof parts = [];
    let currentIndex = 0;

    const updateMessage = () => {
      if (currentIndex < parts.length) {
        visibleParts.push(parts[currentIndex]);
        
        // Cập nhật message hiện tại với phần hiển thị mới
        setChatResponses(prev => {
          const newResponses = [...prev];
          newResponses[index] = {
            ...newResponses[index],
            renderedResponse: formatMessageParts(visibleParts),
            isTyping: true
          };
          return newResponses;
        });
        
        currentIndex++;
        
        // Tính toán thời gian chờ dựa trên độ dài của phần tiếp theo
        const delay = parts[currentIndex - 1].type === 'text' ? 
          Math.min(20 * (parts[currentIndex - 1].content?.length || 1), 100) : 10;
          
        typingTimeoutRef.current = setTimeout(updateMessage, delay);
      } else {
        // Hoàn thành typing
        setChatResponses(prev => {
          const newResponses = [...prev];
          newResponses[index] = {
            ...newResponses[index],
            isTyping: false
          };
          return newResponses;
        });
      }
    };
    
    updateMessage();
  };

  // Hàm kết hợp các phần đã xử lý thành HTML
  const formatMessageParts = (parts: Array<{type: string, content?: string, tag?: string, attrs?: Record<string, string>}>) => {
    let html = '';
    
    parts.forEach(part => {
      if (part.type === 'text') {
        html += part.content;
      } else if (part.type === 'tagOpen') {
        html += `<${part.tag}`;
        // Thêm các thuộc tính
        for (const [name, value] of Object.entries(part.attrs || {})) {
          html += ` ${name}="${value}"`;
        }
        html += '>';
      } else if (part.type === 'tagClose' && part.tag) {
        html += `</${part.tag}>`;
      }
    });
    
    return html;
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim() || isProcessing) return;

    setIsProcessing(true);
    const userMessage = chatQuery;
    setChatQuery('');
    
    // Thêm tin nhắn của người dùng trước
    setChatResponses(prev => [
      ...prev, 
      { 
        query: userMessage, 
        response: 'Đang xử lý...', 
        renderedResponse: 'Đang xử lý...',
        isTyping: true 
      }
    ]);
    
    try {
      const response = await sendChatbotQuery(userMessage);
      console.log('Chatbot response:', response);
      
      // Cập nhật phản hồi và bắt đầu typing effect
      setChatResponses(prev => {
        const newResponses = [...prev];
        const lastIndex = newResponses.length - 1;
        
        newResponses[lastIndex] = {
          ...newResponses[lastIndex],
          response: response.response,
          renderedResponse: '' // Bắt đầu với chuỗi rỗng
        };
        
        return newResponses;
      });
      
      // Bắt đầu hiệu ứng typing cho tin nhắn mới nhất
      typeResponse(response.response, chatResponses.length);
      
    } catch (error) {
      console.error('Error sending chatbot query:', error);
      
      setChatResponses(prev => {
        const newResponses = [...prev];
        const lastIndex = newResponses.length - 1;
        
        newResponses[lastIndex] = {
          ...newResponses[lastIndex],
          response: 'Xin lỗi, tôi không thể trả lời câu hỏi này lúc này.',
          renderedResponse: 'Xin lỗi, tôi không thể trả lời câu hỏi này lúc này.',
          isTyping: false
        };
        
        return newResponses;
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Hủy timeout khi component unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!chatOpen ? (
        <button
          onClick={() => handleToggleChat(true)}
          className="chat-button-open"
          aria-label="Mở trợ lý ảo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
        </button>
      ) : (
        <div className={`chat-container ${isAnimating ? 'chat-container-opening' : ''}`} style={{ width: '800px', height: '600px' }}>
          <div className="chat-header">
            <h3 className="font-medium chat-title-animation">Trợ lý Đoàn trường</h3>
            <button 
              onClick={() => handleToggleChat(false)}
              className="chat-close-button"
              aria-label="Đóng"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div 
            className="chat-messages"
            ref={chatContainerRef}
          >
            {chatResponses.length === 0 ? (
              <div className="chat-welcome">
                <p>Xin chào! Tôi là trợ lý ảo của Đoàn trường.</p>
                <p className="mt-2">Bạn có thể hỏi tôi về:</p>
                <ul className="chat-welcome-list">
                  <li className="chat-welcome-item-1">Thông tin về Đoàn trường</li>
                  <li className="chat-welcome-item-2">Quy định, điều lệ Đoàn</li>
                  <li className="chat-welcome-item-3">Hoạt động sắp diễn ra</li>
                  <li className="chat-welcome-item-4">Cách thức tham gia các hoạt động</li>
                </ul>
              </div>
            ) : (
              <div className="chat-conversation">
                {chatResponses.map((item, index) => (
                  <div key={index} className="chat-message-group">
                    <div className="chat-user-message">
                      <div className="chat-user-bubble">
                        <p className="text-gray-800 text-sm">{item.query}</p>
                      </div>
                    </div>
                    <div className="chat-bot-message">
                      <div className={`chat-bot-bubble ${item.isTyping ? 'typing' : ''}`}>
                        {/* Sử dụng renderedResponse thay vì response để hiển thị từ từ */}
                        <div 
                          className="text-gray-800 text-sm" 
                          dangerouslySetInnerHTML={{ 
                            __html: item.renderedResponse || 'Đang xử lý...' 
                          }}
                        />
                        {item.isTyping && (
                          <span className="typing-indicator">
                            <span className="dot"></span>
                            <span className="dot"></span>
                            <span className="dot"></span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <form onSubmit={handleChatSubmit} className="chat-form">
            <div className="chat-input-group">
              <input
                type="text"
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                className="chat-input"
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={isProcessing || !chatQuery.trim()}
                className={`chat-send-button ${
                  isProcessing || !chatQuery.trim() ? 'chat-send-disabled' : ''
                }`}
                aria-label="Gửi"
              >
                {isProcessing ? (
                  <span className="loading-dots">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatbotButton;