let cache: boolean | null = null;

/** Algunos equipos viejos de punto de venta no tienen WebGL: ahí se usa la ilustración estática. */
export function soportaWebGL(): boolean {
  if (cache !== null) return cache;
  try {
    const canvas = document.createElement('canvas');
    cache = Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    cache = false;
  }
  return cache;
}
