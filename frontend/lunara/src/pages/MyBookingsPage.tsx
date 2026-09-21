import React, { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { bookingsApi, ApiBookingSummary } from '@/lib/api';
import { useRefresh } from '@/lib/use-refresh';
import {
  Calendar,
  CalendarCheck,
  Clock,
  ArrowRight,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Timer,
  CreditCard,
  CalendarDays,
  XCircle,
} from 'lucide-react';

type FilterTab = 'all' | 'upcoming' | 'pending' | 'completed' | 'cancelled';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
  CONFIRMED: {
    label: 'Đã xác nhận',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />,
  },
  PENDING_PAYMENT: {
    label: 'Chờ thanh toán',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: <Timer className="h-3.5 w-3.5 text-amber-600" />,
  },
  CHECKED_IN: {
    label: 'Đã check-in',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
    icon: <CalendarCheck className="h-3.5 w-3.5 text-teal-600" />,
  },
  IN_SERVICE: {
    label: 'Đang phục vụ',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    icon: <Sparkles className="h-3.5 w-3.5 text-sky-600" />,
  },
  COMPLETED: {
    label: 'Đã hoàn thành',
    bg: 'bg-[#E8F0EA]',
    text: 'text-[#1E3B2B]',
    border: 'border-[#1E3B2B]/20',
    icon: <CheckCircle2 className="h-3.5 w-3.5 text-[#1E3B2B]" />,
  },
  CANCELLED: {
    label: 'Đã hủy',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: <XCircle className="h-3.5 w-3.5 text-rose-500" />,
  },
};

export const MyBookingsPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<ApiBookingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const fetchBookings = useCallback(async (signal?: AbortSignal) => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setError('');
      const data = await bookingsApi.getMy();
      if (!signal?.aborted) {
        setBookings(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách lịch hẹn.');
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [user]);

  // Initial fetch on mount
  React.useEffect(() => {
    const controller = new AbortController();
    fetchBookings(controller.signal);
    return () => controller.abort();
  }, [fetchBookings]);

  // SSE real-time updates when bookings change
  useRefresh('booking', async (signal) => {
    await fetchBookings(signal);
  }, Boolean(user));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDateRange = (startStr: string, endStr: string) => {
    if (!startStr) return { time: '—', date: '—' };
    const start = new Date(startStr);
    const end = endStr ? new Date(endStr) : null;

    const timeStart = start.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const timeEnd = end
      ? end.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      : '';

    const dateFormatted = start.toLocaleDateString('vi-VN', {
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    return {
      time: timeEnd ? `${timeStart} – ${timeEnd}` : timeStart,
      date: dateFormatted,
    };
  };

  // Filter bookings based on activeTab
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'upcoming') {
      return ['CONFIRMED', 'CHECKED_IN', 'IN_SERVICE'].includes(b.status);
    }
    if (activeTab === 'pending') {
      return b.status === 'PENDING_PAYMENT';
    }
    if (activeTab === 'completed') {
      return b.status === 'COMPLETED';
    }
    if (activeTab === 'cancelled') {
      return b.status === 'CANCELLED';
    }
    return true;
  });

  const counts = {
    all: bookings.length,
    upcoming: bookings.filter((b) => ['CONFIRMED', 'CHECKED_IN', 'IN_SERVICE'].includes(b.status)).length,
    pending: bookings.filter((b) => b.status === 'PENDING_PAYMENT').length,
    completed: bookings.filter((b) => b.status === 'COMPLETED').length,
    cancelled: bookings.filter((b) => b.status === 'CANCELLED').length,
  };

  // If user is not logged in
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-[#F8F9F5] flex flex-col justify-between font-body text-[#14271C]">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto px-6 py-20 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-[#E8F0EA] border border-[#1E3B2B]/20 flex items-center justify-center mb-6 text-[#1E3B2B]">
            <CalendarCheck className="h-8 w-8" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-3 text-[#14271C]">
            Lịch hẹn trị liệu của bạn
          </h1>
          <p className="text-[#6B726C] max-w-md mb-8 leading-relaxed">
            Vui lòng đăng nhập bằng tài khoản Google để tra cứu danh sách lịch hẹn, kiểm tra vé trị liệu và nhận thông báo cập nhật ca hẹn kịp thời.
          </p>
          <Button
            onClick={() => navigate('/auth?redirect=/my-bookings')}
            className="rounded-full px-8 py-6 bg-[#1E3B2B] text-white hover:bg-[#14271C] text-base font-medium shadow-luxury cursor-pointer"
          >
            Đăng nhập để xem lịch hẹn
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9F5] flex flex-col justify-between font-body text-[#14271C]">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 lg:px-12 py-10">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-[#E2E8E3]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8EAA97] mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Khu vực Khách hàng Lunara</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-[#14271C]">
              Lịch Hẹn Của Tôi
            </h1>
            <p className="text-sm text-[#6B726C] mt-1">
              Theo dõi tình trạng, thời gian và chi tiết các buổi trị liệu thư giãn tại Lunara Sanctuary.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => fetchBookings()}
              disabled={loading}
              className="rounded-full px-4 border-[#D9E5DC] text-[#14271C] hover:bg-[#E8F0EA] text-xs font-medium cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
            <Button
              onClick={() => navigate('/booking')}
              className="rounded-full px-6 bg-[#1E3B2B] text-white hover:bg-[#14271C] text-sm shadow-luxury cursor-pointer flex items-center gap-1.5"
            >
              <Calendar className="h-4 w-4" />
              Đặt lịch hẹn mới
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto py-6 no-scrollbar">
          {[
            { key: 'all', label: 'Tất cả', count: counts.all },
            { key: 'upcoming', label: 'Sắp tới', count: counts.upcoming },
            { key: 'pending', label: 'Chờ thanh toán', count: counts.pending },
            { key: 'completed', label: 'Đã hoàn thành', count: counts.completed },
            { key: 'cancelled', label: 'Đã hủy', count: counts.cancelled },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as FilterTab)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-[#1E3B2B] text-white shadow-sm'
                    : 'bg-white text-[#424843] border border-[#E2E8E3] hover:bg-[#E8F0EA]/60'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#E8F0EA] text-[#1E3B2B]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 mb-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-3xl p-6 border border-[#E2E8E3] animate-pulse space-y-4 shadow-sm"
              >
                <div className="h-4 bg-[#E2E8E3] rounded w-1/3" />
                <div className="h-8 bg-[#E2E8E3] rounded w-3/4" />
                <div className="h-4 bg-[#E2E8E3] rounded w-1/2" />
                <div className="h-10 bg-[#E2E8E3] rounded-full w-full mt-4" />
              </div>
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#E2E8E3] p-12 text-center my-6 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-[#E8F0EA] border border-[#1E3B2B]/10 flex items-center justify-center mx-auto mb-4 text-[#1E3B2B]">
              <CalendarDays className="h-8 w-8 text-[#1E3B2B]" />
            </div>
            <h3 className="font-display text-xl font-semibold text-[#14271C] mb-2">
              {activeTab === 'all'
                ? 'Bạn chưa có lịch hẹn nào tại Lunara'
                : `Không có lịch hẹn nào trong mục "${activeTab}"`}
            </h3>
            <p className="text-sm text-[#6B726C] max-w-md mx-auto mb-6">
              Hãy chọn cho mình một liệu trình thư giãn với đá nóng, tinh dầu thảo dược hoặc chăm sóc da mặt chuyên sâu.
            </p>
            <Button
              onClick={() => navigate('/booking')}
              className="rounded-full px-6 bg-[#1E3B2B] text-white hover:bg-[#14271C] text-sm shadow-luxury cursor-pointer inline-flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Khám phá dịch vụ & Đặt lịch ngay
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-2">
            {filteredBookings.map((b) => {
              const statusCfg = STATUS_CONFIG[b.status] || {
                label: b.status,
                bg: 'bg-gray-50',
                text: 'text-gray-700',
                border: 'border-gray-200',
                icon: <Clock className="h-3.5 w-3.5 text-gray-500" />,
              };
              const { time, date } = formatDateRange(b.bookingStart, b.bookingEnd);

              return (
                <div
                  key={b.id}
                  className="bg-white rounded-3xl p-6 border border-[#E2E8E3] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:border-[#1E3B2B]/30"
                >
                  <div>
                    {/* Top: Code & Status */}
                    <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#F0F4F1]">
                      <span className="font-mono text-xs font-bold text-[#1E3B2B] bg-[#E8F0EA] px-2.5 py-1 rounded-lg">
                        {b.bookingCode}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                      >
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Middle: Date, Time & Total */}
                    <div className="py-5 space-y-3">
                      <div className="flex items-start gap-3">
                        <Calendar className="h-4 w-4 text-[#8EAA97] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-[#6B726C]">Ngày hẹn</p>
                          <p className="text-sm font-semibold text-[#14271C]">{date}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Clock className="h-4 w-4 text-[#8EAA97] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-[#6B726C]">Khung giờ</p>
                          <p className="text-sm font-semibold text-[#14271C]">{time}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 pt-2 border-t border-[#F0F4F1]">
                        <CreditCard className="h-4 w-4 text-[#8EAA97] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-[#6B726C]">Tổng chi phí</p>
                          <p className="font-display text-base font-bold text-[#1E3B2B]">
                            {formatCurrency(b.totalAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Action buttons */}
                  <div className="pt-4 border-t border-[#F0F4F1] flex items-center gap-2">
                    <Link
                      to={`/ticket/${b.bookingCode}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#F8F9F5] text-[#1E3B2B] text-xs font-semibold hover:bg-[#E8F0EA] transition-colors border border-[#E2E8E3]"
                    >
                      <span>Xem vé hẹn</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>

                    {b.status === 'PENDING_PAYMENT' && (
                      <Link
                        to={`/checkout?code=${b.bookingCode}`}
                        className="inline-flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl bg-[#C5A880] text-white text-xs font-semibold hover:bg-[#B39366] transition-colors shadow-sm"
                        title="Thanh toán ngay"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>Thanh toán</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
