import { useState } from 'react';
import { C, puntoVenta, PuntoVentaId } from '../theme';
import { formatCOP } from '../utils';

type EstadoCaja = 'cerrada' | 'abierta';
interface Movimiento { id: number; hora: string; tipo: 'ingreso' | 'egreso'; descripcion: string; monto: number; }
interface RegistroCaja {
  id: PuntoVentaId;
  estado: EstadoCaja;
  baseApertura: number;
  ingresos: number;
  egresos: number;
  movimientos: Movimiento[];
}

const CAJA_INIT: RegistroCaja[] = [
  {
    id: 'billar', estado: 'abierta', baseApertura: 200000, ingresos: 486000, egresos: 32000,
    movimientos: [
      { id: 1, hora: '08:30', tipo: 'ingreso', descripcion: 'Cobro Mesa 1', monto: 130000 },
      { id: 2, hora: '09:15', tipo: 'ingreso', descripcion: 'Cobro Mesa 3', monto: 85000 },
      { id: 3, hora: '10:00', tipo: 'egreso', descripcion: 'Cambio en efectivo', monto: 32000 },
      { id: 4, hora: '11:45', tipo: 'ingreso', descripcion: 'Cobro Mesa 7 + consumos', monto: 271000 },
    ],
  },
  {
    id: 'venta-directa', estado: 'abierta', baseApertura: 100000, ingresos: 118600, egresos: 0,
    movimientos: [
      { id: 1, hora: '09:00', tipo: 'ingreso', descripcion: 'Venta snacks y gaseosas', monto: 78000 },
      { id: 2, hora: '12:00', tipo: 'ingreso', descripcion: 'Venta cervezas ×7', monto: 40600 },
    ],
  },
  { id: 'licorera', estado: 'cerrada', baseApertura: 150000, ingresos: 0, egresos: 0, movimientos: [] },
];

type Vista = 'resumen' | PuntoVentaId;

export default function Caja() {
  const [cajas, setCajas] = useState<RegistroCaja[]>(CAJA_INIT);
  const [vista, setVista] = useState<Vista>('resumen');

  const totalIngresos = cajas.reduce((s, c) => s + c.ingresos, 0);
  const totalEgresos = cajas.reduce((s, c) => s + c.egresos, 0);
  const totalEfectivo = cajas.reduce((s, c) => (c.estado === 'abierta' ? s + c.baseApertura + c.ingresos - c.egresos : s), 0);

  function abrirCaja(id: PuntoVentaId) { setCajas((prev) => prev.map((c) => (c.id === id ? { ...c, estado: 'abierta' } : c))); }
  function cerrarCaja(id: PuntoVentaId) { setCajas((prev) => prev.map((c) => (c.id === id ? { ...c, estado: 'cerrada' } : c))); }

  const cajaActiva = vista !== 'resumen' ? cajas.find((c) => c.id === vista) : null;

  return (
    <div className="p-6 max-w-[1440px] mx-auto space-y-6">
      <div className="flex gap-2">
        <button
          onClick={() => setVista('resumen')}
          className="px-5 py-2.5 rounded-full t-label border-2"
          style={{ height: 46, background: vista === 'resumen' ? C.ink : '#FFFFFF', color: vista === 'resumen' ? '#fff' : C.ink, borderColor: C.ink, fontSize: 13 }}
        >
          Caja General
        </button>
        {cajas.map((c) => {
          const info = puntoVenta[c.id];
          const activo = vista === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setVista(c.id)}
              className="px-5 py-2.5 rounded-full t-label border-2 flex items-center gap-2"
              style={{ height: 46, background: activo ? info.fill : '#FFFFFF', color: activo ? (c.id === 'billar' ? C.ink : '#fff') : C.ink, borderColor: C.ink, fontSize: 13 }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: c.estado === 'abierta' ? C.ball6 : C.inkFaint }} />
              {info.label}
            </button>
          );
        })}
      </div>

      {vista === 'resumen' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-5">
            <div className="rounded-lg border-2 p-6" style={{ borderColor: C.ink }}>
              <p className="t-label mb-2" style={{ color: C.inkFaint, fontSize: 11 }}>Total ingresos del día</p>
              <p className="t-score" style={{ color: C.ball6, fontSize: 32 }}>{formatCOP(totalIngresos)}</p>
            </div>
            <div className="rounded-lg border-2 p-6" style={{ borderColor: C.ink }}>
              <p className="t-label mb-2" style={{ color: C.inkFaint, fontSize: 11 }}>Total egresos del día</p>
              <p className="t-score" style={{ color: C.ball5, fontSize: 32 }}>{formatCOP(totalEgresos)}</p>
            </div>
            <div className="rounded-lg border-2 p-6" style={{ borderColor: C.ink, background: C.tint1 }}>
              <p className="t-label mb-2" style={{ color: '#8A6A0E', fontSize: 11 }}>Efectivo total en cajas</p>
              <p className="t-score" style={{ color: C.ink, fontSize: 32 }}>{formatCOP(totalEfectivo)}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {cajas.map((c) => {
              const info = puntoVenta[c.id];
              const efectivo = c.baseApertura + c.ingresos - c.egresos;
              return (
                <div key={c.id} className="rounded-lg border-2 overflow-hidden" style={{ borderColor: C.ink }}>
                  <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `2px solid ${C.ink}`, background: c.estado === 'abierta' ? info.tint : '#FAFAF7' }}>
                    <div>
                      <p className="t-label" style={{ color: C.ink, fontSize: 13 }}>{info.label}</p>
                      <p className="t-caption mt-0.5" style={{ color: c.estado === 'abierta' ? C.ball6 : C.inkFaint, fontWeight: 700 }}>
                        {c.estado === 'abierta' ? '● Abierta' : '○ Cerrada'}
                      </p>
                    </div>
                    <button onClick={() => setVista(c.id)} className="t-label px-3 py-1.5 rounded-full border-2" style={{ borderColor: C.ink, color: C.ink, fontSize: 11 }}>
                      Ver detalle →
                    </button>
                  </div>
                  <div className="px-6 py-5 space-y-3">
                    <div className="flex justify-between"><span className="t-caption" style={{ color: C.inkFaint }}>Base apertura</span><span className="t-body" style={{ color: C.inkSoft, fontVariantNumeric: 'tabular-nums' }}>{formatCOP(c.baseApertura)}</span></div>
                    <div className="flex justify-between"><span className="t-caption" style={{ color: C.inkFaint }}>Ingresos</span><span className="t-body" style={{ color: C.ball6, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>+ {formatCOP(c.ingresos)}</span></div>
                    <div className="flex justify-between"><span className="t-caption" style={{ color: C.inkFaint }}>Egresos</span><span className="t-body" style={{ color: C.ball5, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>− {formatCOP(c.egresos)}</span></div>
                    <div className="flex justify-between pt-3" style={{ borderTop: `1.5px solid #EFEFE9` }}>
                      <span className="t-label" style={{ color: C.ink, fontSize: 11 }}>Efectivo en caja</span>
                      <span className="t-score" style={{ color: C.ink, fontSize: 20 }}>{formatCOP(c.estado === 'abierta' ? efectivo : 0)}</span>
                    </div>
                    {c.estado === 'cerrada' ? (
                      <button onClick={() => abrirCaja(c.id)} className="w-full rounded-full t-label border-2 mt-2" style={{ height: 46, borderColor: C.ink, background: info.fill, color: c.id === 'billar' ? C.ink : '#fff', fontSize: 13 }}>Abrir caja</button>
                    ) : (
                      <button onClick={() => cerrarCaja(c.id)} className="w-full rounded-full t-label border-2 mt-2" style={{ height: 46, borderColor: C.ink, background: '#FFFFFF', color: C.ink, fontSize: 13 }}>Cerrar caja</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {cajaActiva && (
        <div className="space-y-5">
          <div className="flex items-center justify-between rounded-lg border-2 px-6 py-5" style={{ borderColor: C.ink, background: puntoVenta[cajaActiva.id].tint }}>
            <div>
              <p className="t-heading" style={{ color: C.ink, fontSize: 18 }}>Caja — {puntoVenta[cajaActiva.id].label}</p>
              <p className="t-caption mt-1" style={{ color: cajaActiva.estado === 'abierta' ? C.ball6 : C.inkFaint, fontWeight: 700 }}>
                {cajaActiva.estado === 'abierta' ? '● Caja abierta' : '○ Caja cerrada'}
              </p>
            </div>
            {cajaActiva.estado === 'cerrada' ? (
              <button onClick={() => abrirCaja(cajaActiva.id)} className="px-6 rounded-full t-label border-2" style={{ height: 50, background: C.ink, borderColor: C.ink, color: '#fff', fontSize: 13 }}>Abrir caja</button>
            ) : (
              <button onClick={() => cerrarCaja(cajaActiva.id)} className="px-6 rounded-full t-label border-2" style={{ height: 50, background: '#FFFFFF', borderColor: C.ink, color: C.ink, fontSize: 13 }}>Cerrar caja</button>
            )}
          </div>

          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Base apertura', value: formatCOP(cajaActiva.baseApertura), color: C.ink },
              { label: 'Ingresos', value: `+ ${formatCOP(cajaActiva.ingresos)}`, color: C.ball6 },
              { label: 'Egresos', value: `− ${formatCOP(cajaActiva.egresos)}`, color: C.ball5 },
              { label: 'Efectivo en caja', value: formatCOP(cajaActiva.estado === 'abierta' ? cajaActiva.baseApertura + cajaActiva.ingresos - cajaActiva.egresos : 0), color: C.ink },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border-2 p-5" style={{ borderColor: C.ink }}>
                <p className="t-label mb-1" style={{ color: C.inkFaint, fontSize: 11 }}>{s.label}</p>
                <p className="t-score" style={{ color: s.color, fontSize: 22 }}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border-2 overflow-hidden" style={{ borderColor: C.ink }}>
            <div className="px-6 py-3" style={{ background: '#FAFAF7', borderBottom: `2px solid ${C.ink}` }}>
              <p className="t-label" style={{ color: C.ink, fontSize: 12 }}>Movimientos del día</p>
            </div>
            {cajaActiva.movimientos.length === 0 ? (
              <div className="py-12 text-center t-body" style={{ color: C.inkFaint }}>Sin movimientos aún.</div>
            ) : (
              cajaActiva.movimientos.map((m, i) => (
                <div key={m.id} className="flex items-center gap-4 px-6 py-3.5" style={{ borderBottom: i < cajaActiva.movimientos.length - 1 ? '1.5px solid #EFEFE9' : 'none' }}>
                  <span className="t-caption" style={{ color: C.inkFaint, width: 48 }}>{m.hora}</span>
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: m.tipo === 'ingreso' ? C.ball6 : C.ball5 }} />
                  <span className="flex-1 t-body" style={{ color: C.ink }}>{m.descripcion}</span>
                  <span className="t-body" style={{ color: m.tipo === 'ingreso' ? C.ball6 : C.ball5, fontWeight: 700, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>
                    {m.tipo === 'ingreso' ? '+' : '−'} {formatCOP(m.monto)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
