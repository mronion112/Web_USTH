import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, User, RefreshCw } from 'lucide-react';
import { SlidingTabs } from '@/components/transitions/SlidingTabs';
import { TiltCard } from '@/components/transitions/TiltCard';
import { bookingsApi, ApiBookingSearch } from '@/lib/api';
import { useRefresh } from '@/lib/use-refresh';

export const LivePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [bookings, setBookings] = useState<ApiBookingSearch[]>([]);
  const [loading, setLoading] = useState(true);

  // Live seconds clock
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

  const loadLiveBookings = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await bookingsApi.search({ size: 50 }, signal);
      if (res && Array.isArray(res.content)) {
        setBookings(res.content);
      }
    } catch {
      // The transport retries on its next cycle.
    } finally {
      setLoading(false);
    }
  }, []);

  useRefresh('booking', loadLiveBookings);

  // Counts for tabs
  const countInService = bookings.filter((b) => b.status === 'IN_SERVICE').length;
  const countUpcoming = bookings.filter((b) => ['CONFIRMED', 'CHECKED_IN', 'PENDING'].includes(b.status)).length;
  const countCompleted = bookings.filter((b) => b.status === 'COMPLETED').length;
  const countAll = bookings.length;

  // Filtered list
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'in_service') return b.status === 'IN_SERVICE';
    if (activeTab === 'upcoming') return ['CONFIRMED', 'CHECKED_IN', 'PENDING'].includes(b.status);
    if (activeTab === 'completed') return b.status === 'COMPLETED';
    return true;
  });

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
              LIVE REALTIME
            </span>
          </div>
          <p className="text-xs text-[#6B726C] mt-1">
            Theo dõi trạng thái phòng trị liệu và tiến độ ca trực của kỹ thuật viên
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-2xl bg-white border border-[#E2E8E3] px-4 py-2 text-xs font-mono font-semibold text-[#14271C] shadow-xs">
            <Clock className="h-4 w-4 text-[#1E3B2B]" />
            <span>{currentTime || '14:23:08'}</span>
          </div>

          <Button
            variant="outline"
            onClick={() => loadLiveBookings()}
            className="rounded-xl border-[#D9E5DC] text-xs h-10 px-3 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Đồng bộ
          </Button>
        </div>
      </div>


      {/* Filter Tabs with Sliding Pill */}
      <div className="overflow-x-auto pb-1">
        <SlidingTabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabs={[
            { key: 'all', label: `Tất cả (${countAll})` },
            { key: 'in_service', label: `Đang trị liệu (${countInService})` },
            { key: 'upcoming', label: `Lịch hẹn sắp tới (${countUpcoming})` },
            { key: 'completed', label: `Đã hoàn thành (${countCompleted})` },
          ]}
        />
      </div>

      {/* Live Sessions Cards Grid */}
      {loading ? (
        <div className="text-center py-16 text-xs text-[#8EAA97]">Đang tải dữ liệu ca trực từ database...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-16 text-xs text-[#8EAA97]">Không có ca phục vụ nào trong danh mục này</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookings.map((booking) => {
            const isInService = booking.status === 'IN_SERVICE';
            const isCompleted = booking.status === 'COMPLETED';
            const bStart = new Date(booking.bookingStart);
            const bEnd = new Date(booking.bookingEnd);
            const formatTime = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

            return (
              <TiltCard key={booking.id} maxTilt={6} cardClassName="rounded-2xl">
                <Card
                  className={`h-full border shadow-luxury flex flex-col justify-between overflow-hidden transition-all ${
                    isInService
                      ? 'border-[#1E3B2B] bg-white ring-1 ring-[#1E3B2B]'
                      : 'border-[#E2E8E3] bg-[#FAFBF9]'
                  }`}
                >
                  <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Top status header */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-[#1E3B2B]">
                          #{booking.bookingCode}
                        </span>

                        {isInService ? (
                          <span className="flex items-center gap-1.5 rounded-full bg-[#E8F5E9] text-[#2E7D32] px-2.5 py-0.5 text-[11px] font-bold">
                            <span className="h-2 w-2 rounded-full bg-[#2E7D32] animate-pulse" />
                            ĐANG TRỊ LIỆU
                          </span>
                        ) : isCompleted ? (
                          <span className="rounded-full bg-[#E2E8E3] text-[#526056] px-2.5 py-0.5 text-[11px] font-semibold">
                            HOÀN THÀNH
                          </span>
                        ) : (
                          <span className="rounded-full bg-[#FFF3E0] text-[#E65100] px-2.5 py-0.5 text-[11px] font-semibold">
                            SẮP DIỄN RA
                          </span>
                        )}
                      </div>

                      {/* Time & Customer Info */}
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center gap-1 text-xs text-[#8EAA97]">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {formatTime(bStart)} → {formatTime(bEnd)}
                          </span>
                        </div>
                        <h3 className="font-display font-semibold text-lg text-[#14271C]">
                          {booking.customerName}
                        </h3>
                      </div>

                      {/* Staff Assigned */}
                      <div className="mt-4 pt-3 border-t border-[#E2E8E3] flex items-center justify-between text-xs">
                        <span className="text-[#8EAA97]">KTV phụ trách:</span>
                        <span className="font-semibold text-[#14271C] flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-[#1E3B2B]" />
                          {booking.staffName || 'Chưa gán'}
                        </span>
                      </div>
                    </div>

                    {/* Live is observational; therapists update service tasks in their portal. */}
                    <div className="pt-2">
                      {!isCompleted && <div className="w-full py-2 text-center text-xs font-semibold text-[#526056] bg-[#F8F9F5] rounded-xl">Theo dõi trạng thái: {booking.status}</div>}

                      {isCompleted && (
                        <div className="w-full py-2 text-center text-xs font-semibold text-[#2E7D32] bg-[#E8F5E9] rounded-xl">
                          ✓ Ca phục vụ đã hoàn tất
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TiltCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
