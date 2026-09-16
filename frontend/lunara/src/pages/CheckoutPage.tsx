import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Clock, ShieldCheck, Copy, Check, ArrowRight } from 'lucide-react';
import { api, ApiBooking, events } from '@/lib/api';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const code = params.get('booking');
  const [booking, setBooking] = useState<ApiBooking | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [clockOffset, setClockOffset] = useState(0);
  const [now, setNow] = useState(Date.now());

  const reload = useCallback(async () => {
    if (!code) { setError('Thiếu mã đặt lịch.'); return; }
    try {
      const result = await api<ApiBooking>(`/api/v1/bookings/${encodeURIComponent(code)}`);
      setBooking(result);
      setClockOffset(new Date(result.serverNow).getTime() - Date.now());
      setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể tải lịch hẹn.'); }
  }, [code]);

  useEffect(() => {
    void reload();
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    const poll = window.setInterval(() => void reload(), 5000);
    const source = events();
    source.addEventListener('booking.events', () => void reload());
    return () => { window.clearInterval(tick); window.clearInterval(poll); source.close(); };
  }, [reload]);

  const remaining = booking?.holdExpiresAt && booking.status === 'PENDING_PAYMENT'
    ? Math.max(0, Math.ceil((new Date(booking.holdExpiresAt).getTime() - now - clockOffset) / 1000)) : 0;
  const formatCountdown = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const copyBankInfo = async () => {
    if (!booking) return;
    await navigator.clipboard.writeText(`${booking.bank} | ${booking.bankAccount} | ${booking.totalAmount} VND | ${booking.paymentMemo}`);
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
              <div><h4 className="font-semibold text-[#14271C]">{item.serviceNameSnapshot}</h4><span>{item.durationMinutes} phút</span></div>
              <span className="font-bold text-[#14271C]">{item.lineAmount.toLocaleString('vi-VN')} đ</span>
            </div>)}
          </div>
          <div className="pt-2 border-t border-[#E2E8E3] flex justify-between items-baseline">
            <span className="font-semibold text-sm text-[#526056]">Tổng thanh toán</span>
            <span className="font-display text-2xl font-bold text-[#14271C]">{booking.totalAmount.toLocaleString('vi-VN')} đ</span>
          </div>
          {booking.status === 'PENDING_PAYMENT' && remaining > 0 ? <>
            <div className="relative mx-auto flex flex-col items-center rounded-2xl bg-[#F8F9F5] p-6 border border-[#E2E8E3]">
              <img src={booking.qrImageUrl} alt={`VietQR chuyển khoản ${booking.totalAmount} đồng, nội dung ${booking.paymentMemo}`} className="w-52 h-52 rounded-xl bg-white p-2" />
              <div className="mt-4 flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 border border-[#D9E5DC] text-xs font-semibold text-[#1E3B2B]"><Clock className="h-3.5 w-3.5" />Còn {formatCountdown(remaining)}</div>
            </div>
            <p className="text-xs text-center text-[#526056]">Chuyển khoản đúng số tiền và nội dung <strong>{booking.paymentMemo}</strong>. Xác nhận sẽ cập nhật tự động sau khi ngân hàng ghi nhận.</p>
            <button type="button" onClick={() => void copyBankInfo()} className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#D9E5DC] bg-white py-2.5 text-xs font-medium text-[#526056] hover:bg-[#F8F9F5]">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Đã sao chép' : `Sao chép ${booking.bank} · ${booking.bankAccount} · nội dung`}
            </button>
          </> : <p className="text-center text-sm text-[#526056]">{booking.status === 'CONFIRMED' ? 'Thanh toán đã được xác nhận. Vé lịch hẹn đã sẵn sàng.' : booking.status === 'EXPIRED' || (booking.status === 'PENDING_PAYMENT' && remaining === 0) ? 'Thời gian giữ chỗ đã hết. Nếu đã chuyển khoản, vui lòng liên hệ spa để đối soát.' : `Trạng thái: ${booking.status}`}</p>}
          <Button disabled={booking.status !== 'CONFIRMED'} onClick={() => navigate(`/ticket/${booking.bookingCode}`)} className="w-full rounded-xl h-13 bg-[#1E3B2B] text-white hover:bg-[#14271C] font-semibold text-sm shadow-luxury">
            Xem vé lịch hẹn <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </>}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#8EAA97]"><ShieldCheck className="h-3.5 w-3.5" />Xác nhận dựa trên giao dịch thực tế, không dựa vào nút bấm</div>
      </div>
    </div>
  );
};
