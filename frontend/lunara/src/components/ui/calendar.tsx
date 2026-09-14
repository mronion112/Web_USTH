import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  className?: string;
}

export const Calendar: React.FC<CalendarProps> = ({
  selected = new Date(2026, 8, 14),
  onSelect,
  className,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 8, 1)); // September 2026

  const daysOfWeek = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  
  // September 2026 starts on Tuesday (index 1 if Monday=0)
  // 30 days in September
  const daysInMonth = 30;
  const startDayOffset = 1; // Tuesday

  const prevMonthDays = 31;
  const calendarCells = [];

  // Previous month trailing days
  for (let i = startDayOffset - 1; i >= 0; i--) {
    calendarCells.push({
      day: prevMonthDays - i,
      isCurrentMonth: false,
      date: new Date(2026, 7, prevMonthDays - i),
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({
      day: d,
      isCurrentMonth: true,
      date: new Date(2026, 8, d),
    });
  }

  // Next month leading days to complete grid
  const remaining = 35 - calendarCells.length;
  for (let d = 1; d <= remaining; d++) {
    calendarCells.push({
      day: d,
      isCurrentMonth: false,
      date: new Date(2026, 9, d),
    });
  }

  const isSameDay = (d1?: Date, d2?: Date) => {
    if (!d1 || !d2) return false;
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  return (
    <div className={cn("p-4 bg-white rounded-2xl border border-[#E2E8E3] font-body", className)}>
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-[#14271C] text-base">
          Tháng 9, 2026
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-1.5 rounded-lg hover:bg-[#F8F9F5] text-[#526056] cursor-pointer"
            onClick={() => {}}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="p-1.5 rounded-lg hover:bg-[#F8F9F5] text-[#526056] cursor-pointer"
            onClick={() => {}}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Days of Week */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-xs font-semibold text-[#8EAA97] py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {calendarCells.map((cell, idx) => {
          const selectedState = isSameDay(cell.date, selected);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (cell.isCurrentMonth && onSelect) {
                  onSelect(cell.date);
                }
              }}
              disabled={!cell.isCurrentMonth}
              className={cn(
                "h-9 w-9 mx-auto flex items-center justify-center rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer",
                !cell.isCurrentMonth && "text-[#C2C8C1] opacity-40 cursor-default",
                cell.isCurrentMonth && !selectedState && "text-[#14271C] hover:bg-[#F8F9F5] hover:text-[#1E3B2B]",
                selectedState && "bg-[#1E3B2B] text-white font-bold shadow-sm"
              )}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
};
