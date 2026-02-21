/**
 * Seed script para crear datos iniciales en la base de datos
 * Ejecutar con: npx tsx prisma/seed.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de base de datos...');

  // 1. organización demo
  const organization = await prisma.organization.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'EvenRent Demo',
      slug: 'demo',
      plan: 'PRO',
      status: 'ACTIVE',
      maxUsers: 10,
      maxStorage: 5000,
      timezone: 'America/Mexico_City',
      currency: 'MXN',
    },
  });

  console.log('Organización creada:', organization.name);

  // 2. usuario admin
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: organization.id,
        email: 'admin@evenrent.demo',
      },
    },
    update: {},
    create: {
      email: 'admin@evenrent.demo',
      password: hashedPassword,
      name: 'Admin Demo',
      role: 'OWNER',
      organizationId: organization.id,
    },
  });

  console.log('Usuario admin creado:', adminUser.email);

  // 3. algunos clientes de ejemplo
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'María González',
        email: 'maria@example.com',
        phone: '+52 555 123 4567',
        city: 'Ciudad de México',
        address: 'Av. Reforma 123',
        company: 'Eventos Corporativos SA',
        organizationId: organization.id,
        userId: adminUser.id,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Juan Pérez',
        email: 'juan@example.com',
        phone: '+52 555 987 6543',
        city: 'Guadalajara',
        address: 'Calle Juárez 456',
        organizationId: organization.id,
        userId: adminUser.id,
      },
    }),
  ]);

  console.log('Clientes creados:', clients.length);

  // 4. items de inventario
  const inventoryItems = await Promise.all([
    prisma.inventoryItem.create({
      data: {
        name: 'Silla Tiffany Blanca',
        category: 'Mobiliario',
        sku: 'SIL-TIF-BLA-001',
        description: 'Silla clásica para eventos',
        unitCost: 150,
        rentalPrice: 50,
        totalStock: 100,
        availableStock: 100,
        location: 'Bodega A - Sección 1',
        organizationId: organization.id,
        userId: adminUser.id,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        name: 'Mesa Redonda 10 personas',
        category: 'Mobiliario',
        sku: 'MES-RED-10P-001',
        description: 'Mesa redonda con mantel blanco',
        unitCost: 800,
        rentalPrice: 300,
        totalStock: 20,
        availableStock: 20,
        location: 'Bodega A - Sección 2',
        organizationId: organization.id,
        userId: adminUser.id,
      },
    }),
    prisma.inventoryItem.create({
      data: {
        name: 'Centro de Mesa Premium',
        category: 'Decoración',
        sku: 'DEC-CEN-PRE-001',
        description: 'Arreglo floral premium',
        unitCost: 200,
        rentalPrice: 100,
        totalStock: 50,
        availableStock: 50,
        location: 'Bodega B - Refrigerado',
        organizationId: organization.id,
        userId: adminUser.id,
      },
    }),
  ]);

  console.log('Items de inventario creados:', inventoryItems.length);

  // 5. rental de ejemplo
  const rental = await prisma.rental.create({
    data: {
      eventType: 'wedding',
      eventName: 'Boda González-Pérez',
      status: 'CONFIRMED',
      deliveryDate: new Date('2026-03-15T10:00:00'),
      pickupDate: new Date('2026-03-16T08:00:00'),
      totalAmount: 15000,
      paymentStatus: 'PARTIAL',
      notes: 'Evento de 150 personas',
      organizationId: organization.id,
      userId: adminUser.id,
      clientId: clients[0].id,
    },
  });

  console.log('Rental creado:', rental.eventName);


  const rentalItems = await Promise.all([
    prisma.rentalItem.create({
      data: {
        rentalId: rental.id,
        inventoryItemId: inventoryItems[0].id, // Sillas
        quantity: 150,
        unitPrice: 50,
        notes: '150 sillas blancas',
      },
    }),
    prisma.rentalItem.create({
      data: {
        rentalId: rental.id,
        inventoryItemId: inventoryItems[1].id, // Mesas
        quantity: 15,
        unitPrice: 300,
        notes: '15 mesas redondas',
      },
    }),
    prisma.rentalItem.create({
      data: {
        rentalId: rental.id,
        inventoryItemId: inventoryItems[2].id, // Centros de mesa
        quantity: 15,
        unitPrice: 100,
        notes: '15 centros de mesa',
      },
    }),
  ]);

  console.log('Items de rental creados:', rentalItems.length);

  console.log('\nSeed completado exitosamente!\n');
  console.log('Email: admin@evenrent.demo');
  console.log('Password: password123');
  console.log('Organización: EvenRent Demo\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error durante el seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
