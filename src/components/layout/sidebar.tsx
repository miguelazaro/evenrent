'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Calendar,
    Package,
    Users,
    Settings,
    LogOut,
    PanelLeft,
    BarChart3,
} from 'lucide-react';

interface NavItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
    { href: '/',           label: 'Panel Principal',     icon: LayoutDashboard },
    { href: '/eventos',    label: 'Eventos',             icon: Calendar },
    { href: '/inventory',  label: 'Inventario & Bodega', icon: Package },
    { href: '/clients',    label: 'Cartera de Clientes', icon: Users },
    { href: '/analytics',  label: 'Analítica',           icon: BarChart3 },
    { href: '/settings',   label: 'Configuración',       icon: Settings },
];

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const userName = session?.user?.name ?? 'Usuario';
    const userInitials = userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
    const ROLE_LABEL: Record<string, string> = {
        OWNER: 'Propietario', ADMIN: 'Administrador', MANAGER: 'Gerente', STAFF: 'Staff',
    };
    const userRole = ROLE_LABEL[(session?.user as any)?.role ?? ''] ?? 'Usuario';

    return (
        <aside
            className={cn(
                'flex flex-col h-screen border-r border-zinc-200 bg-white shrink-0 transition-all duration-200 ease-in-out overflow-hidden',
                collapsed ? 'w-14' : 'w-56'
            )}
        >
            {/* Logo + Toggle */}
            <div className={cn(
                'flex items-center border-b border-zinc-200 shrink-0 h-12',
                collapsed ? 'justify-center px-0' : 'px-4'
            )}>
                {collapsed ? (
                    <button
                        onClick={onToggle}
                        title="Expandir sidebar (Ctrl+B)"
                        className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-700"
                    >
                        <PanelLeft className="h-4 w-4" />
                    </button>
                ) : (
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-md bg-zinc-900 flex items-center justify-center shrink-0">
                                <span className="text-[9px] font-black text-white tracking-tight">ER</span>
                            </div>
                            <div>
                                <p className="text-[13px] font-bold text-zinc-900 leading-none">evenrent</p>
                            </div>
                        </div>
                        <button
                            onClick={onToggle}
                            title="Colapsar sidebar (Ctrl+B)"
                            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-700"
                        >
                            <PanelLeft className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
                {navItems.map((item) => {
                    const isActive =
                        item.href === '/'
                            ? pathname === '/'
                            : pathname === item.href || pathname.startsWith(item.href + '/');
                    const Icon = item.icon;

                    return (
                        <Link key={item.href} href={item.href}>
                            <div
                                title={collapsed ? item.label : undefined}
                                className={cn(
                                    'flex items-center h-9 rounded-md mx-2 mb-0.5 transition-all duration-150 cursor-pointer group',
                                    collapsed ? 'justify-center px-0 w-10' : 'gap-2.5 px-3',
                                    isActive
                                        ? 'bg-zinc-900 text-white'
                                        : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800'
                                )}
                            >
                                <Icon className={cn('shrink-0 transition-none', collapsed ? 'h-4 w-4' : 'h-4 w-4')} />
                                {!collapsed && (
                                    <span className="text-[13px] font-medium truncate">{item.label}</span>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="border-t border-zinc-100 py-3 shrink-0">
                {collapsed ? (
                    <div className="flex flex-col items-center gap-2 px-2">
                        <div className="h-7 w-7 rounded-full bg-zinc-200 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-zinc-600">{userInitials}</span>
                        </div>
                        <button
                            title="Cerrar sesión"
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ) : (
                    <div className="px-3 space-y-1">
                        <div className="flex items-center gap-2.5 px-2 py-2 rounded-md">
                            <div className="h-6 w-6 rounded-full bg-zinc-200 flex items-center justify-center shrink-0">
                                <span className="text-[9px] font-bold text-zinc-600">{userInitials}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-medium text-zinc-800 truncate leading-none">{userName}</p>
                                <p className="text-[10px] text-zinc-400 mt-0.5">{userRole}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] font-medium text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                            <LogOut className="h-3.5 w-3.5 shrink-0" />
                            Cerrar sesión
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
