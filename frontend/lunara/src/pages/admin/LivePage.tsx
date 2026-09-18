import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Radio, Clock, User, CheckCircle, Play, Bell, AlertTriangle } from 'lucide-react';
import { SlidingTabs } from '@/components/transitions/SlidingTabs';
import { ShimmerText } from '@/components/transitions/ShimmerText';
import { TiltCard } from '@/components/transitions/TiltCard';

interface ActiveBooking {
  id: string;
  timeRange: string;
  customer: string;
  service: string;
  duration: string;
  staff: string;
  status: 'IDLE' | 'IN_SERVICE' | 'COMPLETED';
}

interface UpcomingBookingItem {
  id: string;
  time: string;
  customer: string;
  service: string;
  staff: string;
  status: string;
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
      status: 'IDLE', // Mặc định không hiển thị trạng thái KTV
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
      status: 'IDLE',
    },
  ]);

  const [upcomingList] = useState<UpcomingBookingItem[]>([
    {
      id: 'LNR-013',
      time: '15:00',
      customer: 'Nguyễn Văn An',
      service: 'Massage Thư Giãn',
      staff: 'Linh Nguyễn',
      status: 'Đã xác nhận',
    },
    {
      id: 'LNR-014',
      time: '15:30',
      customer: 'Lê Thị Bích',
      service: 'Chăm Sóc Da Mặt',
      staff: 'Mai Trần',
      status: 'Đã xác nhận',
    },
    {
      id: 'LNR-015',
      time: '16:00',
      customer: 'Phạm Quốc Cường',
      service: 'Trị Liệu Toàn Thân',
      staff: 'Hoa Lê',
      status: 'Đã xác nhận',
    },
    {
      id: 'LNR-016',
      time: '16:30',
      customer: 'Hoàng Kim Ngân',
      service: 'Đá Nóng Himalaya',
      staff: 'Vũ Đức Tùng',
      status: 'Đã xác nhận',
    },
  ]);

  const handleStartService = (id: string) => {
    setActiveBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'IN_SERVICE' } : b))
    );
  };

  const handleCompleteService = (id: string) => {
    setActiveBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'COMPLETED' } : b))
    );
  };

  // Dynamic counts for tabs
  const countInService = activeBookings.filter((b) => b.status === 'IN_SERVICE').length;
  const countCompleted = activeBookings.filter((b) => b.status === 'COMPLETED').length;
  const countUpcoming = upcomingList.length;
  const countAll = activeBookings.length + upcomingList.length;

  // Filtered lists based on activeTab
  const filteredActiveBookings = activeBookings.filter((b) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'in_service') return b.status === 'IN_SERVICE';
    if (activeTab === 'completed') return b.status === 'COMPLETED';
    return false;
  });

  const shouldShowUpcoming = activeTab === 'all' || activeTab === 'upcoming';

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
              <ShimmerText className="font-extrabold text-red-700">LIVE</ShimmerText>
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

      {/* Filter Tabs with Dynamic Counts */}
      <div className="overflow-x-auto pb-1">
        <SlidingTabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabs={[
            { key: 'all', label: `Tất cả (${countAll})` },
            { key: 'upcoming', label: `Sắp đến (${countUpcoming})` },
            { key: 'in_service', label: `Đang trị liệu (${countInService})` },
            { key: 'completed', label: `Hoàn thành (${countCompleted})` },
          ]}
        />
      </div>

      {/* NOW SECTION: Interactive Active Booking Cards */}
      {(activeTab === 'all' || activeTab === 'in_service' || activeTab === 'completed') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-[#14271C]">
              ĐANG DIỄN RA (NOW)
            </h2>
            <span className="text-xs text-[#8EAA97]">
              {filteredActiveBookings.length} ca tại phòng trị liệu
            </span>
          </div>

          {filteredActiveBookings.length === 0 ? (
            <Card className="p-8 text-center text-xs text-[#6B726C]">
              Không có ca nào trong trạng thái này.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredActiveBookings.map((booking) => (
                <TiltCard key={booking.id} maxTilt={6} cardClassName="rounded-2xl">
                  <Card className="h-full border border-[#E2E8E3] shadow-luxury hover:shadow-luxury-hover transition-all">
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
                        <span className="text-[#6B726C]">
                          KTV: <strong className="text-[#14271C]">{booking.staff}</strong>
                        </span>
                        {/* Mặc định không hiển thị badge trạng thái KTV, chỉ hiển thị khi Đang trị liệu hoặc Hoàn thành */}
                        {booking.status === 'IN_SERVICE' ? (
                          <Badge variant="default">● ĐANG TRỊ LIỆU</Badge>
                        ) : booking.status === 'COMPLETED' ? (
                          <Badge variant="success">✓ HOÀN THÀNH</Badge>
                        ) : null}
                      </div>

                      {/* Operations Status Buttons */}
                      <div className="pt-2">
                        {booking.status === 'IDLE' && (
                          <Button
                            onClick={() => handleStartService(booking.id)}
                            className="w-full h-10 rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs font-semibold"
                          >
                            <Play className="h-3.5 w-3.5 mr-1 text-[#C5A880]" />
                            Bắt đầu phục vụ
                          </Button>
                        )}

                        {booking.status === 'IN_SERVICE' && (
                          <Button
                            onClick={() => handleCompleteService(booking.id)}
                            className="w-full h-10 rounded-xl bg-[#2E7D32] text-white hover:bg-[#1b5e20] text-xs font-semibold"
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Hoàn thành liệu trình
                          </Button>
                        )}

                        {booking.status === 'COMPLETED' && (
                          <div className="text-center py-2 text-xs font-medium text-[#2E7D32] bg-[#E8F5E9] rounded-xl">
                            Ca đã hoàn tất thành công
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TiltCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* UPCOMING SECTION: Clean Queue with Auto-assigned KTV */}
      {shouldShowUpcoming && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-[#14271C]">
              LỊCH HẸN TIẾP THEO (UPCOMING)
            </h2>
            <span className="text-xs text-[#8EAA97]">KTV đã được hệ thống tự động gán</span>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-[#E2E8E3]">
                {upcomingList.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 px-6 text-xs gap-3 hover:bg-[#F8F9F5] transition-colors"
                  >
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="font-mono font-bold text-[#1E3B2B] bg-[#E8F5E9] px-2.5 py-1 rounded-lg">
                        {item.time}
                      </span>
                      <span className="font-semibold text-[#14271C]">{item.customer}</span>
                      <span className="text-[#526056]">{item.service}</span>
                      <span className="text-[#1E3B2B] bg-[#F8F9F5] px-2.5 py-0.5 rounded-full border border-[#E2E8E3] font-medium">
                        KTV: {item.staff}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
