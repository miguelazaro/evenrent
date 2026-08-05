'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Truck, RotateCcw, DollarSign, Package2, AlertTriangle, X } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type NotificationKind =
  | 'delivery_soon'
  | 'pickup_today'
  | 'unpaid_completed'
  | 'stock_out'
  | 'stock_low';

// ─── Config visual por tipo ───────────────────────────────────────────────────

const KIND_CONFIG: Record<
  NotificationKind,
  { icon: React.ComponentType<{ className?: string }>; bg: string; text: string }
> = {
  delivery_soon:    { icon: Truck,         bg: 'bg-blue-100',   text: 'text-blue-600' },
  pickup_today:     { icon: RotateCcw,     bg: 'bg-purple-100', text: 'text-purple-600' },
  unpaid_completed: { icon: DollarSign,    bg: 'bg-orange-100', text: 'text-orange-600' },
  stock_out:        { icon: Package2,      bg: 'bg-red-100',    text: 'text-red-600' },
  stock_low:        { icon: AlertTriangle, bg: 'bg-amber-100',  text: 'text-amber-600' },
};

const URGENCY_DOT: Record<string, string> = {
  high:   'bg-red-500',
  medium: 'bg-orange-400',
  low:    'bg-amber-400',
};

// ─── Componente ───────────────────────────────────────────────────────────────

export function NotificationsBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { data: allNotifications = [], isLoading } = trpc.notifications.getAll.useQuery(
    undefined,
    { refetchInterval: 60_000 } // refresca cada 60 s
  );

  const notifications = allNotifications.filter((n) => !dismissed.has(n.id));
  const count = notifications.length;

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleDismiss(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setDismissed((prev) => new Set([...prev, id]));
  }

  function handleClickNotification(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="relative h-8 w-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-700"
        aria-label="Notificaciones"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-0.5 flex items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-xl border border-zinc-200 overflow-hidden z-50"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-zinc-900">Notificaciones</span>
              {count > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                  {count}
                </span>
              )}
            </div>
            {count > 0 && (
              <button
                onClick={() => setDismissed(new Set(allNotifications.map((n) => n.id)))}
                className="text-[11px] text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                Limpiar todo
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-[420px] overflow-y-auto">
            {isLoading ? (
              <div className="py-10 flex items-center justify-center">
                <div className="h-5 w-5 border-2 border-zinc-200 border-t-zinc-600 rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-2 text-zinc-400">
                <Bell className="h-7 w-7 text-zinc-200" />
                <p className="text-[12px]">Sin alertas pendientes</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-50">
                {notifications.map((n) => {
                  const cfg = KIND_CONFIG[n.kind as NotificationKind] ?? KIND_CONFIG.stock_low;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleClickNotification(n.href)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors cursor-pointer group"
                    >
                      {/* Icon */}
                      <div className={`h-8 w-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon className={`h-3.5 w-3.5 ${cfg.text}`} />
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${URGENCY_DOT[n.urgency]}`} />
                          <p className="text-[12px] font-semibold text-zinc-900 truncate">{n.title}</p>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{n.description}</p>
                      </div>

                      {/* Dismiss */}
                      <button
                        onClick={(e) => handleDismiss(e, n.id)}
                        className="shrink-0 h-5 w-5 flex items-center justify-center rounded text-zinc-300 hover:text-zinc-600 hover:bg-zinc-100 transition-colors opacity-0 group-hover:opacity-100"
                        aria-label="Descartar"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer: leyenda de prioridad */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-zinc-100 flex items-center gap-4">
              {[
                { dot: 'bg-red-500',    label: 'Urgente' },
                { dot: 'bg-orange-400', label: 'Medio' },
                { dot: 'bg-amber-400',  label: 'Bajo' },
              ].map(({ dot, label }) => (
                <div key={label} className="flex items-center gap-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                  <span className="text-[10px] text-zinc-400">{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
