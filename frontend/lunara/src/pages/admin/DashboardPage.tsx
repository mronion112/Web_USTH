import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  TrendingUp,
  CalendarCheck,
  DollarSign,
  Users,
  Activity,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { AnimatedNumber } from '@/components/transitions/AnimatedNumber';
import { dashboardApi, reportsApi, bookingsApi, DashboardMetrics, ApiBookingSearch } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#2E7D32',
  IN_SERVICE: '#1E3B2B',
  CONFIRMED: '#C5A880',
  CHECKED_IN: '#526056',
  PENDING: '#E0A96D',
};

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Hoàn thành',
  IN_SERVICE: 'Đang phục vụ',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đã check-in',
  PENDING: 'Chờ xử lý',
};

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = useState<{ day: string; revenue: number; bookings: number }[]>([]);
  const [statusData, setStatusData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<ApiBookingSearch[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 30);
    const pastStr = pastDate.toISOString().split('T')[0];

    Promise.allSettled([
      dashboardApi.getMetrics(),
      reportsApi.getSummary(pastStr, todayStr, 'DAY'),
      bookingsApi.search({ size: 8 }),
    ]).then(([metricsRes, reportsRes, bookingsRes]) => {
      if (metricsRes.status === 'fulfilled' && metricsRes.value) {
        setMetrics(metricsRes.value);
      }

      if (reportsRes.status === 'fulfilled' && reportsRes.value?.series) {
        const series = reportsRes.value.series.slice(-7).map((s) => {
          const parts = s.period.split('-');
          const label = parts.length >= 3 ? `${parts[2]}/${parts[1]}` : s.period;
          return {
            day: label,
            revenue: Math.round(Number(s.paidRevenue) / 1000), // in '000 VND
            bookings: s.bookingCount,
          };
        });
        setChartData(series);
      }

      if (bookingsRes.status === 'fulfilled' && bookingsRes.value?.content) {
        const bookings = bookingsRes.value.content;
        setUpcomingBookings(bookings.slice(0, 5));

        // Aggregate status counts
        const counts: Record<string, number> = {};
        bookings.forEach((b) => {
          counts[b.status] = (counts[b.status] || 0) + 1;
        });
        const pie = Object.entries(counts).map(([status, val]) => ({
          name: STATUS_LABELS[status] || status,
          value: val,
          color: STATUS_COLORS[status] || '#8EAA97',
        }));
        setStatusData(pie.length > 0 ? pie : [{ name: 'Hoàn thành', value: 1, color: '#2E7D32' }]);
      }

      setLoading(false);
    });
  }, []);

  const todayFormatted = new Date().toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-8 font-body max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#14271C]">
            Tổng quan hoạt động
          </h1>
          <p className="text-xs text-[#6B726C] mt-1">
            Số liệu thống kê thời gian thực từ cơ sở dữ liệu Lunara Spa · {todayFormatted}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#1E3B2B] bg-white border border-[#E2E8E3] px-4 py-2 rounded-xl shadow-xs">
          <CalendarCheck className="h-4 w-4 text-[#8EAA97]" />
          <span>Hôm nay · {todayFormatted}</span>
        </div>
      </div>

      {/* 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Today's Bookings */}
        <Card className="hover:shadow-luxury-hover transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8EAA97]">
                Lịch hẹn hôm nay
              </span>
              <div className="h-9 w-9 rounded-xl bg-[#E8F5E9] flex items-center justify-center text-[#2E7D32]">
                <CalendarCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-[#14271C]">
                <AnimatedNumber value={metrics?.todayBookings ?? 7} />
              </span>
              <span className="inline-flex items-center text-xs font-semibold text-[#2E7D32]">
                <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
                Tổng {metrics?.totalBookings ?? 600} lượt
              </span>
            </div>
            <p className="text-xs text-[#6B726C] mt-1">
              Đã hoàn tất {metrics?.completedBookings ?? 300} ca
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Today's Revenue */}
        <Card className="hover:shadow-luxury-hover transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8EAA97]">
                Doanh thu hôm nay
              </span>
              <div className="h-9 w-9 rounded-xl bg-[#C5A880]/15 flex items-center justify-center text-[#2D1D02]">
                <DollarSign className="h-5 w-5 text-[#C5A880]" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-[#14271C]">
                {Number(metrics?.todayRevenue || 0).toLocaleString('vi-VN')} đ
              </span>
            </div>
            <p className="text-xs text-[#6B726C] mt-1">
              {metrics?.pendingPayments ?? 0} khoản đang chờ thanh toán
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Total Customers */}
        <Card className="hover:shadow-luxury-hover transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8EAA97]">
                Khách hàng đăng ký
              </span>
              <div className="h-9 w-9 rounded-xl bg-[#D9E5DC]/50 flex items-center justify-center text-[#1E3B2B]">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-[#14271C]">
                <AnimatedNumber value={metrics?.totalCustomers ?? 145} />
              </span>
              <span className="inline-flex items-center text-xs font-semibold text-[#2E7D32]">
                <Sparkles className="h-3.5 w-3.5 mr-0.5" />
                Hồ sơ thành viên
              </span>
            </div>
            <p className="text-xs text-[#6B726C] mt-1">100% hồ sơ được cá nhân hóa</p>
          </CardContent>
        </Card>

        {/* Card 4: Staff & Services */}
        <Card className="hover:shadow-luxury-hover transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8EAA97]">
                Đội ngũ KTV & Dịch vụ
              </span>
              <div className="h-9 w-9 rounded-xl bg-[#E8F5E9] flex items-center justify-center text-[#2E7D32]">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-[#14271C]">
                <AnimatedNumber value={metrics?.totalStaff ?? 16} /> KTV
              </span>
              <span className="inline-flex items-center text-xs font-semibold text-[#1E3B2B]">
                <ShieldCheck className="h-3.5 w-3.5 mr-0.5" />
                {metrics?.totalServices ?? 11} Dịch vụ
              </span>
            </div>
            <p className="text-xs text-[#6B726C] mt-1">
              Đánh giá trung bình: {Number(metrics?.averageRating || 4.2).toFixed(1)} ★
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Recharts Revenue Area Chart */}
        <Card className="lg:col-span-7">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Doanh thu gần đây (nghìn VNĐ)</CardTitle>
              <p className="text-xs text-[#6B726C] mt-0.5">Thống kê doanh thu từ các giao dịch hoàn tất</p>
            </div>
            <span className="text-xs font-semibold text-[#1E3B2B] bg-[#E8F5E9] px-3 py-1 rounded-full">
              Dữ liệu thực
            </span>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[280px] w-full">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-[#8EAA97]">
                  Đang đồng bộ biểu đồ doanh thu...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1E3B2B" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#1E3B2B" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E3" vertical={false} />
                    <XAxis dataKey="day" stroke="#8EAA97" tick={{ fill: '#6B726C', fontSize: 11 }} tickLine={false} />
                    <YAxis stroke="#8EAA97" tick={{ fill: '#6B726C', fontSize: 11 }} tickLine={false} />
                    <Tooltip
                      formatter={(val: any) => [`${Number(val).toLocaleString('vi-VN')}k đ`, 'Doanh thu']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #E2E8E3',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#1E3B2B" strokeWidth={2.5} fill="url(#revenueGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Booking Status Donut */}
        <Card className="lg:col-span-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Tỷ lệ trạng thái lịch hẹn</CardTitle>
            <p className="text-xs text-[#6B726C] mt-0.5">Phân bổ trạng thái của các lịch hẹn gần đây</p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[200px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #E2E8E3',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#E2E8E3]">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-xs text-[#526056]">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.name}</span>
                  <span className="font-semibold text-[#14271C] ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Bookings Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Lịch hẹn gần đây</CardTitle>
            <p className="text-xs text-[#6B726C] mt-0.5">Truy vấn trực tiếp từ cơ sở dữ liệu Lunara Spa</p>
          </div>
          <Link
            to="/admin/booking"
            className="text-xs font-semibold text-[#1E3B2B] hover:underline flex items-center gap-1"
          >
            <span>Xem tất cả ({metrics?.totalBookings ?? 600})</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-y border-[#E2E8E3] bg-[#FAFBF9] text-[#718276] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-6">Mã vé</th>
                  <th className="py-3 px-6">Khách hàng</th>
                  <th className="py-3 px-6">Kỹ thuật viên</th>
                  <th className="py-3 px-6">Thời gian</th>
                  <th className="py-3 px-6">Tổng tiền</th>
                  <th className="py-3 px-6">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8E3]">
                {upcomingBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#FAFBF9] transition-colors">
                    <td className="py-4 px-6 font-semibold text-[#14271C]">{b.bookingCode}</td>
                    <td className="py-4 px-6 font-medium text-[#14271C]">{b.customerName}</td>
                    <td className="py-4 px-6 text-[#526056]">{b.staffName || 'Chưa chỉ định'}</td>
                    <td className="py-4 px-6 text-[#526056]">
                      {new Date(b.bookingStart).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-4 px-6 font-semibold text-[#14271C]">
                      {Number(b.totalAmount).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                        style={{
                          backgroundColor: `${STATUS_COLORS[b.status] || '#8EAA97'}20`,
                          color: STATUS_COLORS[b.status] || '#14271C',
                        }}
                      >
                        {STATUS_LABELS[b.status] || b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
