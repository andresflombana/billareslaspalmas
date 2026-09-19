# Las Palmas — Frontend (Sprint 1: Mesas y Barra)

Aplicación web del sistema integral Las Palmas: React 18 + Vite + TypeScript +
Tailwind v3 + NextUI, con el design system **"Rack & Score"** (`src/theme.ts`,
`tailwind.config.js`). Evoluciona el prototipo 2 aprobado por el cliente.

Desde Sprint 1 el módulo **Billar** (Mesas y Barra), el **login** y
**Configuración → Mesas / Zonas** trabajan contra la API real. Los demás
módulos (Panel, Venta Directa, Licorera, Inventario, Gastos, Reportes, Caja,
Configuración → Negocio / Usuarios) siguen con datos de ejemplo y se conectan
en su sprint.

## Requisitos
- Node.js 18 o superior.
- El backend (`las-palmas-backend`) corriendo en el mismo PC (puerto 4000).

## Puesta en marcha
1. `npm install`
2. Ya incluye un `.env` listo (`API_URL_DESARROLLO=http://localhost:4000`): no hay nada que editar.
3. `npm run dev` → http://localhost:5173 (y desde los otros PCs de la LAN: `http://IP-DEL-PC-BILLAR:5173`).

Usuarios de desarrollo (los crea el seed del backend; en modo desarrollo aparecen
como atajos en la pantalla de login):

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@laspalmas.com | adminlaspalmas |
| Operador | operador@laspalmas.com | operadorlaspalmas |

## Scripts
| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo (reenvía `/api/*` al backend). |
| `npm run build` | Verifica tipos (`tsc --noEmit`) y genera `dist/` para producción. |
| `npm run typecheck` | Solo la verificación de tipos. |
| `npm run export:mesas` | Regenera las 3 ilustraciones WebP de la cuadrícula desde el modelo 3D (ver abajo). |
| `npm run capturas` | Prueba de humo de la interfaz con el sistema corriendo (backend + `npm run dev`): recorre los flujos de Operador y Administrador, verifica HU-06/07/08/16/17 y guarda capturas en `capturas/`. Deja los datos como estaban. |

## Cómo habla con la API
Todas las llamadas usan rutas relativas `/api/...` (`src/api/cliente.ts`). En
desarrollo, Vite las reenvía al backend quitando el prefijo `/api`
(`vite.config.ts`); en producción (Sprint 12) Nginx hará lo mismo. La sesión
(token JWT) se guarda en el navegador y se valida con `GET /auth/me` al
recargar: refrescar la página no cierra la sesión (HU-01).

Los datos de mesas y barras se sincronizan entre los tres PCs cada 15 s, al
volver a la ventana y justo después de cada acción (TanStack Query, sin websockets).

## Modelo 3D de la mesa (Anexo A)
- `src/features/billar/modelo/modeloMesa.ts` — datos puros: piezas, colores,
  luces, cámara, rotación. Base: Anexo A del PROMPT INTERFAZ MÓDULO BILLAR;
  diseño refinado con el modelo de referencia del cliente (patas hacia adentro
  con bastidor, cojines, troneras con aro, 15 bolas). Todo por primitivas: no se
  carga ningún `.obj`.
- `MesaModelo3D.tsx` — construye la mesa con React Three Fiber; las variantes
  libre / ocupada / fuera de servicio cambian colores y bolas sobre el mismo
  modelo, con transición de 300 ms.
- `MesaEscena3D.tsx` — escena viva (luces, sombra, cámara, rotación y arrastre).
  **Solo** se monta en el detalle de una mesa (`/billar/:mesaId`).
- La cuadrícula `/billar` **no** monta WebGL: usa `public/mesas/*.webp`, que
  salen del mismo modelo con `npm run export:mesas` (usa Microsoft Edge o
  Google Chrome ya instalados, sin ventana). Solo hay que correrlo si se cambia
  el modelo; las WebP ya vienen generadas.

## Estructura
```
src/
  api/            cliente HTTP, tipos de la API y hooks (mesas, barras)
  auth/           sesión (AuthContext), rutas por rol (HU-01, HU-03)
  components/     Sidebar, Avisos, ConfirmarModal, PagoModal, PuntoVentaPOS, ObservacionesField
  features/billar/
    BillarDashboard.tsx   /billar: cuadrícula por zona + Barra (HU-06, HU-16, HU-17)
    ZonaSeccion.tsx       encabezado "Zona · N de M ocupadas" + grilla
    MesaCard.tsx          tarjeta: ilustración, estado, dato, acciones por rol (HU-07, HU-08)
    MesaIlustracion.tsx   WebP con fundido de 300 ms
    MesaDetalle.tsx       /billar/:mesaId con escena 3D viva
    MesaEscena3D.tsx      escena React Three Fiber
    BarraSeccion.tsx      Barra 1 y Barra 2 con sus cuentas
    ConfiguracionMesas.tsx CRUD de mesas y vista de zonas (Administrador)
    modelo/               modelo 3D paramétrico
    exportar/             página de exportación de WebP (solo desarrollo)
  modules/        pantallas del prototipo (Login ya es real; el resto, datos de ejemplo)
```

## Nota técnica
Tailwind CSS v3 (no v4) porque el plugin de NextUI aún no es compatible con v4.
React Three Fiber v8 (la versión compatible con React 18).
