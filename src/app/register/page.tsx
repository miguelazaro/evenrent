'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: '',
        password: '',
        confirmPassword: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear error when user starts typing
        if (error) setError(null);
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            setError('Por favor ingresa tu nombre');
            return false;
        }
        if (!formData.email.trim()) {
            setError('Por favor ingresa tu correo electrónico');
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError('Por favor ingresa un correo válido');
            return false;
        }
        if (!formData.company.trim()) {
            setError('Por favor ingresa el nombre de tu empresa');
            return false;
        }
        if (formData.password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            // Llamar a la API de registro
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    company: formData.company,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Error al registrarse');
                setIsLoading(false);
                return;
            }

            // Registro exitoso
            setSuccess(true);

            // Esperar 1 segundo y luego hacer login automático
            setTimeout(async () => {
                const result = await signIn('credentials', {
                    email: formData.email,
                    password: formData.password,
                    redirect: false,
                });

                if (result?.ok) {
                    router.push('/');
                } else {
                    router.push('/login?registered=true');
                }
            }, 1000);
        } catch (err) {
            setError('Error al registrarse. Por favor intenta de nuevo.');
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-900 px-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-xl p-8 shadow-2xl text-center">
                        <div className="flex justify-center mb-4">
                            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                                <CheckCircle className="h-8 w-8 text-emerald-600" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-900 mb-2">¡Registro Exitoso!</h2>
                        <p className="text-zinc-600 mb-6">Tu cuenta ha sido creada correctamente</p>
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white">Crear Cuenta</h1>
                    <p className="text-sm text-zinc-400 mt-2">Regístrate para comenzar a gestionar tus eventos</p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-xl p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
                                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 inline mr-2" />
                                <span className="text-sm text-red-700 font-medium">{error}</span>
                            </div>
                        )}

                        {/* Nombre Completo */}
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-semibold text-zinc-900">
                                Nombre Completo
                            </label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="Tu nombre completo"
                                value={formData.name}
                                onChange={handleChange}
                                disabled={isLoading}
                                className="h-11 border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-semibold text-zinc-900">
                                Correo Electrónico
                            </label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="tu@email.com"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={isLoading}
                                className="h-11 border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900"
                            />
                        </div>

                        {/* Empresa */}
                        <div className="space-y-2">
                            <label htmlFor="company" className="text-sm font-semibold text-zinc-900">
                                Nombre de la Empresa
                            </label>
                            <Input
                                id="company"
                                name="company"
                                type="text"
                                placeholder="Tu empresa de eventos"
                                value={formData.company}
                                onChange={handleChange}
                                disabled={isLoading}
                                className="h-11 border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900"
                            />
                        </div>

                        {/* Contraseña */}
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-semibold text-zinc-900">
                                Contraseña
                            </label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={isLoading}
                                className="h-11 border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900"
                            />
                        </div>

                        {/* Confirmar Contraseña */}
                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="text-sm font-semibold text-zinc-900">
                                Confirmar Contraseña
                            </label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                placeholder="Repite tu contraseña"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                disabled={isLoading}
                                className="h-11 border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900"
                            />
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 font-semibold shadow-lg mt-6"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Registrando...
                                </>
                            ) : (
                                'Crear Cuenta'
                            )}
                        </Button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-zinc-600">
                            ¿Ya tienes cuenta?{' '}
                            <Link href="/login" className="text-zinc-900 hover:underline font-semibold">
                                Inicia sesión
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
