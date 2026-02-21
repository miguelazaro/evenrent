'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InventoryList, CreateInventoryDialog } from '@/features/inventory/components';

export default function InventoryPage() {
    const [createOpen, setCreateOpen] = useState(false);

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-zinc-900">Inventario & Bodega</h1>
                    <p className="text-zinc-500">Gestiona los artículos disponibles para renta</p>
                </div>
                <Button
                    onClick={() => setCreateOpen(true)}
                    className="bg-zinc-900 hover:bg-zinc-800 text-white h-10 px-4 flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Nuevo Artículo
                </Button>
            </div>

            <InventoryList />
            <CreateInventoryDialog open={createOpen} onOpenChange={setCreateOpen} />
        </div>
    );
}
