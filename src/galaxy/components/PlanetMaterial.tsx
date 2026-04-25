import { useMemo, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface Props {
  color?: THREE.Color;
  type?: string;
  size?: number;
  subtype: string;
  hue?: number;
  landColor?: string;
  seaColor?: string;
  lightDir?: THREE.Vector3;
  showWeather?: boolean;
  showCityLights?: boolean;
  quality?: "low" | "medium" | "high";
}

export function PlanetMaterial({ color, type, size, subtype, hue, landColor, seaColor, lightDir, showWeather, showCityLights, quality = "high" }: Props) {
  const uniforms = useMemo(() => {
    const baseColor = color || new THREE.Color("#ffffff");
    const h = (hue || 120) / 360;
    const lCol = landColor || new THREE.Color().setHSL(h, 0.6, 0.4).getStyle();
    const sCol = seaColor || new THREE.Color().setHSL((h + 0.5) % 1.0, 0.5, 0.2).getStyle();
    
    return {
      uColor: { value: baseColor },
      uTime: { value: 0 },
      uSubtype: { value: 0.0 },
      uLandColor: { value: new THREE.Color(lCol) },
      uSeaColor: { value: new THREE.Color(sCol) },
      uLightDir: { value: lightDir || new THREE.Vector3(1, 1, 1).normalize() },
      uShowWeather: { value: showWeather !== false ? 1.0 : 0.0 },
      uShowCityLights: { value: showCityLights !== false ? 1.0 : 0.0 },
      uQuality: { value: quality === "low" ? 0.0 : quality === "medium" ? 1.0 : 2.0 }
    };
  }, [color, hue, landColor, seaColor, lightDir, showWeather, showCityLights, quality]);

  const subtypeVal = useMemo(() => {
    const map: Record<string, number> = {
      lava: 1.0, desert: 2.0, temperate: 3.0, ocean: 4.0, ice: 5.0,
      gas_giant: 6.0, gas_giant_hot: 7.0, gas_giant_cold: 8.0, moon: 9.0,
      gaia: 10.0, hive: 11.0, machine: 12.0, rogue: 13.0, carbon: 14.0, super_earth: 15.0,
      asteroid: 16.0, station: 17.0, rocky_moon: 18.0
    };
    return map[subtype] || (type === "gas_giant" ? 6.0 : 3.0);
  }, [subtype, type]);

  // Immediately re-sync quality uniform when the prop changes (useFrame alone has a 1-frame delay)
  useEffect(() => {
    uniforms.uQuality.value = quality === "low" ? 0.0 : quality === "medium" ? 1.0 : 2.0;
  }, [quality]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uSubtype.value = subtypeVal;
    if (lightDir) {
        uniforms.uLightDir.value.copy(lightDir);
    }
    uniforms.uShowWeather.value = showWeather ? 1.0 : 0.0;
    uniforms.uShowCityLights.value = showCityLights ? 1.0 : 0.0;
    uniforms.uQuality.value = quality === "low" ? 0.0 : quality === "medium" ? 1.0 : 2.0;
  });

  return (
    <shaderMaterial
      uniforms={uniforms}
      transparent={false}
      vertexShader={`
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vLocalPosition;
        varying vec3 vViewPosition;
        varying vec3 vLightDirView;

        uniform vec3 uLightDir;
        
        void main() {
          vUv = uv;
          vLocalPosition = position;
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = mvPosition.xyz;
          vLightDirView = (viewMatrix * vec4(uLightDir, 0.0)).xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `}
      fragmentShader={`
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vLocalPosition;
        varying vec3 vViewPosition;
        varying vec3 vLightDirView;
        
        uniform vec3 uColor;
        uniform vec3 uLandColor;
        uniform vec3 uSeaColor;
        uniform vec3 uLightDir;
        uniform float uTime;
        uniform float uSubtype;
        uniform float uShowWeather;
        uniform float uShowCityLights;
        uniform float uQuality;

        // --- NOISE FUNCTIONS ---
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

        float snoise(vec3 v) {
          const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
          const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i  = floor(v + dot(v, C.yyy) );
          vec3 x0 = v - i + dot(i, C.xxx) ;
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min( g.xyz, l.zxy );
          vec3 i2 = max( g.xyz, l.zxy );
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute( permute( permute(
                     i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                   + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                   + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
          float n_ = 0.142857142857;
          vec3  ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
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

        float fbm(vec3 p, int octaves) {
          float value = 0.0;
          float amplitude = 0.5;
          int realOctaves = octaves;
          if (uQuality < 0.5) realOctaves = min(octaves, 2);
          else if (uQuality < 1.5) realOctaves = min(octaves, 4);

          for (int i = 0; i < 8; i++) {
            if (i >= realOctaves) break;
            value += amplitude * snoise(p);
            p *= 2.0;
            amplitude *= 0.5;
          }
          return value;
        }

        // --- UTILS ---
        vec3 perturbNormal(vec3 n, vec3 p, float strength, float scale) {
          if (uQuality < 0.5) return n;
          float e = 0.01;
          int oct = uQuality < 1.5 ? 2 : 4;
          float f0 = fbm(p * scale, oct);
          float fx = fbm((p + vec3(e, 0, 0)) * scale, oct);
          float fy = fbm((p + vec3(0, e, 0)) * scale, oct);
          float fz = fbm((p + vec3(0, 0, e)) * scale, oct);
          vec3 grad = vec3(fx - f0, fy - f0, fz - f0) / e;
          return normalize(n - grad * strength);
        }

        void main() {
          vec3 lightDir = length(vLightDirView) > 0.0 ? normalize(vLightDirView) : vec3(0, 1, 0);
          vec3 viewDir = length(vViewPosition) > 0.0 ? normalize(-vViewPosition) : vec3(0, 0, 1);
          float nDotL = dot(vNormal, lightDir);
          
          // Terrain height — use normalized position to ensure consistent detail regardless of mesh scale.
          // Scale 5.5 on a unit sphere gives continent-sized features (~6-8 per sphere).
          vec3 p = normalize(vLocalPosition) * 5.5;

          // Domain warping (high quality only): warp the sample point by a secondary noise field.
          // This folds the noise on itself, producing organic/fractal coastlines instead of round blobs.
          // Initialize h with plain FBM first — GLSL requires initialization before conditional use.
          float h = fbm(p, 5) * 0.5 + 0.5;
          if (uQuality > 1.5) {
            vec3 warp = vec3(
              fbm(p * 0.45 + vec3(1.3, 2.1, 0.7), 3),
              fbm(p * 0.45 + vec3(4.2, 0.9, 3.5), 3),
              fbm(p * 0.45 + vec3(7.1, 5.3, 1.9), 2)
            );
            h = fbm(p + warp * 1.8, 6) * 0.5 + 0.5;
          }
          
          vec3 surfaceColor;
          vec3 atmoColor = vec3(0.5, 0.7, 1.0);
          float atmoDensity = 0.5;
          float oceanMask = 0.0;
          float roughness = 0.8;
          float cityGlow = 0.0;

          // --- TERRESTRIAL / GAIA / HIVE / MOON (Habitable) ---
          if ((uSubtype > 9.5 && uSubtype < 15.5) || (uSubtype > 2.5 && uSubtype < 3.5) || (uSubtype > 8.5 && uSubtype < 9.5)) {
            float coast = smoothstep(0.45, 0.48, h);
            float mountain = smoothstep(0.65, 0.85, h);
            
            vec3 deepSea = uSeaColor * 0.5;
            vec3 shallowSea = uSeaColor * 1.2;
            vec3 land = uLandColor;
            vec3 peaks = vec3(0.9, 0.95, 1.0);
            
            if (h < 0.48) {
              surfaceColor = mix(deepSea, shallowSea, smoothstep(0.3, 0.48, h));
              oceanMask = 1.0;
              roughness = 0.2;
            } else {
              surfaceColor = mix(land, peaks, mountain);
              // High-fidelity "City Web" on night side
              if ((uSubtype > 10.5 || uSubtype < 3.5) && uShowCityLights > 0.5 && uQuality > 0.5) {
                // Hierarchical noise for urban clustering
                vec3 cityP = normalize(vLocalPosition);
                float clusters = smoothstep(0.35, 0.6, snoise(cityP * 12.0)); // Major metropolitan areas
                float sprawl = smoothstep(0.4, 0.6, snoise(cityP * 45.0)); // Suburban sprawl
                float pinpoints = step(0.72, snoise(cityP * 220.0)); // Individual light points
                
                // Coastline affinity: Cities love water
                float coastPop = smoothstep(0.1, 0.0, abs(h - 0.48)) * 0.8;
                
                float cityMask = max(clusters * sprawl, coastPop) * pinpoints;
                cityGlow = cityMask * 4.5;
              }
            }

            // Multi-layer Weather System (Clouds block city lights slightly)
            if (uShowWeather > 0.5 && uQuality > 0.5) {
              vec3 weatherP = normalize(vLocalPosition);
              float cloudNoise1 = fbm(weatherP * 3.0 + vec3(uTime * 0.05, 0, uTime * 0.02), 4);
              float cloudNoise2 = fbm(weatherP * 5.0 - vec3(uTime * 0.03, uTime * 0.01, 0), 3);
              float stormCells = smoothstep(0.75, 0.95, cloudNoise1 * cloudNoise2);
              float clouds = smoothstep(0.55, 0.8, cloudNoise1 + cloudNoise2 * 0.3);
              
              surfaceColor = mix(surfaceColor, vec3(0.95, 0.98, 1.0), clouds * 0.85);
              surfaceColor = mix(surfaceColor, vec3(0.7, 0.75, 0.8), stormCells * 0.5); 
              
              // Mask city glow by cloud cover
              cityGlow *= (1.0 - clouds * 0.85);
            }

            atmoColor = uColor;
            atmoDensity = 0.75;

          // --- GAS GIANTS ---
          } else if (uSubtype > 5.5 && uSubtype < 8.5) {
            vec3 gasP = normalize(vLocalPosition);
            float lat = vLocalPosition.y / length(vLocalPosition); // normalized latitude
            float warp = snoise(gasP * 0.8 + uTime * 0.02);
            float bands = sin(lat * 15.0 + warp * 4.0) * 0.5 + 0.5;
            float fine = sin(lat * 40.0 - warp * 2.0) * 0.5 + 0.5;
            
            surfaceColor = mix(uColor * 0.6, uColor * 1.4, mix(bands, fine, 0.3));
            
            // The Great Storm (Localized Vortex)
            if (uQuality > 0.5) {
              vec3 stormPos = normalize(vec3(1.0, -0.2, 0.5));
              float stormDist = distance(gasP, stormPos);
              if (stormDist < 0.4) {
                float swirl = atan(gasP.z, gasP.x) * 3.0;
                float vortex = snoise(gasP * 8.0 + vec3(0, swirl + uTime * 0.1, 0));
                float eye = smoothstep(0.4, 0.0, stormDist);
                surfaceColor = mix(surfaceColor, uColor * 2.0, eye * (vortex * 0.5 + 0.5) * 0.7);
                surfaceColor *= (1.0 - eye * 0.3); // Darker "eye" area
              }
            }

            atmoColor = uColor;
            atmoDensity = 1.3;
            roughness = 0.95;
            
          // --- LAVA (Fogball / Volcanic Haze) ---
          } else if (uSubtype < 1.5) {
            vec3 lavaP = normalize(vLocalPosition);
            float lavaPattern = fbm(lavaP * 4.0 + uTime * 0.1, 5);
            surfaceColor = mix(vec3(0.1, 0.02, 0.0), vec3(1.0, 0.4, 0.0), smoothstep(0.5, 0.7, lavaPattern));
            
            // Thick Volcanic Haze (Venus-style)
            if (uQuality > 0.5) {
              float haze = fbm(lavaP * 2.0 + uTime * 0.05, 3) * 0.5 + 0.5;
              surfaceColor = mix(surfaceColor, vec3(0.6, 0.4, 0.3), haze * 0.7);
            }
            
            atmoColor = vec3(1.0, 0.4, 0.1);
            atmoDensity = 1.5; // Very thick
            cityGlow = smoothstep(0.6, 0.8, lavaPattern) * 2.5;

          // --- DESERT (Dustball / Sandstorms) ---
          } else if (uSubtype < 2.5) {
            vec3 desertP = normalize(vLocalPosition);
            float sand = fbm(desertP * 6.0, 5);
            float dunes = fbm(desertP * 12.0, 3) * 0.5 + 0.5;
            // Color shifts from orange-red to pale tan based on uColor hue influence
            vec3 baseDesert = mix(vec3(0.55, 0.32, 0.12), vec3(0.88, 0.72, 0.45), uColor.r * 0.5 + 0.3);
            vec3 darkRock = mix(vec3(0.3, 0.18, 0.08), vec3(0.5, 0.38, 0.20), uColor.g * 0.4);
            surfaceColor = mix(darkRock, baseDesert, sand);
            surfaceColor = mix(surfaceColor, baseDesert * 1.2, dunes * 0.35);
            // Polar frost caps on cooler desert worlds
            float polar = smoothstep(0.7, 0.95, abs(desertP.y));
            surfaceColor = mix(surfaceColor, vec3(0.92, 0.88, 0.80), polar * 0.6);

            // Global Sand Haze
            if (uQuality > 0.5) {
              float dust = fbm(desertP * 3.0 + uTime * 0.08, 3) * 0.5 + 0.5;
              surfaceColor = mix(surfaceColor, baseDesert * 1.1, dust * 0.5);
            }
            
            atmoColor = mix(vec3(1.0, 0.8, 0.5), vec3(0.9, 0.6, 0.3), uColor.g);
            atmoDensity = 1.2;

          // --- OCEAN ---
          } else if (uSubtype > 3.5 && uSubtype < 4.5) {
            vec3 oceanP = normalize(vLocalPosition);
            // No land — pure deep-ocean with wave patterns
            float waves = fbm(oceanP * 5.0 + uTime * 0.04, 5) * 0.5 + 0.5;
            float deepOcean = fbm(oceanP * 2.0, 3) * 0.5 + 0.5;
            vec3 abyssal = mix(vec3(0.01, 0.04, 0.12), vec3(0.02, 0.08, 0.20), uColor.b * 0.5 + 0.3);
            vec3 shallows = mix(vec3(0.05, 0.25, 0.45), vec3(0.10, 0.40, 0.65), uColor.b * 0.4);
            vec3 foam     = vec3(0.80, 0.90, 0.95);
            surfaceColor = mix(abyssal, shallows, waves);
            surfaceColor = mix(surfaceColor, foam, smoothstep(0.78, 0.92, waves) * 0.4);
            oceanMask = 1.0;
            roughness = 0.05;
            atmoColor = mix(vec3(0.4, 0.7, 1.0), vec3(0.3, 0.5, 0.9), uColor.b);
            atmoDensity = 1.1;

          // --- MACHINE ---
          } else if (uSubtype > 11.5 && uSubtype < 12.5) {
             float grid = step(0.92, fract(vUv.x * 50.0)) + step(0.92, fract(vUv.y * 50.0));
             float megaGrid = step(0.96, fract(vUv.x * 8.0)) + step(0.96, fract(vUv.y * 8.0));
             vec3 panelBase = vec3(0.12, 0.13, 0.16);
             vec3 glowColor = mix(vec3(0.0, 0.8, 1.0), vec3(0.0, 1.0, 0.5), uColor.g);
             surfaceColor = mix(panelBase, panelBase * 1.3, megaGrid * 0.3);
             surfaceColor = mix(surfaceColor, glowColor, grid * 0.4);
             cityGlow = (grid + megaGrid * 0.5) * smoothstep(0.2, -0.2, nDotL) * 3.5;
             atmoColor = glowColor;
             atmoDensity = 0.35;

          // --- ICE ---
          } else if (uSubtype > 4.5 && uSubtype < 5.5) {
             vec3 iceP = normalize(vLocalPosition);
             // Color tint from uColor: neutral → blue-tinted → pinkish nitrogen ice
             vec3 tint = mix(vec3(1.0, 1.0, 1.0), uColor * 1.4, 0.25);
             float coarseCracks = fbm(iceP * 8.0, 4) * 0.5 + 0.5;
             float fineCracks   = fbm(iceP * 20.0 + vec3(3.7, 1.2, 0.5), 4) * 0.5 + 0.5;
             float microDetail  = fbm(iceP * 48.0, 3) * 0.5 + 0.5;
             
             float cracks = smoothstep(0.48, 0.52, coarseCracks);
             float hairline = smoothstep(0.46, 0.50, fineCracks);
             float polar = smoothstep(0.5, 0.9, abs(iceP.y));
             
             vec3 deepIce    = mix(vec3(0.40, 0.50, 0.70), uColor * 0.6, 0.3);
             vec3 sheetIce   = mix(vec3(0.82, 0.90, 1.00), tint, 0.2);
             vec3 polarSnow  = vec3(0.96, 0.97, 1.00);
             
             surfaceColor = mix(deepIce, sheetIce, cracks);
             surfaceColor = mix(surfaceColor, deepIce * 0.7, hairline * 0.5);
             surfaceColor = mix(surfaceColor, sheetIce * (0.9 + microDetail * 0.15), microDetail * 0.3);
             surfaceColor = mix(surfaceColor, polarSnow, polar * 0.8);
             
             atmoColor = vec3(0.75, 0.90, 1.0);
             atmoDensity = 0.25;
             roughness = 0.05;

          // --- ROGUE (Dark, near-black, deep space) ---
          } else if (uSubtype > 12.5 && uSubtype < 13.5) {
            vec3 rogueP = normalize(vLocalPosition);
            float frozen = fbm(rogueP * 6.0, 5) * 0.5 + 0.5;
            float crust  = fbm(rogueP * 14.0, 3) * 0.5 + 0.5;
            // Dark graphite surface with deep purple/blue internal subsurface scatter glow
            vec3 baseCrust   = mix(vec3(0.04, 0.04, 0.06), vec3(0.10, 0.10, 0.14), frozen);
            vec3 internalGlow = mix(vec3(0.15, 0.05, 0.25), vec3(0.05, 0.05, 0.30), crust);
            surfaceColor = mix(baseCrust, internalGlow, smoothstep(0.6, 0.9, crust) * 0.5);
            // Faint bioluminescent surface cracks (radiogenic decay)
            float veins = step(0.82, fbm(rogueP * 20.0, 4) * 0.5 + 0.5);
            surfaceColor = mix(surfaceColor, vec3(0.3, 0.1, 0.6), veins * 0.4);
            cityGlow = veins * 0.6;
            atmoColor = vec3(0.3, 0.1, 0.5);
            atmoDensity = 0.05;
            roughness = 0.95;

          // --- CARBON (Graphite / Tar with orange magma seams) ---
          } else if (uSubtype > 13.5 && uSubtype < 14.5) {
            vec3 carbonP = normalize(vLocalPosition);
            float crust = fbm(carbonP * 7.0, 5) * 0.5 + 0.5;
            float magmaSeams = step(0.72, fbm(carbonP * 15.0 + uTime * 0.03, 4) * 0.5 + 0.5);
            vec3 graphite = mix(vec3(0.06, 0.06, 0.07), vec3(0.18, 0.17, 0.16), crust);
            vec3 magma    = mix(vec3(1.0, 0.4, 0.0), vec3(1.0, 0.7, 0.1), crust);
            surfaceColor = mix(graphite, magma, magmaSeams * 0.6);
            cityGlow = magmaSeams * 1.8;
            atmoColor = vec3(0.7, 0.4, 0.15);
            atmoDensity = 0.9;
            roughness = 0.97;

          // --- SUPER-EARTH (Oversized rocky/ocean world) ---
          } else if (uSubtype > 14.5 && uSubtype < 15.5) {
            float coast = smoothstep(0.40, 0.46, h);
            float mountain = smoothstep(0.60, 0.90, h);
            float highMountain = smoothstep(0.80, 0.95, h);
            vec3 abyssal = uSeaColor * 0.4;
            vec3 shallowSea = uSeaColor * 1.3;
            vec3 land = uLandColor * 1.1;
            vec3 highlands = mix(uLandColor * 0.8, vec3(0.6, 0.55, 0.5), mountain);
            vec3 peaks = vec3(0.85, 0.88, 0.92);
            if (h < 0.46) {
              surfaceColor = mix(abyssal, shallowSea, smoothstep(0.25, 0.46, h));
              oceanMask = 1.0;
              roughness = 0.15;
            } else {
              surfaceColor = mix(land, highlands, mountain);
              surfaceColor = mix(surfaceColor, peaks, highMountain * 0.7);
            }
            // Super-dense cloud cover
            if (uShowWeather > 0.5 && uQuality > 0.5) {
              vec3 wp = normalize(vLocalPosition);
              float clouds = fbm(wp * 4.0 + uTime * 0.04, 5) * 0.5 + 0.5;
              surfaceColor = mix(surfaceColor, vec3(0.92, 0.95, 1.0), smoothstep(0.52, 0.78, clouds) * 0.9);
            }
            atmoColor = uColor;
            atmoDensity = 0.95;

          // --- GAIA (Lush alien biosphere) ---
          } else if (uSubtype > 9.5 && uSubtype < 10.5) {
            float coast = smoothstep(0.42, 0.50, h);
            float ridge = smoothstep(0.68, 0.88, h);
            // Vivid alien land — shifted toward purples/teals based on uColor
            vec3 alienFlora = mix(vec3(0.1, 0.5, 0.15), uLandColor * 1.5, 0.6);
            vec3 deepSea    = uSeaColor * 0.4;
            vec3 shallowSea = uSeaColor * 1.4;
            vec3 ridges     = mix(alienFlora * 0.7, vec3(0.85, 0.90, 0.95), ridge);
            if (h < 0.50) {
              surfaceColor = mix(deepSea, shallowSea, smoothstep(0.28, 0.50, h));
              oceanMask = 1.0;
              roughness = 0.12;
            } else {
              surfaceColor = mix(alienFlora, ridges, ridge);
            }
            // Alien cloud patterns (slightly tinted)
            if (uShowWeather > 0.5 && uQuality > 0.5) {
              vec3 wp = normalize(vLocalPosition);
              float clouds = fbm(wp * 3.5 + uTime * 0.035, 4) * 0.5 + 0.5;
              vec3 cloudColor = mix(vec3(0.88, 0.95, 1.0), uColor * 2.0, 0.15);
              surfaceColor = mix(surfaceColor, cloudColor, smoothstep(0.50, 0.78, clouds) * 0.8);
            }
            atmoColor = mix(uColor, vec3(0.4, 0.9, 0.5), 0.3);
            atmoDensity = 0.85;

          // --- HIVE (Organic colony world) ---
          } else if (uSubtype > 10.5 && uSubtype < 11.5) {
            vec3 hiveP = normalize(vLocalPosition);
            float organic = fbm(hiveP * 5.0, 5) * 0.5 + 0.5;
            float tendrils = step(0.78, fbm(hiveP * 18.0 + uTime * 0.01, 4) * 0.5 + 0.5);
            float pulses   = fbm(hiveP * 8.0 + uTime * 0.06, 3) * 0.5 + 0.5;
            // Dark organic biomass surface with glowing bioluminescent network
            vec3 biomass  = mix(vec3(0.05, 0.08, 0.04), vec3(0.12, 0.20, 0.08), organic);
            vec3 bioGlow  = mix(vec3(0.1, 0.8, 0.3), vec3(0.5, 0.2, 0.8), pulses);
            surfaceColor  = mix(biomass, bioGlow * 0.4, tendrils * 0.5);
            cityGlow = tendrils * pulses * 3.5;
            atmoColor = vec3(0.2, 0.6, 0.2);
            atmoDensity = 1.1;
            roughness = 0.99;

          // --- ASTEROIDS ---
          } else if (uSubtype > 15.5 && uSubtype < 16.5) {
             vec3 rockP = normalize(vLocalPosition);
             float rock = fbm(rockP * 12.0, 5);
             surfaceColor = mix(vec3(0.3, 0.28, 0.26), vec3(0.5, 0.48, 0.45), rock);
             atmoDensity = 0.0;
             roughness = 0.95;

          // --- ROCKY MOONS (Airless Craters) ---
          } else if (uSubtype > 17.5 && uSubtype < 18.5) {
             vec3 moonP = normalize(vLocalPosition);
             float rockBase = fbm(moonP * 4.0, 5);
             float craters = pow(max(0.0, snoise(moonP * 8.0)), 3.0) * 0.4;
             float fineRegolith = fbm(moonP * 32.0, 3) * 0.05;
             
             surfaceColor = mix(vec3(0.25, 0.26, 0.28), vec3(0.45, 0.46, 0.48), rockBase);
             surfaceColor -= craters; // Crater depressions
             surfaceColor += fineRegolith;
             
             atmoDensity = 0.0;
             roughness = 0.9;

          // --- STATIONS ---
          } else if (uSubtype > 16.5 && uSubtype < 17.5) {
             float panels = step(0.95, fract(vUv.x * 20.0)) + step(0.95, fract(vUv.y * 20.0));
             surfaceColor = mix(vec3(0.4, 0.42, 0.45), vec3(0.2, 0.22, 0.25), panels);
             cityGlow = panels * 2.0; // Running lights
             atmoDensity = 0.0;
             roughness = 0.4;
          } else {
            surfaceColor = uColor * (0.8 + h * 0.4);
            atmoColor = uColor;
            atmoDensity = 0.2;
          }

          // Lighting calculations: use base normal for terminator, perturbed for detail
          vec3 normal = perturbNormal(vNormal, normalize(vLocalPosition), 0.05, 5.0);
          float baseDiff = max(dot(vNormal, lightDir), 0.0);
          float detailDiff = max(dot(normal, lightDir), 0.0);
          float diff = mix(baseDiff, detailDiff, 0.2) + 0.05; // 0.05 ambient
          
          // Specular (Oceans/Ice)
          vec3 reflectDir = reflect(-lightDir, normal);
          float spec = pow(max(dot(viewDir, reflectDir), 0.0), roughness < 0.3 ? 64.0 : 8.0);
          vec3 specular = vec3(spec * (1.0 - roughness) * 0.5);
          
          // Atmospheric scattering approximation
          float fresnel = pow(1.0 - max(0.0, dot(vNormal, viewDir)), 4.0);
          float scatter = fresnel * atmoDensity * max(0.0, nDotL + 0.2);
          vec3 atmoGlow = atmoColor * scatter;

          // Rim light
          float rim = pow(1.0 - max(0.0, dot(vNormal, viewDir)), 12.0) * atmoDensity * 0.8;
          
          vec3 finalRGB = (surfaceColor * diff) + specular + (atmoGlow * 1.2) + (rim * atmoColor) + (cityGlow * vec3(1.0, 0.8, 0.5));
          
          // Night side ambient
          finalRGB += surfaceColor * 0.02;

          gl_FragColor = vec4(finalRGB, 1.0);
        }
      `}
    />
  );
}
