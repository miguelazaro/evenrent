'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    Package2,
    Tag,
    MapPin,
    BarChart3,
    DollarSign,
    TrendingUp,
    Clock,
    User,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
    mesas: 'Mesas',
    sillas: 'Sillas',
    manteleria: 'Mantelería',
    iluminacion: 'Iluminación',
    vajilla: 'Vajilla',
    decoracion: 'Decoración',
    audio_video: 'Audio / Video',
    carpas: 'Carpas',
    otro: 'Otro',
};

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

function StatusBadge({ status }: { status: string }) {
    const s = STATUS_MAP[status] ?? { label: status, color: 'bg-zinc-100 text-zinc-700 border-zinc-200' };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${s.color}`}>
            {s.label}
        </span>
    );
}

function fmtMoney(n: number) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0,
    }).format(n);
}

function getStockColor(available: number, total: number) {
    if (total === 0) return 'text-zinc-400';
    const ratio = available / total;
    if (available === 0) return 'text-red-600';
    if (ratio < 0.2) return 'text-amber-600';
    return 'text-emerald-600';
}

function getStockDot(available: number, total: number) {
    if (total === 0) return 'bg-zinc-300';
    const ratio = available / total;
    if (available === 0) return 'bg-red-500';
    if (ratio < 0.2) return 'bg-amber-500';
    return 'bg-emerald-500';
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function InventoryDetailSkeleton() {
    return (
        <div className="min-h-screen bg-[#f7f7f8] p-6 space-y-6">
            <Skeleton className="h-5 w-32" />
            <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-xl" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Skeleton className="h-64 rounded-xl" />
                <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
                    </div>
                    <Skeleton className="h-56 rounded-xl" />
                </div>
            </div>
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function InventoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const { data: item, isLoading, error } = trpc.inventory.getById.useQuery({ id });

    if (isLoading) return <InventoryDetailSkeleton />;

    if (error || !item) {
        return (
            <div className="min-h-screen bg-[#f7f7f8] flex items-center justify-center">
                <div className="text-center space-y-3">
                    <p className="text-zinc-500">No se encontró el artículo</p>
                    <Button variant="outline" onClick={() => router.push('/inventory')}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Volver a inventario
                    </Button>
                </div>
            </div>
        );
    }

    // Stats
    const totalUses = item.rentalItems.length;
    const totalRevenue = item.rentalItems.reduce((acc, ri) => acc + ri.unitPrice * ri.quantity, 0);
    const totalUnitsRented = item.rentalItems.reduce((acc, ri) => acc + ri.quantity, 0);

    const stockColor = getStockColor(item.availableStock, item.totalStock);
    const stockDot = getStockDot(item.availableStock, item.totalStock);

    return (
        <div className="min-h-screen bg-[#f7f7f8]">
            <div className="max-w-7xl mx-auto p-6 space-y-6">

                {/* Back */}
                <button
                    onClick={() => router.push('/inventory')}
                    className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Inventario & Bodega
                </button>

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                            <Package2 className="h-7 w-7 text-zinc-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{item.name}</h1>
                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                <span className="text-sm text-zinc-500 font-mono">{item.sku}</span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                                    {CATEGORY_LABELS[item.category] ?? item.category}
                                </span>
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-zinc-400">
                        Alta: {format(new Date(item.createdAt), "d 'de' MMMM yyyy", { locale: es })}
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                    {/* Info card */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-5">
                        <h2 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">Detalles del artículo</h2>

                        {/* Stock visual */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500">Disponible</span>
                                <span className={`font-semibold flex items-center gap-1.5 ${stockColor}`}>
                                    <span className={`h-2 w-2 rounded-full ${stockDot}`} />
                                    {item.availableStock} / {item.totalStock}
                                </span>
                            </div>
                            <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${item.availableStock === 0 ? 'bg-red-400' :
                                            item.availableStock / item.totalStock < 0.2 ? 'bg-amber-400' : 'bg-emerald-400'
                                        }`}
                                    style={{ width: item.totalStock > 0 ? `${(item.availableStock / item.totalStock) * 100}%` : '0%' }}
                                />
                            </div>
                        </div>

                        <div className="space-y-3 pt-1">
                            <div className="flex items-start gap-3">
                                <DollarSign className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-zinc-400 leading-none mb-1">Precio de renta</p>
                                    <p className="text-sm font-semibold text-zinc-800">{fmtMoney(item.rentalPrice)}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <TrendingUp className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-zinc-400 leading-none mb-1">Costo unitario</p>
                                    <p className="text-sm text-zinc-800">{fmtMoney(item.unitCost)}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <MapPin className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-zinc-400 leading-none mb-1">Ubicación</p>
                                    <p className="text-sm text-zinc-800">{item.location}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Tag className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-zinc-400 leading-none mb-1">Categoría</p>
                                    <p className="text-sm text-zinc-800">{CATEGORY_LABELS[item.category] ?? item.category}</p>
                                </div>
                            </div>

                            {item.description && (
                                <div className="pt-2 border-t border-zinc-100">
                                    <p className="text-xs text-zinc-400 mb-1">Descripción</p>
                                    <p className="text-sm text-zinc-600 leading-relaxed">{item.description}</p>
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
                                        <BarChart3 className="h-3.5 w-3.5 text-zinc-600" />
                                    </div>
                                    <span className="text-xs text-zinc-500">Usos</span>
                                </div>
                                <p className="text-2xl font-bold text-zinc-900">{totalUses}</p>
                                <p className="text-xs text-zinc-400 mt-0.5">eventos totales</p>
                            </div>

                            <div className="bg-white rounded-xl border border-zinc-200 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-7 w-7 rounded-lg bg-zinc-100 flex items-center justify-center">
                                        <TrendingUp className="h-3.5 w-3.5 text-zinc-600" />
                                    </div>
                                    <span className="text-xs text-zinc-500">Ingresos</span>
                                </div>
                                <p className="text-2xl font-bold text-zinc-900">{fmtMoney(totalRevenue)}</p>
                                <p className="text-xs text-zinc-400 mt-0.5">generados</p>
                            </div>

                            <div className="bg-white rounded-xl border border-zinc-200 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-7 w-7 rounded-lg bg-zinc-100 flex items-center justify-center">
                                        <Package2 className="h-3.5 w-3.5 text-zinc-600" />
                                    </div>
                                    <span className="text-xs text-zinc-500">Unidades</span>
                                </div>
                                <p className="text-2xl font-bold text-zinc-900">{totalUnitsRented}</p>
                                <p className="text-xs text-zinc-400 mt-0.5">rentadas total</p>
                            </div>

                            <div className="bg-white rounded-xl border border-zinc-200 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-7 w-7 rounded-lg bg-zinc-100 flex items-center justify-center">
                                        <DollarSign className="h-3.5 w-3.5 text-zinc-600" />
                                    </div>
                                    <span className="text-xs text-zinc-500">Ingreso prom.</span>
                                </div>
                                <p className="text-2xl font-bold text-zinc-900">
                                    {totalUses > 0 ? fmtMoney(totalRevenue / totalUses) : '—'}
                                </p>
                                <p className="text-xs text-zinc-400 mt-0.5">por uso</p>
                            </div>
                        </div>

                        {/* Usage history */}
                        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                            <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-zinc-900">Historial de usos</h2>
                                <span className="text-xs text-zinc-400">{totalUses} {totalUses === 1 ? 'evento' : 'eventos'}</span>
                            </div>

                            {item.rentalItems.length === 0 ? (
                                <div className="py-16 text-center text-zinc-400 text-sm">
                                    Este artículo aún no ha sido rentado
                                </div>
                            ) : (
                                <div className="divide-y divide-zinc-100">
                                    {item.rentalItems.map((ri) => (
                                        <div
                                            key={ri.id}
                                            className="px-5 py-4 flex items-center justify-between hover:bg-zinc-50/50 transition-colors cursor-pointer"
                                            onClick={() => router.push(`/rentals/${ri.rental.id}`)}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-medium text-zinc-900 truncate">{ri.rental.eventName}</p>
                                                    <StatusBadge status={ri.rental.status} />
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                                                        <Clock className="h-3 w-3" />
                                                        {format(new Date(ri.rental.deliveryDate), "d MMM yyyy", { locale: es })}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                                                        <User className="h-3 w-3" />
                                                        {ri.rental.client.name}
                                                    </div>
                                                    <span className="text-xs text-zinc-400">
                                                        {EVENT_TYPE_MAP[ri.rental.eventType.toLowerCase()] ?? ri.rental.eventType}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0 pl-4">
                                                <p className="text-sm font-semibold text-zinc-900">
                                                    {ri.quantity} {ri.quantity === 1 ? 'ud.' : 'uds.'}
                                                </p>
                                                <p className="text-xs text-zinc-400 mt-0.5">{fmtMoney(ri.unitPrice)} c/u</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
