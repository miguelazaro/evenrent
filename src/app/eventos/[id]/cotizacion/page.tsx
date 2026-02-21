'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { trpc } from '@/lib/trpc/client';
import { APP_CONFIG } from '@/lib/constants/app-config';

// ─── Constantes ────────────────────────────────────────────────────────────────

const EVENT_TYPE_LABELS: Record<string, string> = {
    wedding: 'Boda',
    corporate: 'Corporativo',
    birthday: 'Cumpleaños',
    anniversary: 'Aniversario',
    graduation: 'Graduación',
    other: 'Otro',
};

const CATEGORY_LABELS: Record<string, string> = {
    mesas: 'Mesas',
    sillas: 'Sillas',
    manteleria: 'Mantelería',
    iluminacion: 'Iluminación',
    vajilla: 'Vajilla',
    decoracion: 'Decoración',
    audio_video: 'Audio/Video',
    carpas: 'Carpas',
    otro: 'Otro',
};

const STATUS_LABELS: Record<string, string> = {
    PENDING:     'Pendiente',
    CONFIRMED:   'Confirmado',
    IN_PROGRESS: 'En Progreso',
    COMPLETED:   'Completado',
    CANCELLED:   'Cancelado',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
    UNPAID:  'Sin pago',
    PARTIAL: 'Pago parcial',
    PAID:    'Pagado',
};

// ─── Página de cotización ──────────────────────────────────────────────────────

export default function CotizacionPage() {
    const { id } = useParams<{ id: string }>();

    const { data: rental, isLoading } = trpc.rental.getById.useQuery({ id });
    const { data: paymentData } = trpc.payment.getByRental.useQuery(
        { rentalId: id },
        { enabled: !!id }
    );

    // Auto-print cuando la página cargue completamente
    useEffect(() => {
        if (!rental) return;
        const timer = setTimeout(() => window.print(), 600);
        return () => clearTimeout(timer);
    }, [rental]);

    if (isLoading || !rental) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 mx-auto mb-3" />
                    <p className="text-zinc-500 text-sm">Preparando cotización...</p>
                </div>
            </div>
        );
    }

    const totalAmount = rental.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
    );
    const totalPaid = paymentData?.totalPaid ?? 0;
    const pending = totalAmount - totalPaid;
    const paymentStatus = rental.paymentStatus ?? 'UNPAID';

    const now = new Date();

    return (
        <>
            {/* Estilos para impresión */}
            <style>{`
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    @page { margin: 1.5cm; size: A4; }
                }
                * { box-sizing: border-box; }
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
            `}</style>

            {/* Botón de imprimir (se oculta al imprimir) */}
            <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
                <button
                    onClick={() => window.print()}
                    style={{
                        background: '#18181b',
                        color: 'white',
                        padding: '8px 18px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                    }}
                >
                    Imprimir / Guardar PDF
                </button>
                <button
                    onClick={() => window.close()}
                    style={{
                        background: '#f4f4f5',
                        color: '#3f3f46',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                    }}
                >
                    Cerrar
                </button>
            </div>

            {/* Contenido del PDF */}
            <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 32px', color: '#18181b' }}>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px' }}>
                    <tbody>
                        <tr>
                            <td style={{ verticalAlign: 'top' }}>
                                <div style={{ fontSize: '24px', fontWeight: '800', color: '#18181b', letterSpacing: '-0.5px' }}>
                                    {APP_CONFIG.name}
                                </div>
                                <div style={{ fontSize: '12px', color: '#71717a', marginTop: '4px' }}>
                                    Sistema de gestión de eventos
                                </div>
                            </td>
                            <td style={{ verticalAlign: 'top', textAlign: 'right' }}>
                                <div style={{ fontSize: '20px', fontWeight: '700', color: '#18181b' }}>COTIZACIÓN</div>
                                <div style={{ fontSize: '11px', color: '#71717a', marginTop: '4px' }}>
                                    #{rental.id.slice(0, 8).toUpperCase()}
                                </div>
                                <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>
                                    {format(now, "d 'de' MMMM, yyyy", { locale: es })}
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div style={{ borderTop: '2px solid #18181b', marginBottom: '24px' }} />

                {/* Información del evento y cliente */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                    <tbody>
                        <tr>
                            {/* Evento */}
                            <td style={{ verticalAlign: 'top', width: '48%' }}>
                                <div style={{ fontSize: '11px', fontWeight: '600', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                                    Información del Evento
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: '700', color: '#18181b', marginBottom: '4px' }}>
                                    {rental.eventName}
                                </div>
                                <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '3px' }}>
                                    Tipo: {EVENT_TYPE_LABELS[rental.eventType] ?? rental.eventType}
                                </div>
                                <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '3px' }}>
                                    Entrega: {format(new Date(rental.deliveryDate), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                                </div>
                                {rental.pickupDate && (
                                    <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '3px' }}>
                                        Recolección: {format(new Date(rental.pickupDate), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                                    </div>
                                )}
                                <div style={{ marginTop: '8px' }}>
                                    <span style={{
                                        display: 'inline-block',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        padding: '2px 10px',
                                        borderRadius: '9999px',
                                        background: '#f4f4f5',
                                        color: '#3f3f46',
                                    }}>
                                        {STATUS_LABELS[rental.status] ?? rental.status}
                                    </span>
                                </div>
                            </td>

                            <td style={{ width: '4%' }} />

                            {/* Cliente */}
                            <td style={{ verticalAlign: 'top', width: '48%' }}>
                                <div style={{ fontSize: '11px', fontWeight: '600', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                                    Datos del Cliente
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#18181b', marginBottom: '4px' }}>
                                    {rental.client.name}
                                </div>
                                {rental.client.company && (
                                    <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '3px' }}>
                                        {rental.client.company}
                                    </div>
                                )}
                                <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '3px' }}>
                                    {rental.client.phone}
                                </div>
                                <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '3px' }}>
                                    {rental.client.email}
                                </div>
                                {rental.client.city && (
                                    <div style={{ fontSize: '12px', color: '#71717a' }}>
                                        {rental.client.city}
                                    </div>
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Tabla de artículos */}
                {rental.items.length > 0 && (
                    <>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                            Artículos
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                            <thead>
                                <tr style={{ background: '#18181b' }}>
                                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Artículo</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Categoría</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cant.</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Precio Unit.</th>
                                    <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rental.items.map((item, idx) => (
                                    <tr key={item.id} style={{ background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                                        <td style={{ padding: '8px 12px', fontSize: '12px', color: '#18181b', fontWeight: '500', borderBottom: '1px solid #f4f4f5' }}>
                                            {item.inventoryItem.name}
                                        </td>
                                        <td style={{ padding: '8px 12px', fontSize: '12px', color: '#71717a', borderBottom: '1px solid #f4f4f5' }}>
                                            {CATEGORY_LABELS[item.inventoryItem.category] ?? item.inventoryItem.category}
                                        </td>
                                        <td style={{ padding: '8px 12px', fontSize: '12px', color: '#18181b', textAlign: 'right', borderBottom: '1px solid #f4f4f5', fontVariantNumeric: 'tabular-nums' }}>
                                            {item.quantity}
                                        </td>
                                        <td style={{ padding: '8px 12px', fontSize: '12px', color: '#3f3f46', textAlign: 'right', borderBottom: '1px solid #f4f4f5', fontVariantNumeric: 'tabular-nums' }}>
                                            ${item.unitPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td style={{ padding: '8px 12px', fontSize: '12px', fontWeight: '600', color: '#18181b', textAlign: 'right', borderBottom: '1px solid #f4f4f5', fontVariantNumeric: 'tabular-nums' }}>
                                            ${(item.quantity * item.unitPrice).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}

                {/* Totales */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '28px' }}>
                    <tbody>
                        <tr>
                            <td style={{ width: '55%' }} />
                            <td style={{ width: '45%' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <tbody>
                                        <tr>
                                            <td style={{ padding: '5px 12px', fontSize: '12px', color: '#71717a' }}>Subtotal</td>
                                            <td style={{ padding: '5px 12px', fontSize: '12px', color: '#3f3f46', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                                ${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                        {totalPaid > 0 && (
                                            <tr>
                                                <td style={{ padding: '5px 12px', fontSize: '12px', color: '#71717a' }}>Pagado</td>
                                                <td style={{ padding: '5px 12px', fontSize: '12px', color: '#16a34a', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                                    -${totalPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        )}
                                        <tr>
                                            <td colSpan={2} style={{ padding: '4px 12px' }}>
                                                <div style={{ borderTop: '2px solid #18181b' }} />
                                            </td>
                                        </tr>
                                        <tr style={{ background: '#18181b', borderRadius: '6px' }}>
                                            <td style={{ padding: '10px 12px', fontSize: '14px', fontWeight: '700', color: 'white' }}>
                                                {totalPaid > 0 ? 'Saldo Pendiente' : 'Total'}
                                            </td>
                                            <td style={{ padding: '10px 12px', fontSize: '14px', fontWeight: '700', color: 'white', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                                ${(totalPaid > 0 ? pending : totalAmount).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Notas */}
                {rental.notes && (
                    <div style={{ background: '#fafafa', border: '1px solid #e4e4e7', borderRadius: '8px', padding: '14px 16px', marginBottom: '24px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                            Notas
                        </div>
                        <div style={{ fontSize: '12px', color: '#3f3f46', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                            {rental.notes}
                        </div>
                    </div>
                )}

                {/* Estado de pago */}
                <div style={{ borderTop: '1px solid #e4e4e7', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#a1a1aa' }}>
                        Generado el {format(now, "d 'de' MMMM yyyy, HH:mm", { locale: es })} · {APP_CONFIG.name}
                    </div>
                    <div style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        background: paymentStatus === 'PAID' ? '#dcfce7' : paymentStatus === 'PARTIAL' ? '#fef9c3' : '#fee2e2',
                        color: paymentStatus === 'PAID' ? '#15803d' : paymentStatus === 'PARTIAL' ? '#854d0e' : '#b91c1c',
                    }}>
                        {PAYMENT_STATUS_LABELS[paymentStatus] ?? paymentStatus}
                    </div>
                </div>

            </div>
        </>
    );
}
