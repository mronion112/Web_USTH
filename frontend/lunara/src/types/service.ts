export interface Service {
  id: string;
  name: string;
  category: 'Massage' | 'Facial' | 'Body Care' | 'VIP Package';
  description: string;
  imageUrl: string;
  basePrice: number;
  minimumDurationMinutes: number;
  isDurationAdjustable: boolean;
  durationStepMinutes?: number;
  pricePerDurationStep?: number;
  preparationBufferMinutes: number;
  cleanupBufferMinutes: number;
  displayOrder: number;
  isActive: boolean;
}
