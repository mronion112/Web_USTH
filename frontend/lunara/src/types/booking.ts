import { BookingStatus, AssignmentSource } from './enums';

export interface BookingItem {
  id: string;
  bookingId: string;
  serviceId: string;
  serviceNameSnapshot: string;
  durationMinutes: number;
  basePriceSnapshot: number;
  additionalDurationSteps: number;
  pricePerStepSnapshot: number;
  lineAmount: number;
}

export interface BookingEvent {
  id: string;
  bookingId: string;
  eventType: string;
  message: string;
  occurredAt: string;
}

export interface Booking {
  id: string;
  bookingCode: string;
  customerAccountId: string;
  staffAccountId?: string;
  staffName?: string;
  status: BookingStatus;
  assignmentSource: AssignmentSource;
  customerNameSnapshot: string;
  customerEmailSnapshot: string;
  customerPhoneSnapshot?: string;
  bookingStart: string;
  bookingEnd: string;
  customerNote?: string;
  totalDurationMinutes: number;
  totalAmount: number;
  items: BookingItem[];
  events?: BookingEvent[];
  paymentStatus?: 'PAID' | 'UNPAID' | 'REFUNDED' | 'FAILED';
  checkedInAt?: string;
  serviceStartedAt?: string;
  completedAt?: string;
}
