import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Clock, ShieldCheck, Copy, Check, ArrowRight } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { bookingsApi, ApiBooking, ApiError, ApiPayment, paymentsApi } from '@/lib/api';
import { useRefresh } from '@/lib/use-refresh';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const code = params.get('booking');
  const [booking, setBooking] = useState<ApiBooking | null>(null);
  const [payment, setPayment] = useState<ApiPayment | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());

  const reload = useCallback(async (signal?: AbortSignal) => {
    if (!code) { setError('Thiếu mã đặt lịch.'); return; }
    try {
      const result = await bookingsApi.getByCode(code, signal);
      setBooking(result);
      const currentPayment = await paymentsApi.getByBooking(result.id, signal)
        .catch((paymentError) => {
          if (paymentError instanceof ApiError && paymentError.status === 404) {
            return paymentsApi.create({ bookingId: result.id, method: 'QR' });
          }
          throw paymentError;
        });
      setPayment(currentPayment);
      setError('');
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Không thể tải lịch hẹn.');
    }
  }, [code]);

  useRefresh('payment', reload, Boolean(code));
  useEffect(() => {
    const tick = window.setTimeout(() => setNow(Date.now()), 1000);
    return () => window.clearTimeout(tick);
  }, [now]);

  const remaining = booking?.holdExpiresAt && booking.status === 'PENDING_PAYMENT'
    ? Math.max(0, Math.ceil((new Date(booking.holdExpiresAt).getTime() - now) / 1000)) : 0;
  const formatCountdown = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const copyBankInfo = async () => {
    if (!payment) return;
    await navigator.clipboard.writeText(payment.qrPayload || payment.transactionCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8F9F5] flex flex-col items-center justify-center p-6 sm:p-12 font-body">
      <div className="text-center mb-8 space-y-1">
        <span className="font-display text-3xl font-semibold text-[#14271C] tracking-tight">Lunara</span>
        <p className="text-[11px] uppercase tracking-widest text-[#8EAA97] font-bold">Cổng thanh toán tức thì</p>
      </div>
      <div className="w-full max-w-lg rounded-3xl bg-white border border-[#E2E8E3] shadow-luxury p-8 space-y-6">
        <div className="text-center pb-6 border-b border-[#E2E8E3] space-y-1">
          <h2 className="font-display text-2xl font-semibold text-[#14271C]">THANH TOÁN LỊCH HẸN</h2>
          {booking && <p className="text-xs text-[#6B726C]">Mã đặt lịch: <span className="font-mono font-bold text-[#1E3B2B]">{booking.bookingCode}</span></p>}
        </div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {!booking && !error && <p className="text-sm text-[#526056]">Đang tải lịch hẹn…</p>}
        {booking && <>
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8EAA97]">Dịch vụ đã chọn</span>
            {booking.items.map((item) => <div key={item.serviceId} className="flex items-center justify-between rounded-xl bg-[#F8F9F5] p-3.5 border border-[#E2E8E3]/60 text-xs">
              <div><h4 className="font-semibold text-[#14271C]">{item.serviceName || item.serviceNameSnapshot || 'Dịch vụ spa'}</h4><span>{item.durationMinutes} phút</span></div>
              <span className="font-bold text-[#14271C]">{Number(item.lineAmount).toLocaleString('vi-VN')} đ</span>
            </div>)}
          </div>
          <div className="pt-2 border-t border-[#E2E8E3] flex justify-between items-baseline">
            <span className="font-semibold text-sm text-[#526056]">Tổng thanh toán</span>
            <span className="font-display text-2xl font-bold text-[#14271C]">{Number(booking.totalAmount).toLocaleString('vi-VN')} đ</span>
          </div>
          {payment?.status === 'UNPAID' && booking.status === 'PENDING_PAYMENT' && remaining > 0 ? <>
            <div className="relative mx-auto flex flex-col items-center rounded-2xl bg-[#F8F9F5] p-6 border border-[#E2E8E3]">
              {payment.qrPayload && <QRCodeSVG value={payment.qrPayload} size={208} level="M" aria-label="Mã QR thanh toán nội bộ Lunara" className="rounded-xl bg-white p-2" />}
              <div className="mt-4 flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 border border-[#D9E5DC] text-xs font-semibold text-[#1E3B2B]"><Clock className="h-3.5 w-3.5" />Còn {formatCountdown(remaining)}</div>
            </div>
            <p className="text-xs text-center text-[#526056]">Đây là mã thanh toán nội bộ <strong>{payment.transactionCode}</strong>, đang chờ nhân viên Lunara xác nhận thủ công.</p>
            <button type="button" onClick={() => void copyBankInfo()} className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#D9E5DC] bg-white py-2.5 text-xs font-medium text-[#526056] hover:bg-[#F8F9F5]">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Đã sao chép' : 'Sao chép mã thanh toán nội bộ'}
            </button>
          </> : <p className="text-center text-sm text-[#526056]">{payment?.status === 'PAID' || booking.status === 'CONFIRMED' ? 'Thanh toán đã được nhân viên xác nhận. Vé lịch hẹn đã sẵn sàng.' : booking.status === 'PENDING_PAYMENT' && remaining === 0 ? 'Thời gian giữ chỗ đã hết. Vui lòng liên hệ spa nếu cần hỗ trợ.' : `Trạng thái thanh toán: ${payment?.status || 'đang khởi tạo'}`}</p>}
          <Button disabled={booking.status !== 'CONFIRMED'} onClick={() => navigate(`/ticket/${booking.bookingCode}`)} className="w-full rounded-xl h-13 bg-[#1E3B2B] text-white hover:bg-[#14271C] font-semibold text-sm shadow-luxury">
            Xem vé lịch hẹn <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </>}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#8EAA97]"><ShieldCheck className="h-3.5 w-3.5" />Xác nhận dựa trên giao dịch thực tế, không dựa vào nút bấm</div>
      </div>
    </div>
  );
};
