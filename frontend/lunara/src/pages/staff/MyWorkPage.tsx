import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, CheckCircle2, User, Sparkles, Calendar } from 'lucide-react';
import { api, ApiBooking, events } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export const MyWorkPage: React.FC = () => {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'IN_SERVICE' | 'CHECKED_IN' | 'COMPLETED'>('ALL');
  const [tasks, setTasks] = useState<ApiBooking[]>([]);
  const [error, setError] = useState('');
  const reload = useCallback(() => {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const value = (type: string) => parts.find((part) => part.type === type)?.value || '';
    const date = `${value('year')}-${value('month')}-${value('day')}`;
    void api<ApiBooking[]>(`/api/v1/admin/bookings?date=${date}`).then(setTasks).catch((e) => setError(e.message));
  }, []);
  useEffect(() => { reload(); const source = events(); source.addEventListener('booking.events', reload); const poll = window.setInterval(reload, 10000); return () => { source.close(); window.clearInterval(poll); }; }, [reload]);
  const transition = async (task: ApiBooking, action: 'start' | 'complete') => {
    try { await api(`/api/v1/bookings/${task.bookingCode}/${action}`, { method: 'POST' }); setError(''); reload(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không cập nhật được dịch vụ'); }
  };
  const time = (value: string) => new Date(value).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' });

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
            Chuyên viên: <strong className="text-[#14271C]">{user?.displayName || '—'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-[#E2E8E3] px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#1E3B2B]">
          <Calendar className="h-4 w-4 text-[#8EAA97]" />
          <span>Hôm nay · {new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</span>
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

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
                  {time(task.bookingStart)} — {time(task.bookingEnd)}
                </span>
                <span className="text-xs text-[#8EAA97]">({task.totalDurationMinutes} phút)</span>
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
                {task.items.map((item) => item.serviceNameSnapshot).join(', ')}
              </h3>
              <div className="flex items-center gap-4 text-xs text-[#526056]">
                <span className="flex items-center gap-1 font-medium">
                  <User className="h-3.5 w-3.5 text-[#8EAA97]" /> Khách hàng: {task.customerNameSnapshot}
                </span>
                <span>ĐT: {task.customerPhoneSnapshot || '—'}</span>
              </div>
            </div>

            {/* Actions for Therapist */}
            <div className="pt-2 flex items-center justify-end gap-3">
              {task.status === 'CHECKED_IN' && (
                <Button
                  onClick={() => void transition(task, 'start')}
                  className="rounded-xl h-11 px-6 bg-[#1E3B2B] text-white hover:bg-[#14271C] text-xs font-semibold shadow-sm"
                >
                  <Play className="h-3.5 w-3.5 mr-1.5 text-[#C5A880]" />
                  Bắt đầu dịch vụ
                </Button>
              )}

              {task.status === 'IN_SERVICE' && (
                <Button
                  onClick={() => void transition(task, 'complete')}
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
