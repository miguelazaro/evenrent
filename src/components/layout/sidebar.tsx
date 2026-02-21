'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    Calendar,
    Package,
    Users,
    Settings,
    ChevronRight,
    Menu,
    X,
    LogOut,
} from 'lucide-react';

interface NavItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
    {
        href: '/',
        label: 'Panel Principal',
        icon: LayoutDashboard,
    },
    {
        href: '/eventos',
        label: 'Eventos',
        icon: Calendar,
    },
    {
        href: '/inventory',
        label: 'Inventario & Bodega',
        icon: Package,
    },
    {
        href: '/clients',
        label: 'Cartera de Clientes',
        icon: Users,
    },
    {
        href: '/settings',
        label: 'Configuración',
        icon: Settings,
    },
];

export function Sidebar() {
    const [isOpen, setIsOpen] = useState(true);
    const pathname = usePathname();

    return (
        <>
            {/* Mobile toggle */}
            <div className="fixed top-4 left-4 z-50 md:hidden">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(!isOpen)}
                    className="h-10 w-10"
                >
                    {isOpen ? (
                        <X className="h-5 w-5" />
                    ) : (
                        <Menu className="h-5 w-5" />
                    )}
                </Button>
            </div>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed left-0 top-0 h-screen w-64 border-r border-zinc-200 bg-white transition-transform duration-300 ease-in-out z-40 md:translate-x-0',
                    !isOpen && '-translate-x-full'
                )}
            >
                {/* Header */}
                <div className="flex flex-col h-full">
                    <div className="px-6 py-6 border-b border-zinc-100">
                        <h1 className="text-xl font-bold text-zinc-900">EventRent Pro</h1>
                        <p className="text-xs text-zinc-500 mt-1">Sistema de Gestión</p>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
                        {navItems.map((item) => {
                            const isActive =
                                item.href === '/'
                                    ? pathname === '/'
                                    : pathname === item.href || pathname.startsWith(item.href + '/');
                            const Icon = item.icon;

                            return (
                                <Link key={item.href} href={item.href}>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className={cn(
                                            'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                                            isActive
                                                ? 'bg-zinc-900 text-white shadow-sm'
                                                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                                        )}
                                    >
                                        <Icon className="h-5 w-5 shrink-0" />
                                        <span className="flex-1 text-left truncate">{item.label}</span>
                                        <ChevronRight className={cn(
                                            'h-4 w-4 shrink-0 transition-opacity',
                                            isActive ? 'opacity-100' : 'opacity-0'
                                        )} />
                                    </button>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="border-t border-zinc-100 px-4 py-4 space-y-2">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-100/70">
                            <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                                <span className="text-xs font-bold text-white">ML</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-zinc-900 truncate">Miguel Lázaro</p>
                                <p className="text-xs text-zinc-500">Administrador</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="text-sm">Cerrar Sesión</span>
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main content margin */}
            <div className="md:ml-64" />
        </>
    );
}
