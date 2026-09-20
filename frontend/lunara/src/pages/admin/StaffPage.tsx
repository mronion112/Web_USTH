import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit2, Calendar, X } from 'lucide-react';
import { SlidingTabs } from '@/components/transitions/SlidingTabs';
import { TiltCard } from '@/components/transitions/TiltCard';
import { accountsApi, staffScheduleApi, staffOnboardingApi, servicesApi, ApiAccount, ApiService } from '@/lib/api';

type ShiftType = 'MORNING' | 'AFTERNOON' | 'FULL_DAY' | 'OFF';

const SHIFT_LABELS: Record<ShiftType, string> = {
  MORNING: 'Ca sáng (08:30 — 14:30)',
  AFTERNOON: 'Ca chiều (14:00 — 20:00)',
  FULL_DAY: 'Cả ngày (09:00 — 18:00)',
  OFF: 'NGHỈ CA (Day Off)',
};

const DAYS_OF_WEEK = [
  'Thứ 2',
  'Thứ 3',
  'Thứ 4',
  'Thứ 5',
  'Thứ 6',
  'Thứ 7',
  'Chủ Nhật',
];

export const StaffPage: React.FC = () => {
  const [staffList, setStaffList] = useState<ApiAccount[]>([]);
  const [services, setServices] = useState<ApiService[]>([]);
  const [filterTab, setFilterTab] = useState<'ALL' | 'WORKING' | 'AVAILABLE'>('ALL');
  const [selectedStaff, setSelectedStaff] = useState<ApiAccount | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // Weekly shift state for each staff
  const [staffSchedules, setStaffSchedules] = useState<Record<number, ShiftType[]>>({});
  const [tempShifts, setTempShifts] = useState<ShiftType[]>([]);

  // Add Staff Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formJobTitle, setFormJobTitle] = useState('Kỹ thuật viên trị liệu');
  const [formServiceIds, setFormServiceIds] = useState<number[]>([]);
  const [formDays, setFormDays] = useState<number[]>([1, 2, 3, 4, 5]);

  const reloadStaff = useCallback(async () => {
    try {
      const data = await accountsApi.getAll();
      if (Array.isArray(data)) {
        const therapists = data.filter((a) => a.role === 'THERAPIST');
        const list = therapists.length > 0 ? therapists : data;
        setStaffList(list);

        const schedules = await Promise.all(list.map(async (staff) => ({ staff,
          schedule: await staffScheduleApi.getSchedule(staff.id).catch(() => ({ workingHours: [] })),
        })));
        const schedMap: Record<number, ShiftType[]> = {};
        schedules.forEach(({ staff, schedule }) => {
          const shifts: ShiftType[] = Array(7).fill('OFF');
          for (const hour of schedule.workingHours || []) {
            if (!hour.isActive && !hour.active) continue;
            const start = String(hour.startTime).slice(0, 5);
            const end = String(hour.endTime).slice(0, 5);
            shifts[hour.dayOfWeek - 1] = start < '09:00' && end <= '14:30' ? 'MORNING'
              : start >= '14:00' ? 'AFTERNOON' : 'FULL_DAY';
          }
          schedMap[staff.id] = shifts;
        });
        setStaffSchedules(schedMap);
      }
    } catch (err) {
      console.error('Failed to load staff accounts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadStaff();
    servicesApi.getAll().then(setServices).catch(() => undefined);
  }, [reloadStaff]);

  const handleOpenDetail = async (staff: ApiAccount) => {
    setSelectedStaff(staff);
    setDetailOpen(true);
    try {
      const res = await staffScheduleApi.getSchedule(staff.id);
      if (res && Array.isArray(res.workingHours) && res.workingHours.length > 0) {
        const shifts: ShiftType[] = Array(7).fill('OFF');
        res.workingHours.forEach((wh) => {
          const d = wh.dayOfWeek; // 1 = Mon .. 7 = Sun
          if (d >= 1 && d <= 7) {
            shifts[d - 1] = wh.isActive ? 'FULL_DAY' : 'OFF';
          }
        });
        setStaffSchedules((prev) => ({ ...prev, [staff.id]: shifts }));
      }
    } catch {
      // Ignore if schedule empty
    }
  };

  const handleOpenShiftEdit = (staff: ApiAccount) => {
    setSelectedStaff(staff);
    setTempShifts(staffSchedules[staff.id] || Array(7).fill('OFF'));
    setShiftModalOpen(true);
  };

  const handleShiftSelect = (dayIndex: number, shift: ShiftType) => {
    setTempShifts((prev) => {
      const updated = [...prev];
      updated[dayIndex] = shift;
      return updated;
    });
  };

  const handleSaveShifts = async () => {
    if (!selectedStaff) return;
    try {
      const workingHoursPayload = tempShifts.map((sh, idx) => ({
        dayOfWeek: idx + 1,
        startTime: sh === 'MORNING' ? '08:30:00' : sh === 'AFTERNOON' ? '14:00:00' : '09:00:00',
        endTime: sh === 'MORNING' ? '14:30:00' : sh === 'AFTERNOON' ? '20:00:00' : '18:00:00',
        isActive: sh !== 'OFF',
      }));

      await staffScheduleApi.updateWorkingHours(selectedStaff.id, workingHoursPayload);

      setStaffSchedules((prev) => ({
        ...prev,
        [selectedStaff.id]: tempShifts,
      }));

      setShiftModalOpen(false);
      setSuccessMsg(`Đã cập nhật ca làm việc 7 ngày cho ${selectedStaff.displayName}`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật ca trực');
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;

    try {
      if (!formServiceIds.length || !formDays.length) throw new Error('Chọn ít nhất một dịch vụ và một ca làm việc.');
      await staffOnboardingApi.create({
        name: formName.trim(),
        email: formEmail.trim(),
        jobTitle: formJobTitle.trim(),
        isBookable: true,
        serviceIds: formServiceIds,
        workingHours: formDays.map((dayOfWeek) => ({ dayOfWeek, startTime: '09:00:00', endTime: '18:00:00', isActive: true })),
      });

      await reloadStaff();
      setAddModalOpen(false);
      setSuccessMsg(`Đã thêm thành công kỹ thuật viên ${formName} vào hệ thống`);
      setTimeout(() => setSuccessMsg(''), 4000);

      setFormName('');
      setFormEmail('');
      setFormServiceIds([]);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi thêm kỹ thuật viên');
    }
  };

  const filteredStaff = staffList.filter((s) => {
    if (filterTab === 'AVAILABLE') return s.isActive;
    if (filterTab === 'WORKING') return s.isActive;
    return true;
  });

  return (
    <div className="space-y-6 font-body max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#14271C]">
            Quản lý kỹ thuật viên
          </h1>
          <p className="text-xs text-[#6B726C] mt-1">
            Đội ngũ chuyên viên trị liệu & điều phối ca làm việc ({staffList.length} nhân sự)
          </p>
        </div>

        <Button
          onClick={() => setAddModalOpen(true)}
          className="rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs h-11 px-5 shadow-luxury cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-1.5 text-[#C5A880]" />
          Thêm chuyên viên mới
        </Button>
      </div>

      {successMsg && (
        <div className="rounded-xl bg-[#E8F5E9] border border-[#2E7D32]/20 p-3.5 text-xs text-[#1E3B2B] font-medium animate-in fade-in">
          ✓ {successMsg}
        </div>
      )}

      {/* Filter Tabs with Sliding Pill */}
      <div className="overflow-x-auto pb-1">
        <SlidingTabs
          activeKey={filterTab}
          onChange={(key) => setFilterTab(key as any)}
          tabs={[
            { key: 'ALL', label: `Tất cả (${staffList.length})` },
            { key: 'WORKING', label: `Đang làm việc (${staffList.filter((s) => s.isActive).length})` },
            { key: 'AVAILABLE', label: `Sẵn sàng (${staffList.filter((s) => s.isActive).length})` },
          ]}
        />
      </div>

      {/* Staff Cards Grid */}
      {loading ? (
        <div className="text-center py-16 text-xs text-[#8EAA97]">Đang tải danh sách kỹ thuật viên từ database...</div>
      ) : staffList.length === 0 ? (
        <div className="text-center py-16 text-xs text-[#8EAA97]">Chưa có kỹ thuật viên nào trong hệ thống</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((staff) => {
            const shifts = staffSchedules[staff.id] || Array(7).fill('OFF');

            return (
              <TiltCard key={staff.id} maxTilt={6} cardClassName="rounded-2xl">
                <Card
                  onClick={() => handleOpenDetail(staff)}
                  className="h-full p-6 border border-[#E2E8E3] shadow-luxury hover:shadow-luxury-hover transition-all cursor-pointer space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-[#E8F5E9] text-[#1E3B2B] flex items-center justify-center font-display font-bold text-lg">
                        {staff.displayName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-base text-[#14271C]">
                          {staff.displayName}
                        </h3>
                        <p className="text-[11px] text-[#8EAA97]">
                          Kỹ thuật viên trị liệu · #{staff.id}
                        </p>
                      </div>
                    </div>

                    <Badge variant={staff.isActive ? 'success' : 'outline'}>
                      {staff.isActive ? '● Đang hoạt động' : '○ Tạm nghỉ'}
                    </Badge>
                  </div>

                  <div className="pt-3 border-t border-[#E2E8E3] space-y-2 text-xs text-[#526056]">
                    <div className="flex justify-between">
                      <span className="text-[#8EAA97]">Email:</span>
                      <span className="truncate max-w-[180px]">{staff.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8EAA97]">Lịch trực tuần này:</span>
                      <span className="font-semibold text-[#1E3B2B]">
                        {shifts.filter((s) => s !== 'OFF').length} / 7 ca
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenShiftEdit(staff);
                      }}
                      className="w-full text-xs h-8 rounded-xl border-[#D9E5DC] text-[#1E3B2B] hover:border-[#1E3B2B] cursor-pointer"
                    >
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      Phân ca 7 ngày
                    </Button>
                  </div>
                </Card>
              </TiltCard>
            );
          })}
        </div>
      )}

      {/* Staff Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        {selectedStaff && (
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white p-6 shadow-2xl border-l border-[#E2E8E3] overflow-y-auto space-y-6 font-body animate-in slide-in-from-right duration-200">
            <SheetHeader className="flex flex-row items-center justify-between pb-4 border-b border-[#E2E8E3]">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-[#E8F5E9] text-[#1E3B2B] flex items-center justify-center font-display font-bold text-lg">
                  {selectedStaff.displayName.charAt(0)}
                </div>
                <div>
                  <SheetTitle className="font-display text-xl text-[#14271C]">
                    {selectedStaff.displayName}
                  </SheetTitle>
                  <p className="text-xs text-[#8EAA97]">Kỹ thuật viên #{selectedStaff.id}</p>
                </div>
              </div>
              <SheetClose asChild>
                <button type="button" className="p-1 text-[#8EAA97] hover:text-[#14271C]">
                  <X className="h-5 w-5" />
                </button>
              </SheetClose>
            </SheetHeader>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#FAFBF9] border border-[#E2E8E3] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#8EAA97]">Email:</span>
                  <span className="font-semibold text-[#14271C]">{selectedStaff.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8EAA97]">Vai trò hệ thống:</span>
                  <span className="font-semibold text-[#1E3B2B]">{selectedStaff.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8EAA97]">Trạng thái:</span>
                  <Badge variant={selectedStaff.isActive ? 'success' : 'outline'}>
                    {selectedStaff.isActive ? '● Đang làm việc' : '○ Tạm khóa'}
                  </Badge>
                </div>
              </div>

              {/* Schedule display */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-[#14271C]">Ca trực các ngày trong tuần</Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenShiftEdit(selectedStaff)}
                    className="h-7 text-xs text-[#1E3B2B] hover:bg-[#E8F0EA] cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1" />
                    Chỉnh sửa
                  </Button>
                </div>

                <div className="divide-y divide-[#E2E8E3] border border-[#E2E8E3] rounded-2xl overflow-hidden bg-white">
                  {DAYS_OF_WEEK.map((day, idx) => {
                    const shift = (staffSchedules[selectedStaff.id] || [])[idx] || 'OFF';
                    return (
                      <div key={day} className="p-3 flex items-center justify-between text-xs">
                        <span className="font-medium text-[#14271C]">{day}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            shift === 'OFF'
                              ? 'bg-[#FCE8E6] text-[#BA1A1A]'
                              : 'bg-[#E8F5E9] text-[#2E7D32]'
                          }`}
                        >
                          {SHIFT_LABELS[shift]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </Sheet>

      {/* Shift Edit Modal */}
      <Dialog open={shiftModalOpen} onOpenChange={setShiftModalOpen}>
        {selectedStaff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 font-body">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-luxury border border-[#E2E8E3] animate-in fade-in zoom-in-95 space-y-4">
              <DialogHeader>
                <DialogTitle className="font-display text-xl text-[#14271C]">
                  Phân ca 7 ngày — {selectedStaff.displayName}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#6B726C]">
                  Cấu hình ca sáng, ca chiều, cả ngày hoặc ngày nghỉ (Day Off).
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 my-2 max-h-[350px] overflow-y-auto pr-1">
                {DAYS_OF_WEEK.map((day, idx) => (
                  <div
                    key={day}
                    className="p-3 rounded-xl bg-[#FAFBF9] border border-[#E2E8E3] flex items-center justify-between gap-2"
                  >
                    <span className="text-xs font-semibold text-[#14271C] w-20">{day}</span>
                    <div className="flex gap-1">
                      {(['FULL_DAY', 'MORNING', 'AFTERNOON', 'OFF'] as ShiftType[]).map((sh) => (
                        <button
                          key={sh}
                          type="button"
                          onClick={() => handleShiftSelect(idx, sh)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                            tempShifts[idx] === sh
                              ? 'bg-[#1E3B2B] text-white'
                              : 'bg-white border border-[#E2E8E3] text-[#526056] hover:border-[#1E3B2B]'
                          }`}
                        >
                          {sh === 'FULL_DAY' ? 'Cả ngày' : sh === 'MORNING' ? 'Sáng' : sh === 'AFTERNOON' ? 'Chiều' : 'Nghỉ'}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShiftModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveShifts}
                  className="rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs font-semibold"
                >
                  Lưu lịch ca trực
                </Button>
              </DialogFooter>
            </div>
          </div>
        )}
      </Dialog>

      {/* Add Staff Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 font-body">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-luxury border border-[#E2E8E3] animate-in fade-in zoom-in-95 space-y-4">
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-[#14271C]">
                Thêm chuyên viên trị liệu mới
              </DialogTitle>
              <DialogDescription className="text-xs text-[#6B726C]">
                Khởi tạo tài khoản KTV và phân bổ vào đội ngũ trị liệu Lunara.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddStaff} className="space-y-3.5 my-2">
              <div className="space-y-1">
                <Label className="text-xs">Họ và tên chuyên viên *</Label>
                <Input
                  placeholder="VD: Lê Thị Hồng..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Email công việc *</Label>
                <Input
                  type="email"
                  placeholder="hong.le@lunara.vn"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Chức danh *</Label>
                <Input value={formJobTitle} onChange={(e) => setFormJobTitle(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Dịch vụ có thể thực hiện *</Label>
                <div className="grid grid-cols-2 gap-2 max-h-28 overflow-y-auto">
                  {services.map((service) => <label key={service.id} className="text-xs flex gap-2 items-center"><input type="checkbox" checked={formServiceIds.includes(Number(service.id))} onChange={() => setFormServiceIds((current) => current.includes(Number(service.id)) ? current.filter((id) => id !== Number(service.id)) : [...current, Number(service.id)])} />{service.name}</label>)}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Ngày làm việc (09:00–18:00) *</Label>
                <div className="flex flex-wrap gap-3">{DAYS_OF_WEEK.map((day, index) => <label key={day} className="text-xs flex gap-1 items-center"><input type="checkbox" checked={formDays.includes(index + 1)} onChange={() => setFormDays((current) => current.includes(index + 1) ? current.filter((value) => value !== index + 1) : [...current, index + 1])} />{day}</label>)}</div>
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
                  Thêm vào đội ngũ
                </Button>
              </DialogFooter>
            </form>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
