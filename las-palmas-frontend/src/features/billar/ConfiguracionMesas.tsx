import { useMemo, useState, type FormEvent } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from '@nextui-org/react';
import { C } from '../../theme';
import { formatCOP } from '../../utils';
import type { Mesa } from '../../api/tipos';
import { LIMITES } from '../../api/tipos';
import { useCambiarActivaMesa, useCrearMesa, useEditarMesa, useMesasConfiguracion } from '../../api/mesas';
import { mensajeDeError } from '../../api/cliente';
import { useAvisos } from '../../components/Avisos';
import ConfirmarModal from '../../components/ConfirmarModal';
import EstadoBadge from './EstadoBadge';

// Configuración → Mesas (solo Administrador): CRUD de mesas.
// Crear, editar (nombre, zona, tarifa) y dar de baja / de alta (baja lógica:
// la mesa sale de /billar pero su historial se conserva — RN-15).

const collator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });
const ZONA_POR_DEFECTO = 'Salón principal';

export function zonasDe(mesas: Mesa[]): { zona: string; activas: number; total: number }[] {
  const mapa = new Map<string, { activas: number; total: number }>();
  for (const m of mesas) {
    const z = mapa.get(m.zona) ?? { activas: 0, total: 0 };
    z.total += 1;
    if (m.activa) z.activas += 1;
    mapa.set(m.zona, z);
  }
  return [...mapa.entries()].map(([zona, v]) => ({ zona, ...v })).sort((a, b) => collator.compare(a.zona, b.zona));
}

export default function ConfiguracionMesas() {
  const { data: mesas, isPending, error } = useMesasConfiguracion();
  const { avisar } = useAvisos();
  const cambiarActiva = useCambiarActivaMesa();
  const [formulario, setFormulario] = useState<{ mesa: Mesa | null } | null>(null);
  const [dandoDeBaja, setDandoDeBaja] = useState<Mesa | null>(null);

  const zonas = useMemo(() => zonasDe(mesas ?? []).map((z) => z.zona), [mesas]);

  if (isPending) return <p className="t-body" style={{ color: C.inkFaint }}>Cargando mesas…</p>;
  if (!mesas) return <p className="t-body" style={{ color: C.ball3 }}>{mensajeDeError(error)}</p>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="t-heading" style={{ color: C.ink }}>
            Mesas del billar
          </h2>
          <p className="t-caption" style={{ color: C.inkFaint }}>
            {mesas.filter((m) => m.activa).length} activas · {mesas.filter((m) => !m.activa).length} dadas de baja
          </p>
        </div>
        <Button
          radius="full"
          onPress={() => setFormulario({ mesa: null })}
          className="t-label border-2"
          style={{ height: 50, background: C.ink, borderColor: C.ink, color: '#fff', fontSize: 13, paddingInline: 24 }}
        >
          + Agregar mesa
        </Button>
      </div>

      <div className="rounded-lg border-2 overflow-hidden" style={{ borderColor: C.ink }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#FAFAF7', borderBottom: `2px solid ${C.ink}` }}>
              {['Mesa', 'Zona', 'Tarifa', 'Estado', 'Alta / baja', 'Acciones'].map((h) => (
                <th key={h} className="px-5 py-3 text-left t-label" style={{ color: C.inkFaint, fontSize: 11 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mesas.map((m, i) => (
              <tr key={m.id} style={{ borderBottom: i < mesas.length - 1 ? '1.5px solid #EFEFE9' : 'none', opacity: m.activa ? 1 : 0.6 }}>
                <td className="px-5 py-3 t-body" style={{ color: C.ink, fontWeight: 600 }}>
                  {m.nombre}
                </td>
                <td className="px-5 py-3 t-body" style={{ color: C.inkSoft }}>
                  {m.zona}
                </td>
                <td className="px-5 py-3 t-body" style={{ color: C.inkSoft, fontVariantNumeric: 'tabular-nums' }}>
                  {formatCOP(m.tarifaPorMinuto)}/min
                </td>
                <td className="px-5 py-3">
                  <EstadoBadge estado={m.estado} tamano="grande" />
                </td>
                <td className="px-5 py-3">
                  <span
                    className="t-label px-2.5 py-0.5 rounded-full border-2"
                    style={{
                      background: m.activa ? C.tint6 : '#F2F1EB',
                      color: m.activa ? C.ball6 : C.inkFaint,
                      borderColor: m.activa ? C.ball6 : C.inkFaint,
                      fontSize: 10,
                    }}
                  >
                    {m.activa ? '✓ Activa' : '✕ De baja'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFormulario({ mesa: m })}
                      className="t-label px-3.5 py-1.5 rounded-full border-2"
                      style={{ borderColor: C.ink, color: C.ink, fontSize: 11 }}
                    >
                      Editar
                    </button>
                    {m.activa ? (
                      <button
                        onClick={() => setDandoDeBaja(m)}
                        disabled={m.estado === 'OCUPADA'}
                        title={m.estado === 'OCUPADA' ? 'Está en juego: no se puede dar de baja' : undefined}
                        className="t-label px-3.5 py-1.5 rounded-full border-2"
                        style={{
                          borderColor: m.estado === 'OCUPADA' ? '#D9D7CD' : C.ball3,
                          color: m.estado === 'OCUPADA' ? C.inkFaint : C.ball3,
                          fontSize: 11,
                          cursor: m.estado === 'OCUPADA' ? 'not-allowed' : 'pointer',
                        }}
                      >
                        Dar de baja
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          cambiarActiva.mutate(
                            { id: m.id, activa: true },
                            {
                              onSuccess: (r) => avisar(`${r.nombre} dada de alta`, 'exito'),
                              onError: (e) => avisar(mensajeDeError(e), 'error'),
                            },
                          )
                        }
                        disabled={cambiarActiva.isPending}
                        className="t-label px-3.5 py-1.5 rounded-full border-2"
                        style={{ borderColor: C.ball6, color: C.ball6, fontSize: 11 }}
                      >
                        Dar de alta
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {mesas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 t-body text-center" style={{ color: C.inkFaint }}>
                  Todavía no hay mesas. Agrega la primera.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {formulario && <MesaFormModal mesa={formulario.mesa} zonas={zonas} onCerrar={() => setFormulario(null)} />}
      {dandoDeBaja && (
        <ConfirmarModal
          titulo={`Dar de baja ${dandoDeBaja.nombre}`}
          descripcion="La mesa dejará de aparecer en la pantalla de Mesas y no se podrá abrir. Su historial se conserva y puedes darla de alta de nuevo cuando quieras."
          textoConfirmar="Dar de baja"
          tono="peligro"
          motivo={{ obligatorio: false, etiqueta: 'Motivo', placeholder: 'Ej.: se retiró del salón', ...LIMITES.motivo }}
          cargando={cambiarActiva.isPending}
          onCerrar={() => setDandoDeBaja(null)}
          onConfirmar={(motivo) =>
            cambiarActiva.mutate(
              { id: dandoDeBaja.id, activa: false, motivo: motivo || undefined },
              {
                onSuccess: (r) => {
                  avisar(`${r.nombre} dada de baja`, 'exito');
                  setDandoDeBaja(null);
                },
                onError: (e) => {
                  avisar(mensajeDeError(e), 'error');
                  setDandoDeBaja(null);
                },
              },
            )
          }
        />
      )}
    </div>
  );
}

const claseCampo = {
  inputWrapper: 'rounded-lg border-2 border-ink bg-white data-[hover=true]:bg-white group-data-[focus=true]:bg-white h-14 shadow-none',
  input: 't-body',
};

function MesaFormModal({ mesa, zonas, onCerrar }: { mesa: Mesa | null; zonas: string[]; onCerrar: () => void }) {
  const { avisar } = useAvisos();
  const crear = useCrearMesa();
  const editar = useEditarMesa();
  const editando = mesa !== null;
  const [nombre, setNombre] = useState(mesa?.nombre ?? '');
  const [zona, setZona] = useState(mesa?.zona ?? (zonas[0] ?? ZONA_POR_DEFECTO));
  const [tarifa, setTarifa] = useState(mesa ? String(mesa.tarifaPorMinuto) : '');
  const [error, setError] = useState<string | null>(null);
  const guardando = crear.isPending || editar.isPending;

  const tarifaTexto = tarifa.trim();
  const tarifaNumero = tarifaTexto === '' ? null : Number(tarifaTexto);
  const tarifaValida =
    tarifaNumero === null
      ? !editando // al crear, vacío = tarifa por defecto del negocio
      : Number.isInteger(tarifaNumero) && tarifaNumero >= LIMITES.tarifa.min && tarifaNumero <= LIMITES.tarifa.max;
  const valido = nombre.trim().length > 0 && zona.trim().length > 0 && tarifaValida;

  function guardar(e?: FormEvent) {
    e?.preventDefault();
    if (!valido || guardando) return;
    setError(null);
    const opciones = {
      onSuccess: (m: Mesa) => {
        avisar(editando ? `${m.nombre} actualizada` : `${m.nombre} creada`, 'exito');
        onCerrar();
      },
      onError: (err: unknown) => setError(mensajeDeError(err)),
    };
    if (mesa) {
      editar.mutate({ id: mesa.id, datos: { nombre: nombre.trim(), zona: zona.trim(), tarifaPorMinuto: tarifaNumero ?? mesa.tarifaPorMinuto } }, opciones);
    } else {
      crear.mutate({ nombre: nombre.trim(), zona: zona.trim(), tarifaPorMinuto: tarifaNumero }, opciones);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onCerrar}
      hideCloseButton
      size="lg"
      isDismissable={!guardando}
      classNames={{ wrapper: 'items-center', backdrop: 'bg-ink/45', base: 'rounded-lg border-2 border-ink shadow-sticker bg-white' }}
    >
      <ModalContent>
        <form onSubmit={guardar}>
          <ModalHeader className="flex items-center justify-between border-b-2 border-ink px-7 py-5">
            <span className="t-heading" style={{ color: C.ink }}>
              {editando ? `Editar ${mesa.nombre}` : 'Nueva mesa'}
            </span>
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar"
              className="flex items-center justify-center w-9 h-9 rounded-full border-2"
              style={{ borderColor: C.ink, color: C.ink }}
            >
              ✕
            </button>
          </ModalHeader>
          <ModalBody className="px-7 py-6 gap-4">
            <div>
              <label className="t-caption block mb-1.5" style={{ color: C.inkFaint }}>
                Nombre
              </label>
              <Input
                autoFocus
                value={nombre}
                onValueChange={(v) => {
                  setNombre(v);
                  setError(null);
                }}
                maxLength={LIMITES.nombreMesa}
                placeholder="Ej.: Mesa 9"
                classNames={claseCampo}
              />
            </div>
            <div>
              <label className="t-caption block mb-1.5" style={{ color: C.inkFaint }}>
                Zona
              </label>
              <Input value={zona} onValueChange={setZona} maxLength={LIMITES.zona} placeholder={ZONA_POR_DEFECTO} classNames={claseCampo} />
              {zonas.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {zonas.map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setZona(z)}
                      className="t-label px-3 py-1 rounded-full border-2"
                      style={{ fontSize: 11, borderColor: C.ink, background: z === zona.trim() ? C.ink : '#FFFFFF', color: z === zona.trim() ? '#FFFFFF' : C.ink }}
                    >
                      {z}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="t-caption block mb-1.5" style={{ color: C.inkFaint }}>
                Tarifa por minuto (COP){editando ? '' : ' — opcional'}
              </label>
              <Input
                value={tarifa}
                onValueChange={(v) => setTarifa(v.replace(/[^\d]/g, ''))}
                inputMode="numeric"
                placeholder={editando ? '' : 'Vacío = tarifa por defecto del negocio'}
                classNames={claseCampo}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              />
              {tarifaNumero !== null && tarifaValida && (
                <p className="t-caption mt-1.5" style={{ color: C.inkFaint }}>
                  Equivale a {formatCOP(tarifaNumero * 60)}/hora
                </p>
              )}
              {editando && mesa.estado === 'OCUPADA' && (
                <p className="t-caption mt-1.5" style={{ color: C.ball5 }}>
                  La mesa está en juego: conserva la tarifa con la que se abrió. La nueva aplica desde la próxima apertura.
                </p>
              )}
            </div>
            {error && (
              <p role="alert" className="t-body" style={{ color: C.ball3, fontSize: 15 }}>
                {error}
              </p>
            )}
          </ModalBody>
          <ModalFooter className="border-t-2 border-ink px-7 py-4 gap-3">
            <Button
              type="button"
              radius="full"
              onPress={onCerrar}
              isDisabled={guardando}
              className="t-label border-2"
              style={{ background: '#FFFFFF', borderColor: C.ink, color: C.ink, height: 52, paddingInline: 22, fontSize: 13 }}
            >
              Volver
            </Button>
            <Button
              type="submit"
              radius="full"
              isDisabled={!valido || guardando}
              className="t-label border-2"
              style={{
                background: valido ? C.ink : '#EFEFE9',
                borderColor: valido ? C.ink : '#EFEFE9',
                color: valido ? '#FFFFFF' : C.inkFaint,
                height: 52,
                paddingInline: 26,
                fontSize: 13,
              }}
            >
              {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear mesa'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

/** Configuración → Zonas: se derivan de las mesas (una zona existe si alguna mesa la usa). */
export function ConfiguracionZonas() {
  const { data: mesas, isPending, error } = useMesasConfiguracion();
  if (isPending) return <p className="t-body" style={{ color: C.inkFaint }}>Cargando zonas…</p>;
  if (!mesas) return <p className="t-body" style={{ color: C.ball3 }}>{mensajeDeError(error)}</p>;
  const zonas = zonasDe(mesas);
  return (
    <div className="max-w-[640px] space-y-4">
      <h2 className="t-heading" style={{ color: C.ink }}>
        Zonas del salón
      </h2>
      <div className="card-sticker p-6">
        {zonas.length === 0 && (
          <p className="t-body" style={{ color: C.inkFaint }}>
            Todavía no hay zonas.
          </p>
        )}
        {zonas.map((z, i) => (
          <div key={z.zona} className="flex items-center justify-between py-3" style={{ borderBottom: i < zonas.length - 1 ? '1.5px solid #EFEFE9' : 'none' }}>
            <div>
              <p className="t-body" style={{ color: C.ink, fontWeight: 600, fontSize: 15 }}>
                {z.zona}
              </p>
              <p className="t-caption" style={{ color: C.inkFaint }}>
                {z.activas} {z.activas === 1 ? 'mesa activa' : 'mesas activas'}
                {z.total > z.activas ? ` · ${z.total - z.activas} de baja` : ''}
              </p>
            </div>
          </div>
        ))}
        <p className="t-caption pt-3" style={{ color: C.inkFaint }}>
          Las zonas se crean al asignarlas a una mesa (Configuración → Mesas) y agrupan la pantalla de Mesas.
        </p>
      </div>
    </div>
  );
}
