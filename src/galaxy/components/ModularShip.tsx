import * as THREE from 'three';
import * as React from 'react';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ShipConfiguration } from '../shipPresets';

interface Props {
  config: ShipConfiguration;
  engineIntensityRef?: React.RefObject<number>;
  engineColor?: string;
  isJumpingRef?: React.RefObject<boolean>;
  jumpScale?: number;
}

// Warp Bubble Component
const WarpBubble = React.memo(({ activeRef, scale = 1 }: { activeRef?: React.RefObject<boolean>, scale?: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const material = useMemo(() => new THREE.MeshBasicMaterial({
    color: "#4488ff",
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  }), []);

  const scaleRef = useRef(0);

  useFrame((state) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    const active = activeRef?.current ?? false;
    
    if (active) {
      // Growth animation
      scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, 1, 0.05);
      // Fast fade in and pulse
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0.4 + Math.sin(state.clock.elapsedTime * 15) * 0.1, 0.1);
      const pulse = scaleRef.current * (1.0 + Math.sin(state.clock.elapsedTime * 20) * 0.02);
      meshRef.current.scale.setScalar(pulse * scale);
    } else {
      scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, 0, 0.2);
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0, 0.2);
      meshRef.current.scale.setScalar(scaleRef.current * scale);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.6, 32, 32]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
});

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

const ThrusterPlume = React.memo(({ color, intensityRef, scale = 1, isJumpingRef }: { color: string, intensityRef?: React.RefObject<number>, scale?: number, isJumpingRef?: React.RefObject<boolean> }) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const mainMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const bloomMatRef = useRef<THREE.MeshBasicMaterial>(null);
  
  const plumeGeoms = useMemo(() => ({
    core: new THREE.CylinderGeometry(0.03, 0.05, 0.2, 12, 1, false), // Use cylinder for solid core
    main: new THREE.ConeGeometry(0.07, 0.3, 12, 1, true),
    bloom: new THREE.ConeGeometry(0.1, 0.5, 12, 1, true)
  }), []);

  const jumpColor = useMemo(() => new THREE.Color("#4488ff"), []);
  const baseColor = useMemo(() => new THREE.Color(color), [color]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const baseIntensity = intensityRef?.current ?? 0.4;
    const flicker = Math.sin(state.clock.elapsedTime * 25) * 0.05;
    const isJumping = isJumpingRef?.current ?? false;
    
    // During jump, plume goes wild
    const targetIntensity = isJumping ? 4.0 : baseIntensity;
    const intensity = Math.max(0.1, Math.min(6.0, targetIntensity + flicker));
    
    groupRef.current.scale.set(scale, scale, intensity * 1.4 * scale);

    // Shift color during jump
    if (mainMatRef.current && bloomMatRef.current) {
      const c = isJumping ? jumpColor : baseColor;
      mainMatRef.current.color.lerp(c, 0.1);
      bloomMatRef.current.color.lerp(c, 0.1);
    }
  });

  return (
    <group ref={groupRef} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh position={[0, 0.1, 0]} geometry={plumeGeoms.core}>
        <meshBasicMaterial ref={coreMatRef} color="white" transparent opacity={0.8} depthWrite={true} />
      </mesh>
      <mesh position={[0, 0.15, 0]} geometry={plumeGeoms.main} renderOrder={10}>
        <meshBasicMaterial ref={mainMatRef} color={color} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.25, 0]} geometry={plumeGeoms.bloom} renderOrder={11}>
        <meshBasicMaterial ref={bloomMatRef} color={color} transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
});

export const ModularShip = React.memo(function ModularShip({ config, engineIntensityRef, engineColor = '#00ffff', isJumpingRef, jumpScale = 1 }: Props) {
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
    // FREIGHTER GEOMS
    freighter_bulk: new THREE.BoxGeometry(0.35, 0.35, 0.8),
    freighter_modular: {
      frame: new THREE.BoxGeometry(0.1, 0.1, 1.0),
      cage: new THREE.BoxGeometry(0.4, 0.4, 0.05),
    },
    freighter_armored: new THREE.BoxGeometry(0.45, 0.3, 0.7),
    // SCIENCE GEOMS
    science_dish: {
      base: new THREE.CylinderGeometry(0.1, 0.2, 0.5, 16),
      dish: new THREE.TorusGeometry(0.25, 0.02, 8, 32),
      dome: new THREE.SphereGeometry(0.12, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    },
    science_sleek: new THREE.CylinderGeometry(0.08, 0.15, 0.8, 16),

    wings: {
      delta: new THREE.BoxGeometry(0.3, 0.02, 0.2),
      split: new THREE.BoxGeometry(0.35, 0.02, 0.1),
      forward: new THREE.BoxGeometry(0.4, 0.03, 0.1),
      solar: new THREE.BoxGeometry(0.4, 0.01, 0.5),
      heavy: new THREE.BoxGeometry(0.1, 0.2, 0.3),
      // NEW WINGS
      freighter_stabi: new THREE.BoxGeometry(0.5, 0.05, 0.3),
      freighter_crane: new THREE.BoxGeometry(0.05, 0.4, 0.1),
      science_solar: new THREE.BoxGeometry(0.6, 0.01, 0.4),
      science_sensors: new THREE.BoxGeometry(0.8, 0.02, 0.05),
    },
    bridge: {
      box: new THREE.BoxGeometry(0.07, 0.06, 0.15),
      boxSmall: new THREE.BoxGeometry(0.06, 0.03, 0.02),
      sph: new THREE.SphereGeometry(0.08, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      boxTall: new THREE.BoxGeometry(0.02, 0.2, 0.05),
      sphSmall: new THREE.SphereGeometry(0.05, 16, 16),
      boxFlat: new THREE.BoxGeometry(0.1, 0.02, 0.1),
      // NEW BRIDGES
      freighter_tower: new THREE.BoxGeometry(0.15, 0.15, 0.1),
      freighter_front: new THREE.BoxGeometry(0.1, 0.08, 0.12),
      science_dome: new THREE.SphereGeometry(0.1, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      science_sleek: new THREE.BoxGeometry(0.12, 0.05, 0.15),
    },
    engines: {
      cyl: new THREE.CylinderGeometry(0.06, 0.08, 0.1, 16),
      cylSmall: new THREE.CylinderGeometry(0.03, 0.04, 0.08, 12),
      cylLarge: new THREE.CylinderGeometry(0.1, 0.12, 0.15, 16),
      cylMed: new THREE.CylinderGeometry(0.05, 0.06, 0.12, 16),
      box: new THREE.BoxGeometry(0.08, 0.06, 0.12),
      // NEW ENGINES
      freighter_quad: new THREE.BoxGeometry(0.12, 0.12, 0.2),
      science_ion: new THREE.CylinderGeometry(0.04, 0.1, 0.2, 16),
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
      // COMMANDER
      case 'hull_sleek': return { enginesZ: -0.25, wingsY: 0, wingsZ: 0.1, bridgeZ: 0.1, portLights: [[0.05, 0, 0.1], [0.05, 0, 0], [0.05, 0, -0.1]] };
      case 'hull_heavy': return { enginesZ: -0.2, wingsY: 0, wingsZ: 0, bridgeZ: 0.05, portLights: [[0.12, 0.05, 0.1], [0.12, -0.05, 0], [0.12, 0.05, -0.1]] };
      case 'hull_scout': return { enginesZ: -0.2, wingsY: 0, wingsZ: 0.1, bridgeZ: 0.1, portLights: [[0.07, 0, 0.15], [0.07, 0, 0.05], [0.07, 0, -0.05]] };
      case 'hull_royal': return { enginesZ: -0.2, wingsY: 0, wingsZ: 0, bridgeZ: 0, portLights: [[0.13, 0.02, 0.1], [0.13, -0.02, 0], [0.13, 0.02, -0.1]] };
      // FREIGHTER
      case 'hull_freighter_bulk': return { enginesZ: -0.4, wingsY: 0, wingsZ: -0.1, bridgeZ: 0, portLights: [[0.18, 0.1, 0.2], [0.18, -0.1, 0]] };
      case 'hull_freighter_modular': return { enginesZ: -0.5, wingsY: 0.1, wingsZ: 0, bridgeZ: 0.3, portLights: [] };
      case 'hull_freighter_armored': return { enginesZ: -0.35, wingsY: 0, wingsZ: -0.1, bridgeZ: 0.2, portLights: [[0.23, 0.05, 0.1]] };
      // SCIENCE
      case 'hull_science_dish': return { enginesZ: -0.2, wingsY: 0, wingsZ: 0, bridgeZ: 0.2, portLights: [[0.1, 0.05, 0.1]] };
      case 'hull_science_sleek': return { enginesZ: -0.4, wingsY: 0, wingsZ: 0.1, bridgeZ: 0.3, portLights: [[0.09, 0, 0.2], [0.09, 0, 0.1]] };
      
      case 'hull_vanguard':
      default: return { enginesZ: -0.2, wingsY: 0, wingsZ: 0.05, bridgeZ: 0.05, portLights: [[0.11, 0, 0.1], [0.11, 0, 0], [0.11, 0, -0.1]] };
    }
  }, [config.hullId]);

  const jumpColor = useMemo(() => new THREE.Color("#4488ff"), []);

  useFrame((state) => {
    const baseIntensity = engineIntensityRef?.current ?? 0.4;
    const isJumping = isJumpingRef?.current ?? false;
    const intensity = (isJumping ? 3.0 : baseIntensity) + Math.sin(state.clock.elapsedTime * 10) * 0.05;
    
    if (pointLightRef.current) {
      pointLightRef.current.intensity = intensity * 1.5;
      if (isJumping) {
        pointLightRef.current.color.lerp(jumpColor, 0.1);
      } else {
        pointLightRef.current.color.set(engineColor);
      }
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
        {/* FREIGHTER HULLS */}
        {config.hullId === 'hull_freighter_bulk' && (
          <mesh position={[0, 0, 0]} material={hullMaterial} geometry={geoms.freighter_bulk} />
        )}
        {config.hullId === 'hull_freighter_modular' && (
          <group>
            <mesh position={[0, 0, 0]} material={detailMaterial} geometry={geoms.freighter_modular.frame} />
            {[-0.3, 0, 0.3].map((z, i) => (
              <mesh key={i} position={[0, 0, z]} material={hullMaterial} geometry={geoms.freighter_modular.cage} />
            ))}
          </group>
        )}
        {config.hullId === 'hull_freighter_armored' && (
          <mesh position={[0, 0, 0]} material={hullMaterial} geometry={geoms.freighter_armored} />
        )}
        {/* SCIENCE HULLS */}
        {config.hullId === 'hull_science_dish' && (
          <group>
            <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={hullMaterial} geometry={geoms.science_dish.base} />
            <mesh position={[0, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]} material={detailMaterial} geometry={geoms.science_dish.dish} />
            <mesh position={[0, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]} material={emissiveMaterial} geometry={geoms.science_dish.dome} />
          </group>
        )}
        {config.hullId === 'hull_science_sleek' && (
          <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={hullMaterial} geometry={geoms.science_sleek} />
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
        {/* NEW WINGS */}
        {config.wingsId === 'wings_freighter_stabi' && (
          <group>
            <mesh position={[0.4, 0, 0]} material={hullMaterial} geometry={geoms.wings.freighter_stabi} />
            <mesh position={[-0.4, 0, 0]} material={hullMaterial} geometry={geoms.wings.freighter_stabi} />
          </group>
        )}
        {config.wingsId === 'wings_freighter_crane' && (
          <group>
            <mesh position={[0.25, 0.2, 0]} material={detailMaterial} geometry={geoms.wings.freighter_crane} />
            <mesh position={[-0.25, 0.2, 0]} material={detailMaterial} geometry={geoms.wings.freighter_crane} />
          </group>
        )}
        {config.wingsId === 'wings_science_solar' && (
          <group>
            <mesh position={[0.5, 0, 0]} material={emissiveMaterial} geometry={geoms.wings.science_solar} />
            <mesh position={[-0.5, 0, 0]} material={emissiveMaterial} geometry={geoms.wings.science_solar} />
          </group>
        )}
        {config.wingsId === 'wings_science_sensors' && (
          <group>
            <mesh position={[0.45, 0, 0]} material={detailMaterial} geometry={geoms.wings.science_sensors} />
            <mesh position={[-0.45, 0, 0]} material={detailMaterial} geometry={geoms.wings.science_sensors} />
            <NavLight position={[0.8, 0, 0]} color={accentColor} />
            <NavLight position={[-0.8, 0, 0]} color={accentColor} />
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
        {/* NEW BRIDGES */}
        {config.bridgeId === 'bridge_freighter_top' && (
          <mesh position={[0, 0.25, -0.1]} material={hullMaterial} geometry={geoms.bridge.freighter_tower} />
        )}
        {config.bridgeId === 'bridge_freighter_front' && (
          <mesh position={[0, 0.1, 0.35]} material={glassMaterial} geometry={geoms.bridge.freighter_front} />
        )}
        {config.bridgeId === 'bridge_science_bubble' && (
          <mesh position={[0, 0.1, 0.2]} material={glassMaterial} geometry={geoms.bridge.science_dome} />
        )}
        {config.bridgeId === 'bridge_science_sleek' && (
          <mesh position={[0, 0.05, 0.3]} material={hullMaterial} geometry={geoms.bridge.science_sleek} />
        )}
      </group>

      {/* Engine Component & Thruster Plumes */}
      <group position={[0, 0, anchors.enginesZ]}>
        {config.enginesId === 'engine_plasma' && (
          <group>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={detailMaterial} geometry={geoms.engines.cyl} />
            <group position={[0, 0, -0.05]}><ThrusterPlume color={engineColor} intensityRef={engineIntensityRef} isJumpingRef={isJumpingRef} /></group>
          </group>
        )}
        {config.enginesId === 'engine_triple' && (
          <group>
            {[[0.08, 0, 0], [-0.08, 0, 0], [0, 0.06, 0]].map((pos, i) => (
              <group key={i} position={pos as [number, number, number]}>
                <mesh rotation={[Math.PI / 2, 0, 0]} material={detailMaterial} geometry={geoms.engines.cylSmall} />
                <group position={[0, 0, -0.04]}><ThrusterPlume color={engineColor} intensityRef={engineIntensityRef} scale={0.6} isJumpingRef={isJumpingRef} /></group>
              </group>
            ))}
          </group>
        )}
        {config.enginesId === 'engine_heavy' && (
          <group>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={detailMaterial} geometry={geoms.engines.cylLarge} />
            <group position={[0, 0, -0.08]}><ThrusterPlume color={engineColor} intensityRef={engineIntensityRef} scale={1.5} isJumpingRef={isJumpingRef} /></group>
          </group>
        )}
        {config.enginesId === 'engine_dual' && (
          <group>
            <group position={[0.1, 0, 0]}>
              <mesh rotation={[Math.PI / 2, 0, 0]} material={detailMaterial} geometry={geoms.engines.cylMed} />
              <group position={[0, 0, -0.06]}><ThrusterPlume color={engineColor} intensityRef={engineIntensityRef} scale={0.8} isJumpingRef={isJumpingRef} /></group>
            </group>
            <group position={[-0.1, 0, 0]}>
              <mesh rotation={[Math.PI / 2, 0, 0]} material={detailMaterial} geometry={geoms.engines.cylMed} />
              <group position={[0, 0, -0.06]}><ThrusterPlume color={engineColor} intensityRef={engineIntensityRef} scale={0.8} isJumpingRef={isJumpingRef} /></group>
            </group>
          </group>
        )}
        {config.enginesId === 'engine_stealth' && (
          <group>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={detailMaterial} geometry={geoms.engines.box} />
            <group position={[0, 0, -0.05]}><ThrusterPlume color={engineColor} intensityRef={engineIntensityRef} scale={0.4} isJumpingRef={isJumpingRef} /></group>
          </group>
        )}
        {/* NEW ENGINES */}
        {config.enginesId === 'engine_freighter_quad' && (
          <group>
            {[[0.12, 0.12, 0], [-0.12, 0.12, 0], [0.12, -0.12, 0], [-0.12, -0.12, 0]].map((pos, i) => (
              <group key={i} position={pos as [number, number, number]}>
                <mesh material={detailMaterial} geometry={geoms.engines.freighter_quad} />
                <group position={[0, 0, -0.1]}><ThrusterPlume color={engineColor} intensityRef={engineIntensityRef} scale={1.0} isJumpingRef={isJumpingRef} /></group>
              </group>
            ))}
          </group>
        )}
        {config.enginesId === 'engine_freighter_industrial' && (
          <group>
            <mesh material={hullMaterial} geometry={geoms.engines.cylLarge} />
            <group position={[0, 0, -0.1]}><ThrusterPlume color={engineColor} intensityRef={engineIntensityRef} scale={2.0} isJumpingRef={isJumpingRef} /></group>
          </group>
        )}
        {config.enginesId === 'engine_science_blue' && (
          <group>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={detailMaterial} geometry={geoms.engines.science_ion} />
            <group position={[0, 0, -0.1]}><ThrusterPlume color={engineColor} intensityRef={engineIntensityRef} scale={0.7} isJumpingRef={isJumpingRef} /></group>
          </group>
        )}
        {config.enginesId === 'engine_science_twin' && (
          <group>
             <group position={[0.08, 0, 0]}>
              <mesh rotation={[Math.PI / 2, 0, 0]} material={detailMaterial} geometry={geoms.engines.cylSmall} />
              <group position={[0, 0, -0.05]}><ThrusterPlume color={engineColor} intensityRef={engineIntensityRef} scale={0.4} isJumpingRef={isJumpingRef} /></group>
            </group>
            <group position={[-0.08, 0, 0]}>
              <mesh rotation={[Math.PI / 2, 0, 0]} material={detailMaterial} geometry={geoms.engines.cylSmall} />
              <group position={[0, 0, -0.05]}><ThrusterPlume color={engineColor} intensityRef={engineIntensityRef} scale={0.4} isJumpingRef={isJumpingRef} /></group>
            </group>
          </group>
        )}
      </group>

      <pointLight ref={pointLightRef} position={[0, 0, -0.5]} color={engineColor} distance={2} />
      <WarpBubble activeRef={isJumpingRef} scale={jumpScale} />
    </group>
  );
});
