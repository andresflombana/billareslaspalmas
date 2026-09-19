import { useState, type FormEvent } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from '@nextui-org/react';
import { C } from '../../theme';
import { formatHoraOFecha } from '../../utils';
import type { Barra, CuentaBarra } from '../../api/tipos';
import { LIMITES } from '../../api/tipos';
import { useAbrirBarra, useAbrirCuenta, useBarras, useCancelarCuenta, useCerrarBarra } from '../../api/barras';
import { mensajeDeError } from '../../api/cliente';
import { useAvisos } from '../../components/Avisos';
import ConfirmarModal from '../../components/ConfirmarModal';

// Sección "Barra" debajo de las mesas (Observaciones finales #2).
// HU-16: Barra 1 y Barra 2 se abren y cierran de forma independiente.
// HU-17: cada barra abierta admite varias cuentas simultáneas (varios clientes).
// Los productos de cada cuenta se agregan en el Sprint 3.

export default function BarraSeccion() {
  const { data: barras, isPending } = useBarras();

  return (
    <section aria-label="Barra" className="flex-shrink-0">
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))' }}>
        {isPending || !barras
          ? [0, 1].map((i) => <div key={i} className="card-sticker" style={{ height: 'clamp(118px,17vh,170px)', background: '#FAFAF7' }} />)
          : barras.map((b) => <BarraTarjeta key={b.id} barra={b} />)}
      </div>
    </section>
  );
}

function BarraTarjeta({ barra }: { barra: Barra }) {
  const { avisar } = useAvisos();
  const abrir = useAbrirBarra();
  const cerrar = useCerrarBarra();
  const [nuevaCuenta, setNuevaCuenta] = useState(false);
  const [cancelando, setCancelando] = useState<CuentaBarra | null>(null);
  const cancelar = useCancelarCuenta();

  const abierta = barra.estado === 'ABIERTA';
  const hayCuentas = barra.cuentas.length > 0;
  const error = (e: unknown) => avisar(mensajeDeError(e), 'error');

  return (
    <div className="card-sticker flex flex-col min-w-0" style={{ minHeight: 'clamp(118px,17vh,170px)', padding: 'clamp(8px,1.3vh,14px) 16px' }}>
      <div className="flex items-center gap-x-3 gap-y-2 flex-shrink-0 flex-wrap">
        <span className="t-heading" style={{ color: C.ink, fontSize: 'clamp(14px,1.8vh,19px)' }}>
          {barra.nombre}
        </span>
        <span
          className="inline-flex items-center gap-1 rounded-full t-label border-2"
          title={abierta ? `${barra.cuentas.length} ${barra.cuentas.length === 1 ? 'cuenta abierta' : 'cuentas abiertas'}` : undefined}
          style={{
            fontSize: 11,
            padding: '2px 10px',
            background: abierta ? C.tint6 : '#F2F1EB',
            color: abierta ? C.ball6 : C.inkFaint,
            borderColor: abierta ? C.ball6 : C.inkFaint,
          }}
        >
          <span aria-hidden>{abierta ? '●' : '○'}</span> {abierta ? `Abierta · ${barra.cuentas.length}` : 'Cerrada'}
        </span>
        <div className="flex-1" />
        {abierta ? (
          <>
            <button
              onClick={() => setNuevaCuenta(true)}
              className="rounded-full t-label border-2"
              style={{ height: 36, paddingInline: 14, background: C.ball1, borderColor: C.ink, color: C.ink, fontSize: 11 }}
            >
              + Nueva cuenta
            </button>
            <button
              onClick={() =>
                cerrar.mutate(barra.id, { onSuccess: (b) => avisar(`${b.nombre} cerrada`, 'exito'), onError: error })
              }
              disabled={hayCuentas || cerrar.isPending}
              title={hayCuentas ? 'Cierra o cobra sus cuentas antes de cerrar la barra' : undefined}
              className="rounded-full t-label border-2"
              style={{
                height: 36,
                paddingInline: 14,
                background: '#FFFFFF',
                borderColor: hayCuentas ? '#D9D7CD' : C.ink,
                color: hayCuentas ? C.inkFaint : C.ink,
                fontSize: 11,
                cursor: hayCuentas ? 'not-allowed' : 'pointer',
              }}
            >
              {cerrar.isPending ? 'Cerrando…' : 'Cerrar barra'}
            </button>
          </>
        ) : (
          <button
            onClick={() => abrir.mutate(barra.id, { onSuccess: (b) => avisar(`${b.nombre} abierta`, 'exito'), onError: error })}
            disabled={abrir.isPending}
            className="rounded-full t-label border-2"
            style={{ height: 36, paddingInline: 16, background: C.ink, borderColor: C.ink, color: '#FFFFFF', fontSize: 11 }}
          >
            {abrir.isPending ? 'Abriendo…' : 'Abrir barra'}
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 flex items-center mt-2">
        {!abierta ? (
          <p className="t-body" style={{ color: C.inkFaint, fontSize: 'clamp(12px,1.5vh,15px)' }}>
            Barra cerrada. Ábrela para atender clientes en la barra.
          </p>
        ) : !hayCuentas ? (
          <p className="t-body" style={{ color: C.inkFaint, fontSize: 'clamp(12px,1.5vh,15px)' }}>
            Sin cuentas abiertas. Usa «Nueva cuenta» para cada cliente.
          </p>
        ) : (
          <ul className="flex gap-2 overflow-x-auto w-full pb-1" aria-label={`Cuentas abiertas de ${barra.nombre}`}>
            {barra.cuentas.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-2 rounded-full border-2 flex-shrink-0"
                style={{ borderColor: C.ink, padding: '4px 6px 4px 14px', background: '#FFFFFF' }}
              >
                <span className="t-label" style={{ color: C.ink, fontSize: 12 }}>
                  {c.etiqueta}
                </span>
                <span className="t-caption" style={{ color: C.inkFaint }}>
                  {formatHoraOFecha(c.abiertaEn)}
                </span>
                <button
                  onClick={() => setCancelando(c)}
                  aria-label={`Cancelar ${c.etiqueta}`}
                  title="Cancelar cuenta (abierta por error)"
                  className="flex items-center justify-center rounded-full border-2"
                  style={{ width: 28, height: 28, borderColor: C.inkFaint, color: C.inkFaint, fontSize: 12 }}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {nuevaCuenta && <NuevaCuentaModal barra={barra} onCerrar={() => setNuevaCuenta(false)} />}
      {cancelando && (
        <ConfirmarModal
          titulo={`Cancelar ${cancelando.etiqueta}`}
          descripcion={
            <>
              La cuenta se cierra <b>sin cobro</b>. Úsalo solo si se abrió por error: una cuenta con consumos debe cobrarse.
            </>
          }
          textoConfirmar="Cancelar cuenta"
          tono="peligro"
          cargando={cancelar.isPending}
          onCerrar={() => setCancelando(null)}
          onConfirmar={() =>
            cancelar.mutate(cancelando.id, {
              onSuccess: (c) => {
                avisar(`${c.etiqueta} cancelada`, 'exito');
                setCancelando(null);
              },
              onError: (e) => {
                error(e);
                setCancelando(null);
              },
            })
          }
        />
      )}
    </div>
  );
}

function NuevaCuentaModal({ barra, onCerrar }: { barra: Barra; onCerrar: () => void }) {
  const { avisar } = useAvisos();
  const abrirCuenta = useAbrirCuenta();
  const [etiqueta, setEtiqueta] = useState('');
  const [error, setError] = useState<string | null>(null);

  function enviar(e?: FormEvent) {
    e?.preventDefault();
    if (abrirCuenta.isPending) return;
    setError(null);
    abrirCuenta.mutate(
      { barraId: barra.id, etiqueta: etiqueta.trim() || null },
      {
        onSuccess: (c) => {
          avisar(`${c.etiqueta} abierta en ${barra.nombre}`, 'exito');
          onCerrar();
        },
        onError: (err) => setError(mensajeDeError(err)),
      },
    );
  }

  return (
    <Modal
      isOpen
      onClose={onCerrar}
      hideCloseButton
      size="md"
      classNames={{ wrapper: 'items-center', backdrop: 'bg-ink/45', base: 'rounded-lg border-2 border-ink shadow-sticker bg-white' }}
    >
      <ModalContent>
        <form onSubmit={enviar}>
          <ModalHeader className="flex items-center justify-between border-b-2 border-ink px-7 py-5">
            <span className="t-heading" style={{ color: C.ink }}>
              Nueva cuenta · {barra.nombre}
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
          <ModalBody className="px-7 py-6 gap-3">
            <label className="t-caption block" style={{ color: C.inkFaint }}>
              Nombre de la cuenta (opcional)
            </label>
            <Input
              autoFocus
              value={etiqueta}
              onValueChange={(v) => {
                setEtiqueta(v);
                setError(null);
              }}
              maxLength={LIMITES.etiquetaCuenta}
              placeholder="Ej.: Señor de gorra, Mesa alta 2"
              classNames={{
                inputWrapper:
                  'rounded-lg border-2 border-ink bg-white data-[hover=true]:bg-white group-data-[focus=true]:bg-white h-14 shadow-none',
                input: 't-body-l',
              }}
            />
            <p className="t-caption" style={{ color: C.inkFaint }}>
              Si lo dejas vacío se numera sola: «Cuenta 1», «Cuenta 2»…
            </p>
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
              className="t-label border-2"
              style={{ background: '#FFFFFF', borderColor: C.ink, color: C.ink, height: 52, paddingInline: 22, fontSize: 13 }}
            >
              Volver
            </Button>
            <Button
              type="submit"
              radius="full"
              isDisabled={abrirCuenta.isPending}
              className="t-label border-2"
              style={{ background: C.ink, borderColor: C.ink, color: '#FFFFFF', height: 52, paddingInline: 24, fontSize: 13 }}
            >
              {abrirCuenta.isPending ? 'Abriendo…' : 'Abrir cuenta'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
