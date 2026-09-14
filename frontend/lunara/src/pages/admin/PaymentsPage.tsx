import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MOCK_PAYMENTS } from '@/data/mock-payments';
import { Search, Download, CreditCard, DollarSign, Clock, CheckCircle } from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const filtered = MOCK_PAYMENTS.filter(
    (p) =>
      p.transactionCode.toLowerCase().includes(search.toLowerCase()) ||
      p.customerName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-body max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#14271C]">
            Thanh toán & Giao dịch
          </h1>
          <p className="text-xs text-[#6B726C] mt-1">
            Đối soát dòng tiền, hóa đơn QR và hoàn tiền dịch vụ
          </p>
        </div>

        <Button variant="outline" className="text-xs h-10 border-[#D9E5DC]">
          <Download className="h-4 w-4 mr-1.5 text-[#8EAA97]" /> Xuất báo cáo Excel
        </Button>
      </div>

      {/* 3 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-6 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8EAA97]">
            Doanh thu hôm nay
          </span>
          <div className="font-display text-3xl font-bold text-[#14271C]">
            8.400.000 đ
          </div>
          <p className="text-xs text-[#2E7D32]">● Đã quyết toán vào tài khoản Vietcombank</p>
        </Card>

        <Card className="p-6 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8EAA97]">
            Chờ thanh toán (Pending)
          </span>
          <div className="font-display text-3xl font-bold text-[#C5A880]">
            1.200.000 đ
          </div>
          <p className="text-xs text-[#526056]">○ 2 lịch hẹn khách thanh toán tại spa</p>
        </Card>

        <Card className="p-6 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8EAA97]">
            Hoàn tiền (Refunded)
          </span>
          <div className="font-display text-3xl font-bold text-[#6B726C]">
            450.000 đ
          </div>
          <p className="text-xs text-[#6B726C]">1 giao dịch hủy lịch theo quy định</p>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-[#E2E8E3]">
          <div className="relative max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8EAA97]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã giao dịch hoặc tên khách..."
              className="pl-10 text-xs h-9 bg-[#F8F9F5]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F8F9F5] border-b border-[#E2E8E3] text-[#6B726C] uppercase font-semibold">
              <tr>
                <th className="py-3.5 px-6">Mã giao dịch</th>
                <th className="py-3.5 px-6">Mã đặt lịch</th>
                <th className="py-3.5 px-6">Khách hàng</th>
                <th className="py-3.5 px-6">Phương thức</th>
                <th className="py-3.5 px-6 text-right">Số tiền</th>
                <th className="py-3.5 px-6">Trạng thái</th>
                <th className="py-3.5 px-6">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8E3]">
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#F8F9F5]/80 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-[#1E3B2B]">{tx.transactionCode}</td>
                  <td className="py-4 px-6 font-mono text-[#526056]">{tx.bookingCode}</td>
                  <td className="py-4 px-6 font-medium text-[#14271C]">{tx.customerName}</td>
                  <td className="py-4 px-6">
                    <span className="font-semibold text-[#14271C]">
                      {tx.method === 'QR' ? '⚡ Quét mã QR' : tx.method === 'CARD' ? '💳 Thẻ POS' : '💵 Tại quầy'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-display font-bold text-sm text-[#14271C]">
                    {tx.amount.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="py-4 px-6">
                    <Badge variant={tx.status === 'PAID' ? 'success' : tx.status === 'FAILED' ? 'danger' : 'warning'}>
                      {tx.status === 'PAID' ? '✓ ĐÃ THU' : tx.status === 'FAILED' ? '✕ THẤT BẠI' : '○ CHỜ THANH TOÁN'}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-[#6B726C]">{tx.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
