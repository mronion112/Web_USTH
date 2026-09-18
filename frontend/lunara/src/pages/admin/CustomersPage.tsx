import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { MOCK_CUSTOMERS, CustomerDetail } from '@/data/mock-customers';
import { Search, Plus, Mail, Phone, ChevronDown, ChevronUp, Save } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerDetail[]>(MOCK_CUSTOMERS);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('cus-1');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form state for new customer
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Local state for editing internal notes of expanded customer
  const [editingNotes, setEditingNotes] = useState<{ [id: string]: string }>({});

  const handleNoteChange = (customerId: string, value: string) => {
    setEditingNotes((prev) => ({ ...prev, [customerId]: value }));
  };

  const handleSaveNote = (customerId: string) => {
    const newNote = editingNotes[customerId];
    if (newNote === undefined) return;

    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, internalNotes: newNote } : c))
    );

    setSuccessMsg('Đã cập nhật ghi chú nội bộ cho khách hàng');
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) return;

    const newCus: CustomerDetail = {
      id: `cus-${Date.now()}`,
      name: formName,
      phone: formPhone,
      email: formEmail || `${formPhone}@client.lunara.vn`,
      bookingsCount: 1,
      completedCount: 0,
      totalSpent: 0,
      lastVisit: 'Khách hàng mới',
      preferences: '',
      internalNotes: formNotes || 'Khách đăng ký mới qua quầy tiếp đón.',
    };

    setCustomers([newCus, ...customers]);
    setAddModalOpen(false);
    setSuccessMsg(`Đã thêm mới thành công hồ sơ khách hàng: ${formName}`);
    setTimeout(() => setSuccessMsg(''), 4000);

    // Reset Form
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormNotes('');
  };

  const filtered = customers.filter(
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
            Danh bạ thành viên & lịch sử chăm sóc tại Lunara ({customers.length} khách hàng)
          </p>
        </div>

        <Button
          onClick={() => setAddModalOpen(true)}
          className="rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs h-11 px-5 shadow-luxury cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-1.5 text-[#C5A880]" />
          Thêm khách hàng mới
        </Button>
      </div>

      {successMsg && (
        <div className="rounded-xl bg-[#E8F5E9] border border-[#2E7D32]/20 p-3.5 text-xs text-[#1E3B2B] font-medium animate-in fade-in">
          ✓ {successMsg}
        </div>
      )}

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
                const currentNote =
                  editingNotes[customer.id] !== undefined
                    ? editingNotes[customer.id]
                    : customer.internalNotes;

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

                    {/* Expandable Profile Panel (Đã loại bỏ Sở thích & Yêu cầu riêng theo yêu cầu) */}
                    {isExpanded && (
                      <tr className="bg-[#F8F9F5]/70">
                        <td colSpan={6} className="p-6">
                          <div className="bg-white p-6 rounded-2xl border border-[#E2E8E3] shadow-xs space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8E3]">
                              <div>
                                <h4 className="font-display font-semibold text-base text-[#14271C]">
                                  Ghi chú nội bộ chuyên viên ({customer.name})
                                </h4>
                                <p className="text-xs text-[#6B726C]">
                                  Lưu lại các đặc điểm da, lưu ý khi phục vụ và phản hồi trước đó
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" className="text-xs h-9">
                                  <Phone className="h-3.5 w-3.5 mr-1 text-[#8EAA97]" /> Gọi điện
                                </Button>
                                <Button size="sm" variant="outline" className="text-xs h-9">
                                  <Mail className="h-3.5 w-3.5 mr-1 text-[#8EAA97]" /> Gửi email
                                </Button>
                              </div>
                            </div>

                            {/* Editable Internal Notes */}
                            <div className="space-y-3">
                              <Textarea
                                value={currentNote}
                                onChange={(e) => handleNoteChange(customer.id, e.target.value)}
                                rows={3}
                                placeholder="Nhập ghi chú chăm sóc khách hàng..."
                                className="text-xs bg-[#F8F9F5] border-[#E2E8E3] rounded-xl leading-relaxed focus:bg-white"
                              />

                              <div className="flex items-center justify-between pt-1">
                                <div className="text-[11px] text-[#8EAA97]">
                                  Tỷ lệ hoàn thành lịch hẹn: {Math.round((customer.completedCount / Math.max(1, customer.bookingsCount)) * 100)}% ({customer.completedCount}/{customer.bookingsCount} ca)
                                </div>

                                <Button
                                  size="sm"
                                  onClick={() => handleSaveNote(customer.id)}
                                  className="bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs h-9 px-4 font-semibold"
                                >
                                  <Save className="h-3.5 w-3.5 mr-1.5 text-[#C5A880]" />
                                  Lưu ghi chú
                                </Button>
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

      {/* Modal Thêm Khách Hàng Mới */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Thêm khách hàng mới</DialogTitle>
            <DialogDescription>
              Tạo hồ sơ thành viên mới trong hệ thống chăm sóc khách hàng Lunara
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <Label>Họ và tên khách hàng *</Label>
              <Input
                required
                placeholder="Ví dụ: Lê Thị Thanh Nhàn"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="h-10 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Số điện thoại *</Label>
                <Input
                  required
                  placeholder="0901 234 567"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="thanhnhan@gmail.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Ghi chú nội bộ ban đầu</Label>
              <Textarea
                rows={3}
                placeholder="Ghi chú về thói quen, loại da hoặc nhân viên giới thiệu..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddModalOpen(false)}
              className="text-xs h-10"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs h-10 px-4 font-semibold"
            >
              Lưu khách hàng
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
};
