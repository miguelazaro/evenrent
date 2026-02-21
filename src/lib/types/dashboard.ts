export interface UpcomingRental {
  id: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed';
  clientName: string;
  eventType: string;
  deliveryDate: Date;
  items: string;
}

export interface KPIMetric {
  label: string;
  value: number | string;
  subtext?: string;
  variant?: 'default' | 'warning' | 'success';
}
