// Tipos de los módulos que todavía trabajan con datos de ejemplo (se migran a
// la API en su sprint). Los tipos de datos reales viven en src/api/tipos.ts.

export interface Producto {
  id: number;
  nombre: string;
  sku: string;
  categoria: string;
  precio: number;
  costo: number;
  stock: number;
  stockMin: number;
  activo: boolean;
  observaciones?: string;
}

export interface Gasto {
  id: number;
  fecha: string;
  categoria: string;
  descripcion: string;
  monto: number;
  usuario: string;
  observaciones?: string;
}

export type Modulo =
  | 'panel'
  | 'mesas'
  | 'venta-directa'
  | 'licorera'
  | 'inventario'
  | 'gastos'
  | 'reportes'
  | 'caja'
  | 'configuracion';

export type Rol = 'admin' | 'operador';
