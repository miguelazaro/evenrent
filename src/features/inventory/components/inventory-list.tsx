'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { MoreHorizontal, Pencil, Trash2, Search, X, Package } from 'lucide-react';
import { toast } from 'sonner';
import { EditInventoryDialog } from './edit-inventory-dialog';

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

const CATEGORY_OPTIONS = [
    { value: '', label: 'Todas las categorías' },
    { value: 'mesas', label: 'Mesas' },
    { value: 'sillas', label: 'Sillas' },
    { value: 'manteleria', label: 'Mantelería' },
    { value: 'iluminacion', label: 'Iluminación' },
    { value: 'vajilla', label: 'Vajilla' },
    { value: 'decoracion', label: 'Decoración' },
    { value: 'audio_video', label: 'Audio / Video' },
    { value: 'carpas', label: 'Carpas' },
    { value: 'otro', label: 'Otro' },
];

const getStockBadge = (available: number, total: number) => {
    if (total === 0) {
        return <Badge variant="outline" className="bg-zinc-100 text-zinc-500 border-zinc-200">Sin stock</Badge>;
    }
    const ratio = available / total;
    if (available === 0) {
        return (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-red-600">
                <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
                0 / {total}
            </span>
        );
    }
    if (ratio < 0.2) {
        return (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-600">
                <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
                {available} / {total}
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
            {available} / {total}
        </span>
    );
};

export function InventoryList() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [editingItem, setEditingItem] = useState<any>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const utils = trpc.useUtils();

    const { data: items = [], isLoading } = trpc.inventory.getAll.useQuery({});

    const deleteMutation = trpc.inventory.delete.useMutation({
        onSuccess: () => {
            toast.success('Artículo eliminado');
            utils.inventory.getAll.invalidate();
            setItemToDelete(null);
        },
        onError: (error) => {
            toast.error('Error al eliminar: ' + error.message);
        },
    });

    const handleDeleteClick = (id: string) => {
        setItemToDelete(id);
        setDeleteDialogOpen(true);
    };

    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const q = search.toLowerCase();
            const matchesSearch =
                !search ||
                item.name.toLowerCase().includes(q) ||
                item.sku.toLowerCase().includes(q);
            const matchesCategory = !categoryFilter || item.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [items, search, categoryFilter]);

    const hasActiveFilters = search || categoryFilter;

    const clearFilters = () => {
        setSearch('');
        setCategoryFilter('');
    };

    return (
        <div className="space-y-4">
            {/* Barra de filtros */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-50">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                        placeholder="Buscar por nombre o SKU..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9 bg-white"
                    />
                </div>

                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="h-9 px-3 text-sm rounded-md border border-zinc-300 bg-white text-zinc-700 outline-none focus:border-zinc-900"
                >
                    {CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>

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
                    {filteredItems.length} {filteredItems.length === 1 ? 'artículo' : 'artículos'}
                    {hasActiveFilters && ' encontrados'}
                </p>
            )}

            {/* Tabla */}
            <div className="bg-white rounded-xl border-2 border-zinc-200 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-zinc-50 border-zinc-200">
                            <TableHead className="font-semibold text-zinc-900 uppercase tracking-wider text-xs">Artículo</TableHead>
                            <TableHead className="font-semibold text-zinc-900 uppercase tracking-wider text-xs">SKU</TableHead>
                            <TableHead className="font-semibold text-zinc-900 uppercase tracking-wider text-xs">Categoría</TableHead>
                            <TableHead className="font-semibold text-zinc-900 uppercase tracking-wider text-xs">Stock (disp / total)</TableHead>
                            <TableHead className="font-semibold text-zinc-900 uppercase tracking-wider text-xs">Precio Renta</TableHead>
                            <TableHead className="font-semibold text-zinc-900 uppercase tracking-wider text-xs">Ubicación</TableHead>
                            <TableHead className="font-semibold text-zinc-900 uppercase tracking-wider text-xs text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <TableRow key={i} className="border-0">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-9 w-9 rounded-lg" />
                                            <Skeleton className="h-4 w-36" />
                                        </div>
                                    </TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="py-16 text-center">
                                    <div className="flex flex-col items-center gap-2 text-zinc-400">
                                        <Package className="h-8 w-8" />
                                        <p className="text-sm">
                                            {hasActiveFilters
                                                ? 'No se encontraron artículos con esos filtros'
                                                : 'No hay artículos en el inventario'}
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredItems.map((item) => (
                            <TableRow
                                key={item.id}
                                className="border-zinc-200/60 hover:bg-zinc-50/40 transition-colors cursor-pointer"
                                onClick={() => router.push(`/inventory/${item.id}`)}
                            >
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                                            <Package className="h-4 w-4 text-zinc-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-zinc-900">{item.name}</p>
                                            {item.description && (
                                                <p className="text-xs text-zinc-400 truncate max-w-48">{item.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono text-xs text-zinc-600">{item.sku}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-zinc-50 text-zinc-700 border-zinc-200">
                                        {CATEGORY_LABELS[item.category] || item.category}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {getStockBadge(item.availableStock, item.totalStock)}
                                </TableCell>
                                <TableCell className="text-zinc-700 font-medium">
                                    ${item.rentalPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className="text-zinc-500 text-sm">{item.location}</TableCell>
                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => setEditingItem(item)}>
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleDeleteClick(item.id)}
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

            {editingItem && (
                <EditInventoryDialog
                    item={editingItem}
                    open={!!editingItem}
                    onOpenChange={(open: boolean) => !open && setEditingItem(null)}
                />
            )}

            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Eliminar Artículo"
                description="¿Estás seguro de que deseas eliminar este artículo? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="destructive"
                onConfirm={() => itemToDelete && deleteMutation.mutate({ id: itemToDelete })}
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}
