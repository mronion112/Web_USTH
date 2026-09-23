import React, { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  bookingsApi,
  servicesApi,
  staffDirectoryApi,
  ApiBookingSearch,
  ApiService,
  PublicStaff,
} from '@/lib/api';
import { Search, Plus, CheckCircle2, ChevronRight, X, UserCheck, CalendarClock, Mail } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useRefresh } from '@/lib/use-refresh';
import { latestBookingsQuery } from '@/lib/admin-booking-query';

const STATUS_LABELS: Record<string, string> = {
  ALL: 'Tất cả trạng thái',
  PENDING: 'Chờ xử lý',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đã check-in',
  IN_SERVICE: 'Đang phục vụ',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã huỷ',
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#2E7D32',
  IN_SERVICE: '#1E3B2B',
  CONFIRMED: '#C5A880',
  CHECKED_IN: '#526056',
  PENDING: '#E0A96D',
  CANCELLED: '#B23B3B',
};

const currentLocalDateTime = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

export const BookingsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get('q') || '');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [bookings, setBookings] = useState<ApiBookingSearch[]>([]);
  const [services, setServices] = useState<ApiService[]>([]);
  const [staffList, setStaffList] = useState<PublicStaff[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<ApiBookingSearch | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  // Form State for new booking
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formCustomerPhone, setFormCustomerPhone] = useState('');
  const [formCustomerEmail, setFormCustomerEmail] = useState('');
  const [formServiceId, setFormServiceId] = useState<number | ''>('');
  const [formStaffId, setFormStaffId] = useState<string>('AUTO');
  const [formDateTime, setFormDateTime] = useState('');
  const [formNote, setFormNote] = useState('');

  // Selected assign staff state
  const [assignStaffId, setAssignStaffId] = useState<number | ''>('');
  const [rescheduleStart, setRescheduleStart] = useState('');
  const [rescheduleStaffId, setRescheduleStaffId] = useState<number | ''>('');
  const [actionLoading, setActionLoading] = useState(false);

  const reload = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await bookingsApi.search(latestBookingsQuery({ search, status: statusFilter, page }), signal);
      if (res && Array.isArray(res.content)) {
        setBookings(res.content);
        setTotalPages(Math.max(1, res.totalPages));
      }
    } catch (err: any) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useRefresh('booking', reload, true, `${search}|${statusFilter}|${page}`);

  useEffect(() => {
    servicesApi.getAll().then((data) => {
      if (Array.isArray(data)) {
        setServices(data);
        if (data.length > 0) setFormServiceId(Number(data[0].id));
      }
    });

    staffDirectoryApi.getAll().then(setStaffList).catch(() => setStaffList([]));
  }, []);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomerName.trim() || !formCustomerPhone.trim()) {
      return;
    }

    try {
      const selectedService = services.find((s) => Number(s.id) === Number(formServiceId)) || services[0];
      const startIso = formDateTime.length === 16 ? `${formDateTime}:00` : formDateTime;

      const res = await bookingsApi.createManager({
        staffAccountId: formStaffId === 'AUTO' ? undefined : Number(formStaffId),
        bookingStart: startIso,
        customerName: formCustomerName.trim(),
        customerPhone: formCustomerPhone.trim(),
        customerEmail: formCustomerEmail.trim() || undefined,
        customerNote: formNote.trim() || undefined,
        items: [
          {
            serviceId: Number(selectedService.id),
            durationMinutes: selectedService.minimumDurationMinutes || 60,
          },
        ],
      });

      setCreateModalOpen(false);
      setSuccessMsg(`Đã tạo thành công lịch hẹn #${res?.bookingCode || 'mới'} cho khách hàng ${formCustomerName}`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await reload();

      // Reset Form
      setFormCustomerName('');
      setFormCustomerPhone('');
      setFormCustomerEmail('');
      setFormNote('');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo lịch hẹn');
    }
  };

  const handleOpenDetail = (b: ApiBookingSearch) => {
    setSelectedBooking(b);
    setAssignStaffId(b.staffAccountId || '');
    setRescheduleStart(b.bookingStart.slice(0, 16));
    setRescheduleStaffId(b.staffAccountId || '');
    setDetailOpen(true);
    setError('');
  };

  const handleReschedule = async () => {
    if (!selectedBooking || !rescheduleStart) return;
    setActionLoading(true);
    setError('');
    try {
      const requested = rescheduleStart.length === 16 ? `${rescheduleStart}:00` : rescheduleStart;
      const updated = await bookingsApi.managerReschedule(
        selectedBooking.id,
        requested,
        rescheduleStaffId ? Number(rescheduleStaffId) : undefined,
      );
      const staffObj = staffList.find((item) => Number(item.accountId) === Number(updated.staffAccountId));
      setSelectedBooking({
        ...selectedBooking,
        bookingStart: updated.bookingStart,
        bookingEnd: updated.bookingEnd,
        staffAccountId: updated.staffAccountId,
        staffName: staffObj?.displayName || selectedBooking.staffName,
      });
      setSuccessMsg(`Đã đổi lịch ${selectedBooking.bookingCode}; email cập nhật đang được gửi tới khách.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await reload();
    } catch (err: any) {
      setError(err.message || 'Không thể đổi lịch hẹn');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!selectedBooking) return;
    setActionLoading(true);
    setError('');
    try {
      await bookingsApi.resendEmail(selectedBooking.id);
      setSuccessMsg(`Đã xếp hàng gửi lại email xác nhận cho ${selectedBooking.bookingCode}.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Không thể gửi lại email xác nhận');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedBooking) return;
    try {
      await bookingsApi.checkIn(selectedBooking.id);
      setSelectedBooking({ ...selectedBooking, status: 'CHECKED_IN' });
      setSuccessMsg(`Đã check-in thành công mã ${selectedBooking.bookingCode}`);
      setTimeout(() => setSuccessMsg(''), 3000);
      await reload();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi check-in');
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedBooking || !assignStaffId) return;
    try {
      await bookingsApi.assignStaff(selectedBooking.id, Number(assignStaffId));
      const staffObj = staffList.find((s) => Number(s.accountId) === Number(assignStaffId));
      setSelectedBooking({
        ...selectedBooking,
        staffAccountId: Number(assignStaffId),
        staffName: staffObj?.displayName || `Staff #${assignStaffId}`,
      });
      setSuccessMsg(`Đã phân công thành công KTV ${staffObj?.displayName || ''}`);
      setTimeout(() => setSuccessMsg(''), 3000);
      await reload();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi phân công KTV');
    }
  };

  const filtered = bookings.filter((b) => {
    const matchSearch =
      b.bookingCode.toLowerCase().includes(search.toLowerCase()) ||
      b.customerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });
  const selectedStaffId = selectedBooking?.staffAccountId ?? null;
  const requestedStaffId = rescheduleStaffId ? Number(rescheduleStaffId) : selectedStaffId;
  const rescheduleUnchanged = Boolean(selectedBooking)
    && rescheduleStart === selectedBooking?.bookingStart.slice(0, 16)
    && requestedStaffId === selectedStaffId;

  return (
    <div className="space-y-6 font-body max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#14271C]">
            Quản lý lịch hẹn
          </h1>
          <p className="text-xs text-[#6B726C] mt-1">
            Theo dõi, phân công KTV và check-in khách đến spa ({bookings.length} lịch hẹn)
          </p>
        </div>

        <Button
          onClick={() => setCreateModalOpen(true)}
          className="rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs h-11 px-5 shadow-luxury cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-1.5 text-[#C5A880]" />
          Tạo lịch mới
        </Button>
      </div>

      {successMsg && (
        <div className="rounded-xl bg-[#E8F5E9] border border-[#2E7D32]/20 p-3.5 text-xs text-[#1E3B2B] font-medium animate-in fade-in">
          ✓ {successMsg}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8EAA97]" />
          <Input
            placeholder="Tìm theo mã vé hoặc tên khách..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-9 h-10 text-xs rounded-xl bg-white border-[#E2E8E3]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setStatusFilter(key);
                setPage(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === key
                  ? 'bg-[#1E3B2B] text-white'
                  : 'bg-white border border-[#E2E8E3] text-[#526056] hover:border-[#1E3B2B]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <Card className="overflow-hidden border border-[#E2E8E3] shadow-luxury">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8E3] bg-[#FAFBF9] text-[#718276] uppercase tracking-wider font-semibold">
                <th className="py-3 px-6">Mã vé</th>
                <th className="py-3 px-6">Khách hàng</th>
                <th className="py-3 px-6">Kỹ thuật viên</th>
                <th className="py-3 px-6">Thời gian</th>
                <th className="py-3 px-6">Tổng tiền</th>
                <th className="py-3 px-6">Trạng thái</th>
                <th className="py-3 px-6 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8E3]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8EAA97]">
                    Đang tải danh sách lịch hẹn từ database...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8EAA97]">
                    Không tìm thấy lịch hẹn phù hợp
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-[#FAFBF9] transition-colors">
                    <td className="py-4 px-6 font-semibold text-[#14271C]">{b.bookingCode}</td>
                    <td className="py-4 px-6 font-medium text-[#14271C]">{b.customerName}</td>
                    <td className="py-4 px-6 text-[#526056]">
                      {b.staffName ? (
                        <span className="inline-flex items-center gap-1">
                          <UserCheck className="h-3.5 w-3.5 text-[#1E3B2B]" />
                          {b.staffName}
                        </span>
                      ) : (
                        <span className="text-[#BA1A1A] font-medium italic">Chưa phân công</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-[#526056]">
                      {new Date(b.bookingStart).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-4 px-6 font-semibold text-[#14271C]">
                      {Number(b.totalAmount).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                        style={{
                          backgroundColor: `${STATUS_COLORS[b.status] || '#8EAA97'}20`,
                          color: STATUS_COLORS[b.status] || '#14271C',
                        }}
                      >
                        {STATUS_LABELS[b.status] || b.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDetail(b)}
                        className="h-8 text-xs text-[#1E3B2B] hover:bg-[#E8F0EA] cursor-pointer"
                      >
                        Chi tiết <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#E2E8E3] px-6 py-3 text-xs text-[#526056]">
          <span>Trang {page + 1}/{totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>
              Trang trước
            </Button>
            <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((value) => value + 1)}>
              Trang sau
            </Button>
          </div>
        </div>
      </Card>

      {/* Booking Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        {selectedBooking && (
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white p-6 shadow-2xl border-l border-[#E2E8E3] overflow-y-auto space-y-6 font-body animate-in slide-in-from-right duration-200">
            <SheetHeader className="flex flex-row items-center justify-between pb-4 border-b border-[#E2E8E3]">
              <div>
                <SheetTitle className="font-display text-xl text-[#14271C]">
                  Vé hẹn #{selectedBooking.bookingCode}
                </SheetTitle>
                <p className="text-xs text-[#6B726C] mt-0.5">Khách hàng: {selectedBooking.customerName}</p>
              </div>
              <SheetClose asChild>
                <button type="button" className="p-1 text-[#8EAA97] hover:text-[#14271C]">
                  <X className="h-5 w-5" />
                </button>
              </SheetClose>
            </SheetHeader>

            {error && (
              <div className="p-3 bg-[#FCE8E6] text-[#BA1A1A] rounded-xl text-xs">{error}</div>
            )}

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#FAFBF9] border border-[#E2E8E3] space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-[#8EAA97]">Trạng thái:</span>
                  <span
                    className="px-2 py-0.5 rounded-md font-semibold text-[11px]"
                    style={{
                      backgroundColor: `${STATUS_COLORS[selectedBooking.status] || '#8EAA97'}20`,
                      color: STATUS_COLORS[selectedBooking.status] || '#14271C',
                    }}
                  >
                    {STATUS_LABELS[selectedBooking.status] || selectedBooking.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8EAA97]">Thời gian:</span>
                  <span className="font-semibold text-[#14271C]">
                    {new Date(selectedBooking.bookingStart).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8EAA97]">Tổng tiền:</span>
                  <span className="font-bold text-[#1E3B2B] text-sm">
                    {Number(selectedBooking.totalAmount).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {selectedBooking.status === 'CONFIRMED' && (
                  <Button
                    onClick={handleCheckIn}
                    className="w-full h-11 bg-[#1E3B2B] text-white hover:bg-[#14271C] rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2 text-[#C5A880]" />
                    Xác nhận khách đến (Check-in)
                  </Button>
                )}

                {/* Assign Staff */}
                <div className="pt-3 border-t border-[#E2E8E3] space-y-2">
                  <Label className="text-xs font-semibold text-[#14271C]">Phân công Kỹ thuật viên</Label>
                  <div className="flex gap-2">
                    <select
                      value={assignStaffId}
                      onChange={(e) => setAssignStaffId(Number(e.target.value) || '')}
                      className="flex-1 h-10 px-3 text-xs bg-white border border-[#E2E8E3] rounded-xl focus:ring-[#1E3B2B]"
                    >
                      <option value="">-- Chọn KTV --</option>
                      {staffList.map((st) => (
                        <option key={st.accountId} value={st.accountId}>
                          {st.displayName} ({st.jobTitle || 'Kỹ thuật viên'})
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      onClick={handleAssignStaff}
                      disabled={!assignStaffId || selectedBooking.status === 'CANCELLED'}
                      className="h-10 px-4 text-xs rounded-xl text-[#1E3B2B] border-[#D9E5DC] hover:border-[#1E3B2B] cursor-pointer"
                    >
                      Gán KTV
                    </Button>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E2E8E3] space-y-2">
                  <Label className="text-xs font-semibold text-[#14271C]">Đổi lịch hẹn</Label>
                  <Input
                    type="datetime-local"
                    value={rescheduleStart}
                    min={currentLocalDateTime()}
                    onChange={(event) => setRescheduleStart(event.target.value)}
                    disabled={['CHECKED_IN', 'IN_SERVICE', 'COMPLETED', 'CANCELLED'].includes(selectedBooking.status)}
                  />
                  <select
                    value={rescheduleStaffId}
                    onChange={(event) => setRescheduleStaffId(Number(event.target.value) || '')}
                    disabled={['CHECKED_IN', 'IN_SERVICE', 'COMPLETED', 'CANCELLED'].includes(selectedBooking.status)}
                    className="w-full h-10 px-3 text-xs bg-white border border-[#E2E8E3] rounded-xl focus:ring-[#1E3B2B]"
                  >
                    <option value="">Giữ KTV hiện tại / tự động phân công</option>
                    {staffList.map((staff) => (
                      <option key={staff.accountId} value={staff.accountId}>{staff.displayName}</option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    onClick={handleReschedule}
                    disabled={!rescheduleStart || rescheduleUnchanged || actionLoading || ['CHECKED_IN', 'IN_SERVICE', 'COMPLETED', 'CANCELLED'].includes(selectedBooking.status)}
                    className="w-full h-10 text-xs rounded-xl text-[#1E3B2B] border-[#D9E5DC] hover:border-[#1E3B2B]"
                  >
                    <CalendarClock className="h-4 w-4 mr-2" />
                    Cập nhật lịch và gửi email
                  </Button>
                </div>

                <div className="pt-3 border-t border-[#E2E8E3]">
                  <Button
                    variant="outline"
                    onClick={handleResendEmail}
                    disabled={actionLoading}
                    className="w-full h-10 text-xs rounded-xl text-[#1E3B2B] border-[#D9E5DC] hover:border-[#1E3B2B]"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Gửi lại email xác nhận
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Sheet>

      {/* Create Booking Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-luxury border border-[#E2E8E3] animate-in fade-in zoom-in-95">
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-[#14271C]">Tạo lịch hẹn mới</DialogTitle>
              <DialogDescription className="text-xs text-[#6B726C]">
                Nhập thông tin khách hàng và dịch vụ trị liệu để lưu vào hệ thống.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateBooking} className="space-y-3.5 my-4">
              <div className="space-y-1">
                <Label className="text-xs">Họ và tên khách hàng *</Label>
                <Input
                  placeholder="VD: Trần Thị Mai..."
                  value={formCustomerName}
                  onChange={(e) => setFormCustomerName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Số điện thoại *</Label>
                  <Input
                    placeholder="0912..."
                    value={formCustomerPhone}
                    onChange={(e) => setFormCustomerPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input
                    placeholder="email@example.com"
                    type="email"
                    value={formCustomerEmail}
                    onChange={(e) => setFormCustomerEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Dịch vụ yêu cầu *</Label>
                <select
                  value={formServiceId}
                  onChange={(e) => setFormServiceId(Number(e.target.value) || '')}
                  className="w-full h-10 px-3 text-xs bg-white border border-[#E2E8E3] rounded-xl focus:ring-[#1E3B2B]"
                  required
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.minimumDurationMinutes}p — {Number(s.basePrice).toLocaleString('vi-VN')} đ)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Kỹ thuật viên</Label>
                  <select
                    value={formStaffId}
                    onChange={(e) => setFormStaffId(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-white border border-[#E2E8E3] rounded-xl focus:ring-[#1E3B2B]"
                  >
                    <option value="AUTO">Hệ thống tự gán</option>
                    {staffList.map((st) => (
                      <option key={st.accountId} value={st.accountId}>
                        {st.displayName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Thời gian hẹn *</Label>
                  <Input
                    type="datetime-local"
                    value={formDateTime}
                    onChange={(e) => setFormDateTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Ghi chú yêu cầu riêng</Label>
                <Input
                  placeholder="Yêu cầu lực massage nhẹ, dị ứng tinh dầu..."
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs font-semibold"
                >
                  Xác nhận đặt lịch
                </Button>
              </DialogFooter>
            </form>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
