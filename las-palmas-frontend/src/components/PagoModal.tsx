import { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, Button, Input, Textarea } from '@nextui-org/react';
import { C } from '../theme';
import { formatCOP } from '../utils';

interface Props {
  titulo: string;
  total: number;
  accent?: string; // color de acento del punto de venta (default: ink)
  onClose: () => void;
  onConfirm: () => void;
}

type Metodo = 'efectivo' | 'nequi' | 'fiado';

const METODOS: { id: Metodo; icon: string; label: string }[] = [
  { id: 'efectivo', icon: '💵', label: 'Efectivo' },
  { id: 'nequi', icon: '📱', label: 'Nequi' },
  { id: 'fiado', icon: '📋', label: 'Fiado' },
];

export default function PagoModal({ titulo, total, accent = C.ink, onClose, onConfirm }: Props) {
  const [metodo, setMetodo] = useState<Metodo>('efectivo');
  const [recibido, setRecibido] = useState('');
  const [notaFiado, setNotaFiado] = useState('');
  const [exito, setExito] = useState(false);

  const cambio = Math.max(0, Number(recibido.replace(/\D/g, '')) - total);
  const puedeConfirmar = metodo === 'fiado' ? notaFiado.trim().length > 0 : true;

  function confirmar() {
    if (!puedeConfirmar) return;
    setExito(true);
    setTimeout(() => onConfirm(), 1500);
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      hideCloseButton
      size="md"
      classNames={{
        wrapper: 'items-center',
        backdrop: 'bg-ink/45',
        base: 'rounded-lg border-2 border-ink shadow-sticker bg-white',
      }}
    >
      <ModalContent>
        {exito ? (
          <ModalBody>
            <div className="flex flex-col items-center justify-center py-14 gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center border-2" style={{ background: C.tint6, borderColor: C.ball6 }}>
                <span style={{ fontSize: 30, color: C.ball6 }}>✓</span>
              </div>
              <p className="t-heading" style={{ color: C.ball6 }}>
                ¡Cobro registrado!
              </p>
              <p className="t-body" style={{ color: C.inkFaint }}>
                Inventario actualizado
              </p>
            </div>
          </ModalBody>
        ) : (
          <>
            <ModalHeader className="flex items-center justify-between border-b-2 border-ink px-7 py-5">
              <span className="t-heading" style={{ color: C.ink }}>
                {titulo}
              </span>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-9 h-9 rounded-full border-2"
                style={{ borderColor: C.ink, color: C.ink }}
              >
                ✕
              </button>
            </ModalHeader>

            <ModalBody className="px-7 py-6 gap-5">
              <div className="text-center py-1">
                <p className="t-caption mb-1" style={{ color: C.inkFaint }}>
                  Total a cobrar
                </p>
                <p className="t-score" style={{ color: accent, fontSize: 48 }}>
                  {formatCOP(total)}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {METODOS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMetodo(m.id)}
                    className="flex flex-col items-center gap-2 py-5 rounded-lg t-label border-2 transition-all"
                    style={{
                      background: metodo === m.id ? C.ink : '#FFFFFF',
                      borderColor: C.ink,
                      color: metodo === m.id ? '#FFFFFF' : C.ink,
                      fontSize: 13,
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{m.icon}</span>
                    {m.label}
                  </button>
                ))}
              </div>

              {metodo === 'efectivo' && (
                <div className="space-y-3">
                  <div>
                    <label className="t-caption block mb-1.5" style={{ color: C.inkFaint }}>
                      Recibido
                    </label>
                    <Input
                      autoFocus
                      value={recibido}
                      onValueChange={setRecibido}
                      placeholder="$ 0"
                      classNames={{
                        inputWrapper: 'rounded-lg border-2 border-ink bg-white h-[60px] shadow-none',
                        input: 'text-[22px]',
                      }}
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    />
                  </div>
                  {recibido && (
                    <div className="flex items-center justify-between px-5 py-4 rounded-lg border-2" style={{ background: C.tint6, borderColor: C.ball6 }}>
                      <span className="t-heading" style={{ color: C.inkSoft, fontSize: 16 }}>
                        Cambio
                      </span>
                      <span className="t-score" style={{ color: C.ball6, fontSize: 36 }}>
                        {formatCOP(cambio)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {metodo === 'fiado' && (
                <div>
                  <label className="t-caption block mb-1.5" style={{ color: C.inkFaint }}>
                    ¿A nombre de quién y qué se acordó?
                  </label>
                  <Textarea
                    autoFocus
                    minRows={5}
                    value={notaFiado}
                    onValueChange={setNotaFiado}
                    placeholder="Ej: Don Carlos de la mesa 3, paga el viernes."
                    classNames={{
                      inputWrapper: 'rounded-lg border-2 border-ink bg-white shadow-none',
                      input: 't-body-l',
                    }}
                  />
                  {notaFiado.trim().length === 0 && (
                    <p className="t-caption mt-1" style={{ color: C.ball5 }}>
                      Este campo es obligatorio para registrar un fiado. No se asigna a ningún cliente registrado: la nota es el registro.
                    </p>
                  )}
                </div>
              )}

              <Button
                onPress={confirmar}
                isDisabled={!puedeConfirmar}
                radius="full"
                className="w-full t-label"
                style={{
                  height: 64,
                  background: puedeConfirmar ? C.ink : '#EFEFE9',
                  color: puedeConfirmar ? '#FFFFFF' : C.inkFaint,
                  fontSize: 16,
                }}
              >
                Confirmar cobro
              </Button>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
