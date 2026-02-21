'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Payment } from '@prisma/client';
import {
    CreditCard,
    Plus,
    Trash2,
    Banknote,
    ArrowDownToLine,
    CheckCircle2,
    Clock,
    AlertCircle,
    Loader2,
} from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

// ─── Constantes ────────────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
    { value: 'CASH',     label: 'Efectivo' },
    { value: 'TRANSFER', label: 'Transferencia' },
    { value: 'CARD',     label: 'Tarjeta' },
    { value: 'CHECK',    label: 'Cheque' },
    { value: 'OTHER',    label: 'Otro' },
] as const;

type PaymentMethod = typeof PAYMENT_METHODS[number]['value'];

const PAYMENT_STATUS_CONFIG: Record<string, {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    className: string;
}> = {
    UNPAID:  { label: 'Sin pago',         icon: AlertCircle,   className: 'bg-red-50 text-red-700 border-red-200' },
    PARTIAL: { label: 'Abono parcial',    icon: Clock,         className: 'bg-amber-50 text-amber-700 border-amber-200' },
    PAID:    { label: 'Pagado',           icon: CheckCircle2,  className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

// ─── Props ─────────────────────────────────────────────────────────────────────

interface PaymentsSectionProps {
    rentalId: string;
}

// ─── Componente principal ──────────────────────────────────────────────────────

export function PaymentsSection({ rentalId }: PaymentsSectionProps) {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState<PaymentMethod>('CASH');
    const [notes, setNotes] = useState('');
    const [showForm, setShowForm] = useState(false);

    const utils = trpc.useUtils();

    const { data, isLoading } = trpc.payment.getByRental.useQuery({ rentalId });

    const createMutation = trpc.payment.create.useMutation({
        onSuccess: () => {
            toast.success('Abono registrado correctamente');
            setAmount('');
            setNotes('');
            setShowForm(false);
            utils.payment.getByRental.invalidate({ rentalId });
            utils.rental.getById.invalidate({ id: rentalId });
        },
        onError: (err) => toast.error('Error al registrar abono: ' + err.message),
    });

    const deleteMutation = trpc.payment.delete.useMutation({
        onSuccess: () => {
            toast.success('Pago eliminado');
            utils.payment.getByRental.invalidate({ rentalId });
            utils.rental.getById.invalidate({ id: rentalId });
        },
        onError: (err) => toast.error('Error al eliminar pago: ' + err.message),
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const parsed = parseFloat(amount);
        if (!parsed || parsed <= 0) {
            toast.error('Ingresa un monto válido');
            return;
        }
        createMutation.mutate({
            rentalId,
            amount: parsed,
            method,
            notes: notes.trim() || undefined,
        });
    }

    // ── Status Badge ──────────────────────────────────────────────────────────

    function PaymentStatusBadge({ status }: { status: string }) {
        const cfg = PAYMENT_STATUS_CONFIG[status] ?? PAYMENT_STATUS_CONFIG.UNPAID;
        const Icon = cfg.icon;
        return (
            <Badge variant="outline" className={`text-xs px-2.5 py-1 font-semibold gap-1.5 ${cfg.className}`}>
                <Icon className="h-3.5 w-3.5" />
                {cfg.label}
            </Badge>
        );
    }

    // ── Loading ───────────────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-zinc-200 p-5 flex items-center justify-center h-32">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
            </div>
        );
    }

    const payments = data?.payments ?? [];
    const totalPaid = data?.totalPaid ?? 0;
    const totalAmount = data?.totalAmount ?? 0;
    const pending = data?.pending ?? 0;
    const paymentStatus = data?.paymentStatus ?? 'UNPAID';

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-zinc-400" />
                    <h2 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">
                        Pagos y Abonos
                    </h2>
                    <PaymentStatusBadge status={paymentStatus} />
                </div>
                {!showForm && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                        onClick={() => setShowForm(true)}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Registrar abono
                    </Button>
                )}
            </div>

            {/* Resumen de montos */}
            <div className="grid grid-cols-3 divide-x divide-zinc-100 border-b border-zinc-100">
                <div className="px-5 py-3 text-center">
                    <p className="text-xs text-zinc-500 mb-1">Total del evento</p>
                    <p className="text-base font-bold text-zinc-900 tabular-nums">
                        ${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="px-5 py-3 text-center">
                    <p className="text-xs text-zinc-500 mb-1">Pagado</p>
                    <p className="text-base font-bold text-emerald-600 tabular-nums">
                        ${totalPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="px-5 py-3 text-center">
                    <p className="text-xs text-zinc-500 mb-1">Saldo pendiente</p>
                    <p className={`text-base font-bold tabular-nums ${pending > 0 ? 'text-red-600' : 'text-zinc-400'}`}>
                        ${pending.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            {/* Formulario de nuevo abono */}
            {showForm && (
                <form onSubmit={handleSubmit} className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                    <p className="text-sm font-medium text-zinc-700 mb-3">Nuevo abono</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Monto */}
                        <div className="flex-1 min-w-0">
                            <label className="text-xs text-zinc-500 mb-1 block">Monto *</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
                                <Input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="pl-7 bg-white"
                                    required
                                />
                            </div>
                        </div>

                        {/* Método */}
                        <div className="w-full sm:w-44">
                            <label className="text-xs text-zinc-500 mb-1 block">Método</label>
                            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                                <SelectTrigger className="bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAYMENT_METHODS.map((m) => (
                                        <SelectItem key={m.value} value={m.value}>
                                            {m.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Notas */}
                        <div className="flex-1 min-w-0">
                            <label className="text-xs text-zinc-500 mb-1 block">Referencia (opcional)</label>
                            <Input
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Número de transferencia, notas..."
                                className="bg-white"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 mt-3 justify-end">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setShowForm(false);
                                setAmount('');
                                setNotes('');
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={createMutation.isPending}
                            className="bg-zinc-900 hover:bg-zinc-800 text-white gap-1.5"
                        >
                            {createMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <ArrowDownToLine className="h-4 w-4" />
                            )}
                            Guardar abono
                        </Button>
                    </div>
                </form>
            )}

            {/* Lista de pagos */}
            {payments.length === 0 ? (
                <div className="px-5 py-10 text-center text-zinc-400">
                    <Banknote className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Sin pagos registrados</p>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow className="bg-zinc-50 border-zinc-100">
                            <TableHead className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Fecha</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Método</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Referencia</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Monto</TableHead>
                            <TableHead className="w-10" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments.map((payment: Payment) => {
                            const methodLabel = PAYMENT_METHODS.find(m => m.value === payment.method)?.label ?? payment.method;
                            return (
                                <TableRow key={payment.id} className="border-zinc-100 hover:bg-zinc-50/40">
                                    <TableCell className="text-sm text-zinc-600">
                                        {format(new Date(payment.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-medium">
                                            {methodLabel}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm text-zinc-400 max-w-xs truncate">
                                        {payment.notes ?? '—'}
                                    </TableCell>
                                    <TableCell className="text-right text-sm font-semibold text-emerald-600 tabular-nums">
                                        +${payment.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell>
                                        <button
                                            onClick={() => deleteMutation.mutate({ id: payment.id })}
                                            disabled={deleteMutation.isPending}
                                            className="p-1 rounded hover:bg-red-50 text-zinc-300 hover:text-red-500 transition-colors"
                                            title="Eliminar pago"
                                        >
                                            {deleteMutation.isPending ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-3.5 w-3.5" />
                                            )}
                                        </button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            )}

            {/* Barra de progreso de pago */}
            {totalAmount > 0 && (
                <div className="px-5 py-3 border-t border-zinc-100">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 bg-zinc-100 rounded-full h-2 overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min((totalPaid / totalAmount) * 100, 100)}%` }}
                            />
                        </div>
                        <span className="text-xs font-semibold text-zinc-500 tabular-nums shrink-0">
                            {Math.round((totalPaid / totalAmount) * 100)}%
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
