// Cliente HTTP único del frontend. Todas las llamadas van a `/api/...`:
// en desarrollo Vite las reenvía al backend (vite.config.ts) y en producción
// lo hará Nginx. Nunca se escribe la IP del servidor en el código.

const CLAVE_SESION = 'lp_sesion';

/** Error de la API con el `code` estable del backend y un mensaje listo para mostrar. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function esApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

/** Mensaje amigable para cualquier error (de la API, de red o inesperado). */
export function mensajeDeError(e: unknown): string {
  if (esApiError(e)) return e.message;
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}

// --- token de sesión (se guarda para que la sesión sobreviva a un refresco: HU-01)

export function leerToken(): string | null {
  try {
    const crudo = localStorage.getItem(CLAVE_SESION);
    if (!crudo) return null;
    const datos: unknown = JSON.parse(crudo);
    return typeof datos === 'object' && datos !== null && typeof (datos as { token?: unknown }).token === 'string'
      ? (datos as { token: string }).token
      : null;
  } catch {
    return null;
  }
}

export function guardarToken(token: string) {
  try {
    localStorage.setItem(CLAVE_SESION, JSON.stringify({ token }));
  } catch {
    // Almacenamiento bloqueado: la sesión dura hasta cerrar la pestaña.
  }
}

export function borrarToken() {
  try {
    localStorage.removeItem(CLAVE_SESION);
  } catch {
    // nada que hacer
  }
}

// --- aviso de sesión vencida: el AuthProvider se suscribe y cierra la sesión.
type OyenteSesion = () => void;
const oyentesSesionVencida = new Set<OyenteSesion>();
export function alVencerSesion(fn: OyenteSesion): () => void {
  oyentesSesionVencida.add(fn);
  return () => oyentesSesionVencida.delete(fn);
}

type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export async function pedir<T>(metodo: Metodo, ruta: string, cuerpo?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = leerToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';

  let respuesta: Response;
  try {
    respuesta = await fetch(`/api${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ApiError(0, 'SIN_CONEXION', 'No hay conexión con el servidor (PC de Billar). Verifica que esté encendido.');
  }

  const texto = await respuesta.text();
  let datos: unknown = null;
  if (texto) {
    try {
      datos = JSON.parse(texto);
    } catch {
      datos = null;
    }
  }

  if (!respuesta.ok) {
    const cuerpoError = (datos ?? {}) as { error?: unknown; code?: unknown };
    const mensaje =
      typeof cuerpoError.error === 'string'
        ? cuerpoError.error
        : respuesta.status >= 500 || respuesta.status === 0
          ? 'El servidor no respondió correctamente. Intenta de nuevo.'
          : 'No se pudo completar la acción.';
    const code = typeof cuerpoError.code === 'string' ? cuerpoError.code : `HTTP_${respuesta.status}`;
    // Proxy de Vite sin backend: responde 502/504 sin cuerpo JSON.
    if ((respuesta.status === 502 || respuesta.status === 504) && typeof cuerpoError.error !== 'string') {
      throw new ApiError(0, 'SIN_CONEXION', 'No hay conexión con el servidor (PC de Billar). Verifica que esté encendido.');
    }
    if (respuesta.status === 401 && token && ruta !== '/auth/login') {
      oyentesSesionVencida.forEach((fn) => fn());
    }
    throw new ApiError(respuesta.status, code, mensaje);
  }
  return datos as T;
}
