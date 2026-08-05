'use client';

import { Suspense, useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { LogIn, AlertCircle } from 'lucide-react';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Leer error desde URL (?error=CredentialsSignin)
    useEffect(() => {
        const urlError = searchParams.get('error');
        if (urlError) setError(getErrorMessage(urlError));
    }, [searchParams]);

    function getErrorMessage(errorCode: string | undefined | null): string {
        switch (errorCode) {
            case 'CredentialsSignin':
            case 'credentials':
                return 'Email o contraseña incorrectos. Verifica tus datos.';
            case 'Organización suspendida o cancelada':
            case 'AccessDenied':
                return 'Tu cuenta está suspendida. Contacta al administrador.';
            case 'Configuration':
                return 'Error de configuración del servidor. Intenta más tarde.';
            default:
                return errorCode
                    ? 'Email o contraseña incorrectos. Verifica tus datos.'
                    : 'No se pudo iniciar sesión. Intenta de nuevo.';
        }
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        if (!email.trim()) { setError('Ingresa tu correo electrónico.'); return; }
        if (!password)     { setError('Ingresa tu contraseña.'); return; }

        setIsLoading(true);
        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (!result?.ok || result?.error) {
                setError(getErrorMessage(result?.error));
                return;
            }

            router.push('/');
            router.refresh();
        } catch {
            setError('Error de conexión. Intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-zinc-900 mb-4">
                        <LogIn className="h-7 w-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900">EvenRent</h1>
                    <p className="text-sm text-zinc-600 mt-2">Inicia sesión en tu cuenta</p>
                </div>

                {/* Form Card */}
                <div className="bg-zinc-50 border-2 border-zinc-200 rounded-xl p-8 shadow-lg">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                <p className="text-[13px] text-red-700 font-medium">{error}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-semibold text-zinc-900">
                                Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="correo@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-11 border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-semibold text-zinc-900">
                                Contraseña
                            </label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-11 border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold shadow-lg"
                        >
                            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-zinc-600">
                            ¿No tienes cuenta?{' '}
                            <Link href="/register" className="text-zinc-900 hover:underline font-semibold">
                                Regístrate aquí
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-zinc-400 mt-8">
                    © 2026 EvenRent. Todos los derechos reservados.
                </p>
            </div>
        </div>
    );
}

function LoginFallback() {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="h-8 w-8 rounded-full border-2 border-zinc-200 border-t-zinc-900 animate-spin" />
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginFallback />}>
            <LoginForm />
        </Suspense>
    );
}
