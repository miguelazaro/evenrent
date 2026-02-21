import { UpcomingRental } from '@/lib/types/dashboard';

export const mockUpcomingRentals: UpcomingRental[] = [
  {
    id: '1',
    status: 'confirmed',
    clientName: 'Familia Orozco',
    eventType: 'Boda - Sillas Tiffany x200',
    deliveryDate: new Date('2026-01-30'),
    items: 'Sillas Tiffany x200, Mesa presidencial, Decoración floral',
  },
  {
    id: '2',
    status: 'pending',
    clientName: 'Corporativo AXION',
    eventType: 'Conferencia - Setup Audio/Video',
    deliveryDate: new Date('2026-01-29'),
    items: 'Proyectores x3, Pantallas LED, Sistema de sonido',
  },
  {
    id: '3',
    status: 'in-progress',
    clientName: 'Eventos Delgado',
    eventType: 'Quinceanera - Decoración completa',
    deliveryDate: new Date('2026-02-01'),
    items: 'Mesas redondas x15, Sillas x150, Decoración temática',
  },
  {
    id: '4',
    status: 'confirmed',
    clientName: 'Grupo Empresarial Tech',
    eventType: 'Team Building - Equipo deportivo',
    deliveryDate: new Date('2026-02-05'),
    items: 'Balones x20, Conos, Redes, Mochilas de evento',
  },
  {
    id: '5',
    status: 'pending',
    clientName: 'Familia González',
    eventType: 'Bautizo - Mobiliario infantil',
    deliveryDate: new Date('2026-02-10'),
    items: 'Mesas pequeñas x8, Sillas infantiles x40, Decoración pastel',
  },
];

export const mockKPIData = {
  todayEvents: 3,
  pendingDeliveries: 12,
  pickups: 5,
  monthlyRevenue: '$145,000 MXN',
};
