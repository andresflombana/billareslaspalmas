import PuntoVentaPOS from '../components/PuntoVentaPOS';
import { Producto } from '../types';
import { C } from '../theme';

const PRODUCTOS: Producto[] = [
  { id: 1, nombre: 'Aguardiente Antioqueño 750ml', sku: 'LIC-AGA', categoria: 'Aguardiente', precio: 52000, costo: 38000, stock: 12, stockMin: 6, activo: true },
  { id: 2, nombre: 'Aguardiente Nectar 750ml', sku: 'LIC-AGN', categoria: 'Aguardiente', precio: 48000, costo: 35000, stock: 8, stockMin: 4, activo: true },
  { id: 3, nombre: 'Ron Medellín Añejo 750ml', sku: 'LIC-RMA', categoria: 'Ron', precio: 58000, costo: 44000, stock: 6, stockMin: 4, activo: true },
  { id: 4, nombre: 'Ron Viejo de Caldas 750ml', sku: 'LIC-RVC', categoria: 'Ron', precio: 45000, costo: 32000, stock: 0, stockMin: 4, activo: true },
  { id: 5, nombre: 'Whisky Old Parr 750ml', sku: 'LIC-WOP', categoria: 'Whisky', precio: 138000, costo: 105000, stock: 3, stockMin: 2, activo: true },
  { id: 6, nombre: 'Whisky Black Label 750ml', sku: 'LIC-WBL', categoria: 'Whisky', precio: 175000, costo: 140000, stock: 2, stockMin: 2, activo: true },
  { id: 7, nombre: 'Águila Botella 330ml', sku: 'LIC-AGU', categoria: 'Cerveza', precio: 3800, costo: 2600, stock: 96, stockMin: 24, activo: true },
  { id: 8, nombre: 'Corona Botella 355ml', sku: 'LIC-COR', categoria: 'Cerveza', precio: 8500, costo: 6200, stock: 4, stockMin: 6, activo: true },
  { id: 9, nombre: 'Vino Santa Helena Tinto 750ml', sku: 'LIC-VSH', categoria: 'Vino', precio: 35000, costo: 26000, stock: 5, stockMin: 3, activo: true },
  { id: 10, nombre: 'Coca-Cola 400ml', sku: 'LIC-CCL', categoria: 'Gaseosa', precio: 2800, costo: 1800, stock: 48, stockMin: 12, activo: true },
  { id: 11, nombre: 'Marlboro Rojo x10', sku: 'LIC-MBR', categoria: 'Cigarrillos', precio: 4800, costo: 3500, stock: 8, stockMin: 10, activo: true },
  { id: 12, nombre: 'Maní con Sal 50g', sku: 'LIC-MAN', categoria: 'Snack', precio: 1800, costo: 1100, stock: 1, stockMin: 6, activo: true },
];

const CATEGORIAS = ['Aguardiente', 'Ron', 'Whisky', 'Cerveza', 'Vino', 'Gaseosa', 'Cigarrillos', 'Snack'];

export default function Licorera() {
  return (
    <PuntoVentaPOS
      cajaLabel="Caja: Licorera"
      accent={C.ball4}
      accentTint={C.tint4}
      accentTextOnTint="#FFFFFF"
      productos={PRODUCTOS}
      categorias={CATEGORIAS}
    />
  );
}
