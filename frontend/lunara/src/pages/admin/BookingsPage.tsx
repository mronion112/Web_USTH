import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { MOCK_BOOKINGS } from '@/data/mock-bookings';
import { Booking } from '@/types';
import { Search, Filter, Plus, Calendar, Clock, User, CheckCircle2, ChevronRight, X } from 'lucide-react';

export const BookingsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filtered = MOCK_BOOKINGS.filter((b) => {
    const matchSearch =
      b.bookingCode.toLowerCase().includes(search.toLowerCase()) ||
      b.customerNameSnapshot.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleOpenDetail = (b: Booking) => {
    setSelectedBooking(b);
    setDetailOpen(true);
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
            Tổng cộng 142 lịch hẹn trong hệ thống Lunara
          </p>
        </div>

        <Button className="rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs font-semibold h-11 px-5 shadow-luxury">
          <Plus className="h-4 w-4 mr-1.5 text-[#C5A880]" />
          Tạo lịch hẹn mới
        </Button>
      </div>

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
                    14/09 · 14:00
                  </td>
                  <td className="py-4 px-6 text-[#526056]">
                    {b.items[0]?.serviceNameSnapshot || 'Massage Thư Giãn'}
                  </td>
                  <td className="py-4 px-6 text-[#14271C]">
                    {b.staffName || '—'}
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
                <span className="font-semibold text-[#14271C]">{selectedBooking.staffName || 'Chưa gán'}</span>
              </div>
            </div>

            {/* Note */}
            {selectedBooking.customerNote && (
              <div className="rounded-2xl bg-amber-50 p-4 text-xs text-amber-900 space-y-1 border border-amber-200">
                <span className="font-bold">Ghi chú từ khách:</span>
                <p>{selectedBooking.customerNote}</p>
              </div>
            )}

            {/* Activity History */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-[#8EAA97] uppercase tracking-wider block">
                Nhật ký hoạt động
              </span>
              <ul className="space-y-2 text-[#526056]">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#2E7D32]" />
                  <span>13:42 — Email xác nhận đã gửi đến khách hàng</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#2E7D32]" />
                  <span>13:41 — Đã nhận thanh toán qua mã QR Vietcombank</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#C5A880]" />
                  <span>13:40 — Khách tạo lịch hẹn trên web Lunara</span>
                </li>
              </ul>
            </div>

            {/* Action Check In Button */}
            <div className="pt-4 border-t border-[#E2E8E3] space-y-2">
              <Button className="w-full h-12 rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] font-semibold text-xs">
                <CheckCircle2 className="h-4 w-4 mr-1.5 text-[#C5A880]" />
                Check In Khách Hàng
              </Button>
              <Button variant="outline" className="w-full h-10 text-xs">
                Dời lịch hẹn (Reschedule)
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
};
