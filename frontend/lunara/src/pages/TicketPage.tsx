import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, CheckCircle, Clock, Calendar, Sparkles, Home } from 'lucide-react';

export const TicketPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const ticketId = id || 'LNR-089';

  // Toggle state to demonstrate both FRAME 05 (Pending) and FRAME 06 (Completed)
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Rating & Feedback State (FRAME 06)
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#F8F9F5] flex flex-col items-center justify-center p-6 sm:p-12 font-body">
      {/* Brand Header */}
      <div className="text-center mb-6 space-y-1">
        <Link to="/" className="inline-block">
          <span className="font-display text-3xl font-semibold text-[#14271C] tracking-tight hover:text-[#1E3B2B]">
            Lunara
          </span>
        </Link>
        <p className="text-[11px] uppercase tracking-widest text-[#8EAA97] font-bold">
          Thẻ Dịch Vụ Điện Tử
        </p>
      </div>

      {/* State Switcher (For Demo & Testing) */}
      <div className="mb-6 flex items-center gap-2 rounded-full bg-white p-1 border border-[#E2E8E3] shadow-xs text-xs">
        <button
          type="button"
          onClick={() => setIsCompleted(false)}
          className={`rounded-full px-4 py-1.5 font-medium transition-colors cursor-pointer ${
            !isCompleted ? 'bg-[#1E3B2B] text-white' : 'text-[#526056] hover:text-[#14271C]'
          }`}
        >
          FRAME 05: Vé chưa hoàn thành
        </button>
        <button
          type="button"
          onClick={() => setIsCompleted(true)}
          className={`rounded-full px-4 py-1.5 font-medium transition-colors cursor-pointer ${
            isCompleted ? 'bg-[#1E3B2B] text-white' : 'text-[#526056] hover:text-[#14271C]'
          }`}
        >
          FRAME 06: Vé đã hoàn thành & Đánh giá
        </button>
      </div>

      {/* Main Boarding Pass / Ticket Card */}
      <div className="w-full max-w-lg rounded-3xl bg-white border border-[#E2E8E3] shadow-luxury overflow-hidden">
        {/* Ticket Header Banner */}
        <div className="bg-[#14271C] text-white p-6 relative">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-widest text-[#8EAA97] font-semibold">
                Xác nhận lịch hẹn
              </span>
              <h2 className="font-display text-2xl font-semibold text-white mt-0.5">
                Vé của bạn
              </h2>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-[#8EAA97] block">
                Mã đặt lịch
              </span>
              <span className="font-mono text-lg font-bold text-[#C5A880]">
                {ticketId}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-[#D9E5DC]">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#C5A880]" />
              <span>14/09/2026</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#C5A880]" />
              <span>Dự kiến: 14:00 — 15:45</span>
            </div>
          </div>
        </div>

        {/* Perforated Divider Line */}
        <div className="relative flex items-center justify-between px-4 py-1 bg-white">
          <div className="w-5 h-5 -ml-6 rounded-full bg-[#F8F9F5] border-r border-[#E2E8E3]" />
          <div className="flex-1 border-b-2 border-dashed border-[#E2E8E3]" />
          <div className="w-5 h-5 -mr-6 rounded-full bg-[#F8F9F5] border-l border-[#E2E8E3]" />
        </div>

        {/* Ticket Content Body */}
        <div className="p-6 space-y-6">
          {/* Services List */}
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8EAA97]">
              Dịch vụ đã chọn
            </span>

            <div className="space-y-2">
              <div className="rounded-xl bg-[#F8F9F5] p-3.5 border border-[#E2E8E3]/60 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-semibold text-[#14271C]">Massage Thư Giãn</h4>
                  <span className="text-[11px] text-[#6B726C]">Thời gian: 60 phút</span>
                </div>
                <span className="font-bold text-[#14271C]">450.000 đ</span>
              </div>

              <div className="rounded-xl bg-[#F8F9F5] p-3.5 border border-[#E2E8E3]/60 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-semibold text-[#14271C]">Chăm Sóc Da Mặt Chuyên Sâu</h4>
                  <span className="text-[11px] text-[#6B726C]">Thời gian: 45 phút</span>
                </div>
                <span className="font-bold text-[#14271C]">350.000 đ</span>
              </div>
            </div>
          </div>

          {/* Details Summary */}
          <div className="rounded-2xl bg-[#F8F9F5] p-4 space-y-2 text-xs text-[#526056]">
            <div className="flex justify-between">
              <span>Tổng thời gian trị liệu:</span>
              <span className="font-semibold text-[#14271C]">105 phút</span>
            </div>
            <div className="flex justify-between">
              <span>Chuyên viên phụ trách:</span>
              <span className="font-semibold text-[#14271C]">Nguyễn Thị Linh (Senior Therapist)</span>
            </div>
            <div className="flex justify-between">
              <span>Trạng thái dịch vụ:</span>
              <span className={`font-semibold ${isCompleted ? 'text-[#2E7D32]' : 'text-amber-700'}`}>
                {isCompleted ? '● ĐÃ HOÀN THÀNH LIỆU TRÌNH' : '○ ĐÃ XÁC NHẬN · CHỜ ĐẾN GIỜ HẸN'}
              </span>
            </div>
            <div className="pt-2 border-t border-[#E2E8E3] flex justify-between items-baseline">
              <span className="font-bold text-sm text-[#14271C]">Tổng tiền đã thanh toán:</span>
              <span className="font-display text-lg font-bold text-[#1E3B2B]">800.000 đ</span>
            </div>
          </div>

          {/* FRAME 06: Service Rating & Feedback Section (Only if completed) */}
          {isCompleted && (
            <div className="pt-4 border-t border-[#E2E8E3] space-y-4 animate-in fade-in duration-300">
              <div className="text-center space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#8EAA97]">
                  Đánh giá dịch vụ
                </span>
                <h3 className="font-display text-lg font-semibold text-[#14271C]">
                  Cảm nhận của quý khách
                </h3>
              </div>

              {feedbackSubmitted ? (
                <div className="rounded-2xl bg-[#E8F5E9] p-4 text-center space-y-2 text-[#2E7D32]">
                  <CheckCircle className="h-8 w-8 mx-auto text-[#2E7D32]" />
                  <h4 className="font-bold text-sm">Cảm ơn quý khách!</h4>
                  <p className="text-xs">Lunara đã ghi nhận ý kiến quý báu để nâng cao chất lượng dịch vụ.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitFeedback} className="space-y-4">
                  {/* Clickable Gold Stars */}
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const filled = (hoverRating || rating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 cursor-pointer transition-transform hover:scale-125"
                        >
                          <Star
                            className={`h-7 w-7 transition-colors ${
                              filled ? 'text-[#C5A880] fill-[#C5A880]' : 'text-[#D9E5DC]'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback Textarea */}
                  <div className="space-y-1.5">
                    <Textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Chia sẻ góp ý của bạn về kỹ thuật viên, lực massage, không gian spa..."
                      rows={3}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] font-semibold text-xs h-11 shadow-luxury"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5 text-[#C5A880]" />
                    Xác nhận gửi đánh giá
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center text-xs font-semibold text-[#526056] hover:text-[#1E3B2B]"
            >
              <Home className="h-3.5 w-3.5 mr-1" />
              Về trang chủ
            </Link>

            <Link
              to="/booking"
              className="text-xs font-semibold text-[#1E3B2B] hover:underline"
            >
              Đặt lịch hẹn mới →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
