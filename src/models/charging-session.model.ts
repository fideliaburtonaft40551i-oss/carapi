export interface ChargingSession {
  id: number;
  startTime: Date;
  endTime?: Date;
  startEmployeeId: string;
  endEmployeeId?: string;
  station: string;
  platform: number;
  vehicleType: string;
  vehicleImageUrl?: string;
  screenImageUrl?: string;
  kwh?: number;
  durationMinutes?: number;
  amount: number;
  paymentMethod?: 'cash' | 'card' | 'transfer';
  status: 'active' | 'completed';
}