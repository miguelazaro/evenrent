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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const formSchema = z.object({
    name: z.string().min(2, 'Mínimo 2 caracteres'),
    email: z.string().email('Email inválido'),
    phone: z.string().min(7, 'Teléfono inválido'),
    city: z.string().min(2, 'Ciudad requerida'),
    company: z.string().optional(),
    address: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateClientDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateClientDialog({ open, onOpenChange }: CreateClientDialogProps) {
    const utils = trpc.useUtils();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: '', email: '', phone: '', city: '', company: '', address: '' },
    });

    const createMutation = trpc.clients.create.useMutation({
        onSuccess: () => {
            toast.success('Cliente creado exitosamente');
            utils.clients.getAll.invalidate();
            form.reset();
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error('Error al crear cliente: ' + error.message);
        },
    });

    const onSubmit = (data: FormValues) => createMutation.mutate(data);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-zinc-900">
                        Nuevo Cliente
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem className="col-span-2">
                                    <FormLabel className="text-sm font-semibold text-zinc-900">Nombre completo</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Ej: Juan García" className="h-10 border-zinc-300" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-semibold text-zinc-900">Email</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="email" placeholder="juan@email.com" className="h-10 border-zinc-300" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-semibold text-zinc-900">Teléfono</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="555 123 4567" className="h-10 border-zinc-300" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="city" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-semibold text-zinc-900">Ciudad</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Guadalajara" className="h-10 border-zinc-300" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="company" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-semibold text-zinc-900">Empresa (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Mi Empresa S.A." className="h-10 border-zinc-300" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="address" render={({ field }) => (
                                <FormItem className="col-span-2">
                                    <FormLabel className="text-sm font-semibold text-zinc-900">Dirección (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Av. Principal 123, Col. Centro" className="h-10 border-zinc-300" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-zinc-300">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending} className="bg-zinc-900 hover:bg-zinc-800 text-white">
                                {createMutation.isPending ? 'Creando...' : 'Crear Cliente'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
