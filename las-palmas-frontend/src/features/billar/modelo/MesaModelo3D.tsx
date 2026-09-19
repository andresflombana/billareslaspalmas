import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  BOLAS,
  CAJAS,
  COLOR_BOLA,
  COLORES_FIJOS,
  DIAMANTES,
  RADIO_BOLA,
  SUPERFICIE,
  TRANSICION_MS,
  TRONERAS,
  paletaDe,
  type EstadoVisual,
  type MaterialMesa,
  type Vec3,
} from './modeloMesa';

// Mesa de billar construida solo con primitivas (cajas, cilindros, esferas,
// toros) a partir de los datos de modeloMesa.ts. El estado cambia colores y
// visibilidad de bolas sobre el MISMO modelo, sin rehacer arte (Anexo A).

const MATERIALES_VARIABLES: MaterialMesa[] = ['madera', 'maderaOsc', 'pano', 'banda'];

/** Convierte una tupla de solo lectura a la tupla mutable que esperan las props de R3F. */
const v3 = (p: Vec3): [number, number, number] => [p[0], p[1], p[2]];

interface Props {
  estado: EstadoVisual;
  /** true: el cambio de estado se anima en 300 ms (vista viva). false: cambio inmediato (exportación). */
  animado: boolean;
}

export default function MesaModelo3D({ estado, animado }: Props) {
  // Estado con el que se montó: fija los valores iniciales. Después, los cambios
  // de estado se aplican por código (y no por props) para poder animarlos.
  const [inicial] = useState(estado);

  // Materiales que cambian de color con el estado: uno compartido por rol.
  const variables = useMemo(() => {
    const paleta = paletaDe(inicial);
    const crear = (m: MaterialMesa) => new THREE.MeshStandardMaterial({ color: paleta[m], ...SUPERFICIE[m] });
    return { madera: crear('madera'), maderaOsc: crear('maderaOsc'), pano: crear('pano'), banda: crear('banda') };
    // Se crean una sola vez; los cambios de estado se aplican abajo sin recrearlos.
  }, [inicial]);

  const fijos = useMemo(() => {
    const bolas = new Map<number, THREE.MeshStandardMaterial>();
    for (const [numero, color] of Object.entries(COLOR_BOLA)) {
      bolas.set(Number(numero), new THREE.MeshStandardMaterial({ color, roughness: 0.22, metalness: 0.08 }));
    }
    return {
      tronera: new THREE.MeshStandardMaterial({ color: COLORES_FIJOS.tronera, roughness: 0.9 }),
      aro: new THREE.MeshStandardMaterial({ color: COLORES_FIJOS.aro, roughness: 0.35, metalness: 0.6 }),
      diamante: new THREE.MeshStandardMaterial({ color: COLORES_FIJOS.diamante, roughness: 0.4 }),
      blanca: new THREE.MeshStandardMaterial({ color: COLORES_FIJOS.bolaBlanca, roughness: 0.2 }),
      bolas,
    };
  }, []);

  // Liberar la memoria de la GPU al desmontar.
  useEffect(
    () => () => {
      Object.values(variables).forEach((m) => m.dispose());
      [fijos.tronera, fijos.aro, fijos.diamante, fijos.blanca, ...fijos.bolas.values()].forEach((m) => m.dispose());
    },
    [variables, fijos],
  );

  const objetivos = useRef<Record<MaterialMesa, THREE.Color>>({
    madera: new THREE.Color(paletaDe(inicial).madera),
    maderaOsc: new THREE.Color(paletaDe(inicial).maderaOsc),
    pano: new THREE.Color(paletaDe(inicial).pano),
    banda: new THREE.Color(paletaDe(inicial).banda),
  });
  const bolasRef = useRef<THREE.Group>(null);
  const escalaObjetivo = useRef(inicial === 'ocupada' ? 1 : 0);

  useEffect(() => {
    const paleta = paletaDe(estado);
    for (const m of MATERIALES_VARIABLES) objetivos.current[m].set(paleta[m]);
    escalaObjetivo.current = estado === 'ocupada' ? 1 : 0;
    if (!animado) {
      for (const m of MATERIALES_VARIABLES) variables[m].color.copy(objetivos.current[m]);
      const g = bolasRef.current;
      if (g) {
        g.scale.setScalar(escalaObjetivo.current || 0.0001);
        g.visible = escalaObjetivo.current > 0;
      }
    }
  }, [estado, animado, variables]);

  // Transición de 300 ms: suavizado exponencial que llega al ~95 % en TRANSICION_MS.
  useFrame((_, delta) => {
    if (!animado) return;
    const k = 1 - Math.exp(-Math.min(delta, 0.1) * (3000 / TRANSICION_MS));
    for (const m of MATERIALES_VARIABLES) variables[m].color.lerp(objetivos.current[m], k);
    const g = bolasRef.current;
    if (g) {
      const s = g.scale.x + (escalaObjetivo.current - g.scale.x) * k;
      g.scale.setScalar(Math.max(s, 0.0001));
      g.visible = s > 0.01;
    }
  });

  const bolasVisiblesAlMontar = inicial === 'ocupada';

  return (
    <group>
      {CAJAS.map((c, i) => (
        <mesh key={i} position={v3(c.posicion)} material={variables[c.material]} castShadow receiveShadow>
          <boxGeometry args={v3(c.tamano)} />
        </mesh>
      ))}

      {TRONERAS.posiciones.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, TRONERAS.y, 0]} material={fijos.tronera}>
            <cylinderGeometry args={[TRONERAS.radio, TRONERAS.radio, TRONERAS.alto, 24]} />
          </mesh>
          <mesh position={[0, TRONERAS.aro.y, 0]} rotation={[Math.PI / 2, 0, 0]} material={fijos.aro} castShadow>
            <torusGeometry args={[TRONERAS.radio, TRONERAS.aro.radioTubo, 10, 32]} />
          </mesh>
        </group>
      ))}

      {DIAMANTES.posiciones.map((p, i) => (
        <mesh key={i} position={v3(p)} material={fijos.diamante}>
          <sphereGeometry args={[DIAMANTES.radio, 10, 10]} />
        </mesh>
      ))}

      <group ref={bolasRef} scale={bolasVisiblesAlMontar ? 1 : 0.0001} visible={bolasVisiblesAlMontar}>
        {BOLAS.map((b) => {
          const colorBola = b.numero === 0 ? fijos.blanca : fijos.bolas.get(b.numero) ?? fijos.blanca;
          return (
            <group key={b.numero} position={v3(b.posicion)}>
              <mesh material={b.rayada ? fijos.blanca : colorBola} castShadow>
                <sphereGeometry args={[RADIO_BOLA, 24, 16]} />
              </mesh>
              {b.rayada && (
                <mesh rotation={v3(b.giro)} material={colorBola}>
                  <sphereGeometry args={[RADIO_BOLA * 1.004, 24, 16, 0, Math.PI * 2, Math.PI * 0.32, Math.PI * 0.36]} />
                </mesh>
              )}
            </group>
          );
        })}
      </group>
    </group>
  );
}
