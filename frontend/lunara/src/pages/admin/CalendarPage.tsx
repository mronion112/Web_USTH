import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalIcon, Clock, Check } from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedBookingToMove, setSelectedBookingToMove] = useState<string | null>(null);

  const hours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  const staffRows = [
    {
      name: 'Nguyễn Thị Linh',
      role: 'Senior Therapist',
      bookings: [
        { start: '10:00', duration: 1.5, service: 'Massage Thư Giãn', client: 'Lê Châu', code: '#LNR-012' },
        { start: '14:00', duration: 1.5, service: 'Massage Body 90p', client: 'Nguyễn An', code: '#LNR-001' },
      ],
    },
    {
      name: 'Trần Thu Mai',
      role: 'Facial Specialist',
      bookings: [
        { start: '09:00', duration: 1, service: 'Chăm Sóc Da Mặt', client: 'Bích Phương', code: '#LNR-008' },
        { start: '12:00', duration: 1, service: 'KHÓA CA (BLOCKED)', client: 'Nghỉ trưa', code: 'BLOCKED' },
        { start: '15:00', duration: 1, service: 'Trị Liệu Cấp Ẩm', client: 'Thu Hằng', code: '#LNR-022' },
      ],
    },
    {
      name: 'Lê Minh Hoa',
      role: 'Therapist',
      bookings: [
        { start: '11:00', duration: 2, service: 'Đá Nóng Himalaya', client: 'Phạm Đức', code: '#LNR-004' },
        { start: '14:30', duration: 1.5, service: 'Massage Body', client: 'Hoàng Ngân', code: '#LNR-015' },
      ],
    },
    {
      name: 'Vũ Đức Tùng',
      role: 'Junior Therapist',
      bookings: [
        { start: '13:00', duration: 1, service: 'Tẩy Tế Bào Chết', client: 'Quốc Tuấn', code: '#LNR-033' },
        { start: '16:00', duration: 1, service: 'Massage Chân Thảo Dược', client: 'Văn Hùng', code: '#LNR-041' },
      ],
    },
  ];

  return (
    <div className="space-y-6 font-body max-w-7xl mx-auto">
      {/* Calendar Navigation Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E2E8E3] pb-6">
        <div className="flex items-center gap-4">
          <h1 className="font-display text-3xl font-semibold text-[#14271C]">
            Lịch làm việc
          </h1>

          <div className="flex items-center bg-white border border-[#E2E8E3] rounded-xl px-3 py-1 text-xs font-semibold text-[#14271C]">
            <button className="p-1 hover:text-[#1E3B2B] cursor-pointer"><ChevronLeft className="h-4 w-4" /></button>
            <span className="px-3">14 Tháng 9, 2026</span>
            <button className="p-1 hover:text-[#1E3B2B] cursor-pointer"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-xl bg-[#EDEEEA] p-1 text-xs font-semibold">
            <span className="bg-white rounded-lg px-3 py-1.5 text-[#14271C] shadow-2xs">Ngày</span>
            <span className="px-3 py-1.5 text-[#526056] hover:text-[#14271C] cursor-pointer">Tuần</span>
            <span className="px-3 py-1.5 text-[#526056] hover:text-[#14271C] cursor-pointer">Tháng</span>
          </div>

          <Button className="rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs h-10 px-4">
            <Plus className="h-3.5 w-3.5 mr-1" /> Thêm lịch hẹn
          </Button>
        </div>
      </div>

      {/* Legend & Filter row */}
      <div className="flex items-center justify-between text-xs text-[#526056]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#D9E5DC] border border-[#8EAA97]" /> Lịch đã đặt
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#EDEEEA]" /> Khóa ca (Blocked)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-white border border-[#2E7D32]" /> Còn trống
          </span>
        </div>
        <span className="text-[11px] text-[#8EAA97]">Nhấp vào lịch hẹn để xem tùy chọn đổi giờ</span>
      </div>

      {/* Main Hourly Timeline Matrix Card */}
      <Card className="overflow-x-auto p-6 shadow-luxury">
        <div className="min-w-[800px]">
          {/* Header Hour Markers */}
          <div className="grid grid-cols-10 gap-2 pb-4 border-b border-[#E2E8E3] text-center text-xs font-semibold text-[#8EAA97]">
            <div className="text-left font-bold text-[#14271C]">Chuyên viên</div>
            {hours.map((h) => (
              <div key={h}>{h}</div>
            ))}
          </div>

          {/* Staff Rows */}
          <div className="divide-y divide-[#E2E8E3]">
            {staffRows.map((staff, idx) => (
              <div key={idx} className="grid grid-cols-10 gap-2 py-5 items-center">
                {/* Staff Label */}
                <div>
                  <h4 className="font-semibold text-sm text-[#14271C]">{staff.name}</h4>
                  <p className="text-[11px] text-[#8EAA97]">{staff.role}</p>
                </div>

                {/* Timeline Grid Cells for This Staff */}
                <div className="col-span-9 grid grid-cols-9 gap-2 relative h-16 bg-[#F8F9F5]/60 rounded-xl p-1 border border-[#E2E8E3]/60">
                  {staff.bookings.map((b, bIdx) => {
                    const isBlocked = b.code === 'BLOCKED';
                    return (
                      <div
                        key={bIdx}
                        onClick={() => {
                          setSelectedBookingToMove(`${b.client} (${b.service})`);
                          setRescheduleModalOpen(true);
                        }}
                        className={`rounded-lg p-2 text-xs flex flex-col justify-between shadow-2xs border transition-transform hover:scale-[1.02] cursor-pointer ${
                          isBlocked
                            ? 'bg-[#EDEEEA] border-[#D9DAD7] text-[#6B726C]'
                            : 'bg-[#D9E5DC] border-[#8EAA97] text-[#14271C]'
                        }`}
                        style={{
                          gridColumn: `span ${Math.round(b.duration)}`,
                        }}
                      >
                        <div className="font-bold truncate text-[11px]">{b.service}</div>
                        <div className="flex justify-between items-center text-[10px] text-[#526056]">
                          <span className="truncate">{b.client}</span>
                          <span className="font-mono">{b.code}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Reschedule Dialog Modal */}
      <Dialog open={rescheduleModalOpen} onOpenChange={setRescheduleModalOpen}>
        <DialogHeader>
          <DialogTitle>Đổi lịch hẹn (Reschedule)</DialogTitle>
          <DialogDescription>
            Điều chỉnh khung giờ cho lịch hẹn {selectedBookingToMove || '#LNR-001'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <div className="rounded-xl bg-[#F8F9F5] p-3 border border-[#E2E8E3] space-y-1">
            <span className="text-[#8EAA97]">Giờ hiện tại:</span>
            <p className="font-bold text-sm text-[#14271C]">14:00 — 15:30 (14/09/2026)</p>
          </div>

          <div className="space-y-2">
            <label className="font-semibold text-[#14271C]">Chọn giờ mới:</label>
            <div className="grid grid-cols-3 gap-2">
              <button className="p-2.5 rounded-lg border border-[#1E3B2B] bg-[#E8F5E9] font-bold text-[#1E3B2B] text-center">
                15:30 — 17:00
              </button>
              <button className="p-2.5 rounded-lg border border-[#E2E8E3] hover:border-[#1E3B2B] text-center">
                16:00 — 17:30
              </button>
              <button className="p-2.5 rounded-lg border border-[#E2E8E3] hover:border-[#1E3B2B] text-center">
                17:00 — 18:30
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded text-[#1E3B2B]" />
              <span>Gửi thông báo cập nhật qua Email cho khách hàng</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded text-[#1E3B2B]" />
              <span>Cập nhật đồng bộ vào Google Calendar</span>
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setRescheduleModalOpen(false)}>
            Hủy bỏ
          </Button>
          <Button
            onClick={() => setRescheduleModalOpen(false)}
            className="bg-[#1E3B2B] text-white hover:bg-[#14271C]"
          >
            Xác nhận thay đổi
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};
