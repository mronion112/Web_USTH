import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, CheckCircle2, User, Sparkles, Calendar } from 'lucide-react';

interface WorkTask {
  id: string;
  timeRange: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  durationMinutes: number;
  note?: string;
  status: 'UPCOMING' | 'CHECKED_IN' | 'IN_SERVICE' | 'COMPLETED';
}

export const MyWorkPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'IN_SERVICE' | 'CHECKED_IN' | 'COMPLETED'>('ALL');

  const [tasks, setTasks] = useState<WorkTask[]>([
    {
      id: 'TASK-01',
      timeRange: '10:00 — 11:30',
      customerName: 'Hoàng Kim Ngân',
      customerPhone: '0933 889 900',
      serviceName: 'Gói VIP Thư Thái Toàn Thân',
      durationMinutes: 90,
      note: 'Phòng VIP Suite 01. Trà hoa cúc sau dịch vụ.',
      status: 'COMPLETED',
    },
    {
      id: 'TASK-02',
      timeRange: '14:00 — 15:00',
      customerName: 'Nguyễn Văn An',
      customerPhone: '0912 345 678',
      serviceName: 'Massage Thư Giãn Thảo Mộc',
      durationMinutes: 60,
      note: 'Tập trung vùng vai gáy, lực vừa phải.',
      status: 'IN_SERVICE',
    },
    {
      id: 'TASK-03',
      timeRange: '15:30 — 16:30',
      customerName: 'Lê Minh Châu',
      customerPhone: '0904 112 233',
      serviceName: 'Chăm Sóc Da Mặt Chuyên Sâu',
      durationMinutes: 60,
      note: 'Khách có da nhạy cảm với cồn.',
      status: 'CHECKED_IN',
    },
    {
      id: 'TASK-04',
      timeRange: '17:00 — 18:00',
      customerName: 'Trần Thị Hằng',
      customerPhone: '0988 123 456',
      serviceName: 'Đá Nóng Himalaya',
      durationMinutes: 60,
      status: 'UPCOMING',
    },
  ]);

  const handleStartService = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'IN_SERVICE' } : t))
    );
  };

  const handleCompleteService = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'COMPLETED' } : t))
    );
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeFilter === 'ALL') return true;
    return t.status === activeFilter;
  });

  return (
    <div className="space-y-6 font-body max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8E3] pb-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#8EAA97]">
            Cổng Kỹ Thuật Viên
          </span>
          <h1 className="font-display text-3xl font-semibold text-[#14271C]">
            Công việc hôm nay
          </h1>
          <p className="text-xs text-[#6B726C] mt-1">
            Chuyên viên: <strong className="text-[#14271C]">Nguyễn Thị Linh</strong> · Ca trực: 09:00 — 18:00
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-[#E2E8E3] px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#1E3B2B]">
          <Calendar className="h-4 w-4 text-[#8EAA97]" />
          <span>Hôm nay · 14/09/2026</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'ALL', label: `Tất cả (${tasks.length})` },
          { key: 'IN_SERVICE', label: 'Đang thực hiện' },
          { key: 'CHECKED_IN', label: 'Khách đã đến' },
          { key: 'COMPLETED', label: 'Đã xong' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key as any)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === tab.key
                ? 'bg-[#1E3B2B] text-white shadow-sm'
                : 'bg-white text-[#526056] border border-[#E2E8E3] hover:border-[#1E3B2B]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks Queue Cards */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <Card key={task.id} className="p-6 border border-[#E2E8E3] shadow-luxury space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8E3] pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-[#1E3B2B] bg-[#E8F5E9] px-2.5 py-1 rounded-lg">
                  {task.timeRange}
                </span>
                <span className="text-xs text-[#8EAA97]">({task.durationMinutes} phút)</span>
              </div>

              <Badge
                variant={
                  task.status === 'IN_SERVICE'
                    ? 'default'
                    : task.status === 'CHECKED_IN'
                    ? 'secondary'
                    : task.status === 'COMPLETED'
                    ? 'success'
                    : 'outline'
                }
              >
                {task.status === 'IN_SERVICE'
                  ? '● ĐANG THỰC HIỆN LIỆU TRÌNH'
                  : task.status === 'CHECKED_IN'
                  ? '● KHÁCH ĐÃ CHECK-IN'
                  : task.status === 'COMPLETED'
                  ? '✓ ĐÃ HOÀN THÀNH'
                  : '○ CHƯA ĐẾN'}
              </Badge>
            </div>

            <div className="space-y-1">
              <h3 className="font-display font-semibold text-xl text-[#14271C]">
                {task.serviceName}
              </h3>
              <div className="flex items-center gap-4 text-xs text-[#526056]">
                <span className="flex items-center gap-1 font-medium">
                  <User className="h-3.5 w-3.5 text-[#8EAA97]" /> Khách hàng: {task.customerName}
                </span>
                <span>ĐT: {task.customerPhone}</span>
              </div>
            </div>

            {task.note && (
              <div className="rounded-xl bg-[#F8F9F5] p-3 text-xs text-[#526056] border border-[#E2E8E3]/60">
                <strong className="text-[#14271C]">Lưu ý:</strong> {task.note}
              </div>
            )}

            {/* Actions for Therapist */}
            <div className="pt-2 flex items-center justify-end gap-3">
              {task.status === 'CHECKED_IN' && (
                <Button
                  onClick={() => handleStartService(task.id)}
                  className="rounded-xl h-11 px-6 bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs font-semibold shadow-sm"
                >
                  <Play className="h-3.5 w-3.5 mr-1.5 text-[#C5A880]" />
                  Bắt đầu dịch vụ
                </Button>
              )}

              {task.status === 'IN_SERVICE' && (
                <Button
                  onClick={() => handleCompleteService(task.id)}
                  className="rounded-xl h-11 px-6 bg-[#2E7D32] text-white hover:bg-[#1b5e20] text-xs font-semibold shadow-sm"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  Xác nhận hoàn thành dịch vụ
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
