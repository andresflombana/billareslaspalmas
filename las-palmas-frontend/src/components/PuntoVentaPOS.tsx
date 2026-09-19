import { useState } from 'react';
import { Input } from '@nextui-org/react';
import { Producto } from '../types';
import { C } from '../theme';
import { formatCOP, getTokenColor, getInitials } from '../utils';
import PagoModal from './PagoModal';

interface LineaVenta {
  prodId: number;
  nombre: string;
  cantidad: number;
  precioUnit: number;
}

interface Props {
  cajaLabel: string; // "Caja: Venta Directa" | "Caja: Licorera"
  accent: string; // color de identidad del módulo (bola)
  accentTint: string;
  accentTextOnTint: string; // color de texto legible sobre accentTint
  productos: Producto[];
  categorias: string[];
}

export default function PuntoVentaPOS({ cajaLabel, accent, accentTint, accentTextOnTint, productos: productosIniciales, categorias }: Props) {
  const [productos] = useState<Producto[]>(productosIniciales);
  const [lineas, setLineas] = useState<LineaVenta[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cat, setCat] = useState('Todo');
  const [pagando, setPagando] = useState(false);

  const total = lineas.reduce((s, l) => s + l.cantidad * l.precioUnit, 0);

  function agregar(prod: Producto) {
    if (prod.stock === 0) return;
    setLineas((prev) => {
      const existe = prev.find((l) => l.prodId === prod.id);
      return existe
        ? prev.map((l) => (l.prodId === prod.id ? { ...l, cantidad: l.cantidad + 1 } : l))
        : [...prev, { prodId: prod.id, nombre: prod.nombre, cantidad: 1, precioUnit: prod.precio }];
    });
  }
  function cambiarCantidad(prodId: number, delta: number) {
    setLineas((prev) => prev.map((l) => (l.prodId === prodId ? { ...l, cantidad: l.cantidad + delta } : l)).filter((l) => l.cantidad > 0));
  }
  function confirmar() {
    setLineas([]);
    setPagando(false);
  }

  const prodsFiltrados = productos.filter((p) => {
    const matchCat = cat === 'Todo' || p.categoria === cat;
    const matchBus = !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return matchCat && matchBus;
  });

  return (
    <div className="h-full flex overflow-hidden">
      {/* Catálogo */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center px-5 py-3 flex-shrink-0" style={{ borderBottom: `2px solid ${C.ink}` }}>
          <span className="px-4 py-1.5 rounded-full t-label border-2" style={{ background: accent, color: accentTextOnTint, borderColor: C.ink, fontSize: 12 }}>
            {cajaLabel}
          </span>
        </div>

        <div className="px-5 pt-4 pb-3 flex-shrink-0" style={{ borderBottom: `2px solid ${C.ink}` }}>
          <Input
            autoFocus
            value={busqueda}
            onValueChange={setBusqueda}
            placeholder="Buscar producto… Enter agrega el primero"
            onKeyDown={(e) => { if (e.key === 'Enter' && prodsFiltrados.length > 0) agregar(prodsFiltrados[0]); }}
            classNames={{ inputWrapper: 'rounded-lg border-2 border-ink bg-white h-14 shadow-none mb-3', input: 't-body-l' }}
            startContent={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            }
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['Todo', ...categorias].map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className="px-3 py-1.5 rounded-full t-label flex-shrink-0 border-2 transition-all"
                style={{ height: 36, background: cat === c ? accent : '#FFFFFF', color: cat === c ? accentTextOnTint : C.ink, borderColor: C.ink, fontSize: 11 }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
            {prodsFiltrados.map((prod) => {
              const token = getTokenColor(prod.sku);
              const agotado = prod.stock === 0;
              const enVenta = lineas.find((l) => l.prodId === prod.id)?.cantidad ?? 0;
              return (
                <button
                  key={prod.id}
                  onClick={() => agregar(prod)}
                  disabled={agotado}
                  className="relative flex flex-col rounded-lg overflow-hidden text-left border-2 transition-all"
                  style={{ borderColor: C.ink, height: 190, opacity: agotado ? 0.45 : 1, cursor: agotado ? 'not-allowed' : 'pointer' }}
                >
                  {agotado && (
                    <span className="absolute top-2 left-0 z-10 t-label px-2.5 py-0.5" style={{ background: C.ball3, color: '#fff', fontSize: 10, borderRadius: '0 4px 4px 0' }}>Agotado</span>
                  )}
                  {enVenta > 0 && (
                    <span className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center t-label border-2" style={{ background: accent, borderColor: C.ink, color: accentTextOnTint, fontSize: 13 }}>{enVenta}</span>
                  )}
                  <div className="flex items-center justify-center flex-shrink-0" style={{ height: 84, background: token.bg, borderBottom: `2px solid ${C.ink}` }}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: token.text }}>{getInitials(prod.nombre)}</span>
                  </div>
                  <div className="px-3 py-2 flex-1 flex flex-col gap-1">
                    <p style={{ color: C.ink, fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>
                      {prod.nombre.length > 20 ? prod.nombre.slice(0, 18) + '…' : prod.nombre}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <span style={{ color: C.ink, fontWeight: 700, fontSize: 15 }}>{formatCOP(prod.precio)}</span>
                      <span style={{ color: prod.stock <= prod.stockMin ? C.ball5 : C.inkFaint, fontSize: 12, fontWeight: 700 }}>{prod.stock}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cuenta */}
      <div className="flex flex-col flex-shrink-0" style={{ width: 360, borderLeft: `2px solid ${C.ink}` }}>
        <div className="px-5 py-4 flex-shrink-0" style={{ borderBottom: `2px solid ${C.ink}` }}>
          <p className="t-label" style={{ color: C.ink, fontSize: 13 }}>Cuenta actual</p>
          <p className="t-caption" style={{ color: C.inkFaint }}>{lineas.length} producto{lineas.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {lineas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: C.inkFaint }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4"><path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              <p className="t-body" style={{ fontSize: 15 }}>Agrega productos al catálogo</p>
            </div>
          ) : (
            lineas.map((l) => (
              <div key={l.prodId} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: `1.5px solid #EFEFE9` }}>
                <p className="flex-1 t-body" style={{ color: C.ink, fontSize: 15 }}>{l.nombre}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => cambiarCantidad(l.prodId, -1)} className="flex items-center justify-center rounded-full border-2" style={{ width: 30, height: 30, borderColor: C.ink, color: C.ink, fontSize: 15 }}>−</button>
                  <span style={{ width: 26, textAlign: 'center', color: C.ink, fontSize: 15, fontWeight: 700 }}>{l.cantidad}</span>
                  <button onClick={() => cambiarCantidad(l.prodId, 1)} className="flex items-center justify-center rounded-full border-2" style={{ width: 30, height: 30, borderColor: C.ink, color: C.ink, fontSize: 15 }}>+</button>
                </div>
                <p style={{ color: C.ink, fontWeight: 700, fontSize: 15, width: 78, textAlign: 'right' }}>{formatCOP(l.cantidad * l.precioUnit)}</p>
              </div>
            ))
          )}
        </div>

        <div className="flex-shrink-0 px-5 py-5" style={{ borderTop: `2px solid ${C.ink}` }}>
          <div className="flex items-center justify-between mb-4">
            <p className="t-label" style={{ color: C.ink, fontSize: 13 }}>Total</p>
            <p className="t-score" style={{ color: C.ink, fontSize: 36 }}>{formatCOP(total)}</p>
          </div>
          <button
            onClick={() => { if (lineas.length > 0) setPagando(true); }}
            disabled={lineas.length === 0}
            className="w-full rounded-full t-label border-2 transition-all"
            style={{ height: 64, background: lineas.length === 0 ? '#F2F1EB' : accent, color: lineas.length === 0 ? C.inkFaint : accentTextOnTint, borderColor: C.ink, fontSize: 15, cursor: lineas.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            Cobrar
          </button>
          {lineas.length > 0 && (
            <button onClick={() => setLineas([])} className="w-full mt-2 t-caption" style={{ height: 36, color: C.inkFaint }}>
              Limpiar cuenta
            </button>
          )}
        </div>
      </div>

      {pagando && <PagoModal titulo={cajaLabel.replace('Caja: ', '')} total={total} accent={C.ink} onClose={() => setPagando(false)} onConfirm={confirmar} />}
    </div>
  );
}
