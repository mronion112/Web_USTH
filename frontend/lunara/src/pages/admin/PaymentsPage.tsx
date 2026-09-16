import React, { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { api, events } from '@/lib/api';
import { MOCK_PAYMENTS } from '@/data/mock-payments';
import { Payment } from '@/types';
import { Search, Download, QrCode, CheckCircle2, ShieldCheck, ChevronRight } from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [payments, setPayments] = useState<Payment[]>(MOCK_PAYMENTS);
  const [selectedTx, setSelectedTx] = useState<Payment | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const reload = useCallback(() => {
    api<any[]>('/api/v1/admin/payments')
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const normalized: Payment[] = data.map((d) => ({
            id: d.id,
            transactionCode: d.transactionCode || d.id,
            bookingId: d.bookingId || '',
            bookingCode: d.bookingCode,
            customerName: d.customerName || 'Khách hàng',
            status: d.status,
            method: 'QR',
            amount: d.amount,
            paidAt: d.paidAt,
            createdAt: d.createdAt || new Date().toISOString(),
          }));
          setPayments(normalized);
        }
      })
      .catch(() => {
        // Fallback to MOCK_PAYMENTS when API is offline
      });
  }, []);

  useEffect(() => {
    void reload();
    const source = events();
    source.addEventListener('payment.events', reload);
    const poll = window.setInterval(reload, 10000);
    return () => {
      source.close();
      window.clearInterval(poll);
    };
  }, [reload]);

  const filtered = payments.filter((p) => {
    const matchSearch =
      p.bookingCode?.toLowerCase().includes(search.toLowerCase()) ||
      (p.customerName && p.customerName.toLowerCase().includes(search.toLowerCase())) ||
      p.transactionCode.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const paid = payments.filter((p) => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0);
  const unpaid = payments.filter((p) => p.status === 'UNPAID').reduce((sum, p) => sum + p.amount, 0);
  const refunded = payments.filter((p) => p.status === 'REFUNDED').reduce((sum, p) => sum + p.amount, 0);

  const handleOpenDetail = (tx: Payment) => {
    setSelectedTx(tx);
    setDetailModalOpen(true);
  };

  return (
    <div className="space-y-6 font-body max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#14271C]">
            Thanh toán & Giao dịch
          </h1>
          <p className="text-xs text-[#6B726C] mt-1">
            Đối soát dòng tiền qua hình thức duy nhất: Cổng chuyển khoản VietQR tự động
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-[#E8F5E9] px-3.5 py-1.5 border border-[#2E7D32]/20 text-xs font-semibold text-[#1E3B2B]">
            <QrCode className="h-4 w-4 text-[#2E7D32]" />
            <span>Phương thức thanh toán: 100% VietQR</span>
          </div>

          <Button variant="outline" className="text-xs h-10 border-[#D9E5DC]">
            <Download className="h-4 w-4 mr-1.5 text-[#8EAA97]" /> Xuất sao kê Excel
          </Button>
        </div>
      </div>

      {/* 3 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-6 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8EAA97]">
            Tổng đã thu qua VietQR
          </span>
          <div className="font-display text-3xl font-bold text-[#14271C]">
            {paid.toLocaleString('vi-VN')} đ
          </div>
          <p className="text-xs text-[#2E7D32] flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Giao dịch khớp lệnh tự động
          </p>
        </Card>

        <Card className="p-6 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8EAA97]">
            Chờ thanh toán (Pending)
          </span>
          <div className="font-display text-3xl font-bold text-[#C5A880]">
            {unpaid.toLocaleString('vi-VN')} đ
          </div>
          <p className="text-xs text-[#526056]">
            ○ {payments.filter((p) => p.status === 'UNPAID').length} lịch hẹn đang chờ quét mã
          </p>
        </Card>

        <Card className="p-6 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8EAA97]">
            Hoàn tiền (Refunded)
          </span>
          <div className="font-display text-3xl font-bold text-[#6B726C]">
            {refunded.toLocaleString('vi-VN')} đ
          </div>
          <p className="text-xs text-[#6B726C]">Giao dịch đã xác nhận hoàn về tài khoản</p>
        </Card>
      </div>

      {/* Filter Toolbar & Transactions Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-[#E2E8E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8EAA97]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã đặt lịch, mã giao dịch, tên khách..."
              className="pl-10 text-xs h-9 bg-[#F8F9F5]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-[#E2E8E3] bg-white text-xs text-[#14271C]"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PAID">Đã thanh toán (PAID)</option>
              <option value="UNPAID">Chờ thanh toán (UNPAID)</option>
              <option value="FAILED">Thất bại (FAILED)</option>
              <option value="REFUNDED">Đã hoàn tiền (REFUNDED)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F8F9F5] border-b border-[#E2E8E3] text-[#6B726C] uppercase font-semibold">
              <tr>
                <th className="py-3.5 px-6">Mã giao dịch</th>
                <th className="py-3.5 px-6">Mã đặt lịch</th>
                <th className="py-3.5 px-6">Khách hàng</th>
                <th className="py-3.5 px-6">Phương thức</th>
                <th className="py-3.5 px-6 text-right">Số tiền</th>
                <th className="py-3.5 px-6">Trạng thái</th>
                <th className="py-3.5 px-6">Thời gian</th>
                <th className="py-3.5 px-6 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8E3]">
              {filtered.map((tx) => (
                <tr
                  key={tx.id}
                  onClick={() => handleOpenDetail(tx)}
                  className="hover:bg-[#F8F9F5]/80 transition-colors cursor-pointer"
                >
                  <td className="py-4 px-6 font-mono font-bold text-[#1E3B2B]">
                    {tx.transactionCode}
                  </td>
                  <td className="py-4 px-6 font-mono text-[#526056] font-semibold">
                    {tx.bookingCode}
                  </td>
                  <td className="py-4 px-6 font-medium text-[#14271C]">
                    {tx.customerName || 'Khách hàng Lunara'}
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[#1E3B2B] bg-[#E8F5E9] px-2.5 py-1 rounded-full text-[11px]">
                      <QrCode className="h-3.5 w-3.5 text-[#2E7D32]" />
                      Quét mã VietQR
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-display font-bold text-sm text-[#14271C]">
                    {tx.amount.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="py-4 px-6">
                    <Badge
                      variant={
                        tx.status === 'PAID'
                          ? 'success'
                          : tx.status === 'FAILED'
                          ? 'danger'
                          : tx.status === 'REFUNDED'
                          ? 'outline'
                          : 'warning'
                      }
                    >
                      {tx.status === 'PAID'
                        ? '✓ ĐÃ THU'
                        : tx.status === 'FAILED'
                        ? '✕ THẤT BẠI'
                        : tx.status === 'REFUNDED'
                        ? '↩ HOÀN TIỀN'
                        : '○ CHỜ THANH TOÁN'}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-[#6B726C]">
                    {tx.paidAt
                      ? new Date(tx.paidAt).toLocaleString('vi-VN', {
                          timeZone: 'Asia/Ho_Chi_Minh',
                        })
                      : 'Đang xử lý'}
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

      {/* Transaction Detail Dialog Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        {selectedTx && (
          <div className="space-y-4 font-body">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center">
                  <QrCode className="h-4 w-4" />
                </span>
                <div>
                  <DialogTitle>Giao dịch VietQR: {selectedTx.transactionCode}</DialogTitle>
                  <DialogDescription>Mã đặt lịch: #{selectedTx.bookingCode}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="rounded-2xl bg-[#F8F9F5] p-4 border border-[#E2E8E3] space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-[#E2E8E3]">
                <span className="text-[#6B726C]">Khách hàng</span>
                <span className="font-semibold text-[#14271C]">{selectedTx.customerName}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#E2E8E3]">
                <span className="text-[#6B726C]">Số tiền giao dịch</span>
                <span className="font-display font-bold text-base text-[#1E3B2B]">
                  {selectedTx.amount.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#E2E8E3]">
                <span className="text-[#6B726C]">Phương thức</span>
                <span className="font-semibold text-[#14271C]">Chuyển khoản VietQR tức thì</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#E2E8E3]">
                <span className="text-[#6B726C]">Ngân hàng thụ hưởng</span>
                <span className="font-semibold text-[#14271C]">VietinBank · 10987654321</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#E2E8E3]">
                <span className="text-[#6B726C]">Nội dung chuyển khoản (Memo)</span>
                <span className="font-mono font-bold text-[#1E3B2B]">
                  LNR {selectedTx.bookingCode}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6B726C]">Trạng thái giao dịch</span>
                <Badge
                  variant={
                    selectedTx.status === 'PAID'
                      ? 'success'
                      : selectedTx.status === 'REFUNDED'
                      ? 'outline'
                      : 'warning'
                  }
                >
                  {selectedTx.status === 'PAID'
                    ? '✓ Khớp lệnh tự động thành công'
                    : selectedTx.status}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-[#8EAA97] justify-center">
              <ShieldCheck className="h-3.5 w-3.5 text-[#2E7D32]" />
              Xác thực qua Webhook Napas/VietQR bảo mật thời gian thực
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDetailModalOpen(false)}
                className="w-full text-xs h-10"
              >
                Đóng
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
};
