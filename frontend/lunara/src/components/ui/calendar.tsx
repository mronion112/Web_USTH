import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  className?: string;
}

export const Calendar: React.FC<CalendarProps> = ({ selected, onSelect, className }) => {
  const [month, setMonth] = useState(() => new Date((selected || new Date()).getFullYear(), (selected || new Date()).getMonth(), 1));
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const lastDay = new Date(today); lastDay.setDate(lastDay.getDate() + 90);
  const days = Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i - offset + 1));
  const sameDay = (a?: Date, b?: Date) => !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const move = (delta: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  return (
    <div className={cn('p-4 bg-white rounded-2xl border border-[#E2E8E3] font-body', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-[#14271C] text-base">Tháng {month.getMonth() + 1}, {month.getFullYear()}</h3>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => move(-1)} disabled={month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth()} className="p-1.5 rounded-lg hover:bg-[#F8F9F5] disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" onClick={() => move(1)} disabled={month.getFullYear() === lastDay.getFullYear() && month.getMonth() === lastDay.getMonth()} className="p-1.5 rounded-lg hover:bg-[#F8F9F5] disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => <div key={day} className="text-xs font-semibold text-[#8EAA97] py-1">{day}</div>)}</div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((date, i) => {
          const current = date.getMonth() === month.getMonth();
          const enabled = current && date >= today && date <= lastDay;
          return <button key={i} type="button" disabled={!enabled} onClick={() => onSelect?.(date)} className={cn('h-9 w-9 mx-auto rounded-xl text-xs font-medium', !enabled && 'text-[#C2C8C1] opacity-40', enabled && 'hover:bg-[#F8F9F5]', sameDay(date, selected) && 'bg-[#1E3B2B] text-white font-bold')}>{date.getDate()}</button>;
        })}
      </div>
    </div>
  );
};
