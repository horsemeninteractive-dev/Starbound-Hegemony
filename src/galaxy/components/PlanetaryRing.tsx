import { useMemo } from "react";
import * as THREE from "three";

interface Props {
  radius: number;
  innerRadius: number;
  outerRadius: number;
  color: THREE.Color;
}

export function PlanetaryRing({ innerRadius, outerRadius, color }: Props) {
  const uniforms = useMemo(() => ({
    uColor: { value: color },
    uInnerRadius: { value: innerRadius },
    uOuterRadius: { value: outerRadius },
  }), [color, innerRadius, outerRadius]);

  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[innerRadius, outerRadius, 128]} />
      <shaderMaterial
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
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
          uniform float uInnerRadius;
          uniform float uOuterRadius;

          float hash(float n) { return fract(sin(n) * 43758.5453123); }
          
          void main() {
            float dist = length(vPosition.xy);
            float normalizedDist = (dist - uInnerRadius) / (uOuterRadius - uInnerRadius);
            
            // Create banded structure
            float bands = sin(normalizedDist * 60.0) * 0.5 + 0.5;
            bands *= sin(normalizedDist * 120.0) * 0.3 + 0.7;
            
            // Cassini-like divisions
            float division = smoothstep(0.45, 0.48, normalizedDist) * (1.0 - smoothstep(0.52, 0.55, normalizedDist));
            float alpha = mix(0.1, 0.6, bands);
            alpha *= (1.0 - division * 0.9);
            
            // Subtle noise for dust texture
            float noise = hash(normalizedDist * 1000.0) * 0.15;
            
            vec3 finalColor = uColor * (0.8 + bands * 0.4);
            gl_FragColor = vec4(finalColor, alpha + noise);
          }
        `}
      />
    </mesh>
  );
}
