import { useState } from 'react';
import { Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Switch } from '@nextui-org/react';
import { Producto } from '../types';
import { C, puntoVenta, PuntoVentaId } from '../theme';
import { formatCOP, getTokenColor, getInitials } from '../utils';
import ObservacionesField, { NotaIcon } from '../components/ObservacionesField';

const DATA: Record<PuntoVentaId, Producto[]> = {
  billar: [
    { id: 1, nombre: 'Águila Botella 330ml', sku: 'BIL-CRV-001', categoria: 'Cerveza', precio: 5000, costo: 3200, stock: 48, stockMin: 12, activo: true },
    { id: 2, nombre: 'Club Colombia 330ml', sku: 'BIL-CRV-002', categoria: 'Cerveza', precio: 6000, costo: 4000, stock: 6, stockMin: 12, activo: true, observaciones: 'Proveedor avisó retraso de 2 días.' },
    { id: 3, nombre: 'Poker Botella 330ml', sku: 'BIL-CRV-003', categoria: 'Cerveza', precio: 5000, costo: 3100, stock: 60, stockMin: 12, activo: true },
    { id: 4, nombre: 'Aguardiente Nectar 375ml', sku: 'BIL-LIC-001', categoria: 'Licor', precio: 18000, costo: 12000, stock: 4, stockMin: 6, activo: true },
    { id: 5, nombre: 'Coca-Cola Lata 355ml', sku: 'BIL-GAS-001', categoria: 'Gaseosa', precio: 3500, costo: 2000, stock: 0, stockMin: 10, activo: true },
    { id: 6, nombre: 'Marlboro Rojo x10', sku: 'BIL-CIG-001', categoria: 'Cigarrillos', precio: 5000, costo: 3500, stock: 15, stockMin: 10, activo: true },
    { id: 7, nombre: 'Papas Margarita 35g', sku: 'BIL-SNK-001', categoria: 'Snack', precio: 2500, costo: 1400, stock: 5, stockMin: 8, activo: true },
    { id: 8, nombre: 'Red Bull Lata 250ml', sku: 'BIL-ENE-001', categoria: 'Energizante', precio: 7000, costo: 4500, stock: 18, stockMin: 6, activo: true },
  ],
  'venta-directa': [
    { id: 11, nombre: 'Águila Lata 330ml', sku: 'VD-CRV-001', categoria: 'Cerveza', precio: 5500, costo: 2600, stock: 72, stockMin: 20, activo: true },
    { id: 12, nombre: 'Costeña Botella 330ml', sku: 'VD-CRV-002', categoria: 'Cerveza', precio: 5000, costo: 2400, stock: 3, stockMin: 12, activo: true },
    { id: 13, nombre: 'Pepsi Lata 355ml', sku: 'VD-GAS-001', categoria: 'Gaseosa', precio: 3500, costo: 1800, stock: 36, stockMin: 12, activo: true },
    { id: 14, nombre: 'Vive 100 Lata 240ml', sku: 'VD-ENE-001', categoria: 'Energizante', precio: 3500, costo: 2500, stock: 7, stockMin: 8, activo: true, observaciones: 'Descontinuar si no rota en 2 semanas.' },
    { id: 15, nombre: 'Pielroja x10', sku: 'VD-CIG-001', categoria: 'Cigarrillos', precio: 3500, costo: 2800, stock: 20, stockMin: 10, activo: true },
    { id: 16, nombre: 'Maní con Sal 30g', sku: 'VD-SNK-001', categoria: 'Snack', precio: 1200, costo: 750, stock: 2, stockMin: 6, activo: true },
  ],
  licorera: [
    { id: 21, nombre: 'Aguardiente Antioqueño 750ml', sku: 'LIC-AGU-001', categoria: 'Aguardiente', precio: 52000, costo: 38000, stock: 12, stockMin: 6, activo: true },
    { id: 22, nombre: 'Ron Medellín Añejo 750ml', sku: 'LIC-RON-001', categoria: 'Ron', precio: 58000, costo: 44000, stock: 6, stockMin: 4, activo: true },
    { id: 23, nombre: 'Whisky Old Parr 750ml', sku: 'LIC-WHI-001', categoria: 'Whisky', precio: 138000, costo: 105000, stock: 3, stockMin: 2, activo: true },
    { id: 24, nombre: 'Corona Botella 355ml', sku: 'LIC-CRV-002', categoria: 'Cerveza', precio: 8500, costo: 6200, stock: 4, stockMin: 6, activo: true },
    { id: 25, nombre: 'Vino Santa Helena Tinto 750ml', sku: 'LIC-VIN-001', categoria: 'Vino', precio: 35000, costo: 26000, stock: 5, stockMin: 3, activo: true },
    { id: 26, nombre: 'Maní con Sal 50g', sku: 'LIC-SNK-001', categoria: 'Snack', precio: 1800, costo: 1100, stock: 1, stockMin: 6, activo: true, observaciones: 'Casi agotado, revisar con proveedor esta semana.' },
  ],
};

const TABS: PuntoVentaId[] = ['billar', 'venta-directa', 'licorera'];

function StockCell({ stock, stockMin }: { stock: number; stockMin: number }) {
  const out = stock === 0;
  const low = !out && stock <= stockMin;
  const color = out ? C.ball3 : low ? C.ball5 : C.ink;
  return (
    <span className="t-body inline-flex items-center gap-1.5" style={{ color, fontWeight: out || low ? 700 : 400, fontVariantNumeric: 'tabular-nums' }}>
      {(out || low) && <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block' }} />}
      {stock}
    </span>
  );
}

export default function Inventario() {
  const [tab, setTab] = useState<PuntoVentaId>('billar');
  const [datos, setDatos] = useState(DATA);
  const [busqueda, setBusqueda] = useState('');
  const [soloBajoMin, setSoloBajoMin] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [creando, setCreando] = useState(false);

  const pv = puntoVenta[tab];
  const productos = datos[tab];

  const filtrados = productos.filter((p) => {
    const matchBus = !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.sku.toLowerCase().includes(busqueda.toLowerCase());
    const matchStock = !soloBajoMin || p.stock <= p.stockMin;
    return matchBus && matchStock;
  });

  const conImagen = 0; // catálogo de fotos aún pendiente de fotografiar — ver README de despliegue
  const sinImagen = productos.length;

  function guardarProducto(p: Producto, esNuevo: boolean) {
    setDatos((prev) => ({
      ...prev,
      [tab]: esNuevo ? [...prev[tab], p] : prev[tab].map((x) => (x.id === p.id ? p : x)),
    }));
    setEditando(null);
    setCreando(false);
  }

  return (
    <div className="max-w-[1440px] mx-auto p-6 space-y-5">
      {/* Tabs por punto de venta */}
      <div className="flex gap-2">
        {TABS.map((t) => {
          const info = puntoVenta[t];
          const activo = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-6 py-2.5 rounded-full t-label border-2 transition-all"
              style={{ background: activo ? info.fill : '#FFFFFF', color: activo ? (t === 'billar' ? C.ink : '#FFFFFF') : C.ink, borderColor: C.ink, fontSize: 13 }}
            >
              {info.label}
            </button>
          );
        })}
      </div>

      {/* Cobertura de imágenes */}
      <div className="flex items-center gap-6 rounded-lg border-2 px-5 py-3" style={{ borderColor: C.ink, background: '#FAFAF7' }}>
        <p className="t-label" style={{ color: C.inkFaint, fontSize: 11 }}>Cobertura de imágenes</p>
        <span className="t-caption" style={{ color: C.ink }}>Con imagen: <strong>{conImagen}</strong></span>
        <span className="t-caption" style={{ color: C.inkFaint }}>Sin imagen: <strong>{sinImagen}</strong></span>
        <span className="t-caption" style={{ color: C.inkFaint }}>Todos muestran token de color mientras tanto.</span>
      </div>

      {/* Controles */}
      <div className="flex items-center gap-3">
        <Input
          value={busqueda}
          onValueChange={setBusqueda}
          placeholder="Buscar por nombre o SKU"
          className="max-w-xs"
          classNames={{ inputWrapper: 'rounded-lg border-2 border-ink bg-white h-12 shadow-none', input: 't-body' }}
        />
        <label className="flex items-center gap-2 t-caption" style={{ color: C.inkSoft }}>
          <Switch isSelected={soloBajoMin} onValueChange={setSoloBajoMin} size="sm" classNames={{ wrapper: 'border-2 border-ink' }} />
          Solo bajo mínimo
        </label>
        <div className="flex-1" />
        <Button
          radius="full"
          onPress={() => setCreando(true)}
          className="t-label border-2"
          style={{ background: pv.fill, borderColor: C.ink, color: tab === 'billar' ? C.ink : '#FFFFFF', fontSize: 13, height: 48, paddingInline: 24 }}
        >
          + Nuevo producto
        </Button>
      </div>

      {/* Tabla */}
      <div className="rounded-lg border-2 overflow-hidden" style={{ borderColor: C.ink }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#FAFAF7', borderBottom: `2px solid ${C.ink}` }}>
              {['Producto', 'Categoría', 'Stock', 'Mín.', 'Precio', 'Costo', 'Estado', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left t-label" style={{ color: C.inkFaint, fontSize: 11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p, i) => {
              const token = getTokenColor(p.sku);
              return (
                <tr key={p.id} style={{ borderBottom: i < filtrados.length - 1 ? '1.5px solid #EFEFE9' : 'none' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center rounded-lg border-2 flex-shrink-0" style={{ width: 36, height: 36, background: token.bg, color: token.text, borderColor: C.ink, fontWeight: 700, fontSize: 11 }}>
                        {getInitials(p.nombre)}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="t-body" style={{ color: C.ink, fontWeight: 600, fontSize: 14 }}>{p.nombre}</span>
                          <NotaIcon texto={p.observaciones} />
                        </div>
                        <div className="t-caption" style={{ color: C.inkFaint, fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>{p.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="t-label px-2.5 py-0.5 rounded-full border-2" style={{ background: '#FFFFFF', borderColor: C.ink, color: C.ink, fontSize: 10 }}>{p.categoria}</span>
                  </td>
                  <td className="px-4 py-3"><StockCell stock={p.stock} stockMin={p.stockMin} /></td>
                  <td className="px-4 py-3 t-caption" style={{ color: C.inkFaint }}>{p.stockMin}</td>
                  <td className="px-4 py-3 t-body" style={{ color: C.ink, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatCOP(p.precio)}</td>
                  <td className="px-4 py-3 t-body" style={{ color: C.inkSoft, fontVariantNumeric: 'tabular-nums' }}>{formatCOP(p.costo)}</td>
                  <td className="px-4 py-3">
                    <span className="t-label px-2.5 py-0.5 rounded-full border-2" style={{ background: p.activo ? C.tint6 : '#F2F1EB', color: p.activo ? C.ball6 : C.inkFaint, borderColor: p.activo ? C.ball6 : C.inkFaint, fontSize: 10 }}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setEditando(p)} className="t-label px-3 py-1.5 rounded-full border-2" style={{ borderColor: C.ink, color: C.ink, fontSize: 11 }}>
                      Editar
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtrados.length === 0 && (
              <tr><td colSpan={8} className="text-center py-12 t-body" style={{ color: C.inkFaint }}>Sin productos que coincidan.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {(editando || creando) && (
        <ProductoModal
          puntoVenta={tab}
          producto={editando}
          onClose={() => { setEditando(null); setCreando(false); }}
          onGuardar={(p) => guardarProducto(p, creando)}
        />
      )}
    </div>
  );
}

function ProductoModal({ puntoVenta: pv, producto, onClose, onGuardar }: {
  puntoVenta: PuntoVentaId; producto: Producto | null;
  onClose: () => void; onGuardar: (p: Producto) => void;
}) {
  const [nombre, setNombre] = useState(producto?.nombre ?? '');
  const [sku, setSku] = useState(producto?.sku ?? '');
  const [categoria, setCategoria] = useState(producto?.categoria ?? '');
  const [precio, setPrecio] = useState(String(producto?.precio ?? ''));
  const [costo, setCosto] = useState(String(producto?.costo ?? ''));
  const [stock, setStock] = useState(String(producto?.stock ?? ''));
  const [stockMin, setStockMin] = useState(String(producto?.stockMin ?? ''));
  const [activo, setActivo] = useState(producto?.activo ?? true);
  const [observaciones, setObservaciones] = useState(producto?.observaciones ?? '');

  const info = puntoVenta[pv];
  const token = sku ? getTokenColor(sku) : { bg: '#EFEFE9', text: C.inkFaint };
  const ok = nombre.trim() && sku.trim() && categoria.trim() && precio && stock !== '' && stockMin !== '';

  function guardar() {
    if (!ok) return;
    onGuardar({
      id: producto?.id ?? Date.now(),
      nombre: nombre.trim(),
      sku: sku.trim(),
      categoria: categoria.trim(),
      precio: Number(precio.replace(/\D/g, '')),
      costo: Number(costo.replace(/\D/g, '')) || 0,
      stock: Number(stock),
      stockMin: Number(stockMin),
      activo,
      observaciones: observaciones || undefined,
    });
  }

  const fieldClass = { inputWrapper: 'rounded-lg border-2 border-ink bg-white h-14 shadow-none', input: 't-body' };

  return (
    <Modal isOpen onClose={onClose} size="2xl" classNames={{ backdrop: 'bg-ink/45', base: 'rounded-lg border-2 border-ink shadow-sticker bg-white' }}>
      <ModalContent>
        <ModalHeader className="border-b-2 border-ink flex items-center justify-between">
          <span className="t-heading" style={{ color: C.ink, fontSize: 18 }}>{producto ? 'Editar producto' : 'Nuevo producto'} · {info.label}</span>
        </ModalHeader>
        <ModalBody className="py-6 grid grid-cols-3 gap-4">
          <div className="col-span-1 flex flex-col items-center gap-2">
            <div className="w-full aspect-square rounded-lg border-2 flex items-center justify-center" style={{ borderColor: C.ink, background: token.bg }}>
              <span className="t-score" style={{ color: token.text, fontSize: 32 }}>{sku ? getInitials(nombre || sku) : '—'}</span>
            </div>
            <p className="t-caption text-center" style={{ color: C.inkFaint }}>Token generado del SKU. Sin fotografía, este producto siempre se verá así.</p>
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="t-caption block mb-1" style={{ color: C.inkFaint }}>Nombre</label>
              <Input value={nombre} onValueChange={setNombre} classNames={fieldClass} />
            </div>
            <div>
              <label className="t-caption block mb-1" style={{ color: C.inkFaint }}>SKU</label>
              <Input value={sku} onValueChange={setSku} classNames={fieldClass} />
            </div>
            <div>
              <label className="t-caption block mb-1" style={{ color: C.inkFaint }}>Categoría</label>
              <Input value={categoria} onValueChange={setCategoria} classNames={fieldClass} />
            </div>
            <div>
              <label className="t-caption block mb-1" style={{ color: C.inkFaint }}>Precio de venta</label>
              <Input value={precio} onValueChange={setPrecio} placeholder="$ 0" classNames={fieldClass} />
            </div>
            <div>
              <label className="t-caption block mb-1" style={{ color: C.inkFaint }}>Costo</label>
              <Input value={costo} onValueChange={setCosto} placeholder="$ 0" classNames={fieldClass} />
            </div>
            <div>
              <label className="t-caption block mb-1" style={{ color: C.inkFaint }}>Stock actual</label>
              <Input value={stock} onValueChange={setStock} type="number" classNames={fieldClass} />
            </div>
            <div>
              <label className="t-caption block mb-1" style={{ color: C.inkFaint }}>Stock mínimo</label>
              <Input value={stockMin} onValueChange={setStockMin} type="number" classNames={fieldClass} />
            </div>
            <div className="col-span-2 flex items-center gap-2 mt-1">
              <Switch isSelected={activo} onValueChange={setActivo} size="sm" />
              <span className="t-body" style={{ color: C.ink, fontSize: 14 }}>Producto activo</span>
            </div>
          </div>
          <div className="col-span-3">
            <ObservacionesField label="Observaciones" hint="Novedades del producto, proveedor, acuerdos." rows={3} defaultValue={observaciones} onChange={setObservaciones} />
          </div>
        </ModalBody>
        <ModalFooter className="border-t-2 border-ink">
          <Button radius="full" onPress={onClose} className="t-label border-2" style={{ background: '#FFFFFF', borderColor: C.ink, color: C.ink, fontSize: 13, height: 48, paddingInline: 24 }}>
            Cancelar
          </Button>
          <Button radius="full" onPress={guardar} isDisabled={!ok} className="t-label border-2" style={{ background: ok ? C.ink : '#EFEFE9', borderColor: C.ink, color: ok ? '#FFFFFF' : C.inkFaint, fontSize: 13, height: 48, paddingInline: 28 }}>
            Guardar producto
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
