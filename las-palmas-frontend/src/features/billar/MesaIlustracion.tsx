import { IMAGEN_ESTADO, TRANSICION_MS, type EstadoVisual } from './modelo/modeloMesa';

const ESTADOS: EstadoVisual[] = ['libre', 'ocupada', 'fuera_servicio'];

/**
 * Ilustración estática de la mesa para la cuadrícula: las tres WebP exportadas
 * del modelo 3D, apiladas; al cambiar de estado se funden en 300 ms (nunca un
 * salto seco). No monta WebGL: las tres imágenes se decodifican una sola vez
 * y las comparten todas las tarjetas.
 */
export default function MesaIlustracion({ estado }: { estado: EstadoVisual }) {
  return (
    <div className="relative w-full h-full" aria-hidden>
      {ESTADOS.map((e) => (
        <img
          key={e}
          src={IMAGEN_ESTADO[e]}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
          style={{ opacity: e === estado ? 1 : 0, transition: `opacity ${TRANSICION_MS}ms ease` }}
        />
      ))}
    </div>
  );
}
