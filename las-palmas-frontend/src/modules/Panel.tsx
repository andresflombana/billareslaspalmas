import { useEffect, useState, type ReactNode } from 'react';
import { C } from '../theme';
import { formatCOP, formatTime } from '../utils';
import { Modulo } from '../types';

function useTick() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setT((v) => v + 1), 1000);
    return () => clearInterval(i);
  }, []);
  return t;
}

const MESAS_ACTIVAS = [
  { id: 1, nombre: 'Mesa 1', operador: 'Jorge R.', apertura: new Date(Date.now() - 84 * 60 * 1000), tarifa: 134 },
  { id: 3, nombre: 'Mesa 3', operador: 'Andrés L.', apertura: new Date(Date.now() - 31 * 60 * 1000), tarifa: 134 },
  { id: 5, nombre: 'Mesa 5', operador: 'Carlos M.', apertura: new Date(Date.now() - 57 * 60 * 1000), tarifa: 134 },
  { id: 7, nombre: 'Mesa 7', operador: 'Jorge R.', apertura: new Date(Date.now() - 12 * 60 * 1000), tarifa: 134 },
];

const MOVIMIENTOS = [
  { hora: '20:42', desc: 'Mesa 2 cerrada · Jorge R.', monto: 18700, pv: 'billar' as const },
  { hora: '20:38', desc: 'Águila ×2 · Venta Directa', monto: 10000, pv: 'venta-directa' as const },
  { hora: '20:22', desc: 'Aguardiente 750 ml · Licorera', monto: 52000, pv: 'licorera' as const },
  { hora: '19:58', desc: 'Poker ×1 · Mesa 1', monto: 5000, pv: 'billar' as const },
  { hora: '19:44', desc: 'Mesa 4 cerrada · Carlos M.', monto: 35600, pv: 'billar' as const },
  { hora: '19:30', desc: 'Ron Caldas 750 ml · Licorera', monto: 58000, pv: 'licorera' as const },
];

const STOCK_ALERTAS = [
  { nombre: 'Águila Botella 330 ml', stock: 8, min: 24 },
  { nombre: 'Ron Medellín 750 ml', stock: 2, min: 6 },
  { nombre: 'Cigarrillos Marlboro', stock: 5, min: 12 },
  { nombre: 'Poker Lata 269 ml', stock: 14, min: 30 },
];

const PV_DOT: Record<string, string> = { billar: C.ball1, 'venta-directa': C.ball2, licorera: C.ball4 };

function KpiCard({ label, valor, sub, accent }: { label: string; valor: string; sub?: ReactNode; accent: string }) {
  return (
    <div className="rounded-lg border-2 overflow-hidden" style={{ borderColor: C.ink, background: '#FFFFFF' }}>
      <div style={{ height: 4, background: accent }} />
      <div className="p-5 flex flex-col gap-2">
        <p className="t-label" style={{ color: C.inkFaint, fontSize: 12 }}>{label}</p>
        <p className="t-score" style={{ color: C.ink, fontSize: 40, lineHeight: 1 }}>{valor}</p>
        {sub}
      </div>
    </div>
  );
}

export default function Panel({ onNavigate }: { onNavigate: (m: Modulo) => void }) {
  const tick = useTick();
  void tick;

  return (
    <div className="max-w-[1440px] mx-auto p-6 space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Ingresos del turno"
          valor={formatCOP(761400)}
          accent={C.ink}
          sub={
            <div className="flex flex-col gap-0.5 mt-1">
              <span className="t-caption" style={{ color: C.ball1 === '#F4C21A' ? '#8A6A0E' : C.ball1 }}>Billar {formatCOP(486000)}</span>
              <span className="t-caption" style={{ color: C.ball2 }}>Venta Directa {formatCOP(118600)}</span>
              <span className="t-caption" style={{ color: C.ball4 }}>Licorera {formatCOP(156800)}</span>
            </div>
          }
        />
        <KpiCard label="Mesas ocupadas" valor="4 / 8" accent={C.ball1} sub={<p className="t-caption" style={{ color: C.inkFaint }}>4 libres disponibles</p>} />
        <KpiCard label="Ventas de hoy" valor="38" accent={C.ball2} sub={<p className="t-caption" style={{ color: C.inkFaint }}>Venta Directa + Licorera</p>} />
        <KpiCard label="Productos bajo mínimo" valor="7" accent={C.ball5} sub={<p className="t-caption" style={{ color: C.ball5, fontWeight: 700 }}>Requiere reposición</p>} />
      </div>

      {/* Mesas en juego + Movimientos */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 rounded-lg border-2 p-5" style={{ borderColor: C.ink }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="t-heading" style={{ color: C.ink }}>Mesas en juego ahora</h2>
            <button
              onClick={() => onNavigate('mesas')}
              className="t-label px-4 py-2 rounded-full border-2"
              style={{ borderColor: C.ink, color: C.ink, fontSize: 11 }}
            >
              Ver todas →
            </button>
          </div>
          <div className="space-y-2">
            {MESAS_ACTIVAS.map((m) => {
              const elapsed = Date.now() - m.apertura.getTime();
              const costo = Math.floor(elapsed / 60000) * m.tarifa;
              return (
                <div key={m.id} className="flex items-center gap-4 px-4 py-3 rounded-lg border-2" style={{ borderColor: C.ink, background: C.tint1 }}>
                  <div className="flex items-center justify-center w-11 h-11 rounded-full border-2 flex-shrink-0" style={{ borderColor: C.ink, background: '#FFFFFF' }}>
                    <span className="t-label" style={{ fontSize: 13 }}>{m.nombre.replace('Mesa ', '')}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="t-body" style={{ color: C.ink, fontWeight: 600, fontSize: 15 }}>{m.nombre} · {m.operador}</p>
                  </div>
                  <p className="t-score" style={{ color: C.ink, fontSize: 24 }}>{formatTime(elapsed)}</p>
                  <p className="t-body" style={{ color: C.inkSoft, fontWeight: 700, width: 90, textAlign: 'right' }}>{formatCOP(costo)}</p>
                  <button onClick={() => onNavigate('mesas')} className="px-3 py-1.5 rounded-full t-label border-2" style={{ borderColor: C.ink, background: C.ink, color: '#fff', fontSize: 11 }}>
                    Ver
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border-2 p-5" style={{ borderColor: C.ink }}>
          <h2 className="t-heading mb-4" style={{ color: C.ink }}>Últimos movimientos</h2>
          <div className="space-y-1">
            {MOVIMIENTOS.map((mov, i) => (
              <div key={i} className="flex items-start gap-3 py-2.5" style={{ borderBottom: i < MOVIMIENTOS.length - 1 ? `1.5px solid #EFEFE9` : 'none' }}>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: PV_DOT[mov.pv] }} />
                <div className="flex-1 min-w-0">
                  <p className="t-body truncate" style={{ color: C.ink, fontSize: 14 }}>{mov.desc}</p>
                  <p className="t-caption" style={{ color: C.inkFaint }}>{mov.hora}</p>
                </div>
                <p className="t-label flex-shrink-0" style={{ color: C.ink, fontSize: 13 }}>+{formatCOP(mov.monto)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alertas de stock */}
      <div className="rounded-lg border-2 p-5" style={{ borderColor: C.ink }}>
        <h2 className="t-heading mb-4" style={{ color: C.ink }}>Alertas de stock</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          {STOCK_ALERTAS.map((p, i) => {
            const pct = Math.min(100, Math.round((p.stock / p.min) * 100));
            const critico = pct <= 33;
            return (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="t-body" style={{ color: critico ? C.ball3 : C.ink, fontWeight: critico ? 700 : 400, fontSize: 14 }}>{p.nombre}</p>
                  <p className="t-caption" style={{ color: C.inkFaint }}>{p.stock} / {p.min} unid.</p>
                </div>
                <div className="stock-bar">
                  <div className="stock-bar-fill" style={{ width: `${pct}%`, background: critico ? C.ball3 : C.ball5 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
