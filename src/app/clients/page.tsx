'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClientsList, CreateClientDialog } from '@/features/clients/components';

export default function ClientsPage() {
    const [dialogOpen, setDialogOpen] = useState(false);

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-zinc-900">Cartera de Clientes</h1>
                    <p className="text-sm text-zinc-600">
                        Administra los clientes de tu organización
                    </p>
                </div>
                <Button
                    onClick={() => setDialogOpen(true)}
                    className="bg-zinc-900 hover:bg-zinc-800 text-white"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Cliente
                </Button>
            </div>

            {/* Lista */}
            <ClientsList />

            <CreateClientDialog open={dialogOpen} onOpenChange={setDialogOpen} />
        </div>
    );
}
