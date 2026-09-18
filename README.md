# Las Palmas — Backend (entregable Sprint 0)

API base del sistema integral Las Palmas: Node.js + Express + Prisma + SQLite.
Un único sistema, una única base de datos — Billar, Venta Directa y Licorera
comparten este mismo backend (RN-05).

> **Nota de arquitectura:** los documentos originales del proyecto (`ARQUITECTURA
> GENERAL`, `CONTEXTO MAESTRO`) especificaban MySQL. En Sprint 0 se decidió
> reemplazarlo por **SQLite** como motor oficial (dev y producción). El motivo
> técnico y el detalle de la decisión están en `ESTADO_PROYECTO.md`. No cambia
> nada de la arquitectura LAN: los PCs de Caja y Licorera siguen sin tocar la
> base de datos directamente, solo hablan HTTP con este backend, que corre en
> el PC de Billar.

## Requisitos
- Node.js 18+
- Nada de base de datos que instalar aparte: SQLite es un solo archivo que
  Prisma crea y administra por ti.

## Puesta en marcha
1. `npm install`
2. Ya incluye un `.env` con valores reales funcionando (SQLite local + un `JWT_SECRET`
   generado de forma segura) — no necesitas copiar ni editar nada para arrancar.
3. `npx prisma migrate dev --name init` — crea el archivo de base de datos y todas las tablas a partir de `prisma/schema.prisma`.
4. `npx prisma db seed` — carga usuarios base (admin/operador), las 2 barras y la configuración inicial del negocio.
5. `npm run dev` — levanta la API en `http://localhost:4000` (activa automáticamente el modo WAL de SQLite al iniciar).

Si en algún momento quieres un `JWT_SECRET` distinto (por ejemplo, uno propio para
cuando esto se instale en el PC de Billar real, separado del de desarrollo), corre
`npm run generate:secret` y pega el resultado en tu `.env` — es opcional, no bloquea nada.

## Respaldo (producción, PC de Billar)
La base de datos completa es el archivo apuntado por `DATABASE_URL` (más los
archivos `-wal` y `-shm` que lo acompañan en modo WAL). Un respaldo automático
consiste simplemente en copiar esos archivos a otro disco o a la nube con una
tarea programada — no hace falta `mysqldump` ni un servicio de base de datos
corriendo aparte. Esto se formaliza en Sprint 10 (HU-48).

## Endpoints de este sprint
- `GET /health` — chequeo de vida del servicio.
- `POST /auth/login` — HU-01. Body: `{ "email": "...", "password": "..." }`. Responde `{ token, usuario }`.

Rutas protegidas de sprints futuros ya tienen su lugar reservado (comentado) en `src/app.ts`,
usando los middlewares `requireAuth` y `requireRole` de `src/middlewares/auth.middleware.ts`.

## Usuarios de prueba (creados por el seed)
| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@laspalmas.com | adminlaspalmas |
| Operador | operador@laspalmas.com | operadorlaspalmas |

(Son las mismas credenciales que ya usaba el prototipo de frontend — HU-01
las valida ahora contra la base de datos real en vez de estar hardcodeadas.)

## Estructura
```
prisma/
  schema.prisma       modelo ER completo (congelado en Sprint 0)
  seed.ts             datos base para desarrollo
src/
  config/
    env.ts             lectura y validación de variables de entorno
    prisma.ts           cliente Prisma único
  utils/
    hash.ts              bcrypt
    jwt.ts                firmar/verificar tokens
  middlewares/
    auth.middleware.ts   requireAuth, requireRole
    errorHandler.ts
  modules/
    auth/                HU-01: login
  app.ts                 configuración de Express y montaje de rutas
  server.ts               punto de entrada
```

Ver `ESTADO_PROYECTO.md` en la raíz del proyecto para el resumen completo
de decisiones y el estado general (no solo del backend).
