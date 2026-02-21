'use client';

import { useEffect } from 'react';
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

interface EditClientDialogProps {
    client: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditClientDialog({ client, open, onOpenChange }: EditClientDialogProps) {
    const utils = trpc.useUtils();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: client?.name ?? '',
            email: client?.email ?? '',
            phone: client?.phone ?? '',
            city: client?.city ?? '',
            company: client?.company ?? '',
            address: client?.address ?? '',
        },
    });

    useEffect(() => {
        if (client) {
            form.reset({
                name: client.name ?? '',
                email: client.email ?? '',
                phone: client.phone ?? '',
                city: client.city ?? '',
                company: client.company ?? '',
                address: client.address ?? '',
            });
        }
    }, [client, form]);

    const updateMutation = trpc.clients.update.useMutation({
        onSuccess: () => {
            toast.success('Cliente actualizado');
            utils.clients.getAll.invalidate();
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error('Error al actualizar: ' + error.message);
        },
    });

    const onSubmit = (data: FormValues) => updateMutation.mutate({ id: client.id, ...data });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-zinc-900">
                        Editar Cliente
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem className="col-span-2">
                                    <FormLabel className="text-sm font-semibold text-zinc-900">Nombre completo</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="h-10 border-zinc-300" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-semibold text-zinc-900">Email</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="email" className="h-10 border-zinc-300" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-semibold text-zinc-900">Teléfono</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="h-10 border-zinc-300" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="city" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-semibold text-zinc-900">Ciudad</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="h-10 border-zinc-300" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="company" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-semibold text-zinc-900">Empresa (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="h-10 border-zinc-300" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="address" render={({ field }) => (
                                <FormItem className="col-span-2">
                                    <FormLabel className="text-sm font-semibold text-zinc-900">Dirección (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="h-10 border-zinc-300" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-zinc-300">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={updateMutation.isPending} className="bg-zinc-900 hover:bg-zinc-800 text-white">
                                {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
