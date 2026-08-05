'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Building2,
    Calendar,
    Package2,
    DollarSign,
    TrendingUp,
    Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    CONFIRMED: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    IN_PROGRESS: { label: 'En curso', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    COMPLETED: { label: 'Completado', color: 'bg-green-100 text-green-800 border-green-200' },
    CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200' },
};

const EVENT_TYPE_MAP: Record<string, string> = {
    wedding: 'Boda',
    corporate: 'Corporativo',
    birthday: 'Cumpleaños',
    anniversary: 'Aniversario',
    graduation: 'Graduación',
    quinceañera: 'Quinceañera',
    baptism: 'Bautizo',
    other: 'Otro',
};

const PAYMENT_MAP: Record<string, { label: string; color: string }> = {
    UNPAID: { label: 'Sin pago', color: 'bg-red-50 text-red-700 border-red-200' },
    PARTIAL: { label: 'Parcial', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    PAID: { label: 'Pagado', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

function StatusBadge({ status }: { status: string }) {
    const s = STATUS_MAP[status] ?? { label: status, color: 'bg-zinc-100 text-zinc-700 border-zinc-200' };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${s.color}`}>
            {s.label}
        </span>
    );
}

function PaymentBadge({ status }: { status: string }) {
    const s = PAYMENT_MAP[status] ?? { label: status, color: 'bg-zinc-100 text-zinc-700 border-zinc-200' };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${s.color}`}>
            {s.label}
        </span>
    );
}

function fmtMoney(n: number) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n);
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function ClientDetailSkeleton() {
    return (
        <div className="min-h-screen bg-[#f7f7f8] p-6 space-y-6">
            <Skeleton className="h-9 w-40" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-4 w-28" />
                        </div>
                    </div>
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
                </div>
                <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
                    </div>
                    <Skeleton className="h-64 rounded-xl" />
                </div>
            </div>
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const { data: client, isLoading, error } = trpc.clients.getById.useQuery({ id });

    if (isLoading) return <ClientDetailSkeleton />;

    if (error || !client) {
        return (
            <div className="min-h-screen bg-[#f7f7f8] flex items-center justify-center">
                <div className="text-center space-y-3">
                    <p className="text-zinc-500">No se encontró el cliente</p>
                    <Button variant="outline" onClick={() => router.push('/clients')}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Volver a clientes
                    </Button>
                </div>
            </div>
        );
    }

    // Stats
    const totalEvents = client.rentals.length;
    const totalRevenue = client.rentals.reduce((acc, r) => acc + r.totalAmount, 0);
    const totalItems = client.rentals.reduce((acc, r) => acc + r.items.reduce((s, i) => s + i.quantity, 0), 0);
    const completedEvents = client.rentals.filter((r) => r.status === 'COMPLETED').length;

    const initials = client.name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();

    return (
        <div className="min-h-screen bg-[#f7f7f8]">
            <div className="max-w-7xl mx-auto p-6 space-y-6">

                {/* Back */}
                <button
                    onClick={() => router.push('/clients')}
                    className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Clientes
                </button>

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xl font-bold shrink-0">
                            {initials}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{client.name}</h1>
                            {client.company && (
                                <p className="text-sm text-zinc-500 flex items-center gap-1.5 mt-0.5">
                                    <Building2 className="h-3.5 w-3.5" />
                                    {client.company}
                                </p>
                            )}
                        </div>
                    </div>
                    <p className="text-sm text-zinc-400">
                        Cliente desde {format(new Date(client.createdAt), "MMMM yyyy", { locale: es })}
                    </p>
                </div>

                {/* Grid: info card + stats + table */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                    {/* Info card */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
                        <h2 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">Información de contacto</h2>

                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <Mail className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-zinc-400 leading-none mb-1">Email</p>
                                    <a href={`mailto:${client.email}`} className="text-sm text-zinc-800 hover:underline">
                                        {client.email}
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Phone className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-zinc-400 leading-none mb-1">Teléfono</p>
                                    <a href={`tel:${client.phone}`} className="text-sm text-zinc-800 hover:underline">
                                        {client.phone}
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <MapPin className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-zinc-400 leading-none mb-1">Ciudad</p>
                                    <p className="text-sm text-zinc-800">{client.city}</p>
                                </div>
                            </div>

                            {client.address && (
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-4 w-4 text-zinc-300 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs text-zinc-400 leading-none mb-1">Dirección</p>
                                        <p className="text-sm text-zinc-800">{client.address}</p>
                                    </div>
                                </div>
                            )}

                            {client.company && (
                                <div className="flex items-start gap-3">
                                    <Building2 className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs text-zinc-400 leading-none mb-1">Empresa</p>
                                        <p className="text-sm text-zinc-800">{client.company}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right column */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Stats strip */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-white rounded-xl border border-zinc-200 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-7 w-7 rounded-lg bg-zinc-100 flex items-center justify-center">
                                        <Calendar className="h-3.5 w-3.5 text-zinc-600" />
                                    </div>
                                    <span className="text-xs text-zinc-500">Eventos</span>
                                </div>
                                <p className="text-2xl font-bold text-zinc-900">{totalEvents}</p>
                                <p className="text-xs text-zinc-400 mt-0.5">{completedEvents} completados</p>
                            </div>

                            <div className="bg-white rounded-xl border border-zinc-200 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-7 w-7 rounded-lg bg-zinc-100 flex items-center justify-center">
                                        <TrendingUp className="h-3.5 w-3.5 text-zinc-600" />
                                    </div>
                                    <span className="text-xs text-zinc-500">Ingresos</span>
                                </div>
                                <p className="text-2xl font-bold text-zinc-900">{fmtMoney(totalRevenue)}</p>
                                <p className="text-xs text-zinc-400 mt-0.5">total facturado</p>
                            </div>

                            <div className="bg-white rounded-xl border border-zinc-200 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-7 w-7 rounded-lg bg-zinc-100 flex items-center justify-center">
                                        <Package2 className="h-3.5 w-3.5 text-zinc-600" />
                                    </div>
                                    <span className="text-xs text-zinc-500">Artículos</span>
                                </div>
                                <p className="text-2xl font-bold text-zinc-900">{totalItems}</p>
                                <p className="text-xs text-zinc-400 mt-0.5">rentados en total</p>
                            </div>

                            <div className="bg-white rounded-xl border border-zinc-200 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-7 w-7 rounded-lg bg-zinc-100 flex items-center justify-center">
                                        <DollarSign className="h-3.5 w-3.5 text-zinc-600" />
                                    </div>
                                    <span className="text-xs text-zinc-500">Ticket prom.</span>
                                </div>
                                <p className="text-2xl font-bold text-zinc-900">
                                    {totalEvents > 0 ? fmtMoney(totalRevenue / totalEvents) : '—'}
                                </p>
                                <p className="text-xs text-zinc-400 mt-0.5">por evento</p>
                            </div>
                        </div>

                        {/* Rental history */}
                        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                            <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-zinc-900">Historial de eventos</h2>
                                <span className="text-xs text-zinc-400">{totalEvents} {totalEvents === 1 ? 'evento' : 'eventos'}</span>
                            </div>

                            {client.rentals.length === 0 ? (
                                <div className="py-16 text-center text-zinc-400 text-sm">
                                    Este cliente aún no tiene eventos registrados
                                </div>
                            ) : (
                                <div className="divide-y divide-zinc-100">
                                    {client.rentals.map((rental) => {
                                        const totalQty = rental.items.reduce((acc, i) => acc + i.quantity, 0);
                                        return (
                                            <div
                                                key={rental.id}
                                                className="px-5 py-4 flex items-center justify-between hover:bg-zinc-50/50 transition-colors cursor-pointer"
                                                onClick={() => router.push(`/rentals/${rental.id}`)}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-sm font-medium text-zinc-900 truncate">{rental.eventName}</p>
                                                        <StatusBadge status={rental.status} />
                                                        <PaymentBadge status={rental.paymentStatus} />
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                                                            <Clock className="h-3 w-3" />
                                                            {format(new Date(rental.deliveryDate), "d MMM yyyy", { locale: es })}
                                                        </div>
                                                        {totalQty > 0 && (
                                                            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                                                                <Package2 className="h-3 w-3" />
                                                                {totalQty} {totalQty === 1 ? 'artículo' : 'artículos'}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0 pl-4">
                                                    <p className="text-sm font-semibold text-zinc-900">{fmtMoney(rental.totalAmount)}</p>
                                                    <p className="text-xs text-zinc-400 capitalize mt-0.5">
                                                        {EVENT_TYPE_MAP[rental.eventType.toLowerCase()] ?? rental.eventType}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
