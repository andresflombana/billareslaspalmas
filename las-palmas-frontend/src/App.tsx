import { Suspense, lazy, useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { C } from './theme';
import type { Modulo } from './types';
import Sidebar from './components/Sidebar';
import Login from './modules/Login';
import Panel from './modules/Panel';
import VentaDirecta from './modules/VentaDirecta';
import Licorera from './modules/Licorera';
import Inventario from './modules/Inventario';
import Gastos from './modules/Gastos';
import Reportes from './modules/Reportes';
import Caja from './modules/Caja';
import Configuracion from './modules/Configuracion';
import BillarDashboard from './features/billar/BillarDashboard';
// El detalle de mesa trae Three.js / React Three Fiber: se carga solo cuando se
// abre una mesa, así /billar (la pantalla de todo el día) descarga menos.
const MesaDetalle = lazy(() => import('./features/billar/MesaDetalle'));
import { MODULOS_OPERADOR, RUTA_MODULO, moduloDeRuta, rolUI, rutaInicio, useAuth } from './auth/AuthContext';

const PAGE_TITLES: Record<Modulo, string> = {
  panel: 'Panel',
  mesas: 'Mesas de Billar',
  'venta-directa': 'Venta Directa',
  licorera: 'Licorera',
  inventario: 'Inventario',
  gastos: 'Gastos',
  reportes: 'Reportes',
  caja: 'Caja',
  configuracion: 'Configuración',
};

function useReloj() {
  const [ahora, setAhora] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return ahora;
}

export default function App() {
  const { estado, usuario, reintentar } = useAuth();

  if (estado === 'verificando') return <PantallaCentrada titulo="Cargando…" />;
  if (estado === 'sin-conexion') {
    return (
      <PantallaCentrada
        titulo="Sin conexión con el servidor"
        texto="El PC de Billar no responde. Verifica que esté encendido y conectado a la red."
        accion={{ texto: 'Reintentar', onClick: reintentar }}
      />
    );
  }

  return (
    <Routes>
      <Route path="/login" element={usuario ? <Navigate to={rutaInicio(usuario)} replace /> : <Login />} />
      <Route element={<RequiereSesion />}>
        <Route index element={usuario ? <Navigate to={rutaInicio(usuario)} replace /> : null} />
        <Route path="billar" element={<BillarDashboard />} />
        <Route
          path="billar/:mesaId"
          element={
            <Suspense fallback={<PantallaCentrada titulo="Cargando mesa…" />}>
              <MesaDetalle />
            </Suspense>
          }
        />
        <Route path="venta-directa" element={<VentaDirecta />} />
        <Route path="licorera" element={<Licorera />} />
        {/* HU-03: rutas administrativas. Un Operador que llegue aquí vuelve a Mesas. */}
        <Route element={<SoloAdministrador />}>
          <Route path="panel" element={<PanelConNavegacion />} />
          <Route path="inventario" element={<Inventario />} />
          <Route path="gastos" element={<Gastos />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="caja" element={<Caja />} />
          <Route path="configuracion" element={<Configuracion />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function PanelConNavegacion() {
  const navigate = useNavigate();
  return <Panel onNavigate={(m) => navigate(RUTA_MODULO[m])} />;
}

function SoloAdministrador() {
  const { esAdmin } = useAuth();
  return esAdmin ? <Outlet /> : <Navigate to={RUTA_MODULO.mesas} replace />;
}

/** Layout con menú lateral y encabezado. Sin sesión → /login. */
function RequiereSesion() {
  const { usuario, cerrarSesion } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const ahora = useReloj();
  const [colapsado, setColapsado] = useState<boolean>(() => {
    try {
      return localStorage.getItem('lp_sidebar_colapsado') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('lp_sidebar_colapsado', colapsado ? '1' : '0');
    } catch {
      // preferencia no persistida: no pasa nada
    }
  }, [colapsado]);

  if (!usuario) return <Navigate to="/login" replace />;

  const rol = rolUI(usuario);
  const modulo = moduloDeRuta(location.pathname) ?? (rol === 'admin' ? 'panel' : 'mesas');
  const moduloVisible = rol === 'operador' && !MODULOS_OPERADOR.includes(modulo) ? 'mesas' : modulo;
  const esBillar = moduloVisible === 'mesas';

  const horaStr = ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const fechaStr = ahora.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="flex h-full overflow-hidden" style={{ background: C.bg }}>
      <Sidebar
        rol={rol}
        nombre={usuario.nombre}
        modulo={moduloVisible}
        colapsado={colapsado}
        onToggle={() => setColapsado((v) => !v)}
        onNavigate={(m) => navigate(RUTA_MODULO[m])}
        onLogout={() => cerrarSesion()}
      />

      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <header
          className="flex items-center px-6 flex-shrink-0"
          style={{ height: 64, background: '#FFFFFF', borderBottom: `2px solid ${C.ink}`, zIndex: 10 }}
        >
          <h1 className="t-title flex-1" style={{ color: C.ink, fontSize: 22 }}>
            {PAGE_TITLES[moduloVisible]}
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="t-caption" style={{ color: C.inkFaint, lineHeight: 1 }}>
                {fechaStr}
              </p>
              <p style={{ color: C.ink, fontSize: 17, fontVariantNumeric: 'tabular-nums', fontWeight: 700, lineHeight: 1.3 }}>
                {horaStr}
              </p>
            </div>
            {rol === 'admin' && (
              // Dato de ejemplo del prototipo: la caja real llega en Sprint 7 (HU-36/37).
              <div className="flex items-center gap-2 px-4 py-2 rounded-full border-2" style={{ borderColor: C.ink }}>
                <span className="t-caption" style={{ color: C.inkFaint }}>
                  En caja
                </span>
                <span className="t-label" style={{ color: C.ink, fontSize: 15 }}>
                  $ 761.400
                </span>
              </div>
            )}
          </div>
        </header>

        <main className={esBillar ? 'flex-1 overflow-hidden' : 'flex-1 overflow-y-auto'} style={{ background: C.bg }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function PantallaCentrada({ titulo, texto, accion }: { titulo: string; texto?: string; accion?: { texto: string; onClick: () => void } }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: '#FAFAF7' }}>
      <p className="t-title" style={{ color: C.ink }}>
        {titulo}
      </p>
      {texto && (
        <p className="t-body max-w-[460px]" style={{ color: C.inkSoft }}>
          {texto}
        </p>
      )}
      {accion && (
        <button
          onClick={accion.onClick}
          className="rounded-full t-label border-2"
          style={{ height: 56, paddingInline: 32, background: C.ink, borderColor: C.ink, color: '#FFFFFF', fontSize: 14 }}
        >
          {accion.texto}
        </button>
      )}
    </div>
  );
}
