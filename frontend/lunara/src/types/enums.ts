export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'IN_SERVICE'
  | 'COMPLETED';

export type PaymentStatus = 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'QR' | 'CARD' | 'AT_SPA';
export type AssignmentSource = 'SYSTEM' | 'CUSTOMER' | 'ADMIN';
export type RoleCode = 'OWNER' | 'MANAGER' | 'RECEPTIONIST' | 'THERAPIST' | 'ACCOUNTANT' | 'CUSTOMER';
