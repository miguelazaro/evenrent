'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreHorizontal, Pencil, Trash2, Search, Mail, Phone, MapPin, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { EditClientDialog } from './edit-client-dialog';

export function ClientsList() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [editingClient, setEditingClient] = useState<any>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<string | null>(null);
    const utils = trpc.useUtils();

    const { data: clients = [], isLoading } = trpc.clients.getAll.useQuery();

    const deleteMutation = trpc.clients.delete.useMutation({
        onSuccess: () => {
            toast.success('Cliente eliminado');
            utils.clients.getAll.invalidate();
            setClientToDelete(null);
        },
        onError: (error) => {
            toast.error('Error al eliminar: ' + error.message);
        },
    });

    const filteredClients = useMemo(() => {
        if (!search) return clients;
        const q = search.toLowerCase();
        return clients.filter((c) =>
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.city?.toLowerCase().includes(q) ||
            c.company?.toLowerCase().includes(q)
        );
    }, [clients, search]);

    return (
        <div className="space-y-4">
            {/* Buscador */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                    placeholder="Buscar por nombre, email, ciudad..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 bg-white"
                />
            </div>

            {/* Contador */}
            {!isLoading && (
                <p className="text-sm text-zinc-500">
                    {filteredClients.length} {filteredClients.length === 1 ? 'cliente' : 'clientes'}
                    {search && ' encontrados'}
                </p>
            )}

            {/* Tabla */}
            <div className="bg-white rounded-xl border-2 border-zinc-200 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-zinc-50 border-zinc-200">
                            <TableHead className="font-semibold text-zinc-900 uppercase tracking-wider text-xs">Cliente</TableHead>
                            <TableHead className="font-semibold text-zinc-900 uppercase tracking-wider text-xs">Contacto</TableHead>
                            <TableHead className="font-semibold text-zinc-900 uppercase tracking-wider text-xs">Empresa</TableHead>
                            <TableHead className="font-semibold text-zinc-900 uppercase tracking-wider text-xs">Ciudad</TableHead>
                            <TableHead className="font-semibold text-zinc-900 uppercase tracking-wider text-xs text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <TableRow key={i} className="border-0">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-9 w-9 rounded-full" />
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                    </TableCell>
                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredClients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-12 text-center text-zinc-400">
                                    {search ? 'No se encontraron clientes con esa búsqueda' : 'No hay clientes registrados'}
                                </TableCell>
                            </TableRow>
                        ) : filteredClients.map((client) => (
                            <TableRow
                                key={client.id}
                                className="border-zinc-200/60 hover:bg-zinc-50/40 transition-colors cursor-pointer"
                                onClick={() => router.push(`/clients/${client.id}`)}
                            >
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-zinc-900 text-white flex items-center justify-center text-sm font-bold shrink-0">
                                            {client.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-medium text-zinc-900">{client.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-sm text-zinc-600">
                                            <Mail className="h-3.5 w-3.5 text-zinc-400" />
                                            {client.email}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-sm text-zinc-600">
                                            <Phone className="h-3.5 w-3.5 text-zinc-400" />
                                            {client.phone}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {client.company ? (
                                        <div className="flex items-center gap-1.5 text-sm text-zinc-600">
                                            <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                                            {client.company}
                                        </div>
                                    ) : (
                                        <span className="text-zinc-400 text-sm">—</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5 text-sm text-zinc-600">
                                        <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                                        {client.city}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => setEditingClient(client)}>
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => { setClientToDelete(client.id); setDeleteDialogOpen(true); }}
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

            {editingClient && (
                <EditClientDialog
                    client={editingClient}
                    open={!!editingClient}
                    onOpenChange={(open) => !open && setEditingClient(null)}
                />
            )}

            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Eliminar Cliente"
                description="¿Estás seguro? Se eliminará el cliente y no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="destructive"
                onConfirm={() => clientToDelete && deleteMutation.mutate({ id: clientToDelete })}
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}
