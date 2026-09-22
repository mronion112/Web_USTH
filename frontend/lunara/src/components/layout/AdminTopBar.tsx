import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Search, Bell, Clock, ExternalLink, Shield, MessageSquare } from 'lucide-react';
import { notificationsApi, ApiNotification } from '@/lib/api';
import { useRefresh } from '@/lib/use-refresh';
import { useAdminChat } from '@/contexts/AdminChatContext';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  link?: string;
}

export const AdminTopBar: React.FC = () => {
  const { role } = useAuth();
  const { chatMode, toggleChat, unreadCount: unreadChatCount } = useAdminChat();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [expandAll, setExpandAll] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const notifRef = React.useRef<HTMLDivElement>(null);

  const formatEventTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} giờ trước`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} ngày trước`;
    } catch {
      return isoString;
    }
  };

  const getEventTitle = (eventType: string, bookingCode?: string) => {
    const code = bookingCode ? ` (#${bookingCode})` : '';
    switch (eventType) {
      case 'CREATED':
        return `Lịch hẹn mới được đặt${code}`;
      case 'CHECKED_IN':
        return `Khách đã check-in${code}`;
      case 'SERVICE_STARTED':
        return `Bắt đầu ca phục vụ${code}`;
      case 'COMPLETED':
        return `Hoàn thành ca trị liệu${code}`;
      case 'PAYMENT_RECEIVED':
        return `Thanh toán thành công${code}`;
      case 'PAYMENT_REFUNDED':
        return `Đã hoàn tiền${code}`;
      case 'RESCHEDULED':
        return `Lịch hẹn đã đổi giờ${code}`;
      case 'STAFF_ASSIGNED':
        return `Phân bổ kỹ thuật viên${code}`;
      default:
        return `Sự kiện hệ thống${code}`;
    }
  };

  const getEventLink = (eventType: string) => {
    switch (eventType) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_REFUNDED':
        return '/admin/payments';
      case 'SERVICE_STARTED':
      case 'CHECKED_IN':
        return '/admin/live';
      default:
        return '/admin/booking';
    }
  };

  const loadNotifications = useCallback(async (signal?: AbortSignal) => {
    try {
      const list = await notificationsApi.getRecent(expandAll ? 30 : 10, 0, signal);
      if (Array.isArray(list)) {
        const mapped: NotificationItem[] = list.map((n: ApiNotification) => ({
          id: String(n.id),
          type: n.eventType,
          title: getEventTitle(n.eventType, n.bookingCode),
          description: n.message || `Cập nhật trạng thái ${n.eventType}`,
          time: formatEventTime(n.occurredAt),
          read: false,
          link: getEventLink(n.eventType),
        }));
        setNotifications((current) => {
          const readIds = new Set(current.filter((item) => item.read).map((item) => item.id));
          return mapped.map((item) => ({ ...item, read: readIds.has(item.id) }));
        });
      }
    } catch {
      // Ignore if offline
    }
  }, [expandAll]);

  useRefresh('notification', loadNotifications, ['OWNER', 'MANAGER', 'RECEPTIONIST'].includes(role));

  const unreadCount = notifications.filter((n) => !n.read).length;
  const displayedNotifications = expandAll ? notifications : notifications.slice(0, 5);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live ticking clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = window.setTimeout(updateTime, 1000);
    return () => clearTimeout(timer);
  }, [currentTime]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/admin/booking?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    setNotifOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  return (
    <header className="h-20 bg-white border-b border-[#E2E8E3] px-6 lg:px-8 flex items-center justify-between font-body z-10 relative">
      {/* Search Input (Mã vé / tra cứu nhanh) */}
      <form onSubmit={handleSearch} className="relative w-full max-w-md hidden sm:block">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8EAA97]" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tra cứu nhanh mã vé (vd: LNR-001) hoặc tên khách..."
          className="pl-10 h-10 text-xs bg-[#F8F9F5] border-[#E2E8E3] rounded-full focus-visible:ring-[#1E3B2B]"
        />
      </form>

      {/* Right Tools: Live Clock, Notifications, Profile */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Real-time Clock */}
        <div className="hidden lg:flex items-center gap-2 rounded-full bg-[#F8F9F5] px-3.5 py-1.5 border border-[#E2E8E3] text-xs font-semibold text-[#14271C]">
          <Clock className="h-3.5 w-3.5 text-[#1E3B2B]" />
          <span>{currentTime || '--:--:--'}</span>
        </div>

        {/* Server-assigned role */}
        <div className="flex items-center gap-1.5 rounded-full bg-[#E8F5E9] px-3 py-1 border border-[#2E7D32]/20 text-xs">
          <Shield className="h-3.5 w-3.5 text-[#2E7D32]" />
          <span className="text-xs font-semibold text-[#1E3B2B]">{role}</span>
        </div>

        {/* Admin Ops Chat Trigger Button */}
        <button
          type="button"
          onClick={toggleChat}
          title="Mở thanh trò chuyện điều phối (Ctrl + /)"
          className={`relative p-2 rounded-full transition-colors cursor-pointer ${
            chatMode !== 'hidden'
              ? 'bg-[#1E3B2B] text-white hover:bg-[#14271C]'
              : 'text-[#526056] hover:bg-[#F8F9F5] hover:text-[#14271C]'
          }`}
        >
          <MessageSquare className="h-5 w-5" />
          {unreadChatCount > 0 && chatMode === 'hidden' && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-xs leading-none">
              {unreadChatCount}
            </span>
          )}
        </button>

        {/* Notification Bell with Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifOpen((prev) => !prev)}
            title="Thông báo hệ thống"
            className="relative p-2 rounded-full text-[#526056] hover:bg-[#F8F9F5] hover:text-[#14271C] transition-colors cursor-pointer"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#BA1A1A] text-[10px] font-bold text-white shadow-xs leading-none">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Modal */}
          {notifOpen && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white shadow-luxury border border-[#E2E8E3] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 font-body">
              {/* Dropdown Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#E2E8E3] bg-[#F8F9F5]">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-[#14271C]">Thông báo</h3>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-[#1E3B2B] px-2 py-0.5 text-[10px] font-bold text-white">
                      {unreadCount} mới
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-[11px] font-medium text-[#1E3B2B] hover:underline cursor-pointer"
                  >
                    Đánh dấu đã đọc
                  </button>
                )}
              </div>

              {/* Notification List (offset = 5 or expand all) */}
              <div className="max-h-96 overflow-y-auto divide-y divide-[#E2E8E3]">
                {displayedNotifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#8EAA97]">Không có thông báo mới</div>
                ) : (
                  displayedNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3.5 text-xs transition-colors cursor-pointer hover:bg-[#F8F9F5] flex items-start gap-3 ${
                        !notif.read ? 'bg-[#E8F5E9]/30' : ''
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                          !notif.read ? 'bg-[#2E7D32]' : 'bg-transparent'
                        }`}
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#14271C]">{notif.title}</span>
                          <span className="text-[10px] text-[#8EAA97]">{notif.time}</span>
                        </div>
                        <p className="text-[11px] text-[#526056] leading-relaxed">
                          {notif.description}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Dropdown Footer: Toggle Expand All */}
              <div className="p-3 border-t border-[#E2E8E3] bg-[#F8F9F5] text-center">
                {notifications.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setExpandAll((prev) => !prev)}
                    className="text-xs font-semibold text-[#1E3B2B] hover:underline cursor-pointer"
                  >
                    {expandAll
                      ? 'Thu gọn về 5 thông báo'
                      : `Xem tất cả thông báo (${notifications.length})`}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* View Customer Website link */}
        <button
          onClick={() => navigate('/')}
          className="hidden sm:flex items-center gap-1 text-xs font-medium text-[#526056] hover:text-[#1E3B2B] border border-[#E2E8E3] px-3 py-1.5 rounded-full"
        >
          <span>Xem web khách</span>
          <ExternalLink className="h-3 w-3 text-[#8EAA97]" />
        </button>
      </div>
    </header>
  );
};
