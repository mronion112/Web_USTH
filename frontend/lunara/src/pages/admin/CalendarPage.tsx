import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { MOCK_SERVICES } from '@/data/mock-services';

interface CalendarBooking {
  start: string;
  duration: number; // in hours (1, 1.5, 2)
  service: string;
  client: string;
  code: string;
}

interface StaffScheduleRow {
  name: string;
  role: string;
  bookings: CalendarBooking[];
}

interface WeekDaySchedule {
  dayName: string;
  dateStr: string;
  isToday?: boolean;
  appointments: {
    time: string;
    client: string;
    service: string;
    staff: string;
    code: string;
  }[];
}

export const CalendarPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedBookingToMove, setSelectedBookingToMove] = useState<string | null>(null);
  const [selectedMonthDay, setSelectedMonthDay] = useState<number>(14);
  const [successMsg, setSuccessMsg] = useState('');

  // Form State for Add Appointment
  const [formClient, setFormClient] = useState('');
  const [formStaff, setFormStaff] = useState('Nguyễn Thị Linh');
  const [formService, setFormService] = useState('Massage Thư Giãn');
  const [formTime, setFormTime] = useState('15:00');
  const [formDuration, setFormDuration] = useState('1');

  const hours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  const [staffRows, setStaffRows] = useState<StaffScheduleRow[]>([
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
  ]);

  const weekSchedule: WeekDaySchedule[] = [
    {
      dayName: 'Thứ Hai',
      dateStr: '14/09',
      isToday: true,
      appointments: [
        { time: '09:00 - 10:00', client: 'Bích Phương', service: 'Chăm Sóc Da Mặt', staff: 'Thu Mai', code: '#LNR-008' },
        { time: '10:00 - 11:30', client: 'Lê Châu', service: 'Massage Thư Giãn', staff: 'Linh Nguyễn', code: '#LNR-012' },
        { time: '14:00 - 15:30', client: 'Nguyễn An', service: 'Massage Body 90p', staff: 'Linh Nguyễn', code: '#LNR-001' },
        { time: '15:00 - 16:00', client: 'Thu Hằng', service: 'Trị Liệu Cấp Ẩm', staff: 'Thu Mai', code: '#LNR-022' },
      ],
    },
    {
      dayName: 'Thứ Ba',
      dateStr: '15/09',
      appointments: [
        { time: '10:00 - 11:00', client: 'Vũ Minh', service: 'Massage Cổ Vai Gáy', staff: 'Linh Nguyễn', code: '#LNR-025' },
        { time: '14:00 - 15:30', client: 'Trịnh Linh', service: 'Chăm Sóc Da Chuyên Sâu', staff: 'Thu Mai', code: '#LNR-026' },
        { time: '16:00 - 17:30', client: 'Bảo Anh', service: 'Trị Liệu Thảo Dược', staff: 'Minh Hoa', code: '#LNR-027' },
      ],
    },
    {
      dayName: 'Thứ Tư',
      dateStr: '16/09',
      appointments: [
        { time: '09:30 - 11:00', client: 'Kim Dung', service: 'Massage Body Tinh Dầu', staff: 'Đức Tùng', code: '#LNR-028' },
        { time: '13:30 - 15:00', client: 'Hà My', service: 'Trẻ Hóa Làn Da', staff: 'Thu Mai', code: '#LNR-029' },
        { time: '15:30 - 17:00', client: 'Tuấn Khải', service: 'Đá Nóng Himalaya', staff: 'Minh Hoa', code: '#LNR-030' },
      ],
    },
    {
      dayName: 'Thứ Năm',
      dateStr: '17/09',
      appointments: [
        { time: '10:00 - 11:30', client: 'Quỳnh Trang', service: 'Massage Thư Giãn', staff: 'Linh Nguyễn', code: '#LNR-031' },
        { time: '14:00 - 15:00', client: 'Đức Thắng', service: 'Xông Hơi & Tẩy Tế Bào', staff: 'Đức Tùng', code: '#LNR-032' },
      ],
    },
    {
      dayName: 'Thứ Sáu',
      dateStr: '18/09',
      appointments: [
        { time: '11:00 - 12:30', client: 'Mai Hương', service: 'Gói VIP Thư Thái', staff: 'Thu Mai', code: '#LNR-034' },
        { time: '14:30 - 16:00', client: 'Huy Hoàng', service: 'Massage Trị Liệu Cơ', staff: 'Minh Hoa', code: '#LNR-035' },
        { time: '16:30 - 17:30', client: 'Khánh Linh', service: 'Chăm Sóc Mắt Chuyên Sâu', staff: 'Linh Nguyễn', code: '#LNR-036' },
      ],
    },
    {
      dayName: 'Thứ Bảy',
      dateStr: '19/09',
      appointments: [
        { time: '09:00 - 10:30', client: 'Thanh Trúc', service: 'Gói Combo Spa Cặp Đôi', staff: 'Linh & Mai', code: '#LNR-037' },
        { time: '11:00 - 12:30', client: 'Gia Bảo', service: 'Massage Body Đá Nóng', staff: 'Minh Hoa', code: '#LNR-038' },
        { time: '14:00 - 15:30', client: 'Ngọc Hân', service: 'Trị Liệu Thảo Mộc', staff: 'Đức Tùng', code: '#LNR-039' },
        { time: '16:00 - 17:30', client: 'Hoàng Nam', service: 'Chăm Sóc Toàn Diện', staff: 'Thu Mai', code: '#LNR-040' },
      ],
    },
    {
      dayName: 'Chủ Nhật',
      dateStr: '20/09',
      appointments: [
        { time: '10:00 - 11:30', client: 'Thu Thảo', service: 'Massage Thư Giãn', staff: 'Linh Nguyễn', code: '#LNR-042' },
        { time: '13:30 - 15:00', client: 'Trọng Hiếu', service: 'Phục Hồi Căng Thẳng', staff: 'Minh Hoa', code: '#LNR-043' },
        { time: '15:30 - 17:00', client: 'Phương Thảo', service: 'Chăm Sóc Da Cao Cấp', staff: 'Thu Mai', code: '#LNR-044' },
      ],
    },
  ];

  // Month days data (September 2026, 30 days)
  const monthDays = Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    // generate mock bookings count
    const count = day === 14 ? 8 : (day % 4 === 0 ? 6 : day % 3 === 0 ? 4 : day % 2 === 0 ? 5 : 3);
    return { day, count };
  });

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClient.trim()) return;

    const newBooking: CalendarBooking = {
      start: formTime,
      duration: parseFloat(formDuration),
      service: formService,
      client: formClient,
      code: `#LNR-${Math.floor(100 + Math.random() * 900)}`,
    };

    setStaffRows((prev) =>
      prev.map((row) =>
        row.name === formStaff
          ? { ...row, bookings: [...row.bookings, newBooking] }
          : row
      )
    );

    setAddModalOpen(false);
    setSuccessMsg(`Đã xếp lịch hẹn cho khách ${formClient} vào ca của ${formStaff} lúc ${formTime}`);
    setTimeout(() => setSuccessMsg(''), 4000);
    setFormClient('');
  };

  return (
    <div className="space-y-6 font-body max-w-7xl mx-auto">
      {/* Calendar Navigation Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E2E8E3] pb-6">
        <div className="flex items-center gap-4">
          <h1 className="font-display text-3xl font-semibold text-[#14271C]">
            Lịch làm việc
          </h1>

          <div className="flex items-center bg-white border border-[#E2E8E3] rounded-xl px-3 py-1 text-xs font-semibold text-[#14271C]">
            <button className="p-1 hover:text-[#1E3B2B] cursor-pointer">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3">
              {viewMode === 'day'
                ? '14 Tháng 9, 2026 (Hôm nay)'
                : viewMode === 'week'
                ? 'Tuần 38 · 14/09 — 20/09/2026'
                : 'Tháng 9, 2026'}
            </span>
            <button className="p-1 hover:text-[#1E3B2B] cursor-pointer">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Switcher */}
          <div className="inline-flex rounded-xl bg-[#EDEEEA] p-1 text-xs font-semibold">
            <button
              onClick={() => setViewMode('day')}
              className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                viewMode === 'day'
                  ? 'bg-white text-[#14271C] shadow-2xs font-bold'
                  : 'text-[#526056] hover:text-[#14271C]'
              }`}
            >
              Ngày
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-white text-[#14271C] shadow-2xs font-bold'
                  : 'text-[#526056] hover:text-[#14271C]'
              }`}
            >
              Tuần
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-white text-[#14271C] shadow-2xs font-bold'
                  : 'text-[#526056] hover:text-[#14271C]'
              }`}
            >
              Tháng
            </button>
          </div>

          <Button
            onClick={() => setAddModalOpen(true)}
            className="rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs h-10 px-4 cursor-pointer shadow-luxury"
          >
            <Plus className="h-3.5 w-3.5 mr-1 text-[#C5A880]" /> Thêm lịch hẹn
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="rounded-xl bg-[#E8F5E9] border border-[#2E7D32]/20 p-3.5 text-xs text-[#1E3B2B] font-medium animate-in fade-in">
          ✓ {successMsg}
        </div>
      )}

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
        <span className="text-[11px] text-[#8EAA97]">
          {viewMode === 'day'
            ? 'Nhấp vào lịch hẹn để xem tùy chọn đổi giờ'
            : viewMode === 'week'
            ? 'Xem tiến độ và mật độ đặt lịch trong cả tuần'
            : 'Nhấp vào ngày bất kỳ để xem lịch chi tiết'}
        </span>
      </div>

      {/* VIEW 1: DAY VIEW (Hourly Matrix) */}
      {viewMode === 'day' && (
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
                            gridColumn: `span ${Math.max(1, Math.round(b.duration))}`,
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
      )}

      {/* VIEW 2: WEEK VIEW (7-Day Columns) */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
          {weekSchedule.map((day) => (
            <Card
              key={day.dayName}
              className={`p-4 flex flex-col justify-between ${
                day.isToday ? 'border-[#1E3B2B] bg-[#F8F9F5]' : 'border-[#E2E8E3]'
              }`}
            >
              <div className="space-y-3">
                {/* Day Column Header */}
                <div className="pb-3 border-b border-[#E2E8E3] flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-[#14271C]">{day.dayName}</h3>
                    <p className="text-xs text-[#8EAA97] font-mono">{day.dateStr}</p>
                  </div>
                  {day.isToday && (
                    <Badge variant="default" className="text-[9px]">
                      Hôm nay
                    </Badge>
                  )}
                </div>

                {/* Day Appointment Cards */}
                <div className="space-y-2.5">
                  {day.appointments.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setSelectedBookingToMove(`${item.client} (${item.service})`);
                        setRescheduleModalOpen(true);
                      }}
                      className="p-2.5 rounded-xl bg-white border border-[#E2E8E3] hover:border-[#1E3B2B] hover:shadow-xs transition-all cursor-pointer text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] text-[#8EAA97]">
                        <span className="font-mono font-bold text-[#1E3B2B]">{item.time}</span>
                        <span>{item.code}</span>
                      </div>
                      <div className="font-semibold text-[#14271C] truncate">{item.client}</div>
                      <div className="text-[11px] text-[#526056] truncate">{item.service}</div>
                      <div className="pt-1 text-[10px] text-[#1E3B2B] font-medium border-t border-[#F8F9F5]">
                        KTV: {item.staff}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-[#E2E8E3] text-[11px] text-center text-[#8EAA97]">
                {day.appointments.length} ca hẹn
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* VIEW 3: MONTH VIEW (30-day grid) */}
      {viewMode === 'month' && (
        <div className="space-y-6">
          <Card className="p-6 shadow-luxury">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-[#8EAA97] pb-3 border-b border-[#E2E8E3]">
              <div>Thứ 2</div>
              <div>Thứ 3</div>
              <div>Thứ 4</div>
              <div>Thứ 5</div>
              <div>Thứ 6</div>
              <div>Thứ 7</div>
              <div>Chủ Nhật</div>
            </div>

            {/* 30 Days Grid */}
            <div className="grid grid-cols-7 gap-2 pt-3">
              {monthDays.map((m) => {
                const isSelected = selectedMonthDay === m.day;
                const isToday = m.day === 14;

                return (
                  <div
                    key={m.day}
                    onClick={() => setSelectedMonthDay(m.day)}
                    className={`min-h-[90px] p-2.5 rounded-xl border text-xs flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#1E3B2B] bg-[#E8F5E9]/40 shadow-xs'
                        : isToday
                        ? 'border-[#C5A880] bg-[#FFF8F0]'
                        : 'border-[#E2E8E3] bg-white hover:bg-[#F8F9F5]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-mono font-bold text-sm ${
                          isToday
                            ? 'text-white bg-[#1E3B2B] h-6 w-6 rounded-full flex items-center justify-center'
                            : 'text-[#14271C]'
                        }`}
                      >
                        {m.day}
                      </span>
                      {isToday && <span className="text-[10px] text-[#C5A880] font-bold">Hôm nay</span>}
                    </div>

                    <div className="space-y-1">
                      <span className="block text-[10px] text-[#526056] font-medium">
                        {m.count} ca trị liệu
                      </span>
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(4, m.count) }).map((_, dotIdx) => (
                          <span
                            key={dotIdx}
                            className={`h-1.5 w-1.5 rounded-full ${
                              dotIdx === 0
                                ? 'bg-[#1E3B2B]'
                                : dotIdx === 1
                                ? 'bg-[#C5A880]'
                                : 'bg-[#8EAA97]'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Month Day Detail Preview */}
          <Card className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8E3]">
              <div>
                <h3 className="font-display font-semibold text-lg text-[#14271C]">
                  Lịch trình chi tiết ngày {selectedMonthDay} Tháng 9, 2026
                </h3>
                <p className="text-xs text-[#6B726C]">Danh sách ca trị liệu theo thứ tự khung giờ</p>
              </div>
              <Button
                size="sm"
                onClick={() => setAddModalOpen(true)}
                className="bg-[#1E3B2B] text-white text-xs h-9"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Thêm ca vào ngày này
              </Button>
            </div>

            <div className="divide-y divide-[#E2E8E3] pt-2">
              <div className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-[#1E3B2B] bg-[#E8F5E9] px-2.5 py-1 rounded">09:30</span>
                  <span className="font-semibold text-[#14271C]">Nguyễn Hoàng Lan</span>
                  <span className="text-[#526056]">Massage Thư Giãn (60p)</span>
                  <span className="text-[#8EAA97]">KTV: Nguyễn Thị Linh</span>
                </div>
                <Badge variant="secondary">ĐÃ XÁC NHẬN</Badge>
              </div>

              <div className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-[#1E3B2B] bg-[#E8F5E9] px-2.5 py-1 rounded">11:00</span>
                  <span className="font-semibold text-[#14271C]">Trần Quốc Bảo</span>
                  <span className="text-[#526056]">Chăm Sóc Da Mặt Chuyên Sâu (45p)</span>
                  <span className="text-[#8EAA97]">KTV: Trần Thu Mai</span>
                </div>
                <Badge variant="secondary">ĐÃ XÁC NHẬN</Badge>
              </div>

              <div className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-[#1E3B2B] bg-[#E8F5E9] px-2.5 py-1 rounded">14:00</span>
                  <span className="font-semibold text-[#14271C]">Lê Thu Hằng</span>
                  <span className="text-[#526056]">Trị Liệu Thảo Dược Toàn Thân (90p)</span>
                  <span className="text-[#8EAA97]">KTV: Lê Minh Hoa</span>
                </div>
                <Badge variant="secondary">ĐÃ XÁC NHẬN</Badge>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Thêm Lịch Hẹn */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <form onSubmit={handleCreateAppointment} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Thêm lịch hẹn mới vào lịch biểu</DialogTitle>
            <DialogDescription>
              Phân bổ chuyên viên và khung giờ điều trị cho khách hàng
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <Label>Tên khách hàng *</Label>
              <Input
                required
                placeholder="Ví dụ: Hoàng Kim Ngân"
                value={formClient}
                onChange={(e) => setFormClient(e.target.value)}
                className="h-10 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Chuyên viên phụ trách</Label>
                <select
                  value={formStaff}
                  onChange={(e) => setFormStaff(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E2E8E3] bg-white text-xs"
                >
                  {staffRows.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label>Gói dịch vụ</Label>
                <select
                  value={formService}
                  onChange={(e) => setFormService(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E2E8E3] bg-white text-xs"
                >
                  {MOCK_SERVICES.map((srv) => (
                    <option key={srv.id} value={srv.name}>
                      {srv.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Khung giờ bắt đầu</Label>
                <select
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E2E8E3] bg-white text-xs font-mono"
                >
                  {hours.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label>Thời lượng dự kiến</Label>
                <select
                  value={formDuration}
                  onChange={(e) => setFormDuration(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E2E8E3] bg-white text-xs"
                >
                  <option value="1">60 phút (1h)</option>
                  <option value="1.5">90 phút (1.5h)</option>
                  <option value="2">120 phút (2h)</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddModalOpen(false)}
              className="text-xs h-10"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs h-10 px-4"
            >
              Xác nhận thêm
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

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
            onClick={() => {
              setRescheduleModalOpen(false);
              setSuccessMsg('Đã cập nhật giờ hẹn mới thành công');
              setTimeout(() => setSuccessMsg(''), 4000);
            }}
            className="bg-[#1E3B2B] text-white hover:bg-[#14271C]"
          >
            Xác nhận thay đổi
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};
