export interface Feedback {
  id: string;
  bookingId: string;
  rating: number; // 1 to 5
  comment?: string;
  createdAt: string;
}
