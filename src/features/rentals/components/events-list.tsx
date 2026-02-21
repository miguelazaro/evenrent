'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MoreHorizontal, Pencil, Trash2, Search, X, Eye } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { EditEventDialog } from './index';

const EVENT_TYPE_LABELS: Record<string, string> = {
    wedding: 'Boda',
    corporate: 'Corporativo',
    birthday: 'Cumplea\u00f1os',
    anniversary: 'Aniversario',
    graduation: 'Graduaci\u00f3n',
    other: 'Otro',
};

const STATUS_OPTIONS = [
    { value: '', label: 'Todos' },
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'CONFIRMED', label: 'Confirmado' },
    { value: 'IN_PROGRESS', label: 'En Progreso' },
    { value: 'COMPLETED', label: 'Completado' },
    { value: 'CANCELLED', label: 'Cancelado' },
];

const EVENT_TYPE_OPTIONS = [
    { value: '', label: 'Todos los tipos' },
    { value: 'wedding', label: 'Boda' },
    { value: 'corporate', label: 'Corporativo' },
    { value: 'birthday', label: 'Cumpleaños' },
    { value: 'anniversary', label: 'Aniversario' },
    { value: 'graduation', label: 'Graduación' },
    { value: 'other', label: 'Otro' },
];

const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
        CONFIRMED: { label: 'Confirmado', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        PENDING: { label: 'Pendiente', className: 'bg-amber-50 text-amber-700 border-amber-200' },
        IN_PROGRESS: { label: 'En Progreso', className: 'bg-blue-50 text-blue-700 border-blue-200' },
        COMPLETED: { label: 'Completado', className: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
        CANCELLED: { label: 'Cancelado', className: 'bg-red-50 text-red-700 border-red-200' },
    };
    const variant = variants[status] || variants.PENDING;
    return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
};

export function EventsList() {
    const router = useRouter();
    const [editingEvent, setEditingEvent] = useState<any>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const utils = trpc.useUtils();

    const { data, isLoading } = trpc.rental.getAll.useQuery({ limit: 200 });

    const deleteMutation = trpc.rental.delete.useMutation({
        onSuccess: () => {
            toast.success('Evento eliminado exitosamente');
            utils.rental.getAll.invalidate();
            setEventToDelete(null);
        },
        onError: (error) => {
            toast.error('Error al eliminar evento: ' + error.message);
        },
    });

    const handleDeleteClick = (id: string) => {
        setEventToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (eventToDelete) {
            deleteMutation.mutate({ id: eventToDelete });
        }
    };

    const allRentals = data?.rentals || [];

    const filteredRentals = useMemo(() => {
        return allRentals.filter((rental) => {
            const searchLower = search.toLowerCase();
            const matchesSearch =
                !search ||
                rental.eventName.toLowerCase().includes(searchLower) ||
                rental.client.name.toLowerCase().includes(searchLower);
            const matchesStatus = !statusFilter || rental.status === statusFilter;
            const matchesType = !typeFilter || rental.eventType === typeFilter;
            return matchesSearch && matchesStatus && matchesType;
        });
    }, [allRentals, search, statusFilter, typeFilter]);

    const hasActiveFilters = search || statusFilter || typeFilter;

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('');
        setTypeFilter('');
    };

    return (
        <div className="space-y-4">
            {/* Barra de filtros */}
            <div className="flex flex-wrap gap-3 items-center">
                {/* Búsqueda */}
                <div className="relative flex-1 min-w-50">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                        placeholder="Buscar por evento o cliente..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9 bg-white"
                    />
                </div>

                {/* Filtro por estado */}
                <div className="flex gap-1 flex-wrap">
                    {STATUS_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setStatusFilter(opt.value)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${statusFilter === opt.value
                                    ? 'bg-zinc-900 text-white border-zinc-900'
                                    : 'bg-white text-zinc-600 border-zinc-300 hover:border-zinc-500'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* Filtro por tipo */}
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="h-9 px-3 text-sm rounded-md border border-zinc-300 bg-white text-zinc-700 outline-none focus:border-zinc-900"
                >
                    {EVENT_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>

                {/* Limpiar filtros */}
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-zinc-500">
                        <X className="h-4 w-4 mr-1" />
                        Limpiar
                    </Button>
                )}
            </div>

            {/* Contador */}
            {!isLoading && (
                <p className="text-sm text-zinc-500">
                    {filteredRentals.length} {filteredRentals.length === 1 ? 'evento' : 'eventos'}
                    {hasActiveFilters && ' encontrados'}
                </p>
            )}
            <div className="bg-white rounded-xl border-2 border-zinc-200 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-zinc-50 border-zinc-200">
                            <TableHead className="font-semibold text-zinc-900 uppercase tracking-wider text-xs">
                                Estado
                            </TableHead>
                            <TableHead className="font-semibold text-zinc-900 uppercase tracking-wider text-xs">
                                Cliente
                            </TableHead>
                            <TableHead className="font-semibold text-zinc-900 uppercase tracking-wider text-xs">
                                Evento
                            </TableHead>
                            <TableHead className="font-semibold text-zinc-900 uppercase tracking-wider text-xs">
                                Tipo
                            </TableHead>
                            <TableHead className="font-semibold text-zinc-900 uppercase tracking-wider text-xs">
                                Fecha Entrega
                            </TableHead>
                            <TableHead className="font-semibold text-zinc-900 uppercase tracking-wider text-xs">
                                Fecha Recolección
                            </TableHead>
                            <TableHead className="font-semibold text-zinc-900 uppercase tracking-wider text-xs text-right">
                                Acciones
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <TableRow key={i} className="border-0">
                                    <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredRentals.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="py-12 text-center text-zinc-400">
                                    {hasActiveFilters
                                        ? 'No se encontraron eventos con esos filtros'
                                        : 'No hay eventos registrados'}
                                </TableCell>
                            </TableRow>
                        ) : filteredRentals.map((rental) => (
                            <TableRow
                                key={rental.id}
                                className="border-zinc-200/60 hover:bg-zinc-50/40 transition-colors cursor-pointer"
                                onClick={() => router.push(`/eventos/${rental.id}`)}
                            >
                                <TableCell>{getStatusBadge(rental.status)}</TableCell>
                                <TableCell className="font-medium text-zinc-900">
                                    {rental.client.name}
                                </TableCell>
                                <TableCell className="text-zinc-700">{rental.eventName}</TableCell>
                                <TableCell className="text-zinc-600">
                                    {EVENT_TYPE_LABELS[rental.eventType] || rental.eventType}
                                </TableCell>
                                <TableCell className="text-zinc-600">
                                    {format(new Date(rental.deliveryDate), "d 'de' MMM, yyyy", {
                                        locale: es,
                                    })}
                                </TableCell>
                                <TableCell className="text-zinc-600">
                                    {rental.pickupDate
                                        ? format(new Date(rental.pickupDate), "d 'de' MMM, yyyy", {
                                            locale: es,
                                        })
                                        : '-'}
                                </TableCell>
                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => router.push(`/eventos/${rental.id}`)}>
                                                <Eye className="h-4 w-4 mr-2" />
                                                Ver detalle
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setEditingEvent(rental)}>
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleDeleteClick(rental.id)}
                                                className="text-red-600"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Eliminar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {editingEvent && (
                <EditEventDialog
                    event={editingEvent}
                    open={!!editingEvent}
                    onOpenChange={(open: boolean) => !open && setEditingEvent(null)}
                />
            )}

            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Eliminar Evento"
                description="¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="destructive"
                onConfirm={handleConfirmDelete}
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}
