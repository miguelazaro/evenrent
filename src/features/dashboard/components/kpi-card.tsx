'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KPICardProps {
    label: string;
    value: string | number;
    subtext?: string;
    iconName: 'calendar' | 'package' | 'check-circle' | 'trending-up';
    variant?: 'default' | 'warning' | 'success' | 'accent';
}

export function KPICard({
    label,
    value,
    subtext,
    iconName,
    variant = 'default',
}: KPICardProps) {


    const variantClasses = {
        default: 'border-zinc-200 bg-white',
        warning: 'border-zinc-200 bg-white', 
        success: 'border-zinc-200 bg-white',
        accent:  'border-zinc-200 bg-white',
    };

    const iconClasses = {
        default: 'text-white bg-zinc-900',
        warning: 'text-white bg-zinc-900',
        success: 'text-white bg-zinc-900',
        accent:  'text-white bg-zinc-900',
    };

    const textClasses = {
        default: 'text-zinc-500',
        warning: 'text-zinc-500',
        success: 'text-zinc-500',
        accent:  'text-zinc-500',
    };

    const valueClasses = {
        default: 'text-zinc-900',
        warning: 'text-amber-500',
        success: 'text-zinc-900',
        accent:  'text-emerald-600',
    };

    const renderIcon = () => {
        switch (iconName) {
            case 'calendar':
                return (
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                );
            case 'package':
                return (
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 015.646 5.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                );
            case 'check-circle':
                return (
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'trending-up':
                return (
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <Card className={cn('p-6 shadow-sm border overflow-hidden', variantClasses[variant])}>
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className={cn('text-xs font-semibold uppercase tracking-wider', textClasses[variant])}>{label}</p>
                    <div className="space-y-1">
                        <p className={cn('text-3xl font-bold', valueClasses[variant])}>{value}</p>
                        {subtext && (
                            <p className={cn('text-xs', textClasses[variant])}>{subtext}</p>
                        )}
                    </div>
                </div>
                <div className={cn('p-3 rounded-lg', iconClasses[variant])}>
                    {renderIcon()}
                </div>
            </div>
        </Card>
    );
}