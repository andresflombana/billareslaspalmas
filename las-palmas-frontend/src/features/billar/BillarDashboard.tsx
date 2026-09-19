import { useMemo } from 'react';
import { C } from '../../theme';
import type { Mesa } from '../../api/tipos';
import { useMesas } from '../../api/mesas';
import { mensajeDeError } from '../../api/cliente';
import ZonaSeccion, { MAX_MESAS_SIN_SCROLL } from './ZonaSeccion';
import BarraSeccion from './BarraSeccion';

// /billar — pantalla operativa principal (HU-06): cuadrícula de mesas agrupada
// por zona y, debajo, la Barra (Observaciones finales #2; HU-16, HU-17).
// Los datos vienen de la API y se sincronizan cada 15 s entre los tres PCs.

const collator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });

export default function BillarDashboard() {
  const { data: mesas, isPending, isError, error, isRefetchError } = useMesas();

  const zonas = useMemo(() => {
    const porZona = new Map<string, Mesa[]>();
    for (const m of mesas ?? []) {
      const lista = porZona.get(m.zona) ?? [];
      lista.push(m);
      porZona.set(m.zona, lista);
    }
    return [...porZona.entries()].sort(([a], [b]) => collator.compare(a, b));
  }, [mesas]);

  const cabeSinScroll = zonas.length <= 1 && (mesas?.length ?? 0) <= MAX_MESAS_SIN_SCROLL;

  return (
    <div className="h-full flex flex-col p-5 gap-4 min-h-0 overflow-y-auto">
      {(isError || isRefetchError) && (
        <div role="alert" className="flex-shrink-0 rounded-lg border-2 px-4 py-2 t-body" style={{ borderColor: C.ball3, background: C.tint3, color: C.ink, fontSize: 15 }}>
          {mensajeDeError(error)} {mesas ? 'Se muestra el último estado conocido; reintentando…' : ''}
        </div>
      )}

      {isPending ? (
        <div className="flex-1 flex items-center justify-center t-heading" style={{ color: C.inkFaint }}>
          Cargando mesas…
        </div>
      ) : zonas.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
          <p className="t-heading" style={{ color: C.ink }}>
            No hay mesas activas
          </p>
          <p className="t-body" style={{ color: C.inkFaint }}>
            El administrador puede crearlas en Configuración → Mesas.
          </p>
        </div>
      ) : cabeSinScroll ? (
        <ZonaSeccion zona={zonas[0][0]} mesas={zonas[0][1]} modo="ajustar" />
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-6">
          {zonas.map(([zona, lista]) => (
            <ZonaSeccion key={zona} zona={zona} mesas={lista} modo="desplazar" />
          ))}
        </div>
      )}

      <BarraSeccion />
    </div>
  );
}
