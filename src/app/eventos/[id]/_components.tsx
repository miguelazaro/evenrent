import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { STATUS_CONFIG } from './_config';

// ─── StatusBadge ──────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
    return (
        <Badge variant="outline" className={`text-sm px-3 py-1 font-semibold ${cfg.className}`}>
            {cfg.label}
        </Badge>
    );
}

// ─── InfoCard ─────────────────────────────────────────────────────────────────

export function InfoCard({
    icon: Icon,
    label,
    value,
    sub,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    sub?: string;
}) {
    return (
        <div className="bg-white rounded-xl border border-zinc-200 p-4 flex items-start gap-3">
            <div className="rounded-lg bg-zinc-100 p-2 mt-0.5 shrink-0">
                <Icon className="h-4 w-4 text-zinc-600" />
            </div>
            <div className="min-w-0">
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-zinc-900 truncate">{value}</p>
                {sub && <p className="text-xs text-zinc-500 mt-0.5 truncate">{sub}</p>}
            </div>
        </div>
    );
}

// ─── DetailSkeleton ───────────────────────────────────────────────────────────

export function DetailSkeleton() {
    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
            <Skeleton className="h-8 w-36" />
            <div className="space-y-2">
                <Skeleton className="h-9 w-72" />
                <Skeleton className="h-5 w-48" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
            </div>
            <Skeleton className="h-56 rounded-xl" />
        </div>
    );
}
