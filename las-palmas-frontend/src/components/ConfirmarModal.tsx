import { useState, type ReactNode } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Textarea } from '@nextui-org/react';
import { C } from '../theme';

// Confirmación reutilizable, con campo de motivo opcional u obligatorio.
// Se usa para: poner fuera de servicio, anular apertura, dar de baja,
// cancelar una cuenta de barra.

interface Props {
  titulo: string;
  descripcion: ReactNode;
  textoConfirmar: string;
  /** 'peligro' pinta el botón en rojo (acciones que deshacen algo). */
  tono?: 'normal' | 'peligro';
  motivo?: { obligatorio: boolean; etiqueta: string; placeholder: string; min: number; max: number };
  cargando?: boolean;
  onConfirmar: (motivo: string) => void;
  onCerrar: () => void;
}

export default function ConfirmarModal({
  titulo,
  descripcion,
  textoConfirmar,
  tono = 'normal',
  motivo,
  cargando = false,
  onConfirmar,
  onCerrar,
}: Props) {
  const [texto, setTexto] = useState('');
  const limpio = texto.trim();
  const motivoValido = !motivo || (motivo.obligatorio ? limpio.length >= motivo.min : true);
  const puede = motivoValido && limpio.length <= (motivo?.max ?? Infinity) && !cargando;
  const colorBoton = tono === 'peligro' ? C.ball3 : C.ink;

  return (
    <Modal
      isOpen
      onClose={onCerrar}
      hideCloseButton
      size="md"
      isDismissable={!cargando}
      classNames={{ wrapper: 'items-center', backdrop: 'bg-ink/45', base: 'rounded-lg border-2 border-ink shadow-sticker bg-white' }}
    >
      <ModalContent>
        <ModalHeader className="flex items-center justify-between border-b-2 border-ink px-7 py-5">
          <span className="t-heading" style={{ color: C.ink }}>
            {titulo}
          </span>
          <button
            onClick={onCerrar}
            disabled={cargando}
            aria-label="Cerrar"
            className="flex items-center justify-center w-9 h-9 rounded-full border-2"
            style={{ borderColor: C.ink, color: C.ink }}
          >
            ✕
          </button>
        </ModalHeader>
        <ModalBody className="px-7 py-6 gap-4">
          <div className="t-body" style={{ color: C.inkSoft }}>
            {descripcion}
          </div>
          {motivo && (
            <div>
              <label className="t-caption block mb-1.5" style={{ color: C.inkFaint }}>
                {motivo.etiqueta}
                {motivo.obligatorio ? ' (obligatorio)' : ' (opcional)'}
              </label>
              <Textarea
                autoFocus
                minRows={3}
                value={texto}
                onValueChange={setTexto}
                placeholder={motivo.placeholder}
                maxLength={motivo.max}
                classNames={{
                  inputWrapper:
                    'rounded-lg border-2 border-ink bg-white data-[hover=true]:bg-white group-data-[focus=true]:bg-white shadow-none',
                  input: 't-body-l',
                }}
              />
              {motivo.obligatorio && limpio.length < motivo.min && (
                <p className="t-caption mt-1" style={{ color: C.ball5 }}>
                  Escribe al menos {motivo.min} caracteres: queda registrado en la auditoría.
                </p>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter className="border-t-2 border-ink px-7 py-4 gap-3">
          <Button
            radius="full"
            onPress={onCerrar}
            isDisabled={cargando}
            className="t-label border-2"
            style={{ background: '#FFFFFF', borderColor: C.ink, color: C.ink, height: 52, paddingInline: 22, fontSize: 13 }}
          >
            Volver
          </Button>
          <Button
            radius="full"
            onPress={() => puede && onConfirmar(limpio)}
            isDisabled={!puede}
            className="t-label border-2"
            style={{
              background: puede ? colorBoton : '#EFEFE9',
              borderColor: puede ? colorBoton : '#EFEFE9',
              color: puede ? '#FFFFFF' : C.inkFaint,
              height: 52,
              paddingInline: 24,
              fontSize: 13,
            }}
          >
            {cargando ? 'Guardando…' : textoConfirmar}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
