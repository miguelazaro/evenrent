import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    company: z.string().min(2, 'El nombre de la empresa debe tener al menos 2 caracteres'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = registerSchema.parse(body);
        const { name, email, company, password } = validatedData;

        // Verificar si el email ya existe
        const existingUser = await db.user.findFirst({
            where: {
                email: email.toLowerCase(),
            },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Este correo ya está registrado' },
                { status: 400 }
            );
        }

        // Crear slug de la organización desde el nombre de la empresa
        const slug = company
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remover acentos
            .replace(/[^a-z0-9]+/g, '-') 
            .replace(/^-+|-+$/g, ''); 

        // Verificar si el slug ya existe
        let finalSlug = slug;
        let counter = 1;
        while (await db.organization.findUnique({ where: { slug: finalSlug } })) {
            finalSlug = `${slug}-${counter}`;
            counter++;
        }

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear organización primero
        const organization = await db.organization.create({
            data: {
                name: company,
                slug: finalSlug,
                plan: 'FREE',
                status: 'ACTIVE',
            },
        });

        // Crear usuario administrador
        const user = await db.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
                role: 'ADMIN',
                organizationId: organization.id,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                organizationId: true,
            },
        });

        const result = { organization, user };

        return NextResponse.json(
            {
                success: true,
                message: 'Usuario registrado exitosamente',
                user: {
                    email: result.user.email,
                    name: result.user.name,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error en registro:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.issues[0].message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Error al registrar usuario' },
            { status: 500 }
        );
    }
}
