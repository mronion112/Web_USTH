import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Users,
  Bot,
  Send,
  Maximize2,
  Minimize2,
  X,
  Minus,
  PanelRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export type AdminChatMode = 'hidden' | 'floating' | 'drawer' | 'fullscreen' | 'minimized' | 'docked';

interface AdminChatSidebarProps {
  mode: AdminChatMode;
  onModeChange: (mode: AdminChatMode) => void;
  className?: string;
}

type ChannelType = 'internal' | 'customer' | 'copilot';

interface ChatMessage {
  id: string;
  senderName: string;
  senderRole?: string;
  isSelf: boolean;
  avatarInitials?: string;
  avatarBg?: string;
  text: string;
  time: string;
}

interface OnlineStaff {
  name: string;
  role: string;
  status: 'online' | 'busy' | 'break';
  avatarInitials: string;
  avatarBg: string;
}

const MOCK_ONLINE_STAFF: OnlineStaff[] = [
  { name: 'Lễ tân Mai Anh', role: 'Lễ tân sảnh', status: 'online', avatarInitials: 'MA', avatarBg: 'bg-rose-100 text-rose-700' },
  { name: 'KTV Hoàng Nam', role: 'KTV Trị liệu', status: 'busy', avatarInitials: 'HN', avatarBg: 'bg-emerald-100 text-emerald-700' },
  { name: 'KTV Lan Hương', role: 'KTV Chăm sóc da', status: 'online', avatarInitials: 'LH', avatarBg: 'bg-amber-100 text-amber-700' },
  { name: 'Quản lý Đức', role: 'Quản lý cơ sở', status: 'online', avatarInitials: 'QL', avatarBg: 'bg-indigo-100 text-indigo-700' },
];

const MOCK_CHANNELS = [
  {
    id: 'internal' as ChannelType,
    name: 'Kênh Nội bộ',
    shortName: 'Nội bộ',
    icon: Users,
    desc: 'Trao đổi nghiệp vụ giữa Lễ tân, Kỹ thuật viên & Quản lý',
    unread: 2,
  },
  {
    id: 'customer' as ChannelType,
    name: 'CSKH Trực tuyến',
    shortName: 'Khách hàng',
    icon: MessageSquare,
    desc: 'Hội thoại trực tiếp từ khách hàng trên Website & Mascot',
    unread: 1,
  },
  {
    id: 'copilot' as ChannelType,
    name: 'Trợ lý AI Copilot',
    shortName: 'AI Copilot',
    icon: Bot,
    desc: 'Trợ lý thông minh tra cứu phòng trống, doanh thu & nhân sự',
    unread: 0,
  },
];

const INITIAL_MESSAGES: Record<ChannelType, ChatMessage[]> = {
  internal: [
    {
      id: 'i1',
      senderName: 'Lễ tân Mai Anh',
      senderRole: 'Lễ tân',
      isSelf: false,
      avatarInitials: 'MA',
      avatarBg: 'bg-rose-100 text-rose-700',
      text: 'Phòng VIP 1 đã chuẩn bị xong tinh dầu sả chanh cho ca 10:30 của khách Trần Minh rồi nhé ạ! 🌿',
      time: '10:15',
    },
    {
      id: 'i2',
      senderName: 'KTV Hoàng Nam',
      senderRole: 'Kỹ thuật viên',
      isSelf: false,
      avatarInitials: 'HN',
      avatarBg: 'bg-emerald-100 text-emerald-700',
      text: 'Mình đã nhận ca rồi nhé, đang khử khuẩn thiết bị đá nóng.',
      time: '10:18',
    },
    {
      id: 'i3',
      senderName: 'Quản lý',
      senderRole: 'Quản lý',
      isSelf: true,
      avatarInitials: 'QL',
      avatarBg: 'bg-[#1E3B2B] text-white',
      text: 'Tốt lắm, ca chiều có 3 khách đoàn, lễ tân chú ý sắp xếp phòng thảo mộc đôi nhé.',
      time: '10:20',
    },
  ],
  customer: [
    {
      id: 'c1',
      senderName: 'Chị Nguyễn Hoài',
      senderRole: 'Khách hàng',
      isSelf: false,
      avatarInitials: 'NH',
      avatarBg: 'bg-amber-100 text-amber-800',
      text: 'Chào Spa, mình muốn hỏi gói Massage đá nóng 90 phút chiều nay lúc 15:00 còn chỗ không ạ?',
      time: '10:22',
    },
    {
      id: 'c2',
      senderName: 'Lễ tân Mai Anh',
      senderRole: 'Lễ tân',
      isSelf: false,
      avatarInitials: 'MA',
      avatarBg: 'bg-rose-100 text-rose-700',
      text: 'Dạ chào chị Hoài! Chiều nay khung giờ 15:00 còn 1 phòng thảo mộc view vườn rất đẹp ạ. Em xin số điện thoại để giữ chỗ giúp chị nhé?',
      time: '10:24',
    },
  ],
  copilot: [
    {
      id: 'p1',
      senderName: 'Spa AI Copilot',
      senderRole: 'AI Trợ lý',
      isSelf: false,
      avatarInitials: '🤖',
      avatarBg: 'bg-emerald-100 text-emerald-800',
      text: 'Xin chào! Mình là Trợ lý AI Copilot của Lunara Spa. Hôm nay có 18 lượt đặt lịch, 4 ca đang phục vụ và 2 phòng trị liệu trống sẵn sàng tiếp khách. Bạn cần hỗ trợ tra cứu thông tin gì?',
      time: '10:00',
    },
  ],
};

const SUGGESTIONS_BY_CHANNEL: Record<ChannelType, string[]> = {
  internal: [
    '🌿 Phòng trị liệu đã chuẩn bị xong!',
    '💆 KTV đã tiếp nhận ca mới',
    '📍 Khách đã check-in quầy lễ tân',
    '💳 Đã xác nhận mã QR thanh toán',
  ],
  customer: [
    'Dạ em chào anh/chị, em có thể hỗ trợ gì ạ?',
    'Dạ dịch vụ bên em đang có ưu đãi 15% hôm nay ạ',
    'Dạ em đã giữ chỗ cho mình lúc 15:00 rồi nhé!',
    'Dạ mã QR thanh toán đã được gửi qua email ạ',
  ],
  copilot: [
    '📊 Doanh thu hôm nay bao nhiêu?',
    '🌿 Kiểm tra phòng trống ca chiều',
    '💆 Danh sách KTV đang rảnh ca',
    '📈 Tỷ lệ hoàn thành lịch hẹn tuần này',
  ],
};

export const AdminChatSidebar: React.FC<AdminChatSidebarProps> = ({
  mode,
  onModeChange,
  className = '',
}) => {
  const { user } = useAuth();
  const [activeChannel, setActiveChannel] = useState<ChannelType>('internal');
  const [messagesByChannel, setMessagesByChannel] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isCopilotTyping, setIsCopilotTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Normalized mode: 'docked' -> 'floating'
  const effectiveMode = mode === 'docked' ? 'floating' : mode;

  const currentMessages = messagesByChannel[activeChannel] || [];
  const currentSuggestions = SUGGESTIONS_BY_CHANNEL[activeChannel] || [];
  const activeChannelMeta = MOCK_CHANNELS.find((c) => c.id === activeChannel) || MOCK_CHANNELS[0];
  const totalUnread = MOCK_CHANNELS.reduce((acc, c) => acc + c.unread, 0);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, isCopilotTyping, activeChannel]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        onModeChange(effectiveMode === 'hidden' ? 'floating' : 'hidden');
      } else if (e.key === 'Escape' && effectiveMode !== 'hidden') {
        if (effectiveMode === 'fullscreen') {
          onModeChange('floating');
        } else {
          onModeChange('hidden');
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [effectiveMode, onModeChange]);

  // 1. HIDDEN MODE
  if (effectiveMode === 'hidden') {
    return null;
  }

  // 2. MINIMIZED MODE: Nút nổi nhỏ gọn thanh lịch ở góc dưới bên phải
  if (effectiveMode === 'minimized') {
    return (
      <div className="fixed bottom-5 right-6 z-50 animate-fadeIn">
        <button
          type="button"
          onClick={() => onModeChange('floating')}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#1E3B2B] text-white shadow-2xl hover:bg-[#14271C] hover:scale-105 active:scale-95 transition-all cursor-pointer font-medium text-xs border border-white/20 group"
          title="Mở rộng cửa sổ chat (Cmd + /)"
        >
          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[#C5A880]">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <span className="font-display font-medium tracking-wide">Lunara Chat Ops</span>
          {totalUnread > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {totalUnread}
            </span>
          )}
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      </div>
    );
  }

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderName: user?.displayName || 'Tôi',
      senderRole: user?.roleCode || 'QUẢN LÝ',
      isSelf: true,
      avatarInitials: (user?.displayName || 'Tôi').slice(0, 2).toUpperCase(),
      avatarBg: 'bg-[#1E3B2B] text-white',
      text,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessagesByChannel((prev) => ({
      ...prev,
      [activeChannel]: [...prev[activeChannel], newMsg],
    }));
    setInputText('');

    // Phản hồi AI Copilot thông minh
    if (activeChannel === 'copilot') {
      setIsCopilotTyping(true);
      setTimeout(() => {
        let copilotReply = `Copilot đã phân tích yêu cầu: "${text}". Dữ liệu vận hành hệ thống Lunara đang ở trạng thái tối ưu (95% công suất ca làm).`;
        const lower = text.toLowerCase();
        if (lower.includes('doanh thu') || lower.includes('tiền')) {
          copilotReply = '📊 Báo cáo doanh thu ghi nhận hôm nay đạt **14.850.000đ** (12 giao dịch VietQR, 2 tiền mặt). Tỷ lệ thanh toán hoàn tất 100%.';
        } else if (lower.includes('phòng') || lower.includes('trống')) {
          copilotReply = '🌿 Hiện tại còn **Phòng Đơn 03** và **Phòng Đôi Thảo Mộc 01** trống từ 14:00 đến 17:00, sẵn sàng nhận khách đặt lịch.';
        } else if (lower.includes('ktv') || lower.includes('kỹ thuật') || lower.includes('rảnh')) {
          copilotReply = '💆 Đang có 6/8 Kỹ thuật viên trong ca trị liệu. KTV Lan Hương và Minh Tuấn sắp hoàn thành ca lúc 11:15.';
        } else if (lower.includes('tuần') || lower.includes('tỷ lệ') || lower.includes('lịch hẹn')) {
          copilotReply = '📈 Tuần này Lunara tiếp nhận 142 lịch hẹn, tỷ lệ đến đúng giờ đạt **94.2%**, số lịch hủy trước 2 tiếng là 3 ca.';
        }

        const replyMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          senderName: 'Spa AI Copilot',
          senderRole: 'AI Trợ lý',
          isSelf: false,
          avatarInitials: '🤖',
          avatarBg: 'bg-emerald-100 text-emerald-800',
          text: copilotReply,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        };

        setMessagesByChannel((prev) => ({
          ...prev,
          copilot: [...prev.copilot, replyMsg],
        }));
        setIsCopilotTyping(false);
      }, 700);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 3. FULLSCREEN MODE: 2 Cột Chuyên nghiệp (Workspace View)
  if (effectiveMode === 'fullscreen') {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF8F5]/90 backdrop-blur-md flex flex-col font-body animate-fadeIn">
        {/* Fullscreen Top Navigation Bar */}
        <header className="h-16 px-6 bg-white border-b border-stone-200/80 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1E3B2B] text-[#C5A880] flex items-center justify-center shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-base text-stone-900">
                  Trung tâm Điều phối & Trao đổi Vận hành
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-stone-500 font-light">
                Lunara Spa Operations • Kết nối Lễ tân, Trị liệu & Khách hàng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onModeChange('floating')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
              title="Thu về cửa sổ nổi góc phải"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Cửa sổ nổi</span>
            </button>
            <button
              type="button"
              onClick={() => onModeChange('hidden')}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Đóng cửa sổ chat (Esc)"
              aria-label="Đóng chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Fullscreen 2-Column Content Body */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Panel: Channels & Staff List */}
          <aside className="w-80 bg-white border-r border-stone-200/80 flex flex-col shrink-0">
            <div className="p-4 border-b border-stone-100">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">
                Kênh hội thoại
              </h2>
              <div className="space-y-1.5">
                {MOCK_CHANNELS.map((ch) => {
                  const Icon = ch.icon;
                  const isActive = activeChannel === ch.id;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setActiveChannel(ch.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#1E3B2B] text-white shadow-xs'
                          : 'hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isActive ? 'bg-white/10 text-[#C5A880]' : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{ch.name}</p>
                          <p
                            className={`text-[11px] truncate ${
                              isActive ? 'text-white/70' : 'text-stone-400'
                            }`}
                          >
                            {ch.shortName}
                          </p>
                        </div>
                      </div>
                      {ch.unread > 0 && !isActive && (
                        <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                          {ch.unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Online Staff Directory */}
            <div className="flex-1 overflow-y-auto p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3 flex items-center justify-between">
                <span>Nhân sự đang trực</span>
                <span className="text-emerald-600 font-medium lowercase">4 online</span>
              </h2>
              <div className="space-y-2.5">
                {MOCK_ONLINE_STAFF.map((staff, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${staff.avatarBg}`}
                        >
                          {staff.avatarInitials}
                        </div>
                        <span
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                            staff.status === 'online'
                              ? 'bg-emerald-500'
                              : staff.status === 'busy'
                                ? 'bg-amber-500'
                                : 'bg-stone-300'
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-stone-800">{staff.name}</p>
                        <p className="text-[10px] text-stone-400">{staff.role}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-stone-400 font-mono">Ca sáng</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Right Panel: Spacious Conversation Canvas */}
          <main className="flex-1 flex flex-col bg-[#FCFBF9] min-w-0">
            {/* Active Header */}
            <div className="h-14 px-6 bg-white/80 backdrop-blur-xs border-b border-stone-200/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <activeChannelMeta.icon className="w-5 h-5 text-[#1E3B2B]" />
                <div>
                  <h3 className="text-sm font-semibold text-stone-900">
                    {activeChannelMeta.name}
                  </h3>
                  <p className="text-[11px] text-stone-500">{activeChannelMeta.desc}</p>
                </div>
              </div>
            </div>

            {/* Conversation Flow */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
              <div className="max-w-4xl mx-auto space-y-5">
                <div className="flex items-center justify-center my-2">
                  <span className="text-[11px] text-stone-400 bg-stone-100 px-3 py-1 rounded-full border border-stone-200/60 font-medium">
                    Hôm nay, 20 Tháng 9
                  </span>
                </div>

                {currentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${
                      msg.isSelf ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 shadow-2xs ${
                        msg.avatarBg || 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {msg.avatarInitials || 'NV'}
                    </div>
                    <div
                      className={`max-w-xl flex flex-col ${
                        msg.isSelf ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-xs font-medium text-stone-700">{msg.senderName}</span>
                        {msg.senderRole && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 font-medium">
                            {msg.senderRole}
                          </span>
                        )}
                        <span className="text-[11px] text-stone-400">{msg.time}</span>
                      </div>
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-2xs ${
                          msg.isSelf
                            ? 'bg-[#1E3B2B] text-white rounded-tr-xs'
                            : 'bg-white border border-stone-200/80 text-stone-800 rounded-tl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {isCopilotTyping && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm shadow-2xs">
                      🤖
                    </div>
                    <div className="bg-white border border-emerald-200 rounded-2xl rounded-tl-xs px-4 py-3 text-xs text-stone-600 flex items-center gap-2 shadow-2xs">
                      <span className="inline-flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
                      </span>
                      <span>Copilot đang phân tích số liệu hệ thống...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Quick Suggestions Chips */}
            <div className="px-8 py-2.5 bg-white/70 border-t border-stone-200/60">
              <div className="max-w-4xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-xs text-stone-400 font-medium shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Gợi ý:
                </span>
                {currentSuggestions.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSend(sug)}
                    className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-white border border-stone-200 hover:border-emerald-600 hover:bg-emerald-50/40 text-stone-700 hover:text-emerald-800 transition-all cursor-pointer shadow-2xs"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Composer */}
            <div className="p-6 bg-white border-t border-stone-200/80">
              <div className="max-w-4xl mx-auto flex items-center gap-3">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Gửi tin nhắn trong ${activeChannelMeta.name}...`}
                  className="flex-1 bg-[#FAF8F5] border border-stone-200 rounded-2xl px-5 py-3 text-sm text-stone-800 focus:outline-none focus:border-[#1E3B2B] focus:ring-2 focus:ring-[#1E3B2B]/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!inputText.trim()}
                  className="h-11 px-5 rounded-2xl bg-[#1E3B2B] text-white hover:bg-[#14271C] disabled:opacity-40 flex items-center gap-2 font-medium text-sm transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <span>Gửi</span>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Common inner content for FLOATING and DRAWER modes
  const isDrawer = effectiveMode === 'drawer';

  return (
    <>
      {/* Khi ở chế độ Drawer: Có Backdrop mờ nhẹ phủ lên màn hình để tập trung */}
      {isDrawer && (
        <div
          className="fixed inset-0 bg-stone-900/20 backdrop-blur-2xs z-40 animate-fadeIn"
          onClick={() => onModeChange('hidden')}
        />
      )}

      <div
        className={`bg-white border border-stone-200/90 flex flex-col font-body z-50 transition-all duration-300 shadow-2xl ${
          isDrawer
            ? 'fixed inset-y-0 right-0 w-full sm:w-[460px] h-full rounded-none border-l'
            : 'fixed bottom-5 right-6 w-[calc(100vw-2rem)] sm:w-[430px] h-[600px] max-h-[calc(100vh-80px)] rounded-2xl overflow-hidden'
        } ${className}`}
      >
        {/* 1. Header: Nhẹ nhàng, sang trọng, đầy đủ nút điều khiển */}
        <div className="h-14 px-4 border-b border-stone-100 bg-white flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-stone-200/80 flex items-center justify-center text-[#1E3B2B] shrink-0 shadow-2xs">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-semibold text-xs sm:text-sm text-stone-900 leading-tight truncate flex items-center gap-1.5">
                <span>Lunara Chat Ops</span>
                <span className="inline-flex items-center gap-1 text-[9px] font-normal px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            {/* Nút Thu nhỏ xuống thanh pill */}
            <button
              type="button"
              onClick={() => onModeChange('minimized')}
              title="Thu nhỏ cửa sổ"
              aria-label="Thu nhỏ cửa sổ"
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            {/* Nút chuyển đổi giữa Cửa sổ nổi và Slide-over Drawer */}
            <button
              type="button"
              onClick={() => onModeChange(isDrawer ? 'floating' : 'drawer')}
              title={isDrawer ? 'Chuyển sang Cửa sổ nổi' : 'Chuyển sang Trượt cạnh phải (Drawer)'}
              aria-label="Chuyển chế độ hiển thị"
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <PanelRight className={`w-3.5 h-3.5 ${isDrawer ? 'text-[#1E3B2B]' : ''}`} />
            </button>

            {/* Nút Phóng to toàn màn hình */}
            <button
              type="button"
              onClick={() => onModeChange('fullscreen')}
              title="Mở rộng toàn màn hình"
              aria-label="Mở rộng toàn màn hình"
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Nút Đóng */}
            <button
              type="button"
              onClick={() => onModeChange('hidden')}
              title="Đóng cửa sổ chat (Cmd + /)"
              aria-label="Đóng cửa sổ chat"
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Channel Switcher: Segmented Pill */}
        <div className="px-3.5 py-2 bg-[#FAF8F5] border-b border-stone-200/70 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-stone-200/60 rounded-xl">
            {MOCK_CHANNELS.map((ch) => {
              const Icon = ch.icon;
              const isActive = activeChannel === ch.id;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setActiveChannel(ch.id)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-white/40'
                  }`}
                >
                  <Icon className={`w-3 h-3 ${isActive ? 'text-[#1E3B2B]' : 'text-stone-400'}`} />
                  <span className="truncate">{ch.shortName}</span>
                  {ch.unread > 0 && !isActive && (
                    <span className="w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {ch.unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-stone-400 mt-1.5 px-1 truncate flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-stone-400" />
            {activeChannelMeta.desc}
          </p>
        </div>

        {/* 3. Messages Stream: Rộng rãi, sạch sẽ */}
        <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-3.5 bg-[#FCFBF9]">
          <div className="flex items-center justify-center my-1">
            <span className="text-[10px] text-stone-400 bg-white border border-stone-200/60 px-2.5 py-0.5 rounded-full font-medium shadow-2xs">
              Hôm nay, 20/09
            </span>
          </div>

          {currentMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                msg.isSelf ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 shadow-2xs ${
                  msg.avatarBg || 'bg-stone-200 text-stone-700'
                }`}
              >
                {msg.avatarInitials || 'NV'}
              </div>

              <div
                className={`max-w-[82%] flex flex-col ${
                  msg.isSelf ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[11px] font-medium text-stone-700">{msg.senderName}</span>
                  {msg.senderRole && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-500 font-medium">
                      {msg.senderRole}
                    </span>
                  )}
                  <span className="text-[10px] text-stone-400">{msg.time}</span>
                </div>

                <div
                  className={`rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-2xs ${
                    msg.isSelf
                      ? 'bg-[#1E3B2B] text-white rounded-tr-xs'
                      : 'bg-white border border-stone-200/80 text-stone-800 rounded-tl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            </div>
          ))}

          {isCopilotTyping && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs shrink-0 shadow-2xs">
                🤖
              </div>
              <div className="bg-white border border-emerald-200 rounded-2xl rounded-tl-xs px-3 py-1.5 text-xs text-stone-600 flex items-center gap-2 shadow-2xs">
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
                </span>
                <span className="text-[11px]">AI Copilot đang tra cứu...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 4. Quick Suggestions */}
        <div className="px-3.5 py-1.5 bg-white border-t border-stone-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] text-stone-400 shrink-0">Gợi ý:</span>
          {currentSuggestions.map((sug, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(sug)}
              className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-stone-200/70 hover:border-emerald-600 hover:bg-emerald-50 text-stone-700 hover:text-emerald-900 transition-all cursor-pointer"
            >
              {sug}
            </button>
          ))}
        </div>

        {/* 5. Input Composer */}
        <div className="p-3 bg-white border-t border-stone-200/80 shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                activeChannel === 'copilot'
                  ? 'Hỏi AI: Doanh thu, phòng trống...'
                  : 'Nhập tin nhắn...'
              }
              className="flex-1 bg-[#FAF8F5] border border-stone-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-stone-800 focus:outline-none focus:border-[#1E3B2B] focus:ring-1 focus:ring-[#1E3B2B] transition-all"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!inputText.trim()}
              aria-label="Gửi tin nhắn"
              className="w-9 h-9 rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] disabled:opacity-40 flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-xs active:scale-95"
            >
              <Send className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
          <div className="mt-1 flex items-center justify-between text-[9px] text-stone-400 px-1">
            <span>Cmd + / để ẩn/hiện</span>
            <span>Enter để gửi</span>
          </div>
        </div>
      </div>
    </>
  );
};
