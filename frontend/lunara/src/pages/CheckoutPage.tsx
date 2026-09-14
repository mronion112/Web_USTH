import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Clock, ShieldCheck, Copy, Check, ArrowRight } from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Booking details from state or fallback
  const bookingData = location.state || {
    bookingCode: 'LNR-089',
    totalAmount: 800000,
    services: [
      { name: 'Massage Thư Giãn', durationMinutes: 60, lineAmount: 450000 },
      { name: 'Chăm Sóc Da Mặt Chuyên Sâu', durationMinutes: 45, lineAmount: 350000 },
    ],
  };

  // 15-Minute Dynamic Countdown Timer (14:59 down to 00:00)
  const [secondsRemaining, setSecondsRemaining] = useState(14 * 60 + 59);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const copyBankInfo = () => {
    navigator.clipboard.writeText(`LUNARA SPA - VIETCOMBANK - 9988776655 - ND: ${bookingData.bookingCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // QR Payload for VietQR format
  const qrPayload = JSON.stringify({
    bank: 'Vietcombank',
    account: '9988776655',
    amount: bookingData.totalAmount,
    memo: `LUNARA ${bookingData.bookingCode}`,
  });

  const handleFinishPayment = () => {
    // Navigate to ticket page
    navigate(`/ticket/${bookingData.bookingCode}`);
  };

  return (
    <div className="min-h-screen bg-[#F8F9F5] flex flex-col items-center justify-center p-6 sm:p-12 font-body">
      {/* Brand Header */}
      <div className="text-center mb-8 space-y-1">
        <span className="font-display text-3xl font-semibold text-[#14271C] tracking-tight">
          Lunara
        </span>
        <p className="text-[11px] uppercase tracking-widest text-[#8EAA97] font-bold">
          Cổng thanh toán tức thì
        </p>
      </div>

      {/* Main Luxury Invoice & QR Container */}
      <div className="w-full max-w-lg rounded-3xl bg-white border border-[#E2E8E3] shadow-luxury p-8 space-y-6">
        {/* Title & Code */}
        <div className="text-center pb-6 border-b border-[#E2E8E3] space-y-1">
          <h2 className="font-display text-2xl font-semibold text-[#14271C]">
            THANH TOÁN LỊCH HẸN
          </h2>
          <p className="text-xs text-[#6B726C]">
            Mã đặt lịch:{' '}
            <span className="font-mono font-bold text-[#1E3B2B] text-sm bg-[#E8F5E9] px-2 py-0.5 rounded-md">
              {bookingData.bookingCode}
            </span>
          </p>
        </div>

        {/* Selected Services Breakdown */}
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8EAA97]">
            Dịch vụ đã chọn
          </span>

          <div className="space-y-2">
            {bookingData.services.map((item: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl bg-[#F8F9F5] p-3.5 border border-[#E2E8E3]/60 text-xs"
              >
                <div>
                  <h4 className="font-semibold text-[#14271C]">{item.name}</h4>
                  <span className="text-[11px] text-[#6B726C]">Thời gian: {item.durationMinutes} phút</span>
                </div>
                <span className="font-bold text-[#14271C]">
                  {item.lineAmount.toLocaleString('vi-VN')} đ
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Total Price */}
        <div className="pt-2 border-t border-[#E2E8E3] flex justify-between items-baseline">
          <span className="font-semibold text-sm text-[#526056]">Tổng thanh toán</span>
          <span className="font-display text-2xl font-bold text-[#14271C]">
            {bookingData.totalAmount.toLocaleString('vi-VN')} đ
          </span>
        </div>

        {/* High-end QR Container with Gold Corner Brackets */}
        <div className="relative mx-auto flex flex-col items-center justify-center rounded-2xl bg-[#F8F9F5] p-6 border border-[#E2E8E3]">
          {/* Gold Corner Accents */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#C5A880]" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#C5A880]" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#C5A880]" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#C5A880]" />

          {/* QR Code SVG */}
          <div className="rounded-xl bg-white p-4 shadow-sm border border-[#E2E8E3]">
            <QRCodeSVG
              value={qrPayload}
              size={180}
              level="H"
              includeMargin={false}
              fgColor="#14271C"
            />
          </div>

          {/* Dynamic Countdown Pill */}
          <div className="mt-4 flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 border border-[#D9E5DC] text-xs font-semibold text-[#1E3B2B] shadow-2xs">
            <Clock className="h-3.5 w-3.5 text-[#C5A880] animate-pulse" />
            <span>Mã QR hết hạn sau: {formatCountdown(secondsRemaining)}</span>
          </div>
        </div>

        {/* Copy Bank Details */}
        <button
          type="button"
          onClick={copyBankInfo}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#D9E5DC] bg-white py-2.5 text-xs font-medium text-[#526056] hover:bg-[#F8F9F5] transition-colors cursor-pointer"
        >
          {copied ? <Check className="h-4 w-4 text-[#2E7D32]" /> : <Copy className="h-4 w-4 text-[#8EAA97]" />}
          <span>{copied ? 'Đã sao chép thông tin chuyển khoản' : 'Sao chép số tài khoản & nội dung chuyển khoản'}</span>
        </button>

        {/* Confirmation Button */}
        <Button
          onClick={handleFinishPayment}
          className="w-full rounded-xl h-13 bg-[#1E3B2B] text-white hover:bg-[#14271C] font-semibold text-sm shadow-luxury"
        >
          <span>Tôi đã thanh toán — Xem vé lịch hẹn</span>
          <ArrowRight className="h-4 w-4 ml-1.5 text-[#C5A880]" />
        </Button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#8EAA97]">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Giao dịch bảo mật qua cổng chuyển khoản tự động 24/7</span>
        </div>
      </div>
    </div>
  );
};
