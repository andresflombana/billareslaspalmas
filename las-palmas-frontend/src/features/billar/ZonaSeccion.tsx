import { useLayoutEffect, useRef, useState } from 'react';
import { C } from '../../theme';
import type { Mesa } from '../../api/tipos';
import MesaCard from './MesaCard';

// Una zona del salón con su encabezado ("Salón principal · 3 de 8 ocupadas")
// y su cuadrícula de mesas.
//
// modo "ajustar" (hasta 10 mesas en una sola zona): la cuadrícula ocupa el alto
// disponible y las filas se reparten el espacio, sin scroll (HU-06). Las
// columnas salen del número de mesas, pero nunca son más angostas que
// ANCHO_MIN_TARJETA; si en una pantalla muy pequeña las filas quedaran por
// debajo de ALTO_MIN_TARJETA, la cuadrícula pasa a filas fijas con scroll
// propio en vez de aplastar las tarjetas.
// modo "desplazar" (más de 10 mesas o varias zonas): tarjetas de tamaño fijo y
// scroll, para que siga legible con 20 mesas.

export const MAX_MESAS_SIN_SCROLL = 10;
const ANCHO_MIN_TARJETA = 190;
const ALTO_MIN_TARJETA = 190;
const ESPACIO = 14;

function columnasSegunCantidad(n: number): number {
  if (n <= 4) return Math.max(n, 1);
  if (n <= 6) return 3;
  if (n <= 8) return 4;
  return 5;
}

/** Tamaño real del contenedor (se recalcula al cambiar el tamaño de la ventana). */
function useTamano<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [tamano, setTamano] = useState({ ancho: 0, alto: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => setTamano({ ancho: el.clientWidth, alto: el.clientHeight });
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, []);
  return { ref, ...tamano };
}

interface Props {
  zona: string;
  mesas: Mesa[];
  modo: 'ajustar' | 'desplazar';
}

export default function ZonaSeccion({ zona, mesas, modo }: Props) {
  const ocupadas = mesas.filter((m) => m.estado === 'OCUPADA').length;
  const fuera = mesas.filter((m) => m.estado === 'FUERA_SERVICIO').length;

  return (
    <section className={modo === 'ajustar' ? 'flex flex-col flex-1 min-h-0' : 'flex flex-col'} aria-label={zona}>
      <div className="flex items-center gap-3 mb-3 flex-shrink-0 flex-wrap">
        <h2 className="t-heading" style={{ color: C.ink }}>
          {zona} · {mesas.length} {mesas.length === 1 ? 'mesa' : 'mesas'}
        </h2>
        <span
          className="t-label px-3 py-1 rounded-full border-2"
          style={{ borderColor: C.ball1, background: C.tint1, color: '#8A6A0E', fontSize: 12 }}
        >
          {ocupadas} de {mesas.length} {mesas.length === 1 ? 'ocupada' : 'ocupadas'}
        </span>
        {fuera > 0 && (
          <span className="t-label px-3 py-1 rounded-full border-2" style={{ borderColor: C.inkFaint, background: '#F2F1EB', color: C.inkFaint, fontSize: 12 }}>
            {fuera} fuera de servicio
          </span>
        )}
      </div>

      {modo === 'ajustar' ? (
        <CuadriculaAjustada mesas={mesas} />
      ) : (
        <div className="grid" style={{ gap: ESPACIO, gridTemplateColumns: `repeat(auto-fill, minmax(${ANCHO_MIN_TARJETA + 50}px, 1fr))`, gridAutoRows: 280 }}>
          {mesas.map((mesa) => (
            <MesaCard key={mesa.id} mesa={mesa} />
          ))}
        </div>
      )}
    </section>
  );
}

function CuadriculaAjustada({ mesas }: { mesas: Mesa[] }) {
  const { ref, ancho, alto } = useTamano<HTMLDivElement>();
  const n = mesas.length;
  const maxPorAncho = ancho > 0 ? Math.max(1, Math.floor((ancho + ESPACIO) / (ANCHO_MIN_TARJETA + ESPACIO))) : columnasSegunCantidad(n);
  const columnas = Math.min(columnasSegunCantidad(n), maxPorAncho);
  const filas = Math.ceil(n / columnas);
  const altoFila = alto > 0 ? (alto - ESPACIO * (filas - 1)) / filas : ALTO_MIN_TARJETA;
  const cabe = altoFila >= ALTO_MIN_TARJETA;

  return (
    <div ref={ref} className={`flex-1 min-h-0 ${cabe ? '' : 'overflow-y-auto pr-1'}`}>
      <div
        className="grid h-full"
        style={{
          gap: ESPACIO,
          gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))`,
          gridAutoRows: cabe ? '1fr' : ALTO_MIN_TARJETA + 40,
          height: cabe ? '100%' : 'auto',
          maxWidth: columnas * 440,
        }}
      >
        {mesas.map((mesa) => (
          <MesaCard key={mesa.id} mesa={mesa} />
        ))}
      </div>
    </div>
  );
}
