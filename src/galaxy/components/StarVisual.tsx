// Shared 3D star renderer — produces realistic visuals per star type:
// supergiants/main-sequence: bright sphere + glow sprite
// neutron / pulsar: small sphere with twin polar jets + halo
// black hole: dark sphere with bright accretion ring + lensing halo
// binary: two offset stars
// white dwarf: tiny intense sphere

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import * as THREE from "three";
import type { StarType } from "@/galaxy/types";
import { STAR_META } from "@/galaxy/meta";

interface Props {
  type: StarType;
  /** Base scale multiplier. */
  scale?: number;
  /** Whether this star is in the foreground (system view) — adds extra detail. */
  detailed?: boolean;
  grayscale?: boolean;
  quality?: "low" | "medium" | "high";
  onClick?: (e: any) => void;
  onPointerOver?: (e: any) => void;
  onPointerOut?: (e: any) => void;
}

export function StarVisual({ type, scale = 1, detailed = false, grayscale = false, quality = "high", onClick, onPointerOver, onPointerOut }: Props) {
  const color = useMemo(() => {
    const base = new THREE.Color(`#${STAR_META[type].hex}`);
    if (grayscale) {
      const g = (base.r + base.g + base.b) / 3 * 0.75; // Brighter grey for visibility
      return new THREE.Color(g, g, g);
    }
    return base;
  }, [type, grayscale]);

  const content = useMemo(() => {
    switch (type) {
      case "blackhole":
        return <BlackHole scale={scale} detailed={detailed} quality={quality} />;
      case "whitehole":
        return <WhiteHole scale={scale} detailed={detailed} quality={quality} />;
      case "quasar":
        return <Quasar scale={scale} detailed={detailed} quality={quality} />;
      case "magnetar":
        return <Magnetar scale={scale} color={color} detailed={detailed} quality={quality} />;
      case "protostar":
        return <Protostar scale={scale} detailed={detailed} quality={quality} />;
      case "dyson_swarm":
        return <DysonSwarm scale={scale} detailed={detailed} quality={quality} />;
      case "neutron":
      case "pulsar":
        return <NeutronStar scale={scale} color={color} pulsar={type === "pulsar"} detailed={detailed} quality={quality} />;
      case "binary":
        return <BinaryStar scale={scale} detailed={detailed} quality={quality} />;
      case "whitedwarf":
        return <Sun scale={scale * 0.45} color={color} detailed={detailed} quality={quality} />;
      default:
        return <Sun scale={scale} color={color} detailed={detailed} quality={quality} />;
    }
  }, [type, scale, detailed, color]);

  return (
    <group 
      onClick={onClick} 
      onPointerOver={onPointerOver} 
      onPointerOut={onPointerOut}
    >
      {content}
    </group>
  );
}

/* ---------- Sun (main sequence + giants) ---------- */
function Sun({ scale, color, detailed, quality }: { scale: number; color: THREE.Color; detailed: boolean; quality: "low" | "medium" | "high" }) {
  const ref = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  const uniforms = useMemo(() => ({
    uColor: { value: color },
    uTime: { value: 0 },
    uDetailed: { value: detailed ? 1.0 : 0.0 },
    uQuality: { value: quality === "low" ? 0.0 : quality === "medium" ? 1.0 : 2.0 }
  }), [color, detailed, quality]);

  useFrame((state, dt) => {
    if (ref.current) {
      ref.current.rotation.y += dt * 0.1;
      if (ref.current.material instanceof THREE.ShaderMaterial) {
        ref.current.material.uniforms.uTime.value = state.clock.elapsedTime;
      }
    }
    if (glowRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
      glowRef.current.scale.set(s, s, s);
    }
  });

  const segments = quality === "low" ? 16 : quality === "medium" ? 32 : (detailed ? 128 : 64);

  return (
    <group>
      {/* Core with solar turbulence */}
      <mesh ref={ref}>
        <sphereGeometry args={[scale, segments, segments]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={`
            varying vec2 vUv;
            varying vec3 vPosition;
            void main() {
              vUv = uv;
              vPosition = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec2 vUv;
            varying vec3 vPosition;
            uniform vec3 uColor;
            uniform float uTime;
            uniform float uQuality;

            // Simplex 3D Noise
            vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
            vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
            float snoise(vec3 v){ 
              const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
              const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
              vec3 i  = floor(v + dot(v, C.yyy) );
              vec3 x0 =   v - i + dot(i, C.xxx) ;
              vec3 g = step(x0.yzx, x0.xyz);
              vec3 l = 1.0 - g;
              vec3 i1 = min( g.xyz, l.zxy );
              vec3 i2 = max( g.xyz, l.zxy );
              vec3 x1 = x0 - i1 + 1.0 * C.xxx;
              vec3 x2 = x0 - i2 + 2.0 * C.xxx;
              vec3 x3 = x0 - D.yyy;
              i = mod(i, 289.0 ); 
              vec4 p = permute( permute( permute( 
                         i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                       + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                       + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
              float n_ = 1.0/7.0;
              vec3  ns = n_ * D.wyz - D.xzx;
              vec4 j = p - 49.0 * floor(p * (1.0 / 49.0)); // Fixed noise typo
              vec4 x_ = floor(j * ns.z);
              vec4 y_ = floor(j - 7.0 * x_ );
              vec4 x = x_ *ns.x + ns.yyyy;
              vec4 y = y_ *ns.x + ns.yyyy;
              vec4 h = 1.0 - abs(x) - abs(y);
              vec4 b0 = vec4( x.xy, y.xy );
              vec4 b1 = vec4( x.zw, y.zw );
              vec4 s0 = floor(b0)*2.0 + 1.0;
              vec4 s1 = floor(b1)*2.0 + 1.0;
              vec4 sh = -step(h, vec4(0.0));
              vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
              vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
              vec3 p0 = vec3(a0.xy,h.x);
              vec3 p1 = vec3(a0.zw,h.y);
              vec3 p2 = vec3(a1.xy,h.z);
              vec3 p3 = vec3(a1.zw,h.w);
              vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
              p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
              vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
              m = m * m;
              return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
            }

            float fbm(vec3 p) {
              float v = 0.0;
              float a = 0.5;
              int octaves = uQuality < 0.5 ? 2 : (uQuality < 1.5 ? 3 : 5);
              for (int i = 0; i < 5; i++) {
                if (i >= octaves) break;
                v += a * snoise(p);
                p *= 2.1;
                a *= 0.5;
              }
              return v;
            }

            void main() {
              // Domain Warping: distort coordinates with a first noise layer for a fluid "swirling" look
              float t = uTime * 0.15;
              vec3 p = vPosition * 2.2;
              
              // Distortion layer
              vec3 q = vec3(
                fbm(p + vec3(0.0, t * 0.5, 0.0)),
                fbm(p + vec3(5.2, 1.3, t * 0.2)),
                fbm(p + vec3(t * 0.3, 2.8, 1.1))
              );
              
              // Main noise layer using distorted coordinates
              float n = fbm(p + q * 1.5 + vec3(0.0, t, 0.0));
              float intensity = n * 0.5 + 0.5; // Map to 0..1
              
              // High-frequency detail layer
              if (uQuality > 0.5) {
                float n2 = fbm(p * 2.5 - q * 0.8 + vec3(t, -t, 0.0));
                intensity = mix(intensity, n2 * 0.5 + 0.5, 0.3);
              }
              
              // Surface intensity curve - high contrast for that "active" solar look
              intensity = pow(intensity * 1.25, 2.5); 
              
              // Base solar color with brightness variation
              vec3 finalColor = uColor * mix(0.6, 2.4, intensity);
              
              // Hot Spots (Active Regions)
              float hot = smoothstep(0.65, 0.95, intensity);
              finalColor += vec3(1.0, 0.85, 0.5) * hot * 4.0;
              
              // Sunspots (Cool Regions)
              // Instead of grey, mix in a dark amber/red for more realistic cool spots
              float spotMask = smoothstep(0.25, 0.05, intensity);
              vec3 spotColor = vec3(0.2, 0.05, 0.02); // Dark amber/brown
              finalColor = mix(finalColor, spotColor * 0.8, spotMask);
              
              // Rim darkening (Fresnel)
              float rim = 1.0 - max(0.0, dot(normalize(vPosition), vec3(0,0,1)));
              finalColor *= mix(1.0, 0.45, pow(rim, 1.8));

              gl_FragColor = vec4(finalColor * 3.8, 1.0);
            }
          `}

        />
      </mesh>
      
      {detailed && <pointLight color={color} intensity={25.0} distance={200} decay={1.5} />}
      
      {/* Massive Volumetric Aura - Skip for far stars on low */}
      {(detailed || quality !== "low") && <StarAura scale={scale * (detailed ? 3.5 : 1.2)} color={color} />}
      
      {/* Multi-Layered Camera-Facing Flare - Skip for far stars on low */}
      {(detailed || quality !== "low") && (
        <StarFlare scale={scale * (detailed ? 25.0 : 8.0)} color={color} opacity={detailed ? 0.7 : 0.5} />
      )}
      {detailed && quality !== "low" && <StarFlare scale={scale * 6.0} color={new THREE.Color("#ffffff")} opacity={0.4} />}
    </group>
  );
}

/* ---------- UI Components for Lighting ---------- */

function StarAura({ scale, color }: { scale: number; color: THREE.Color }) {
  const uniforms = useMemo(() => ({
    uColor: { value: color },
  }), [color]);

  return (
    <mesh raycast={() => null}>
      <sphereGeometry args={[scale * 1.4, 32, 32]} />
      <shaderMaterial
        side={THREE.BackSide}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          uniform vec3 uColor;
          void main() {
            float intensity = pow(0.1 + max(0.0, dot(vNormal, normalize(vViewPosition))), 2.0);
            gl_FragColor = vec4(uColor, intensity * 0.9);
          }
        `}
      />
    </mesh>
  );
}

function StarFlare({ scale, color, opacity = 0.5 }: { scale: number; color: THREE.Color; opacity?: number }) {
  const uniforms = useMemo(() => ({
    uColor: { value: color },
    uOpacity: { value: opacity },
  }), [color, opacity]);

  return (
    <Billboard>
      <mesh raycast={() => null}>
        <planeGeometry args={[scale, scale]} />
        <shaderMaterial
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
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
            uniform vec3 uColor;
            uniform float uOpacity;

            void main() {
              vec2 uv = vUv - 0.5;
              float d = length(uv);
              
              // 1. Core Glow
              float core = pow(clamp(1.0 - d * 3.5, 0.0, 1.0), 3.0);
              
              // 2. Diffraction Spikes (8-pointed star)
              float angle = atan(uv.y, uv.x);
              float spikes = pow(max(0.0, cos(angle * 8.0)), 30.0) * pow(clamp(1.0 - d * 2.0, 0.0, 1.0), 4.0);
              float spikes2 = pow(max(0.0, cos(angle * 4.0 + 0.8)), 40.0) * pow(clamp(1.0 - d * 2.5, 0.0, 1.0), 3.0);
              
              // 3. Soft Halo
              float halo = pow(clamp(1.0 - d * 2.0, 0.0, 1.0), 8.0) * 0.5;
              
              float finalIntensity = (core * 1.5 + spikes * 0.8 + spikes2 * 0.4 + halo) * uOpacity;
              gl_FragColor = vec4(uColor, finalIntensity);
            }
          `}
        />
      </mesh>
    </Billboard>
  );
}

/* ---------- Neutron / Pulsar ---------- */
function NeutronStar({ scale, color, pulsar, detailed, quality }: { scale: number; color: THREE.Color; pulsar: boolean; detailed: boolean; quality: "low" | "medium" | "high" }) {
  const beam = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, dt) => {
    const t = state.clock.getElapsedTime();
    if (beam.current) {
      // Polar precession + rotation
      beam.current.rotation.y += dt * (pulsar ? 4.0 : 1.2);
      beam.current.rotation.z = Math.sin(t * (pulsar ? 2.5 : 0.8)) * 0.2;
      beam.current.rotation.x = Math.cos(t * (pulsar ? 2.5 : 0.8)) * 0.2;
    }
    if (coreRef.current) {
      coreRef.current.rotation.y += dt * (pulsar ? 8.0 : 2.0);
    }
  });

  const jetLen = scale * (detailed ? 15 : 6);
  const jetRad = scale * 0.35;
  const segments = quality === "low" ? 16 : 32;

  return (
    <group>
      <mesh ref={coreRef}>
        <sphereGeometry args={[scale * 0.5, segments, segments]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      
      {/* Realistic Volumetric Aura - Skip for far stars on low */}
      {(detailed || quality !== "low") && <StarAura scale={scale * (detailed ? 0.8 : 0.4)} color={color} />}
      
      {/* Soft Camera-Facing Flare - Skip for far stars on low */}
      {(detailed || quality !== "low") && (
        <StarFlare scale={scale * (detailed ? 4.0 : 2.5)} color={color} opacity={detailed ? 0.4 : 0.3} />
      )}

      {detailed && <pointLight color={color} intensity={6} distance={80} />}

      {/* Precessing Polar Jets */}
      <group ref={beam}>
        {/* Top Jet */}
        <mesh position={[0, jetLen / 2 + scale * 0.4, 0]}>
          <cylinderGeometry args={[jetRad * 0.15, jetRad * 0.15, jetLen, quality === "low" ? 8 : 16, 4, true]} />
          <meshBasicMaterial color={color} transparent opacity={0.7} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </mesh>
        {/* Bottom Jet */}
        <mesh position={[0, -jetLen / 2 - scale * 0.4, 0]} rotation={[Math.PI, 0, 0]}>
          <cylinderGeometry args={[jetRad * 0.15, jetRad * 0.15, jetLen, quality === "low" ? 8 : 16, 4, true]} />
          <meshBasicMaterial color={color} transparent opacity={0.7} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </mesh>
        
        {/* Jet base flares */}
        <mesh position={[0, scale * 0.5, 0]}>
          <sphereGeometry args={[scale * 0.6, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh position={[0, -scale * 0.5, 0]}>
          <sphereGeometry args={[scale * 0.6, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>

      {/* Atmospheric Halo */}
      <mesh scale={2.5}>
        <sphereGeometry args={[scale * 0.5, segments, segments]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} blending={THREE.AdditiveBlending} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

/* ---------- Binary ---------- */
function BinaryStar({ scale, detailed, quality }: { scale: number; detailed: boolean; quality: "low" | "medium" | "high" }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.8;
  });
  const a = useMemo(() => new THREE.Color("#ffd24a"), []);
  const b = useMemo(() => new THREE.Color("#ff7a3d"), []);
  return (
    <group ref={ref}>
      <group position={[scale * 1.1, 0, 0]}>
        <Sun scale={scale * 0.7} color={a} detailed={detailed} quality={quality} />
      </group>
      <group position={[-scale * 1.1, 0, 0]}>
        <Sun scale={scale * 0.55} color={b} detailed={detailed} quality={quality} />
      </group>
    </group>
  );
}

/* ---------- White Hole ---------- */
function WhiteHole({ scale, detailed, quality }: { scale: number; detailed: boolean; quality: "low" | "medium" | "high" }) {
  const diskRef = useRef<THREE.Mesh>(null);
  const diskRef2 = useRef<THREE.Mesh>(null);
  const photonRef = useRef<THREE.Mesh>(null);
  const jetsRef = useRef<THREE.Group>(null);
  
  const innerColor = useMemo(() => new THREE.Color("#ffffff"), []);
  const midColor = useMemo(() => new THREE.Color("#88eeff"), []);
  const outerColor = useMemo(() => new THREE.Color("#0044ff"), []);

  const diskUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uInnerColor: { value: innerColor },
    uMidColor: { value: midColor },
    uOuterColor: { value: outerColor },
    uInnerR: { value: scale * 1.1 },
    uOuterR: { value: scale * 5.5 },
    uQuality: { value: quality === "low" ? 0.0 : quality === "medium" ? 1.0 : 2.0 }
  }), [scale, innerColor, midColor, outerColor, quality]);

  useFrame((state, dt) => {
    const t = state.clock.getElapsedTime();
    diskUniforms.uTime.value = t;
    
    if (photonRef.current) {
      photonRef.current.rotation.z -= dt * 0.3; // Reverse photon sphere
    }
    if (jetsRef.current) {
      jetsRef.current.rotation.y -= dt * 1.5;
    }
  });

  const diskShader = useMemo(() => ({
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vPos;
      uniform float uTime;
      uniform vec3 uInnerColor;
      uniform vec3 uMidColor;
      uniform vec3 uOuterColor;
      uniform float uInnerR;
      uniform float uOuterR;

      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
      }

      void main() {
        float r = length(vPos.xy);
        float angle = atan(vPos.y, vPos.x);

        // Fade at edges
        float edgeFade = smoothstep(uInnerR, uInnerR * 1.4, r) * (1.0 - smoothstep(uOuterR * 0.75, uOuterR, r));
        if (edgeFade < 0.001) discard;

        // Temperature gradient: intense white inner -> cyan mid -> deep blue outer
        float t = (r - uInnerR) / (uOuterR - uInnerR);
        vec3 baseColor = mix(uInnerColor, mix(uMidColor, uOuterColor, smoothstep(0.3, 0.8, t)), smoothstep(0.0, 0.3, t));

        // Relativistic Doppler beaming: approaching side is brighter (reverse direction for white hole)
        float doppler = 1.0 + 0.65 * cos(angle - uTime * 0.5 * (1.0 / (r * 0.3)));
        doppler = clamp(doppler, 0.3, 2.5);

        // Swirling turbulent bands (OUTWARD flow: + uTime)
        float swirl = angle * 3.0 + uTime * 4.0 / max(r * 0.4, 0.1);
        float n1 = noise(vec2(r * 0.6 - uTime * 0.5, swirl));
        float n2 = noise(vec2(r * 2.5 - uTime, swirl * 2.0));
        float turbulence = mix(0.6, 1.4, n1 * 0.7 + n2 * 0.3);

        // Bright filament streaks ejecting outwards
        float streak = pow(max(0.0, sin(swirl * 8.0 - r * 4.0)), 6.0) * 0.5;

        vec3 col = baseColor * turbulence * doppler + vec3(0.5, 0.8, 1.0) * streak;

        // Inner rim glow (white-hot photon sphere edge)
        float innerGlow = smoothstep(uInnerR * 1.5, uInnerR * 1.0, r) * 3.0;
        col += uInnerColor * innerGlow;

        gl_FragColor = vec4(col, edgeFade * 0.95);
      }
    `
  }), []);

  return (
    <group>
      {/* Reverse Singularity (Intense White Core) */}
      <mesh>
        <sphereGeometry args={[scale * 0.8, quality === "low" ? 24 : 48, quality === "low" ? 24 : 48]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>

      {/* Photon Sphere */}
      <mesh ref={photonRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[scale * 0.82, scale * 1.08, quality === "low" ? 64 : 128]} />
        <shaderMaterial
          transparent depthWrite={false} blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          uniforms={{
            uColor: { value: new THREE.Color("#00e5ff") },
            uTime: { value: 0 }
          }}
          vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`}
          fragmentShader={`
            varying vec2 vUv; uniform vec3 uColor;
            void main() {
              float d = abs(distance(vUv, vec2(0.5)) - 0.485) / 0.03;
              float a = pow(1.0 - clamp(d, 0.0, 1.0), 3.0);
              gl_FragColor = vec4(uColor, a * 0.9);
            }
          `}
        />
      </mesh>

      {/* Main Ejection Disk (tilted for drama) */}
      <mesh ref={diskRef} rotation={[Math.PI / 2.3, 0.2, 0]}>
        <ringGeometry args={[scale * 1.1, scale * 5.5, quality === "low" ? 64 : 256]} />
        <shaderMaterial
          transparent side={THREE.DoubleSide} depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={diskUniforms}
          vertexShader={diskShader.vertexShader}
          fragmentShader={diskShader.fragmentShader}
        />
      </mesh>

      {/* Secondary thinner disk plane (orthogonal tilt for volume) */}
      <mesh ref={diskRef2} rotation={[Math.PI / 2.8, 1.8, 0]}>
        <ringGeometry args={[scale * 1.15, scale * 3.5, 128]} />
        <shaderMaterial
          transparent side={THREE.DoubleSide} depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={diskUniforms}
          vertexShader={diskShader.vertexShader}
          fragmentShader={diskShader.fragmentShader}
        />
      </mesh>

      {/* High-Energy Ejection Beams (expanding outwards) */}
      <group ref={jetsRef}>
        <mesh position={[0, scale * 8, 0]}>
          <cylinderGeometry args={[scale * 0.4, scale * 0.05, scale * 16, 16, 1, true]} />
          <meshBasicMaterial color="#a0e8ff" transparent opacity={0.4} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -scale * 8, 0]} rotation={[Math.PI, 0, 0]}>
          <cylinderGeometry args={[scale * 0.4, scale * 0.05, scale * 16, 16, 1, true]} />
          <meshBasicMaterial color="#a0e8ff" transparent opacity={0.4} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {detailed && <pointLight color="#88eeff" intensity={20} distance={200} decay={1.5} />}
      {/* Realistic Volumetric Aura - Skip for far stars on low */}
      {(detailed || quality !== "low") && <StarAura scale={scale * (detailed ? 1.5 : 0.6)} color={new THREE.Color("#ffffff")} />}
      
      {/* Soft Camera-Facing Flare - Skip for far stars on low */}
      {(detailed || quality !== "low") && (
        <StarFlare scale={scale * (detailed ? 6.0 : 3.5)} color={new THREE.Color("#ffffff")} opacity={detailed ? 0.5 : 0.3} />
      )}
      {detailed && <pointLight color="#ffffff" intensity={6} distance={50} decay={2} />}
    </group>
  );
}

/* ---------- Black Hole ---------- */
function BlackHole({ scale, detailed, quality }: { scale: number; detailed: boolean; quality: "low" | "medium" | "high" }) {
  const diskRef = useRef<THREE.Mesh>(null);
  const photonRef = useRef<THREE.Mesh>(null);
  const diskRef2 = useRef<THREE.Mesh>(null);
  
  const innerColor = useMemo(() => new THREE.Color("#ffffff"), []);
  const accretionColor = useMemo(() => new THREE.Color("#ff6820"), []);
  const outerColor = useMemo(() => new THREE.Color("#ff3300"), []);

  const diskUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uInnerColor: { value: innerColor },
    uMidColor: { value: accretionColor },
    uOuterColor: { value: outerColor },
    uInnerR: { value: scale * 1.1 },
    uOuterR: { value: scale * 5.5 },
    uQuality: { value: quality === "low" ? 0.0 : quality === "medium" ? 1.0 : 2.0 }
  }), [scale, innerColor, accretionColor, outerColor, quality]);

  useFrame((state, dt) => {
    const t = state.clock.getElapsedTime();
    diskUniforms.uTime.value = t;
    
    if (photonRef.current) {
      photonRef.current.rotation.z += dt * 0.3;
    }
  });

  const diskShader = useMemo(() => ({
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vPos;
      uniform float uTime;
      uniform vec3 uInnerColor;
      uniform vec3 uMidColor;
      uniform vec3 uOuterColor;
      uniform float uInnerR;
      uniform float uOuterR;

      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
      }

      void main() {
        float r = length(vPos.xy);
        float angle = atan(vPos.y, vPos.x);

        // Fade at edges
        float edgeFade = smoothstep(uInnerR, uInnerR * 1.4, r) * (1.0 - smoothstep(uOuterR * 0.75, uOuterR, r));
        if (edgeFade < 0.001) discard;

        // Temperature gradient: white-hot inner -> orange mid -> deep red outer
        float t = (r - uInnerR) / (uOuterR - uInnerR);
        vec3 baseColor = mix(uInnerColor, mix(uMidColor, uOuterColor, smoothstep(0.3, 0.8, t)), smoothstep(0.0, 0.3, t));

        // Relativistic Doppler beaming: approaching side (left) is brighter
        float doppler = 1.0 + 0.65 * cos(angle + uTime * 0.5 * (1.0 / (r * 0.3)));
        doppler = clamp(doppler, 0.3, 2.5);

        // Swirling turbulent bands
        float swirl = angle * 3.0 - uTime * 3.0 / max(r * 0.4, 0.1);
        float n1 = noise(vec2(r * 0.6, swirl));
        float n2 = noise(vec2(r * 2.5, swirl * 2.0 + uTime * 0.4));
        float turbulence = mix(0.6, 1.4, n1 * 0.7 + n2 * 0.3);

        // Bright filament streaks
        float streak = pow(max(0.0, sin(swirl * 8.0 + r * 2.0)), 6.0) * 0.5;

        vec3 col = baseColor * turbulence * doppler + vec3(1.0, 0.6, 0.3) * streak;

        // Inner rim glow (white-hot photon sphere edge)
        float innerGlow = smoothstep(uInnerR * 1.5, uInnerR * 1.0, r) * 3.0;
        col += uInnerColor * innerGlow;

        gl_FragColor = vec4(col, edgeFade * 0.92);
      }
    `
  }), []);

  return (
    <group>
      {/* Singularity (Event Horizon Shadow) */}
      <mesh>
        <sphereGeometry args={[scale * 0.8, quality === "low" ? 24 : 48, quality === "low" ? 24 : 48]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Photon Sphere (blueish gravitational lensing ring) */}
      <mesh ref={photonRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[scale * 0.82, scale * 1.08, quality === "low" ? 64 : 128]} />
        <shaderMaterial
          transparent depthWrite={false} blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          uniforms={{
            uColor: { value: new THREE.Color("#a0e8ff") },
            uTime: { value: 0 }
          }}
          vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`}
          fragmentShader={`
            varying vec2 vUv; uniform vec3 uColor;
            void main() {
              float d = abs(distance(vUv, vec2(0.5)) - 0.485) / 0.03;
              float a = pow(1.0 - clamp(d, 0.0, 1.0), 3.0);
              gl_FragColor = vec4(uColor, a * 0.9);
            }
          `}
        />
      </mesh>

      {/* Main Accretion Disk (tilted for drama) */}
      <mesh ref={diskRef} rotation={[Math.PI / 2.3, 0.2, 0]}>
        <ringGeometry args={[scale * 1.1, scale * 5.5, quality === "low" ? 64 : 256]} />
        <shaderMaterial
          transparent side={THREE.DoubleSide} depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={diskUniforms}
          vertexShader={diskShader.vertexShader}
          fragmentShader={diskShader.fragmentShader}
        />
      </mesh>

      {/* Secondary thinner disk plane (orthogonal tilt for volume) */}
      <mesh ref={diskRef2} rotation={[Math.PI / 2.8, 1.8, 0]}>
        <ringGeometry args={[scale * 1.15, scale * 3.5, 128]} />
        <shaderMaterial
          transparent side={THREE.DoubleSide} depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={diskUniforms}
          vertexShader={diskShader.vertexShader}
          fragmentShader={diskShader.fragmentShader}
        />
      </mesh>

      {/* Subtle Lensing Aura - Skip for far stars on low */}
      {(detailed || quality !== "low") && <StarAura scale={scale * (detailed ? 1.1 : 0.5)} color={new THREE.Color("#4488ff")} />}
      
      {/* Faint Distant Flare - Skip for far stars on low */}
      {(detailed || quality !== "low") && <StarFlare scale={scale * (detailed ? 8.0 : 4.5)} color={new THREE.Color("#3366ff")} opacity={detailed ? 0.15 : 0.1} />}

      {detailed && <pointLight color={accretionColor} intensity={14} distance={180} decay={1.5} />}
      {detailed && <pointLight color="#ffffff" intensity={4} distance={40} decay={2} />}
    </group>
  );
}


/* ---------- Quasar (Supermassive active black hole) ---------- */
function Quasar({ scale, detailed, quality }: { scale: number; detailed: boolean; quality: "low" | "medium" | "high" }) {
  const jetColor = useMemo(() => new THREE.Color("#ffffff"), []);
  const jetRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (jetRef.current) jetRef.current.rotation.y = state.clock.elapsedTime * 2.0;
  });
  return (
    <group>
      <BlackHole scale={scale * 1.5} detailed={detailed} quality={quality} />
      <group ref={jetRef}>
        <mesh position={[0, scale * 40, 0]}>
          <cylinderGeometry args={[scale * 0.12, scale * 0.12, scale * 80, quality === "low" ? 8 : 16, 1, true]} />
          <meshBasicMaterial color={jetColor} transparent opacity={0.5} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -scale * 40, 0]} rotation={[Math.PI, 0, 0]}>
          <cylinderGeometry args={[scale * 0.12, scale * 0.12, scale * 80, quality === "low" ? 8 : 16, 1, true]} />
          <meshBasicMaterial color={jetColor} transparent opacity={0.5} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {detailed && <pointLight color="white" intensity={20} distance={300} />}
    </group>
  );
}

/* ---------- Magnetar (Neutron star with extreme fields) ---------- */
function Magnetar({ scale, color, detailed, quality }: { scale: number; color: THREE.Color; detailed: boolean; quality: "low" | "medium" | "high" }) {
  const pulseRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (pulseRef.current) {
      const s = 1.0 + Math.pow(Math.sin(state.clock.elapsedTime * 6.0), 2.0) * 0.5;
      pulseRef.current.scale.setScalar(s);
    }
  });
  return (
    <group>
      <NeutronStar scale={scale} color={color} pulsar={false} detailed={detailed} quality={quality} />
      
      {/* Extreme Magnetic Shimmer */}
      <mesh ref={pulseRef}>
        <sphereGeometry args={[scale * 1.8, 32, 32]} />
        <shaderMaterial
          transparent
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          uniforms={{ uColor: { value: color } }}
          vertexShader={`
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec3 vNormal;
            uniform vec3 uColor;
            void main() {
              float intensity = pow(0.1 + vNormal.z, 2.0);
              gl_FragColor = vec4(uColor, intensity * 0.2);
            }
          `}
        />
      </mesh>
    </group>
  );
}

/* ---------- Protostar (Star in formation) ---------- */
function Protostar({ scale, detailed, quality }: { scale: number; detailed: boolean; quality: "low" | "medium" | "high" }) {
  const dustRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (dustRef.current) dustRef.current.rotation.y += 0.01;
  });
  return (
    <group>
      <Sun scale={scale * 0.8} color={new THREE.Color("#ff4400")} detailed={detailed} quality={quality} />
      <mesh ref={dustRef} rotation={[Math.PI / 2.5, 0, 0]}>
        <sphereGeometry args={[scale * 2.5, quality === "low" ? 16 : 32, quality === "low" ? 16 : 32]} />
        <meshStandardMaterial color="#331100" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      {detailed && <pointLight color="#ff4400" intensity={3} distance={60} />}
    </group>
  );
}

/* ---------- Dyson Swarm (Artificial megastructure) ---------- */
function DysonSwarm({ scale, detailed, quality }: { scale: number; detailed: boolean; quality: "low" | "medium" | "high" }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) {
      // Swarm rotates slowly
      groupRef.current.rotation.y += 0.005;
      groupRef.current.rotation.z += 0.002;
    }
  });
  
  const panels = useMemo(() => {
    const count = quality === "low" ? 50 : (quality === "medium" ? 120 : 250);
    const p = [];
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      const radius = scale * (1.2 + Math.sin(i * 123.45) * 0.15); // tighter, more dense swarm
      const pos = new THREE.Vector3().setFromSphericalCoords(radius, phi, theta);
      
      // Make the panel's +Z face (front) point inwards towards the star (origin)
      const center = new THREE.Vector3(0, 0, 0);
      // lookAt(eye, target, up) aligns -Z to (target - eye).
      // By setting eye=center and target=pos, -Z points outward, meaning +Z points INWARD.
      const m = new THREE.Matrix4().lookAt(center, pos, new THREE.Vector3(0, 1, 0));
      const quat = new THREE.Quaternion().setFromRotationMatrix(m);
      
      p.push({ pos, quat });
    }
    return p;
  }, [scale, quality]);

  return (
    <group>
      <Sun scale={scale * 0.85} color={new THREE.Color("#ffaa33")} detailed={detailed} quality={quality} />
      <group ref={groupRef}>
        {panels.map((p, i) => (
          <mesh key={i} position={p.pos} quaternion={p.quat}>
            {/* 6 segments = Hexagon */}
            <circleGeometry args={[scale * 0.18, 6]} />
            <meshStandardMaterial 
              color="#2a2a35" 
              emissive="#1a1a00" 
              metalness={0.9} 
              roughness={0.1} 
              side={THREE.DoubleSide} 
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
