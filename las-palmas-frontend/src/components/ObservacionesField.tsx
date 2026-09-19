import { useState } from 'react';
import { Textarea, Button } from '@nextui-org/react';
import { C } from '../theme';

interface Entrada {
  texto: string;
  hora: string;
}

interface Props {
  label?: string;
  hint?: string;
  rows?: number;
  autoSave?: boolean;
  readOnly?: boolean;
  defaultValue?: string;
  onChange?: (v: string) => void;
}

const inputClassNames = {
  inputWrapper:
    'rounded-lg border-2 border-ink bg-white data-[hover=true]:bg-white group-data-[focus=true]:bg-white shadow-none',
  input: 't-body-l text-ink placeholder:text-ink-faint',
};

export default function ObservacionesField({
  label = 'Observaciones',
  hint,
  rows = 3,
  autoSave = false,
  readOnly = false,
  defaultValue = '',
  onChange,
}: Props) {
  const [valor, setValor] = useState(defaultValue);
  const [historial, setHistorial] = useState<Entrada[]>([]);

  function manejarCambio(v: string) {
    setValor(v);
    onChange?.(v);
  }

  function guardar() {
    if (!valor.trim()) return;
    const hora = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    setHistorial((prev) => [{ texto: valor.trim(), hora }, ...prev]);
    setValor('');
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="t-label" style={{ color: C.inkSoft, fontSize: 12 }}>
        {label}
      </label>
      {hint && (
        <p className="t-caption" style={{ color: C.inkFaint }}>
          {hint}
        </p>
      )}

      {readOnly ? (
        <p
          className="t-body-l rounded-lg px-4 py-3 border-2"
          style={{ color: C.inkSoft, background: '#FAFAF7', borderColor: C.ink, minHeight: 60 }}
        >
          {valor || <span style={{ color: C.inkFaint, fontStyle: 'italic' }}>Sin observaciones</span>}
        </p>
      ) : (
        <Textarea
          minRows={rows}
          value={valor}
          onValueChange={manejarCambio}
          placeholder={hint ? '' : 'Ej: Novedades, daños, acuerdos con el cliente.'}
          classNames={inputClassNames}
        />
      )}

      {autoSave && !readOnly && (
        <Button
          size="sm"
          radius="full"
          onPress={guardar}
          isDisabled={!valor.trim()}
          className="self-end t-label border-2"
          style={{
            background: valor.trim() ? C.ball1 : '#FFFFFF',
            color: C.ink,
            borderColor: C.ink,
            fontSize: 12,
          }}
        >
          Guardar nota
        </Button>
      )}

      {autoSave && historial.length > 0 && (
        <div className="space-y-2 mt-1">
          {historial.map((e, i) => (
            <div key={i} className="rounded-lg px-3 py-2 flex gap-3 border-2" style={{ background: '#FAFAF7', borderColor: C.ink }}>
              <span className="t-caption flex-shrink-0 mt-0.5" style={{ color: C.inkFaint }}>
                {e.hora}
              </span>
              <p className="t-body" style={{ color: C.inkSoft, fontSize: 15 }}>
                {e.texto}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Punto indicador en filas de tabla cuando el registro tiene observaciones. */
export function NotaIcon({ texto }: { texto?: string }) {
  if (!texto) return null;
  return (
    <div className="tooltip-anchor flex items-center justify-center">
      <span
        aria-label="Tiene observaciones"
        style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: C.ink }}
      />
      <div className="tooltip-box">{texto.length > 80 ? texto.slice(0, 77) + '…' : texto}</div>
    </div>
  );
}
