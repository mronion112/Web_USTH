import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Star, Clock, Calendar, Sparkles, Home } from 'lucide-react';
import { SuccessCheck } from '@/components/transitions/SuccessCheck';
import { bookingsApi, api, ApiBooking, ApiPayment, paymentsApi, PublicStaff, json, staffDirectoryApi } from '@/lib/api';
import { useRefresh } from '@/lib/use-refresh';

export const TicketPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<ApiBooking | null>(null);
  const [payment, setPayment] = useState<ApiPayment | null>(null);
  const [staff, setStaff] = useState<PublicStaff[]>([]);
  const [error, setError] = useState('');
  const isCompleted = booking?.status === 'COMPLETED';
  const isCancelled = booking?.status === 'CANCELLED';

  const reload = useCallback((signal?: AbortSignal) => {
    if (!id) return;
    return bookingsApi.getByCode(id, signal).then(async (value) => {
      setBooking(value);
      setPayment(await paymentsApi.getByBooking(value.id, signal).catch(() => null));
      setError('');
    }).catch((e) => {
      if (!(e instanceof DOMException && e.name === 'AbortError')) setError(e.message);
    });
  }, [id]);

  useRefresh('booking', async (signal) => reload(signal), Boolean(id));
  useEffect(() => { staffDirectoryApi.getAll().then(setStaff).catch(() => undefined); }, []);

  // Rating & Feedback State (FRAME 06)
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [rescheduleStart, setRescheduleStart] = useState('');
  const [newStaffId, setNewStaffId] = useState('');
  const [requestSent, setRequestSent] = useState(false);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    try {
      await api('/api/feedback', {
        method: 'POST',
        body: json({ bookingId: booking.id, rating, comment: feedbackText }),
      });
      setFeedbackSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không gửi được đánh giá.');
    }
  };

  const formatDate = (value: string) => {
    if (!value) return '—';
    return new Date(value).toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const requestReschedule = async () => {
    if (!booking || !rescheduleStart) return;
    try {
      const requested = rescheduleStart.length === 16 ? `${rescheduleStart}:00` : rescheduleStart;
      const items = booking.items.map((item) => ({ serviceId: Number(item.serviceId), durationMinutes: item.durationMinutes }));
      const end = new Date(requested);
      end.setMinutes(end.getMinutes() + booking.totalDurationMinutes + 1);
      const endLocal = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
        + `T${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}:00`;
      const availability = await bookingsApi.getAvailability({ from: requested, to: endLocal,
        items, staffAccountId: newStaffId ? Number(newStaffId) : undefined });
      const available = availability.slots.some((slot) => slot.bookingStart.slice(0, 16) === requested.slice(0, 16)
        && (!newStaffId || Number(slot.staffAccountId) === Number(newStaffId)));
      if (!available) throw new Error('Khung giờ hoặc kỹ thuật viên đã chọn không còn khả dụng.');
      await bookingsApi.reschedule(booking.bookingCode, requested, newStaffId ? Number(newStaffId) : undefined);
      await reload();
      setRequestSent(true);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không gửi được yêu cầu đổi lịch.');
    }
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

      {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
      {!booking && !error && <p className="mb-4 text-sm">Đang tải vé…</p>}
      {booking && <>

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
                {booking.bookingCode}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-[#D9E5DC]">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#C5A880]" />
              <span>{formatDate(booking.bookingStart)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#C5A880]" />
              <span>Đến {formatDate(booking.bookingEnd)}</span>
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
              {booking.items.map((item) => <div key={item.serviceId} className="rounded-xl bg-[#F8F9F5] p-3.5 border border-[#E2E8E3]/60 flex items-center justify-between text-xs">
                <div><h4 className="font-semibold text-[#14271C]">{item.serviceName || item.serviceNameSnapshot || 'Dịch vụ spa'}</h4><span className="text-[11px] text-[#6B726C]">Thời gian: {item.durationMinutes} phút</span></div>
                <span className="font-bold text-[#14271C]">{Number(item.lineAmount).toLocaleString('vi-VN')} đ</span>
              </div>)}
            </div>
          </div>

          {/* Details Summary */}
          <div className="rounded-2xl bg-[#F8F9F5] p-4 space-y-2 text-xs text-[#526056]">
            <div className="flex justify-between">
              <span>Tổng thời gian trị liệu:</span>
              <span className="font-semibold text-[#14271C]">{booking.totalDurationMinutes} phút</span>
            </div>
            <div className="flex justify-between">
              <span>Chuyên viên phụ trách:</span>
              <span className="font-semibold text-[#14271C]">{booking.staff?.displayName || (booking.staffAccountId ? `Chuyên viên #${booking.staffAccountId}` : 'Tự động phân công')}</span>
            </div>
            <div className="flex justify-between">
              <span>Trạng thái dịch vụ:</span>
              <span className={`font-semibold ${isCompleted ? 'text-[#2E7D32]' : isCancelled ? 'text-[#B23B3B]' : 'text-amber-700'}`}>
                {isCompleted ? '● ĐÃ HOÀN THÀNH LIỆU TRÌNH' : isCancelled ? '● ĐÃ HUỶ — ĐÃ HOÀN TIỀN' : `○ ${booking.status}`}
              </span>
            </div>
            <div className="pt-2 border-t border-[#E2E8E3] flex justify-between items-baseline">
              <span className="font-bold text-sm text-[#14271C]">{payment?.status === 'PAID' ? 'Đã thanh toán:' : 'Tổng giá trị:'}</span>
              <span className="font-display text-lg font-bold text-[#1E3B2B]">{Number(booking.totalAmount).toLocaleString('vi-VN')} đ</span>
            </div>
          </div>

          {isCancelled && (
            <div className="pt-4 border-t border-[#E2E8E3] space-y-1">
              <p className="text-xs font-bold text-[#B23B3B]">Lịch hẹn đã được huỷ và hoàn tiền.</p>
              <p className="text-xs text-[#526056]">Vé này không còn hiệu lực. Quý khách vui lòng đặt lịch mới nếu cần.</p>
            </div>
          )}

          {booking.status === 'CONFIRMED' && <div className="pt-4 border-t border-[#E2E8E3] space-y-2">
            <h3 className="text-xs font-bold text-[#14271C]">Cần đổi lịch?</h3>
            {requestSent ? <p className="text-xs text-[#2E7D32]">Lịch hẹn đã được cập nhật thành công.</p> : <><Input type="datetime-local" value={rescheduleStart} onChange={(e) => setRescheduleStart(e.target.value)} /><Select value={newStaffId} onChange={(e) => setNewStaffId(e.target.value)}><option value="">Tự động / giữ kỹ thuật viên hiện tại</option>{staff.map((person) => <option key={person.accountId} value={String(person.accountId)}>{person.displayName}</option>)}</Select><Button variant="outline" disabled={!rescheduleStart} onClick={() => void requestReschedule()} className="text-xs">Cập nhật lịch hẹn</Button></>}
          </div>}

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
                  <SuccessCheck size={48} color="#2E7D32" className="mx-auto" />
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
      </>}
    </div>
  );
};
