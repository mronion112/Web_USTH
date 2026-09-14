import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { MOCK_SERVICES } from '@/data/mock-services';
import { MOCK_STAFF } from '@/data/mock-staff';
import {
  Clock,
  User,
  Calendar as CalendarIcon,
  Check,
  Plus,
  Minus,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';

interface SelectedServiceItem {
  serviceId: string;
  durationMinutes: number;
  lineAmount: number;
}

export const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Customer Form State
  const [customerName, setCustomerName] = useState(user?.displayName || 'Nguyễn Văn An');
  const [customerPhone, setCustomerPhone] = useState('0912 345 678');
  const [customerEmail, setCustomerEmail] = useState(user?.email || 'nguyen.an@gmail.com');
  const [customerNote, setCustomerNote] = useState('Ưu tiên phòng yên tĩnh, lực massage vừa phải.');

  // Selected Services: default to Massage Thư Giãn (60p) + Chăm Sóc Da Mặt (45p)
  const [selectedServices, setSelectedServices] = useState<Record<string, SelectedServiceItem>>({
    'srv-1': {
      serviceId: 'srv-1',
      durationMinutes: 60,
      lineAmount: 450000,
    },
    'srv-2': {
      serviceId: 'srv-2',
      durationMinutes: 45,
      lineAmount: 350000,
    },
  });

  // Staff Selection: default to Linh (acc-stf-1)
  const [selectedStaffId, setSelectedStaffId] = useState<string>('acc-stf-1');

  // Date & Time Selection
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 8, 14));
  const [selectedTime, setSelectedTime] = useState<string>('14:00');

  // Time Slots Definition
  const timeSlots = [
    { time: '09:00', status: 'available' },
    { time: '09:30', status: 'booked' },
    { time: '10:00', status: 'available' },
    { time: '10:30', status: 'available' },
    { time: '11:00', status: 'booked' },
    { time: '11:30', status: 'available' },
    { time: '13:00', status: 'available' },
    { time: '13:30', status: 'booked' },
    { time: '14:00', status: 'available' },
    { time: '14:30', status: 'available' },
    { time: '15:00', status: 'available' },
    { time: '15:30', status: 'booked' },
    { time: '16:00', status: 'available' },
    { time: '16:30', status: 'available' },
    { time: '17:00', status: 'available' },
  ];

  // Toggle or Update Service Selection
  const toggleService = (serviceId: string) => {
    const srv = MOCK_SERVICES.find((s) => s.id === serviceId);
    if (!srv) return;

    setSelectedServices((prev) => {
      const next = { ...prev };
      if (next[serviceId]) {
        // If already selected, allow removing if more than 1 service selected
        if (Object.keys(next).length > 1) {
          delete next[serviceId];
        }
      } else {
        next[serviceId] = {
          serviceId: srv.id,
          durationMinutes: srv.minimumDurationMinutes,
          lineAmount: srv.basePrice,
        };
      }
      return next;
    });
  };

  // Adjust Duration for Adjustable Services (+ / - 30 minutes)
  const adjustDuration = (serviceId: string, deltaMinutes: number) => {
    const srv = MOCK_SERVICES.find((s) => s.id === serviceId);
    if (!srv || !srv.isDurationAdjustable) return;

    setSelectedServices((prev) => {
      const current = prev[serviceId];
      if (!current) return prev;

      const newDuration = Math.max(
        srv.minimumDurationMinutes,
        current.durationMinutes + deltaMinutes
      );
      const step = srv.durationStepMinutes || 30;
      const additionalSteps = Math.max(
        0,
        Math.floor((newDuration - srv.minimumDurationMinutes) / step)
      );
      const pricePerStep = srv.pricePerDurationStep || 200000;
      const newLineAmount = srv.basePrice + additionalSteps * pricePerStep;

      return {
        ...prev,
        [serviceId]: {
          ...current,
          durationMinutes: newDuration,
          lineAmount: newLineAmount,
        },
      };
    });
  };

  // Calculations
  const totalDuration = useMemo(() => {
    return Object.values(selectedServices).reduce(
      (sum, item) => sum + item.durationMinutes,
      0
    );
  }, [selectedServices]);

  const totalAmount = useMemo(() => {
    return Object.values(selectedServices).reduce(
      (sum, item) => sum + item.lineAmount,
      0
    );
  }, [selectedServices]);

  const selectedStaff = useMemo(() => {
    if (selectedStaffId === 'none') return 'Tự động phân công (KTV khả dụng)';
    const found = MOCK_STAFF.find((s) => s.account.id === selectedStaffId);
    return found ? found.account.displayName : 'Tự động phân công';
  }, [selectedStaffId]);

  // Calculate end time string
  const endTime = useMemo(() => {
    if (!selectedTime) return '15:00';
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const endTotalMinutes = hours * 60 + minutes + totalDuration;
    const endH = Math.floor(endTotalMinutes / 60);
    const endM = endTotalMinutes % 60;
    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
  }, [selectedTime, totalDuration]);

  const handleConfirmBooking = () => {
    // Navigate to checkout with booking snapshot data
    navigate('/checkout', {
      state: {
        bookingCode: 'LNR-089',
        customerName,
        customerPhone,
        customerEmail,
        customerNote,
        selectedStaff,
        selectedDate: '14/09/2026',
        timeRange: `${selectedTime} - ${endTime}`,
        totalDuration,
        totalAmount,
        services: Object.values(selectedServices).map((item) => {
          const srv = MOCK_SERVICES.find((s) => s.id === item.serviceId);
          return {
            name: srv?.name || '',
            durationMinutes: item.durationMinutes,
            lineAmount: item.lineAmount,
          };
        }),
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F9F5] flex flex-col font-body">
      <Navbar />

      <main className="flex-1 py-10 px-6 lg:px-12 max-w-7xl mx-auto w-full">
        {/* Page Title */}
        <div className="mb-8 space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#8EAA97]">
            Quy trình đặt lịch trị liệu
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#14271C]">
            ĐẶT LỊCH SPA LUNARA
          </h1>
          <p className="text-sm text-[#526056]">
            Lựa chọn dịch vụ, chuyên viên yêu thích và khung giờ phù hợp với lịch trình của quý khách.
          </p>
        </div>

        {/* 2-Column Desktop Grid (7 : 5) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols): Information & Service Picker */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Customer Info */}
            <div className="rounded-2xl bg-white p-6 border border-[#E2E8E3] shadow-luxury space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E2E8E3] pb-3">
                <User className="h-4 w-4 text-[#1E3B2B]" />
                <h3 className="font-display font-semibold text-base text-[#14271C]">
                  Thông tin khách hàng
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Họ và tên</Label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nguyễn Văn An"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Số điện thoại</Label>
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0912 345 678"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Địa chỉ Email (Nhận vé điện tử)</Label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="nguyenvana@example.com"
                />
              </div>
            </div>

            {/* 2. Service Selection (Multi-select with Duration Controls) */}
            <div className="rounded-2xl bg-white p-6 border border-[#E2E8E3] shadow-luxury space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E8E3] pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#C5A880]" />
                  <h3 className="font-display font-semibold text-base text-[#14271C]">
                    Lựa chọn dịch vụ (Multi-select)
                  </h3>
                </div>
                <span className="text-xs text-[#8EAA97]">
                  Đã chọn {Object.keys(selectedServices).length} dịch vụ
                </span>
              </div>

              <div className="space-y-3">
                {MOCK_SERVICES.map((service) => {
                  const isSelected = !!selectedServices[service.id];
                  const currentItem = selectedServices[service.id];

                  return (
                    <div
                      key={service.id}
                      className={`rounded-xl border p-4 transition-all duration-200 ${
                        isSelected
                          ? 'border-[#1E3B2B] bg-[#E8F5E9]/30 ring-1 ring-[#1E3B2B]/20'
                          : 'border-[#E2E8E3] bg-white hover:border-[#8EAA97]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div
                          className="flex items-start gap-3 cursor-pointer flex-1"
                          onClick={() => toggleService(service.id)}
                        >
                          <div
                            className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'border-[#1E3B2B] bg-[#1E3B2B] text-white'
                                : 'border-[#D9E5DC] bg-white'
                            }`}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                          </div>

                          <div>
                            <h4 className="font-display font-medium text-sm text-[#14271C]">
                              {service.name}
                            </h4>
                            <p className="text-xs text-[#6B726C] line-clamp-1 mt-0.5">
                              {service.description}
                            </p>
                          </div>
                        </div>

                        {/* Duration & Price Display */}
                        <div className="text-right">
                          <span className="font-display font-bold text-sm text-[#14271C] block">
                            {isSelected
                              ? `${currentItem.lineAmount.toLocaleString('vi-VN')} đ`
                              : `${service.basePrice.toLocaleString('vi-VN')} đ`}
                          </span>
                          <span className="text-[11px] text-[#8EAA97]">
                            {isSelected ? `${currentItem.durationMinutes}p` : `${service.minimumDurationMinutes}p`}
                          </span>
                        </div>
                      </div>

                      {/* Duration Increment/Decrement Control for Adjustable Services */}
                      {isSelected && service.isDurationAdjustable && (
                        <div className="mt-3 pt-3 border-t border-[#E2E8E3]/60 flex items-center justify-between text-xs text-[#526056]">
                          <span className="flex items-center gap-1 text-[#1E3B2B] font-medium">
                            <Clock className="h-3.5 w-3.5 text-[#C5A880]" />
                            Tùy chỉnh thời lượng (+/- 30 phút):
                          </span>

                          <div className="flex items-center gap-2 bg-white rounded-lg border border-[#D9E5DC] px-2 py-1 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => adjustDuration(service.id, -30)}
                              disabled={currentItem.durationMinutes <= service.minimumDurationMinutes}
                              className="h-6 w-6 rounded flex items-center justify-center text-[#14271C] hover:bg-[#F8F9F5] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <Minus className="h-3 w-3" />
                            </button>

                            <span className="font-bold text-[#14271C] px-2 text-xs min-w-10 text-center">
                              {currentItem.durationMinutes} phút
                            </span>

                            <button
                              type="button"
                              onClick={() => adjustDuration(service.id, 30)}
                              className="h-6 w-6 rounded flex items-center justify-center text-[#14271C] hover:bg-[#F8F9F5] cursor-pointer"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Staff Selection */}
            <div className="rounded-2xl bg-white p-6 border border-[#E2E8E3] shadow-luxury space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E2E8E3] pb-3">
                <User className="h-4 w-4 text-[#1E3B2B]" />
                <h3 className="font-display font-semibold text-base text-[#14271C]">
                  Yêu cầu chuyên viên kỹ thuật?
                </h3>
              </div>

              <Select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
              >
                <option value="none">Không yêu cầu (Hệ thống tự phân công chuyên viên phù hợp)</option>
                {MOCK_STAFF.map((staff) => (
                  <option
                    key={staff.account.id}
                    value={staff.account.id}
                    disabled={!staff.profile.isBookable}
                  >
                    {staff.account.displayName} — {staff.profile.jobTitle}{' '}
                    {!staff.profile.isBookable ? '(Đã kín lịch ca này)' : ''}
                  </option>
                ))}
              </Select>
            </div>

            {/* 4. Customer Notes */}
            <div className="rounded-2xl bg-white p-6 border border-[#E2E8E3] shadow-luxury space-y-3">
              <Label>Ghi chú & Yêu cầu riêng</Label>
              <Textarea
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder="Ghi chú về tiền sử dị ứng da, vị trí cơ đau mỏi cần tập trung..."
              />
            </div>
          </div>

          {/* Right Column (5 cols): Date, Time Slots & Sticky Order Summary */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
            {/* Calendar & Available Slots */}
            <div className="rounded-2xl bg-white p-6 border border-[#E2E8E3] shadow-luxury space-y-6">
              <div className="flex items-center justify-between border-b border-[#E2E8E3] pb-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-[#1E3B2B]" />
                  <h3 className="font-display font-semibold text-base text-[#14271C]">
                    Chọn ngày & giờ hẹn
                  </h3>
                </div>
                <span className="text-xs font-semibold text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-1 rounded-full">
                  14/09/2026
                </span>
              </div>

              {/* Interactive Mini Calendar */}
              <Calendar
                selected={selectedDate}
                onSelect={(d) => setSelectedDate(d)}
              />

              {/* Time Slot Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Khung giờ khả dụng</Label>
                  <div className="flex items-center gap-3 text-[11px] text-[#526056]">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-[#2E7D32]"></span> Còn chỗ
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-[#C2C8C1]"></span> Đã đầy
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {timeSlots.map((slot) => {
                    const isAvailable = slot.status === 'available';
                    const isSelected = selectedTime === slot.time;

                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => setSelectedTime(slot.time)}
                        className={`h-11 rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#1E3B2B] text-white shadow-sm ring-2 ring-[#1E3B2B]/30'
                            : isAvailable
                            ? 'border border-[#2E7D32]/40 bg-white text-[#2E7D32] hover:bg-[#E8F5E9]'
                            : 'bg-[#F5F5F3] text-[#A0A5A1] border border-[#E0E0E0] line-through cursor-not-allowed'
                        }`}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Order Summary (Tóm tắt đơn hàng) */}
            <div className="rounded-2xl bg-[#14271C] text-white p-6 shadow-luxury space-y-6">
              <div className="border-b border-[#2E4A37] pb-3 flex items-center justify-between">
                <h3 className="font-display font-semibold text-lg text-white">
                  TÓM TẮT ĐƠN HÀNG
                </h3>
                <span className="text-xs text-[#C5A880] font-semibold">
                  Tạm tính
                </span>
              </div>

              {/* Service Line Items */}
              <div className="space-y-2.5 text-xs text-[#D9E5DC]">
                {Object.values(selectedServices).map((item) => {
                  const srv = MOCK_SERVICES.find((s) => s.id === item.serviceId);
                  return (
                    <div key={item.serviceId} className="flex justify-between items-center">
                      <span className="font-medium text-white">{srv?.name}</span>
                      <span className="text-[#8EAA97]">{item.durationMinutes}p · {item.lineAmount.toLocaleString('vi-VN')} đ</span>
                    </div>
                  );
                })}

                <div className="pt-3 border-t border-[#2E4A37] flex justify-between font-semibold">
                  <span className="text-white">Tổng thời gian</span>
                  <span className="text-[#C5A880]">{totalDuration} phút</span>
                </div>

                <div className="flex justify-between">
                  <span>Chuyên viên</span>
                  <span className="text-white font-medium">{selectedStaff}</span>
                </div>

                <div className="flex justify-between">
                  <span>Ngày hẹn</span>
                  <span className="text-white">14/09/2026</span>
                </div>

                <div className="flex justify-between">
                  <span>Thời gian dự kiến</span>
                  <span className="text-white font-medium">{selectedTime} — {endTime}</span>
                </div>
              </div>

              {/* Total Price & Checkout Button */}
              <div className="pt-4 border-t border-[#2E4A37] space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold uppercase tracking-wider text-[#8EAA97]">
                    Tổng thanh toán
                  </span>
                  <span className="font-display text-2xl font-bold text-[#C5A880]">
                    {totalAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <Button
                  onClick={handleConfirmBooking}
                  className="w-full rounded-xl h-13 bg-[#C5A880] text-[#14271C] hover:bg-[#ba9b71] font-bold text-sm tracking-wide shadow-md transition-transform hover:scale-[1.01]"
                >
                  Xác nhận đặt lịch
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>

                <p className="text-[11px] text-[#8EAA97] text-center flex items-center justify-center gap-1">
                  <Info className="h-3 w-3" /> Quý khách sẽ chuyển tiếp đến cổng quét mã QR
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
