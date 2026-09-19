import { C } from '../../theme';
import type { EstadoMesa } from '../../api/tipos';

// Estado de la mesa con color + ícono + texto (RNF-15: nunca solo color).
const BADGE: Record<EstadoMesa, { fondo: string; color: string; borde: string; icono: string; texto: string }> = {
  LIBRE: { fondo: C.tint6, color: C.ball6, borde: C.ball6, icono: '✓', texto: 'Disponible' },
  OCUPADA: { fondo: C.ball1, color: C.ink, borde: C.ink, icono: '●', texto: 'En juego' },
  FUERA_SERVICIO: { fondo: '#F2F1EB', color: C.inkFaint, borde: C.inkFaint, icono: '✕', texto: 'No disponible' },
  RESERVADA: { fondo: C.tint2, color: C.ball2, borde: C.ball2, icono: '◷', texto: 'Reservada' },
};

/** Fondo de la ilustración por estado: refuerza la lectura a distancia. */
export const FONDO_ESTADO: Record<EstadoMesa, string> = {
  LIBRE: '#FFFFFF',
  OCUPADA: C.tint1,
  FUERA_SERVICIO: '#F2F1EB',
  RESERVADA: C.tint2,
};

export default function EstadoBadge({ estado, tamano = 'normal' }: { estado: EstadoMesa; tamano?: 'normal' | 'grande' }) {
  const b = BADGE[estado];
  const grande = tamano === 'grande';
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full t-label border-2 whitespace-nowrap flex-shrink-0"
      style={{
        background: b.fondo,
        color: b.color,
        borderColor: b.borde,
        fontSize: grande ? 13 : 'clamp(9px,1.05vh,12px)',
        padding: grande ? '5px 14px' : 'clamp(2px,0.5vh,5px) clamp(6px,1vh,12px)',
        transition: 'background-color 300ms ease, color 300ms ease, border-color 300ms ease',
      }}
    >
      <span aria-hidden>{b.icono}</span> {b.texto}
    </span>
  );
}
