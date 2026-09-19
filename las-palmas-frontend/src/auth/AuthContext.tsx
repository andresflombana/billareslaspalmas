import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { alVencerSesion, borrarToken, esApiError, guardarToken, leerToken, pedir } from '../api/cliente';
import type { RespuestaLogin, UsuarioSesion } from '../api/tipos';
import type { Modulo, Rol } from '../types';

// HU-01: iniciar sesión contra POST /auth/login y conservar la sesión al
// refrescar (el token se guarda y se valida con GET /auth/me al cargar).

type EstadoSesion = 'verificando' | 'sin-conexion' | 'sin-sesion' | 'con-sesion';

interface ContextoAuth {
  estado: EstadoSesion;
  usuario: UsuarioSesion | null;
  esAdmin: boolean;
  /** Mensaje para mostrar en el login (p. ej. "Tu sesión expiró"). */
  aviso: string | null;
  iniciarSesion: (email: string, password: string) => Promise<UsuarioSesion>;
  cerrarSesion: (aviso?: string) => void;
  reintentar: () => void;
}

const Contexto = createContext<ContextoAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [estado, setEstado] = useState<EstadoSesion>(() => (leerToken() ? 'verificando' : 'sin-sesion'));
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  const cerrarSesion = useCallback(
    (mensaje?: string) => {
      borrarToken();
      setUsuario(null);
      setEstado('sin-sesion');
      setAviso(mensaje ?? null);
      queryClient.clear();
    },
    [queryClient],
  );

  // Restaurar la sesión guardada al cargar la página.
  useEffect(() => {
    if (!leerToken()) return;
    let vigente = true;
    setEstado('verificando');
    pedir<{ usuario: UsuarioSesion }>('GET', '/auth/me')
      .then(({ usuario: u }) => {
        if (!vigente) return;
        setUsuario(u);
        setEstado('con-sesion');
      })
      .catch((e: unknown) => {
        if (!vigente) return;
        if (esApiError(e) && e.code === 'SIN_CONEXION') {
          setEstado('sin-conexion');
        } else {
          borrarToken();
          setEstado('sin-sesion');
        }
      });
    return () => {
      vigente = false;
    };
  }, [intento]);

  // Cualquier 401 posterior (token vencido, usuario desactivado) cierra la sesión.
  useEffect(() => alVencerSesion(() => cerrarSesion('Tu sesión expiró. Vuelve a iniciar sesión.')), [cerrarSesion]);

  const iniciarSesion = useCallback(async (email: string, password: string) => {
    const r = await pedir<RespuestaLogin>('POST', '/auth/login', { email, password });
    guardarToken(r.token);
    setUsuario(r.usuario);
    setAviso(null);
    setEstado('con-sesion');
    return r.usuario;
  }, []);

  const valor = useMemo<ContextoAuth>(
    () => ({
      estado,
      usuario,
      esAdmin: usuario?.rol === 'ADMINISTRADOR',
      aviso,
      iniciarSesion,
      cerrarSesion,
      reintentar: () => setIntento((n) => n + 1),
    }),
    [estado, usuario, aviso, iniciarSesion, cerrarSesion],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAuth(): ContextoAuth {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

/** Rol en el formato que usan los componentes del prototipo (Sidebar). */
export function rolUI(usuario: UsuarioSesion): Rol {
  return usuario.rol === 'ADMINISTRADOR' ? 'admin' : 'operador';
}

// ---------------------------------------------------------------- rutas por módulo

export const RUTA_MODULO: Record<Modulo, string> = {
  panel: '/panel',
  mesas: '/billar',
  'venta-directa': '/venta-directa',
  licorera: '/licorera',
  inventario: '/inventario',
  gastos: '/gastos',
  reportes: '/reportes',
  caja: '/caja',
  configuracion: '/configuracion',
};

/** HU-03: el Operador solo ve Mesas, Venta Directa y Licorera. */
export const MODULOS_OPERADOR: Modulo[] = ['mesas', 'venta-directa', 'licorera'];

export function moduloDeRuta(pathname: string): Modulo | null {
  const entrada = (Object.entries(RUTA_MODULO) as [Modulo, string][]).find(
    ([, ruta]) => pathname === ruta || pathname.startsWith(`${ruta}/`),
  );
  return entrada ? entrada[0] : null;
}

/** Pantalla de inicio según el rol: Administrador → Panel, Operador → Mesas. */
export function rutaInicio(usuario: UsuarioSesion): string {
  return usuario.rol === 'ADMINISTRADOR' ? RUTA_MODULO.panel : RUTA_MODULO.mesas;
}
