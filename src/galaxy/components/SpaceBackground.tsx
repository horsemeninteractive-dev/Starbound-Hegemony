import { useMemo, useRef } from "react";
import { useFrame, useThree, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { Stars } from "@react-three/drei";
import skyboxImg from "@/assets/skybox.png";
import systemSkyboxImg from "@/assets/skybox.jpg";
import { useEffect } from "react";

/** Subtle sky tints keyed by star class. */
const STAR_TINT: Record<string, [number, number, number]> = {
  O:         [0.10, 0.15, 0.35],  // Blue-white
  B:         [0.08, 0.12, 0.32],  // Deep blue
  A:         [0.15, 0.18, 0.30],  // Pale blue-white
  F:         [0.25, 0.22, 0.15],  // Pale yellow-white
  G:         [0.28, 0.22, 0.10],  // Warm yellow
  K:         [0.30, 0.15, 0.05],  // Orange
  M:         [0.32, 0.05, 0.05],  // Red
  whitedwarf:[0.20, 0.22, 0.28],  // Cool blue-grey
  neutron:   [0.05, 0.25, 0.25],  // Teal
  pulsar:    [0.25, 0.05, 0.28],  // Magenta
  binary:    [0.30, 0.20, 0.05],  // Gold
  blackhole: [0.05, 0.01, 0.08],  // Dark purple
  whitehole: [0.35, 0.35, 0.35],  // Bright neutral
};

const DEFAULT_TINT: [number, number, number] = [0.15, 0.15, 0.15]; 
const SKYBOX_INTENSITY = 0.7; // Global dimming factor
function tintToColor(t: [number, number, number]) {
  return new THREE.Color(t[0], t[1], t[2]);
}

/** Smooth, non-grainy nebula overlay using simple gradients instead of noise fbm */
function SkyboxMaterial({ tint }: { tint: [number, number, number] }) {
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uTint: { value: new THREE.Color(...tint) },
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  useMemo(() => {
    uniforms.uTint.value.setRGB(...tint);
  }, [tint[0], tint[1], tint[2]]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <shaderMaterial
      side={THREE.BackSide}
      depthWrite={false}
      transparent
      blending={THREE.AdditiveBlending}
      uniforms={uniforms}
      vertexShader={`
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `}
      fragmentShader={`
        varying vec3 vNormal;
        uniform float uTime;
        uniform vec3  uTint;

        void main() {
          // Create smooth, non-grainy "clouds" using simple trigonometric combinations
          // This avoids the grain inherent in pseudo-random noise functions.
          float pulse = Math.sin(vNormal.x * 2.0 + uTime * 0.1) * Math.cos(vNormal.z * 2.0 - uTime * 0.08);
          float clouds = pow(max(0.0, pulse * 0.5 + 0.5), 3.0);
          
          // Add a horizon glow
          float horizon = 1.0 - abs(vNormal.y);
          clouds += pow(horizon, 4.0) * 0.2;

          vec3 nebula = uTint * clouds * 0.4 * SKYBOX_INTENSITY;
          gl_FragColor = vec4(nebula, 1.0);
        }
      `.replace('Math.sin', 'sin').replace('Math.cos', 'cos')} // Fix for template literal confusion
    />
  );
}

interface SpaceBackgroundProps {
  starType?: string;
  view?: string;
  quality?: "low" | "medium" | "high";
}

export function SpaceBackground({ starType, view = "galaxy", quality = "high" }: SpaceBackgroundProps) {
  const dustRef = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  const galaxyTex = useLoader(THREE.TextureLoader, skyboxImg);
  const systemTex = useLoader(THREE.TextureLoader, systemSkyboxImg);
  
  useMemo(() => {
    [galaxyTex, systemTex].forEach(t => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.minFilter = THREE.LinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.anisotropy = quality === "high" ? 16 : 4;
      t.generateMipmaps = true;
    });
  }, [galaxyTex, systemTex, quality]);

  const tint = (starType && STAR_TINT[starType]) ?? DEFAULT_TINT;
  
  const skyboxUniforms = useMemo(() => ({
    uTexGalaxy: { value: galaxyTex },
    uTexSystem: { value: systemTex },
    uBlend:     { value: view === "galaxy" ? 0 : 1 },
    uTint:      { value: new THREE.Color(...tint).multiplyScalar(SKYBOX_INTENSITY) },
  }), [galaxyTex, systemTex]); // eslint-disable-line react-hooks/exhaustive-deps

  const dustUniforms = useMemo(() => ({
    uTime:  { value: 0 },
    uTint:  { value: new THREE.Color(...tint) },
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    skyboxUniforms.uTint.value.setRGB(...tint).multiplyScalar(SKYBOX_INTENSITY);
    dustUniforms.uTint.value.setRGB(...tint);
  }, [tint[0], tint[1], tint[2]]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((state, delta) => {
    if (dustRef.current) dustRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    if (groupRef.current) groupRef.current.position.copy(camera.position);

    // Smooth transition between skyboxes
    const targetBlend = view === "galaxy" ? 0 : 1;
    skyboxUniforms.uBlend.value = THREE.MathUtils.lerp(
      skyboxUniforms.uBlend.value,
      targetBlend,
      delta * 4.0 // ~300ms transition
    );
  });

  const starCount = quality === "low" ? 1200 : quality === "medium" ? 2800 : 5000;
  const segments = quality === "low" ? 32 : quality === "medium" ? 64 : 128;

  return (
    <group ref={groupRef}>
      {/* 1. Base Sky Texture (Dual Texture Cross-fade) */}
      <mesh scale={6000}>
        <sphereGeometry args={[1, segments, segments / 2]} />
        <shaderMaterial
          side={THREE.BackSide}
          depthWrite={false}
          uniforms={skyboxUniforms}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform sampler2D uTexGalaxy;
            uniform sampler2D uTexSystem;
            uniform float uBlend;
            uniform vec3 uTint;
            varying vec2 vUv;
            void main() {
              vec4 colGalaxy = texture2D(uTexGalaxy, vUv);
              vec4 colSystem = texture2D(uTexSystem, vUv);
              vec4 finalTex = mix(colGalaxy, colSystem, uBlend);
              gl_FragColor = vec4(finalTex.rgb * uTint, 1.0);
            }
          `}
        />
      </mesh>

      {/* 2. Procedural Smooth Nebula (Gradient-based, no noise grain) - Skip on low */}
      {quality !== "low" && (
        <mesh scale={5000}>
          <sphereGeometry args={[1, 32, 16]} />
          <SkyboxMaterial tint={tint} />
        </mesh>
      )}

      {/* 3. Starfield (Reduced factor to minimize grain/flicker) */}
      <Stars
        radius={400}
        depth={100}
        count={starCount}
        factor={quality === "low" ? 1.0 : 1.5}
        saturation={0.5}
        fade
        speed={0.2}
      />

      {/* 4. Deep Space Atmospheric Glow - Skip on low/medium */}
      {quality === "high" && (
        <mesh scale={800}>
          <sphereGeometry args={[1, 32, 16]} />
          <shaderMaterial
            ref={dustRef}
            transparent
            side={THREE.BackSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            uniforms={dustUniforms}
            vertexShader={`
              varying vec3 vNormal;
              void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `}
            fragmentShader={`
              varying vec3 vNormal;
              uniform float uTime;
              uniform vec3  uTint;
              void main() {
                float d = dot(vNormal, vec3(0.0, 1.0, 0.0));
                vec3 col = mix(uTint * 0.2, uTint * 0.05, d * 0.5 + 0.5);
                gl_FragColor = vec4(col, 0.04);
              }
            `}
          />
        </mesh>
      )}
    </group>
  );
}
