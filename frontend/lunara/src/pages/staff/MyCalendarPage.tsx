import React, { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api, ApiBooking, events } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const spaDate = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value || '';
  return `${value('year')}-${value('month')}-${value('day')}`;
};
const spaTime = (value: string) => new Date(value).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' });

export const MyCalendarPage: React.FC = () => {
  const { user } = useAuth();
  const [date, setDate] = useState(() => new Date());
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [error, setError] = useState('');
  const reload = useCallback(() => { void api<ApiBooking[]>(`/api/v1/admin/bookings?date=${spaDate(date)}`).then(setBookings).catch((e) => setError(e.message)); }, [date]);
  useEffect(() => { reload(); const source = events(); source.addEventListener('booking.events', reload); const poll = window.setInterval(reload, 10000); return () => { source.close(); window.clearInterval(poll); }; }, [reload]);
  const move = (days: number) => setDate((current) => { const next = new Date(current); next.setDate(next.getDate() + days); return next; });
  return <div className="space-y-6 font-body max-w-4xl mx-auto">
    <div className="flex items-center justify-between border-b border-[#E2E8E3] pb-6">
      <div><span className="text-[10px] font-bold uppercase tracking-widest text-[#8EAA97]">Lịch cá nhân KTV</span><h1 className="font-display text-3xl font-semibold text-[#14271C]">Lịch của tôi</h1><p className="text-xs text-[#6B726C] mt-1">Kỹ thuật viên: <strong>{user?.displayName || '—'}</strong></p></div>
      <div className="flex items-center bg-white border border-[#E2E8E3] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#14271C]"><button onClick={() => move(-1)} aria-label="Ngày trước" className="p-1"><ChevronLeft className="h-4 w-4" /></button><span className="px-3">{date.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</span><button onClick={() => move(1)} aria-label="Ngày sau" className="p-1"><ChevronRight className="h-4 w-4" /></button></div>
    </div>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <Card className="p-6 shadow-luxury"><div className="divide-y divide-[#E2E8E3]">{bookings.length ? bookings.map((booking) => <div key={booking.id} className="py-4 flex items-start gap-4"><div className="w-36 shrink-0"><span className="font-mono font-bold text-xs text-[#1E3B2B] bg-[#E8F5E9] px-2.5 py-1 rounded-md inline-block">{spaTime(booking.bookingStart)} — {spaTime(booking.bookingEnd)}</span></div><div className="flex-1"><h4 className="text-sm font-semibold text-[#14271C]">{booking.items.map((item) => item.serviceNameSnapshot).join(', ')}</h4><p className="text-xs text-[#526056] mt-0.5">Khách: {booking.customerNameSnapshot} · {booking.bookingCode}</p></div><span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32]">{booking.status}</span></div>) : <p className="py-4 text-sm text-[#526056]">Không có lịch hẹn trong ngày.</p>}</div></Card>
  </div>;
};
