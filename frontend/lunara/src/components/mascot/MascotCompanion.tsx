import React, { useState, useRef, useEffect } from 'react';
import { Mascot, Reaction } from './Mascot';
import { Sparkles, X, MessageCircle, Send, Minus, RefreshCw, ChevronDown } from 'lucide-react';

interface MascotCompanionProps {
  directions?: string;
  reactions?: string;
  size?: number;
  initialMessage?: string;
  className?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'mascot';
  text: string;
  time: string;
  reaction?: Reaction;
}

const BOOP_MESSAGES: Record<Reaction, string[]> = {
  heart: [
    'Lunara Spa gửi bạn thật nhiều yêu thương! 💖',
    'Thư giãn và nuông chiều bản thân hôm nay nhé! ✨',
    'Bạn thật dễ thương! 🥰',
  ],
  sparkle: [
    'Tận hưởng liệu trình thảo mộc rạng ngời nhé! 🌿',
    'Một ngày tràn đầy năng lượng tươi mới nha! ⭐',
    'Lấp lánh như tinh dầu tự nhiên vậy! ✨',
  ],
  delighted: [
    'Hihi chạm vào mình nhột quá nè! 🎋',
    'Hôm nay bạn muốn thử xông hơi thảo dược không?',
    'Yay! Cùng trò chuyện với mình nhé! 🌸',
  ],
  blink: [
    'Chớp mắt một cái là bớt căng thẳng liền! 😉',
    'Mình luôn ở đây đồng hành cùng bạn!',
  ],
  surprised: ['Ủa! Bạn vừa gọi mình hả? 🐼'],
  wink: ['Nháy mắt đồng ý một buổi spa nhé! 🍃'],
  bashful: ['Ngại quá đi à... hihi 🌿'],
  sleepy: ['Thư thái đến mức muốn ngủ một giấc luôn... 😴'],
  dizzy: ['Oa oa... chóng mặt quá chừng luôn rồi nè! 😵‍💫'],
};

const QUICK_SUGGESTIONS = [
  '🌿 Dịch vụ spa nổi bật nhất?',
  '💆 Trị liệu đau mỏi cổ vai gáy?',
  '⏰ Cách đặt lịch online?',
  '💳 Thanh toán bằng mã QR VietQR?',
];

const BOT_RESPONSES: Record<string, string> = {
  '🌿 Dịch vụ spa nổi bật nhất?':
    'Lunara Spa nổi tiếng nhất với liệu trình **Massage Thảo Mộc Cung Đình** (90 phút) và **Liệu Pháp Dưỡng Thể Tinh Dầu Trầm** 🌿. Các liệu trình đều dùng thảo dược tự nhiên 100% giúp ngủ sâu và giải tỏa stress cực tốt!',
  '💆 Trị liệu đau mỏi cổ vai gáy?':
    'Dạ có gói **Trị Liệu Dưỡng Sinh Cổ Vai Gáy chuyên sâu (60 phút)** giá chỉ 450.000đ. Kỹ thuật viên sẽ kết hợp chườm túi ngải cứu nóng và bấm huyệt đả thông kinh lạc, giảm đau mỏi tức thì đó ạ! 🎋',
  '⏰ Cách đặt lịch online?':
    'Bạn chỉ cần ấn nút **"Đặt lịch ngay"** trên thanh menu hoặc trang chủ, chọn ngày giờ và kỹ thuật viên yêu thích. Hệ thống sẽ giữ chỗ tức thì và gửi xác nhận qua email cho bạn ngay nhé! 📅',
  '💳 Thanh toán bằng mã QR VietQR?':
    'Sau khi chọn dịch vụ và bấm xác nhận, hệ thống sẽ tạo ngay **mã VietQR tự động** kèm số tiền chính xác. Bạn chỉ cần mở app ngân hàng quét mã 1 giây là thanh toán thành công liền nè! 💳✨',
};

export const MascotCompanion: React.FC<MascotCompanionProps> = ({
  directions = '/mascots/panda-directions.webp',
  reactions = '/mascots/panda-reactions.webp',
  size = 110,
  initialMessage = 'Chào bạn! Mình là Bé Trúc của Lunara Spa 🍃 Chạm vào mình hoặc mở chat trò chuyện nha!',
  className = '',
}) => {
  const [bubbleText, setBubbleText] = useState(initialMessage);
  const [showBubble, setShowBubble] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'mascot',
      text: 'Chào bạn! Mình là Bé Trúc 🐼🎋. Rất vui được đồng hành cùng bạn tại Lunara Spa! Bạn cần tư vấn dịch vụ hay đặt lịch cứ nhắn cho mình nhé!',
      time: 'Vừa xong',
      reaction: 'delighted',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isChatOpen]);

  const handleBoop = (reaction: Reaction, count: number) => {
    setShowBubble(true);
    if (reaction === 'dizzy') {
      setBubbleText('Oa oa... bạn bấm nhanh quá mình chóng mặt rồi nè! 😵‍💫💫');
      return;
    }
    const pool = BOOP_MESSAGES[reaction] || BOOP_MESSAGES.heart;
    const msg = pool[Math.floor(Math.random() * pool.length)];
    setBubbleText(msg);
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      time: 'Vừa xong',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    // Mock bot reply
    setTimeout(() => {
      let reply = BOT_RESPONSES[text];
      if (!reply) {
        // Fallback friendly reply
        reply = `Bé Trúc đã ghi nhận câu hỏi: "${text}" 🌿! Bạn có thể xem danh mục Dịch vụ hoặc bấm Đặt lịch để nhân viên Lunara Spa tiếp đón và phục vụ chu đáo nhất nhé! ✨`;
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'mascot',
        text: reply,
        time: 'Vừa xong',
        reaction: 'sparkle',
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 700);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-40 flex flex-col items-end pointer-events-none select-none transition-all duration-300 ${className}`}
    >
      {/* 1. CHAT DRAWER MODE */}
      {isChatOpen && (
        <div className="pointer-events-auto relative mb-3 w-[92vw] sm:w-[380px] h-[520px] max-h-[85vh] bg-[#FAF8F5] border-2 border-[#D8CEBF] shadow-2xl rounded-3xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 font-body">
          {/* Header với Bé Trúc Mascot tương tác */}
          <div className="relative px-4 py-3 bg-[#1E3B2B] text-white flex items-center justify-between border-b border-[#14271C]">
            <div className="flex items-center gap-3">
              {/* Mini Interactive Mascot in Header */}
              <div className="relative -my-1">
                <Mascot
                  directions={directions}
                  reactions={reactions}
                  size={52}
                  label="Bé Trúc Header"
                  className="hover:scale-110 transition-transform"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display font-semibold text-sm sm:text-base text-white tracking-wide">
                    Bé Trúc 🐼
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[11px] text-[#A3C9A8]">Trợ lý Lunara Spa • Trực tuyến</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                title="Thu nhỏ thành linh vật"
                aria-label="Thu nhỏ thành linh vật"
                className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                title="Đóng chat"
                aria-label="Đóng chat"
                className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF8F5]/90">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'mascot' && (
                  <div className="w-7 h-7 rounded-full bg-[#EBF3ED] border border-[#C5A880]/30 flex items-center justify-center text-xs shrink-0 mt-0.5">
                    🐼
                  </div>
                )}
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-[#1E3B2B] text-white rounded-br-xs'
                      : 'bg-white border border-[#E8DEC9] text-[#2C3E30] rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span
                    className={`block text-[10px] mt-1 ${
                      msg.sender === 'user' ? 'text-white/60 text-right' : 'text-stone-400'
                    }`}
                  >
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 items-center text-stone-400 text-xs pl-9">
                <span className="inline-flex gap-1 items-center bg-white border border-[#E8DEC9] px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E3B2B] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E3B2B] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E3B2B] animate-bounce [animation-delay:0.4s]" />
                </span>
                <span className="text-[11px] text-stone-500">Bé Trúc đang gõ...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-3 py-2 bg-[#F3EDE2]/60 border-t border-[#E8DEC9] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {QUICK_SUGGESTIONS.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(sug)}
                className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-white border border-[#D5C9B7] text-[#1E3B2B] hover:bg-[#1E3B2B] hover:text-white transition-all cursor-pointer shadow-2xs"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-[#E8DEC9] flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhắn tin với Bé Trúc..."
              className="flex-1 bg-[#FAF8F5] border border-[#D8CEBF] rounded-full px-4 py-2 text-xs sm:text-sm text-stone-800 focus:outline-none focus:border-[#1E3B2B] focus:ring-1 focus:ring-[#1E3B2B] transition-all"
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim()}
              aria-label="Gửi tin nhắn"
              className="w-9 h-9 rounded-full bg-[#1E3B2B] text-white hover:bg-[#14271C] disabled:opacity-40 flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-sm active:scale-95"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. COMPACT / FLOATING MASCOT MODE (when chat is not open) */}
      {!isChatOpen && (
        <>
          {/* Speech Bubble (Paper Card Style) */}
          {!isMinimized && showBubble && (
            <div className="pointer-events-auto relative mb-2 max-w-[220px] sm:max-w-[260px] bg-[#FAF8F5] border-2 border-[#E2D8CE] shadow-lg rounded-2xl p-3 text-xs sm:text-sm text-stone-700 font-sans animate-in fade-in slide-in-from-bottom-2 duration-300">
              <button
                type="button"
                onClick={() => setShowBubble(false)}
                aria-label="Đóng lời chào"
                className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-stone-200 text-stone-600 hover:bg-stone-300 flex items-center justify-center text-[10px] transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="flex items-start gap-1.5 leading-relaxed">
                <span>{bubbleText}</span>
              </div>
              {/* Nút mở Chat Drawer từ bong bóng */}
              <button
                type="button"
                onClick={() => setIsChatOpen(true)}
                className="mt-2 w-full py-1 px-2.5 rounded-xl bg-[#1E3B2B] text-white font-medium text-[11px] flex items-center justify-center gap-1.5 hover:bg-[#14271C] transition-colors cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-3 h-3" /> Chat với Bé Trúc
              </button>
              {/* Mũi tên trỏ xuống mascot */}
              <div className="absolute -bottom-2 right-8 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#E2D8CE]" />
            </div>
          )}

          {/* Mascot Card Container */}
          <div className="pointer-events-auto relative flex items-center justify-center group">
            {isMinimized ? (
              <button
                type="button"
                onClick={() => {
                  setIsMinimized(false);
                  setShowBubble(true);
                }}
                className="w-12 h-12 rounded-full bg-[#EBF3ED] border-2 border-[#A3C9A8] shadow-md flex items-center justify-center text-emerald-800 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="Mở Bé Trúc Mascot"
                aria-label="Mở Bé Trúc Mascot"
              >
                <span className="text-xl">🐼</span>
              </button>
            ) : (
              <div className="relative p-1 rounded-3xl bg-white/80 backdrop-blur-sm border border-[#EBE3D5] shadow-xl hover:shadow-2xl transition-all">
                {/* Nút thu nhỏ */}
                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  aria-label="Thu nhỏ Mascot"
                  className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full bg-stone-100 text-stone-400 hover:text-stone-700 hover:bg-stone-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Thu nhỏ"
                >
                  <X className="w-3 h-3" />
                </button>

                {/* Mascot Component */}
                <Mascot
                  directions={directions}
                  reactions={reactions}
                  size={size}
                  label="Bé Trúc Lunara"
                  onBoop={handleBoop}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
