import * as THREE from 'three';
import * as React from 'react';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ShipConfiguration } from '../shipPresets';

interface Props {
  config: ShipConfiguration;
  engineIntensityRef?: React.RefObject<number>;
  engineColor?: string;
}

// Optimized Animated Light Component
const NavLight = React.memo(({ position, color, pulseSpeed = 2, size = 0.015 }: { position: [number, number, number], color: string, pulseSpeed?: number, size?: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const material = useMemo(() => new THREE.MeshBasicMaterial({ color, transparent: true, blending: THREE.AdditiveBlending }), [color]);
  const geom = useMemo(() => new THREE.SphereGeometry(size, 8, 8), [size]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const pulse = (Math.sin(state.clock.elapsedTime * pulseSpeed) + 1) / 2;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    meshRef.current.scale.setScalar(0.8 + pulse * 0.4);
    mat.opacity = 0.3 + pulse * 0.7;
  });

  return <mesh ref={meshRef} position={position} geometry={geom} material={material} />;
});

const ThrusterPlume = React.memo(({ color, intensityRef, scale = 1 }: { color: string, intensityRef?: React.RefObject<number>, scale?: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const plumeGeoms = useMemo(() => ({
    core: new THREE.ConeGeometry(0.05, 0.2, 12, 1, true),
    main: new THREE.ConeGeometry(0.07, 0.3, 12, 1, true),
    bloom: new THREE.ConeGeometry(0.1, 0.5, 12, 1, true)
  }), []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const baseIntensity = intensityRef?.current ?? 0.4;
    const flicker = Math.sin(state.clock.elapsedTime * 25) * 0.05;
    const intensity = Math.max(0.1, baseIntensity + flicker);
    groupRef.current.scale.set(scale, scale, intensity * 2.0 * scale);
  });

  return (
    <group ref={groupRef} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh position={[0, 0.1, 0]} geometry={plumeGeoms.core}>
        <meshBasicMaterial color="white" transparent opacity={0.9} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.15, 0]} geometry={plumeGeoms.main}>
        <meshBasicMaterial color={color} transparent opacity={0.5} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.25, 0]} geometry={plumeGeoms.bloom}>
        <meshBasicMaterial color={color} transparent opacity={0.2} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
});

export const ModularShip = React.memo(function ModularShip({ config, engineIntensityRef, engineColor = '#00ffff' }: Props) {
  const { primaryColor, accentColor } = config;
  const pointLightRef = useRef<THREE.PointLight>(null);

  // Material Definitions
  const hullMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: primaryColor,
    metalness: 0.8,
    roughness: 0.2,
    envMapIntensity: 1.5,
  }), [primaryColor]);

  const detailMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1a1a1a',
    metalness: 0.9,
    roughness: 0.1,
    emissive: accentColor,
    emissiveIntensity: 0.2,
  }), [accentColor]);

  const emissiveMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: accentColor,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
  }), [accentColor]);

  const glassMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#000000',
    emissive: accentColor,
    emissiveIntensity: 2.0,
    transparent: true,
    opacity: 0.8,
    roughness: 0,
    metalness: 1,
  }), [accentColor]);

  // Comprehensive Geometry Cache
  const geoms = useMemo(() => ({
    vanguard: {
      cyl: new THREE.CylinderGeometry(0.1, 0.1, 0.5, 16),
      cone: new THREE.ConeGeometry(0.08, 0.18, 16)
    },
    sleek: new THREE.CylinderGeometry(0.04, 0.12, 0.7, 16),
    heavy: new THREE.BoxGeometry(0.22, 0.5, 0.18),
    scout: new THREE.CylinderGeometry(0.06, 0.06, 0.6, 8),
    royal: {
      cyl: new THREE.CylinderGeometry(0.12, 0.12, 0.4, 32),
      torus: new THREE.TorusGeometry(0.13, 0.01, 16, 32)
    },
    wings: {
      delta: new THREE.BoxGeometry(0.3, 0.02, 0.2),
      split: new THREE.BoxGeometry(0.35, 0.02, 0.1),
      forward: new THREE.BoxGeometry(0.4, 0.03, 0.1),
      solar: new THREE.BoxGeometry(0.4, 0.01, 0.5),
      heavy: new THREE.BoxGeometry(0.1, 0.2, 0.3)
    },
    bridge: {
      box: new THREE.BoxGeometry(0.07, 0.06, 0.15),
      boxSmall: new THREE.BoxGeometry(0.06, 0.03, 0.02),
      sph: new THREE.SphereGeometry(0.08, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      boxTall: new THREE.BoxGeometry(0.02, 0.2, 0.05),
      sphSmall: new THREE.SphereGeometry(0.05, 16, 16),
      boxFlat: new THREE.BoxGeometry(0.1, 0.02, 0.1)
    },
    engines: {
      cyl: new THREE.CylinderGeometry(0.06, 0.08, 0.1, 16),
      cylSmall: new THREE.CylinderGeometry(0.03, 0.04, 0.08, 12),
      cylLarge: new THREE.CylinderGeometry(0.1, 0.12, 0.15, 16),
      cylMed: new THREE.CylinderGeometry(0.05, 0.06, 0.12, 16),
      box: new THREE.BoxGeometry(0.08, 0.06, 0.12)
    },
    details: {
      light: new THREE.SphereGeometry(0.015, 8, 8),
      strip: new THREE.BoxGeometry(0.01, 0.1, 0.005),
      greeble: new THREE.BoxGeometry(0.04, 0.04, 0.04),
      window: new THREE.BoxGeometry(0.02, 0.01, 0.005)
    }
  }), []);

  // Hull-dependent Anchor Points
  const anchors = useMemo(() => {
    switch (config.hullId) {
      case 'hull_sleek': return { enginesZ: -0.25, wingsY: 0, wingsZ: 0.1, bridgeZ: 0.1, portLights: [[0.05, 0, 0.1], [0.05, 0, 0], [0.05, 0, -0.1]] };
      case 'hull_heavy': return { enginesZ: -0.2, wingsY: 0, wingsZ: 0, bridgeZ: 0.05, portLights: [[0.12, 0.05, 0.1], [0.12, -0.05, 0], [0.12, 0.05, -0.1]] };
      case 'hull_scout': return { enginesZ: -0.2, wingsY: 0, wingsZ: 0.1, bridgeZ: 0.1, portLights: [[0.07, 0, 0.15], [0.07, 0, 0.05], [0.07, 0, -0.05]] };
      case 'hull_royal': return { enginesZ: -0.2, wingsY: 0, wingsZ: 0, bridgeZ: 0, portLights: [[0.13, 0.02, 0.1], [0.13, -0.02, 0], [0.13, 0.02, -0.1]] };
      case 'hull_vanguard':
      default: return { enginesZ: -0.2, wingsY: 0, wingsZ: 0.05, bridgeZ: 0.05, portLights: [[0.11, 0, 0.1], [0.11, 0, 0], [0.11, 0, -0.1]] };
    }
  }, [config.hullId]);

  useFrame((state) => {
    const baseIntensity = engineIntensityRef?.current ?? 0.4;
    const intensity = baseIntensity + Math.sin(state.clock.elapsedTime * 10) * 0.05;
    if (pointLightRef.current) {
      pointLightRef.current.intensity = intensity * 1.5;
    }
  });
  
  return (
    <group>
      {/* Hull Component */}
      <group>
        {config.hullId === 'hull_vanguard' && (
          <>
            <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]} material={hullMaterial} geometry={geoms.vanguard.cyl} />
            <mesh position={[0, 0, 0.28]} rotation={[Math.PI / 2, 0, 0]} material={hullMaterial} geometry={geoms.vanguard.cone} />
            <mesh position={[0, 0.08, 0.1]} geometry={geoms.details.strip} material={emissiveMaterial} rotation={[Math.PI/2, 0, 0]} />
          </>
        )}
        {config.hullId === 'hull_sleek' && (
          <group>
            <mesh position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]} material={hullMaterial} geometry={geoms.sleek} />
            <mesh position={[0, 0.04, 0.2]} geometry={geoms.details.strip} material={emissiveMaterial} rotation={[Math.PI/2, 0, 0]} scale={[2, 0.5, 1]} />
          </group>
        )}
        {config.hullId === 'hull_heavy' && (
          <group>
            <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]} material={hullMaterial} geometry={geoms.heavy} />
          </group>
        )}
        {config.hullId === 'hull_scout' && (
          <group>
            <mesh position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]} material={hullMaterial} geometry={geoms.scout} />
            <mesh position={[0, 0.06, 0.25]} geometry={geoms.details.strip} material={emissiveMaterial} rotation={[Math.PI/2, 0, 0]} />
          </group>
        )}
        {config.hullId === 'hull_royal' && (
          <group>
            <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={hullMaterial} geometry={geoms.royal.cyl} />
            <mesh position={[0, 0, 0.25]} rotation={[Math.PI / 2, 0, 0]} material={detailMaterial} geometry={geoms.royal.torus} />
          </group>
        )}

        {/* Dynamic Port Lighting (Animated Windows) */}
        {anchors.portLights.map((pos, i) => (
          <group key={`port-${i}`}>
            <mesh position={[pos[0], pos[1], pos[2]]} geometry={geoms.details.window} material={emissiveMaterial} />
            <mesh position={[-pos[0], pos[1], pos[2]]} geometry={geoms.details.window} material={emissiveMaterial} />
          </group>
        ))}
      </group>

      {/* Wings Component */}
      <group position={[0, anchors.wingsY, anchors.wingsZ]}>
        {config.wingsId === 'wings_delta' && (
          <>
            <mesh position={[0.2, 0, -0.1]} rotation={[0, -0.3, 0]} material={hullMaterial} geometry={geoms.wings.delta} />
            <mesh position={[-0.2, 0, -0.1]} rotation={[0, 0.3, 0]} material={hullMaterial} geometry={geoms.wings.delta} />
            <NavLight position={[0.35, 0, -0.15]} color="#00ff00" pulseSpeed={3} />
            <NavLight position={[-0.35, 0, -0.15]} color="#ff0000" pulseSpeed={3} />
          </>
        )}
        {config.wingsId === 'wings_split' && (
          <group>
            <mesh position={[0.25, 0.08, -0.1]} rotation={[0, 0, 0.2]} material={hullMaterial} geometry={geoms.wings.split} />
            <mesh position={[-0.25, 0.08, -0.1]} rotation={[0, 0, -0.2]} material={hullMaterial} geometry={geoms.wings.split} />
            <mesh position={[0.25, -0.08, -0.1]} rotation={[0, 0, -0.2]} material={hullMaterial} geometry={geoms.wings.split} />
            <mesh position={[-0.25, -0.08, -0.1]} rotation={[0, 0, 0.2]} material={hullMaterial} geometry={geoms.wings.split} />
            <NavLight position={[0.42, 0.12, -0.1]} color="#00ff00" pulseSpeed={2} />
            <NavLight position={[-0.42, 0.12, -0.1]} color="#ff0000" pulseSpeed={2} />
          </group>
        )}
        {config.wingsId === 'wings_forward' && (
          <>
            <mesh position={[0.25, 0, 0.15]} rotation={[0, 0.5, 0]} material={hullMaterial} geometry={geoms.wings.forward} />
            <mesh position={[-0.25, 0, 0.15]} rotation={[0, -0.5, 0]} material={hullMaterial} geometry={geoms.wings.forward} />
            <NavLight position={[0.45, 0, 0.25]} color="#00ff00" pulseSpeed={4} />
            <NavLight position={[-0.45, 0, 0.25]} color="#ff0000" pulseSpeed={4} />
          </>
        )}
        {config.wingsId === 'wings_solar' && (
          <group>
            <mesh position={[0.3, 0, 0]} material={detailMaterial} geometry={geoms.wings.solar} />
            <mesh position={[-0.3, 0, 0]} material={detailMaterial} geometry={geoms.wings.solar} />
            <mesh position={[0.3, 0.01, 0]} geometry={geoms.wings.solar} material={emissiveMaterial} scale={[0.98, 1, 0.05]} />
            <mesh position={[-0.3, 0.01, 0]} geometry={geoms.wings.solar} material={emissiveMaterial} scale={[0.98, 1, 0.05]} />
            <NavLight position={[0.5, 0, 0.2]} color="#00ff00" />
            <NavLight position={[-0.5, 0, 0.2]} color="#ff0000" />
          </group>
        )}
        {config.wingsId === 'wings_heavy' && (
          <group>
            <mesh position={[0.18, 0, -0.1]} material={hullMaterial} geometry={geoms.wings.heavy} />
            <mesh position={[-0.18, 0, -0.1]} material={hullMaterial} geometry={geoms.wings.heavy} />
            <NavLight position={[0.23, 0, 0]} color="#00ff00" />
            <NavLight position={[-0.23, 0, 0]} color="#ff0000" />
          </group>
        )}
      </group>

      {/* Bridge Component */}
      <group position={[0, 0, anchors.bridgeZ]}>
        {config.bridgeId === 'bridge_panoramic' && (
          <group position={[0, 0.08, 0.12]}>
            <mesh material={detailMaterial} geometry={geoms.bridge.box} />
            <mesh position={[0, 0.02, 0.06]} material={glassMaterial} geometry={geoms.bridge.boxSmall} />
          </group>
        )}
        {config.bridgeId === 'bridge_armored' && (
          <mesh position={[0, 0.06, 0.05]} material={detailMaterial} geometry={geoms.bridge.sph} />
        )}
        {config.bridgeId === 'bridge_sleek' && (
          <mesh position={[0, 0.15, -0.1]} rotation={[0.2, 0, 0]} material={hullMaterial} geometry={geoms.bridge.boxTall} />
        )}
        {config.bridgeId === 'bridge_bubble' && (
          <mesh position={[0, 0.08, 0.15]} material={glassMaterial} geometry={geoms.bridge.sphSmall} />
        )}
        {config.bridgeId === 'bridge_integrated' && (
          <mesh position={[0, 0.03, 0.22]} material={glassMaterial} geometry={geoms.bridge.boxFlat} />
        )}
      </group>

      {/* Engine Component & Thruster Plumes */}
      <group position={[0, 0, anchors.enginesZ]}>
        {config.enginesId === 'engine_plasma' && (
          <group>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={detailMaterial} geometry={geoms.engines.cyl} />
            <group position={[0, 0, -0.05]}><ThrusterPlume color={engineColor} intensityRef={engineIntensityRef} /></group>
          </group>
        )}
        {config.enginesId === 'engine_triple' && (
          <group>
            {[[0.08, 0, 0], [-0.08, 0, 0], [0, 0.06, 0]].map((pos, i) => (
              <group key={i} position={pos as [number, number, number]}>
                <mesh rotation={[Math.PI / 2, 0, 0]} material={detailMaterial} geometry={geoms.engines.cylSmall} />
                <group position={[0, 0, -0.04]}><ThrusterPlume color={engineColor} intensityRef={engineIntensityRef} scale={0.6} /></group>
              </group>
            ))}
          </group>
        )}
        {config.enginesId === 'engine_heavy' && (
          <group>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={detailMaterial} geometry={geoms.engines.cylLarge} />
            <group position={[0, 0, -0.08]}><ThrusterPlume color={engineColor} intensityRef={engineIntensityRef} scale={1.5} /></group>
          </group>
        )}
        {config.enginesId === 'engine_dual' && (
          <group>
            <group position={[0.1, 0, 0]}>
              <mesh rotation={[Math.PI / 2, 0, 0]} material={detailMaterial} geometry={geoms.engines.cylMed} />
              <group position={[0, 0, -0.06]}><ThrusterPlume color={engineColor} intensityRef={engineIntensityRef} scale={0.8} /></group>
            </group>
            <group position={[-0.1, 0, 0]}>
              <mesh rotation={[Math.PI / 2, 0, 0]} material={detailMaterial} geometry={geoms.engines.cylMed} />
              <group position={[0, 0, -0.06]}><ThrusterPlume color={engineColor} intensityRef={engineIntensityRef} scale={0.8} /></group>
            </group>
          </group>
        )}
        {config.enginesId === 'engine_stealth' && (
          <group>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={detailMaterial} geometry={geoms.engines.box} />
            <group position={[0, 0, -0.05]}><ThrusterPlume color={engineColor} intensityRef={engineIntensityRef} scale={0.4} /></group>
          </group>
        )}
      </group>

      <pointLight ref={pointLightRef} position={[0, 0, -0.5]} color={engineColor} distance={2} />
    </group>
  );
});
