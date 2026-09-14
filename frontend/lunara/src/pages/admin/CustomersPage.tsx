import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MOCK_CUSTOMERS, CustomerDetail } from '@/data/mock-customers';
import { Search, Plus, Mail, Phone, Calendar, ChevronDown, ChevronUp, UserCheck } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('cus-1');

  const filtered = MOCK_CUSTOMERS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-body max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#14271C]">
            Quản lý khách hàng
          </h1>
          <p className="text-xs text-[#6B726C] mt-1">
            Danh bạ thành viên & lịch sử chăm sóc tại Lunara
          </p>
        </div>

        <Button className="rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs h-11 px-5">
          <Plus className="h-4 w-4 mr-1.5 text-[#C5A880]" />
          Thêm khách hàng mới
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8EAA97]" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm tên khách hàng, số điện thoại hoặc email..."
          className="pl-10 text-xs h-10 bg-white"
        />
      </div>

      {/* Customers List with Expandable Rows */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F8F9F5] border-b border-[#E2E8E3] text-[#6B726C] uppercase font-semibold">
              <tr>
                <th className="py-3.5 px-6">Khách hàng</th>
                <th className="py-3.5 px-6">Liên hệ</th>
                <th className="py-3.5 px-6 text-center">Số lần đặt</th>
                <th className="py-3.5 px-6 text-right">Tổng chi tiêu</th>
                <th className="py-3.5 px-6">Lần ghé gần nhất</th>
                <th className="py-3.5 px-6 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8E3]">
              {filtered.map((customer) => {
                const isExpanded = expandedId === customer.id;
                return (
                  <React.Fragment key={customer.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : customer.id)}
                      className="hover:bg-[#F8F9F5]/80 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-6 font-semibold text-[#14271C]">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-[#E8F5E9] text-[#1E3B2B] font-bold flex items-center justify-center">
                            {customer.name.charAt(0)}
                          </div>
                          <span>{customer.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-[#526056]">
                        <div>{customer.phone}</div>
                        <div className="text-[11px] text-[#8EAA97]">{customer.email}</div>
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-[#14271C]">
                        {customer.bookingsCount} lần
                      </td>
                      <td className="py-4 px-6 text-right font-display font-bold text-[#1E3B2B] text-sm">
                        {customer.totalSpent.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-4 px-6 text-[#526056]">{customer.lastVisit}</td>
                      <td className="py-4 px-6 text-right text-[#8EAA97]">
                        {isExpanded ? <ChevronUp className="h-4 w-4 inline-block" /> : <ChevronDown className="h-4 w-4 inline-block" />}
                      </td>
                    </tr>

                    {/* Expandable Profile Panel */}
                    {isExpanded && (
                      <tr className="bg-[#F8F9F5]/70">
                        <td colSpan={6} className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-[#E2E8E3] shadow-xs">
                            <div className="space-y-3">
                              <h4 className="font-display font-semibold text-sm text-[#14271C]">
                                Sở thích & Yêu cầu riêng
                              </h4>
                              <p className="text-xs text-[#526056] leading-relaxed bg-[#F8F9F5] p-3 rounded-xl border border-[#E2E8E3]/60">
                                {customer.preferences}
                              </p>
                              <div className="flex gap-2 pt-1">
                                <Button size="sm" variant="outline" className="text-xs h-9">
                                  <Phone className="h-3.5 w-3.5 mr-1" /> Gọi điện
                                </Button>
                                <Button size="sm" variant="outline" className="text-xs h-9">
                                  <Mail className="h-3.5 w-3.5 mr-1" /> Gửi email
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <h4 className="font-display font-semibold text-sm text-[#14271C]">
                                Ghi chú nội bộ chuyên viên
                              </h4>
                              <p className="text-xs text-[#526056] leading-relaxed bg-[#F8F9F5] p-3 rounded-xl border border-[#E2E8E3]/60">
                                {customer.internalNotes}
                              </p>
                              <div className="text-[11px] text-[#8EAA97]">
                                Khách hàng VIP · Tỷ lệ hoàn thành lịch hẹn: {Math.round((customer.completedCount / customer.bookingsCount) * 100)}%
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
