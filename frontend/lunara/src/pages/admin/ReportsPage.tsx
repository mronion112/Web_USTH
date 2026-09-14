import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChartTooltip } from '@/components/ui/chart';
import {
  REPORT_METRICS,
  MONTHLY_REVENUE_TREND,
  BOOKINGS_BY_SERVICE,
  PEAK_HOURS,
  STAFF_UTILIZATION_DATA
} from '@/data/mock-reports';
import {
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Award,
  Clock
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'services'>('overview');

  return (
    <div className="space-y-8 font-body max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8E3] pb-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#14271C]">
            Báo cáo & Phân tích chuyên sâu
          </h1>
          <p className="text-xs text-[#6B726C] mt-1">
            Hiệu suất kinh doanh, tỷ trọng dịch vụ và công suất kỹ thuật viên tháng 09/2026
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-[#E2E8E3] text-xs font-semibold text-[#14271C]">
            <Calendar className="h-4 w-4 text-[#8EAA97]" />
            <span>01/09/2026 — 30/09/2026</span>
          </div>

          <Button className="rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs h-10 px-4">
            <Download className="h-4 w-4 mr-1.5 text-[#C5A880]" /> Xuất file báo cáo
          </Button>
        </div>
      </div>

      {/* 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-6">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8EAA97]">
            Tổng doanh thu tháng
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-[#14271C]">
              {REPORT_METRICS.revenue.value}
            </span>
            <span className="text-xs font-semibold text-[#2E7D32] flex items-center">
              <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
              {REPORT_METRICS.revenue.change}
            </span>
          </div>
          <p className="text-[11px] text-[#6B726C] mt-1">Mục tiêu: 120M (Đạt 104%)</p>
        </Card>

        <Card className="p-6">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8EAA97]">
            Tổng lượt đặt lịch
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-[#14271C]">
              {REPORT_METRICS.bookings.value}
            </span>
            <span className="text-xs font-semibold text-[#2E7D32] flex items-center">
              <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
              {REPORT_METRICS.bookings.change}
            </span>
          </div>
          <p className="text-[11px] text-[#6B726C] mt-1">Tăng 28 ca so với tháng 8</p>
        </Card>

        <Card className="p-6">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8EAA97]">
            Giá trị đơn bình quân
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-[#14271C]">
              {REPORT_METRICS.avgBooking.value}
            </span>
            <span className="text-xs font-semibold text-[#2E7D32] flex items-center">
              <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
              {REPORT_METRICS.avgBooking.change}
            </span>
          </div>
          <p className="text-[11px] text-[#6B726C] mt-1">Khách thường chọn kèm chăm sóc da</p>
        </Card>

        <Card className="p-6">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8EAA97]">
            Tỷ lệ hoàn thành
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-[#14271C]">
              {REPORT_METRICS.completionRate.value}
            </span>
            <span className="text-xs font-semibold text-[#D32F2F] flex items-center">
              <TrendingDown className="h-3.5 w-3.5 mr-0.5" />
              {REPORT_METRICS.completionRate.change}
            </span>
          </div>
          <p className="text-[11px] text-[#6B726C] mt-1">2.4% hủy ca có báo trước</p>
        </Card>
      </div>

      {/* Row 1: Recharts Monthly Revenue Trend Line Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg">Xu hướng doanh thu theo tháng (Revenue Trend)</CardTitle>
            <p className="text-xs text-[#6B726C] mt-0.5">Dữ liệu ghi nhận từ 01/09 đến 30/09</p>
          </div>
          <span className="text-xs font-semibold text-[#1E3B2B] bg-[#E8F5E9] px-3 py-1 rounded-full">
            Tháng 9, 2026
          </span>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MONTHLY_REVENUE_TREND} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E3" vertical={false} />
                <XAxis
                  dataKey="date"
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
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Doanh thu"
                  stroke="#1E3B2B"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#1E3B2B' }}
                  activeDot={{ r: 6, fill: '#C5A880' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Row 2: Booking by Service (Recharts Bar) & Peak Hours (Recharts Bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Booking By Service (Vertical Bar Layout) */}
        <Card className="lg:col-span-6">
          <CardHeader>
            <CardTitle className="text-lg">Tỷ trọng đặt theo nhóm dịch vụ</CardTitle>
            <p className="text-xs text-[#6B726C]">Tỷ lệ phần trăm trên 382 lượt khách</p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={BOOKINGS_BY_SERVICE}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E3" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#8EAA97"
                    tick={{ fill: '#6B726C', fontSize: 11 }}
                    tickFormatter={(v) => `${v}%`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="service"
                    stroke="#8EAA97"
                    tick={{ fill: '#14271C', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip formatter={(v: any) => `${v}%`} />} />
                  <Bar dataKey="percentage" name="Tỷ trọng" fill="#1E3B2B" radius={[0, 8, 8, 0]}>
                    {BOOKINGS_BY_SERVICE.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? '#1E3B2B' : index === 1 ? '#8EAA97' : '#C5A880'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Peak Hours Distribution */}
        <Card className="lg:col-span-6">
          <CardHeader>
            <CardTitle className="text-lg">Phân bổ khung giờ cao điểm (Peak Hours)</CardTitle>
            <p className="text-xs text-[#6B726C]">Lưu lượng khách tập trung theo khung giờ</p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={PEAK_HOURS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E3" vertical={false} />
                  <XAxis
                    dataKey="hour"
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
                  />
                  <Tooltip content={<ChartTooltip formatter={(v: any) => `${v} lượt khách`} />} />
                  <Bar dataKey="bookings" name="Lượt khách" fill="#8EAA97" radius={[8, 8, 0, 0]}>
                    {PEAK_HOURS.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.bookings >= 35 ? '#1E3B2B' : '#8EAA97'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Staff Utilization Ranking List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Xếp hạng hiệu suất chuyên viên (Staff Utilization)</CardTitle>
          <p className="text-xs text-[#6B726C]">Đo lường thời gian thực ca trị liệu trên tổng giờ trực</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {STAFF_UTILIZATION_DATA.map((staff, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#14271C]">{staff.name} — <span className="text-[#8EAA97] font-normal">{staff.role}</span></span>
                  <span className="text-[#1E3B2B]">{staff.rate}% ({staff.bookings} ca)</span>
                </div>
                <Progress value={staff.rate} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
