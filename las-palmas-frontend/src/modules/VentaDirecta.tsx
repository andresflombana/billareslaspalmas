import PuntoVentaPOS from '../components/PuntoVentaPOS';
import { Producto } from '../types';
import { C } from '../theme';

const PRODUCTOS: Producto[] = [
  { id: 1, nombre: 'Águila', sku: 'VD-AGU', categoria: 'Cerveza', precio: 5500, costo: 3200, stock: 48, stockMin: 12, activo: true },
  { id: 2, nombre: 'Poker', sku: 'VD-POK', categoria: 'Cerveza', precio: 5500, costo: 3100, stock: 32, stockMin: 12, activo: true },
  { id: 3, nombre: 'Club Colombia', sku: 'VD-CLB', categoria: 'Cerveza', precio: 6500, costo: 4000, stock: 24, stockMin: 8, activo: true },
  { id: 4, nombre: 'Heineken', sku: 'VD-HNK', categoria: 'Cerveza', precio: 9000, costo: 5500, stock: 9, stockMin: 6, activo: true },
  { id: 5, nombre: 'Costeña', sku: 'VD-CST', categoria: 'Cerveza', precio: 5000, costo: 2800, stock: 0, stockMin: 12, activo: true },
  { id: 6, nombre: 'Coca-Cola 350ml', sku: 'VD-CCL', categoria: 'Gaseosa', precio: 3500, costo: 1800, stock: 24, stockMin: 10, activo: true },
  { id: 7, nombre: 'Sprite 350ml', sku: 'VD-SPR', categoria: 'Gaseosa', precio: 3500, costo: 1800, stock: 18, stockMin: 8, activo: true },
  { id: 8, nombre: 'Agua Cristal', sku: 'VD-AGC', categoria: 'Gaseosa', precio: 2500, costo: 1200, stock: 30, stockMin: 10, activo: true },
  { id: 9, nombre: 'Red Bull', sku: 'VD-RDB', categoria: 'Energizante', precio: 9500, costo: 6500, stock: 5, stockMin: 4, activo: true },
  { id: 10, nombre: 'Marlboro Rojo', sku: 'VD-MBR', categoria: 'Cigarrillos', precio: 1800, costo: 900, stock: 10, stockMin: 5, activo: true },
  { id: 11, nombre: 'Pielroja', sku: 'VD-PLR', categoria: 'Cigarrillos', precio: 1500, costo: 700, stock: 8, stockMin: 5, activo: true },
  { id: 12, nombre: 'Papas Margarita', sku: 'VD-PAP', categoria: 'Snack', precio: 3500, costo: 2200, stock: 15, stockMin: 6, activo: true },
  { id: 13, nombre: 'Maní Tostado', sku: 'VD-MNI', categoria: 'Snack', precio: 2500, costo: 1500, stock: 12, stockMin: 6, activo: true },
  { id: 14, nombre: 'Chicle Trident', sku: 'VD-TRI', categoria: 'Snack', precio: 500, costo: 250, stock: 40, stockMin: 15, activo: true },
];

const CATEGORIAS = ['Cerveza', 'Gaseosa', 'Energizante', 'Cigarrillos', 'Snack'];

export default function VentaDirecta() {
  return (
    <PuntoVentaPOS
      cajaLabel="Caja: Venta Directa"
      accent={C.ball2}
      accentTint={C.tint2}
      accentTextOnTint="#FFFFFF"
      productos={PRODUCTOS}
      categorias={CATEGORIAS}
    />
  );
}
