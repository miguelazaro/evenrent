'use client';

import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface UpcomingRentalsTableProps {
  data: any[];
  isLoading?: boolean;
}

export function UpcomingRentalsTable({ data, isLoading }: UpcomingRentalsTableProps) {
  const router = useRouter();

  // 1. Función para formatear 
  const formatDate = (dateValue: any) => {
    if (!dateValue) return '';
    try {
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      return format(date, "eee, d MMM", { locale: es });
    } catch (e) {
      return String(dateValue);
    }
  };

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || '';
    
    if (normalizedStatus.includes('confirm') || normalizedStatus === 'confirmed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          Confirmado
        </span>
      );
    }
    if (normalizedStatus.includes('pending') || normalizedStatus === 'pending') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          Pendiente
        </span>
      );
    }
    if (normalizedStatus.includes('progress') || normalizedStatus === 'in_progress') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          En Progreso
        </span>
      );
    }
    if (normalizedStatus === 'completed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
          Completado
        </span>
      );
    }
    if (normalizedStatus === 'cancelled') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
          Cancelado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-600">
        {status}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-zinc-200/60 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-zinc-50/50 border-b border-zinc-200/60 hover:bg-zinc-50/50">
            <TableHead className="text-xs uppercase tracking-wider font-semibold text-zinc-500 py-4">Estatus</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold text-zinc-500">Cliente</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold text-zinc-500">Evento</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold text-zinc-500">Fecha Entrega</TableHead>
            <TableHead className="text-xs uppercase tracking-wider font-semibold text-zinc-500">Items</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-0">
                <TableCell className="py-4"><Skeleton className="h-6 w-24 rounded-md" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-36" /></TableCell>
              </TableRow>
            ))
          ) : data.map((rental, index) => (
            <TableRow
              key={rental.id || index}
              className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/40 transition-colors cursor-pointer"
              onClick={() => rental.id && router.push(`/eventos/${rental.id}`)}
            >
              <TableCell className="py-4">
                {getStatusBadge(rental.status)}
              </TableCell>
              
              <TableCell className="font-semibold text-zinc-900">
                {rental.client || rental.customer || rental.clientName}
              </TableCell>
              
              <TableCell className="text-zinc-600">
                {rental.event || rental.eventName || rental.title || rental.type || 'Evento General'}
              </TableCell>
              
              <TableCell className="capitalize text-zinc-500 font-medium text-sm">
                {formatDate(rental.date || rental.deliveryDate || rental.startDate)}
              </TableCell>
              
              <TableCell className="text-zinc-500 text-sm">
                {rental.items || rental.equipment}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}