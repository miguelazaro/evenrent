# EvenRent

Sistema de gestión de eventos y renta de artículos para negocios de eventos (bodas, corporativos, fiestas). Desarrollado como plataforma SaaS orientada a empresas en Latinoamérica.

---

## Stack

- **Next.js 15** con App Router
- **TypeScript**
- **tRPC v11**  API type-safe sin REST ni GraphQL
- **Prisma 5** + **PostgreSQL** (Supabase)
- **NextAuth.js v5**  autenticación con sesiones
- **Tailwind CSS v4** + **Shadcn/ui**
- **Zod** + **React Hook Form**  validación de formularios
- **date-fns** con locale `es-MX`

---

## Funcionalidades implementadas

**Autenticación**
- Registro e inicio de sesión con email/contraseña
- Sesiones protegidas con NextAuth.js
- Middleware de protección de rutas

**Dashboard**
- KPIs en tiempo real: eventos activos, ingresos del mes, clientes totales, artículos en bodega
- Tabla de próximas entregas con navegación directa al evento

**Eventos**
- CRUD completo de eventos
- Vista de lista y calendario
- Detalle de evento con toda la información
- Cambio de estado con flujo lógico: Pendiente  Confirmado  En Progreso  Completado / Cancelado
- Asignación de artículos de inventario con precios y notas

**Control de stock**
- Al crear un evento se descuenta el stock disponible de cada artículo
- Al cancelar o eliminar se restaura el stock automáticamente
- Al editar los artículos asignados se sincroniza el stock (restaura lo anterior, descuenta lo nuevo)
- Todas las operaciones de stock son transacciones atómicas

**Clientes**
- CRUD completo con nombre, teléfono, email, empresa y ciudad

**Inventario / Bodega**
- CRUD completo de artículos con categoría, SKU, precio de renta y stock
- Visualización de stock disponible vs stock total

**Pagos y abonos**
- Registro de abonos por evento con monto, método y referencia
- Cálculo automático de saldo pendiente
- Estado de pago automático: Sin pago / Abono parcial / Pagado
- Barra de progreso de pago en el detalle del evento

**Cotización PDF**
- Página de impresión optimizada por evento (`/eventos/[id]/cotizacion`)
- Incluye datos del evento, cliente, tabla de artículos, totales y estado de pago
- Se dispara `window.print()` automáticamente al abrir

---

## Estructura del proyecto

```
src/
 app/                    # Rutas Next.js (App Router)
    eventos/[id]/       # Detalle del evento
       cotizacion/     # Página de cotización/PDF
    clientes/
    inventory/
    login/ register/
    api/auth/
 features/               # Módulos por dominio
    dashboard/
    rentals/
    inventory/
 server/
    routers/            # tRPC routers: rental, client, inventory, payment, dashboard
 components/
    ui/                 # Componentes Shadcn/ui
    layout/
 lib/
     trpc/
     constants/
     types/
```

---

## Instalación

```bash
npm install
```

Crea un archivo `.env.local` con las siguientes variables:

```
DATABASE_URL=
DIRECT_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

Aplica el schema a la base de datos:

```bash
npx prisma db push
npx prisma generate
```

Inicia el servidor de desarrollo:

```bash
npm run dev
```

---

## Pendiente / Próximas features

- Gráficas de ingresos por mes en el dashboard
- Reportes filtrables por fecha, estado y cliente
- Gestión de múltiples usuarios con roles (Owner, Admin, Manager)
- Notificaciones de eventos próximos y stock bajo
- Deploy en producción (Vercel + Supabase)

---

## Autor

Miguel Lázaro - Fullstack developer 