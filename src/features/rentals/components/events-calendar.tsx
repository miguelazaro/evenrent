'use client';

import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { EditEventDialog } from './index';

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  CONFIRMED: { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  PENDING: { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
  IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  COMPLETED: { bg: 'bg-zinc-100', text: 'text-zinc-600', dot: 'bg-zinc-400' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-400' },
};

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function EventsCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingEvent, setEditingEvent] = useState<any>(null);

  const { data } = trpc.rental.getAll.useQuery({ limit: 200 });
  const rentals = data?.rentals || [];

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);
  const eventsByDay = useMemo(() => {
    const map: Record<string, typeof rentals> = {};
    rentals.forEach((rental) => {
      const key = format(new Date(rental.deliveryDate), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(rental);
    });
    return map;
  }, [rentals]);

  const today = new Date();

  return (
    <div className="bg-white rounded-xl border-2 border-zinc-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
        <h2 className="text-lg font-semibold text-zinc-900 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h2>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 px-3 text-sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Hoy
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7">
        {/* Días de la semana */}
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-3 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-100"
          >
            {day}
          </div>
        ))}

        {calendarDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDay[key] || [];
          const isToday = isSameDay(day, today);
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <div
              key={key}
              className={`min-h-28 border-b border-r border-zinc-100 p-2 ${
                !isCurrentMonth ? 'bg-zinc-50/50' : ''
              }`}
            >
              {/* Número del día */}
              <div className="mb-1">
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                    isToday
                      ? 'bg-zinc-900 text-white'
                      : isCurrentMonth
                      ? 'text-zinc-900'
                      : 'text-zinc-400'
                  }`}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {/* Eventos del día */}
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((rental) => {
                  const colors = STATUS_COLORS[rental.status] || STATUS_COLORS.PENDING;
                  return (
                    <button
                      key={rental.id}
                      onClick={() => setEditingEvent(rental)}
                      className={`w-full text-left px-2 py-1 rounded text-xs font-medium truncate flex items-center gap-1 hover:opacity-80 transition-opacity ${colors.bg} ${colors.text}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${colors.dot}`} />
                      {rental.eventName}
                    </button>
                  );
                })}
                {dayEvents.length > 3 && (
                  <p className="text-xs text-zinc-500 pl-2">
                    +{dayEvents.length - 3} más
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 px-6 py-3 border-t border-zinc-100 bg-zinc-50/50">
        {Object.entries(STATUS_COLORS).map(([status, colors]) => {
          const labels: Record<string, string> = {
            CONFIRMED: 'Confirmado',
            PENDING: 'Pendiente',
            IN_PROGRESS: 'En Progreso',
            COMPLETED: 'Completado',
            CANCELLED: 'Cancelado',
          };
          return (
            <div key={status} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
              <span className="text-xs text-zinc-600">{labels[status]}</span>
            </div>
          );
        })}
      </div>

      {editingEvent && (
        <EditEventDialog
          event={editingEvent}
          open={!!editingEvent}
          onOpenChange={(open: boolean) => !open && setEditingEvent(null)}
        />
      )}
    </div>
  );
}
