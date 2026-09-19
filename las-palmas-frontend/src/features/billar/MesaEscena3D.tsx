import { useLayoutEffect, useRef, type MutableRefObject, type PointerEvent as PointerEventReact } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import MesaModelo3D from './modelo/MesaModelo3D';
import {
  CAMARA,
  IMAGEN_ESTADO,
  LUCES,
  POSES_ESCENA_VIVA,
  POSES_REPOSO,
  ROTACION,
  distanciaParaEncuadrar,
  posicionCamara,
  type EstadoVisual,
  type Pose,
} from './modelo/modeloMesa';
import { soportaWebGL } from './modelo/webgl';

// Escena Three.js viva (React Three Fiber). Solo se monta en el detalle de UNA
// mesa (/billar/:mesaId) y en la página de exportación: la cuadrícula /billar
// usa imágenes WebP y nunca crea contextos WebGL (PROMPT INTERFAZ BILLAR §5).

interface Arrastre {
  activo: boolean;
  x: number;
  y: number;
  dx: number;
  dy: number;
}

interface Props {
  estado: EstadoVisual;
  /** 'vivo': rotación y arrastre (detalle). 'exportar': pose fija, sin animación, para capturar la WebP. */
  modo?: 'vivo' | 'exportar';
}

export default function MesaEscena3D({ estado, modo = 'vivo' }: Props) {
  const arrastre = useRef<Arrastre>({ activo: false, x: 0, y: 0, dx: 0, dy: 0 });
  const vivo = modo === 'vivo';

  if (!soportaWebGL()) {
    return (
      <img
        src={IMAGEN_ESTADO[estado]}
        alt=""
        aria-hidden
        draggable={false}
        className="w-full h-full object-contain select-none"
      />
    );
  }

  function alPresionar(e: PointerEventReact<HTMLDivElement>) {
    if (!vivo) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    arrastre.current.activo = true;
    arrastre.current.x = e.clientX;
    arrastre.current.y = e.clientY;
  }
  function alMover(e: PointerEventReact<HTMLDivElement>) {
    const a = arrastre.current;
    if (!a.activo) return;
    a.dx += e.clientX - a.x;
    a.dy += e.clientY - a.y;
    a.x = e.clientX;
    a.y = e.clientY;
  }
  function alSoltar() {
    arrastre.current.activo = false;
  }

  return (
    <div
      className="w-full h-full select-none"
      style={{ touchAction: 'none', cursor: vivo ? 'grab' : 'default' }}
      onPointerDown={alPresionar}
      onPointerMove={alMover}
      onPointerUp={alSoltar}
      onPointerCancel={alSoltar}
    >
      <Canvas
        flat // sin "tone mapping": los colores se ven como los especifica el Anexo A
        shadows="soft" // sombra suave PCF (Anexo A)
        dpr={vivo ? [1, 2] : 1}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: !vivo }}
        camera={{ fov: CAMARA.fov, near: CAMARA.cerca, far: CAMARA.lejos }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <Encuadre poses={vivo ? POSES_ESCENA_VIVA : POSES_REPOSO} />
        <ambientLight intensity={LUCES.ambiente} />
        <LuzPrincipal />
        <directionalLight
          position={[LUCES.relleno.posicion[0], LUCES.relleno.posicion[1], LUCES.relleno.posicion[2]]}
          intensity={LUCES.relleno.intensidad}
        />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, LUCES.pisoSombra.y, 0]} receiveShadow>
          <planeGeometry args={[LUCES.pisoSombra.tamano, LUCES.pisoSombra.tamano]} />
          <shadowMaterial opacity={LUCES.pisoSombra.opacidad} />
        </mesh>
        <MesaRotable estado={estado} vivo={vivo} arrastre={arrastre} />
      </Canvas>
    </div>
  );
}

/** Coloca la cámara para que la mesa quepa completa en todas las poses posibles. */
function Encuadre({ poses }: { poses: Pose[] }) {
  const camera = useThree((s) => s.camera);
  const ancho = useThree((s) => s.size.width);
  const alto = useThree((s) => s.size.height);
  useLayoutEffect(() => {
    const distancia = distanciaParaEncuadrar(ancho / Math.max(alto, 1), poses);
    const [x, y, z] = posicionCamara(distancia);
    camera.position.set(x, y, z);
    camera.lookAt(CAMARA.objetivo[0], CAMARA.objetivo[1], CAMARA.objetivo[2]);
    camera.updateProjectionMatrix();
  }, [camera, ancho, alto, poses]);
  return null;
}

/** Luz direccional principal con sombra suave; su cámara de sombra cubre toda la mesa. */
function LuzPrincipal() {
  const ref = useRef<THREE.DirectionalLight>(null);
  useLayoutEffect(() => {
    const luz = ref.current;
    if (!luz) return;
    const t = LUCES.principal.mapaSombra;
    luz.shadow.mapSize.set(t, t);
    const cam = luz.shadow.camera;
    cam.left = -14;
    cam.right = 14;
    cam.top = 14;
    cam.bottom = -14;
    cam.near = 1;
    cam.far = 60;
    cam.updateProjectionMatrix();
    luz.shadow.bias = -0.0005;
    luz.shadow.normalBias = 0.02;
  }, []);
  const [x, y, z] = LUCES.principal.posicion;
  return <directionalLight ref={ref} position={[x, y, z]} intensity={LUCES.principal.intensidad} castShadow />;
}

function diferenciaAngular(desde: number, hacia: number): number {
  const d = (hacia - desde) % (Math.PI * 2);
  return ((d + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
}

/**
 * Rotación (Anexo A): reposo en y = -0.5; mientras la mesa está en juego gira
 * sola a 0.004 rad/frame; el arrastre suma 0.008 rad por píxel y la inclinación
 * se limita a [-0.25, 0.7]. Observaciones finales #6: una mesa cerrada "no se
 * mueve": se puede girar con el mouse, pero al soltarla vuelve a su pose.
 */
function MesaRotable({ estado, vivo, arrastre }: { estado: EstadoVisual; vivo: boolean; arrastre: MutableRefObject<Arrastre> }) {
  const ref = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const g = ref.current;
    if (!g || !vivo) return;
    const dt = Math.min(delta, 0.1);
    const a = arrastre.current;
    if (a.dx !== 0 || a.dy !== 0) {
      g.rotation.y += a.dx * ROTACION.arrastre;
      g.rotation.x = THREE.MathUtils.clamp(g.rotation.x + a.dy * ROTACION.arrastre, ROTACION.inclinacion.min, ROTACION.inclinacion.max);
      a.dx = 0;
      a.dy = 0;
    }
    if (a.activo) return;
    if (estado === 'ocupada') {
      g.rotation.y += ROTACION.velocidad * dt;
    } else {
      const k = 1 - Math.exp(-dt * 4);
      g.rotation.y += diferenciaAngular(g.rotation.y, ROTACION.reposo) * k;
      g.rotation.x += (0 - g.rotation.x) * k;
    }
  });

  return (
    <group ref={ref} rotation={[0, ROTACION.reposo, 0]}>
      <MesaModelo3D estado={estado} animado={vivo} />
    </group>
  );
}
