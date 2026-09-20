import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit2, Clock, Power } from 'lucide-react';
import { SlidingTabs } from '@/components/transitions/SlidingTabs';
import { TiltCard } from '@/components/transitions/TiltCard';
import { servicesApi, ApiService } from '@/lib/api';

const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  FACIAL: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=800',
  BODY: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800',
  MASSAGE: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&q=80&w=800',
  COMBO: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800',
};

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<ApiService[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [editingService, setEditingService] = useState<ApiService | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // Form state for new service
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('MASSAGE');
  const [formPrice, setFormPrice] = useState('500000');
  const [formDuration, setFormDuration] = useState('60');
  const [formAdjustable] = useState(true);
  const [formImage, setFormImage] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const loadServices = useCallback(async () => {
    try {
      const data = await servicesApi.getAll();
      if (Array.isArray(data)) {
        setServices(data);
      }
    } catch (err) {
      console.error('Failed to fetch services:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const uniqueCategories = Array.from(new Set(services.map((s) => s.category).filter(Boolean)));
  const categories = ['All', ...uniqueCategories];

  const filtered = activeCategory === 'All'
    ? services
    : services.filter((s) => s.category === activeCategory);

  const handleEdit = (srv: ApiService) => {
    setEditingService({ ...srv });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    try {
      await servicesApi.update(editingService.id, {
        name: editingService.name,
        category: editingService.category,
        description: editingService.description,
        basePrice: Number(editingService.basePrice),
        minimumDurationMinutes: Number(editingService.minimumDurationMinutes),
        isDurationAdjustable: editingService.isDurationAdjustable,
        imageUrl: editingService.imageUrl,
      });
      await loadServices();
      setEditDialogOpen(false);
      setSuccessMsg(`Đã cập nhật dịch vụ: ${editingService.name}`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật dịch vụ');
    }
  };

  const handleToggleStatus = async (srv: ApiService) => {
    try {
      await servicesApi.toggleActive(srv.id);
      await loadServices();
      setSuccessMsg(`Đã thay đổi trạng thái dịch vụ ${srv.name}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi thay đổi trạng thái');
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    try {
      await servicesApi.create({
        name: formName.trim(),
        category: formCategory,
        description: formDescription.trim() || 'Liệu trình thư giãn chuyên sâu tại Lunara Spa.',
        imageUrl: formImage.trim() || DEFAULT_CATEGORY_IMAGES[formCategory] || DEFAULT_CATEGORY_IMAGES.MASSAGE,
        basePrice: parseInt(formPrice, 10) || 500000,
        minimumDurationMinutes: parseInt(formDuration, 10) || 60,
        isDurationAdjustable: formAdjustable,
        durationStepMinutes: 30,
        pricePerDurationStep: 200000,
        preparationBufferMinutes: 10,
        cleanupBufferMinutes: 15,
      });

      await loadServices();
      setAddDialogOpen(false);
      setSuccessMsg(`Đã thêm thành công gói dịch vụ mới: ${formName}`);
      setTimeout(() => setSuccessMsg(''), 4000);

      // Reset Form
      setFormName('');
      setFormDescription('');
      setFormImage('');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo dịch vụ mới');
    }
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
            Cấu hình thời lượng, mức giá và trạng thái khả dụng từ hệ thống ({services.length} gói dịch vụ)
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
      {loading ? (
        <div className="text-center py-16 text-xs text-[#8EAA97]">Đang tải danh sách dịch vụ từ database...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((service) => {
            const isServiceActive = service.isActive ?? service.active ?? true;
            const img = service.imageUrl && !service.imageUrl.startsWith('/images')
              ? service.imageUrl
              : (DEFAULT_CATEGORY_IMAGES[service.category] || DEFAULT_CATEGORY_IMAGES.MASSAGE);

            return (
              <TiltCard key={service.id} maxTilt={6} cardClassName="rounded-2xl">
                <Card className="h-full overflow-hidden border border-[#E2E8E3] shadow-luxury flex flex-col">
                  <div className="relative aspect-video w-full overflow-hidden bg-[#EDEEEA]">
                    <img
                      src={img}
                      alt={service.name}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary">{service.category}</Badge>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge variant={isServiceActive ? 'success' : 'outline'}>
                        {isServiceActive ? '● Đang mở' : '○ Tạm đóng'}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="font-display font-semibold text-lg text-[#14271C]">
                        {service.name}
                      </h3>
                      <p className="text-xs text-[#526056] line-clamp-2 mt-1">
                        {service.description || 'Dịch vụ trị liệu cao cấp tại Lunara Spa.'}
                      </p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-[#E2E8E3]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#8EAA97] flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Thời lượng chuẩn:
                        </span>
                        <span className="font-semibold text-[#14271C]">
                          {service.minimumDurationMinutes} phút
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-[#8EAA97] uppercase tracking-wider block">
                            Đơn giá
                          </span>
                          <span className="font-display text-lg font-bold text-[#1E3B2B]">
                            {Number(service.basePrice).toLocaleString('vi-VN')} đ
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(service)}
                            title={isServiceActive ? 'Tạm đóng dịch vụ' : 'Mở lại dịch vụ'}
                            className="rounded-xl h-8 text-xs cursor-pointer"
                          >
                            <Power className={`h-3.5 w-3.5 ${isServiceActive ? 'text-[#BA1A1A]' : 'text-[#2E7D32]'}`} />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(service)}
                            className="rounded-xl h-8 text-xs text-[#1E3B2B] border-[#D9E5DC] hover:border-[#1E3B2B] cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1" />
                            Sửa
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TiltCard>
            );
          })}
        </div>
      )}

      {/* Edit Service Modal */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-luxury border border-[#E2E8E3] animate-in fade-in zoom-in-95">
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-[#14271C]">
                Chỉnh sửa dịch vụ
              </DialogTitle>
              <DialogDescription className="text-xs text-[#6B726C]">
                Cập nhật thông tin chi tiết, giá tiền và chính sách thời lượng.
              </DialogDescription>
            </DialogHeader>

            {editingService && (
              <form onSubmit={handleSaveEdit} className="space-y-4 my-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tên dịch vụ</Label>
                  <Input
                    value={editingService.name}
                    onChange={(e) =>
                      setEditingService({ ...editingService, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Danh mục</Label>
                    <Input
                      value={editingService.category}
                      onChange={(e) =>
                        setEditingService({ ...editingService, category: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Đơn giá (VNĐ)</Label>
                    <Input
                      type="number"
                      value={editingService.basePrice}
                      onChange={(e) =>
                        setEditingService({
                          ...editingService,
                          basePrice: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Thời lượng tối thiểu (phút)</Label>
                    <Input
                      type="number"
                      value={editingService.minimumDurationMinutes}
                      onChange={(e) =>
                        setEditingService({
                          ...editingService,
                          minimumDurationMinutes: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Link hình ảnh</Label>
                    <Input
                      value={editingService.imageUrl || ''}
                      onChange={(e) =>
                        setEditingService({ ...editingService, imageUrl: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Mô tả liệu trình</Label>
                  <Textarea
                    rows={3}
                    value={editingService.description || ''}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditDialogOpen(false)}
                    className="rounded-xl text-xs"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs"
                  >
                    Lưu thay đổi
                  </Button>
                </DialogFooter>
              </form>
            )}
          </div>
        </div>
      </Dialog>

      {/* Add New Service Modal */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-luxury border border-[#E2E8E3] animate-in fade-in zoom-in-95">
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-[#14271C]">
                Thêm gói dịch vụ mới
              </DialogTitle>
              <DialogDescription className="text-xs text-[#6B726C]">
                Khởi tạo dịch vụ và cấu hình thời lượng bước nhảy trên hệ thống.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateService} className="space-y-4 my-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Tên dịch vụ *</Label>
                <Input
                  placeholder="VD: Trị Liệu Thảo Dược Đông Y..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Danh mục</Label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-white border border-[#E2E8E3] rounded-xl focus:ring-[#1E3B2B]"
                  >
                    <option value="MASSAGE">Massage</option>
                    <option value="FACIAL">Facial</option>
                    <option value="BODY">Body Care</option>
                    <option value="COMBO">VIP Package</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Đơn giá khởi điểm (VNĐ) *</Label>
                  <Input
                    type="number"
                    step="10000"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Thời lượng tối thiểu (phút) *</Label>
                  <Input
                    type="number"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">URL Hình ảnh</Label>
                  <Input
                    placeholder="https://images.unsplash..."
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Mô tả liệu trình</Label>
                <Textarea
                  rows={3}
                  placeholder="Mô tả công dụng, dược liệu sử dụng..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddDialogOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs"
                >
                  Tạo dịch vụ
                </Button>
              </DialogFooter>
            </form>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
