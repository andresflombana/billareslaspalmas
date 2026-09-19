// ============================================================================
// Modelo 3D paramétrico de la mesa de billar — datos puros (sin Three.js).
//
// Base: Anexo A de "LAS PALMAS - PROMPT INTERFAZ MODULO _BILLAR.pdf" (piezas,
// materiales, colores, luces, cámara, variantes de estado y rotación).
// Diseño refinado con el modelo de referencia del cliente (mesas_bi.obj, de
// SketchUp) en lo que el Anexo no fija: patas hacia adentro con bastidor,
// bandas de goma (cojines) entre troneras, troneras con aro metálico y rack
// completo de 15 bolas. El .obj NO se carga: todo se construye por código con
// cajas, cilindros, esferas y toros, y de aquí salen las tres variantes.
//
// Unidades: las del Anexo (el cuerpo mide 12.6 × 1.3 × 6.6).
// Un mismo módulo alimenta la escena viva (detalle /billar/:mesaId) y la
// exportación de las WebP de la cuadrícula (npm run export:mesas).
// ============================================================================

import type { EstadoMesa } from '../../../api/tipos';

export type Vec3 = readonly [number, number, number];

/** Variante visual. RESERVADA (no usada todavía por ningún sprint) se ve como libre. */
export type EstadoVisual = 'libre' | 'ocupada' | 'fuera_servicio';

export function estadoVisualDe(estado: EstadoMesa): EstadoVisual {
  if (estado === 'OCUPADA') return 'ocupada';
  if (estado === 'FUERA_SERVICIO') return 'fuera_servicio';
  return 'libre';
}

// ---------------------------------------------------------------- materiales

export type MaterialMesa = 'madera' | 'maderaOsc' | 'pano' | 'banda';

/** Colores que cambian con el estado (Anexo A, aplicarEstado). `banda` = cojín, un tono bajo el paño. */
export const PALETAS: Record<'normal' | 'fueraServicio', Record<MaterialMesa, string>> = {
  normal: { madera: '#6B3F22', maderaOsc: '#4A2A16', pano: '#1E6F4C', banda: '#185B3E' },
  fueraServicio: { madera: '#8C8781', maderaOsc: '#6E6A65', pano: '#8A8A85', banda: '#777772' },
};

export function paletaDe(estado: EstadoVisual): Record<MaterialMesa, string> {
  return estado === 'fuera_servicio' ? PALETAS.fueraServicio : PALETAS.normal;
}

/** Parámetros de superficie del Anexo A (MeshStandardMaterial). */
export const SUPERFICIE: Record<MaterialMesa, { roughness: number; metalness: number }> = {
  madera: { roughness: 0.55, metalness: 0.05 },
  maderaOsc: { roughness: 0.6, metalness: 0 },
  pano: { roughness: 0.95, metalness: 0 },
  banda: { roughness: 0.9, metalness: 0 },
};

/** Colores fijos (no cambian con el estado). */
export const COLORES_FIJOS = {
  tronera: '#141414',
  aro: '#A8A397',
  diamante: '#F3ECDE',
  bolaBlanca: '#F5F2E6',
} as const;

// ---------------------------------------------------------------- geometría

export interface Caja {
  nombre: string;
  tamano: Vec3; // ancho (x), alto (y), fondo (z)
  posicion: Vec3;
  material: MaterialMesa;
}

const cajas: Caja[] = [
  // Anexo A
  { nombre: 'cuerpo', tamano: [12.6, 1.3, 6.6], posicion: [0, -0.65, 0], material: 'madera' },
  { nombre: 'paño', tamano: [11.4, 0.14, 5.4], posicion: [0, 0.07, 0], material: 'pano' },
  { nombre: 'banda larga +z', tamano: [12.6, 0.55, 0.62], posicion: [0, 0.34, 3.0], material: 'madera' },
  { nombre: 'banda larga -z', tamano: [12.6, 0.55, 0.62], posicion: [0, 0.34, -3.0], material: 'madera' },
  { nombre: 'banda corta +x', tamano: [0.62, 0.55, 5.4], posicion: [6.0, 0.34, 0], material: 'madera' },
  { nombre: 'banda corta -x', tamano: [0.62, 0.55, 5.4], posicion: [-6.0, 0.34, 0], material: 'madera' },
];

// Cojines de goma entre troneras (referencia): 4 largos y 2 cortos.
for (const sx of [1, -1]) {
  for (const sz of [1, -1]) {
    cajas.push({ nombre: 'cojín largo', tamano: [4.45, 0.34, 0.2], posicion: [sx * 2.775, 0.31, sz * 2.59], material: 'banda' });
  }
  cajas.push({ nombre: 'cojín corto', tamano: [0.2, 0.34, 4.0], posicion: [sx * 5.59, 0.31, 0], material: 'banda' });
}

// Patas 0.9 × 3.0 × 0.9 (Anexo), ubicadas hacia adentro como en la referencia,
// unidas por faldones largos y tableros en las cabeceras.
for (const x of [4.1, -4.1]) {
  for (const z of [2.25, -2.25]) {
    cajas.push({ nombre: 'pata', tamano: [0.9, 3.0, 0.9], posicion: [x, -2.8, z], material: 'maderaOsc' });
  }
  cajas.push({ nombre: 'tablero de cabecera', tamano: [0.2, 1.9, 3.6], posicion: [x, -2.25, 0], material: 'maderaOsc' });
}
for (const z of [2.25, -2.25]) {
  cajas.push({ nombre: 'faldón', tamano: [7.3, 1.0, 0.18], posicion: [0, -1.8, z], material: 'maderaOsc' });
}

export const CAJAS: readonly Caja[] = cajas;

/** Troneras (Anexo: cilindro r = 0.38; 4 esquinas + 2 centrales), mitad dentro de la banda. */
export const TRONERAS = {
  radio: 0.38,
  /** Del fondo (dentro del cuerpo) hasta apenas sobre la banda: se ve como un hueco. */
  alto: 0.505,
  y: 0.3725,
  aro: { radioTubo: 0.045, y: 0.628 },
  posiciones: [
    [5.55, 2.55],
    [-5.55, 2.55],
    [5.55, -2.55],
    [-5.55, -2.55],
    [0, 2.72],
    [0, -2.72],
  ] as ReadonlyArray<readonly [number, number]>,
};

/** Diamantes de banda (Anexo): esferas r = 0.09 en x = ±2, ±4 sobre las bandas largas. */
export const DIAMANTES = {
  radio: 0.09,
  posiciones: [-2, -1, 1, 2].flatMap((i) => [3.0, -3.0].map((z) => [i * 2.0, 0.6, z] as Vec3)),
};

// ---------------------------------------------------------------- bolas

export const RADIO_BOLA = 0.3;
const Y_BOLA = 0.44; // paño (tope en 0.14) + radio

/** Colores por número. 1–8 lisas; 9–15 rayadas (banda de color sobre blanco). Tonos del Anexo A. */
export const COLOR_BOLA: Record<number, string> = {
  1: '#E8C61E',
  2: '#1B4FA8',
  3: '#C42127',
  4: '#5E2A7E',
  5: '#E07B1E',
  6: '#1E7A3C',
  7: '#7A1F27',
  8: '#151515',
  9: '#E0BC2A',
  10: '#2F63BC',
  11: '#C42127',
  12: '#5E2A7E',
  13: '#E07B1E',
  14: '#1E7A3C',
  15: '#7A1F27',
};

/** Rack de arranque de 8-bola: la 1 al frente, la 8 al centro, una lisa y una rayada atrás. */
const RACK: number[][] = [[1], [11, 5], [2, 8, 10], [9, 7, 14, 4], [6, 15, 13, 3, 12]];

export interface Bola {
  numero: number; // 0 = blanca
  posicion: Vec3;
  rayada: boolean;
  /** Orientación de la franja (solo rayadas), fija para que la ilustración sea estable. */
  giro: Vec3;
}

export const BOLAS: readonly Bola[] = [
  ...RACK.flatMap((fila, k) =>
    fila.map((numero, j) => ({
      numero,
      // Espaciado del Anexo: filas cada 0.65 en x desde 1.2, bolas cada 0.68 en z.
      posicion: [1.2 + 0.65 * k, Y_BOLA, (j - k / 2) * 0.68] as Vec3,
      rayada: numero >= 9,
      giro: [1.1 + 0.37 * numero, 0.6 * numero, 0.25 * numero] as Vec3,
    })),
  ),
  { numero: 0, posicion: [-3.0, Y_BOLA, 0], rayada: false, giro: [0, 0, 0] },
];

// ---------------------------------------------------------------- luces

// Intensidades del Anexo A. Three.js ≥ r155 usa unidades físicas (ya no
// multiplica internamente por π como el modo "legacy"), así que se escalan por π
// para que los colores del Anexo se vean con el mismo brillo que especifica.
const ESCALA_LUZ = Math.PI;
export const LUCES = {
  ambiente: 0.55 * ESCALA_LUZ,
  principal: { intensidad: 0.85 * ESCALA_LUZ, posicion: [6, 14, 8] as Vec3, mapaSombra: 1024 },
  relleno: { intensidad: 0.3 * ESCALA_LUZ, posicion: [-8, 6, -6] as Vec3 },
  pisoSombra: { y: -4.3, tamano: 60, opacidad: 0.18 },
};

// ---------------------------------------------------------------- rotación

export const ROTACION = {
  reposo: -0.5, // mesa.rotation.y inicial (Anexo)
  velocidad: 0.24, // rad/s  = 0.004 rad/frame a 60 fps (Anexo), independiente de los fps
  arrastre: 0.008, // rad por píxel arrastrado (Anexo)
  inclinacion: { min: -0.25, max: 0.7 }, // límite de rotation.x (Anexo)
};

// ---------------------------------------------------------------- cámara

// Anexo A: perspectiva de 32°, desde (0, 11, 17) mirando a (0, -0.5, 0).
// Se conservan el ángulo de 32° y la DIRECCIÓN de vista; la distancia y el
// punto de mira se ajustan para que la mesa completa (con patas) quepa en el
// cuadro — con la cámara literal del Anexo, las patas quedan cortadas.
export const CAMARA = {
  fov: 32,
  cerca: 0.1,
  lejos: 200,
  direccion: normalizar([0, 11.5, 17]), // (0,11,17) - (0,-0.5,0)
  objetivo: [0, -1.3, 0] as Vec3,
};

/** Caja que envuelve toda la mesa (para encuadrar sin recortes). */
const ENVOLVENTE: Vec3[] = [];
for (const x of [-6.31, 6.31]) for (const y of [-4.3, 0.673]) for (const z of [-3.31, 3.31]) ENVOLVENTE.push([x, y, z]);

export interface Pose {
  rotY: number;
  rotX: number;
}

/** La mesa quieta en su pose de reposo (ilustraciones de la cuadrícula). */
export const POSES_REPOSO: Pose[] = [{ rotY: ROTACION.reposo, rotX: 0 }];

/** Todas las poses que puede tomar la escena viva (giro completo + inclinación permitida). */
export const POSES_ESCENA_VIVA: Pose[] = Array.from({ length: 72 }, (_, i) => (i / 72) * Math.PI * 2).flatMap((rotY) =>
  [ROTACION.inclinacion.min, 0, 0.35, ROTACION.inclinacion.max].map((rotX) => ({ rotY, rotX })),
);

/**
 * Distancia de la cámara (a lo largo de CAMARA.direccion, desde CAMARA.objetivo)
 * para que la mesa quepa completa en todas las poses indicadas, con un margen.
 * Matemática pura: se puede calcular una vez por tamaño de lienzo.
 */
export function distanciaParaEncuadrar(aspecto: number, poses: Pose[], margen = 0.04): number {
  const d = CAMARA.direccion;
  const f: Vec3 = [-d[0], -d[1], -d[2]];
  const r = normalizar(cruz(f, [0, 1, 0]));
  const u = cruz(r, f);
  const tanV = Math.tan(((CAMARA.fov / 2) * Math.PI) / 180) * (1 - margen);
  const tanH = tanV * aspecto;
  let distancia = 0;
  for (const { rotY, rotX } of poses) {
    const cy = Math.cos(rotY);
    const sy = Math.sin(rotY);
    const cx = Math.cos(rotX);
    const sx = Math.sin(rotX);
    for (const [px, py, pz] of ENVOLVENTE) {
      // Three.js (orden XYZ): primero la rotación en Y, luego la inclinación en X.
      const x1 = cy * px + sy * pz;
      const z1 = -sy * px + cy * pz;
      const y2 = cx * py - sx * z1;
      const z2 = sx * py + cx * z1;
      const q: Vec3 = [x1 - CAMARA.objetivo[0], y2 - CAMARA.objetivo[1], z2 - CAMARA.objetivo[2]];
      const profundidad = punto(q, f);
      distancia = Math.max(
        distancia,
        Math.abs(punto(q, u)) / tanV - profundidad,
        Math.abs(punto(q, r)) / tanH - profundidad,
      );
    }
  }
  return distancia;
}

export function posicionCamara(distancia: number): Vec3 {
  const [dx, dy, dz] = CAMARA.direccion;
  const [ox, oy, oz] = CAMARA.objetivo;
  return [ox + dx * distancia, oy + dy * distancia, oz + dz * distancia];
}

// ---------------------------------------------------------------- utilidades vectoriales

function punto(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cruz(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function normalizar(v: Vec3): Vec3 {
  const n = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / n, v[1] / n, v[2] / n];
}

// ---------------------------------------------------------------- ilustraciones estáticas

/** WebP exportadas desde este mismo modelo (npm run export:mesas) para la cuadrícula. */
export const IMAGEN_ESTADO: Record<EstadoVisual, string> = {
  libre: '/mesas/mesa-libre.webp',
  ocupada: '/mesas/mesa-ocupada.webp',
  fuera_servicio: '/mesas/mesa-fuera-servicio.webp',
};

/** Duración de la transición entre estados (PROMPT INTERFAZ BILLAR §4). */
export const TRANSICION_MS = 300;
