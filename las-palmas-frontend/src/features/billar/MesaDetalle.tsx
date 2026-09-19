import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { C } from '../../theme';
import { formatCOP, formatHoraOFecha } from '../../utils';
import type { Mesa } from '../../api/tipos';
import { LIMITES } from '../../api/tipos';
import { useAbrirMesa, useAnularApertura, useCambiarEstadoMesa, useMesa } from '../../api/mesas';
import { esApiError, mensajeDeError } from '../../api/cliente';
import { useAuth } from '../../auth/AuthContext';
import { useAvisos } from '../../components/Avisos';
import ConfirmarModal from '../../components/ConfirmarModal';
import EstadoBadge, { FONDO_ESTADO } from './EstadoBadge';
import MesaEscena3D from './MesaEscena3D';
import { estadoVisualDe, TRANSICION_MS } from './modelo/modeloMesa';

// /billar/:mesaId — detalle de una mesa con la escena 3D viva (React Three
// Fiber). En Sprint 1: estado, datos de la sesión y acciones por rol.
// Cronómetro (Sprint 2) y consumos (Sprint 3) se agregan en este mismo panel.

type Dialogo = 'fuera-servicio' | 'anular' | null;

export default function MesaDetalle() {
  const { mesaId } = useParams();
  const id = Number(mesaId);
  const { data: mesa, isPending, error } = useMesa(id);

  if (!Number.isInteger(id) || id <= 0 || (esApiError(error) && error.status === 404)) {
    return <Mensaje titulo="Esta mesa no existe" />;
  }
  if (isPending) return <Mensaje titulo="Cargando mesa…" />;
  if (!mesa) return <Mensaje titulo="No se pudo cargar la mesa" texto={mensajeDeError(error)} />;
  return <Detalle mesa={mesa} />;
}

function Detalle({ mesa }: { mesa: Mesa }) {
  const { esAdmin } = useAuth();
  const { avisar } = useAvisos();
  const abrir = useAbrirMesa();
  const cambiarEstado = useCambiarEstadoMesa();
  const anular = useAnularApertura();
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const error = (e: unknown) => avisar(mensajeDeError(e), 'error');

  const estadoVisual = estadoVisualDe(mesa.estado);

  return (
    <div className="h-full flex overflow-hidden">
      {/* Escena 3D viva */}
      <div className="flex-1 min-w-0 flex flex-col p-5 gap-3">
        <Link to="/billar" className="t-label self-start hover:opacity-70 transition-opacity" style={{ color: C.ink, fontSize: 12 }}>
          ← Volver a mesas
        </Link>
        <div
          className="card-sticker flex-1 min-h-0 relative overflow-hidden"
          style={{ background: FONDO_ESTADO[mesa.estado], transition: `background-color ${TRANSICION_MS}ms ease` }}
        >
          <MesaEscena3D estado={estadoVisual} />
          <p className="absolute bottom-3 left-4 t-caption pointer-events-none" style={{ color: C.inkFaint }}>
            Arrastra para girar la mesa
          </p>
        </div>
      </div>

      {/* Panel de información y acciones */}
      <aside className="flex flex-col flex-shrink-0 overflow-y-auto p-5 gap-4" style={{ width: 360, borderLeft: `2px solid ${C.ink}` }}>
        <div className="card-sticker px-5 py-4 flex flex-col gap-2">
          <p className="t-caption" style={{ color: C.inkFaint }}>
            {mesa.zona} · Billar
          </p>
          <div className="flex items-center justify-between gap-3">
            <h2 className="t-title truncate" style={{ color: C.ink }}>
              {mesa.nombre}
            </h2>
            <EstadoBadge estado={mesa.estado} tamano="grande" />
          </div>
          {!mesa.activa && (
            <p className="t-body rounded-lg border-2 px-3 py-2 mt-1" style={{ borderColor: C.ball5, background: C.tint5, color: C.ink, fontSize: 14 }}>
              Esta mesa está dada de baja: no aparece en la cuadrícula ni se puede abrir.
            </p>
          )}
        </div>

        <div className="card-sticker px-5 py-4 flex flex-col gap-3">
          {mesa.estado === 'OCUPADA' && (
            <>
              <div>
                <p className="t-caption" style={{ color: C.inkFaint }}>
                  Abierta desde
                </p>
                <p className="t-score" style={{ color: C.ink, fontSize: 40 }}>
                  {mesa.startedAt ? formatHoraOFecha(mesa.startedAt) : '—'}
                </p>
              </div>
              {mesa.sesion && (
                <div className="space-y-1 pt-3" style={{ borderTop: '1.5px solid #EFEFE9' }}>
                  <Fila etiqueta="Abrió" valor={mesa.sesion.abiertaPor.nombre} />
                  <Fila etiqueta="Tarifa aplicada" valor={`${formatCOP(mesa.sesion.tarifaAplicada)}/min`} />
                  {mesa.sesion.tarifaAplicada !== mesa.tarifaPorMinuto && (
                    <p className="t-caption" style={{ color: C.inkFaint }}>
                      Se conserva la tarifa vigente al abrir. La tarifa actual de la mesa ({formatCOP(mesa.tarifaPorMinuto)}/min) aplica desde la
                      próxima apertura.
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {mesa.estado === 'LIBRE' && (
            <>
              <Fila etiqueta="Tarifa" valor={`${formatCOP(mesa.tarifaPorMinuto)}/min`} />
              {mesa.activa && (
                <button
                  onClick={() =>
                    abrir.mutate(mesa.id, { onSuccess: (m) => avisar(`${m.nombre} abierta`, 'exito'), onError: error })
                  }
                  disabled={abrir.isPending}
                  className="rounded-full t-label border-2 w-full"
                  style={{ height: 56, background: C.ball1, borderColor: C.ink, color: C.ink, fontSize: 14, opacity: abrir.isPending ? 0.6 : 1 }}
                >
                  {abrir.isPending ? 'Abriendo…' : 'Abrir mesa'}
                </button>
              )}
            </>
          )}

          {mesa.estado === 'FUERA_SERVICIO' && (
            <div>
              <p className="t-caption" style={{ color: C.inkFaint }}>
                Motivo
              </p>
              <p className="t-body" style={{ color: C.ink }}>
                {mesa.motivoFueraServicio ?? 'Sin motivo registrado'}
              </p>
            </div>
          )}
        </div>

        {/* HU-03 / HU-08: estas acciones solo existen para el Administrador. */}
        {esAdmin && (
          <div className="card-sticker px-5 py-4 flex flex-col gap-3">
            <p className="t-label" style={{ color: C.inkSoft, fontSize: 12 }}>
              Acciones de administrador
            </p>
            {!mesa.activa ? (
              <Link to="/configuracion" className="t-body underline" style={{ color: C.ink }}>
                Gestionar en Configuración → Mesas
              </Link>
            ) : (
              <>
                {mesa.estado === 'LIBRE' && (
                  <BotonSecundario onClick={() => setDialogo('fuera-servicio')}>Poner fuera de servicio</BotonSecundario>
                )}
                {mesa.estado === 'FUERA_SERVICIO' && (
                  <BotonSecundario
                    cargando={cambiarEstado.isPending}
                    onClick={() =>
                      cambiarEstado.mutate(
                        { id: mesa.id, estado: 'LIBRE' },
                        { onSuccess: (m) => avisar(`${m.nombre} reactivada: ya está disponible`, 'exito'), onError: error },
                      )
                    }
                  >
                    {cambiarEstado.isPending ? 'Reactivando…' : 'Reactivar mesa'}
                  </BotonSecundario>
                )}
                {mesa.estado === 'OCUPADA' && (
                  <BotonSecundario peligro onClick={() => setDialogo('anular')}>
                    Anular apertura
                  </BotonSecundario>
                )}
              </>
            )}
          </div>
        )}
      </aside>

      {dialogo === 'fuera-servicio' && (
        <ConfirmarModal
          titulo={`${mesa.nombre} fuera de servicio`}
          descripcion="La mesa dejará de estar disponible para abrir hasta que un administrador la reactive. Los operadores verán el motivo."
          textoConfirmar="Poner fuera de servicio"
          motivo={{ obligatorio: true, etiqueta: 'Motivo', placeholder: 'Ej.: paño roto, mantenimiento', ...LIMITES.motivo }}
          cargando={cambiarEstado.isPending}
          onCerrar={() => setDialogo(null)}
          onConfirmar={(motivo) =>
            cambiarEstado.mutate(
              { id: mesa.id, estado: 'FUERA_SERVICIO', motivo },
              {
                onSuccess: (m) => {
                  avisar(`${m.nombre} quedó fuera de servicio`, 'exito');
                  setDialogo(null);
                },
                onError: (e) => {
                  error(e);
                  setDialogo(null);
                },
              },
            )
          }
        />
      )}

      {dialogo === 'anular' && (
        <ConfirmarModal
          titulo={`Anular apertura de ${mesa.nombre}`}
          descripcion={
            <>
              La mesa vuelve a quedar <b>disponible sin cobro</b>. La apertura queda anulada en el historial con tu nombre, la hora y el
              motivo. Úsalo solo si la mesa se abrió por error.
            </>
          }
          textoConfirmar="Anular apertura"
          tono="peligro"
          motivo={{ obligatorio: true, etiqueta: 'Motivo', placeholder: 'Ej.: se abrió la mesa equivocada', ...LIMITES.motivo }}
          cargando={anular.isPending}
          onCerrar={() => setDialogo(null)}
          onConfirmar={(motivo) =>
            anular.mutate(
              { id: mesa.id, motivo },
              {
                onSuccess: (m) => {
                  avisar(`Apertura de ${m.nombre} anulada`, 'exito');
                  setDialogo(null);
                },
                onError: (e) => {
                  error(e);
                  setDialogo(null);
                },
              },
            )
          }
        />
      )}
    </div>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <p className="t-body flex justify-between gap-3" style={{ fontSize: 15 }}>
      <span style={{ color: C.inkFaint }}>{etiqueta}</span>
      <span style={{ color: C.ink, fontWeight: 600 }}>{valor}</span>
    </p>
  );
}

function BotonSecundario({
  children,
  onClick,
  peligro = false,
  cargando = false,
}: {
  children: ReactNode;
  onClick: () => void;
  peligro?: boolean;
  cargando?: boolean;
}) {
  const color = peligro ? C.ball3 : C.ink;
  return (
    <button
      onClick={onClick}
      disabled={cargando}
      className="rounded-full t-label border-2 w-full"
      style={{ height: 52, background: '#FFFFFF', borderColor: color, color, fontSize: 13, opacity: cargando ? 0.6 : 1 }}
    >
      {children}
    </button>
  );
}

function Mensaje({ titulo, texto }: { titulo: string; texto?: string }) {
  const navigate = useNavigate();
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 text-center p-6">
      <p className="t-heading" style={{ color: C.ink }}>
        {titulo}
      </p>
      {texto && (
        <p className="t-body" style={{ color: C.inkFaint }}>
          {texto}
        </p>
      )}
      <button
        onClick={() => navigate('/billar')}
        className="rounded-full t-label border-2"
        style={{ height: 48, paddingInline: 24, borderColor: C.ink, color: C.ink, fontSize: 13 }}
      >
        ← Volver a mesas
      </button>
    </div>
  );
}
