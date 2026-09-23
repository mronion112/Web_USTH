import React, { useEffect, useMemo, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { bookingsApi } from '@/lib/api';

const SLOT_TIMES = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00',
];

interface AvailabilitySlotPickerProps {
  items: { serviceId: number; durationMinutes: number }[];
  staffAccountId?: number;
  excludedBookingId?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function localDate(value?: string): Date {
  if (value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(12, 0, 0, 0);
  return tomorrow;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function nextHalfHour(date: Date): Date {
  const rounded = new Date(date);
  rounded.setSeconds(0, 0);
  const minutes = rounded.getMinutes();
  rounded.setMinutes(minutes === 0 || minutes === 30 ? minutes : minutes < 30 ? 30 : 60);
  return rounded;
}

export const AvailabilitySlotPicker: React.FC<AvailabilitySlotPickerProps> = ({
  items,
  staffAccountId,
  excludedBookingId,
  value,
  onChange,
  disabled = false,
}) => {
  const [selectedDate, setSelectedDate] = useState(() => localDate(value));
  const [availableTimes, setAvailableTimes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const itemsKey = useMemo(() => JSON.stringify(items), [items]);
  const selectedTime = value && value.slice(0, 10) === dateKey(selectedDate) ? value.slice(11, 16) : '';

  useEffect(() => {
    if (!value) return;
    const parsed = localDate(value);
    if (dateKey(parsed) !== dateKey(selectedDate)) setSelectedDate(parsed);
  }, [value]);

  useEffect(() => {
    if (disabled || items.length === 0) {
      setAvailableTimes(new Set());
      return;
    }

    const controller = new AbortController();
    const day = dateKey(selectedDate);
    const today = dateKey(new Date());
    const now = nextHalfHour(new Date());
    const from = day === today && dateKey(now) === day
      ? `${day}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`
      : `${day}T08:00:00`;

    setLoading(true);
    setError('');
    bookingsApi.getAvailability({
      from,
      to: `${day}T19:00:00`,
      items: JSON.parse(itemsKey),
      staffAccountId,
      excludedBookingId,
    }, controller.signal).then((response) => {
      setAvailableTimes(new Set(response.slots.map((slot) => slot.bookingStart.slice(11, 16))));
    }).catch((reason) => {
      if (!(reason instanceof DOMException && reason.name === 'AbortError')) {
        setAvailableTimes(new Set());
        setError(reason instanceof Error ? reason.message : 'Không tải được khung giờ khả dụng.');
      }
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });

    return () => controller.abort();
  }, [disabled, excludedBookingId, itemsKey, selectedDate, staffAccountId]);

  const selectDate = (date: Date) => {
    setSelectedDate(date);
    onChange('');
  };

  return (
    <div className="space-y-3">
      <Calendar selected={selectedDate} onSelect={selectDate} className={disabled ? 'pointer-events-none opacity-60' : ''} />
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs">Khung giờ khả dụng</Label>
          {loading && <span className="text-[11px] text-[#6B726C]">Đang kiểm tra…</span>}
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {SLOT_TIMES.map((time) => {
            const available = availableTimes.has(time);
            const selected = selectedTime === time;
            return (
              <button
                key={time}
                type="button"
                disabled={disabled || loading || !available}
                onClick={() => onChange(`${dateKey(selectedDate)}T${time}:00`)}
                className={`h-9 rounded-xl border text-xs font-semibold transition-colors ${selected
                  ? 'border-[#1E3B2B] bg-[#1E3B2B] text-white'
                  : available
                    ? 'cursor-pointer border-[#2E7D32]/40 bg-white text-[#2E7D32] hover:bg-[#E8F5E9]'
                    : 'cursor-not-allowed border-[#E0E0E0] bg-[#F5F5F3] text-[#A0A5A1] line-through'}`}
              >
                {time}
              </button>
            );
          })}
        </div>
        {error && <p className="text-xs text-red-700">{error}</p>}
        {!loading && !error && availableTimes.size === 0 && (
          <p className="text-xs text-[#6B726C]">Không còn khung giờ phù hợp trong ngày này.</p>
        )}
      </div>
    </div>
  );
};
