import { useState } from 'react';
import { Input, Button } from '@nextui-org/react';
import { C } from '../theme';
import { formatCOP } from '../utils';
import ConfiguracionMesas, { ConfiguracionZonas } from '../features/billar/ConfiguracionMesas';

const TABS = ['Negocio', 'Usuarios', 'Mesas', 'Zonas'] as const;
type Tab = (typeof TABS)[number];

interface Usuario { id: number; nombre: string; email: string; rol: 'admin' | 'operador'; activo: boolean; }

const USUARIOS_INIT: Usuario[] = [
  { id: 1, nombre: 'Andrés Lombana', email: 'admin@laspalmas.com', rol: 'admin', activo: true },
  { id: 2, nombre: 'Jorge Restrepo', email: 'operador@laspalmas.com', rol: 'operador', activo: true },
];

const fieldClass = { inputWrapper: 'rounded-lg border-2 border-ink bg-white h-14 shadow-none', input: 't-body' };

export default function Configuracion() {
  const [tab, setTab] = useState<Tab>('Negocio');
  const [usuarios, setUsuarios] = useState<Usuario[]>(USUARIOS_INIT);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [formUser, setFormUser] = useState({ nombre: '', email: '', password: '', rol: 'operador' as 'admin' | 'operador' });

  function agregarUsuario() {
    if (!formUser.nombre || !formUser.email || !formUser.password) return;
    setUsuarios((prev) => [...prev, { id: Date.now(), nombre: formUser.nombre, email: formUser.email, rol: formUser.rol, activo: true }]);
    setFormUser({ nombre: '', email: '', password: '', rol: 'operador' });
    setMostrarForm(false);
  }
  function toggleActivo(id: number) {
    setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, activo: !u.activo } : u)));
  }

  return (
    <div className="p-6 max-w-[1440px] mx-auto">
      <div className="flex gap-2 mb-7">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-6 py-2.5 rounded-full t-label border-2 transition-all"
            style={{ height: 48, background: tab === t ? C.ink : '#FFFFFF', color: tab === t ? '#fff' : C.ink, borderColor: C.ink, fontSize: 13 }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* NEGOCIO */}
      {tab === 'Negocio' && (
        <div className="max-w-[640px] space-y-5">
          <h2 className="t-heading" style={{ color: C.ink }}>Información del negocio</h2>
          <div className="card-sticker p-6 space-y-4">
            {[
              { label: 'Nombre del establecimiento', value: 'Billares Las Palmas' },
              { label: 'NIT', value: '900.123.456-7' },
              { label: 'Dirección', value: 'Calle 18 #25-40, Pasto, Nariño' },
              { label: 'Teléfono', value: '+57 310 456 7890' },
            ].map((f) => (
              <div key={f.label}>
                <label className="t-caption block mb-1.5" style={{ color: C.inkFaint }}>{f.label}</label>
                <Input defaultValue={f.value} classNames={fieldClass} />
              </div>
            ))}
          </div>
          <div className="card-sticker p-6 space-y-3">
            <h3 className="t-heading" style={{ color: C.ink, fontSize: 16 }}>Tarifa de mesas — Billar</h3>
            <div>
              <label className="t-caption block mb-1.5" style={{ color: C.inkFaint }}>Tarifa por minuto (COP)</label>
              <Input defaultValue="134" type="number" classNames={fieldClass} style={{ fontVariantNumeric: 'tabular-nums' }} />
              <p className="t-caption mt-1.5" style={{ color: C.inkFaint }}>Equivale a {formatCOP(134 * 60)}/hora</p>
            </div>
          </div>
          <Button radius="full" className="t-label border-2" style={{ height: 56, background: C.ball1, borderColor: C.ink, color: C.ink, fontSize: 14, paddingInline: 28 }}>
            Guardar cambios
          </Button>
        </div>
      )}

      {/* USUARIOS */}
      {tab === 'Usuarios' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="t-heading" style={{ color: C.ink }}>Usuarios del sistema</h2>
            <Button
              radius="full"
              onPress={() => setMostrarForm((v) => !v)}
              className="t-label border-2"
              style={{ height: 50, background: mostrarForm ? '#FFFFFF' : C.ink, borderColor: C.ink, color: mostrarForm ? C.ink : '#fff', fontSize: 13, paddingInline: 24 }}
            >
              {mostrarForm ? 'Cancelar' : '+ Agregar usuario'}
            </Button>
          </div>

          {mostrarForm && (
            <div className="card-sticker p-6 space-y-4">
              <h3 className="t-heading" style={{ color: C.ink, fontSize: 16 }}>Nuevo usuario</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="t-caption block mb-1.5" style={{ color: C.inkFaint }}>Nombre completo</label>
                  <Input value={formUser.nombre} onValueChange={(v) => setFormUser((f) => ({ ...f, nombre: v }))} placeholder="Nombre del operador" classNames={fieldClass} />
                </div>
                <div>
                  <label className="t-caption block mb-1.5" style={{ color: C.inkFaint }}>Correo electrónico</label>
                  <Input value={formUser.email} onValueChange={(v) => setFormUser((f) => ({ ...f, email: v }))} placeholder="usuario@laspalmas.com" classNames={fieldClass} />
                </div>
                <div>
                  <label className="t-caption block mb-1.5" style={{ color: C.inkFaint }}>Contraseña inicial</label>
                  <Input value={formUser.password} onValueChange={(v) => setFormUser((f) => ({ ...f, password: v }))} type="password" placeholder="Mínimo 8 caracteres" classNames={fieldClass} />
                </div>
                <div className="col-span-2">
                  <label className="t-caption block mb-2" style={{ color: C.inkFaint }}>Rol</label>
                  <div className="flex gap-3">
                    {(['admin', 'operador'] as const).map((r) => {
                      const activo = formUser.rol === r;
                      return (
                        <button
                          key={r}
                          onClick={() => setFormUser((f) => ({ ...f, rol: r }))}
                          className="flex-1 rounded-lg t-label border-2 transition-all"
                          style={{ height: 52, background: activo ? (r === 'admin' ? C.ink : C.ball2) : '#FFFFFF', color: activo ? '#fff' : C.ink, borderColor: C.ink, fontSize: 13 }}
                        >
                          {r === 'admin' ? 'Administrador' : 'Operador'}
                        </button>
                      );
                    })}
                  </div>
                  <p className="t-caption mt-2" style={{ color: C.inkFaint }}>
                    Operador solo verá Mesas, Venta Directa y Licorera. Administrador ve los nueve módulos.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button radius="full" onPress={() => setMostrarForm(false)} className="t-label border-2" style={{ background: '#FFFFFF', borderColor: C.ink, color: C.ink, height: 50, paddingInline: 22, fontSize: 13 }}>Cancelar</Button>
                <Button
                  radius="full"
                  onPress={agregarUsuario}
                  isDisabled={!formUser.nombre || !formUser.email || !formUser.password}
                  className="t-label border-2"
                  style={{ background: (!formUser.nombre || !formUser.email || !formUser.password) ? '#EFEFE9' : C.ink, borderColor: C.ink, color: (!formUser.nombre || !formUser.email || !formUser.password) ? C.inkFaint : '#fff', height: 50, paddingInline: 26, fontSize: 13 }}
                >
                  Crear usuario
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-lg border-2 overflow-hidden" style={{ borderColor: C.ink }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#FAFAF7', borderBottom: `2px solid ${C.ink}` }}>
                  {['Nombre', 'Correo', 'Rol', 'Estado', 'Acciones'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left t-label" style={{ color: C.inkFaint, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: i < usuarios.length - 1 ? '1.5px solid #EFEFE9' : 'none' }}>
                    <td className="px-6 py-3.5 t-body" style={{ color: C.ink, fontWeight: 600 }}>{u.nombre}</td>
                    <td className="px-6 py-3.5 t-body" style={{ color: C.inkFaint }}>{u.email}</td>
                    <td className="px-6 py-3.5">
                      <span className="t-label px-2.5 py-0.5 rounded-full border-2" style={{ background: u.rol === 'admin' ? C.ink : C.ball2, color: '#fff', borderColor: u.rol === 'admin' ? C.ink : C.ball2, fontSize: 10 }}>
                        {u.rol === 'admin' ? 'Administrador' : 'Operador'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="t-label px-2.5 py-0.5 rounded-full border-2" style={{ background: u.activo ? C.tint6 : '#F2F1EB', color: u.activo ? C.ball6 : C.inkFaint, borderColor: u.activo ? C.ball6 : C.inkFaint, fontSize: 10 }}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <button onClick={() => toggleActivo(u.id)} className="t-label px-3.5 py-1.5 rounded-full border-2" style={{ borderColor: C.ink, color: C.ink, fontSize: 11 }}>
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MESAS — CRUD real contra la API (Sprint 1) */}
      {tab === 'Mesas' && <ConfiguracionMesas />}

      {/* ZONAS — derivadas de las mesas reales (Sprint 1) */}
      {tab === 'Zonas' && <ConfiguracionZonas />}
    </div>
  );
}
