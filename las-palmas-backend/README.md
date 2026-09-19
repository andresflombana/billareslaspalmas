# Las Palmas — Backend (Sprint 1: Mesas y Barra)

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
3. `npx prisma migrate dev` — crea la base de datos (o la actualiza) aplicando las
   migraciones de `prisma/migrations` (Sprint 0: `init`; Sprint 1: `mesa_activa`).
4. `npx prisma db seed` — carga usuarios base (admin/operador), las 2 barras, la
   configuración inicial del negocio y 8 mesas de desarrollo.
5. `npm run dev` — levanta la API en `http://localhost:4000` (activa automáticamente el modo WAL de SQLite al iniciar).
6. `npm test` — (opcional) corre las pruebas automáticas contra una base de prueba aparte (`prisma/test.db`); nunca toca `dev.db`.

Si en algún momento quieres un `JWT_SECRET` distinto (por ejemplo, uno propio para
cuando esto se instale en el PC de Billar real, separado del de desarrollo), corre
`npm run generate:secret` y pega el resultado en tu `.env` — es opcional, no bloquea nada.

## Respaldo (producción, PC de Billar)
La base de datos completa es el archivo apuntado por `DATABASE_URL` (más los
archivos `-wal` y `-shm` que lo acompañan en modo WAL). Un respaldo automático
consiste simplemente en copiar esos archivos a otro disco o a la nube con una
tarea programada — no hace falta `mysqldump` ni un servicio de base de datos
corriendo aparte. Esto se formaliza en Sprint 10 (HU-48).

## Endpoints
Todas las rutas (salvo `/health` y `/auth/login`) exigen `Authorization: Bearer <token>`.
Los errores responden `{ "error": "mensaje para mostrar", "code": "CODIGO_ESTABLE" }`.

| Método | Ruta | Rol | Historia |
|---|---|---|---|
| GET | `/health` | — | chequeo de vida |
| POST | `/auth/login` | — | HU-01 |
| GET | `/auth/me` | todos | HU-01 (restaurar sesión al refrescar) |
| GET | `/tables` | todos | HU-06 (`?incluirInactivas=true` solo Administrador) |
| GET | `/tables/:id` | todos | detalle |
| POST | `/tables` | Administrador | CRUD: `{ nombre, zona, tarifaPorMinuto? }` (sin tarifa → la del negocio) |
| PUT | `/tables/:id` | Administrador | CRUD: `{ nombre, zona, tarifaPorMinuto }` |
| POST | `/tables/:id/open` | todos | HU-07: abrir mesa |
| PATCH | `/tables/:id/status` | Administrador | HU-08: `{ estado: "LIBRE" \| "FUERA_SERVICIO", motivo }` (motivo obligatorio para fuera de servicio) |
| POST | `/tables/:id/cancel-opening` | Administrador | anular apertura: `{ motivo }` |
| PATCH | `/tables/:id/active` | Administrador | baja / alta lógica: `{ activa, motivo? }` |
| GET | `/bars` | todos | HU-16/17: barras con sus cuentas abiertas |
| POST | `/bars/:id/open` · `/bars/:id/close` | todos | HU-16 |
| POST | `/bars/:id/accounts` | todos | HU-17: `{ etiqueta? }` (sin etiqueta → "Cuenta N") |
| POST | `/bar-accounts/:id/cancel` | todos | cancelar una cuenta vacía abierta por error |

### Reglas que garantiza el backend
- **Abrir mesa (HU-07)** es una sola transacción: la mesa pasa a `OCUPADA` con
  `startedAt` = reloj del servidor, se crea su `Venta` `ABIERTA` con la tarifa
  congelada (RN-02) y el usuario que abrió, y se registra en `AuditLog`.
- **Concurrencia entre PCs**: los cambios de estado usan `UPDATE ... WHERE estado = <esperado>`.
  Si dos equipos abren la misma mesa a la vez, solo uno lo logra; el otro recibe 409.
  Además, Prisma usa una sola conexión a SQLite (`connection_limit=1`, ver `src/config/prisma.ts`),
  así que las escrituras nunca chocan ("database is locked").
- **Roles (HU-03)**: las rutas de Administrador se validan en el backend con `requireRole`.
- **Barra**: cada barra abre/cierra por separado; no se cierra con cuentas abiertas;
  cada cuenta nace con su propia `Venta` `ABIERTA` (origen `BARRA`, caja `BILLAR`).
- **Anular apertura / cancelar cuenta**: solo sin consumos (preparado para Sprint 3).
- Toda acción de Mesas y Barra queda en `AuditLog` (quién, cuándo, antes/después, motivo).

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
  schema.prisma       modelo ER (congelado en Sprint 0; Sprint 1 agrega Mesa.activa)
  migrations/         init (Sprint 0), mesa_activa (Sprint 1)
  seed.ts             datos base para desarrollo
scripts/
  test.js             corre las pruebas contra prisma/test.db
tests/
  sprint1.test.ts     pruebas automáticas de la API (npm test)
src/
  config/
    env.ts             lectura y validación de variables de entorno
    prisma.ts           cliente Prisma único
  constants/
    enums.ts             valores válidos de los campos "enum" (SQLite no tiene enums)
    auditoria.ts         entidades y acciones de AuditLog
  utils/
    hash.ts              bcrypt
    jwt.ts               firmar/verificar tokens
    http.ts              HttpError, asyncHandler
    validation.ts        validación de entradas
    request.ts           usuario autenticado de la petición
  middlewares/
    auth.middleware.ts   requireAuth, requireRole
    errorHandler.ts
  modules/                capas: routes → controller → service → repository → Prisma
    auth/                HU-01: login, /auth/me
    tables/              Sprint 1: mesas (HU-06, HU-07, HU-08, CRUD, anular apertura, baja lógica)
    bars/                Sprint 1: barras y cuentas (HU-16, HU-17)
    ventas/              acceso compartido a Venta (mesas y barra)
    audit/               registro en AuditLog
  app.ts                 configuración de Express y montaje de rutas
  server.ts               punto de entrada
```

Ver `ESTADO_PROYECTO.md` en la raíz del proyecto para el resumen completo
de decisiones y el estado general (no solo del backend).
