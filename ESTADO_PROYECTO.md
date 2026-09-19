# ESTADO DEL PROYECTO — Las Palmas

**Último sprint cerrado: Sprint 1 — Mesas y Barra** (19/09/2026)
**Próximo sprint: Sprint 2 — Tiempo** (HU-10, HU-11, HU-09)

> Punto de entrada para cualquier chat nuevo (cada chat = un sprint). Después de
> cada sprint se reemplaza en el conocimiento del proyecto, junto con
> `prisma/schema.prisma`. Un chat nuevo lee este archivo antes de tocar código.
> Proyecto personal de Andrés (no es el proyecto de grado ni de Sebastián).

---

## 1. Reglas de negocio fijas (no se renegocian en ningún sprint)

- **RN-05**: un único inventario, una única base de datos, un único sistema. Billar,
  Venta Directa y Licorera son *contextos operativos*, no sistemas separados.
- Los **tres puntos de caja** reales son Billar, Venta Directa y Licorera. La Barra
  liquida dentro de la caja de Billar; no es un cuarto punto de venta
  (implementado así: cada cuenta de barra nace con `Venta.puntoVenta = BILLAR`, `origen = BARRA`).
- **Precio congelado por línea de venta** (HU-25): `ItemVenta.precioUnitario` se copia,
  no se referencia.
- **Tarifa congelada por sesión de mesa** (RN-02, aplicado en Sprint 1): al abrir una
  mesa, `Venta.tarifaPorMinutoAplicada` copia la tarifa de la mesa en ese momento.
  Cambiar la tarifa de la mesa después no altera una sesión en curso (hay prueba).
- **Cronómetro de mesas**: se calcula siempre como diferencia contra `Mesa.startedAt`
  guardado en base de datos, nunca como contador en memoria. `startedAt` lo pone el
  **reloj del servidor** al abrir (nunca el del navegador).
- **Modelo 3D de mesas**: paramétrico, construido con primitivas por código (Anexo A
  de `LAS PALMAS - PROMPT INTERFAZ MODULO _BILLAR.pdf`). El `.obj` de SketchUp del
  cliente se usó como **referencia directa de diseño** (proporciones, patas hacia
  adentro con bastidor, cojines, troneras con aro) pero **no se carga** en la app.
  Render: WebP estático (libre / ocupada / fuera de servicio) en la cuadrícula
  `/billar`; escena React Three Fiber viva **solo** en el detalle `/billar/:mesaId`.

## 2. Convenciones técnicas vigentes (aplican a todos los sprints)

- **Entregables sin placeholders**: cada proyecto trae `.env` real y funcional +
  `.env.example` idéntico como referencia. `.env` sigue en `.gitignore`. Los scripts
  `.cmd` copian `.env.example` → `.env` si falta.
- **SQLite** (reemplaza MySQL desde Sprint 0). Sin `enum` ni `Json` en Prisma:
  campos `String` validados en la capa de aplicación con `src/constants/enums.ts`.
  **Nunca escribir los strings sueltos**: usar `EstadoMesa.OCUPADA`, `Rol.ADMINISTRADOR`, etc.
  Patrón de cada enum: lista `ESTADOS_X`, tipo `X` y objeto de constantes
  `X = {...} satisfies { [K in X]: K }`; para validar entrada, `comoEnum(lista, valor, nombre)`.
  `AuditLog.detalle` es JSON serializado a mano (`JSON.stringify`).
- **Montos `Int`** en COP, sin decimales.
- **SQLite en WAL + una sola conexión** (`connection_limit=1`, agregado en código en
  `src/config/prisma.ts`, no en `.env`): las escrituras se encolan y nunca chocan con
  "database is locked". Transacciones interactivas siempre con `OPCIONES_TRANSACCION`
  (`maxWait 5000`, `timeout 10000`).
- **Concurrencia entre los 3 PCs**: cambios de estado con `updateMany ... WHERE estado = <esperado>`;
  si `count = 0`, se relee y se responde 409 con el motivo real. Nunca "leer y luego escribir" sin condición.
- **Capas del backend**: `routes → controller → service → repository` por módulo en
  `src/modules/<modulo>/`. Controladores async envueltos en `asyncHandler` (Express 4).
  Los repositorios reciben `db: Db` (cliente normal o de transacción).
- **Contrato de errores**: toda respuesta de error es `{ "error": "mensaje para mostrar", "code": "CODIGO_ESTABLE" }`
  (`HttpError` en `src/utils/http.ts`). El frontend decide por `code`, no por el texto.
  Códigos genéricos: `SOLICITUD_INVALIDA`, `JSON_INVALIDO`, `ID_INVALIDO`, `CAMPO_OBLIGATORIO`,
  `TIPO_INVALIDO`, `FUERA_DE_RANGO`, `TEXTO_MUY_CORTO`, `TEXTO_MUY_LARGO`, `VALOR_NO_PERMITIDO`,
  `NO_AUTENTICADO`, `SESION_INVALIDA`, `SIN_PERMISO`, `NO_ENCONTRADO`, `RUTA_NO_ENCONTRADA`,
  `DUPLICADO` (P2002), `ERROR_INTERNO` (500 sin detalles internos).
- **Auditoría**: toda acción de negocio se registra con `registrarAuditoria(db, …)` dentro de
  la misma transacción. Entidades y acciones centralizadas en `src/constants/auditoria.ts`.
- **Roles (HU-03)**: se validan en el backend con `requireRole(Rol.ADMINISTRADOR)`; la UI
  además oculta lo que el rol no puede hacer.
- **Frontend**: React 18 + Vite 5 + TS + Tailwind v3 + NextUI 2 + design system
  **"Rack & Score"** (`theme.ts`, `tailwind.config.js`) como única fuente de estilo.
  Ruteo con `react-router-dom` 6 (flags v7 activados); datos del servidor con
  **TanStack Query 5** (hooks en `src/api/*.ts`, claves en `src/api/consultas.ts`).
  Todas las llamadas van a rutas relativas `/api/...`; Vite reenvía a `localhost:4000`
  quitando `/api`. **En producción (Sprint 12) Nginx debe hacer lo mismo**:
  `location /api/ { proxy_pass http://127.0.0.1:4000/; }` (la barra final quita el prefijo).
- **Sincronización entre PCs**: `refetchInterval` de 15 s + al volver a la ventana + tras
  cada acción. Sin websockets (suficiente para el criterio de < 30 s).
- **Pruebas**: backend con `node:test` + `fetch` contra el servidor real en un puerto libre
  y una base aparte (`prisma/test.db`, nunca toca `dev.db`). Interfaz con `playwright-core`
  usando el Edge/Chrome instalado (`npm run capturas`).

## 3. Decisiones tomadas en Sprint 1

1. **`Mesa.activa Boolean @default(true)`** — única excepción al "modelo ER congelado".
   Migración `20260919030000_mesa_activa`. "Dar de baja" es lógico (`activa = false`):
   la mesa desaparece de `/billar` y no se puede abrir, pero conserva ventas y auditoría;
   "dar de alta" la devuelve. Es distinto de `FUERA_SERVICIO` (temporal, visible en `/billar`
   con su motivo). Se eligió así porque es lo más útil para los sprints siguientes
   (reportes e historial necesitan las mesas viejas; HU-43 de Sprint 9 lo reutiliza).
2. **Abrir mesa crea su `Venta` `ABIERTA`** (origen `MESA`, caja `BILLAR`, tarifa congelada,
   usuario que abrió) en la misma transacción que pasa la mesa a `OCUPADA`. Cada cuenta de
   barra también nace con su `Venta` `ABIERTA` (origen `BARRA`). Sprint 3 cuelga los
   `ItemVenta` de ese `ventaId` (viene en `MesaDTO.sesion.ventaId` y `CuentaBarraDTO.ventaId`).
3. **Anular apertura** (Andrés: "Hazlo"): solo Administrador, motivo obligatorio (3–200),
   auditada; la mesa vuelve a `LIBRE` y su venta queda `ANULADA`. Si la venta ya tiene
   consumos → 409 `MESA_CON_CONSUMOS` (hay que cobrarla). Igual para cancelar una cuenta
   de barra (`CUENTA_CON_CONSUMOS`).
4. **Estados manuales de mesa**: solo `LIBRE` ↔ `FUERA_SERVICIO` por `PATCH /tables/:id/status`
   (Administrador). `FUERA_SERVICIO` exige motivo; el motivo se guarda en la auditoría y se
   muestra en la tarjeta. Una mesa en juego no se puede poner fuera de servicio ni dar de baja.
   `OCUPADA` solo se alcanza abriendo; `RESERVADA` existe en el schema pero no se usa aún.
5. **Barra**: ambos roles abren/cierran barras y cuentas (HU-16/17 son del Operador).
   No se cierra una barra con cuentas abiertas (409 `BARRA_CON_CUENTAS_ABIERTAS`).
   Etiqueta de cuenta opcional; sin etiqueta → "Cuenta N" con el menor N libre;
   etiqueta repetida en la misma barra → 409 `CUENTA_DUPLICADA` (sin distinguir mayúsculas/tildes).
6. **Nombres de mesa únicos** sin distinguir mayúsculas ni tildes; orden natural
   (Mesa 2 antes que Mesa 10). Crear sin tarifa usa `ConfiguracionNegocio.tarifaPorMinutoDefault`.
7. **Login real** contra `POST /auth/login` (correo sin distinguir mayúsculas ni espacios).
   Sesión en `localStorage`, restaurada con `GET /auth/me` al refrescar (verifica en BD
   que el usuario siga activo). 401 en cualquier llamada → cierra la sesión en la UI.
   Credenciales de desarrollo visibles solo en modo `DEV`.
8. **Modelo 3D**: colores, luces, FOV 32°, dirección de cámara y rotación del Anexo A,
   con el diseño refinado según el modelo de referencia (15 bolas con rayadas, troneras
   con aro metálico, diamantes, patas con bastidor). Intensidades de luz ×π porque
   three ≥ r155 usa unidades físicas. La distancia de cámara se calcula
   (`distanciaParaEncuadrar`) para que la mesa completa quepa. Transición de estado de
   300 ms (colores + bolas). En el detalle **solo la mesa ocupada gira sola**
   (Observaciones finales #6); libre y fuera de servicio quedan quietas en pose de
   reposo; se puede arrastrar para girarla. Sin WebGL → cae a la WebP.
9. **WebP de la cuadrícula**: 520×334, generadas del mismo modelo con
   `npm run export:mesas` (Edge/Chrome sin ventana). Solo se regeneran si cambia el modelo.
10. **Layout `/billar`**: se prioriza HU-06 (sin scroll hasta 10 mesas en 1366×768) sobre
    la fila de KPIs del PDF de interfaz: el resumen va en chips del encabezado de zona
    ("3 de 10 ocupadas", "1 fuera de servicio"). Columnas calculadas según el ancho real
    (ResizeObserver); con más de 10 mesas o varias zonas, pasa a scroll con tarjetas de
    tamaño fijo. Barra 1 y Barra 2 debajo de las mesas. Se mantiene Rack & Score.
11. **Rendimiento**: el detalle de mesa (y three.js, ~820 kB) se carga bajo demanda
    (`React.lazy`); la cuadrícula no monta ningún contexto WebGL.
12. **Configuración → Mesas** (Administrador): tabla con crear / editar / dar de baja / dar de
    alta. **Configuración → Zonas**: vista de zonas derivadas de las mesas (sin tabla propia).

## 4. Correcciones a Sprint 0 encontradas en Sprint 1

- `src/utils/jwt.ts` no compilaba con los tipos reales de `jsonwebtoken` 9
  (`expiresIn` y el cast del payload). Corregido; además `verifyToken` valida que `sub`
  sea número y `rol` sea un rol válido.
- `npm start` apuntaba a `dist/server.js`; la salida real es `dist/src/server.js`. Corregido.
- `errorHandler` devolvía `err.message` al cliente en los 500 (podía filtrar detalles de
  Prisma). Ahora responde genérico (`ERROR_INTERNO`), registra el detalle solo en consola,
  y además traduce JSON roto → 400 `JSON_INVALIDO` y único duplicado (P2002) → 409 `DUPLICADO`.
- `.prisma/client` no venía generado en el zip (lo genera `postinstall`); sin cambios, solo confirmado.

## 5. Verificación real (PC de Andrés, Node v22.11.0, npm 10.9.0)

`verificar-sprint1.cmd` → `verificacion\resumen.txt`: **11/11 pasos en 0**.

| Paso | Resultado |
|---|---|
| b01 npm install (backend) | 0 |
| b02 `prisma migrate deploy` (init + mesa_activa) | 0 |
| b03 `prisma migrate diff --exit-code` (BD = schema) | 0 — "No difference detected" |
| b04 seed (idempotente) | 0 |
| b05 typecheck backend + pruebas | 0 |
| b06 build backend | 0 |
| b07 pruebas automáticas backend | 0 — **47/47** |
| f08 npm install (frontend) | 0 |
| f09 typecheck frontend | 0 |
| f10 export de WebP con three.js real | 0 |
| f11 build frontend | 0 |
| f12 prueba de humo de la interfaz (`capturas-ui.cmd`) | 0 — **30/30**, sin errores de JS en consola |

Capturas revisadas a ojo (1366×768): cuadrícula de 8 y de 10 mesas sin scroll, 4 y 20
mesas, tarjeta ocupada/fuera de servicio, detalle 3D, modales, Barra con cuentas,
Configuración → Mesas.

## 6. Entregado en Sprint 1 (`las-palmas-sprint1.zip`)

```
LEEME.md                    qué es cada carpeta y cada .cmd
ESTADO_PROYECTO.md          este archivo
verificar-sprint1.cmd       instala + migra + seed + typecheck + build + pruebas (backend y frontend)
iniciar-las-palmas.cmd      abre API (:4000) y frontend (:5173)
capturas-ui.cmd             prueba de humo de la interfaz + capturas
las-palmas-backend/         v0.2.0
  prisma/schema.prisma      + Mesa.activa
  prisma/migrations/        init (Sprint 0) + 20260919030000_mesa_activa
  prisma/seed.ts            + 8 mesas "Mesa 1..8" en "Salón principal", tarifa 134 (idempotente)
  src/constants/            enums.ts (constantes por enum), auditoria.ts
  src/utils/                http.ts (HttpError, asyncHandler), validation.ts, request.ts, jwt.ts
  src/middlewares/          auth (401/403 con code), errorHandler (+ 404 JSON)
  src/modules/auth/         login + GET /auth/me
  src/modules/tables/       Mesas: listar, detalle, CRUD, abrir, estado, anular apertura, baja/alta
  src/modules/bars/         Barras y cuentas
  src/modules/ventas/       repositorio de Venta (abrir/anular, usado por mesas y barra)
  src/modules/audit/        repositorio de AuditLog
  tests/sprint1.test.ts     47 pruebas (npm test)
las-palmas-frontend/        v0.2.0 (evoluciona el prototipo 2)
  public/mesas/*.webp       3 ilustraciones (libre / ocupada / fuera de servicio)
  src/api/                  cliente HTTP, tipos, hooks de mesas y barras
  src/auth/                 AuthContext (sesión real, rutas por rol)
  src/components/           + Avisos (toasts), ConfirmarModal
  src/features/billar/      BillarDashboard, ZonaSeccion, MesaCard, MesaIlustracion,
                            MesaDetalle, MesaEscena3D, BarraSeccion, ConfiguracionMesas,
                            EstadoBadge, modelo/ (3D paramétrico), exportar/ (WebP)
  scripts/                  exportar-mesas.mjs, capturas-ui.mjs
  (eliminados: src/components/MesaSVG.tsx y src/modules/Mesas.tsx)
```

### Endpoints nuevos (todas con `Authorization: Bearer`)

| Método | Ruta | Rol | Historia |
|---|---|---|---|
| GET | `/auth/me` | todos | HU-01 (restaurar sesión) |
| GET | `/tables` (`?incluirInactivas=true` solo Admin) | todos | HU-06 |
| GET | `/tables/:id` | todos | detalle |
| POST / PUT | `/tables`, `/tables/:id` | Admin | CRUD |
| POST | `/tables/:id/open` | todos | HU-07 |
| PATCH | `/tables/:id/status` `{estado, motivo}` | Admin | HU-08 |
| POST | `/tables/:id/cancel-opening` `{motivo}` | Admin | anular apertura |
| PATCH | `/tables/:id/active` `{activa, motivo?}` | Admin | baja / alta lógica |
| GET | `/bars` | todos | HU-16/17 |
| POST | `/bars/:id/open`, `/bars/:id/close` | todos | HU-16 |
| POST | `/bars/:id/accounts` `{etiqueta?}` | todos | HU-17 |
| POST | `/bar-accounts/:id/cancel` | todos | cancelar cuenta vacía |

Códigos de negocio: `MESA_NO_ENCONTRADA`, `MESA_OCUPADA`, `MESA_FUERA_SERVICIO`, `MESA_INACTIVA`,
`MESA_NO_DISPONIBLE`, `MESA_NO_OCUPADA`, `MESA_CON_CONSUMOS`, `MESA_YA_DISPONIBLE`,
`MESA_YA_FUERA_SERVICIO`, `MESA_YA_ACTIVA`, `MESA_YA_INACTIVA`, `TRANSICION_NO_PERMITIDA`,
`NOMBRE_DUPLICADO`, `TARIFA_REQUERIDA`, `BARRA_NO_ENCONTRADA`, `BARRA_YA_ABIERTA`,
`BARRA_YA_CERRADA`, `BARRA_CERRADA`, `BARRA_CON_CUENTAS_ABIERTAS`, `CUENTA_NO_ENCONTRADA`,
`CUENTA_DUPLICADA`, `CUENTA_CON_CONSUMOS`, `CUENTA_YA_CERRADA`, `CREDENCIALES_INVALIDAS`,
`USUARIO_INACTIVO`.

## 7. Checklist de cierre del Sprint 1

Contra el Sprint Planning (`Las_Palmas_Modelado_y_Planeacion.docx`), el pendiente §5 del
ESTADO de Sprint 0 y el Anexo A.

| # | Actividad / criterio | Estado | Evidencia |
|---|---|---|---|
| 1 | **HU-06** cuadrícula visual; Libre / Ocupada / Fuera de servicio distinguibles por color, badge e ícono | ✅ | Fondo de tarjeta + modelo (verde / bolas y fondo ámbar / gris) + badge con ícono y texto. Capturas 01, 08, 14 |
| 2 | **HU-06** sin scroll hasta 10 mesas | ✅ | Humo: 4, 8 y 10 mesas sin scroll en 1366×768; 20 mesas legibles con scroll |
| 3 | **HU-06** datos vía API | ✅ | `GET /tables`, sincronizado cada 15 s |
| 4 | **HU-07** abrir con un clic; registra `startedAt`; pasa a Ocupada | ✅ | Pruebas "el Operador abre una mesa…", "dos equipos… exactamente uno gana"; humo HU-07 |
| 5 | **HU-07** "tiempo inicia en 0" | ✅ dato / ⏭ visual | `startedAt` = reloj del servidor al abrir → transcurrido 0. Mostrar el cronómetro es HU-10 (Sprint 2); la tarjeta muestra "Desde HH:MM · quién" |
| 6 | **HU-08** solo Administrador ve "Reactivar"; la mesa vuelve a Libre | ✅ | Pruebas 403 Operador + reactivar auditado; humo: Admin ve, Operador no ve, queda Disponible |
| 7 | **HU-16** Barra 1 y Barra 2 abren/cierran de forma independiente | ✅ | Pruebas "abre Barra 1 y Barra 2 sigue cerrada" y viceversa; humo HU-16 |
| 8 | **HU-17** varias cuentas simultáneas por barra; lista de cuentas abiertas | ✅ | Prueba "tres cuentas abiertas a la vez…"; humo: 2 cuentas en Barra 1 |
| 9 | **HU-17** "reutiliza el motor de catálogo/cobro" | 🟡 preparado | Cada cuenta ya tiene su `Venta ABIERTA` con `ventaId`; el catálogo (Sprint 3/4) y el cobro (Sprint 5) se conectan ahí |
| 10 | Anexo A: componente 3D paramétrico por primitivas, 3 variantes | ✅ | `features/billar/modelo/` |
| 11 | Anexo A: WebP estático en la cuadrícula, R3F vivo solo en el detalle | ✅ | Humo: "La cuadrícula no monta contextos WebGL", "El detalle monta una sola escena 3D" |
| 12 | Reemplazar `MesaSVG.tsx` | ✅ | Eliminado; sin referencias |
| 13 | Pendiente §5: CRUD de mesas (crear, editar, dar de baja) backend + UI | ✅ | 7 pruebas CRUD; Configuración → Mesas (captura 12, 13) |
| 14 | Pendiente §5: Login real contra `POST /auth/login` | ✅ | Humo: Operador → /billar, Admin → Panel, refrescar no cierra sesión |
| 15 | Decisión: anular apertura (Admin, motivo, auditada) | ✅ | 5 pruebas; humo: botón deshabilitado sin motivo, mesa queda Disponible |
| 16 | Decisión: dar de baja con `Mesa.activa` (migración) | ✅ | `migrate diff` sin diferencias; prueba de baja/alta |
| 17 | Cambios visibles en los otros PCs en < 30 s | 🟡 mecanismo | Refetch cada 15 s + tras cada acción; no se probó con 3 PCs físicos (se valida en Sprint 11/12) |
| 18 | Fuera de alcance respetado: HU-09, HU-10, HU-11 | ✅ | Sin cronómetro, sin edición de hora, sin recuperación de tiempo. Solo se dejó el dato `startedAt` y el header `Date` que ya envía Express |
| 19 | Convenciones: sin placeholders, `.env` listo, enums por constantes, montos `Int`, Rack & Score | ✅ | Revisado en todo el código nuevo |
| 20 | Todo compila, migra, pasa pruebas y corre en el PC real | ✅ | §5: 11/11 pasos en 0, 47/47 pruebas, 30/30 humo |

## 8. Pendiente para los siguientes sprints

**Sprint 2 — Tiempo (HU-10, HU-11, HU-09)**
- HU-10: hook `useRelojGlobal` (un solo intervalo de 1 s para toda la app); tiempo =
  `ahora − startedAt` y valor = minutos × `sesion.tarifaAplicada` (ya viene en `MesaDTO`).
  Usar el header `Date` de las respuestas para calcular el desfase con el reloj del
  servidor (hay prueba de que llega). Reemplazar la línea "Desde HH:MM · quién" de
  `MesaCard` por cronómetro + valor, y agregarlo al aside de `MesaDetalle`.
- HU-11: al reiniciar, todo sale de `startedAt` en BD (el backend ya no guarda nada en
  memoria); falta la prueba de reinicio y la vista de recuperación.
- HU-09: `PATCH /tables/:id/started-at` debe actualizar **a la vez** `Mesa.startedAt` y
  `Venta.fechaApertura` de la venta abierta, validar "no futuro" y auditar antes/después.

**Sprint 3 — Pedidos y consumo**: los `ItemVenta` se cuelgan de `sesion.ventaId` (mesa) y
`cuenta.ventaId` (barra). Anular apertura / cancelar cuenta ya bloquean si hay ítems.

**Sprint 9 — Usuarios (HU-02, HU-03, HU-43)**: `requireAuth` debería verificar en BD que el
usuario siga activo en cada petición (hoy lo hace solo `/auth/me` y el login); guardar
los correos siempre en minúsculas al crear usuarios. HU-43 reutiliza Configuración → Mesas.

**Sprint 12 — Despliegue**: Nginx con `location /api/ { proxy_pass http://127.0.0.1:4000/; }`
y el frontend compilado (`npm run build` → `dist/`).

**Mantenimiento (sin sprint asignado)**
- `npm audit` del frontend reporta 4 vulnerabilidades (3 moderadas, 1 alta) en
  dependencias de terceros; no se aplicó `npm audit fix --force` para no romper versiones.
- NextUI 2 está deprecado en favor de HeroUI; migrar cuando convenga (Sprint 9, pulido de UI).
- `src/assets/logo.png` pesa ~2,2 MB: optimizarlo.
- Las fuentes (Anton, Oswald, Inter) vienen de Google Fonts: como el sistema debe operar
  sin Internet (PERSISTENCIA §31, ARQUITECTURA §29), hay que empaquetarlas localmente
  antes del despliegue (sin Internet hoy caerían a fuentes del sistema).
- El chip "En caja $761.400" del encabezado (Sprint 7, Caja) y el Panel (HU-04/HU-05)
  siguen con datos de ejemplo.
- Los documentos de arquitectura y la cotización siguen mencionando MySQL (ver Sprint 0).
- Estado `RESERVADA` de mesa sin uso.

## 9. Qué NO se tocó en Sprint 1 (a propósito)

- HU-09, HU-10, HU-11 (Sprint 2).
- Productos en mesa o barra, cobro y facturación (Sprints 3–5).
- Panel, Venta Directa, Licorera, Inventario, Gastos, Reportes, Caja, Configuración →
  Negocio / Usuarios: siguen con datos de ejemplo.
- Código de barras (HU-26, HU-27 → Sprint 5 según el Sprint Planning).

## 10. Cómo correr y cómo continuar

1. Primera vez en un PC: doble clic en `verificar-sprint1.cmd` (todo debe quedar en 0 en
   `verificacion\resumen.txt`).
2. Uso diario: doble clic en `iniciar-las-palmas.cmd` → http://localhost:5173.
   Usuarios de desarrollo en los README (admin@laspalmas.com / operador@laspalmas.com).
3. Para el próximo chat: reemplazar este archivo y `schema.prisma` en el conocimiento
   del proyecto, abrir un chat nuevo diciendo "Sprint 2 — Tiempo" y pedir que lea este
   documento antes de escribir código.
