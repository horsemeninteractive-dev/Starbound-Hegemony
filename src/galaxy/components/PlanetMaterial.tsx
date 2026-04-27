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
  isWeather?: boolean;
  quality?: "low" | "medium" | "high";
  terrainSeed?: number;
  geographyType?: "pangaea" | "continental" | "islands";
}

export function PlanetMaterial({ color, type, size, subtype, hue, landColor, seaColor, lightDir, showWeather, showCityLights, isWeather, quality = "high", terrainSeed, geographyType }: Props) {
  const uniforms = useMemo(() => {
    return {
      uColor: { value: new THREE.Color("#ffffff") },
      uTime: { value: 0 },
      uSubtype: { value: 0.0 },
      uLandColor: { value: new THREE.Color() },
      uSeaColor: { value: new THREE.Color() },
      uLightDir: { value: new THREE.Vector3(1, 1, 1).normalize() },
      uShowWeather: { value: 1.0 },
      uShowCityLights: { value: 1.0 },
      uIsWeather: { value: 0.0 },
      uQuality: { value: 2.0 },
      uTerrainSeed: { value: 0.0 },
      uGeographyType: { value: 0.0 } // 0: continental, 1: pangaea, 2: islands
    };
  }, []); // Stable reference

  // Sync static props to uniforms
  useEffect(() => {
    const baseColor = color || new THREE.Color("#ffffff");
    const h = (hue || 120) / 360;
    const lCol = landColor || new THREE.Color().setHSL(h, 0.6, 0.4).getStyle();
    const sCol = seaColor || new THREE.Color().setHSL((h + 0.5) % 1.0, 0.5, 0.2).getStyle();

    uniforms.uColor.value.copy(baseColor);
    uniforms.uLandColor.value.set(lCol);
    uniforms.uSeaColor.value.set(sCol);
    uniforms.uShowWeather.value = showWeather !== false ? 1.0 : 0.0;
    uniforms.uShowCityLights.value = showCityLights !== false ? 1.0 : 0.0;
    uniforms.uIsWeather.value = isWeather ? 1.0 : 0.0;
    uniforms.uQuality.value = quality === "low" ? 0.0 : quality === "medium" ? 1.0 : 2.0;
    uniforms.uTerrainSeed.value = terrainSeed || 0.0;
    uniforms.uGeographyType.value = geographyType === "pangaea" ? 1.0 : geographyType === "islands" ? 2.0 : 0.0;
  }, [color, hue, landColor, seaColor, showWeather, showCityLights, isWeather, quality, terrainSeed, geographyType, uniforms]);

  const subtypeVal = useMemo(() => {
    const map: Record<string, number> = {
      // Habitable: Dry
      desert: 1.0, arid: 2.0, savanna: 3.0,
      // Habitable: Temperate
      continental: 4.0, ocean: 5.0, tropical: 6.0,
      // Habitable: Cold
      arctic: 7.0, alpine: 8.0, tundra: 9.0,
      // Special
      gaia: 10.0, tomb: 11.0, relic: 12.0, ecumenopolis: 13.0,
      hive: 14.0, machine: 15.0, nanite: 16.0,
      // Uninhabitable
      barren: 17.0, toxic: 18.0, frozen: 19.0, molten: 20.0,
      shrouded: 21.0, broken: 22.0, shattered: 23.0, shielded: 24.0, infested: 25.0,
      // Gas Giants
      gas_giant: 26.0, gas_giant_hot: 27.0, gas_giant_cold: 28.0,
      // Utilities
      moon: 29.0, rocky_moon: 30.0, asteroid: 31.0, station: 32.0,
      carbon: 33.0, rogue: 34.0, super_earth: 35.0,
      // Aliases
      lava: 20.0, temperate: 4.0, ice: 19.0
    };
    return map[subtype] || (type === "gas_giant" ? 26.0 : 4.0);
  }, [subtype, type]);

  // Immediately re-sync quality uniform when the prop changes (useFrame alone has a 1-frame delay)
  useEffect(() => {
    uniforms.uQuality.value = quality === "low" ? 0.0 : quality === "medium" ? 1.0 : 2.0;
  }, [quality]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((state) => {
    uniforms.uTime.value = state.clock.getElapsedTime();
    uniforms.uSubtype.value = subtypeVal;
    if (lightDir) {
        uniforms.uLightDir.value.copy(lightDir);
    }
  });

  return (
    <shaderMaterial
      uniforms={uniforms}
      transparent={!!isWeather}
      depthWrite={!isWeather}
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
        uniform float uIsWeather;
        uniform float uQuality;
        uniform float uTerrainSeed;
        uniform float uGeographyType;

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
          vec3 p = normalize(vLocalPosition) * 5.5 + uTerrainSeed * 0.12;

          // Domain warping (high quality only): warp the sample point by a secondary noise field.
          float h = fbm(p, 5) * 0.5 + 0.5;
          
          if (uQuality > 1.5) {
            vec3 warp = vec3(
              fbm(p * 0.45 + vec3(1.3, 2.1, 0.7), 3),
              fbm(p * 0.45 + vec3(4.2, 0.9, 3.5), 3),
              fbm(p * 0.45 + vec3(7.1, 5.3, 1.9), 2)
            );
            h = fbm(p + warp * 1.8, 6) * 0.5 + 0.5;
          }

          // Geography Style Modifiers
          if (uGeographyType > 0.5 && uGeographyType < 1.5) { 
            // 1.0 = PANGAEA: Single massive landmass
            // Use low-frequency noise as a "continent mask"
            float mask = snoise(normalize(vLocalPosition) * 1.1 + uTerrainSeed * 0.04);
            // Push everything down except for the mask's "hot spot"
            h = mix(h * 0.4, h * 1.2, smoothstep(-0.25, 0.35, mask));
          } else if (uGeographyType > 1.5) { 
            // 2.0 = ISLANDS: Many small archipelagos
            // Use high-frequency noise and sharpen the peaks
            float islandNoise = fbm(p * 2.2, 4);
            h = mix(h, islandNoise, 0.6);
            h = pow(h, 2.4) * 1.45; // Steep drop-offs, only sharp peaks stay above sea level
          }
          
          vec3 surfaceColor;
          vec3 atmoColor = vec3(0.5, 0.7, 1.0);
          float atmoDensity = 0.5;
          float oceanMask = 0.0;
          float roughness = 0.8;
          vec3 cityGlow = vec3(0.0);
          int st = int(uSubtype + 0.5);
          // 1: Desert, 2: Arid, 3: Savanna, 17: Barren
          if (st == 1 || st == 2 || st == 3 || st == 17) {
            vec3 desertP = normalize(vLocalPosition);
            float sand = fbm(desertP * 6.0, 5);
            float dunes = fbm(desertP * 12.0, 3) * 0.5 + 0.5;
            
            vec3 baseDesert = mix(vec3(0.55, 0.32, 0.12), vec3(0.88, 0.72, 0.45), uColor.r * 0.5 + 0.3);
            vec3 darkRock = mix(vec3(0.3, 0.18, 0.08), vec3(0.5, 0.38, 0.20), uColor.g * 0.4);
            
            if (st == 2) { // Arid: More browns, sparse green
               baseDesert = mix(vec3(0.4, 0.3, 0.2), vec3(0.6, 0.5, 0.3), uColor.r);
               darkRock = mix(vec3(0.2, 0.2, 0.1), vec3(0.3, 0.3, 0.2), uColor.g);
               float sparseGreen = smoothstep(0.7, 0.9, fbm(desertP * 10.0, 4));
               baseDesert = mix(baseDesert, vec3(0.3, 0.4, 0.2), sparseGreen);
            } else if (st == 3) { // Savanna: Yellow/Orange plains
               baseDesert = mix(vec3(0.6, 0.5, 0.2), vec3(0.7, 0.6, 0.3), uColor.r);
            } else if (st == 17) { // Barren: Gray/Brown lifeless
               baseDesert = mix(vec3(0.4, 0.35, 0.35), vec3(0.5, 0.45, 0.45), uColor.r);
            }
            
            surfaceColor = mix(darkRock, baseDesert, sand);
            surfaceColor = mix(surfaceColor, baseDesert * 1.2, dunes * 0.35);
            
            if (st != 17) {
              float polar = smoothstep(0.7, 0.95, abs(desertP.y));
              surfaceColor = mix(surfaceColor, vec3(0.92, 0.88, 0.80), polar * 0.6);
            }
            
            if (st != 17 && uShowWeather > 0.5) {
              float dust = fbm(desertP * 3.0 + uTime * 0.08, 3) * 0.5 + 0.5;
              surfaceColor = mix(surfaceColor, baseDesert * 1.1, dust * 0.5);
            }
            atmoColor = mix(vec3(1.0, 0.8, 0.5), vec3(0.9, 0.6, 0.3), uColor.g);
            atmoDensity = st == 17 ? 0.0 : 1.2;
            roughness = 0.85;

            if (st != 17 && uShowCityLights > 0.5 && uQuality > 0.5) {
              float hubs = smoothstep(0.8, 0.95, fbm(desertP * 4.0, 3) * 0.5 + 0.5);
              cityGlow = vec3(1.0, 0.8, 0.5) * hubs * 4.0;
            }

          // 4: Continental, 6: Tropical, 10: Gaia
          } else if (st == 4 || st == 6 || st == 10) {
            float lat = abs(normalize(vLocalPosition).y);
            float ridges = pow(1.0 - abs(fbm(p * 3.0, 4)), 2.0) * smoothstep(0.5, 0.8, h);
            float finalH = h + ridges * 0.2;
            
            float coast = smoothstep(0.48, 0.50, finalH);
            float mountain = smoothstep(0.65, 0.85, finalH);
            float snowcap = clamp(smoothstep(0.75, 0.95, finalH) + smoothstep(0.75, 0.9, lat), 0.0, 1.0);
            
            vec3 deepSea = uSeaColor * 0.4;
            vec3 shallowSea = uSeaColor * 1.3;
            
            vec3 landColorBase = mix(uLandColor * 0.8, uLandColor * 1.2, fbm(p * 6.0, 3));
            
            if (st == 6) { // Tropical: brighter greens, less deserts
               landColorBase = mix(vec3(0.1, 0.5, 0.2), vec3(0.2, 0.6, 0.3), fbm(p * 5.0, 3));
               snowcap *= 0.2; // Less snow
            } else if (st == 10) { // Gaia: vivid purples/teals mixed in
               landColorBase = mix(landColorBase, vec3(0.3, 0.6, 0.7), fbm(p * 8.0, 3) * 0.4);
               deepSea *= 1.2;
            } else { // Continental: desert bands
               vec3 desertColor = mix(vec3(0.75, 0.65, 0.45), vec3(0.85, 0.75, 0.55), fbm(p * 8.0, 3));
               float desertBand = smoothstep(0.15, 0.35, lat) * smoothstep(0.55, 0.35, lat);
               landColorBase = mix(landColorBase, desertColor, desertBand * smoothstep(0.48, 0.65, finalH));
            }
            
            vec3 peaks = vec3(0.92, 0.95, 1.0);
            
            if (finalH < 0.48) {
              surfaceColor = mix(deepSea, shallowSea, smoothstep(0.2, 0.48, finalH));
              float foamNoise = fbm(p * 25.0 + uTime * 0.05, 3) * 0.5 + 0.5;
              surfaceColor = mix(surfaceColor, vec3(0.8, 0.9, 0.95), smoothstep(0.46, 0.48, finalH) * foamNoise);
              oceanMask = 1.0;
              roughness = 0.15;
            } else {
              surfaceColor = mix(landColorBase, mix(uLandColor * 0.5, peaks, 0.4), mountain);
              surfaceColor = mix(surfaceColor, peaks, snowcap);
              
              if (uShowCityLights > 0.5) {
                vec3 cityP = normalize(vLocalPosition);
                float network = pow(1.0 - abs(fbm(cityP * 8.0, 4)), 3.0);
                float hubs = smoothstep(0.5, 0.9, fbm(cityP * 4.0 + vec3(1.2, 3.4, 5.6), 3) * 0.5 + 0.5);
                float landArea = smoothstep(0.48, 0.49, finalH) * smoothstep(0.75, 0.60, finalH) * smoothstep(0.8, 0.65, lat);
                float coastLine = smoothstep(0.08, 0.0, abs(finalH - 0.49));
                float habitality = landArea * (0.3 + coastLine * 1.7);
                float infrastructure = (network * 0.5 + hubs * 0.9) * habitality;
                float pinpoints = pow(snoise(cityP * 180.0) * 0.5 + 0.5, 4.0);
                cityGlow = vec3(1.0, 0.8, 0.5) * (smoothstep(0.6, 0.9, infrastructure) + smoothstep(0.3, 0.6, infrastructure) * pinpoints * 1.5) * 6.0;
              }
            }
            
            if (uShowWeather > 0.5) {
              vec3 weatherP = normalize(vLocalPosition);
              float cloudNoise1 = fbm(weatherP * 3.0 + vec3(uTime * 0.05, 0, uTime * 0.02), 4);
              float cloudNoise2 = fbm(weatherP * 5.0 - vec3(uTime * 0.03, uTime * 0.01, 0), 3);
              float stormCells = smoothstep(0.75, 0.95, cloudNoise1 * cloudNoise2);
              float clouds = smoothstep(0.55, 0.8, cloudNoise1 + cloudNoise2 * 0.3);
              if (st == 6) clouds = smoothstep(0.45, 0.8, cloudNoise1 + cloudNoise2 * 0.4); // More tropical clouds
              
              surfaceColor = mix(surfaceColor, vec3(0.95, 0.98, 1.0), clouds * 0.85);
              surfaceColor = mix(surfaceColor, vec3(0.7, 0.75, 0.8), stormCells * 0.5); 
              cityGlow *= (1.0 - clouds * 0.85);
            }
            atmoColor = uColor;
            atmoDensity = st == 6 ? 0.9 : 0.75;
            
          // 5: Ocean
          } else if (st == 5) {
            vec3 oceanP = normalize(vLocalPosition);
            float waves = fbm(oceanP * 5.0 + uTime * 0.04, 5) * 0.5 + 0.5;
            vec3 abyssal = mix(vec3(0.01, 0.04, 0.12), vec3(0.02, 0.08, 0.20), uColor.b * 0.5 + 0.3);
            vec3 shallows = mix(vec3(0.05, 0.25, 0.45), vec3(0.10, 0.40, 0.65), uColor.b * 0.4);
            surfaceColor = mix(abyssal, shallows, waves);
            surfaceColor = mix(surfaceColor, vec3(0.80, 0.90, 0.95), smoothstep(0.78, 0.92, waves) * 0.4);
            oceanMask = 1.0; roughness = 0.05;
            atmoColor = mix(vec3(0.4, 0.7, 1.0), vec3(0.3, 0.5, 0.9), uColor.b);
            atmoDensity = 1.1;
            if (uShowWeather > 0.5) {
              float clouds = smoothstep(0.55, 0.8, fbm(oceanP * 4.0 + uTime*0.03, 4));
              surfaceColor = mix(surfaceColor, vec3(0.95, 0.98, 1.0), clouds * 0.85);
            }
            if (uShowCityLights > 0.5) {
              // Floating cities
              cityGlow = vec3(1.0, 0.8, 0.5) * smoothstep(0.85, 0.9, fbm(oceanP * 12.0, 3)) * 3.0;
              cityGlow *= (1.0 - smoothstep(0.55, 0.8, fbm(oceanP * 4.0 + uTime*0.03, 4)) * 0.85);
            }

          // 7: Arctic, 8: Alpine, 9: Tundra, 19: Frozen
          } else if (st == 7 || st == 8 || st == 9 || st == 19) {
             vec3 iceP = normalize(vLocalPosition);
             vec3 tint = mix(vec3(1.0, 1.0, 1.0), uColor * 1.4, 0.25);
             
             float coarseCracks = fbm(iceP * 8.0, 4) * 0.5 + 0.5;
             float microDetail  = fbm(iceP * 48.0, 3) * 0.5 + 0.5;
             float polar = smoothstep(0.5, 0.9, abs(iceP.y));
             
             if (st == 19) { // Pure frozen
               surfaceColor = mix(vec3(0.4, 0.5, 0.7), mix(vec3(0.8, 0.9, 1.0), tint, 0.2), smoothstep(0.48, 0.52, coarseCracks));
               surfaceColor = mix(surfaceColor, vec3(0.96, 0.97, 1.00), polar * 0.8);
               roughness = 0.1;
             } else if (st == 7) { // Arctic: Deep oceans + glaciers
               float iceMask = smoothstep(0.4, 0.6, h + polar * 0.4);
               vec3 sea = mix(vec3(0.05, 0.1, 0.2), vec3(0.1, 0.3, 0.5), coarseCracks);
               vec3 glacier = mix(vec3(0.7, 0.8, 0.9), vec3(0.9, 0.95, 1.0), microDetail);
               surfaceColor = mix(sea, glacier, iceMask);
               roughness = mix(0.1, 0.6, iceMask);
             } else if (st == 8) { // Alpine: Mountains + snow
               float mountain = smoothstep(0.4, 0.8, h);
               vec3 rock = mix(vec3(0.3, 0.3, 0.35), vec3(0.4, 0.4, 0.45), coarseCracks);
               vec3 snow = vec3(0.9, 0.95, 1.0);
               float snowMask = smoothstep(0.6, 0.9, h + polar * 0.5);
               surfaceColor = mix(rock, snow, snowMask);
               roughness = 0.8;
             } else if (st == 9) { // Tundra: Permafrost + brown grass
               vec3 soil = mix(vec3(0.4, 0.3, 0.2), vec3(0.3, 0.35, 0.3), coarseCracks);
               vec3 frost = vec3(0.85, 0.9, 0.95);
               float frostMask = smoothstep(0.4, 0.7, h * 0.5 + polar * 0.8 + microDetail * 0.2);
               surfaceColor = mix(soil, frost, frostMask);
               roughness = 0.8;
             }
             
             if (uShowCityLights > 0.5) {
               cityGlow = vec3(1.0, 0.8, 0.5) * smoothstep(0.85, 0.95, fbm(iceP * 6.0, 3)) * 3.0;
             }
             
             if (uShowWeather > 0.5) {
               float snow = smoothstep(0.5, 0.85, fbm(iceP * 4.0 + uTime * 0.05, 4));
               surfaceColor = mix(surfaceColor, vec3(1.0, 1.0, 1.0), snow * 0.7);
             }
             
             atmoColor = vec3(0.75, 0.90, 1.0);
             atmoDensity = 0.3;

          // 11: Tomb, 12: Relic, 13: Ecumenopolis, 35: Super Earth
          } else if (st == 11 || st == 12 || st == 13 || st == 35) {
            float coast = smoothstep(0.40, 0.46, h);
            float mountain = smoothstep(0.60, 0.90, h);
            
            if (st == 35) {
              vec3 abyssal = uSeaColor * 0.4;
              if (h < 0.46) {
                surfaceColor = mix(abyssal, uSeaColor * 1.3, smoothstep(0.25, 0.46, h));
                oceanMask = 1.0; roughness = 0.15;
              } else {
                surfaceColor = mix(uLandColor * 1.1, mix(uLandColor * 0.8, vec3(0.6, 0.55, 0.5), mountain), mountain);
                if (uShowCityLights > 0.5) cityGlow = vec3(1.0, 0.8, 0.5) * smoothstep(0.7, 0.9, fbm(p * 8.0, 3)) * 4.0;
              }
              if (uShowWeather > 0.5) {
                float clouds = smoothstep(0.5, 0.85, fbm(p * 3.5 + uTime * 0.04, 3));
                surfaceColor = mix(surfaceColor, vec3(0.9, 0.95, 1.0), clouds * 0.6);
                cityGlow *= (1.0 - clouds);
              }
              atmoColor = uColor; atmoDensity = 0.95;
            } else if (st == 13) { // Ecumenopolis
              float grid = step(0.9, fract(vUv.x * 60.0)) + step(0.9, fract(vUv.y * 60.0));
              float districts = fbm(p * 15.0, 4);
              surfaceColor = mix(vec3(0.2, 0.2, 0.25), vec3(0.4, 0.4, 0.45), districts);
              surfaceColor = mix(surfaceColor, vec3(0.1, 0.1, 0.1), grid * 0.5);
              if (uShowCityLights > 0.5) {
                 float lightMask = smoothstep(0.3, 0.7, districts) + grid * 0.5;
                 cityGlow = vec3(1.0, 0.8, 0.5) * lightMask * 5.0;
              }
              atmoColor = vec3(0.8, 0.6, 0.4); atmoDensity = 0.6; roughness = 0.4;
            } else if (st == 12) { // Relic
              float ruins = fbm(p * 20.0, 5);
              surfaceColor = mix(vec3(0.3, 0.3, 0.25), vec3(0.5, 0.5, 0.45), ruins);
              if (uShowCityLights > 0.5) cityGlow = vec3(0.5, 0.8, 1.0) * smoothstep(0.8, 0.95, ruins) * 2.0; // faint ancient power
              atmoColor = vec3(0.5, 0.5, 0.5); atmoDensity = 0.4; roughness = 0.7;
            } else if (st == 11) { // Tomb
              float ash = fbm(p * 10.0, 4);
              float craters = pow(max(0.0, snoise(p * 5.0)), 4.0);
              surfaceColor = mix(vec3(0.2, 0.2, 0.2), vec3(0.4, 0.4, 0.35), ash);
              surfaceColor -= craters * 0.5; // dark craters
              if (uShowCityLights > 0.5) cityGlow = craters * 4.0 * vec3(0.2, 1.0, 0.2); // Radioactive glow
              atmoColor = vec3(0.4, 0.5, 0.3); atmoDensity = 0.8; roughness = 0.9;
            }

          // 14: Hive, 25: Infested
          } else if (st == 14 || st == 25) {
            float organic = fbm(p * 5.0, 5) * 0.5 + 0.5;
            float tendrils = step(0.78, fbm(p * 18.0 + uTime * 0.01, 4) * 0.5 + 0.5);
            float pulses   = fbm(p * 8.0 + uTime * 0.06, 3) * 0.5 + 0.5;
            vec3 biomass = st == 14 ? mix(vec3(0.05, 0.08, 0.04), vec3(0.12, 0.20, 0.08), organic) 
                                    : mix(vec3(0.15, 0.02, 0.02), vec3(0.25, 0.05, 0.05), organic); // Red for infested
            vec3 bioGlow = st == 14 ? mix(vec3(0.1, 0.8, 0.3), vec3(0.5, 0.2, 0.8), pulses)
                                    : mix(vec3(1.0, 0.2, 0.0), vec3(0.8, 0.0, 0.2), pulses);
            surfaceColor  = mix(biomass, bioGlow * 0.4, tendrils * 0.5);
            if (uShowCityLights > 0.5) cityGlow = vec3(1.0, 0.3, 0.1) * tendrils * pulses * 3.5;
            if (uShowWeather > 0.5) {
              float spores = smoothstep(0.6, 0.9, fbm(p * 6.0 + uTime * 0.04, 3));
              surfaceColor = mix(surfaceColor, st == 14 ? vec3(0.4, 0.8, 0.3) : vec3(0.8, 0.2, 0.1), spores * 0.5);
            }
            atmoColor = st == 14 ? vec3(0.2, 0.6, 0.2) : vec3(0.6, 0.1, 0.1);
            atmoDensity = 1.1; roughness = 0.99;

          // 15: Machine, 16: Nanite
          } else if (st == 15 || st == 16) {
             float grid = step(0.92, fract(vUv.x * 50.0)) + step(0.92, fract(vUv.y * 50.0));
             float megaGrid = step(0.96, fract(vUv.x * 8.0)) + step(0.96, fract(vUv.y * 8.0));
             if (st == 16) {
                // Nanite shifting waves
                float wave = fbm(p * 10.0 + uTime * 0.1, 3);
                surfaceColor = mix(vec3(0.6, 0.65, 0.7), vec3(0.3, 0.35, 0.4), wave);
                roughness = mix(0.1, 0.5, wave);
                atmoColor = vec3(0.5, 0.6, 0.7);
             } else {
                vec3 panelBase = vec3(0.12, 0.13, 0.16);
                vec3 glowColor = mix(vec3(0.0, 0.8, 1.0), vec3(0.0, 1.0, 0.5), uColor.g);
                surfaceColor = mix(panelBase, panelBase * 1.3, megaGrid * 0.3);
                surfaceColor = mix(surfaceColor, glowColor, grid * 0.4);
                // Grid only shows on sun-side via surfaceColor to meet user request (reverse nightlight logic)
                if (uShowCityLights > 0.5) cityGlow = vec3(0.0, 0.0, 0.0);
                roughness = 0.4;
                atmoColor = glowColor;
             }
             atmoDensity = 0.35;

          // 18: Toxic, 20: Molten, 21: Shrouded, 33: Carbon
          } else if (st == 18 || st == 20 || st == 21 || st == 33) {
            float crust = fbm(p * 4.0 + uTime * 0.05, 5);
            if (st == 20) { // Molten
              surfaceColor = mix(vec3(0.1, 0.02, 0.0), vec3(1.0, 0.4, 0.0), smoothstep(0.5, 0.7, crust));
              cityGlow = vec3(1.0, 0.4, 0.0) * smoothstep(0.6, 0.8, crust) * 2.5; // Lava glow
              atmoColor = vec3(1.0, 0.4, 0.1); atmoDensity = 1.5; roughness = 0.9;
            } else if (st == 18) { // Toxic
              surfaceColor = mix(vec3(0.2, 0.3, 0.1), vec3(0.4, 0.6, 0.2), crust);
              atmoColor = vec3(0.6, 0.8, 0.2); atmoDensity = 2.0; roughness = 0.5; // Thick acid fog
              if (uShowWeather > 0.5) surfaceColor = mix(surfaceColor, vec3(0.5, 0.7, 0.3), fbm(p * 2.0 + uTime*0.02, 3));
            } else if (st == 21) { // Shrouded
              surfaceColor = mix(vec3(0.05, 0.02, 0.1), vec3(0.2, 0.05, 0.3), crust);
              if (uShowWeather > 0.5) {
                float psionic = smoothstep(0.65, 0.95, fbm(p * 4.0 + uTime * 0.03, 4));
                surfaceColor = mix(surfaceColor, vec3(0.6, 0.2, 0.8), psionic * 0.6);
              }
              cityGlow = smoothstep(0.7, 0.9, crust) * vec3(0.8, 0.2, 1.0) * 2.0; // Psionic energy
              atmoColor = vec3(0.4, 0.1, 0.6); atmoDensity = 1.8; roughness = 0.9;
            } else if (st == 33) { // Carbon
              float magmaSeams = step(0.72, fbm(p * 15.0 + uTime * 0.03, 4) * 0.5 + 0.5);
              surfaceColor = mix(mix(vec3(0.06, 0.06, 0.07), vec3(0.18, 0.17, 0.16), crust), vec3(1.0, 0.4, 0.0), magmaSeams * 0.6);
              cityGlow = vec3(1.0, 0.4, 0.0) * magmaSeams * 1.8;
              atmoColor = vec3(0.7, 0.4, 0.15); atmoDensity = 0.9; roughness = 0.97;
            }

          // 26, 27, 28: Gas Giants
          } else if (st >= 26 && st <= 28) {
            float lat = vLocalPosition.y / length(vLocalPosition);
            float warp = snoise(p * 0.8 + uTime * 0.02);
            float bands = sin(lat * 15.0 + warp * 4.0) * 0.5 + 0.5;
            float fine = sin(lat * 40.0 - warp * 2.0) * 0.5 + 0.5;
            
            vec3 baseA = uColor * 0.6; vec3 baseB = uColor * 1.4;
            if (st == 27) { baseA = vec3(0.8, 0.3, 0.1); baseB = vec3(1.0, 0.6, 0.2); } // Hot
            else if (st == 28) { baseA = vec3(0.2, 0.5, 0.8); baseB = vec3(0.6, 0.8, 1.0); } // Cold
            
            surfaceColor = mix(baseA, baseB, mix(bands, fine, 0.3));
            
            if (uShowWeather > 0.5) {
              vec3 stormPos = normalize(vec3(1.0, -0.2, 0.5));
              float stormDist = distance(normalize(vLocalPosition), stormPos);
              if (stormDist < 0.4) {
                float swirl = atan(vLocalPosition.z, vLocalPosition.x) * 3.0;
                float vortex = snoise(p * 8.0 + vec3(0, swirl + uTime * 0.1, 0));
                float eye = smoothstep(0.4, 0.0, stormDist);
                surfaceColor = mix(surfaceColor, baseB * 1.5, eye * (vortex * 0.5 + 0.5) * 0.7);
                surfaceColor *= (1.0 - eye * 0.3);
              }
            }
            atmoColor = baseB; atmoDensity = 1.3; roughness = 0.95;

          // 22: Broken, 23: Shattered, 31: Asteroid
          } else if (st == 22 || st == 23 || st == 31) {
             float rock = fbm(p * 12.0, 5);
             surfaceColor = mix(vec3(0.3, 0.28, 0.26), vec3(0.5, 0.48, 0.45), rock);
             if (st == 22) { // Broken (glowing core fissures)
                float fissures = smoothstep(0.7, 0.8, fbm(p * 4.0, 3));
                surfaceColor = mix(surfaceColor, vec3(1.0, 0.3, 0.0), fissures);
                cityGlow = vec3(1.0, 0.3, 0.0) * fissures * 3.0; // Exposed core glow
             }
             atmoDensity = 0.0; roughness = 0.95;

          // 32: Station
          } else if (st == 32) {
             float panels = step(0.95, fract(vUv.x * 20.0)) + step(0.95, fract(vUv.y * 20.0));
             surfaceColor = mix(vec3(0.4, 0.42, 0.45), vec3(0.2, 0.22, 0.25), panels);
             if (uShowCityLights > 0.5) cityGlow = vec3(1.0, 0.8, 0.5) * panels * 2.0;
             atmoDensity = 0.0; roughness = 0.4;
          // 29, 30: Moons, 34: Rogue
          } else {
             float rockBase = fbm(p * 4.0, 5);
             float craters = pow(max(0.0, snoise(p * 8.0)), 3.0) * 0.4;
             if (st == 34) { // Rogue
               vec3 baseCrust = mix(vec3(0.04, 0.04, 0.06), vec3(0.10, 0.10, 0.14), rockBase);
               vec3 internalGlow = mix(vec3(0.15, 0.05, 0.25), vec3(0.05, 0.05, 0.30), rockBase);
               surfaceColor = mix(baseCrust, internalGlow, smoothstep(0.6, 0.9, rockBase) * 0.5);
               float veins = step(0.82, fbm(p * 20.0, 4) * 0.5 + 0.5);
               surfaceColor = mix(surfaceColor, vec3(0.3, 0.1, 0.6), veins * 0.4);
               cityGlow = vec3(0.3, 0.1, 0.6) * veins * 0.6; atmoColor = vec3(0.3, 0.1, 0.5); atmoDensity = 0.05;
             } else {
               surfaceColor = mix(vec3(0.25, 0.26, 0.28), vec3(0.45, 0.46, 0.48), rockBase);
               surfaceColor -= craters;
               atmoDensity = 0.0;
             }
             roughness = 0.9;
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
          
          // Night mask: only show city/bioluminescence lights on the dark side, with a soft transition
          float nightMask = smoothstep(0.1, -0.25, nDotL);
          
          // --- WEATHER SYSTEM (CLOUDS) MODE ---
          if (uIsWeather > 0.5) {
            float timeScale = 0.015;
            float noiseScale = 2.5;
            int octaves = 4;
            
            // Adjust pattern based on planet type
            if (st == 26 || st == 27 || st == 28) { // Gas Giants: Fast, banded clouds
              timeScale = 0.04;
              noiseScale = 1.2;
              octaves = 5;
            } else if (st == 20 || st == 1) { // Molten/Desert: Thin, swift heat-haze/dust
              timeScale = 0.06;
              noiseScale = 4.0;
              octaves = 2;
            } else if (st == 7 || st == 19) { // Arctic/Frozen: Sluggish heavy frost-clouds
              timeScale = 0.005;
              noiseScale = 1.8;
              octaves = 3;
            } else if (st == 6 || st == 10) { // Tropical/Gaia: Dense, slow swirling storm cells
              timeScale = 0.01;
              noiseScale = 3.5;
              octaves = 6;
            }
            
            vec3 weatherP = p;
            if (st >= 26 && st <= 28) { // Gas giant banding warping
              weatherP.y *= 2.0;
            }
            
            float cloudNoise = fbm(weatherP * noiseScale + uTime * timeScale, octaves);
            float cloudDensity = smoothstep(0.4, 0.7, cloudNoise);
            
            // Different cloud colors based on planet type
            vec3 cloudCol = vec3(0.9, 0.95, 1.0); // Standard white/blue
            if (st == 20 || st == 18) cloudCol = vec3(0.8, 0.7, 0.4); // Sulfuric/Ash
            else if (st == 14 || st == 25) cloudCol = vec3(0.3, 0.8, 0.2); // Hive/Bio-haze
            else if (st == 21) cloudCol = vec3(0.6, 0.3, 0.8); // Psionic
            else if (st == 1) cloudCol = vec3(0.85, 0.75, 0.6); // Sandstorms
            
            float shadow = smoothstep(0.3, -0.1, nDotL) * 0.4;
            gl_FragColor = vec4(cloudCol * (diff + 0.15), cloudDensity * (1.0 - shadow));
            return;
          }

          vec3 finalRGB = (surfaceColor * diff) + specular + (atmoGlow * 1.2) + (rim * atmoColor) + (cityGlow * nightMask * uShowCityLights);
          
          // Night side ambient
          finalRGB += surfaceColor * 0.02;

          gl_FragColor = vec4(finalRGB, 1.0);
        }
      `}
    />
  );
}
