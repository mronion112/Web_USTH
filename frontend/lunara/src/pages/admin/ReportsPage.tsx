import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { reportsApi, dashboardApi, servicesApi, ReportSummary, DashboardMetrics, ApiService } from '@/lib/api';
import {
  Calendar,
  DollarSign,
  Users,
  Award,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [groupBy, setGroupBy] = useState<'DAY' | 'WEEK' | 'MONTH'>('DAY');
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [services, setServices] = useState<ApiService[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 30);
    const startStr = startDate.toISOString().split('T')[0];

    try {
      const [repData, dashData, srvData] = await Promise.all([
        reportsApi.getSummary(startStr, todayStr, groupBy),
        dashboardApi.getMetrics(),
        servicesApi.getAll(),
      ]);
      setReport(repData);
      setMetrics(dashData);
      if (Array.isArray(srvData)) setServices(srvData);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }, [groupBy]);

  useEffect(() => {
    reload();
  }, [reload]);

  const seriesData = (report?.series || []).map((s) => ({
    name: s.period,
    revenue: Math.round(Number(s.paidRevenue) / 1000), // in '000 VNĐ
    bookings: s.bookingCount,
    completed: s.completedCount,
  }));

  return (
    <div className="space-y-8 font-body max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8E3] pb-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#14271C]">
            Báo cáo & Phân tích chuyên sâu
          </h1>
          <p className="text-xs text-[#6B726C] mt-1">
            Hiệu suất kinh doanh, doanh thu thực tế và công suất phục vụ từ hệ thống
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* GroupBy Buttons */}
          <div className="flex bg-white rounded-xl border border-[#E2E8E3] p-1 text-xs">
            {(['DAY', 'WEEK', 'MONTH'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGroupBy(g)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  groupBy === g ? 'bg-[#1E3B2B] text-white' : 'text-[#526056] hover:text-[#14271C]'
                }`}
              >
                {g === 'DAY' ? 'Theo ngày' : g === 'WEEK' ? 'Theo tuần' : 'Theo tháng'}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={() => reload()}
            className="rounded-xl border-[#D9E5DC] text-xs h-10 px-4 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4 mr-1.5 text-[#8EAA97]" /> Làm mới
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-6 space-y-2 border border-[#E2E8E3] shadow-luxury">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8EAA97]">
              Tổng doanh thu đã thu
            </span>
            <div className="h-9 w-9 rounded-xl bg-[#C5A880]/15 flex items-center justify-center text-[#C5A880]">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="font-display text-2xl font-bold text-[#14271C]">
            {Number(report?.paidRevenue || 0).toLocaleString('vi-VN')} đ
          </div>
          <p className="text-xs text-[#2E7D32] flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" /> Dòng tiền thực thu
          </p>
        </Card>

        <Card className="p-6 space-y-2 border border-[#E2E8E3] shadow-luxury">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8EAA97]">
              Lịch hẹn ghi nhận
            </span>
            <div className="h-9 w-9 rounded-xl bg-[#E8F5E9] flex items-center justify-center text-[#2E7D32]">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="font-display text-2xl font-bold text-[#14271C]">
            {report?.totalBookings ?? 0} lượt
          </div>
          <p className="text-xs text-[#526056]">
            {report?.completedBookings ?? 0} lượt hoàn tất
          </p>
        </Card>

        <Card className="p-6 space-y-2 border border-[#E2E8E3] shadow-luxury">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8EAA97]">
              Hồ sơ khách hàng
            </span>
            <div className="h-9 w-9 rounded-xl bg-[#D9E5DC]/50 flex items-center justify-center text-[#1E3B2B]">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="font-display text-2xl font-bold text-[#14271C]">
            {metrics?.totalCustomers ?? 145} thành viên
          </div>
          <p className="text-xs text-[#526056]">
            {metrics?.pendingPayments ?? 0} khoản đang chờ thanh toán
          </p>
        </Card>

        <Card className="p-6 space-y-2 border border-[#E2E8E3] shadow-luxury">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8EAA97]">
              Chỉ số hài lòng (CSAT)
            </span>
            <div className="h-9 w-9 rounded-xl bg-[#FAFBF9] border border-[#E2E8E3] flex items-center justify-center text-[#C5A880]">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="font-display text-2xl font-bold text-[#14271C]">
            {Number(metrics?.averageRating || 4.2).toFixed(2)} ★
          </div>
          <p className="text-xs text-[#2E7D32]">
            Đánh giá trung bình từ khách
          </p>
        </Card>
      </div>

      {/* Revenue Trend Area Chart */}
      <Card className="border border-[#E2E8E3] shadow-luxury">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg">Biểu đồ doanh thu thực tế (nghìn VNĐ)</CardTitle>
            <p className="text-xs text-[#6B726C] mt-0.5">
              Nhóm theo {groupBy === 'DAY' ? 'ngày' : groupBy === 'WEEK' ? 'tuần' : 'tháng'} từ ngày {report?.from} đến {report?.to}
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[320px] w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-xs text-[#8EAA97]">
                Đang tải dữ liệu báo cáo...
              </div>
            ) : seriesData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#8EAA97]">
                Chưa có dữ liệu trong khoảng thời gian đã chọn
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={seriesData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1E3B2B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1E3B2B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E3" vertical={false} />
                  <XAxis dataKey="name" stroke="#8EAA97" tick={{ fill: '#6B726C', fontSize: 11 }} />
                  <YAxis stroke="#8EAA97" tick={{ fill: '#6B726C', fontSize: 11 }} />
                  <Tooltip
                    formatter={(v: any) => [`${Number(v).toLocaleString('vi-VN')}k đ`, 'Doanh thu']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #E2E8E3',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#1E3B2B" strokeWidth={2.5} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bookings & Services Distribution Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings Count Bar Chart */}
        <Card className="border border-[#E2E8E3] shadow-luxury">
          <CardHeader>
            <CardTitle className="text-base">Số lượng ca phục vụ</CardTitle>
            <p className="text-xs text-[#6B726C]">Tổng số lịch hẹn theo từng chu kỳ</p>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={seriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E3" vertical={false} />
                  <XAxis dataKey="name" stroke="#8EAA97" tick={{ fill: '#6B726C', fontSize: 10 }} />
                  <YAxis stroke="#8EAA97" tick={{ fill: '#6B726C', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #E2E8E3',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="bookings" name="Lịch hẹn" fill="#C5A880" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Hoàn tất" fill="#1E3B2B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Services Menu Table */}
        <Card className="border border-[#E2E8E3] shadow-luxury">
          <CardHeader>
            <CardTitle className="text-base">Danh mục gói dịch vụ áp dụng</CardTitle>
            <p className="text-xs text-[#6B726C]">Mức giá niêm yết và thời lượng tiêu chuẩn ({services.length} dịch vụ)</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[240px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-[#FAFBF9] border-b border-[#E2E8E3] text-[#718276] uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Tên dịch vụ</th>
                    <th className="py-2.5 px-4">Danh mục</th>
                    <th className="py-2.5 px-4">Thời lượng</th>
                    <th className="py-2.5 px-4 text-right">Đơn giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E3]">
                  {services.map((s) => (
                    <tr key={s.id} className="hover:bg-[#FAFBF9]">
                      <td className="py-2.5 px-4 font-semibold text-[#14271C]">{s.name}</td>
                      <td className="py-2.5 px-4 text-[#526056]">{s.category}</td>
                      <td className="py-2.5 px-4 text-[#526056]">{s.minimumDurationMinutes} phút</td>
                      <td className="py-2.5 px-4 text-right font-semibold text-[#1E3B2B]">
                        {Number(s.basePrice).toLocaleString('vi-VN')} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
