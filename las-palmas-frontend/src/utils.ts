import { C } from './theme';

export function formatCOP(amount: number): string {
  return '$ ' + new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

export function formatTime(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatHora(date: Date): string {
  return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

/** "9:34 p. m." si es de hoy; "18 sep., 9:34 p. m." si es de otro día. */
export function formatHoraOFecha(iso: string): string {
  const fecha = new Date(iso);
  const hoy = new Date();
  const mismoDia =
    fecha.getFullYear() === hoy.getFullYear() && fecha.getMonth() === hoy.getMonth() && fecha.getDate() === hoy.getDate();
  const hora = fecha.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
  if (mismoDia) return hora;
  return `${fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}, ${hora}`;
}

/**
 * Paleta de tokens de producto — usa directamente los colores de bola,
 * como fill sólido, siguiendo el principio "flat colour" del prototipo.
 * El texto es blanco o tinta según el contraste de cada bola.
 */
const TOKEN_PALETTE = [
  { bg: C.ball1, text: C.ink }, // amarillo — texto oscuro
  { bg: C.ball2, text: '#FFFFFF' }, // azul
  { bg: C.ball4, text: '#FFFFFF' }, // morado
  { bg: C.ball6, text: '#FFFFFF' }, // verde
  { bg: C.ball5, text: '#FFFFFF' }, // naranja
  { bg: C.ball3, text: '#FFFFFF' }, // rojo
  { bg: '#111111', text: '#FFFFFF' }, // negro — como la bola 8
];

export function getTokenColor(sku: string) {
  let hash = 0;
  for (let i = 0; i < sku.length; i++) {
    hash = (hash << 5) - hash + sku.charCodeAt(i);
    hash |= 0;
  }
  return TOKEN_PALETTE[Math.abs(hash) % TOKEN_PALETTE.length];
}

export function getInitials(name: string): string {
  const clean = name.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/g, '').trim();
  const words = clean.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 1) return words[0].substring(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}
