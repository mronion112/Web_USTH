import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { bookingsApi, servicesApi, staffDirectoryApi, ApiBookingSearch, ApiService, PublicStaff } from '@/lib/api';
import { useRefresh } from '@/lib/use-refresh';

const spaToday = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());

interface CalendarBooking {
  start: string;
  duration: number; // in hours
  service: string;
  client: string;
  code: string;
  status: string;
}

interface StaffScheduleRow {
  id: number;
  name: string;
  role: string;
  bookings: CalendarBooking[];
}

export const CalendarPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date(`${spaToday()}T12:00:00`));
  const [selectedMonthDay, setSelectedMonthDay] = useState<number>(() => Number(spaToday().slice(8, 10)));
  const [successMsg, setSuccessMsg] = useState('');
  const [, setLoading] = useState(true);

  // Real data
  const [bookings, setBookings] = useState<ApiBookingSearch[]>([]);
  const [services, setServices] = useState<ApiService[]>([]);
  const [staffList, setStaffList] = useState<PublicStaff[]>([]);

  // Form State for Add Appointment
  const [formClient, setFormClient] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formStaffId, setFormStaffId] = useState<number | ''>('');
  const [formServiceId, setFormServiceId] = useState<number | ''>('');
  const [formTime, setFormTime] = useState('14:00');
  const [formDate, setFormDate] = useState(spaToday);

  const hours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  const reloadData = useCallback(async (signal?: AbortSignal) => {
    try {
      const [bookingsRes, servicesRes, accountsRes] = await Promise.all([
        bookingsApi.search({ size: 100 }, signal),
        servicesApi.getAll(),
        staffDirectoryApi.getAll(),
      ]);

      if (bookingsRes?.content) setBookings(bookingsRes.content);
      if (Array.isArray(servicesRes)) {
        setServices(servicesRes);
        if (servicesRes.length > 0 && !formServiceId) setFormServiceId(Number(servicesRes[0].id));
      }
      if (Array.isArray(accountsRes)) {
        setStaffList(accountsRes);
        if (accountsRes.length > 0 && !formStaffId) setFormStaffId(Number(accountsRes[0].accountId));
      }
    } catch (err) {
      console.error('Failed to load calendar data:', err);
    } finally {
      setLoading(false);
    }
  }, [formServiceId, formStaffId]);

  useRefresh('calendar', reloadData);

  // Construct staff rows for Day view
  const staffRows: StaffScheduleRow[] = staffList.slice(0, 6).map((st) => {
    // Filter bookings for this staff on selectedDate
    const staffBookings = bookings.filter((b) => {
      const bDate = new Date(b.bookingStart);
      const isSameDay =
        bDate.getDate() === selectedDate.getDate() &&
        bDate.getMonth() === selectedDate.getMonth() &&
        bDate.getFullYear() === selectedDate.getFullYear();
      return isSameDay && (b.staffAccountId === Number(st.accountId)
        || (!b.staffAccountId && Number(st.accountId) === Number(staffList[0]?.accountId)));
    });

    const mappedBookings: CalendarBooking[] = staffBookings.map((b) => {
      const bStart = new Date(b.bookingStart);
      const bEnd = new Date(b.bookingEnd);
      const durationHours = Math.max(1, (bEnd.getTime() - bStart.getTime()) / 3600000);
      const hh = String(bStart.getHours()).padStart(2, '0');
      const mm = String(bStart.getMinutes()).padStart(2, '0');

      return {
        start: `${hh}:${mm}`,
        duration: durationHours,
        service: 'Trị liệu',
        client: b.customerName,
        code: `#${b.bookingCode}`,
        status: b.status,
      };
    });

    return {
      id: Number(st.accountId),
      name: st.displayName,
      role: st.jobTitle || 'Chuyên viên trị liệu',
      bookings: mappedBookings,
    };
  });

  // Construct appointments for Week view (Mon - Sun of current week)
  const currentMonday = new Date(selectedDate);
  const dayIndex = (currentMonday.getDay() + 6) % 7;
  currentMonday.setDate(currentMonday.getDate() - dayIndex);

  const weekSchedule = Array.from({ length: 7 }).map((_, i) => {
    const dayDate = new Date(currentMonday);
    dayDate.setDate(currentMonday.getDate() + i);

    const dayName = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'][i];
    const dateStr = `${String(dayDate.getDate()).padStart(2, '0')}/${String(dayDate.getMonth() + 1).padStart(2, '0')}`;
    const isToday = dayDate.toDateString() === new Date().toDateString();

    const dayBookings = bookings.filter((b) => {
      const bDate = new Date(b.bookingStart);
      return (
        bDate.getDate() === dayDate.getDate() &&
        bDate.getMonth() === dayDate.getMonth() &&
        bDate.getFullYear() === dayDate.getFullYear()
      );
    });

    const appointments = dayBookings.map((b) => {
      const bStart = new Date(b.bookingStart);
      const bEnd = new Date(b.bookingEnd);
      const formatTime = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      return {
        time: `${formatTime(bStart)} - ${formatTime(bEnd)}`,
        client: b.customerName,
        service: 'Trị liệu',
        staff: b.staffName || 'Chưa gán',
        code: `#${b.bookingCode}`,
      };
    });

    return {
      dayName,
      dateStr,
      isToday,
      appointments,
    };
  });

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClient.trim() || !formPhone.trim() || !formServiceId) return;

    try {
      const selectedService = services.find((s) => Number(s.id) === Number(formServiceId)) || services[0];
      await bookingsApi.createManager({
        staffAccountId: formStaffId ? Number(formStaffId) : undefined,
        bookingStart: `${formDate}T${formTime}:00`,
        customerName: formClient.trim(),
        customerPhone: formPhone.trim(),
        items: [
          {
            serviceId: Number(selectedService.id),
            durationMinutes: selectedService.minimumDurationMinutes || 60,
          },
        ],
      });

      await reloadData();
      setAddModalOpen(false);
      setSuccessMsg(`Đã xếp lịch hẹn thành công cho ${formClient}`);
      setTimeout(() => setSuccessMsg(''), 4000);

      // Reset
      setFormClient('');
      setFormPhone('');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xếp lịch hẹn');
    }
  };

  const getSlotOffsetAndWidth = (start: string, duration: number) => {
    const [h, m] = start.split(':').map(Number);
    const startHour = 9;
    const offsetHours = h - startHour + (m ? m / 60 : 0);
    const leftPercent = Math.max(0, (offsetHours / 9) * 100);
    const widthPercent = (duration / 9) * 100;
    return { left: `${leftPercent}%`, width: `${widthPercent}%` };
  };

  return (
    <div className="space-y-6 font-body max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#14271C]">
            Lịch biểu & Xếp ca
          </h1>
          <p className="text-xs text-[#6B726C] mt-1">
            Điều phối phòng trị liệu và lịch hẹn của chuyên viên theo ngày, tuần và tháng
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-[#FAFBF9] border border-[#E2E8E3] rounded-xl p-1 text-xs">
            {(['day', 'week', 'month'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  viewMode === mode
                    ? 'bg-[#1E3B2B] text-white shadow-xs'
                    : 'text-[#526056] hover:text-[#14271C]'
                }`}
              >
                {mode === 'day' ? 'Ngày' : mode === 'week' ? 'Tuần' : 'Tháng'}
              </button>
            ))}
          </div>

          <Button
            onClick={() => setAddModalOpen(true)}
            className="rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs h-10 px-4 shadow-luxury cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1 text-[#C5A880]" />
            Thêm lịch hẹn
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="rounded-xl bg-[#E8F5E9] border border-[#2E7D32]/20 p-3.5 text-xs text-[#1E3B2B] font-medium animate-in fade-in">
          ✓ {successMsg}
        </div>
      )}

      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-[#E2E8E3] shadow-xs">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - (viewMode === 'week' ? 7 : 1));
              setSelectedDate(d);
            }}
            className="h-8 w-8 p-0 rounded-lg"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-display font-semibold text-sm text-[#14271C]">
            {selectedDate.toLocaleDateString('vi-VN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + (viewMode === 'week' ? 7 : 1));
              setSelectedDate(d);
            }}
            className="h-8 w-8 p-0 rounded-lg"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <button
          onClick={() => setSelectedDate(new Date())}
          className="text-xs font-semibold text-[#1E3B2B] hover:underline"
        >
          Hôm nay
        </button>
      </div>

      {/* Day View: Timeline Grid */}
      {viewMode === 'day' && (
        <Card className="overflow-hidden border border-[#E2E8E3] shadow-luxury">
          <div className="p-4 border-b border-[#E2E8E3] bg-[#FAFBF9] flex items-center justify-between text-xs text-[#718276]">
            <span className="w-48 font-semibold uppercase tracking-wider">Kỹ thuật viên</span>
            <div className="flex-1 grid grid-cols-9 text-center font-mono text-[11px]">
              {hours.map((h) => (
                <span key={h}>{h}</span>
              ))}
            </div>
          </div>

          <div className="divide-y divide-[#E2E8E3]">
            {staffRows.map((staff) => (
              <div key={staff.id} className="flex items-center p-3 hover:bg-[#FAFBF9] transition-colors">
                <div className="w-48 shrink-0 pr-4">
                  <div className="font-semibold text-xs text-[#14271C]">{staff.name}</div>
                  <div className="text-[11px] text-[#8EAA97]">{staff.role}</div>
                </div>

                <div className="flex-1 relative h-14 bg-[#F8F9F5] rounded-xl border border-dashed border-[#E2E8E3] overflow-hidden">
                  {/* Grid hour lines */}
                  <div className="absolute inset-0 grid grid-cols-9 divide-x divide-[#E2E8E3]/60 pointer-events-none" />

                  {/* Appointments Blocks */}
                  {staff.bookings.map((b, idx) => {
                    const pos = getSlotOffsetAndWidth(b.start, b.duration);
                    return (
                      <div
                        key={idx}
                        style={{ left: pos.left, width: pos.width }}
                        className="absolute top-1.5 bottom-1.5 rounded-lg bg-[#1E3B2B] text-white p-2 shadow-xs flex flex-col justify-center overflow-hidden cursor-pointer hover:bg-[#14271C] transition-colors"
                      >
                        <div className="font-semibold text-[11px] truncate">{b.client}</div>
                        <div className="text-[10px] text-[#C5A880] truncate">
                          {b.start} · {b.code}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Week View: 7 Days Columns */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekSchedule.map((day, idx) => (
            <Card
              key={idx}
              className={`p-3 border shadow-xs space-y-2.5 min-h-[350px] ${
                day.isToday ? 'border-[#1E3B2B] bg-[#E8F5E9]/10' : 'border-[#E2E8E3] bg-white'
              }`}
            >
              <div className="text-center pb-2 border-b border-[#E2E8E3]">
                <div className="text-xs font-semibold text-[#14271C]">{day.dayName}</div>
                <div className="text-[11px] text-[#8EAA97]">{day.dateStr}</div>
              </div>

              <div className="space-y-2">
                {day.appointments.length === 0 ? (
                  <div className="text-center text-[11px] text-[#8EAA97] py-8">Trống lịch</div>
                ) : (
                  day.appointments.map((app, appIdx) => (
                    <div
                      key={appIdx}
                      className="p-2.5 rounded-xl bg-[#FAFBF9] border border-[#E2E8E3] space-y-1 text-xs hover:border-[#1E3B2B] transition-colors"
                    >
                      <div className="font-semibold text-[11px] text-[#14271C] truncate">{app.client}</div>
                      <div className="text-[10px] text-[#1E3B2B] font-mono">{app.time}</div>
                      <div className="text-[10px] text-[#8EAA97] truncate">{app.staff}</div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Month View: Calendar Grid */}
      {viewMode === 'month' && (
        <Card className="p-6 border border-[#E2E8E3] shadow-luxury space-y-4">
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-[#718276] pb-2 border-b border-[#E2E8E3]">
            <span>T2</span>
            <span>T3</span>
            <span>T4</span>
            <span>T5</span>
            <span>T6</span>
            <span>T7</span>
            <span>CN</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 30 }).map((_, i) => {
              const dayNum = i + 1;
              const countOnDay = bookings.filter((b) => new Date(b.bookingStart).getDate() === dayNum).length;
              const isSelected = selectedMonthDay === dayNum;

              return (
                <div
                  key={dayNum}
                  onClick={() => setSelectedMonthDay(dayNum)}
                  className={`p-3 rounded-xl border text-xs min-h-[70px] flex flex-col justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#1E3B2B] bg-[#E8F5E9]/30 ring-1 ring-[#1E3B2B]'
                      : 'border-[#E2E8E3] hover:bg-[#FAFBF9]'
                  }`}
                >
                  <span className="font-semibold text-[#14271C]">{dayNum}</span>
                  {countOnDay > 0 && (
                    <span className="text-[10px] font-semibold text-[#1E3B2B] bg-[#E8F5E9] px-1.5 py-0.5 rounded self-start">
                      {countOnDay} lịch
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Add Appointment Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 font-body">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-luxury border border-[#E2E8E3] animate-in fade-in zoom-in-95 space-y-4">
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-[#14271C]">
                Xếp lịch hẹn mới
              </DialogTitle>
              <DialogDescription className="text-xs text-[#6B726C]">
                Chọn chuyên viên và khung giờ để lưu lịch vào hệ thống.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateAppointment} className="space-y-3.5 my-2">
              <div className="space-y-1">
                <Label className="text-xs">Họ tên khách hàng *</Label>
                <Input
                  placeholder="Nguyễn Văn A..."
                  value={formClient}
                  onChange={(e) => setFormClient(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Số điện thoại *</Label>
                <Input
                  placeholder="0912..."
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Chuyên viên phụ trách</Label>
                  <select
                    value={formStaffId}
                    onChange={(e) => setFormStaffId(Number(e.target.value) || '')}
                    className="w-full h-10 px-3 rounded-xl border border-[#E2E8E3] bg-white text-xs"
                  >
                    {staffList.map((st) => (
                      <option key={st.accountId} value={st.accountId}>
                        {st.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Gói dịch vụ</Label>
                  <select
                    value={formServiceId}
                    onChange={(e) => setFormServiceId(Number(e.target.value) || '')}
                    className="w-full h-10 px-3 rounded-xl border border-[#E2E8E3] bg-white text-xs"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Ngày hẹn</Label>
                  <Input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Khung giờ bắt đầu</Label>
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
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs font-semibold"
                >
                  Xếp lịch ngay
                </Button>
              </DialogFooter>
            </form>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
