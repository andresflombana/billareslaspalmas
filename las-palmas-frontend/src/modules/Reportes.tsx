import { useState } from 'react';
import { C, puntoVenta, PuntoVentaId } from '../theme';
import { formatCOP } from '../utils';

type Periodo = 'hoy' | 'ayer' | 'semana' | 'mes';
type Segmento = 'todos' | PuntoVentaId;

const DIAS = [
  { dia: 'Lunes', billar: 320000, venta: 85000, licorera: 140000 },
  { dia: 'Martes', billar: 260000, venta: 70000, licorera: 95000 },
  { dia: 'Miércoles', billar: 310000, venta: 90000, licorera: 120000 },
  { dia: 'Jueves', billar: 280000, venta: 65000, licorera: 88000 },
  { dia: 'Viernes', billar: 450000, venta: 130000, licorera: 220000 },
  { dia: 'Sábado', billar: 680000, venta: 210000, licorera: 350000 },
  { dia: 'Domingo', billar: 590000, venta: 175000, licorera: 280000 },
];

const PRODUCTOS_TOP = [
  { nombre: 'Águila 330ml', ventas: 142, total: 710000, pv: 'billar' as const },
  { nombre: 'Aguardiente Antioqueño 750ml', ventas: 28, total: 1176000, pv: 'licorera' as const },
  { nombre: 'Ron Medellín Añejo 750ml', ventas: 22, total: 1210000, pv: 'licorera' as const },
  { nombre: 'Poker 330ml', ventas: 98, total: 490000, pv: 'billar' as const },
  { nombre: 'Coca-Cola 350ml', ventas: 76, total: 266000, pv: 'venta-directa' as const },
];

function totalDia(d: (typeof DIAS)[number], seg: Segmento) {
  if (seg === 'todos') return d.billar + d.venta + d.licorera;
  if (seg === 'billar') return d.billar;
  if (seg === 'venta-directa') return d.venta;
  return d.licorera;
}

export default function Reportes() {
  const [periodo, setPeriodo] = useState<Periodo>('semana');
  const [segmento, setSegmento] = useState<Segmento>('todos');

  const totalPeriodo = DIAS.reduce((s, d) => s + totalDia(d, segmento), 0);
  const totalBillar = DIAS.reduce((s, d) => s + d.billar, 0);
  const totalVenta = DIAS.reduce((s, d) => s + d.venta, 0);
  const totalLicorera = DIAS.reduce((s, d) => s + d.licorera, 0);
  const maxDia = Math.max(...DIAS.map((d) => totalDia(d, segmento)));

  const segmentos: { id: Segmento; label: string; fill: string; textOnFill: string }[] = [
    { id: 'todos', label: 'Todos', fill: C.ink, textOnFill: '#FFFFFF' },
    { id: 'billar', label: 'Billar', fill: C.ball1, textOnFill: C.ink },
    { id: 'venta-directa', label: 'Venta Directa', fill: C.ball2, textOnFill: '#FFFFFF' },
    { id: 'licorera', label: 'Licorera', fill: C.ball4, textOnFill: '#FFFFFF' },
  ];

  return (
    <div className="p-6 max-w-[1440px] mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="t-heading" style={{ color: C.ink }}>Reportes</h2>
        <div className="flex items-center gap-2">
          {(['hoy', 'ayer', 'semana', 'mes'] as Periodo[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className="px-4 py-2 rounded-full t-label border-2 transition-all"
              style={{ height: 42, background: periodo === p ? C.ink : '#FFFFFF', color: periodo === p ? '#fff' : C.ink, borderColor: C.ink, fontSize: 12 }}
            >
              {{ hoy: 'Hoy', ayer: 'Ayer', semana: 'Semana', mes: 'Mes' }[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        {segmentos.map((s) => {
          const activo = segmento === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSegmento(s.id)}
              className="px-4 py-2 rounded-full t-label border-2 transition-all"
              style={{ height: 40, background: activo ? s.fill : '#FFFFFF', color: activo ? s.textOnFill : C.ink, borderColor: C.ink, fontSize: 12 }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Ingresos totales', value: formatCOP(totalPeriodo), accent: C.ink },
          { label: 'Billar', value: formatCOP(totalBillar), accent: C.ball1 },
          { label: 'Venta Directa', value: formatCOP(totalVenta), accent: C.ball2 },
          { label: 'Licorera', value: formatCOP(totalLicorera), accent: C.ball4 },
        ].map((k) => (
          <div key={k.label} className="rounded-lg border-2 overflow-hidden" style={{ borderColor: C.ink }}>
            <div style={{ height: 4, background: k.accent }} />
            <div className="p-5">
              <p className="t-label mb-2" style={{ color: C.inkFaint, fontSize: 11 }}>{k.label}</p>
              <p className="t-score" style={{ color: C.ink, fontSize: 28 }}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Ingresos por día — tabla con barra proporcional en línea */}
      <div className="rounded-lg border-2 p-6" style={{ borderColor: C.ink }}>
        <h3 className="t-heading mb-5" style={{ color: C.ink, fontSize: 16 }}>Ingresos por día</h3>
        <div className="space-y-3">
          {DIAS.map((d) => {
            const val = totalDia(d, segmento);
            const pct = Math.round((val / maxDia) * 100);
            return (
              <div key={d.dia} className="flex items-center gap-4">
                <span className="t-body flex-shrink-0" style={{ color: C.inkSoft, width: 90, fontSize: 14 }}>{d.dia}</span>
                <div className="flex-1 rounded-full border-2 overflow-hidden" style={{ borderColor: C.ink, height: 22, background: '#FAFAF7' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: C.ink, transition: 'width 300ms ease-out' }} />
                </div>
                <span className="t-body flex-shrink-0" style={{ color: C.ink, fontWeight: 700, width: 100, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatCOP(val)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Productos más vendidos */}
      <div className="rounded-lg border-2 p-6" style={{ borderColor: C.ink }}>
        <h3 className="t-heading mb-5" style={{ color: C.ink, fontSize: 16 }}>Productos más vendidos</h3>
        <div className="space-y-1">
          {PRODUCTOS_TOP.map((p, i) => {
            const info = puntoVenta[p.pv];
            return (
              <div key={p.nombre} className="flex items-center gap-4 py-2.5" style={{ borderBottom: i < PRODUCTOS_TOP.length - 1 ? '1.5px solid #EFEFE9' : 'none' }}>
                <span className="flex items-center justify-center rounded-full border-2 w-8 h-8 t-label flex-shrink-0" style={{ borderColor: C.ink, color: C.ink, fontSize: 13 }}>{i + 1}</span>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: info.fill }} />
                <div className="flex-1 min-w-0">
                  <p className="t-body truncate" style={{ color: C.ink, fontWeight: 600 }}>{p.nombre}</p>
                  <p className="t-caption" style={{ color: C.inkFaint }}>{p.ventas} unidades · {info.label}</p>
                </div>
                <p className="t-body flex-shrink-0" style={{ color: C.ink, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatCOP(p.total)}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <button className="px-6 py-3 rounded-full t-label border-2" style={{ borderColor: C.ink, color: C.ink, fontSize: 13 }}>Exportar PDF</button>
        <button className="px-6 py-3 rounded-full t-label border-2" style={{ borderColor: C.ink, color: C.ink, fontSize: 13 }}>Exportar Excel</button>
      </div>
    </div>
  );
}
