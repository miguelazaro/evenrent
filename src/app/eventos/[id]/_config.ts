export const EVENT_TYPE_LABELS: Record<string, string> = {
    wedding:     'Boda',
    corporate:   'Corporativo',
    birthday:    'Cumpleaños',
    anniversary: 'Aniversario',
    graduation:  'Graduación',
    other:       'Otro',
};

export const CATEGORY_LABELS: Record<string, string> = {
    mesas:       'Mesas',
    sillas:      'Sillas',
    manteleria:  'Mantelería',
    iluminacion: 'Iluminación',
    vajilla:     'Vajilla',
    decoracion:  'Decoración',
    audio_video: 'Audio/Video',
    carpas:      'Carpas',
    otro:        'Otro',
};

export const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    PENDING:     { label: 'Pendiente',   className: 'bg-amber-50 text-amber-700 border-amber-200' },
    CONFIRMED:   { label: 'Confirmado',  className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    IN_PROGRESS: { label: 'En Progreso', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    COMPLETED:   { label: 'Completado',  className: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
    CANCELLED:   { label: 'Cancelado',   className: 'bg-red-50 text-red-700 border-red-200' },
};

export const STATUS_TRANSITIONS: Record<string, { value: string; label: string }[]> = {
    PENDING:     [{ value: 'CONFIRMED', label: 'Confirmar' }, { value: 'CANCELLED', label: 'Cancelar' }],
    CONFIRMED:   [{ value: 'IN_PROGRESS', label: 'Iniciar entrega' }, { value: 'CANCELLED', label: 'Cancelar' }],
    IN_PROGRESS: [{ value: 'COMPLETED', label: 'Marcar completado' }, { value: 'CANCELLED', label: 'Cancelar' }],
    COMPLETED:   [],
    CANCELLED:   [{ value: 'PENDING', label: 'Reactivar' }],
};
