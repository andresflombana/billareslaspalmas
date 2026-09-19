import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { C } from '../theme';

// Avisos breves (esquina superior derecha) para confirmar acciones o explicar
// por qué no se pudieron hacer. Estilo "Rack & Score": borde de 2px e ícono,
// nunca solo color (RNF-15).

type Tipo = 'exito' | 'error' | 'info';

interface Aviso {
  id: number;
  tipo: Tipo;
  texto: string;
}

interface ContextoAvisos {
  avisar: (texto: string, tipo?: Tipo) => void;
}

const Contexto = createContext<ContextoAvisos | null>(null);

const ESTILO: Record<Tipo, { icono: string; borde: string; fondo: string; color: string }> = {
  exito: { icono: '✓', borde: C.ball6, fondo: C.tint6, color: C.ball6 },
  error: { icono: '!', borde: C.ball3, fondo: C.tint3, color: C.ball3 },
  info: { icono: 'i', borde: C.ink, fondo: '#FFFFFF', color: C.ink },
};

export function AvisosProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const siguiente = useRef(1);

  const quitar = useCallback((id: number) => setAvisos((lista) => lista.filter((a) => a.id !== id)), []);

  const avisar = useCallback(
    (texto: string, tipo: Tipo = 'info') => {
      const id = siguiente.current++;
      setAvisos((lista) => [...lista.slice(-3), { id, tipo, texto }]);
      window.setTimeout(() => quitar(id), tipo === 'error' ? 7000 : 4000);
    },
    [quitar],
  );

  const valor = useMemo(() => ({ avisar }), [avisar]);

  return (
    <Contexto.Provider value={valor}>
      {children}
      <div className="fixed top-4 right-4 flex flex-col gap-2" style={{ zIndex: 60, maxWidth: 420 }} aria-live="polite">
        {avisos.map((a) => {
          const e = ESTILO[a.tipo];
          return (
            <div
              key={a.id}
              role={a.tipo === 'error' ? 'alert' : 'status'}
              className="flex items-start gap-3 rounded-lg border-2 px-4 py-3 shadow-sticker"
              style={{ background: '#FFFFFF', borderColor: e.borde }}
            >
              <span
                className="flex items-center justify-center rounded-full border-2 t-label flex-shrink-0"
                style={{ width: 26, height: 26, background: e.fondo, borderColor: e.borde, color: e.color, fontSize: 13 }}
              >
                {e.icono}
              </span>
              <p className="t-body flex-1" style={{ color: C.ink, fontSize: 15 }}>
                {a.texto}
              </p>
              <button onClick={() => quitar(a.id)} aria-label="Cerrar aviso" style={{ color: C.inkFaint }}>
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </Contexto.Provider>
  );
}

export function useAvisos(): ContextoAvisos {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useAvisos debe usarse dentro de <AvisosProvider>');
  return ctx;
}
