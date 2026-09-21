import React, { useCallback, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { paymentsApi, ApiPayment, ApiSepayTransaction } from '@/lib/api';
import { Search, QrCode, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react';
import { useRefresh } from '@/lib/use-refresh';

export const PaymentsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [payments, setPayments] = useState<ApiPayment[]>([]);
  const [selectedTx, setSelectedTx] = useState<ApiPayment | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [manualReview, setManualReview] = useState<ApiSepayTransaction[]>([]);
  const [reconcilePaymentIds, setReconcilePaymentIds] = useState<Record<number, string>>({});

  const reload = useCallback(async (signal?: AbortSignal) => {
    try {
      const [data, review] = await Promise.all([
        paymentsApi.getAll({ search: search.trim() || undefined, status: statusFilter, size: 100 }, signal),
        paymentsApi.getSepayTransactions('MANUAL_REVIEW', signal),
      ]);
      if (Array.isArray(data)) {
        setPayments(data);
      }
      setManualReview(Array.isArray(review) ? review : []);
    } catch {
      // The transport retries on its next cycle.
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useRefresh('payment', reload);

  const paid = payments.filter((p) => p.status === 'PAID').reduce((sum, p) => sum + Number(p.amount), 0);
  const unpaid = payments.filter((p) => p.status === 'UNPAID').reduce((sum, p) => sum + Number(p.amount), 0);
  const refunded = payments.filter((p) => p.status === 'REFUNDED').reduce((sum, p) => sum + Number(p.amount), 0);

  const handleOpenDetail = (tx: ApiPayment) => {
    setSelectedTx(tx);
    setDetailModalOpen(true);
  };

  const handleMarkPaid = async () => {
    if (!selectedTx) return;
    setActionLoading(true);
    try {
      await paymentsApi.markPaid(selectedTx.id, selectedTx.transactionCode);
      setSelectedTx({ ...selectedTx, status: 'PAID', paidAt: new Date().toISOString() });
      setSuccessMsg(`Đã xác nhận thanh toán thành công cho giao dịch ${selectedTx.transactionCode}`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await reload();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xác nhận thanh toán');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!selectedTx || !window.confirm(`Xác nhận hoàn tiền cho giao dịch ${selectedTx.transactionCode}?`)) return;
    setActionLoading(true);
    try {
      await paymentsApi.refund(selectedTx.id);
      setSelectedTx({ ...selectedTx, status: 'REFUNDED' });
      setSuccessMsg(`Đã hoàn tiền thành công cho giao dịch ${selectedTx.transactionCode}`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await reload();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi hoàn tiền');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReconcile = async (transaction: ApiSepayTransaction, action: 'CONFIRM' | 'IGNORE') => {
    const paymentId = Number(reconcilePaymentIds[transaction.sepayId]);
    if (action === 'CONFIRM' && (!paymentId || paymentId <= 0)) {
      alert('Nhập Payment ID cần khớp trước khi xác nhận.');
      return;
    }
    setActionLoading(true);
    try {
      await paymentsApi.reconcileSepay(transaction.sepayId, action, action === 'CONFIRM' ? paymentId : undefined);
      setSuccessMsg(action === 'CONFIRM' ? `Đã đối soát giao dịch SePay #${transaction.sepayId}` : `Đã bỏ qua giao dịch SePay #${transaction.sepayId}`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await reload();
    } catch (err: any) {
      alert(err.message || 'Không thể xử lý giao dịch SePay');
    } finally {
      setActionLoading(false);
    }
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
            Đối soát dòng tiền và lịch sử giao dịch trực tiếp từ cơ sở dữ liệu ({payments.length} hóa đơn)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-[#E8F5E9] px-3.5 py-1.5 border border-[#2E7D32]/20 text-xs font-semibold text-[#1E3B2B]">
            <QrCode className="h-4 w-4 text-[#2E7D32]" />
            <span>Phương thức: VietQR & Tại Spa</span>
          </div>

          <Button
            variant="outline"
            onClick={() => reload()}
            className="text-xs h-10 border-[#D9E5DC] cursor-pointer"
          >
            <RefreshCw className="h-4 w-4 mr-1.5 text-[#8EAA97]" /> Làm mới
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="rounded-xl bg-[#E8F5E9] border border-[#2E7D32]/20 p-3.5 text-xs text-[#1E3B2B] font-medium animate-in fade-in">
          ✓ {successMsg}
        </div>
      )}

      {/* 3 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-6 space-y-2 border border-[#E2E8E3] shadow-luxury">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8EAA97]">
            Tổng doanh thu đã thu
          </span>
          <div className="font-display text-3xl font-bold text-[#14271C]">
            {paid.toLocaleString('vi-VN')} đ
          </div>
          <p className="text-xs text-[#2E7D32] flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Giao dịch khớp lệnh thực tế
          </p>
        </Card>

        <Card className="p-6 space-y-2 border border-[#E2E8E3] shadow-luxury">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8EAA97]">
            Chờ thanh toán (Pending)
          </span>
          <div className="font-display text-3xl font-bold text-[#C5A880]">
            {unpaid.toLocaleString('vi-VN')} đ
          </div>
          <p className="text-xs text-[#526056]">
            ○ {payments.filter((p) => p.status === 'UNPAID').length} lịch hẹn đang chờ thu tiền
          </p>
        </Card>

        <Card className="p-6 space-y-2 border border-[#E2E8E3] shadow-luxury">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8EAA97]">
            Đã hoàn tiền (Refunded)
          </span>
          <div className="font-display text-3xl font-bold text-[#BA1A1A]">
            {refunded.toLocaleString('vi-VN')} đ
          </div>
          <p className="text-xs text-[#BA1A1A]/80">
            ○ {payments.filter((p) => p.status === 'REFUNDED').length} khoản hủy lịch
          </p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8EAA97]" />
          <Input
            placeholder="Tìm theo mã GD, mã vé hoặc khách hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 text-xs rounded-xl bg-white border-[#E2E8E3]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
          {['ALL', 'PAID', 'UNPAID', 'REFUNDED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#1E3B2B] text-white'
                  : 'bg-white border border-[#E2E8E3] text-[#526056] hover:border-[#1E3B2B]'
              }`}
            >
              {st === 'ALL' ? 'Tất cả' : st === 'PAID' ? 'Đã thu' : st === 'UNPAID' ? 'Chờ thanh toán' : 'Hoàn tiền'}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <Card className="overflow-hidden border border-[#E2E8E3] shadow-luxury">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8E3] bg-[#FAFBF9] text-[#718276] uppercase tracking-wider font-semibold">
                <th className="py-3 px-6">Mã giao dịch</th>
                <th className="py-3 px-6">Mã lịch hẹn</th>
                <th className="py-3 px-6">Khách hàng</th>
                <th className="py-3 px-6">Phương thức</th>
                <th className="py-3 px-6">Số tiền</th>
                <th className="py-3 px-6">Thời gian</th>
                <th className="py-3 px-6">Trạng thái</th>
                <th className="py-3 px-6 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8E3]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8EAA97]">
                    Đang tải danh sách giao dịch từ database...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8EAA97]">
                    Không tìm thấy giao dịch nào
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAFBF9] transition-colors">
                    <td className="py-4 px-6 font-semibold text-[#14271C]">{p.transactionCode}</td>
                    <td className="py-4 px-6 text-[#1E3B2B] font-medium">{p.bookingCode || `#${p.bookingId}`}</td>
                    <td className="py-4 px-6 text-[#14271C]">{p.customerName || 'Khách hàng'}</td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded bg-[#FAFBF9] border border-[#E2E8E3] text-[11px] font-semibold text-[#526056]">
                        {p.paymentProvider || p.method}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-[#14271C]">
                      {Number(p.amount).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-4 px-6 text-[#526056]">
                      {new Date(p.createdAt || p.paidAt || Date.now()).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          p.status === 'PAID'
                            ? 'bg-[#E8F5E9] text-[#2E7D32]'
                            : p.status === 'UNPAID'
                            ? 'bg-[#FFF3E0] text-[#E65100]'
                            : 'bg-[#FCE8E6] text-[#BA1A1A]'
                        }`}
                      >
                        {p.status === 'PAID' ? 'Đã thu' : p.status === 'UNPAID' ? 'Chờ thanh toán' : 'Đã hoàn'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDetail(p)}
                        className="h-8 text-xs text-[#1E3B2B] hover:bg-[#E8F0EA] cursor-pointer"
                      >
                        Xem <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {manualReview.length > 0 && (
        <Card className="overflow-hidden border border-[#E6B85C]/40 shadow-luxury">
          <div className="p-5 border-b border-[#E2E8E3] bg-[#FFF8E7]">
            <h2 className="font-display text-xl font-semibold text-[#14271C]">SePay cần đối soát thủ công</h2>
            <p className="text-xs text-[#6B726C] mt-1">Giao dịch sai mã, sai số tiền hoặc sai tài khoản không được tự động xác nhận booking.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E2E8E3] text-[#718276] uppercase tracking-wider">
                  <th className="p-4">SePay ID</th><th className="p-4">Nội dung</th><th className="p-4">Số tiền</th><th className="p-4">Lý do</th><th className="p-4">Xử lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8E3]">
                {manualReview.map((transaction) => (
                  <tr key={transaction.sepayId}>
                    <td className="p-4 font-semibold">#{transaction.sepayId}</td>
                    <td className="p-4"><div>{transaction.paymentCode || transaction.content || 'Không có mã'}</div><div className="text-[#8EAA97]">{transaction.referenceCode}</div></td>
                    <td className="p-4 font-semibold">{Number(transaction.transferAmount).toLocaleString('vi-VN')} đ</td>
                    <td className="p-4 text-[#BA1A1A]">{transaction.reviewReason}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Input className="w-24 h-9" inputMode="numeric" placeholder="Payment ID" value={reconcilePaymentIds[transaction.sepayId] || ''} onChange={(event) => setReconcilePaymentIds((current) => ({ ...current, [transaction.sepayId]: event.target.value }))} />
                        <Button disabled={actionLoading} className="h-9 text-xs" onClick={() => void handleReconcile(transaction, 'CONFIRM')}>Khớp</Button>
                        <Button disabled={actionLoading} variant="outline" className="h-9 text-xs" onClick={() => void handleReconcile(transaction, 'IGNORE')}>Bỏ qua</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Transaction Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        {selectedTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 font-body">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-luxury border border-[#E2E8E3] animate-in fade-in zoom-in-95 space-y-4">
              <DialogHeader>
                <DialogTitle className="font-display text-xl text-[#14271C]">
                  Chi tiết giao dịch
                </DialogTitle>
                <DialogDescription className="text-xs text-[#6B726C]">
                  Mã tham chiếu: {selectedTx.transactionCode}
                </DialogDescription>
              </DialogHeader>

              <div className="p-4 rounded-2xl bg-[#FAFBF9] border border-[#E2E8E3] space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8EAA97]">Khách hàng:</span>
                  <span className="font-semibold text-[#14271C]">{selectedTx.customerName || 'Khách hàng'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8EAA97]">Mã lịch hẹn:</span>
                  <span className="font-semibold text-[#1E3B2B]">{selectedTx.bookingCode || `#${selectedTx.bookingId}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8EAA97]">Phương thức:</span>
                  <span className="font-semibold text-[#14271C]">{selectedTx.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8EAA97]">Số tiền:</span>
                  <span className="font-bold text-[#1E3B2B] text-base">
                    {Number(selectedTx.amount).toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8EAA97]">Thời gian ghi nhận:</span>
                  <span className="text-[#526056]">
                    {selectedTx.createdAt ? new Date(selectedTx.createdAt).toLocaleString('vi-VN') : '—'}
                  </span>
                </div>
                {selectedTx.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-[#8EAA97]">Thời gian khớp lệnh:</span>
                    <span className="text-[#2E7D32] font-medium">
                      {new Date(selectedTx.paidAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions for UNPAID and PAID */}
              <div className="flex gap-2 pt-2">
                {selectedTx.status === 'UNPAID' && (
                  <Button
                    onClick={handleMarkPaid}
                    disabled={actionLoading}
                    className="flex-1 rounded-xl bg-[#2E7D32] text-white hover:bg-[#1B5E20] text-xs h-10 font-semibold cursor-pointer"
                  >
                    Xác nhận đã nhận tiền (Paid)
                  </Button>
                )}

                {selectedTx.status === 'PAID' && (
                  <Button
                    onClick={handleRefund}
                    disabled={actionLoading}
                    variant="outline"
                    className="flex-1 rounded-xl border-[#BA1A1A] text-[#BA1A1A] hover:bg-[#BA1A1A]/10 text-xs h-10 font-semibold cursor-pointer"
                  >
                    Hoàn tiền (Refund)
                  </Button>
                )}
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDetailModalOpen(false)}
                  className="rounded-xl text-xs w-full"
                >
                  Đóng
                </Button>
              </DialogFooter>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
