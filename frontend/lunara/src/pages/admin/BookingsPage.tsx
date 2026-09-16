import React, { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { api, ApiBooking, events, json } from '@/lib/api';
import { MOCK_BOOKINGS } from '@/data/mock-bookings';
import { MOCK_SERVICES } from '@/data/mock-services';
import { MOCK_STAFF } from '@/data/mock-staff';
import { Search, Filter, Plus, CheckCircle2, ChevronRight, X } from 'lucide-react';

const INITIAL_API_BOOKINGS: ApiBooking[] = MOCK_BOOKINGS.map((b) => ({
  id: b.id,
  bookingCode: b.bookingCode,
  status: b.status,
  customerNameSnapshot: b.customerNameSnapshot,
  customerEmailSnapshot: b.customerEmailSnapshot,
  customerPhoneSnapshot: b.customerPhoneSnapshot,
  staffAccountId: b.staffAccountId || '1',
  bookingStart: b.bookingStart,
  bookingEnd: b.bookingEnd,
  serverNow: new Date().toISOString(),
  totalDurationMinutes: b.totalDurationMinutes,
  totalAmount: b.totalAmount,
  paymentStatus: b.paymentStatus,
  qrImageUrl: 'https://img.vietqr.io/image/970415-10987654321-compact.png',
  bank: 'VietinBank',
  bankAccount: '10987654321',
  paymentMemo: `LNR ${b.bookingCode}`,
  items: b.items.map((it) => ({
    serviceId: it.serviceId,
    serviceNameSnapshot: it.serviceNameSnapshot,
    durationMinutes: it.durationMinutes,
    lineAmount: it.lineAmount,
  })),
}));

export const BookingsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [bookings, setBookings] = useState<ApiBooking[]>(INITIAL_API_BOOKINGS);
  const [selectedBooking, setSelectedBooking] = useState<ApiBooking | null>(null);
  const [requests, setRequests] = useState<{ id: string; bookingCode: string; customerName: string; reason: string; status: string }[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State for new booking
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formCustomerPhone, setFormCustomerPhone] = useState('');
  const [formCustomerEmail, setFormCustomerEmail] = useState('');
  const [formServiceId, setFormServiceId] = useState(MOCK_SERVICES[0]?.id || '');
  const [formStaffId, setFormStaffId] = useState('AUTO');
  const [formDateTime, setFormDateTime] = useState('2026-09-15T15:00');
  const [formNote, setFormNote] = useState('');

  const reload = useCallback(() => {
    void api<ApiBooking[]>('/api/v1/admin/bookings')
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setBookings(data);
      })
      .catch(() => {
        // Giữ mock data khi backend offline
      });
    void api<typeof requests>('/api/v1/admin/reschedule-requests').then(setRequests).catch(() => setRequests([]));
  }, []);

  useEffect(() => {
    void reload();
    const source = events();
    source.addEventListener('booking.events', reload);
    const poll = window.setInterval(reload, 10000);
    return () => { source.close(); window.clearInterval(poll); };
  }, [reload]);

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomerName.trim() || !formCustomerPhone.trim()) {
      return;
    }

    const selectedService = MOCK_SERVICES.find((s) => s.id === formServiceId) || MOCK_SERVICES[0];
    const newCode = `LNR-0${Math.floor(20 + Math.random() * 80)}`;

    const newBooking: ApiBooking = {
      id: `b-${Date.now()}`,
      bookingCode: newCode,
      status: 'CONFIRMED',
      customerNameSnapshot: formCustomerName,
      customerPhoneSnapshot: formCustomerPhone,
      customerEmailSnapshot: formCustomerEmail || `${formCustomerPhone}@client.lunara.vn`,
      staffAccountId: formStaffId === 'AUTO' ? '1' : formStaffId,
      bookingStart: formDateTime ? new Date(formDateTime).toISOString() : new Date().toISOString(),
      bookingEnd: new Date(Date.now() + selectedService.minimumDurationMinutes * 60000).toISOString(),
      serverNow: new Date().toISOString(),
      totalDurationMinutes: selectedService.minimumDurationMinutes,
      totalAmount: selectedService.basePrice,
      paymentStatus: 'PAID',
      qrImageUrl: 'https://img.vietqr.io/image/970415-10987654321-compact.png',
      bank: 'VietinBank',
      bankAccount: '10987654321',
      paymentMemo: `LNR ${newCode}`,
      items: [
        {
          serviceId: selectedService.id,
          serviceNameSnapshot: selectedService.name,
          durationMinutes: selectedService.minimumDurationMinutes,
          lineAmount: selectedService.basePrice,
        },
      ],
    };

    setBookings([newBooking, ...bookings]);
    setCreateModalOpen(false);
    setSuccessMsg(`Đã tạo thành công lịch hẹn #${newCode} cho khách hàng ${formCustomerName}`);
    setTimeout(() => setSuccessMsg(''), 4000);

    // Reset Form
    setFormCustomerName('');
    setFormCustomerPhone('');
    setFormCustomerEmail('');
    setFormNote('');
  };

  const filtered = bookings.filter((b) => {
    const matchSearch =
      b.bookingCode.toLowerCase().includes(search.toLowerCase()) ||
      b.customerNameSnapshot.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleOpenDetail = (b: ApiBooking) => {
    setSelectedBooking(b);
    setDetailOpen(true);
  };
  const checkIn = async () => {
    if (!selectedBooking) return;
    try {
      const updated = await api<ApiBooking>(`/api/v1/bookings/${selectedBooking.bookingCode}/check-in`, { method: 'POST' });
      setSelectedBooking(updated); void reload(); setError('');
    } catch {
      // Local fallback state
      const updated: ApiBooking = { ...selectedBooking, status: 'CHECKED_IN' };
      setSelectedBooking(updated);
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    }
  };
  const [newStart, setNewStart] = useState('');
  const reschedule = async () => {
    if (!selectedBooking || !newStart) return;
    try {
      const updated = await api<ApiBooking>(`/api/v1/bookings/${selectedBooking.bookingCode}/reschedule`, { method: 'POST', body: json({ bookingStart: new Date(newStart).toISOString(), staffAccountId: Number(selectedBooking.staffAccountId), staffNote: 'Đã liên hệ khách và xác nhận thời gian mới' }) });
      setSelectedBooking(updated); setNewStart(''); void reload(); setError('');
    } catch {
      const updated: ApiBooking = { ...selectedBooking, bookingStart: new Date(newStart).toISOString() };
      setSelectedBooking(updated);
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      setNewStart('');
    }
  };
  const updateRequest = async (id: string, decision: string) => {
    try { await api(`/api/v1/admin/reschedule-requests/${id}/${decision}`, { method: 'POST', body: json({ staffNote: decision === 'CONTACTED' ? 'Đã liên hệ khách' : 'Không thể đáp ứng yêu cầu' }) }); reload(); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không cập nhật được yêu cầu'); }
  };

  return (
    <div className="space-y-6 font-body max-w-7xl mx-auto">
      {/* Top Title & New Booking Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#14271C]">
            Quản lý đặt lịch
          </h1>
          <p className="text-xs text-[#6B726C] mt-1">
            Tổng cộng {bookings.length} lịch hẹn trong hệ thống Lunara
          </p>
        </div>

        <Button
          onClick={() => setCreateModalOpen(true)}
          className="rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs font-semibold h-11 px-5 shadow-luxury cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-1.5 text-[#C5A880]" />
          Tạo lịch hẹn mới
        </Button>
      </div>

      {successMsg && (
        <div className="rounded-xl bg-[#E8F5E9] border border-[#2E7D32]/20 p-3.5 text-xs text-[#1E3B2B] font-medium flex items-center justify-between animate-in fade-in">
          <span>✓ {successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-[#2E7D32] hover:opacity-75">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {requests.length > 0 && <Card className="p-4 space-y-2"><h2 className="text-sm font-semibold text-[#14271C]">Yêu cầu đổi lịch đang mở ({requests.length})</h2>{requests.map((request) => <div key={request.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#F8F9F5] p-3 text-xs"><span><strong>{request.customerName}</strong> · {request.bookingCode} · {request.reason} · {request.status}</span><span className="flex gap-2"><Button size="sm" variant="outline" onClick={() => void updateRequest(request.id, 'CONTACTED')}>Đã liên hệ</Button><Button size="sm" variant="outline" onClick={() => void updateRequest(request.id, 'DECLINED')}>Từ chối</Button></span></div>)}</Card>}

      {/* Filter Toolbar */}
      <Card className="p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8EAA97]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã vé hoặc tên khách..."
              className="pl-10 text-xs h-10"
            />
          </div>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs h-10"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="CHECKED_IN">Đã check-in</option>
            <option value="IN_SERVICE">Đang phục vụ</option>
            <option value="PENDING">Chờ xử lý</option>
            <option value="COMPLETED">Đã hoàn thành</option>
          </Select>

          <Select defaultValue="TODAY" className="text-xs h-10">
            <option value="TODAY">Thời gian: Hôm nay</option>
            <option value="WEEK">Tuần này</option>
            <option value="MONTH">Tháng này</option>
          </Select>

          <Button variant="outline" className="h-10 text-xs text-[#526056] border-[#D9E5DC]">
            <Filter className="h-3.5 w-3.5 mr-1.5" /> Bộ lọc nâng cao
          </Button>
        </div>
      </Card>

      {/* Bookings Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F8F9F5] border-b border-[#E2E8E3] text-[#6B726C] uppercase font-semibold">
              <tr>
                <th className="py-3 px-6">Mã vé</th>
                <th className="py-3 px-6">Khách hàng</th>
                <th className="py-3 px-6">Ngày & Giờ</th>
                <th className="py-3 px-6">Dịch vụ</th>
                <th className="py-3 px-6">Kỹ thuật viên</th>
                <th className="py-3 px-6">Trạng thái</th>
                <th className="py-3 px-6 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8E3]">
              {filtered.map((b) => (
                <tr
                  key={b.id}
                  onClick={() => handleOpenDetail(b)}
                  className="hover:bg-[#F8F9F5]/90 transition-colors cursor-pointer"
                >
                  <td className="py-4 px-6 font-mono font-bold text-[#1E3B2B]">
                    #{b.bookingCode}
                  </td>
                  <td className="py-4 px-6 font-medium text-[#14271C]">
                    <div>{b.customerNameSnapshot}</div>
                    <div className="text-[11px] text-[#6B726C]">{b.customerPhoneSnapshot}</div>
                  </td>
                  <td className="py-4 px-6 text-[#14271C]">
                    {new Date(b.bookingStart).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                  </td>
                  <td className="py-4 px-6 text-[#526056]">
                    {b.items[0]?.serviceNameSnapshot || '—'}
                  </td>
                  <td className="py-4 px-6 text-[#14271C]">
                    #{b.staffAccountId}
                  </td>
                  <td className="py-4 px-6">
                    <Badge
                      variant={
                        b.status === 'CONFIRMED'
                          ? 'default'
                          : b.status === 'CHECKED_IN'
                          ? 'secondary'
                          : b.status === 'COMPLETED'
                          ? 'success'
                          : 'warning'
                      }
                    >
                      {b.status === 'CONFIRMED'
                        ? '● Đã xác nhận'
                        : b.status === 'CHECKED_IN'
                        ? '● Đã check-in'
                        : b.status === 'COMPLETED'
                        ? '✓ Hoàn thành'
                        : '○ Chờ duyệt'}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-right text-[#8EAA97]">
                    <ChevronRight className="h-4 w-4 inline-block" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Booking Detail Slide-over Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        {selectedBooking && (
          <div className="space-y-6">
            <SheetHeader>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#8EAA97]">
                    Chi tiết lịch hẹn
                  </span>
                  <SheetTitle>Booking #{selectedBooking.bookingCode}</SheetTitle>
                </div>
                <SheetClose onClick={() => setDetailOpen(false)} />
              </div>
            </SheetHeader>

            {/* Customer Snapshot */}
            <div className="rounded-2xl bg-[#F8F9F5] p-4 space-y-2 text-xs">
              <span className="font-bold text-[#8EAA97] uppercase tracking-wider block">
                Thông tin khách hàng
              </span>
              <p className="text-sm font-bold text-[#14271C]">
                {selectedBooking.customerNameSnapshot}
              </p>
              <p className="text-[#526056]">{selectedBooking.customerPhoneSnapshot}</p>
              <p className="text-[#526056]">{selectedBooking.customerEmailSnapshot}</p>
            </div>

            {/* Appointment Details */}
            <div className="rounded-2xl bg-white border border-[#E2E8E3] p-4 space-y-3 text-xs">
              <span className="font-bold text-[#8EAA97] uppercase tracking-wider block">
                Chi tiết dịch vụ
              </span>
              <div className="flex justify-between font-medium">
                <span className="text-[#14271C]">{selectedBooking.items[0]?.serviceNameSnapshot}</span>
                <span className="text-[#1E3B2B]">{selectedBooking.totalAmount.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between text-[#6B726C]">
                <span>Thời gian trị liệu:</span>
                <span>{selectedBooking.totalDurationMinutes} phút</span>
              </div>
              <div className="flex justify-between text-[#6B726C]">
                <span>Chuyên viên:</span>
                <span className="font-semibold text-[#14271C]">#{selectedBooking.staffAccountId}</span>
              </div>
            </div>

            {/* Action Check In Button */}
            <div className="pt-4 border-t border-[#E2E8E3] space-y-2">
              <Button onClick={() => void checkIn()} disabled={selectedBooking.status !== 'CONFIRMED'} className="w-full h-12 rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] font-semibold text-xs">
                <CheckCircle2 className="h-4 w-4 mr-1.5 text-[#C5A880]" />
                Check In Khách Hàng
              </Button>
              {selectedBooking.status === 'CONFIRMED' && <><Input type="datetime-local" value={newStart} onChange={(e) => setNewStart(e.target.value)} aria-label="Thời gian mới sau khi đã liên hệ khách" /><Button variant="outline" onClick={() => void reschedule()} disabled={!newStart} className="w-full h-10 text-xs">Dời lịch sau khi liên hệ khách</Button></>}
            </div>
          </div>
        )}
      </Sheet>

      {/* Modal Tạo Lịch Hẹn Mới */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <form onSubmit={handleCreateBooking} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Tạo lịch hẹn mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin khách hàng và dịch vụ spa để đặt lịch hẹn tại Lunara
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <Label>Họ và tên khách hàng *</Label>
              <Input
                required
                placeholder="Ví dụ: Nguyễn Văn An"
                value={formCustomerName}
                onChange={(e) => setFormCustomerName(e.target.value)}
                className="h-10 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Số điện thoại *</Label>
                <Input
                  required
                  placeholder="0912 345 678"
                  value={formCustomerPhone}
                  onChange={(e) => setFormCustomerPhone(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="khachhang@gmail.com"
                  value={formCustomerEmail}
                  onChange={(e) => setFormCustomerEmail(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Gói dịch vụ spa *</Label>
              <select
                value={formServiceId}
                onChange={(e) => setFormServiceId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[#E2E8E3] bg-white text-xs font-medium text-[#14271C] focus:outline-none focus:ring-2 focus:ring-[#1E3B2B]"
              >
                {MOCK_SERVICES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.minimumDurationMinutes}p) — {s.basePrice.toLocaleString('vi-VN')} đ
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Kỹ thuật viên</Label>
                <select
                  value={formStaffId}
                  onChange={(e) => setFormStaffId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E2E8E3] bg-white text-xs font-medium text-[#14271C] focus:outline-none focus:ring-2 focus:ring-[#1E3B2B]"
                >
                  <option value="AUTO">✨ Tự động gán KTV rảnh</option>
                  {MOCK_STAFF.map((stf) => (
                    <option key={stf.account.id} value={stf.account.id}>
                      {stf.account.displayName} ({stf.profile.jobTitle})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label>Thời gian hẹn *</Label>
                <Input
                  type="datetime-local"
                  value={formDateTime}
                  onChange={(e) => setFormDateTime(e.target.value)}
                  className="h-10 text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Ghi chú của khách / Lưu ý chuyên viên</Label>
              <Input
                placeholder="Yêu cầu lực massage, da nhạy cảm..."
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                className="h-10 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
              className="text-xs h-10"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              className="bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs h-10 px-4 font-semibold"
            >
              Xác nhận tạo lịch
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
};
