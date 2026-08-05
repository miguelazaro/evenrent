'use client';

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
import { toast } from 'sonner';

const CATEGORIES = [
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

const formSchema = z.object({
    name: z.string().min(2, 'Mínimo 2 caracteres'),
    sku: z.string().min(1, 'SKU requerido'),
    category: z.string().min(1, 'Selecciona una categoría'),
    description: z.string().optional(),
    unitCost: z.number().min(0, 'Debe ser mayor o igual a 0'),
    rentalPrice: z.number().min(0, 'Debe ser mayor o igual a 0'),
    totalStock: z.number().int().min(0, 'Debe ser mayor o igual a 0'),
    location: z.string().min(1, 'Ubicación requerida'),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateInventoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateInventoryDialog({ open, onOpenChange }: CreateInventoryDialogProps) {
    const utils = trpc.useUtils();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            sku: '',
            category: '',
            description: '',
            unitCost: 0,
            rentalPrice: 0,
            totalStock: 0,
            location: 'Bodega General',
        },
    });

    const createMutation = trpc.inventory.create.useMutation({
        onSuccess: () => {
            toast.success('Artículo creado exitosamente');
            utils.inventory.getAll.invalidate();
            form.reset();
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error('Error al crear artículo: ' + error.message);
        },
    });

    const onSubmit = (data: FormValues) => {
        createMutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-zinc-900">
                        Nuevo Artículo
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Nombre */}
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel className="text-sm font-semibold text-zinc-900">Nombre del Artículo</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Ej: Mesa redonda 1.8m" className="h-11 border-zinc-300 focus:border-zinc-900" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* SKU */}
                            <FormField
                                control={form.control}
                                name="sku"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-semibold text-zinc-900">SKU</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Ej: MESA-001" className="h-11 border-zinc-300 focus:border-zinc-900" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Categoría */}
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-semibold text-zinc-900">Categoría</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-11 border-zinc-300 focus:border-zinc-900">
                                                    <SelectValue placeholder="Seleccionar categoría" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent position="popper">
                                                {CATEGORIES.map((cat) => (
                                                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Costo unitario */}
                            <FormField
                                control={form.control}
                                name="unitCost"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-semibold text-zinc-900">Costo Unitario (MXN)</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="number" min={0} step={0.01} className="h-11 border-zinc-300 focus:border-zinc-900" value={Number.isNaN(field.value) ? '' : field.value} onChange={(e) => field.onChange(Number.isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Precio de renta */}
                            <FormField
                                control={form.control}
                                name="rentalPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-semibold text-zinc-900">Precio de Renta (MXN)</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="number" min={0} step={0.01} className="h-11 border-zinc-300 focus:border-zinc-900" value={Number.isNaN(field.value) ? '' : field.value} onChange={(e) => field.onChange(Number.isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Stock total */}
                            <FormField
                                control={form.control}
                                name="totalStock"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-semibold text-zinc-900">Stock Total</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="number" min={0} step={1} className="h-11 border-zinc-300 focus:border-zinc-900" value={Number.isNaN(field.value) ? '' : field.value} onChange={(e) => field.onChange(Number.isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Ubicación */}
                            <FormField
                                control={form.control}
                                name="location"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-semibold text-zinc-900">Ubicación</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Ej: Bodega General" className="h-11 border-zinc-300 focus:border-zinc-900" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Descripción */}
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel className="text-sm font-semibold text-zinc-900">Descripción (Opcional)</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} placeholder="Detalles del artículo..." className="min-h-20 border-zinc-300 focus:border-zinc-900" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-zinc-300">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending} className="bg-zinc-900 hover:bg-zinc-800 text-white">
                                {createMutation.isPending ? 'Guardando...' : 'Crear Artículo'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
