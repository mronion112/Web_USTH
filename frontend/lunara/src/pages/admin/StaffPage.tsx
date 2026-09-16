import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { MOCK_STAFF, StaffMember } from '@/data/mock-staff';
import { Plus, Edit2 } from 'lucide-react';
import { SlidingTabs } from '@/components/transitions/SlidingTabs';
import { TiltCard } from '@/components/transitions/TiltCard';

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
  const [staffList, setStaffList] = useState<StaffMember[]>(MOCK_STAFF);
  const [filterTab, setFilterTab] = useState<'ALL' | 'WORKING' | 'AVAILABLE' | 'LEAVE'>('ALL');
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Weekly shift state for each staff (staffId -> array of 7 ShiftType)
  const [staffSchedules, setStaffSchedules] = useState<Record<string, ShiftType[]>>({
    'acc-stf-1': ['FULL_DAY', 'FULL_DAY', 'FULL_DAY', 'OFF', 'FULL_DAY', 'FULL_DAY', 'MORNING'],
    'acc-stf-2': ['MORNING', 'FULL_DAY', 'OFF', 'FULL_DAY', 'AFTERNOON', 'FULL_DAY', 'FULL_DAY'],
    'acc-stf-3': ['FULL_DAY', 'OFF', 'FULL_DAY', 'FULL_DAY', 'FULL_DAY', 'FULL_DAY', 'OFF'],
    'acc-stf-4': ['OFF', 'FULL_DAY', 'FULL_DAY', 'FULL_DAY', 'FULL_DAY', 'MORNING', 'OFF'],
    'acc-stf-5': ['FULL_DAY', 'FULL_DAY', 'OFF', 'MORNING', 'FULL_DAY', 'FULL_DAY', 'FULL_DAY'],
  });

  // Shift editing temporary state
  const [tempShifts, setTempShifts] = useState<ShiftType[]>([]);

  // Add Staff Form State
  const [formName, setFormName] = useState('');
  const [formTitle, setFormTitle] = useState('Massage Therapist');
  const [formEmail, setFormEmail] = useState('');
  const [formCode, setFormCode] = useState(`LNR-EMP-0${MOCK_STAFF.length + 1}`);
  const [formSpecialties, setFormSpecialties] = useState('Massage, Trị Liệu');

  const filteredStaff = staffList.filter((s) => {
    if (filterTab === 'AVAILABLE') return s.profile.status === 'Available';
    if (filterTab === 'LEAVE') return s.profile.status === 'Day off';
    if (filterTab === 'WORKING') return s.profile.status !== 'Day off';
    return true;
  });

  // Dynamic counts for tabs
  const countWorking = staffList.filter((s) => s.profile.status !== 'Day off').length;
  const countAvailable = staffList.filter((s) => s.profile.status === 'Available').length;
  const countLeave = staffList.filter((s) => s.profile.status === 'Day off').length;

  const handleOpenDetail = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setDetailOpen(true);
  };

  const handleOpenShiftModal = () => {
    if (!selectedStaff) return;
    const currentSchedule = staffSchedules[selectedStaff.account.id] || [
      'FULL_DAY',
      'FULL_DAY',
      'FULL_DAY',
      'OFF',
      'FULL_DAY',
      'FULL_DAY',
      'MORNING',
    ];
    setTempShifts([...currentSchedule]);
    setShiftModalOpen(true);
  };

  const handleSaveShifts = () => {
    if (!selectedStaff) return;
    setStaffSchedules((prev) => ({
      ...prev,
      [selectedStaff.account.id]: tempShifts,
    }));
    setShiftModalOpen(false);
    setSuccessMsg(`Đã cập nhật ca làm việc 7 ngày cho ${selectedStaff.account.displayName}`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const newId = `acc-stf-${Date.now()}`;
    const newMember: StaffMember = {
      account: {
        id: newId,
        roleId: 'r-therapist',
        roleCode: 'THERAPIST',
        email: formEmail || `${formCode.toLowerCase()}@lunara.vn`,
        displayName: formName,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        isActive: true,
      },
      profile: {
        accountId: newId,
        employeeCode: formCode,
        jobTitle: formTitle,
        isBookable: true,
        specialties: formSpecialties.split(',').map((s) => s.trim()),
        status: 'Available',
        todayBookings: 0,
        utilizationRate: 0,
      },
    };

    setStaffList([...staffList, newMember]);
    setStaffSchedules((prev) => ({
      ...prev,
      [newId]: ['FULL_DAY', 'FULL_DAY', 'FULL_DAY', 'FULL_DAY', 'FULL_DAY', 'OFF', 'OFF'],
    }));

    setAddModalOpen(false);
    setSuccessMsg(`Đã thêm thành công kỹ thuật viên ${formName} vào đội ngũ`);
    setTimeout(() => setSuccessMsg(''), 4000);

    // Reset Form
    setFormName('');
    setFormEmail('');
  };

  return (
    <div className="space-y-6 font-body max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#14271C]">
            Quản lý kỹ thuật viên
          </h1>
          <p className="text-xs text-[#6B726C] mt-1">
            Đội ngũ chuyên viên trị liệu & điều phối lịch trực ({staffList.length} nhân sự)
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
            { key: 'WORKING', label: `Làm việc hôm nay (${countWorking})` },
            { key: 'AVAILABLE', label: `Đang rảnh (${countAvailable})` },
            { key: 'LEAVE', label: `Nghỉ ca (${countLeave})` },
          ]}
        />
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((staff) => {
          const isAvailable = staff.profile.status === 'Available';
          const isOff = staff.profile.status === 'Day off';

          return (
            <TiltCard key={staff.account.id} maxTilt={6} cardClassName="rounded-2xl">
              <Card
                onClick={() => handleOpenDetail(staff)}
                className="h-full p-6 border border-[#E2E8E3] shadow-luxury hover:shadow-luxury-hover transition-all cursor-pointer space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={staff.account.avatarUrl}
                      alt={staff.account.displayName}
                      className="h-12 w-12 rounded-full object-cover border border-[#D9E5DC]"
                    />
                    <div>
                      <h3 className="font-display font-semibold text-base text-[#14271C]">
                        {staff.account.displayName}
                      </h3>
                      <p className="text-xs text-[#8EAA97]">{staff.profile.jobTitle}</p>
                    </div>
                  </div>

                  <Badge
                    variant={isAvailable ? 'success' : isOff ? 'outline' : 'warning'}
                  >
                    {isAvailable ? '● Đang rảnh' : isOff ? '○ Nghỉ ca' : '● Đang phục vụ'}
                  </Badge>
                </div>

                {/* Specialties */}
                <div className="flex flex-wrap gap-1.5">
                  {staff.profile.specialties.map((spec, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-[#F8F9F5] border border-[#E2E8E3] px-2.5 py-0.5 text-[10px] font-medium text-[#526056]"
                    >
                      {spec}
                    </span>
                  ))}
                </div>

                {/* Utilization Rate */}
                <div className="space-y-1.5 pt-2 border-t border-[#E2E8E3]">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#526056]">Hiệu suất ca</span>
                    <span className="text-[#1E3B2B]">{staff.profile.utilizationRate}%</span>
                  </div>
                  <Progress value={staff.profile.utilizationRate} />
                  <div className="flex justify-between text-[11px] text-[#8EAA97]">
                    <span>{staff.profile.todayBookings} ca đã nhận</span>
                    <span>Mã NV: {staff.profile.employeeCode}</span>
                  </div>
                </div>
              </Card>
            </TiltCard>
          );
        })}
      </div>

      {/* Staff Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        {selectedStaff && (
          <div className="space-y-6">
            <SheetHeader>
              <div className="flex items-center justify-between">
                <SheetTitle>Hồ sơ kỹ thuật viên</SheetTitle>
                <SheetClose onClick={() => setDetailOpen(false)} />
              </div>
            </SheetHeader>

            <div className="flex items-center gap-4 pb-4 border-b border-[#E2E8E3]">
              <img
                src={selectedStaff.account.avatarUrl}
                alt={selectedStaff.account.displayName}
                className="h-16 w-16 rounded-2xl object-cover border border-[#D9E5DC]"
              />
              <div>
                <h3 className="font-display font-bold text-lg text-[#14271C]">
                  {selectedStaff.account.displayName}
                </h3>
                <p className="text-xs text-[#8EAA97]">{selectedStaff.profile.jobTitle}</p>
                <p className="text-xs text-[#526056]">{selectedStaff.account.email}</p>
              </div>
            </div>

            {/* Weekly Working Schedule Table */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-[#8EAA97]">
                  Lịch làm việc trong tuần (Thứ 2 — CN)
                </span>
                <button
                  onClick={handleOpenShiftModal}
                  className="text-xs font-semibold text-[#1E3B2B] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Sửa ca
                </button>
              </div>

              <div className="divide-y divide-[#E2E8E3] rounded-xl border border-[#E2E8E3] overflow-hidden bg-white">
                {DAYS_OF_WEEK.map((day, idx) => {
                  const schedule = staffSchedules[selectedStaff.account.id] || [];
                  const shiftType = schedule[idx] || 'FULL_DAY';
                  const isOff = shiftType === 'OFF';

                  return (
                    <div key={day} className="flex justify-between items-center p-3 text-xs">
                      <span className="font-medium text-[#14271C]">{day}</span>
                      <span
                        className={`font-semibold ${
                          isOff ? 'text-[#D32F2F]' : 'text-[#2E7D32]'
                        }`}
                      >
                        {SHIFT_LABELS[shiftType]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-[#E2E8E3] space-y-2">
              <Button
                onClick={handleOpenShiftModal}
                className="w-full text-xs h-11 bg-[#1E3B2B] text-white hover:bg-[#14271C] font-semibold"
              >
                Cập nhật ca làm việc
              </Button>
            </div>
          </div>
        )}
      </Sheet>

      {/* Modal Cập Nhật Ca Làm Việc */}
      <Dialog open={shiftModalOpen} onOpenChange={setShiftModalOpen}>
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle>
              Cập nhật ca làm việc: {selectedStaff?.account.displayName}
            </DialogTitle>
            <DialogDescription>
              Cấu hình phân ca trực hoặc ngày nghỉ cho từng ngày trong tuần
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 text-xs max-h-96 overflow-y-auto pr-1">
            {DAYS_OF_WEEK.map((day, idx) => (
              <div
                key={day}
                className="flex items-center justify-between p-2.5 rounded-xl border border-[#E2E8E3] bg-[#F8F9F5]"
              >
                <span className="font-semibold text-[#14271C] w-24">{day}</span>
                <select
                  value={tempShifts[idx] || 'FULL_DAY'}
                  onChange={(e) => {
                    const newShifts = [...tempShifts];
                    newShifts[idx] = e.target.value as ShiftType;
                    setTempShifts(newShifts);
                  }}
                  className="flex-1 h-9 px-3 rounded-lg border border-[#E2E8E3] bg-white text-xs font-medium text-[#14271C]"
                >
                  <option value="FULL_DAY">Cả ngày (09:00 — 18:00)</option>
                  <option value="MORNING">Ca sáng (08:30 — 14:30)</option>
                  <option value="AFTERNOON">Ca chiều (14:00 — 20:00)</option>
                  <option value="OFF">NGHỈ CA (Day Off)</option>
                </select>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShiftModalOpen(false)}
              className="text-xs h-10"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleSaveShifts}
              className="bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs h-10 px-4 font-semibold"
            >
              Lưu ca làm việc
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Modal Thêm Chuyên Viên Mới */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <form onSubmit={handleAddStaff} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Thêm chuyên viên mới</DialogTitle>
            <DialogDescription>
              Đăng ký kỹ thuật viên mới vào hệ thống nhân sự Lunara Spa
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <Label>Họ và tên chuyên viên *</Label>
              <Input
                required
                placeholder="Ví dụ: Hoàng Ngọc Yến"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="h-10 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Vị trí / Chức danh</Label>
                <select
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E2E8E3] bg-white text-xs"
                >
                  <option value="Senior Therapist">Senior Therapist (KTV Cấp Cao)</option>
                  <option value="Facial Specialist">Facial Specialist (Chuyên Da Mặt)</option>
                  <option value="Therapist">Therapist (Kỹ Thuật Viên)</option>
                  <option value="Junior Therapist">Junior Therapist (KTV Tập Sự)</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label>Mã nhân viên</Label>
                <Input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="h-10 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="chuyenvien@lunara.vn"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="h-10 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label>Chuyên môn chính (cách nhau bởi dấu phẩy)</Label>
              <Input
                placeholder="Massage, Chăm Sóc Da, Đá Nóng Himalaya"
                value={formSpecialties}
                onChange={(e) => setFormSpecialties(e.target.value)}
                className="h-10 text-xs"
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
              Xác nhận thêm
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
};
