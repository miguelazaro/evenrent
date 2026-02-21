'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    ArrowLeft,
    Calendar,
    CalendarCheck,
    User,
    Phone,
    Mail,
    Building2,
    Package,
    FileText,
    Pencil,
    Trash2,
    ChevronDown,
    Hash,
    FileDown,
} from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog } from '@/components/ui/alert-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { EditEventDialog, PaymentsSection } from '@/features/rentals/components';
import { EVENT_TYPE_LABELS, CATEGORY_LABELS, STATUS_CONFIG, STATUS_TRANSITIONS } from './_config';
import { StatusBadge, InfoCard, DetailSkeleton } from './_components';

// ─── Componente principal ─────────────────────────────────────────────────────

export default function EventDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const utils = trpc.useUtils();

    const { data: rental, isLoading, error } = trpc.rental.getById.useQuery({ id });

    const updateStatusMutation = trpc.rental.updateStatus.useMutation({
        onSuccess: (_, vars) => {
            const label = STATUS_CONFIG[vars.status]?.label ?? vars.status;
            toast.success(`Estado actualizado a "${label}"`);
            utils.rental.getById.invalidate({ id });
            utils.rental.getAll.invalidate();
        },
        onError: (err) => toast.error('Error al actualizar estado: ' + err.message),
    });

    const deleteMutation = trpc.rental.delete.useMutation({
        onSuccess: () => {
            toast.success('Evento eliminado');
            router.push('/eventos');
        },
        onError: (err) => toast.error('Error al eliminar: ' + err.message),
    });

    // ── Estados de carga / error ──
    if (isLoading) return (
        <div className="p-6 md:p-8">
            <DetailSkeleton />
        </div>
    );

    if (error || !rental) return (
        <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <p className="text-zinc-500 text-lg">Evento no encontrado</p>
            <Button variant="outline" onClick={() => router.push('/eventos')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Eventos
            </Button>
        </div>
    );

    const transitions = STATUS_TRANSITIONS[rental.status] ?? [];
    const totalAmount = rental.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
    );

    return (
        <div className="p-6 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* ── Breadcrumb / Back ── */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors group"
                >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                    Volver
                </button>

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl font-bold text-zinc-900 leading-tight">
                                {rental.eventName}
                            </h1>
                            <StatusBadge status={rental.status} />
                            <Badge variant="outline" className="bg-zinc-50 text-zinc-600 border-zinc-200 text-xs">
                                {EVENT_TYPE_LABELS[rental.eventType] || rental.eventType}
                            </Badge>
                        </div>
                        <p className="text-sm text-zinc-500 flex items-center gap-1.5">
                            <Hash className="h-3.5 w-3.5" />
                            {rental.id.slice(0, 8).toUpperCase()}
                            <span className="mx-1 text-zinc-300">·</span>
                            Creado el {format(new Date(rental.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 shrink-0">
                        {transitions.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-zinc-300 gap-1.5"
                                        disabled={updateStatusMutation.isPending}
                                    >
                                        Cambiar estado
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {transitions.map((t) => (
                                        <DropdownMenuItem
                                            key={t.value}
                                            onClick={() =>
                                                updateStatusMutation.mutate({
                                                    id: rental.id,
                                                    status: t.value as any,
                                                })
                                            }
                                        >
                                            {t.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/eventos/${rental.id}/cotizacion`, '_blank')}
                            className="border-zinc-300 gap-1.5 text-zinc-700"
                        >
                            <FileDown className="h-4 w-4" />
                            Exportar PDF
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditOpen(true)}
                            className="border-zinc-300 gap-1.5"
                        >
                            <Pencil className="h-4 w-4" />
                            Editar
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteOpen(true)}
                            className="border-red-200 text-red-600 hover:bg-red-50 gap-1.5"
                        >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                        </Button>
                    </div>
                </div>

                {/* ── Info Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <InfoCard
                        icon={User}
                        label="Cliente"
                        value={rental.client.name}
                        sub={rental.client.company ?? rental.client.city ?? undefined}
                    />
                    <InfoCard
                        icon={Calendar}
                        label="Fecha de Entrega"
                        value={format(new Date(rental.deliveryDate), "EEEE d 'de' MMMM", { locale: es })}
                        sub={format(new Date(rental.deliveryDate), 'yyyy')}
                    />
                    <InfoCard
                        icon={CalendarCheck}
                        label="Fecha de Recolección"
                        value={
                            rental.pickupDate
                                ? format(new Date(rental.pickupDate), "EEEE d 'de' MMMM", { locale: es })
                                : 'No definida'
                        }
                        sub={
                            rental.pickupDate
                                ? format(new Date(rental.pickupDate), 'yyyy')
                                : undefined
                        }
                    />
                    <div className="bg-zinc-900 rounded-xl p-4 flex items-start gap-3">
                        <div className="rounded-lg bg-white/10 p-2 mt-0.5 shrink-0">
                            <Package className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-0.5">Total del Evento</p>
                            <p className="text-lg font-bold text-white tabular-nums">
                                ${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-zinc-400">MXN · {rental.items.length} artículo{rental.items.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-xl border border-zinc-200 p-5">
                    <h2 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider mb-4">
                        Información del Cliente
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2.5">
                            <User className="h-4 w-4 text-zinc-400 shrink-0" />
                            <div>
                                <p className="text-xs text-zinc-500">Nombre</p>
                                <p className="text-sm font-medium text-zinc-900">{rental.client.name}</p>
                            </div>
                        </div>
                        {rental.client.phone && (
                            <div className="flex items-center gap-2.5">
                                <Phone className="h-4 w-4 text-zinc-400 shrink-0" />
                                <div>
                                    <p className="text-xs text-zinc-500">Teléfono</p>
                                    <p className="text-sm font-medium text-zinc-900">{rental.client.phone}</p>
                                </div>
                            </div>
                        )}
                        {rental.client.email && (
                            <div className="flex items-center gap-2.5">
                                <Mail className="h-4 w-4 text-zinc-400 shrink-0" />
                                <div>
                                    <p className="text-xs text-zinc-500">Email</p>
                                    <p className="text-sm font-medium text-zinc-900 truncate">{rental.client.email}</p>
                                </div>
                            </div>
                        )}
                        {rental.client.company && (
                            <div className="flex items-center gap-2.5">
                                <Building2 className="h-4 w-4 text-zinc-400 shrink-0" />
                                <div>
                                    <p className="text-xs text-zinc-500">Empresa</p>
                                    <p className="text-sm font-medium text-zinc-900">{rental.client.company}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Artículos ── */}
                <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-100">
                        <h2 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">
                            Artículos del Evento
                        </h2>
                    </div>

                    {rental.items.length === 0 ? (
                        <div className="py-12 text-center">
                            <Package className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                            <p className="text-sm text-zinc-400">No hay artículos asignados a este evento</p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-zinc-50 border-zinc-100">
                                        <TableHead className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Artículo</TableHead>
                                        <TableHead className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Categoría</TableHead>
                                        <TableHead className="text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Cantidad</TableHead>
                                        <TableHead className="text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Precio Unit.</TableHead>
                                        <TableHead className="text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Subtotal</TableHead>
                                        <TableHead className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Notas</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rental.items.map((item) => (
                                        <TableRow key={item.id} className="border-zinc-100 hover:bg-zinc-50/40">
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-7 w-7 rounded-md bg-zinc-100 flex items-center justify-center shrink-0">
                                                        <Package className="h-3.5 w-3.5 text-zinc-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-zinc-900">{item.inventoryItem.name}</p>
                                                        {item.inventoryItem.sku && (
                                                            <p className="text-xs text-zinc-400">{item.inventoryItem.sku}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-medium">
                                                    {CATEGORY_LABELS[item.inventoryItem.category] ?? item.inventoryItem.category}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right text-sm font-semibold text-zinc-900 tabular-nums">
                                                {item.quantity}
                                            </TableCell>
                                            <TableCell className="text-right text-sm text-zinc-600 tabular-nums">
                                                ${item.unitPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-right text-sm font-semibold text-zinc-900 tabular-nums">
                                                ${(item.quantity * item.unitPrice).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-xs text-zinc-400 max-w-xs truncate">
                                                {item.notes ?? '—'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Footer de totales */}
                            <div className="border-t border-zinc-100 px-5 py-3">
                                <div className="flex justify-end">
                                    <div className="space-y-1 min-w-48">
                                        <div className="flex justify-between text-sm text-zinc-500 gap-8">
                                            <span>Subtotal ({rental.items.length} artículo{rental.items.length !== 1 ? 's' : ''})</span>
                                            <span className="tabular-nums">${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <Separator className="my-1" />
                                        <div className="flex justify-between text-base font-bold text-zinc-900 gap-8">
                                            <span>Total</span>
                                            <span className="tabular-nums">${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* ── Pagos y Abonos ── */}
                <PaymentsSection rentalId={rental.id} />

                {/* ── Notas ── */}
                {rental.notes && (
                    <div className="bg-white rounded-xl border border-zinc-200 p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <FileText className="h-4 w-4 text-zinc-400" />
                            <h2 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">Notas</h2>
                        </div>
                        <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">{rental.notes}</p>
                    </div>
                )}

            </div>

            {/* ── Dialogs ── */}
            <EditEventDialog
                event={rental}
                open={editOpen}
                onOpenChange={(open) => {
                    setEditOpen(open);
                    if (!open) utils.rental.getById.invalidate({ id });
                }}
            />

            <AlertDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Eliminar Evento"
                description={`¿Estás seguro de que deseas eliminar "${rental.eventName}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="destructive"
                onConfirm={() => deleteMutation.mutate({ id: rental.id })}
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}
