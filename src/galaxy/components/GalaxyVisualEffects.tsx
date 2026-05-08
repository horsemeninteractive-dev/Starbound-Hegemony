import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Billboard } from "@react-three/drei";
import type { Galaxy } from "@/galaxy/types";

/**
 * Advanced Nebula Cloud Shader
 * Uses multi-layered trigonometric noise to simulate complex gas structures.
 */
export const NebulaMaterial = ({ hue, saturation = 0.65, opacity = 0.4 }: { hue: number; saturation?: number; opacity?: number }) => {
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color().setHSL(hue / 360, saturation, 0.45) },
    uOpacity: { value: opacity },
  }), [hue, saturation, opacity]);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime * 0.04;
  });

  return (
    <shaderMaterial
      transparent
      depthWrite={false}
      blending={THREE.AdditiveBlending}
      uniforms={uniforms}
      vertexShader={`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `}
      fragmentShader={`
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uOpacity;

        // Multi-layered pseudo-noise
        float getNoise(vec2 p, float time) {
          float n = sin(p.x * 4.0 + time) * cos(p.y * 3.0 - time * 0.5) * 0.5 + 0.5;
          n += sin(p.x * 8.0 - time * 0.8) * cos(p.y * 7.0 + time * 1.2) * 0.25;
          n += sin(p.x * 16.0 + time * 1.5) * cos(p.y * 12.0 - time * 2.0) * 0.125;
          return n / 1.875;
        }

        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);
          if (dist > 0.48) discard;
          float alpha = smoothstep(0.48, 0.05, dist);
          
          float n = getNoise(vUv * 1.5, uTime);
          float n2 = getNoise(vUv * 3.0 + 0.5, uTime * 0.7);
          
          // Layered noise for "depth"
          float combinedNoise = mix(n, n2, 0.5);
          float layer2 = getNoise(vUv * 2.2 - 0.2, uTime * 0.4);
          
          alpha *= combinedNoise * (0.8 + layer2 * 0.4);
          alpha = pow(alpha, 1.05) * 2.4;

          // Multi-tone color: highlight areas with higher noise density
          vec3 highlightColor = vec3(1.0, 1.0, 1.0);
          vec3 coreColor = mix(uColor, highlightColor, combinedNoise * combinedNoise * 0.4);
          
          // Add a subtle inner glow
          float inner = smoothstep(0.15, 0.0, dist);
          vec3 finalColor = mix(coreColor, vec3(1.0), inner * 0.5);

          gl_FragColor = vec4(finalColor, alpha * uOpacity);
        }
      `}
    />
  );
};

const getRegionSeed = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export const IonStormMaterial = ({ hue, opacity = 0.5, seed = 0 }: { hue: number; opacity?: number; seed?: number }) => {
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSeed: { value: (seed % 1000) + 1.0 }, // Stable seed
    uColor: { value: new THREE.Color().setHSL(hue / 360, 0.85, 0.55) },
    uOpacity: { value: opacity },
  }), [hue, opacity, seed]);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <shaderMaterial
      transparent
      depthWrite={false}
      blending={THREE.AdditiveBlending}
      uniforms={uniforms}
      vertexShader={`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `}
      fragmentShader={`
        varying vec2 vUv;
        uniform float uTime;
        uniform float uSeed;
        uniform vec3 uColor;
        uniform float uOpacity;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        void main() {
          vec2 uv = vUv - 0.5;
          float dist = length(uv);
          if (dist > 0.5) discard;
          
          float alpha = smoothstep(0.5, 0.1, dist);
          
          // Seed-based turbulence
          float n = noise(vUv * (5.5 + sin(uSeed)) + uTime * 0.8 + uSeed);
          
          // CRACKLING LIGHTNING
          float lightning = 0.0;
          for(float i=1.0; i<7.0; i++) {
            // Highly discrete time/seed factors for each bolt
            float boltSeed = i * 45.67 + uSeed * 123.45;
            float t = uTime * (1.8 + i * 0.2) + hash(vec2(boltSeed, i)) * 10.0;
            
            // Individual bolt flash - faster crackle
            float flash = step(0.72, hash(vec2(floor(t * 22.0), i)));
            
            // Dynamic angle - bolts can go any direction
            float angle = hash(vec2(i, floor(t * 6.0))) * 6.28318;
            vec2 dir = vec2(cos(angle), sin(angle));
            vec2 perp = vec2(-dir.y, dir.x);
            
            // Coordinates along and across the bolt
            float distAlong = dot(uv, dir);
            float distPerp = dot(uv, perp);
            
            // High-frequency zigzagging (crackle)
            float zigzag = sin(distAlong * 22.0 + t * 8.0) * 0.15;
            // Add secondary jagged noise layer
            zigzag += noise(vec2(distAlong * 45.0, t * 15.0)) * 0.08;
            // Tertiary fractal jitter
            zigzag += hash(vec2(distAlong * 100.0, t * 40.0)) * 0.02;
            
            float path = abs(distPerp + zigzag);
            float strike = smoothstep(0.04, 0.0, path) * flash;
            
            // Ensure strike spans the radius but respects circular boundary
            // We use a sharper mask to keep it within the 0.5 radius
            float mask = smoothstep(0.5, 0.38, abs(distAlong));
            strike *= mask;
            
            // Add extra intensity near the center of the bolt line
            float thickness = 0.015 + hash(vec2(i, t)) * 0.01;
            float core = smoothstep(thickness, 0.0, path) * flash * 2.0;
            
            lightning = max(lightning, strike + core * mask);
          }

          // Electric Sparks / Clusters
          float sparks = step(0.975, hash(vUv * 75.0 + uTime * 20.0 + uSeed)) * alpha;
          
          vec3 baseColor = uColor;
          vec3 lightningColor = mix(uColor, vec3(0.8, 0.95, 1.0), 0.95);
          
          // Composition
          vec3 cloudColor = baseColor * (0.2 + n * 0.8);
          vec3 finalColor = mix(cloudColor, lightningColor, lightning + sparks);
          
          // Intense localized glow
          finalColor += vec3(0.5, 0.8, 1.0) * lightning * 7.0;
          finalColor += vec3(0.3, 0.6, 1.0) * sparks * 3.0;
          
          // Final Visibility
          float finalAlpha = alpha * (0.4 + n * 0.6) + lightning * 5.0 + sparks * 2.0;
          finalAlpha = clamp(finalAlpha, 0.0, 1.0);
          
          gl_FragColor = vec4(finalColor, finalAlpha * uOpacity);
        }
      `}
    />
  );
};

export const GravityRiftMaterial = ({ hue, opacity = 0.4 }: { hue: number; opacity?: number }) => {
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color().setHSL(hue / 360, 0.9, 0.3) },
    uOpacity: { value: opacity },
  }), [hue, opacity]);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <shaderMaterial
      transparent
      depthWrite={false}
      blending={THREE.AdditiveBlending}
      uniforms={uniforms}
      vertexShader={`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `}
      fragmentShader={`
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uOpacity;

        void main() {
          vec2 uv = vUv - 0.5;
          float dist = length(uv);
          float angle = atan(uv.y, uv.x);
          
          if (dist > 0.48) discard;
          
          // Improved event horizon swirl - constant spiral feel
          float lens = 1.0 / (dist + 0.08);
          // 4-fold symmetry with spiraling arms
          float swirl = sin(angle * 4.0 + lens * 5.0 - uTime * 3.5);
          
          float alpha = smoothstep(0.48, 0.0, dist);
          
          // Sharp central black hole
          float core = smoothstep(0.015, 0.12, dist);
          
          // Accretion disk - more contrast
          float disk = pow(max(0.0, 1.0 - dist * 2.5), 3.0) * (0.35 + 0.65 * swirl);
          
          // Spatial distortion
          float ripple = sin(dist * 30.0 - uTime * 1.5) * 0.05;
          
          vec3 baseColor = mix(uColor * 0.3, vec3(0.05, 0.0, 0.1), 1.0 - core);
          vec3 finalColor = baseColor + uColor * disk * 2.0;
          
          // Visible but less opaque as requested
          float finalAlpha = alpha * core * (0.3 + disk * 1.2 + ripple);
          
          gl_FragColor = vec4(finalColor, finalAlpha * uOpacity);
        }
      `}
    />
  );
};

export const FilamentMaterial = ({ hue, saturation = 0.7, opacity = 0.3 }: { hue: number; saturation?: number; opacity?: number }) => {
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color().setHSL(hue / 360, saturation, 0.35) },
    uOpacity: { value: opacity },
  }), [hue, saturation, opacity]);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime * 0.03;
  });

  return (
    <shaderMaterial
      transparent
      depthWrite={false}
      blending={THREE.AdditiveBlending}
      uniforms={uniforms}
      vertexShader={`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `}
      fragmentShader={`
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uOpacity;

        void main() {
          float dist = abs(vUv.y - 0.5) * 2.0;
          if (dist > 0.95 || vUv.x < 0.02 || vUv.x > 0.98) discard;
          float alpha = smoothstep(0.95, 0.0, dist);
          alpha *= smoothstep(0.02, 0.15, vUv.x) * smoothstep(0.98, 0.85, vUv.x);
          
          float w1 = sin(vUv.x * 7.0 + uTime) * sin(vUv.y * 11.0 + uTime * 0.5) * 0.5 + 0.5;
          float w2 = sin(vUv.x * 15.0 - uTime * 0.8) * sin(vUv.y * 5.0 + uTime * 1.2) * 0.5 + 0.5;
          
          alpha *= (0.2 + 0.8 * mix(w1, w2, 0.4));
          alpha = pow(alpha, 1.4) * 2.5;

          gl_FragColor = vec4(uColor, alpha * uOpacity);
        }
      `}
    />
  );
};

const GalacticDiscMaterial = ({ maxDist }: { maxDist: number }) => {
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMaxDist: { value: maxDist },
  }), [maxDist]);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime * 0.01;
  });

  return (
    <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={`
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `}
        fragmentShader={`
            varying vec2 vUv;
            uniform float uTime;
            uniform float uMaxDist;
            
            void main() {
                vec2 center = vUv - 0.5;
                float dist = length(center);
                float angle = atan(center.y, center.x);
                
                // Base radial falloff
                float alpha = smoothstep(0.5, 0.1, dist);
                
                // Spiral arms structure
                float spiral = sin(angle * 2.0 + dist * 12.0 - uTime) * 0.5 + 0.5;
                float spiral2 = sin(angle * 2.0 + dist * 12.0 + 3.14 - uTime) * 0.5 + 0.5;
                float totalSpiral = mix(spiral, spiral2, 0.5);
                
                alpha *= (0.4 + 0.6 * totalSpiral);
                alpha = pow(alpha, 2.0);
                
                vec3 coreColor = vec3(0.5, 0.4, 0.8); // Purple-ish
                vec3 rimColor = vec3(0.2, 0.3, 0.6); // Blue-ish
                vec3 color = mix(coreColor, rimColor, dist * 2.0);
                
                gl_FragColor = vec4(color, alpha * 0.12);
            }
        `}
    />
  );
};

export function GalaxyVisualEffects({ galaxy, quality = "high" }: { galaxy: Galaxy; quality?: "low" | "medium" | "high" }) {
  const groupRef = useRef<THREE.Group>(null);
  const dustParticlesRef = useRef<THREE.Points>(null);

  const maxDist = useMemo(() => {
    const systems = galaxy.systems;
    let max = 0;
    systems.forEach(s => {
      const d = Math.sqrt(s.pos[0]**2 + s.pos[2]**2);
      if (d > max) max = d;
    });
    return max || 1000;
  }, [galaxy.systems]);

  const dustParticlesData = useMemo(() => {
    const count = quality === "low" ? 500 : quality === "medium" ? 2000 : 5000;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.pow(Math.random(), 0.8) * maxDist * 1.5;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = (Math.random() - 0.5) * (maxDist * 0.1);
        positions[i * 3 + 2] = Math.sin(angle) * radius;
        sizes[i] = 1.0 + Math.random() * 3.0;
    }
    return { positions, sizes };
  }, [maxDist, quality]);

  // Generate localized procedural filler
  const clouds = useMemo(() => {
    const items = [];

    // 1. Add functional regions from galaxy data for background visibility
          if (galaxy.regions) {
      galaxy.regions.forEach((r, idx) => {
        items.push({
          id: r.id,
          pos: r.pos,
          size: r.radius * 1.6,
          type: r.type,
          hue: r.hue,
          rotation: [0, (r.id.length * 0.1) % (Math.PI * 2), 0] as [number, number, number],
          scale: [1.3 + (r.intensity * 0.4), 1, 1] as [number, number, number],
          isFunctional: true,
          seed: getRegionSeed(r.id)
        });
      });
    }

    // 2. Add some procedural filler for richness (Ice clouds and particles - colorless)
    const fillerCount = quality === "low" ? 20 : quality === "medium" ? 60 : 120;
    for (let i = 0; i < fillerCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.pow(Math.random(), 0.7) * maxDist * 1.5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = (Math.random() - 0.5) * (maxDist * 0.2); 

        const size = 100 + Math.random() * 300;
        const roll = Math.random();
        
        // Non-functional regions are just ice clouds or particle clusters
        const type = roll > 0.6 ? "ice_cloud" : "particles";
        
        // Force white/colorless for filler
        const hue = 0; 
        
        items.push({
            id: `filler-${i}`,
            pos: [x, y, z] as [number, number, number],
            size,
            type,
            hue,
            rotation: [0, Math.random() * Math.PI * 2, 0] as [number, number, number],
            scale: [1.5 + Math.random() * 1.5, 1, 1] as [number, number, number],
            isFunctional: false
        });
    }
    return items;
  }, [galaxy.regions, quality, maxDist]);

  const coreHue = 45; // Golden core

  return (
    <group ref={groupRef}>
      {/* 1. Galactic Core Glow */}
      <Billboard position={[0, 0, 0]}>
        <mesh scale={1000}>
            <planeGeometry />
            <shaderMaterial 
                transparent 
                depthWrite={false} 
                blending={THREE.AdditiveBlending}
                uniforms={{
                    uColor: { value: new THREE.Color().setHSL(coreHue / 360, 0.6, 0.7) }
                }}
                vertexShader={`
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `}
                fragmentShader={`
                    varying vec2 vUv;
                    uniform vec3 uColor;
                    void main() {
                        float dist = length(vUv - 0.5) * 2.0;
                        float alpha = smoothstep(1.0, 0.0, dist);
                        alpha = pow(alpha, 2.5); 
                        gl_FragColor = vec4(uColor, alpha * 0.6);
                    }
                `}
            />
        </mesh>
      </Billboard>

      {/* 1.1 Galactic Disc (Large scale texture) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]}>
        <planeGeometry args={[maxDist * 3, maxDist * 3]} />
        <GalacticDiscMaterial maxDist={maxDist} />
      </mesh>

      {/* 2. Clustered Cloud Objects */}
      {clouds.map(c => (
        <group key={c.id} position={c.pos} rotation={c.rotation}>
            {c.isFunctional ? (
                // Functional Regions - Colored and Specific Materials
                c.type === "ion_storm" ? (
                    <Billboard>
                        <mesh scale={c.size}>
                            <planeGeometry />
                            <IonStormMaterial hue={c.hue} opacity={0.85} seed={c.seed} />
                        </mesh>
                    </Billboard>
                ) : c.type === "gravity_rift" ? (
                    <Billboard>
                        <mesh scale={c.size}>
                            <planeGeometry />
                            <GravityRiftMaterial hue={c.hue} opacity={0.75} />
                        </mesh>
                    </Billboard>
                ) : (
                    <Billboard>
                        <mesh scale={c.size}>
                            <planeGeometry />
                            <NebulaMaterial 
                                hue={c.hue} 
                                opacity={c.type === "dust_cloud" ? 0.6 : 0.75} 
                            />
                        </mesh>
                    </Billboard>
                )
            ) : (
                // Non-functional Filler - White/Colorless
                c.type === "ice_cloud" ? (
                    <Billboard>
                        <mesh scale={c.size}>
                            <planeGeometry />
                            <NebulaMaterial hue={0} saturation={0} opacity={0.04} />
                        </mesh>
                    </Billboard>
                ) : (
                    <mesh scale={[c.size * 2, c.size * 0.4, 1]} rotation={[Math.PI / 2, 0, 0]}>
                        <planeGeometry />
                        <FilamentMaterial hue={0} saturation={0} opacity={0.04} />
                    </mesh>
                )
            )}
        </group>
      ))}

      {/* 2.1 Large scale Interstellar Filaments (Highways) */}
      <group>
        {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const x = Math.cos(angle) * maxDist * 0.8;
            const z = Math.sin(angle) * maxDist * 0.8;
            return (
                <group key={i} position={[x, 0, z]} rotation={[0, -angle + Math.PI / 2, 0]}>
                    <mesh scale={[maxDist * 1.5, 400, 1]}>
                        <planeGeometry />
                        <FilamentMaterial hue={220} opacity={0.1} />
                    </mesh>
                </group>
            );
        })}
      </group>

      {/* 3. Localized Dust Specks */}
      <points ref={dustParticlesRef}>
        <bufferGeometry>
            <bufferAttribute 
                attach="attributes-position"
                count={dustParticlesData.positions.length / 3}
                array={dustParticlesData.positions}
                itemSize={3}
            />
            <bufferAttribute 
                attach="attributes-size"
                count={dustParticlesData.sizes.length}
                array={dustParticlesData.sizes}
                itemSize={1}
            />
        </bufferGeometry>
        <shaderMaterial 
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            uniforms={{
                uColor: { value: new THREE.Color("#6a6a9e") }
            }}
            vertexShader={`
                attribute float size;
                varying float vAlpha;
                void main() {
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (400.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                    vAlpha = smoothstep(3000.0, 400.0, -mvPosition.z);
                }
            `}
            fragmentShader={`
                varying float vAlpha;
                uniform vec3 uColor;
                void main() {
                    float dist = length(gl_PointCoord - 0.5);
                    if (dist > 0.5) discard;
                    float alpha = smoothstep(0.5, 0.1, dist) * vAlpha;
                    gl_FragColor = vec4(uColor, alpha * 0.25);
                }
            `}
        />
      </points>
      
      {/* 4. Volumetric Dust Sheets (for parallax depth) */}
      <group position={[0, -20, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[maxDist * 1.8, 32]} />
          <meshBasicMaterial 
              color="#0d0d26" 
              transparent 
              opacity={0.12} 
              side={THREE.DoubleSide} 
              depthWrite={false}
          />
        </mesh>
      </group>
      <group position={[0, -80, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[maxDist * 2.5, 32]} />
          <meshBasicMaterial 
              color="#08081a" 
              transparent 
              opacity={0.09} 
              side={THREE.DoubleSide} 
              depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}
