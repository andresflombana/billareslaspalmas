// "Rack & Score" — Prototipo 2
// Fondo siempre blanco. El color viene de las bolas, con significado fijo, nunca decorativo.
export const C = {
  bg: '#FFFFFF',
  surface: '#FFFFFF',

  ink: '#111111',
  inkSoft: '#55534C',
  inkFaint: '#9C9A8F',
  line: '#111111',

  // Identidad de módulo — nunca cambian de significado
  ball1: '#F4C21A', // amarillo — Billar
  ball2: '#1C5FAE', // azul — Venta Directa
  ball4: '#6A2E8C', // morado — Licorera
  ball6: '#1E7A45', // verde — éxito / disponible
  ball5: '#E0641E', // naranja — alerta / stock bajo
  ball3: '#C4272B', // rojo — peligro / fuera de servicio

  tint1: '#FDF3D2',
  tint2: '#E4EEF9',
  tint4: '#F1E7F5',
  tint6: '#E5F3EA',
  tint5: '#FBE7DA',
  tint3: '#FBE4E4',

  shadowSticker: '4px 4px 0 rgba(17,17,17,0.15)',
} as const;

export type PuntoVentaId = 'billar' | 'venta-directa' | 'licorera';

/** Identidad visual fija de cada punto de venta. Nunca se reasigna. */
export const puntoVenta: Record<
  PuntoVentaId,
  { label: string; fill: string; tint: string; caja: string }
> = {
  billar: { label: 'Billar', fill: C.ball1, tint: C.tint1, caja: 'Caja: Billar' },
  'venta-directa': { label: 'Venta Directa', fill: C.ball2, tint: C.tint2, caja: 'Caja: Venta Directa' },
  licorera: { label: 'Licorera', fill: C.ball4, tint: C.tint4, caja: 'Caja: Licorera' },
};

/** Chip helper — texto de color de bola sobre su propio tinte, nunca sobre otra bola. */
export const chip = {
  billar: { bg: C.tint1, color: '#8A6A0E', border: `2px solid ${C.ball1}` },
  ventaDirecta: { bg: C.tint2, color: C.ball2, border: `2px solid ${C.ball2}` },
  licorera: { bg: C.tint4, color: C.ball4, border: `2px solid ${C.ball4}` },
  ok: { bg: C.tint6, color: C.ball6, border: `2px solid ${C.ball6}` },
  warn: { bg: C.tint5, color: C.ball5, border: `2px solid ${C.ball5}` },
  danger: { bg: C.tint3, color: C.ball3, border: `2px solid ${C.ball3}` },
  neutral: { bg: '#FFFFFF', color: C.inkFaint, border: `2px solid ${C.inkFaint}` },
} as const;
