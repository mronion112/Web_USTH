import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MOCK_SERVICES } from '@/data/mock-services';
import { Service } from '@/types';
import { Plus, Edit2, Clock } from 'lucide-react';
import { SlidingTabs } from '@/components/transitions/SlidingTabs';
import { TiltCard } from '@/components/transitions/TiltCard';

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>(MOCK_SERVICES);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form state for new service
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<'Massage' | 'Facial' | 'Body Care' | 'VIP Package'>('Massage');
  const [formPrice, setFormPrice] = useState('500000');
  const [formDuration, setFormDuration] = useState('60');
  const [formAdjustable, setFormAdjustable] = useState(true);
  const [formImage, setFormImage] = useState('https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80');
  const [formDescription, setFormDescription] = useState('');

  const categories = ['All', 'Massage', 'Facial', 'Body Care', 'VIP Package'];

  const filtered = activeCategory === 'All'
    ? services
    : services.filter((s) => s.category === activeCategory);

  const handleEdit = (srv: Service) => {
    setEditingService({ ...srv });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    setServices((prev) =>
      prev.map((s) => (s.id === editingService.id ? editingService : s))
    );
    setEditDialogOpen(false);
    setSuccessMsg(`Đã cập nhật thông tin dịch vụ: ${editingService.name}`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const newService: Service = {
      id: `srv-${Date.now()}`,
      category: formCategory,
      name: formName,
      description: formDescription || 'Liệu trình thư giãn chuyên sâu tại Lunara Spa.',
      imageUrl: formImage,
      basePrice: parseInt(formPrice, 10) || 500000,
      minimumDurationMinutes: parseInt(formDuration, 10) || 60,
      isDurationAdjustable: formAdjustable,
      durationStepMinutes: 30,
      pricePerDurationStep: 200000,
      preparationBufferMinutes: 10,
      cleanupBufferMinutes: 15,
      displayOrder: services.length + 1,
      isActive: true,
    };

    setServices([newService, ...services]);
    setAddDialogOpen(false);
    setSuccessMsg(`Đã thêm thành công gói dịch vụ mới: ${formName}`);
    setTimeout(() => setSuccessMsg(''), 4000);

    // Reset Form
    setFormName('');
    setFormDescription('');
  };

  return (
    <div className="space-y-6 font-body max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#14271C]">
            Danh mục dịch vụ
          </h1>
          <p className="text-xs text-[#6B726C] mt-1">
            Cấu hình thời lượng, mức giá và trạng thái khả dụng của menu spa ({services.length} gói dịch vụ)
          </p>
        </div>

        <Button
          onClick={() => setAddDialogOpen(true)}
          className="rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs h-11 px-5 shadow-luxury cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-1.5 text-[#C5A880]" />
          Thêm dịch vụ mới
        </Button>
      </div>

      {successMsg && (
        <div className="rounded-xl bg-[#E8F5E9] border border-[#2E7D32]/20 p-3.5 text-xs text-[#1E3B2B] font-medium animate-in fade-in">
          ✓ {successMsg}
        </div>
      )}

      {/* Categories with Sliding Pill */}
      <div className="overflow-x-auto pb-1">
        <SlidingTabs
          activeKey={activeCategory}
          onChange={setActiveCategory}
          tabs={categories.map((c) => ({
            key: c,
            label: c === 'All' ? `Tất cả (${services.length})` : c,
          }))}
        />
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((service) => (
          <TiltCard key={service.id} maxTilt={6} cardClassName="rounded-2xl">
            <Card className="h-full overflow-hidden border border-[#E2E8E3] shadow-luxury flex flex-col">
              <div className="relative aspect-video w-full overflow-hidden bg-[#EDEEEA]">
                <img
                  src={service.imageUrl}
                  alt={service.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <Badge variant="secondary">{service.category}</Badge>
                </div>
                <div className="absolute top-3 right-3">
                  <Badge variant={service.isActive ? 'success' : 'outline'}>
                    {service.isActive ? '● Đang mở' : '○ Tạm đóng'}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-display font-semibold text-lg text-[#14271C]">
                    {service.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#8EAA97] mt-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Thời lượng: {service.minimumDurationMinutes} phút</span>
                    {service.isDurationAdjustable && (
                      <span className="text-[#C5A880] font-medium">(Tùy chỉnh +30p)</span>
                    )}
                  </div>
                  <p className="text-xs text-[#526056] mt-2 line-clamp-2 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E2E8E3] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#8EAA97] block">Giá liệu trình</span>
                    <span className="font-display font-bold text-base text-[#14271C]">
                      {service.basePrice.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(service)}
                    className="text-xs h-9 cursor-pointer hover:border-[#1E3B2B]"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1 text-[#8EAA97]" /> Sửa
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TiltCard>
        ))}
      </div>

      {/* Modal Thêm Dịch Vụ Mới */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <form onSubmit={handleCreateService} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Thêm gói dịch vụ mới</DialogTitle>
            <DialogDescription>
              Cấu hình liệu trình mới để đưa vào danh mục phục vụ tại Spa Lunara
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <Label>Tên gói dịch vụ *</Label>
              <Input
                required
                placeholder="Ví dụ: Massage Trị Liệu Vai Cổ Thảo Mộc"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="h-10 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nhóm danh mục</Label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E2E8E3] bg-white text-xs font-medium text-[#14271C]"
                >
                  <option value="Massage">Massage</option>
                  <option value="Facial">Facial</option>
                  <option value="Body Care">Body Care</option>
                  <option value="VIP Package">VIP Package</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label>Giá cơ bản (VNĐ) *</Label>
                <Input
                  required
                  type="number"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Thời lượng tối thiểu (phút)</Label>
                <Input
                  type="number"
                  value={formDuration}
                  onChange={(e) => setFormDuration(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1 flex flex-col justify-end">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E2E8E3] bg-[#F8F9F5] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formAdjustable}
                    onChange={(e) => setFormAdjustable(e.target.checked)}
                    className="rounded text-[#1E3B2B]"
                  />
                  <span className="text-[11px] font-medium text-[#14271C]">Cho phép thêm +30p</span>
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <Label>URL Hình ảnh đại diện</Label>
              <Input
                value={formImage}
                onChange={(e) => setFormImage(e.target.value)}
                className="h-10 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label>Mô tả chi tiết liệu trình</Label>
              <Textarea
                rows={3}
                placeholder="Mô tả công dụng, tinh dầu sử dụng và quy trình chăm sóc..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
              className="text-xs h-10"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs h-10 px-4 font-semibold"
            >
              Thêm dịch vụ
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Edit Service Modal Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        {editingService && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa gói dịch vụ</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin chi tiết cho {editingService.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label>Tên gói dịch vụ</Label>
                <Input
                  value={editingService.name}
                  onChange={(e) =>
                    setEditingService({ ...editingService, name: e.target.value })
                  }
                  className="h-10 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Giá cơ bản (VNĐ)</Label>
                  <Input
                    value={editingService.basePrice}
                    type="number"
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        basePrice: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="h-10 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Thời lượng tối thiểu (phút)</Label>
                  <Input
                    value={editingService.minimumDurationMinutes}
                    type="number"
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        minimumDurationMinutes: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="h-10 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Mô tả liệu trình</Label>
                <Textarea
                  value={editingService.description}
                  onChange={(e) =>
                    setEditingService({ ...editingService, description: e.target.value })
                  }
                  rows={3}
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="text-xs h-10"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                className="bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs h-10 px-4 font-semibold"
              >
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </form>
        )}
      </Dialog>
    </div>
  );
};
