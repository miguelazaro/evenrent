'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { trpc } from '@/lib/trpc/client';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2, Package } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
    clientId: z.string().min(1, 'Selecciona un cliente'),
    eventType: z.string().min(1, 'Selecciona un tipo de evento'),
    eventName: z.string().min(2, 'MÃ­nimo 2 caracteres'),
    deliveryDate: z.date({ message: 'Fecha de entrega requerida' }),
    pickupDate: z.date().optional(),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EventItem {
    inventoryItemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
}

interface CreateEventDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateEventDialog({ open, onOpenChange }: CreateEventDialogProps) {
    const utils = trpc.useUtils();

    const [items, setItems] = useState<EventItem[]>([]);
    const [selectedItemId, setSelectedItemId] = useState('');
    const [itemQty, setItemQty] = useState(1);
    const [itemPrice, setItemPrice] = useState(0);
    const [itemNotes, setItemNotes] = useState('');

    // Obtener lista de clientes e inventario
    const { data: clients } = trpc.clients.getAll.useQuery();
    const { data: inventoryData } = trpc.inventory.getAll.useQuery({});

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            clientId: '',
            eventType: '',
            eventName: '',
            notes: '',
        },
    });

    const createMutation = trpc.rental.create.useMutation({
        onSuccess: () => {
            toast.success('Evento creado exitosamente');
            utils.rental.getAll.invalidate();
            form.reset();
            setItems([]);
            setSelectedItemId('');
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error('Error al crear evento: ' + error.message);
        },
    });

    const handleSelectInventoryItem = (id: string) => {
        setSelectedItemId(id);
        const inv = inventoryData?.find((i) => i.id === id);
        if (inv) {
            setItemPrice(inv.rentalPrice ?? 0);
        }
    };

    const handleAddItem = () => {
        if (!selectedItemId || itemQty < 1) return;
        const inv = inventoryData?.find((i) => i.id === selectedItemId);
        if (!inv) return;

        const existing = items.find((i) => i.inventoryItemId === selectedItemId);
        if (existing) {
            setItems((prev) =>
                prev.map((i) =>
                    i.inventoryItemId === selectedItemId
                        ? { ...i, quantity: i.quantity + itemQty }
                        : i
                )
            );
        } else {
            setItems((prev) => [
                ...prev,
                {
                    inventoryItemId: selectedItemId,
                    name: inv.name,
                    quantity: itemQty,
                    unitPrice: itemPrice,
                    notes: itemNotes || undefined,
                },
            ]);
        }

        setSelectedItemId('');
        setItemQty(1);
        setItemPrice(0);
        setItemNotes('');
    };

    const handleRemoveItem = (inventoryItemId: string) => {
        setItems((prev) => prev.filter((i) => i.inventoryItemId !== inventoryItemId));
    };

    const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

    const onSubmit = (data: FormValues) => {
        createMutation.mutate({
            ...data,
            items: items.map(({ name: _name, ...rest }) => rest),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-zinc-900">
                        Crear Nuevo Evento
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Cliente */}
                        <FormField
                            control={form.control}
                            name="clientId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-semibold text-zinc-900">
                                        Cliente
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-11 border-zinc-300 focus:border-zinc-900">
                                                <SelectValue placeholder="Seleccionar cliente" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent position="popper">
                                            {clients?.map((client) => (
                                                <SelectItem key={client.id} value={client.id}>
                                                    {client.name} - {client.company || client.city}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Tipo de Evento */}
                        <FormField
                            control={form.control}
                            name="eventType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-semibold text-zinc-900">
                                        Tipo de Evento
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-11 border-zinc-300 focus:border-zinc-900">
                                                <SelectValue placeholder="Seleccionar tipo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent position="popper">
                                            <SelectItem value="wedding">Boda</SelectItem>
                                            <SelectItem value="corporate">Evento Corporativo</SelectItem>
                                            <SelectItem value="birthday">Cumpleaños</SelectItem>
                                            <SelectItem value="anniversary">Aniversario</SelectItem>
                                            <SelectItem value="graduation">Graduación</SelectItem>
                                            <SelectItem value="other">Otro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Nombre del Evento */}
                        <FormField
                            control={form.control}
                            name="eventName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-semibold text-zinc-900">
                                        Nombre del Evento
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="Ej: Boda GarcÃ­a - LÃ³pez"
                                            className="h-11 border-zinc-300 focus:border-zinc-900"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            {/* Fecha de Entrega */}
                            <FormField
                                control={form.control}
                                name="deliveryDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="text-sm font-semibold text-zinc-900">
                                            Fecha de Entrega
                                        </FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            'h-11 w-full pl-3 text-left font-normal border-zinc-300',
                                                            !field.value && 'text-zinc-500'
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, 'PPP', { locale: es })
                                                        ) : (
                                                            <span>Seleccionar fecha</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start" side="bottom" avoidCollisions={false}>
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    locale={es}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Fecha de RecolecciÃ³n */}
                            <FormField
                                control={form.control}
                                name="pickupDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="text-sm font-semibold text-zinc-900">
                                            Fecha de RecolecciÃ³n (Opcional)
                                        </FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            'h-11 w-full pl-3 text-left font-normal border-zinc-300',
                                                            !field.value && 'text-zinc-500'
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, 'PPP', { locale: es })
                                                        ) : (
                                                            <span>Seleccionar fecha</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start" side="bottom" avoidCollisions={false}>
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    locale={es}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* â”€â”€ ArtÃ­culos de Bodega â”€â”€ */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-zinc-600" />
                                <span className="text-sm font-semibold text-zinc-900">ArtÃ­culos del Evento</span>
                            </div>

                            {/* Selector de artÃ­culo */}
                            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <Select value={selectedItemId} onValueChange={handleSelectInventoryItem}>
                                            <SelectTrigger className="h-10 bg-white border-zinc-300">
                                                <SelectValue placeholder="Seleccionar artÃ­culo de bodega" />
                                            </SelectTrigger>
                                            <SelectContent position="popper">
                                                {inventoryData?.map((inv) => (
                                                    <SelectItem key={inv.id} value={inv.id}>
                                                        {inv.name}
                                                        {inv.sku ? ` (${inv.sku})` : ''}
                                                        {' â€” '}
                                                        <span className="text-zinc-500">{inv.availableStock} disp.</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-zinc-500 mb-1 block">Cantidad</label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={itemQty}
                                            onChange={(e) => setItemQty(e.target.valueAsNumber || 1)}
                                            className="h-10 bg-white border-zinc-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-zinc-500 mb-1 block">Precio unitario (MXN)</label>
                                        <Input
                                            type="number"
                                            min={0}
                                            step={0.01}
                                            value={itemPrice}
                                            onChange={(e) => setItemPrice(e.target.valueAsNumber || 0)}
                                            className="h-10 bg-white border-zinc-300"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs text-zinc-500 mb-1 block">Notas del artÃ­culo (Opcional)</label>
                                        <Input
                                            value={itemNotes}
                                            onChange={(e) => setItemNotes(e.target.value)}
                                            placeholder="Ej: Color blanco, sin armar..."
                                            className="h-10 bg-white border-zinc-300"
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    onClick={handleAddItem}
                                    disabled={!selectedItemId}
                                    size="sm"
                                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white"
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Agregar artÃ­culo
                                </Button>
                            </div>

                            {/* Lista de artÃ­culos agregados */}
                            {items.length > 0 && (
                                <div className="space-y-2">
                                    {items.map((item) => (
                                        <div
                                            key={item.inventoryItemId}
                                            className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2"
                                        >
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <Package className="h-4 w-4 text-zinc-400 shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-zinc-900 truncate">{item.name}</p>
                                                    {item.notes && (
                                                        <p className="text-xs text-zinc-400 truncate">{item.notes}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0 ml-2">
                                                <Badge variant="secondary" className="text-xs">
                                                    Ã—{item.quantity}
                                                </Badge>
                                                <span className="text-sm font-semibold text-zinc-900 tabular-nums">
                                                    ${(item.quantity * item.unitPrice).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(item.inventoryItemId)}
                                                    className="text-zinc-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Total */}
                                    <div className="flex justify-between items-center rounded-lg bg-zinc-900 text-white px-3 py-2">
                                        <span className="text-sm font-semibold">Total del Evento</span>
                                        <span className="text-sm font-bold tabular-nums">
                                            ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Notas */}
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-semibold text-zinc-900">
                                        Notas (Opcional)
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            placeholder="Detalles adicionales del evento..."
                                            className="min-h-25 border-zinc-300 focus:border-zinc-900"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Botones */}
                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="border-zinc-300"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="bg-zinc-900 hover:bg-zinc-800 text-white"
                            >
                                {createMutation.isPending ? 'Creando...' : 'Crear Evento'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
