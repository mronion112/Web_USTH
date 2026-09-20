import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Search, Plus, Mail, Phone, ChevronDown, ChevronUp, Save, Sparkles, Heart } from 'lucide-react';
import { customersApi, ApiCustomer } from '@/lib/api';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // Form state for new customer
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formPrefs, setFormPrefs] = useState('');

  // Local state for editing internal notes
  const [editingNotes, setEditingNotes] = useState<{ [id: number]: string }>({});
  const [editingPrefs, setEditingPrefs] = useState<{ [id: number]: string }>({});

  const reloadCustomers = useCallback(async () => {
    try {
      const data = await customersApi.getAll(search.trim() || undefined, 0, 100);
      if (Array.isArray(data)) {
        setCustomers(data);
        if (data.length > 0 && expandedId === null) {
          setExpandedId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    reloadCustomers();
  }, [reloadCustomers]);

  const handleNoteChange = (customerId: number, value: string) => {
    setEditingNotes((prev) => ({ ...prev, [customerId]: value }));
  };

  const handlePrefsChange = (customerId: number, value: string) => {
    setEditingPrefs((prev) => ({ ...prev, [customerId]: value }));
  };

  const handleSaveNote = async (customerId: number) => {
    const newNote = editingNotes[customerId];
    const newPref = editingPrefs[customerId];

    try {
      await customersApi.updateNotes(customerId, newNote, newPref);
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId
            ? {
                ...c,
                internalNotes: newNote !== undefined ? newNote : c.internalNotes,
                preferences: newPref !== undefined ? newPref : c.preferences,
              }
            : c
        )
      );
      setSuccessMsg('Đã lưu ghi chú và sở thích khách hàng vào hệ thống');
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu ghi chú');
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) return;

    try {
      await customersApi.create({
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim() || undefined,
        internalNotes: formNotes.trim() || undefined,
        preferences: formPrefs.trim() || undefined,
      });

      await reloadCustomers();
      setAddModalOpen(false);
      setSuccessMsg(`Đã tạo hồ sơ khách hàng mới: ${formName}`);
      setTimeout(() => setSuccessMsg(''), 3500);

      // Reset form
      setFormName('');
      setFormPhone('');
      setFormEmail('');
      setFormNotes('');
      setFormPrefs('');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo khách hàng');
    }
  };

  return (
    <div className="space-y-6 font-body max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#14271C]">
            Hồ sơ khách hàng
          </h1>
          <p className="text-xs text-[#6B726C] mt-1">
            Dữ liệu thành viên, lịch sử đặt chỗ và ghi chú chăm sóc cá nhân hóa ({customers.length} khách)
          </p>
        </div>

        <Button
          onClick={() => setAddModalOpen(true)}
          className="rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs h-11 px-5 shadow-luxury cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-1.5 text-[#C5A880]" />
          Thêm khách hàng
        </Button>
      </div>

      {successMsg && (
        <div className="rounded-xl bg-[#E8F5E9] border border-[#2E7D32]/20 p-3.5 text-xs text-[#1E3B2B] font-medium animate-in fade-in">
          ✓ {successMsg}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8EAA97]" />
        <Input
          placeholder="Tìm theo tên, số điện thoại hoặc email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 text-xs rounded-xl bg-white border-[#E2E8E3]"
        />
      </div>

      {/* Customer Accordion List */}
      {loading ? (
        <div className="text-center py-16 text-xs text-[#8EAA97]">Đang tải hồ sơ khách hàng từ database...</div>
      ) : customers.length === 0 ? (
        <div className="text-center py-16 text-xs text-[#8EAA97]">Không tìm thấy khách hàng phù hợp</div>
      ) : (
        <div className="space-y-3">
          {customers.map((cus) => {
            const isExpanded = expandedId === cus.id;
            const currentNote =
              editingNotes[cus.id] !== undefined ? editingNotes[cus.id] : cus.internalNotes || '';
            const currentPref =
              editingPrefs[cus.id] !== undefined ? editingPrefs[cus.id] : cus.preferences || '';

            return (
              <Card
                key={cus.id}
                className="overflow-hidden border border-[#E2E8E3] shadow-luxury transition-all"
              >
                {/* Accordion Summary Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : cus.id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-[#FAFBF9] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-2xl bg-[#E8F5E9] text-[#1E3B2B] flex items-center justify-center font-display font-bold text-base shrink-0">
                      {cus.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-semibold text-[#14271C] text-base">
                          {cus.name}
                        </span>
                        {cus.completedCount >= 3 && (
                          <span className="inline-flex items-center gap-0.5 bg-[#C5A880]/20 text-[#14271C] text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                            <Sparkles className="h-3 w-3 text-[#C5A880]" />
                            VIP Member
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#526056] mt-1">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-[#8EAA97]" />
                          {cus.phone || 'Chưa có SĐT'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-[#8EAA97]" />
                          {cus.email}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 self-end sm:self-center">
                    <div className="text-right">
                      <span className="text-[11px] text-[#8EAA97] block">Lịch sử trị liệu</span>
                      <span className="font-semibold text-xs text-[#14271C]">
                        {cus.completedCount} / {cus.bookingsCount} lượt hoàn thành
                      </span>
                    </div>

                    <div className="text-right hidden md:block">
                      <span className="text-[11px] text-[#8EAA97] block">Tổng chi tiêu</span>
                      <span className="font-bold text-xs text-[#1E3B2B]">
                        {Number(cus.totalSpent).toLocaleString('vi-VN')} đ
                      </span>
                    </div>

                    <div className="p-1 rounded-full text-[#8EAA97] hover:text-[#14271C]">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Detail Panel */}
                {isExpanded && (
                  <div className="p-6 border-t border-[#E2E8E3] bg-[#FAFBF9] space-y-5 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Left: Preferences & Visit History */}
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs font-semibold text-[#14271C] flex items-center gap-1.5 mb-1.5">
                            <Heart className="h-3.5 w-3.5 text-[#C5A880]" />
                            Sở thích & Lưu ý đặc biệt của khách
                          </Label>
                          <Input
                            value={currentPref}
                            onChange={(e) => handlePrefsChange(cus.id, e.target.value)}
                            placeholder="Ví dụ: Ưu tiên KTV nữ, massage lực nhẹ..."
                            className="bg-white text-xs rounded-xl border-[#E2E8E3]"
                          />
                        </div>

                        <div className="p-3.5 rounded-xl bg-white border border-[#E2E8E3] text-xs space-y-1">
                          <span className="text-[#8EAA97] block text-[11px]">Lần ghé thăm gần nhất:</span>
                          <span className="font-semibold text-[#14271C]">
                            {cus.lastVisit ? new Date(cus.lastVisit).toLocaleString('vi-VN') : 'Khách hàng mới'}
                          </span>
                        </div>
                      </div>

                      {/* Right: Internal Staff Notes with Save Button */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold text-[#14271C]">
                            Ghi chú nội bộ dành cho Lễ tân & KTV
                          </Label>
                          <Button
                            size="sm"
                            onClick={() => handleSaveNote(cus.id)}
                            className="h-7 px-3 rounded-lg bg-[#1E3B2B] text-white hover:bg-[#14271C] text-[11px] font-semibold cursor-pointer"
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Lưu ghi chú
                          </Button>
                        </div>
                        <Textarea
                          rows={3}
                          value={currentNote}
                          onChange={(e) => handleNoteChange(cus.id, e.target.value)}
                          placeholder="Ghi chú thể trạng, vùng đau mỏi cần tập trung, thói quen thanh toán..."
                          className="bg-white text-xs rounded-xl border-[#E2E8E3]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Customer Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-luxury border border-[#E2E8E3] animate-in fade-in zoom-in-95">
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-[#14271C]">
                Đăng ký hồ sơ khách hàng mới
              </DialogTitle>
              <DialogDescription className="text-xs text-[#6B726C]">
                Tạo tài khoản và lưu trữ sở thích liệu trình tại quầy tiếp đón.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5 my-4">
              <div className="space-y-1">
                <Label className="text-xs">Họ và tên khách hàng *</Label>
                <Input
                  placeholder="VD: Nguyễn Thùy Linh..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Số điện thoại *</Label>
                  <Input
                    placeholder="09..."
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input
                    placeholder="linh@gmail.com"
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Sở thích trị liệu</Label>
                <Input
                  placeholder="Lực massage vừa, tinh dầu sả chanh..."
                  value={formPrefs}
                  onChange={(e) => setFormPrefs(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Ghi chú nội bộ</Label>
                <Textarea
                  rows={2}
                  placeholder="Khách đăng ký qua giới thiệu..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs font-semibold"
                >
                  Tạo hồ sơ
                </Button>
              </DialogFooter>
            </form>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
