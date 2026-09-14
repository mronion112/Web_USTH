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
import { Plus, Edit2, Clock, Sparkles } from 'lucide-react';

export const ServicesPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const categories = ['All', 'Massage', 'Facial', 'Body Care', 'VIP Package'];

  const filtered = activeCategory === 'All'
    ? MOCK_SERVICES
    : MOCK_SERVICES.filter((s) => s.category === activeCategory);

  const handleEdit = (srv: Service) => {
    setEditingService(srv);
    setDialogOpen(true);
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
            Cấu hình thời lượng, mức giá và trạng thái khả dụng của menu spa
          </p>
        </div>

        <Button className="rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs h-11 px-5">
          <Plus className="h-4 w-4 mr-1.5 text-[#C5A880]" />
          Thêm dịch vụ mới
        </Button>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeCategory === cat
                ? 'bg-[#1E3B2B] text-white shadow-sm'
                : 'bg-white text-[#526056] border border-[#E2E8E3] hover:border-[#1E3B2B]'
            }`}
          >
            {cat === 'All' ? 'Tất cả' : cat}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((service) => (
          <Card key={service.id} className="overflow-hidden border border-[#E2E8E3] shadow-luxury flex flex-col">
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
                  className="text-xs h-9"
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1" /> Sửa
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Service Modal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {editingService && (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa gói dịch vụ</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin chi tiết cho {editingService.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label>Tên gói dịch vụ</Label>
                <Input defaultValue={editingService.name} className="h-10 text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Giá cơ bản (VNĐ)</Label>
                  <Input defaultValue={editingService.basePrice} type="number" className="h-10 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label>Thời lượng tối thiểu (phút)</Label>
                  <Input defaultValue={editingService.minimumDurationMinutes} type="number" className="h-10 text-xs" />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Mô tả liệu trình</Label>
                <Textarea defaultValue={editingService.description} rows={3} className="text-xs" />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy bỏ
              </Button>
              <Button
                onClick={() => setDialogOpen(false)}
                className="bg-[#1E3B2B] text-white hover:bg-[#14271C]"
              >
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
};
