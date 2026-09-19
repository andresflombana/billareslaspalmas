import React from 'react';
import { Tooltip, Avatar } from '@nextui-org/react';
import logoImage from '../assets/logo.png';
import { C } from '../theme';
import { Modulo, Rol } from '../types';

interface NavItem {
  id: Modulo;
  label: string;
  Icon: () => React.ReactElement;
  ballColor?: string; // color de identidad del módulo — si no se define, usa --ink
}

const NAV_ADMIN: NavItem[] = [
  { id: 'panel', label: 'Panel', Icon: IconGrid },
  { id: 'mesas', label: 'Mesas', Icon: IconTable, ballColor: C.ball1 },
  { id: 'venta-directa', label: 'Venta Directa', Icon: IconBag, ballColor: C.ball2 },
  { id: 'licorera', label: 'Licorera', Icon: IconBottle, ballColor: C.ball4 },
  { id: 'inventario', label: 'Inventario', Icon: IconBox },
  { id: 'gastos', label: 'Gastos', Icon: IconReceipt },
  { id: 'reportes', label: 'Reportes', Icon: IconChart },
  { id: 'caja', label: 'Caja', Icon: IconCash },
  { id: 'configuracion', label: 'Configuración', Icon: IconSettings },
];
const NAV_OPERADOR = NAV_ADMIN.filter((n) => ['mesas', 'venta-directa', 'licorera'].includes(n.id));

interface Props {
  rol: Rol;
  nombre: string;
  modulo: Modulo;
  colapsado: boolean;
  onToggle: () => void;
  onNavigate: (m: Modulo) => void;
  onLogout: () => void;
}

export default function Sidebar({ rol, nombre, modulo, colapsado, onToggle, onNavigate, onLogout }: Props) {
  const nav = rol === 'admin' ? NAV_ADMIN : NAV_OPERADOR;
  const width = colapsado ? 72 : 248;

  return (
    <aside
      className="flex flex-col flex-shrink-0 h-full bg-white transition-all duration-200"
      style={{ width, borderRight: `2px solid ${C.ink}` }}
    >
      {/* Toggle */}
      <div className={`flex ${colapsado ? 'justify-center' : 'justify-end'} px-3 pt-3`}>
        <button
          onClick={onToggle}
          aria-label={colapsado ? 'Expandir menú' : 'Ocultar menú'}
          className="flex items-center justify-center w-9 h-9 rounded-full border-2 transition-transform"
          style={{ borderColor: C.ink, color: C.ink }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: colapsado ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      {/* Logo */}
      <div className={`flex items-center ${colapsado ? 'justify-center' : 'px-5 gap-3'}`} style={{ height: 84, borderBottom: `2px solid ${C.ink}` }}>
        <img src={logoImage} alt="Billares Las Palmas" style={{ height: colapsado ? 44 : 56, width: 'auto', objectFit: 'contain' }} />
        {!colapsado && (
          <span className="t-title" style={{ color: C.ink, fontSize: 18 }}>
            Las Palmas
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-3 overflow-y-auto flex flex-col gap-2">
        {nav.map(({ id, label, Icon, ballColor }) => {
          const activo = modulo === id;
          const fill = ballColor ?? C.ink;
          const item = (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`w-full flex items-center gap-3 transition-all rounded-full ${colapsado ? 'justify-center' : 'px-4'}`}
              style={{
                height: 56,
                background: activo ? fill : 'transparent',
                color: activo ? (ballColor === C.ball1 ? C.ink : '#FFFFFF') : C.ink,
              }}
            >
              <span style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon />
              </span>
              {!colapsado && <span className="t-label" style={{ fontSize: 13 }}>{label}</span>}
            </button>
          );
          return colapsado ? (
            <Tooltip key={id} content={label} placement="right" showArrow classNames={{ content: 't-label bg-ink text-white' }}>
              {item}
            </Tooltip>
          ) : (
            item
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`p-3 ${colapsado ? '' : 'px-4 py-4'}`} style={{ borderTop: `2px solid ${C.ink}` }}>
        <div className={`flex items-center gap-3 ${colapsado ? 'flex-col' : ''}`}>
          <Avatar
            name={nombre.split(' ').slice(0, 2).map((w) => w[0]).join('')}
            radius="full"
            classNames={{ base: 'border-2 border-ink w-9 h-9', name: 't-label' }}
            style={{ background: rol === 'admin' ? C.tint1 : C.tint2, color: C.ink }}
          />
          {!colapsado && (
            <div className="flex-1 min-w-0">
              <p className="t-body truncate" style={{ color: C.ink, fontWeight: 600, fontSize: 14 }}>
                {nombre}
              </p>
              <span
                className="t-label px-2 py-0.5 rounded-full inline-block mt-0.5 border-2"
                style={{
                  background: rol === 'admin' ? C.ink : C.ball2,
                  color: '#FFFFFF',
                  borderColor: rol === 'admin' ? C.ink : C.ball2,
                  fontSize: 10,
                }}
              >
                {rol === 'admin' ? 'Administrador' : 'Operador'}
              </span>
            </div>
          )}
          <button onClick={onLogout} title="Cerrar sesión" className="opacity-60 hover:opacity-100 transition-opacity" style={{ color: C.ink }}>
            <IconLogout />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ── ICONS ────────────────────────────────────────────────────────────────
const ico = (children: React.ReactElement) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
function IconGrid() { return ico(<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></>); }
function IconTable() { return ico(<><rect x="2" y="7" width="20" height="10" rx="1"/><circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none"/></>); }
function IconBag() { return ico(<><path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></>); }
function IconBottle() { return ico(<><path d="M9 2v4l-2 2v12a2 2 0 002 2h6a2 2 0 002-2V8l-2-2V2"/><line x1="9" y1="2" x2="15" y2="2"/><line x1="9" y1="12" x2="15" y2="12"/></>); }
function IconBox() { return ico(<><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>); }
function IconReceipt() { return ico(<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></>); }
function IconChart() { return ico(<><rect x="3" y="10" width="4" height="10" rx="0.5"/><rect x="10" y="4" width="4" height="16" rx="0.5"/><rect x="17" y="13" width="4" height="7" rx="0.5"/></>); }
function IconCash() { return ico(<><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M2 10h2M20 10h2M2 14h2M20 14h2"/></>); }
function IconSettings() { return ico(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>); }
function IconLogout() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
