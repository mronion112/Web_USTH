import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar as CalIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

export const MyCalendarPage: React.FC = () => {
  const scheduleSlots = [
    { time: '09:00 — 10:00', title: 'Ca đón tiếp đầu ngày & chuẩn bị phòng', client: 'Nội bộ', status: 'done' },
    { time: '10:00 — 11:30', title: 'Gói VIP Thư Thái Toàn Thân', client: 'Hoàng Kim Ngân', status: 'done' },
    { time: '12:00 — 13:30', title: 'Nghỉ trưa & ăn ca', client: 'Khóa ca', status: 'blocked' },
    { time: '14:00 — 15:00', title: 'Massage Thư Giãn Thảo Mộc', client: 'Nguyễn Văn An', status: 'active' },
    { time: '15:30 — 16:30', title: 'Chăm Sóc Da Mặt Chuyên Sâu', client: 'Lê Minh Châu', status: 'upcoming' },
    { time: '17:00 — 18:00', title: 'Đá Nóng Himalaya', client: 'Trần Thị Hằng', status: 'upcoming' },
  ];

  return (
    <div className="space-y-6 font-body max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2E8E3] pb-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#8EAA97]">
            Lịch cá nhân KTV
          </span>
          <h1 className="font-display text-3xl font-semibold text-[#14271C]">
            Lịch của tôi
          </h1>
          <p className="text-xs text-[#6B726C] mt-1">
            Kỹ thuật viên: <strong className="text-[#14271C]">Nguyễn Thị Linh</strong>
          </p>
        </div>

        <div className="flex items-center bg-white border border-[#E2E8E3] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#14271C]">
          <button className="p-1 hover:text-[#1E3B2B] cursor-pointer"><ChevronLeft className="h-4 w-4" /></button>
          <span className="px-3">Hôm nay · 14 Tháng 9 2026</span>
          <button className="p-1 hover:text-[#1E3B2B] cursor-pointer"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Hourly Schedule Timeline Cards */}
      <Card className="p-6 shadow-luxury">
        <div className="divide-y divide-[#E2E8E3]">
          {scheduleSlots.map((slot, i) => (
            <div key={i} className="py-4 flex items-start gap-4">
              <div className="w-32 shrink-0">
                <span className="font-mono font-bold text-xs text-[#1E3B2B] bg-[#E8F5E9] px-2.5 py-1 rounded-md inline-block">
                  {slot.time}
                </span>
              </div>

              <div className="flex-1">
                <h4 className={`text-sm font-semibold ${slot.status === 'blocked' ? 'text-[#6B726C] italic' : 'text-[#14271C]'}`}>
                  {slot.title}
                </h4>
                <p className="text-xs text-[#526056] mt-0.5">Khách: {slot.client}</p>
              </div>

              <div>
                <span
                  className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                    slot.status === 'active'
                      ? 'bg-[#1E3B2B] text-white'
                      : slot.status === 'done'
                      ? 'bg-[#E8F5E9] text-[#2E7D32]'
                      : slot.status === 'blocked'
                      ? 'bg-[#EDEEEA] text-[#6B726C]'
                      : 'border border-[#D9E5DC] text-[#526056]'
                  }`}
                >
                  {slot.status === 'active'
                    ? '● ĐANG DIỄN RA'
                    : slot.status === 'done'
                    ? '✓ ĐÃ HOÀN THÀNH'
                    : slot.status === 'blocked'
                    ? 'NGHỈ CA'
                    : 'SẮP TỚI'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
