import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { MOCK_STAFF, StaffMember } from '@/data/mock-staff';
import { Plus, User, Clock, Calendar, CheckCircle2, ShieldAlert } from 'lucide-react';

export const StaffPage: React.FC = () => {
  const [filterTab, setFilterTab] = useState<'ALL' | 'WORKING' | 'AVAILABLE' | 'LEAVE'>('ALL');
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filteredStaff = MOCK_STAFF.filter((s) => {
    if (filterTab === 'AVAILABLE') return s.profile.status === 'Available';
    if (filterTab === 'LEAVE') return s.profile.status === 'Day off';
    if (filterTab === 'WORKING') return s.profile.status !== 'Day off';
    return true;
  });

  const handleOpenDetail = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setDetailOpen(true);
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
            Đội ngũ chuyên viên trị liệu & điều phối lịch trực
          </p>
        </div>

        <Button className="rounded-xl bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs h-11 px-5">
          <Plus className="h-4 w-4 mr-1.5 text-[#C5A880]" />
          Thêm chuyên viên mới
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'ALL', label: 'Tất cả (5)' },
          { key: 'WORKING', label: 'Làm việc hôm nay (4)' },
          { key: 'AVAILABLE', label: 'Đang rảnh (3)' },
          { key: 'LEAVE', label: 'Nghỉ ca (1)' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterTab(tab.key as any)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              filterTab === tab.key
                ? 'bg-[#1E3B2B] text-white shadow-sm'
                : 'bg-white text-[#526056] border border-[#E2E8E3] hover:border-[#1E3B2B]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((staff) => {
          const isAvailable = staff.profile.status === 'Available';
          const isOff = staff.profile.status === 'Day off';

          return (
            <Card
              key={staff.account.id}
              onClick={() => handleOpenDetail(staff)}
              className="p-6 border border-[#E2E8E3] shadow-luxury hover:shadow-luxury-hover transition-all cursor-pointer space-y-4"
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

              {/* Utilization Progress Bar */}
              <div className="space-y-1.5 pt-2 border-t border-[#E2E8E3]/60">
                <div className="flex justify-between text-xs">
                  <span className="text-[#6B726C]">Công suất ca hôm nay:</span>
                  <span className="font-bold text-[#14271C]">{staff.profile.utilizationRate}%</span>
                </div>
                <Progress value={staff.profile.utilizationRate} />
                <div className="flex justify-between text-[11px] text-[#8EAA97]">
                  <span>{staff.profile.todayBookings} ca đã nhận</span>
                  <span>Mã NV: {staff.profile.employeeCode}</span>
                </div>
              </div>
            </Card>
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
              <span className="font-bold uppercase tracking-wider text-[#8EAA97]">
                Lịch làm việc trong tuần (Mon - Sun)
              </span>

              <div className="divide-y divide-[#E2E8E3] rounded-xl border border-[#E2E8E3] overflow-hidden bg-white">
                {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'].map((day, idx) => (
                  <div key={day} className="flex justify-between p-3">
                    <span className="font-medium text-[#14271C]">{day}</span>
                    <span className={idx === 3 ? 'text-[#D32F2F] font-semibold' : 'text-[#2E7D32]'}>
                      {idx === 3 ? 'NGHỈ CA (Day Off)' : '09:00 — 18:00 (Đang trực)'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-[#E2E8E3] space-y-2">
              <Button variant="outline" className="w-full text-xs h-10">
                <Clock className="h-4 w-4 mr-1.5" /> Khóa ca tạm thời (Block Time)
              </Button>
              <Button className="w-full text-xs h-10 bg-[#1E3B2B] text-white">
                Cập nhật lịch làm việc
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
};
