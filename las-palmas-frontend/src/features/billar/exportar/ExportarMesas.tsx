import { useEffect, useRef, useState } from 'react';
import MesaEscena3D from '../MesaEscena3D';
import type { EstadoVisual } from '../modelo/modeloMesa';

// Genera las tres ilustraciones de la cuadrícula (PROMPT INTERFAZ BILLAR §5):
// WebP con transparencia, 520 px de ancho (2x para tarjetas de ~260 px).
// Se renderiza cada variante del MISMO modelo 3D a 1040 px, se recorta el
// borde transparente con una caja común (las tres quedan del mismo tamaño y
// alineadas para el fundido) y se reduce a 520 px.

const ESTADOS: EstadoVisual[] = ['libre', 'ocupada', 'fuera_servicio'];
const ANCHO_RENDER = 1040;
const ALTO_RENDER = 800;
const ANCHO_FINAL = 520;
const MARGEN = 10; // px de aire alrededor de la mesa (en la resolución de render)
const CALIDAD_WEBP = 0.9;

declare global {
  interface Window {
    __mesasListas?: boolean;
    __exportarMesas?: () => Promise<Record<EstadoVisual, string>>;
  }
}

function esperarCuadros(n: number): Promise<void> {
  return new Promise((resolve) => {
    let i = 0;
    const paso = () => {
      i += 1;
      if (i >= n) resolve();
      else requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  });
}

function capturar(canvas: HTMLCanvasElement): ImageData {
  const copia = document.createElement('canvas');
  copia.width = canvas.width;
  copia.height = canvas.height;
  const ctx = copia.getContext('2d');
  if (!ctx) throw new Error('No hay contexto 2D');
  ctx.drawImage(canvas, 0, 0);
  return ctx.getImageData(0, 0, copia.width, copia.height);
}

interface Caja {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

function cajaVisible(img: ImageData): Caja | null {
  const { data, width, height } = img;
  let x0 = width;
  let y0 = height;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] > 6) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return x1 < 0 ? null : { x0, y0, x1, y1 };
}

function aWebP(img: ImageData, caja: Caja): string {
  const origen = document.createElement('canvas');
  origen.width = img.width;
  origen.height = img.height;
  origen.getContext('2d')!.putImageData(img, 0, 0);
  const x = Math.max(caja.x0 - MARGEN, 0);
  const y = Math.max(caja.y0 - MARGEN, 0);
  const ancho = Math.min(caja.x1 + MARGEN, img.width - 1) - x + 1;
  const alto = Math.min(caja.y1 + MARGEN, img.height - 1) - y + 1;
  const salida = document.createElement('canvas');
  salida.width = ANCHO_FINAL;
  salida.height = Math.round((alto * ANCHO_FINAL) / ancho);
  const ctx = salida.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(origen, x, y, ancho, alto, 0, 0, salida.width, salida.height);
  return salida.toDataURL('image/webp', CALIDAD_WEBP);
}

export default function ExportarMesas() {
  const [estado, setEstado] = useState<EstadoVisual>('libre');
  const [resultado, setResultado] = useState<Record<EstadoVisual, string> | null>(null);
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.__exportarMesas = async () => {
      const capturas = {} as Record<EstadoVisual, ImageData>;
      for (const e of ESTADOS) {
        setEstado(e);
        await esperarCuadros(15);
        const canvas = contenedor.current?.querySelector('canvas');
        if (!canvas) throw new Error('No se encontró el lienzo WebGL');
        capturas[e] = capturar(canvas);
      }
      const cajas = ESTADOS.map((e) => cajaVisible(capturas[e]));
      if (cajas.some((c) => c === null)) throw new Error('Alguna captura salió vacía (¿WebGL disponible?)');
      const union = cajas.reduce<Caja>(
        (u, c) => ({ x0: Math.min(u.x0, c!.x0), y0: Math.min(u.y0, c!.y0), x1: Math.max(u.x1, c!.x1), y1: Math.max(u.y1, c!.y1) }),
        { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity },
      );
      const salida = {} as Record<EstadoVisual, string>;
      for (const e of ESTADOS) salida[e] = aWebP(capturas[e], union);
      setResultado(salida);
      return salida;
    };
    let vigente = true;
    esperarCuadros(30).then(() => {
      if (vigente) window.__mesasListas = Boolean(contenedor.current?.querySelector('canvas'));
    });
    return () => {
      vigente = false;
    };
  }, []);

  return (
    <div style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <p style={{ marginBottom: 8 }}>
        Exportación de ilustraciones de mesa — variante actual: <b>{estado}</b>
      </p>
      <div ref={contenedor} style={{ width: ANCHO_RENDER, height: ALTO_RENDER, border: '1px dashed #bbb' }}>
        <MesaEscena3D estado={estado} modo="exportar" />
      </div>
      {resultado && (
        <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
          {ESTADOS.map((e) => (
            <figure key={e} style={{ margin: 0 }}>
              <img src={resultado[e]} alt={e} style={{ width: 260, background: 'repeating-conic-gradient(#eee 0 25%, #fff 0 50%) 0 0 / 16px 16px' }} />
              <figcaption>{e}</figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
