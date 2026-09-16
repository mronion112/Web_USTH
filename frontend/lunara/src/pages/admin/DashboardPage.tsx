import React from 'react';
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
  Cell
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartTooltip } from '@/components/ui/chart';
import {
  DASHBOARD_METRICS,
  REVENUE_CHART_DATA,
  BOOKING_STATUS_DATA,
  UPCOMING_BOOKINGS
} from '@/data/mock-dashboard';
import {
  TrendingUp,
  CalendarCheck,
  DollarSign,
  Users,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { AnimatedNumber } from '@/components/transitions/AnimatedNumber';

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-8 font-body max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#14271C]">
            Tổng quan hoạt động
          </h1>
          <p className="text-xs text-[#6B726C] mt-1">
            Số liệu thống kê thời gian thực · Cập nhật hôm nay, 14 Tháng 9 2026
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#1E3B2B] bg-white border border-[#E2E8E3] px-4 py-2 rounded-xl shadow-xs">
          <CalendarCheck className="h-4 w-4 text-[#8EAA97]" />
          <span>Hôm nay · 14 Sep 2026</span>
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
                <AnimatedNumber value={DASHBOARD_METRICS.todayBookings.value} />
              </span>
              <span className="inline-flex items-center text-xs font-semibold text-[#2E7D32]">
                <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
                {DASHBOARD_METRICS.todayBookings.change}
              </span>
            </div>
            <p className="text-xs text-[#6B726C] mt-1">{DASHBOARD_METRICS.todayBookings.subtext}</p>
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
                <AnimatedNumber value={DASHBOARD_METRICS.todayRevenue.value} />
              </span>
              <span className="inline-flex items-center text-xs font-semibold text-[#2E7D32]">
                <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
                {DASHBOARD_METRICS.todayRevenue.change}
              </span>
            </div>
            <p className="text-xs text-[#6B726C] mt-1">{DASHBOARD_METRICS.todayRevenue.subtext}</p>
          </CardContent>
        </Card>

        {/* Card 3: Customers Today */}
        <Card className="hover:shadow-luxury-hover transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8EAA97]">
                Khách đón tiếp
              </span>
              <div className="h-9 w-9 rounded-xl bg-[#D9E5DC]/50 flex items-center justify-center text-[#1E3B2B]">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-[#14271C]">
                <AnimatedNumber value={DASHBOARD_METRICS.customersToday.value} />
              </span>
              <span className="inline-flex items-center text-xs font-semibold text-[#2E7D32]">
                <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
                {DASHBOARD_METRICS.customersToday.change}
              </span>
            </div>
            <p className="text-xs text-[#6B726C] mt-1">{DASHBOARD_METRICS.customersToday.subtext}</p>
          </CardContent>
        </Card>

        {/* Card 4: Staff Utilization */}
        <Card className="hover:shadow-luxury-hover transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8EAA97]">
                Công suất KTV
              </span>
              <div className="h-9 w-9 rounded-xl bg-[#E8F5E9] flex items-center justify-center text-[#2E7D32]">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-[#14271C]">
                <AnimatedNumber value={DASHBOARD_METRICS.staffUtilization.value} />
              </span>
              <span className="inline-flex items-center text-xs font-semibold text-[#2E7D32]">
                <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
                {DASHBOARD_METRICS.staffUtilization.change}
              </span>
            </div>
            <p className="text-xs text-[#6B726C] mt-1">{DASHBOARD_METRICS.staffUtilization.subtext}</p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Charts Row: Recharts AreaChart (7 cols) + Recharts Donut (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Recharts Revenue Area Chart */}
        <Card className="lg:col-span-7">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Doanh thu 7 ngày qua</CardTitle>
              <p className="text-xs text-[#6B726C] mt-0.5">Xu hướng biến động doanh thu theo ngày</p>
            </div>
            <span className="text-xs font-semibold text-[#1E3B2B] bg-[#E8F5E9] px-3 py-1 rounded-full">
              Tuần hiện tại
            </span>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={REVENUE_CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1E3B2B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1E3B2B" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E3" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="#8EAA97"
                    tick={{ fill: '#6B726C', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#8EAA97"
                    tick={{ fill: '#6B726C', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="natural"
                    dataKey="revenue"
                    name="Doanh thu"
                    stroke="#1E3B2B"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Right: Recharts Booking Status Donut Chart */}
        <Card className="lg:col-span-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Tỷ lệ trạng thái lịch hẹn</CardTitle>
            <p className="text-xs text-[#6B726C] mt-0.5">Tổng số: 24 lượt khách hôm nay</p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Donut Chart with Center Metric */}
              <div className="relative h-[200px] w-[200px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={BOOKING_STATUS_DATA}
                      innerRadius={58}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {BOOKING_STATUS_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text metric */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-display text-2xl font-bold text-[#14271C]">24</span>
                  <span className="text-[10px] uppercase tracking-wider text-[#8EAA97]">Lịch hẹn</span>
                </div>
              </div>

              {/* Status Color Legend */}
              <div className="space-y-3 w-full">
                {BOOKING_STATUS_DATA.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-[#526056] font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold text-[#14271C]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Bookings Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-[#E2E8E3] pb-4">
          <div>
            <CardTitle className="text-lg">Lịch hẹn sắp tới</CardTitle>
            <p className="text-xs text-[#6B726C] mt-0.5">Khách hàng chuẩn bị đến spa trong buổi chiều</p>
          </div>
          <Link
            to="/admin/booking"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E3B2B] hover:text-[#14271C]"
          >
            <span>Xem tất cả</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F8F9F5] border-b border-[#E2E8E3] text-[#6B726C] uppercase font-semibold">
                <tr>
                  <th className="py-3 px-6">Thời gian</th>
                  <th className="py-3 px-6">Khách hàng</th>
                  <th className="py-3 px-6">Dịch vụ</th>
                  <th className="py-3 px-6">Chuyên viên</th>
                  <th className="py-3 px-6">Thanh toán</th>
                  <th className="py-3 px-6 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8E3]">
                {UPCOMING_BOOKINGS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#F8F9F5]/80 transition-colors">
                    <td className="py-4 px-6 font-semibold text-[#14271C]">{row.time}</td>
                    <td className="py-4 px-6 font-medium text-[#14271C]">{row.customer}</td>
                    <td className="py-4 px-6 text-[#526056]">{row.service}</td>
                    <td className="py-4 px-6 text-[#14271C]">{row.staff}</td>
                    <td className="py-4 px-6">
                      <Badge variant={row.payment === 'paid' ? 'success' : 'warning'}>
                        {row.payment === 'paid' ? '● Đã thanh toán' : '○ Chờ thu'}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Badge variant={row.status === 'checked-in' ? 'secondary' : 'default'}>
                        {row.status === 'checked-in' ? 'Đã check-in' : row.status === 'confirmed' ? 'Đã xác nhận' : 'Chờ xử lý'}
                      </Badge>
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
