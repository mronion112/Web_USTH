import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Radio, Clock, User, CheckCircle, Play, Bell, AlertTriangle } from 'lucide-react';

interface ActiveBooking {
  id: string;
  timeRange: string;
  customer: string;
  service: string;
  duration: string;
  staff: string;
  status: 'CHECKED_IN' | 'IN_SERVICE' | 'UPCOMING';
}

export const LivePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showToast, setShowToast] = useState(true);

  // Live seconds clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const [activeBookings, setActiveBookings] = useState<ActiveBooking[]>([
    {
      id: 'LNR-010',
      timeRange: '14:00 → 15:00',
      customer: 'Nguyễn Văn An',
      service: 'Massage Thư Giãn',
      duration: '60m',
      staff: 'Linh Nguyễn',
      status: 'CHECKED_IN',
    },
    {
      id: 'LNR-011',
      timeRange: '14:15 → 15:15',
      customer: 'Phạm Minh Bình',
      service: 'Trị Liệu Thảo Dược',
      duration: '60m',
      staff: 'Hoa Lê',
      status: 'IN_SERVICE',
    },
    {
      id: 'LNR-012',
      timeRange: '14:30 → 15:15',
      customer: 'Trần Thu Châu',
      service: 'Chăm Sóc Da Mặt',
      duration: '45m',
      staff: 'Mai Trần',
      status: 'UPCOMING',
    },
  ]);

  const handleUpdateStatus = (id: string, newStatus: 'CHECKED_IN' | 'IN_SERVICE' | 'UPCOMING') => {
    setActiveBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    );
  };

  return (
    <div className="space-y-8 font-body max-w-7xl mx-auto relative pb-16">
      {/* Live Operations Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8E3] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-semibold text-[#14271C]">
              Live Operations
            </h1>
            <span className="flex items-center gap-1.5 rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
              LIVE
            </span>
          </div>
          <p className="text-xs text-[#6B726C] mt-1">
            Chủ Nhật · 14 Tháng 9 2026 · Điều phối khách & kỹ thuật viên tức thời
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-[#E2E8E3] text-sm font-mono font-bold text-[#1E3B2B] shadow-2xs">
            <Clock className="h-4 w-4 text-[#8EAA97]" />
            <span>{currentTime || '14:23:08'}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: 'all', label: 'Tất cả (24)' },
          { key: 'upcoming', label: 'Sắp đến (8)' },
          { key: 'arrived', label: 'Đã check-in (2)' },
          { key: 'in_service', label: 'Đang phục vụ (5)' },
          { key: 'completed', label: 'Hoàn thành (9)' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'bg-[#1E3B2B] text-white shadow-sm'
                : 'bg-white text-[#526056] border border-[#E2E8E3] hover:border-[#1E3B2B]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* NOW SECTION: Interactive Active Booking Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-[#14271C]">
            ĐANG DIỄN RA (NOW)
          </h2>
          <span className="text-xs text-[#8EAA97]">3 ca phục vụ trọng điểm</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {activeBookings.map((booking) => (
            <Card key={booking.id} className="border border-[#E2E8E3] shadow-luxury hover:shadow-luxury-hover transition-all">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1E3B2B] bg-[#E8F5E9] px-2.5 py-1 rounded-lg">
                    {booking.timeRange}
                  </span>
                  <span className="text-xs font-mono text-[#8EAA97]">#{booking.id}</span>
                </div>

                <div>
                  <h3 className="font-display font-semibold text-lg text-[#14271C]">
                    {booking.customer}
                  </h3>
                  <p className="text-xs text-[#526056] mt-0.5">
                    {booking.service} · {booking.duration}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E2E8E3] flex items-center justify-between text-xs">
                  <span className="text-[#6B726C]">KTV: <strong className="text-[#14271C]">{booking.staff}</strong></span>
                  <Badge
                    variant={
                      booking.status === 'IN_SERVICE'
                        ? 'default'
                        : booking.status === 'CHECKED_IN'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {booking.status === 'IN_SERVICE'
                      ? '● ĐANG TRỊ LIỆU'
                      : booking.status === 'CHECKED_IN'
                      ? '● ĐÃ ĐẾN SPA'
                      : '○ SẮP TỚI'}
                  </Badge>
                </div>

                {/* 1-Click Operations Status Button */}
                <div className="pt-2">
                  {booking.status === 'CHECKED_IN' && (
                    <Button
                      onClick={() => handleUpdateStatus(booking.id, 'IN_SERVICE')}
                      className="w-full h-10 rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs font-semibold"
                    >
                      <Play className="h-3.5 w-3.5 mr-1 text-[#C5A880]" />
                      Bắt đầu phục vụ
                    </Button>
                  )}

                  {booking.status === 'IN_SERVICE' && (
                    <Button
                      onClick={() => handleUpdateStatus(booking.id, 'CHECKED_IN')}
                      className="w-full h-10 rounded-xl bg-[#2E7D32] text-white hover:bg-[#1b5e20] text-xs font-semibold"
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Hoàn thành liệu trình
                    </Button>
                  )}

                  {booking.status === 'UPCOMING' && (
                    <Button
                      onClick={() => handleUpdateStatus(booking.id, 'CHECKED_IN')}
                      variant="outline"
                      className="w-full h-10 rounded-xl text-xs font-semibold hover:bg-[#1E3B2B]/5"
                    >
                      Check-in khách
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* UPCOMING SECTION: Queue List */}
      <div className="space-y-4 pt-4">
        <h2 className="font-display text-xl font-semibold text-[#14271C]">
          LỊCH HẸN TIẾP THEO (UPCOMING)
        </h2>

        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-[#E2E8E3]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 px-6 text-xs gap-3 hover:bg-[#F8F9F5]">
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-[#1E3B2B] bg-[#E8F5E9] px-2 py-1 rounded">15:00</span>
                  <span className="font-medium text-[#14271C]">Nguyễn Văn An</span>
                  <span className="text-[#6B726C]">Massage Thư Giãn</span>
                  <span className="text-[#8EAA97]">KTV: Linh Nguyễn</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">ĐÃ XÁC NHẬN</Badge>
                  <Button size="sm" variant="outline" className="h-8 text-xs">
                    Check In
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 px-6 text-xs gap-3 hover:bg-[#F8F9F5]">
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-[#1E3B2B] bg-[#E8F5E9] px-2 py-1 rounded">15:30</span>
                  <span className="font-medium text-[#14271C]">Lê Thị Bích</span>
                  <span className="text-[#6B726C]">Chăm Sóc Da Mặt</span>
                  <span className="text-[#8EAA97]">KTV: Mai Trần</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">ĐÃ XÁC NHẬN</Badge>
                  <Button size="sm" variant="outline" className="h-8 text-xs">
                    Check In
                  </Button>
                </div>
              </div>

              {/* Need Staff Alert Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 px-6 text-xs gap-3 bg-amber-50/50 hover:bg-amber-50">
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-1 rounded">16:00</span>
                  <span className="font-medium text-[#14271C]">Phạm Quốc Cường</span>
                  <span className="text-[#6B726C]">Trị Liệu Toàn Thân</span>
                  <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                    <AlertTriangle className="h-3.5 w-3.5" /> Chưa gán KTV
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="warning">CẦN PHÂN CÔNG</Badge>
                  <Button size="sm" className="h-8 text-xs bg-amber-600 text-white hover:bg-amber-700">
                    Phân công KTV
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Toast Floating Pill */}
      {showToast && (
        <div className="fixed bottom-8 right-8 z-40 flex items-center justify-between gap-4 rounded-2xl bg-[#14271C] text-white p-4 shadow-2xl border border-[#C5A880]/30 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#C5A880]/20 flex items-center justify-center text-[#C5A880]">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Vừa nhận lịch hẹn mới!</p>
              <p className="text-[11px] text-[#D9E5DC]">Mã vé #LNR-092 · Giờ hẹn 16:30 hôm nay</p>
            </div>
          </div>

          <button
            onClick={() => setShowToast(false)}
            className="text-xs text-[#8EAA97] hover:text-white underline cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}
    </div>
  );
};
