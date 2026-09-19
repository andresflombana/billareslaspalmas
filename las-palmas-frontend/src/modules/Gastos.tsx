import { useState } from 'react';
import { Input, Button } from '@nextui-org/react';
import { Gasto } from '../types';
import { C } from '../theme';
import { formatCOP } from '../utils';
import ObservacionesField, { NotaIcon } from '../components/ObservacionesField';

const CATEGORIAS = ['Servicios', 'Mantenimiento', 'Insumos', 'Personal', 'Arriendo', 'Impuestos', 'Otros'];

const GASTOS_INIT: Gasto[] = [
  { id: 1, fecha: '2026-09-09', categoria: 'Servicios', descripcion: 'Factura de energía septiembre', monto: 280000, usuario: 'Andrés L.' },
  { id: 2, fecha: '2026-09-09', categoria: 'Insumos', descripcion: 'Tizas y accesorios mesa 4', monto: 45000, usuario: 'Andrés L.' },
  { id: 3, fecha: '2026-09-08', categoria: 'Mantenimiento', descripcion: 'Paño mesa 3 reemplazado', monto: 180000, usuario: 'Jorge R.', observaciones: 'Se contrató al mismo técnico de siempre, garantía 6 meses.' },
  { id: 4, fecha: '2026-09-08', categoria: 'Personal', descripcion: 'Salario semanal operadores', monto: 640000, usuario: 'Andrés L.' },
  { id: 5, fecha: '2026-09-07', categoria: 'Insumos', descripcion: 'Reposición vasos y servilletas', monto: 32000, usuario: 'Jorge R.' },
  { id: 6, fecha: '2026-09-06', categoria: 'Arriendo', descripcion: 'Canon de arrendamiento septiembre', monto: 1800000, usuario: 'Andrés L.' },
];

export default function Gastos() {
  const [gastos, setGastos] = useState<Gasto[]>(GASTOS_INIT);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [catFiltro, setCatFiltro] = useState('Todos');
  const [form, setForm] = useState({ categoria: 'Servicios', descripcion: '', monto: '', observaciones: '' });

  function agregarGasto() {
    if (!form.descripcion || !form.monto) return;
    const nuevo: Gasto = {
      id: Date.now(),
      fecha: new Date().toISOString().split('T')[0],
      categoria: form.categoria,
      descripcion: form.descripcion,
      monto: Number(form.monto.replace(/\D/g, '')),
      usuario: 'Andrés L.',
      observaciones: form.observaciones || undefined,
    };
    setGastos((prev) => [nuevo, ...prev]);
    setForm({ categoria: 'Servicios', descripcion: '', monto: '', observaciones: '' });
    setMostrarForm(false);
  }

  const gastosFilt = catFiltro === 'Todos' ? gastos : gastos.filter((g) => g.categoria === catFiltro);
  const totalFilt = gastosFilt.reduce((s, g) => s + g.monto, 0);
  const ok = form.descripcion.trim().length > 0 && form.monto.trim().length > 0;
  const fieldClass = { inputWrapper: 'rounded-lg border-2 border-ink bg-white h-14 shadow-none', input: 't-body' };

  return (
    <div className="p-6 max-w-[1440px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="t-heading" style={{ color: C.ink }}>Registro de gastos</h2>
          <p className="t-body mt-1" style={{ color: C.inkFaint }}>
            Total filtrado: <span className="t-score" style={{ color: C.ball5, fontSize: 20 }}>{formatCOP(totalFilt)}</span>
          </p>
        </div>
        <Button
          radius="full"
          onPress={() => setMostrarForm((v) => !v)}
          className="t-label border-2"
          style={{ background: mostrarForm ? '#FFFFFF' : C.ink, color: mostrarForm ? C.ink : '#FFFFFF', borderColor: C.ink, height: 52, paddingInline: 24, fontSize: 13 }}
        >
          {mostrarForm ? 'Cancelar' : '+ Registrar gasto'}
        </Button>
      </div>

      {mostrarForm && (
        <div className="card-sticker p-6 space-y-4">
          <h3 className="t-heading" style={{ color: C.ink, fontSize: 17 }}>Nuevo gasto</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="t-caption block mb-1.5" style={{ color: C.inkFaint }}>Categoría</label>
              <select
                value={form.categoria}
                onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                className="w-full px-4 rounded-lg t-body border-2"
                style={{ height: 56, borderColor: C.ink, color: C.ink, outline: 'none', background: '#FFFFFF' }}
              >
                {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="t-caption block mb-1.5" style={{ color: C.inkFaint }}>Monto</label>
              <Input value={form.monto} onValueChange={(v) => setForm((f) => ({ ...f, monto: v }))} placeholder="$ 0" classNames={fieldClass} />
            </div>
            <div className="col-span-2">
              <label className="t-caption block mb-1.5" style={{ color: C.inkFaint }}>Descripción</label>
              <Input value={form.descripcion} onValueChange={(v) => setForm((f) => ({ ...f, descripcion: v }))} placeholder="Describe el gasto brevemente" classNames={fieldClass} />
            </div>
            <div className="col-span-2">
              <ObservacionesField hint="Adjunta número de recibo, proveedor o contexto adicional." rows={3} onChange={(v) => setForm((f) => ({ ...f, observaciones: v }))} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button radius="full" onPress={() => setMostrarForm(false)} className="t-label border-2" style={{ background: '#FFFFFF', borderColor: C.ink, color: C.ink, height: 52, paddingInline: 24, fontSize: 13 }}>Cancelar</Button>
            <Button radius="full" onPress={agregarGasto} isDisabled={!ok} className="t-label border-2" style={{ background: ok ? C.ink : '#EFEFE9', borderColor: C.ink, color: ok ? '#fff' : C.inkFaint, height: 52, paddingInline: 28, fontSize: 13 }}>Guardar gasto</Button>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {['Todos', ...CATEGORIAS].map((c) => (
          <button
            key={c}
            onClick={() => setCatFiltro(c)}
            className="px-4 py-2 rounded-full t-label border-2 transition-all"
            style={{ height: 38, background: catFiltro === c ? C.ink : '#FFFFFF', color: catFiltro === c ? '#FFFFFF' : C.ink, borderColor: C.ink, fontSize: 11 }}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="rounded-lg border-2 overflow-hidden" style={{ borderColor: C.ink }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#FAFAF7', borderBottom: `2px solid ${C.ink}` }}>
              {['Fecha', 'Categoría', 'Descripción', 'Monto', 'Usuario', ''].map((h) => (
                <th key={h} className="px-5 py-3 text-left t-label" style={{ color: C.inkFaint, fontSize: 11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gastosFilt.map((g, i) => (
              <tr key={g.id} style={{ borderBottom: i < gastosFilt.length - 1 ? '1.5px solid #EFEFE9' : 'none' }}>
                <td className="px-5 py-3 t-caption" style={{ color: C.inkFaint, whiteSpace: 'nowrap' }}>{g.fecha}</td>
                <td className="px-5 py-3">
                  <span className="t-label px-2.5 py-0.5 rounded-full border-2" style={{ borderColor: C.ink, color: C.ink, fontSize: 10 }}>{g.categoria}</span>
                </td>
                <td className="px-5 py-3 t-body" style={{ color: C.ink }}>{g.descripcion}</td>
                <td className="px-5 py-3 t-body" style={{ color: C.ball5, fontWeight: 700, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{formatCOP(g.monto)}</td>
                <td className="px-5 py-3 t-caption" style={{ color: C.inkFaint }}>{g.usuario}</td>
                <td className="px-5 py-3"><NotaIcon texto={g.observaciones} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {gastosFilt.length === 0 && <div className="py-14 text-center t-body" style={{ color: C.inkFaint }}>Sin gastos en esta categoría.</div>}
      </div>
    </div>
  );
}
