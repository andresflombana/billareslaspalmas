import { useNavigate } from 'react-router-dom';
import { C } from '../../theme';
import { formatCOP, formatHoraOFecha } from '../../utils';
import type { Mesa } from '../../api/tipos';
import { useAbrirMesa, useCambiarEstadoMesa } from '../../api/mesas';
import { mensajeDeError } from '../../api/cliente';
import { useAuth } from '../../auth/AuthContext';
import { useAvisos } from '../../components/Avisos';
import MesaIlustracion from './MesaIlustracion';
import EstadoBadge, { FONDO_ESTADO } from './EstadoBadge';
import { estadoVisualDe, TRANSICION_MS } from './modelo/modeloMesa';

// Anatomía (PROMPT INTERFAZ BILLAR §6): ilustración → nombre + badge → dato
// según estado → acciones según estado y rol. Tamaños con clamp() para que la
// cuadrícula quepa sin scroll hasta 10 mesas (HU-06).

const tamLetra = {
  nombre: 'clamp(13px,1.8vh,20px)',
  dato: 'clamp(11px,1.45vh,16px)',
  boton: 'clamp(10px,1.1vh,13px)',
};

export default function MesaCard({ mesa }: { mesa: Mesa }) {
  const navigate = useNavigate();
  const { esAdmin } = useAuth();
  const { avisar } = useAvisos();
  const abrir = useAbrirMesa();
  const cambiarEstado = useCambiarEstadoMesa();

  function abrirMesa() {
    abrir.mutate(mesa.id, {
      onSuccess: (m) => avisar(`${m.nombre} abierta`, 'exito'),
      onError: (e) => avisar(mensajeDeError(e), 'error'),
    });
  }

  function reactivar() {
    cambiarEstado.mutate(
      { id: mesa.id, estado: 'LIBRE' },
      {
        onSuccess: (m) => avisar(`${m.nombre} reactivada: ya está disponible`, 'exito'),
        onError: (e) => avisar(mensajeDeError(e), 'error'),
      },
    );
  }

  const irADetalle = () => navigate(`/billar/${mesa.id}`);

  return (
    <article className="card-sticker flex flex-col overflow-hidden min-h-0" aria-label={mesa.nombre}>
      <button
        type="button"
        onClick={irADetalle}
        title={`Ver ${mesa.nombre}`}
        className="flex-1 min-h-0 w-full"
        style={{
          padding: 'clamp(4px,1.2vh,16px)',
          background: FONDO_ESTADO[mesa.estado],
          borderBottom: `2px solid ${C.ink}`,
          transition: `background-color ${TRANSICION_MS}ms ease`,
        }}
      >
        <MesaIlustracion estado={estadoVisualDe(mesa.estado)} />
      </button>

      <div className="flex flex-col flex-shrink-0" style={{ padding: 'clamp(7px,1.3vh,16px)', gap: 'clamp(3px,0.8vh,9px)' }}>
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="t-heading truncate" style={{ color: C.ink, fontSize: tamLetra.nombre }}>
            {mesa.nombre}
          </span>
          <EstadoBadge estado={mesa.estado} />
        </div>

        <p className="t-body truncate" style={{ color: C.inkSoft, fontSize: tamLetra.dato, lineHeight: 1.3 }}>
          <DatoSegunEstado mesa={mesa} />
        </p>

        <div className="flex gap-2" style={{ minHeight: 'clamp(30px,4.6vh,52px)' }}>
          {mesa.estado === 'LIBRE' && (
            <button
              onClick={abrirMesa}
              disabled={abrir.isPending}
              className="flex-1 rounded-full t-label border-2 transition-all"
              style={{ background: C.ball1, borderColor: C.ink, color: C.ink, fontSize: tamLetra.boton, opacity: abrir.isPending ? 0.6 : 1 }}
            >
              {abrir.isPending ? 'Abriendo…' : 'Abrir mesa'}
            </button>
          )}
          {mesa.estado === 'OCUPADA' && (
            <button
              onClick={irADetalle}
              className="flex-1 rounded-full t-label border-2 transition-all"
              style={{ background: '#FFFFFF', borderColor: C.ink, color: C.ink, fontSize: tamLetra.boton }}
            >
              Ver detalle
            </button>
          )}
          {mesa.estado === 'FUERA_SERVICIO' && esAdmin && (
            // HU-08: solo el Administrador ve esta acción.
            <button
              onClick={reactivar}
              disabled={cambiarEstado.isPending}
              className="flex-1 rounded-full t-label border-2 transition-all"
              style={{ background: '#FFFFFF', borderColor: C.ink, color: C.ink, fontSize: tamLetra.boton, opacity: cambiarEstado.isPending ? 0.6 : 1 }}
            >
              {cambiarEstado.isPending ? 'Reactivando…' : 'Reactivar'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function DatoSegunEstado({ mesa }: { mesa: Mesa }) {
  switch (mesa.estado) {
    case 'LIBRE':
      return <>Tarifa: {formatCOP(mesa.tarifaPorMinuto)}/min</>;
    case 'OCUPADA':
      // El cronómetro en vivo (HU-10) llega en el Sprint 2; aquí la hora de apertura del servidor.
      return (
        <>
          Desde {mesa.startedAt ? formatHoraOFecha(mesa.startedAt) : '—'}
          {mesa.sesion ? ` · ${mesa.sesion.abiertaPor.nombre}` : ''}
        </>
      );
    case 'FUERA_SERVICIO':
      return <>{mesa.motivoFueraServicio ?? 'Fuera de servicio'}</>;
    default:
      return <>&nbsp;</>;
  }
}
