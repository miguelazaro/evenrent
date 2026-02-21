'use client';

import { Suspense, useState } from 'react';
import { Plus, CalendarDays, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EventsList, EventsCalendar, CreateEventDialog } from '@/features/rentals/components';

function EventsListLoading() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
    );
}

export default function EventosPage() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [view, setView] = useState<'calendar' | 'list'>('calendar');

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-zinc-900">Calendario de Eventos</h1>
                    <p className="text-sm text-zinc-600">
                        Gestiona todos los eventos y rentas de tu organización
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Toggle de vista */}
                    <div className="flex items-center bg-zinc-100 rounded-lg p-1 gap-1">
                        <button
                            onClick={() => setView('calendar')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                view === 'calendar'
                                    ? 'bg-white text-zinc-900 shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-700'
                            }`}
                        >
                            <CalendarDays className="h-4 w-4" />
                            Calendario
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                view === 'list'
                                    ? 'bg-white text-zinc-900 shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-700'
                            }`}
                        >
                            <List className="h-4 w-4" />
                            Lista
                        </button>
                    </div>

                    <Button
                        onClick={() => setDialogOpen(true)}
                        className="bg-zinc-900 hover:bg-zinc-800 text-white"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Evento
                    </Button>
                </div>
            </div>
            <Suspense fallback={<EventsListLoading />}>
                {view === 'calendar' ? <EventsCalendar /> : <EventsList />}
            </Suspense>
            <CreateEventDialog open={dialogOpen} onOpenChange={setDialogOpen} />
        </div>
    );
}
