import { useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CameraControls, Html, PerspectiveCamera, Line, Billboard } from "@react-three/drei";
import { Rocket } from "lucide-react";
import * as THREE from "three";
import type { Galaxy, StarSystem, Body, Sector } from "@/galaxy/types";
import type { FilterState, ViewMode } from "@/galaxy/useGalaxyApp";
import { SpaceBackground } from "./SpaceBackground";
import { StarVisual } from "./StarVisual";
import { PlanetMaterial } from "./PlanetMaterial";
import { PlanetaryRing } from "./PlanetaryRing";
import { STAR_LUMINOSITY, STAR_META, STAR_BASE_SIZE, getOrbitalSpeed } from "@/galaxy/meta";

const tempVec = new THREE.Vector3();
const tempVec2 = new THREE.Vector3();
const tempVec3 = new THREE.Vector3();
const tempVec4 = new THREE.Vector3();

interface Props {
  galaxy: Galaxy;
  view: ViewMode;
  system: StarSystem | null;
  body: Body | null;
  filters: FilterState;
  onSelectSystem: (id: string) => void;
  onSelectBody: (id: string) => void;
  onHoverSystem: (id: string | null) => void;
  hoverSystemId: string | null;
  fogOfWar: boolean;
  exploredSystemIds: Set<string>;
  knownSystemIds: Set<string>;
  systemMatchesFilter: (s: StarSystem) => boolean;
  currentSystemId?: string;
  travel?: any;
  isMobilePanelExpanded?: boolean;
  graphicsQuality?: "low" | "medium" | "high";
}

/** 
 * UNIFIED MAP: A single seamless coordinate space for the entire galaxy.
 * 
 * Coordinate Logic:
 * - Systems are at their galaxy pos [x, y, z].
 * - Planets are at system.pos + orbital_pos.
 * - This allows seamless zooming.
 */
export function UnifiedMap(props: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="w-full h-full bg-black">
      <Canvas 
        dpr={props.graphicsQuality === "low" ? 1 : props.graphicsQuality === "medium" ? [1, 1.25] : [1, 1.75]} 
        gl={{ 
          antialias: props.graphicsQuality !== "low",
          powerPreference: "high-performance"
        }}
        camera={{ far: 15000, near: 1 }}
      >
        <MapContent {...props} containerRef={containerRef} />
      </Canvas>
    </div>
  );
}

function MapContent({ 
  galaxy, view, system, body, filters, 
  onSelectSystem, onSelectBody, onHoverSystem, hoverSystemId, 
  fogOfWar, exploredSystemIds, knownSystemIds, systemMatchesFilter,
  currentSystemId, travel, isMobilePanelExpanded, containerRef, graphicsQuality
}: Props & { containerRef: React.RefObject<HTMLDivElement> }) {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);

  // Transition camera when view changes
  useEffect(() => {
    if (!controlsRef.current) return;

    if (view === "galaxy") {
      // ONLY if we just entered galaxy view
      controlsRef.current.setLookAt(0, 400, 500, 0, 0, 0, true);
    } else if (view === "system" && system) {
      // Dynamically calculate altitude based on system size
      const maxOrbit = system.bodies.reduce((max, b) => Math.max(max, b.orbit), 0) || 150;
      const vFov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
      
      // Calculate required height to fit the entire orbital plane with 20% margin
      const padding = 1.2;
      const aspect = window.innerWidth / window.innerHeight;
      const radiusToFit = maxOrbit * padding;
      
      // Use the limiting dimension (vertical or horizontal) to ensure it fits
      const heightForVerticalFit = radiusToFit / Math.tan(vFov / 2);
      const heightForHorizontalFit = (radiusToFit / aspect) / Math.tan(vFov / 2);
      const idealHeight = Math.max(800, heightForVerticalFit, heightForHorizontalFit);

      controlsRef.current.setLookAt(
        0, idealHeight, 1, 
        0, 0, 0,
        true
      );
    }
    // Body zoom is now handled by PlanetNode's internal tracking for better precision
  }, [view, system?.id, body?.id, camera]);

  // Keyboard movement keys
  const keys = useRef<Record<string, boolean>>({});
  useEffect(() => {
    const down = (e: KeyboardEvent) => keys.current[e.key.toLowerCase()] = true;
    const up = (e: KeyboardEvent) => keys.current[e.key.toLowerCase()] = false;
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Use standard CameraControls DOLLY for zooming.
  // This guarantees the camera moves exactly along its view vector without shifting the target's Y-elevation.
  useEffect(() => {
    // We previously had a custom zoom-to-cursor script here. 
    // It has been removed to satisfy "zooming should only move the camera directly in the direction it is in"
  }, []);

  // Priority 1 ensures this runs AFTER PlanetNode's useFrame (priority 0)
  // This eliminates the 1-frame lag (ghosting) when tracking moving bodies.
  useEffect(() => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    
    // Configure mouse buttons: 
    // Left: Rotate
    // Middle: Dolly (Zoom)
    // Right: Truck (Pan) - Force to XZ plane
    controls.mouseButtons.right = 2; // ACTION.TRUCK
    controls.touches.two = 2; // ACTION.TOUCH_TRUCK (Two fingers pan on mobile)
    controls.touches.three = 2; // ACTION.TOUCH_TRUCK
    controls.screenSpacePanning = false; // CRITICAL: Pan on the XZ plane, not screen XY
  }, []);

  const targetOffsetRef = useRef(0);
  useFrame((_state, delta) => {
    if (!controlsRef.current) return;

    // Handle Mobile Projection Offset (Film Offset) 
    // This shifts the "visible area" to keep objects above the info panel 
    // WITHOUT moving the world target, so the system remains stationary during rotation.
    let targetViewPercentage = 0;
    if (isMobilePanelExpanded) {
      if (view === "galaxy") targetViewPercentage = 0.28; // Galaxy core needs a high shift
      else if (view === "system") targetViewPercentage = 0.20;
      else if (view === "body") targetViewPercentage = 0.25; // Planets need significant clearance
    }
    
    const targetViewOffset = targetViewPercentage * window.innerHeight;
    targetOffsetRef.current = THREE.MathUtils.lerp(targetOffsetRef.current, targetViewOffset, 0.1);
    
    if (Math.abs(targetOffsetRef.current) > 0.1) {
      camera.setViewOffset(
        window.innerWidth, window.innerHeight,
        0, targetOffsetRef.current,
        window.innerWidth, window.innerHeight
      );
    } else {
      camera.clearViewOffset();
    }

    // Keyboard movement across the XZ plane (speed scales with height)
    const isSprinting = keys.current["shift"];
    const kSpeed = Math.max(2, controlsRef.current.camera.position.y) * (isSprinting ? 2.4 : 0.8);
    const move = new THREE.Vector3();
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();

    controlsRef.current.camera.getWorldDirection(forward);
    forward.y = 0;
    
    // Safety: If looking straight down, use the camera's actual local UP vector to determine "forward" on the plane
    if (forward.lengthSq() < 0.001) {
      forward.set(0, 1, 0).applyQuaternion(controlsRef.current.camera.quaternion);
      forward.y = 0;
    }
    
    forward.normalize();
    right.crossVectors(forward, controlsRef.current.camera.up).normalize();

    if (keys.current["w"] || keys.current["arrowup"]) move.addScaledVector(forward, kSpeed * delta);
    if (keys.current["s"] || keys.current["arrowdown"]) move.addScaledVector(forward, -kSpeed * delta);
    if (keys.current["a"] || keys.current["arrowleft"]) move.addScaledVector(right, -kSpeed * delta);
    if (keys.current["d"] || keys.current["arrowright"]) move.addScaledVector(right, kSpeed * delta);

    if (move.length() > 0) {
      const target = new THREE.Vector3();
      controlsRef.current.getTarget(target);
      controlsRef.current.moveTo(target.x + move.x, target.y + move.y, target.z + move.z, true);
    }

    if (keys.current["q"]) controlsRef.current.elevate(kSpeed * delta, true);
    if (keys.current["e"]) controlsRef.current.elevate(-kSpeed * delta, true);
    
    // Safety check: Constrain camera and target to the galactic plane during panning
    const currentTarget = new THREE.Vector3();
    const currentPos = new THREE.Vector3();
    controlsRef.current.getTarget(currentTarget);
    controlsRef.current.getPosition(currentPos);
    
    const expectedY = 0; // Everything is centered at 0 in world-space (either galaxy center or shifted star center)
    const dy = currentTarget.y - expectedY;
    
    // Only apply safety snapping if NOT focused on an object, to prevent jitter-fighting.
    if (!body && Math.abs(dy) > 0.001) {
      // If the target moved vertically (due to screen-space trucking), 
      // shift both camera and target back to the plane.
      // This preserves the look-angle and distance while forcing the movement to be XZ-only.
      controlsRef.current.setTarget(currentTarget.x, expectedY, currentTarget.z, false);
      controlsRef.current.setPosition(currentPos.x, currentPos.y - dy, currentPos.z, false);
    }
    
    // Dynamically calculate the minimum distance to prevent hitting the floor.
    // This stops the camera from sliding along the floor (which alters tilt/elevation).
    const polar = controlsRef.current.polarAngle;
    const cosP = Math.max(0.001, Math.cos(polar));
    controlsRef.current.minDistance = 0.2 / cosP;
  });

  const isShifted = view !== "galaxy" && system;
  const shiftX = isShifted ? system.pos[0] : 0;
  const shiftY = isShifted ? system.pos[1] : 0;
  const shiftZ = isShifted ? system.pos[2] : 0;

  return (
    <>
      <CameraControls 
        ref={controlsRef} 
        makeDefault 
        minDistance={0.5} 
        maxDistance={10000}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2}
        smoothTime={body ? 0 : 0.4}
        dollySpeed={1.0}
      />
        <PerspectiveCamera makeDefault position={[0, 400, 500]} far={20000} near={0.1} />
        <SpaceBackground starType={system?.starType} view={view} quality={graphicsQuality} />
        <ambientLight intensity={0.05} />

        {/* 1. Galactic Infrastructure (Only in Galaxy View) */}
        {view === "galaxy" && (
          <>
            <HyperlaneLines 
              galaxy={galaxy} 
              filters={filters} 
              matches={systemMatchesFilter} 
              fogOfWar={fogOfWar}
              knownSystemIds={knownSystemIds}
            />
            {filters.layers.has("sectorBorders") && <SectorBorders sectors={galaxy.sectors} />}
          </>
        )}

        <group position={[-shiftX, -shiftY, -shiftZ]}>
        {/* 2. Star Systems */}
        {galaxy.systems
          .filter(s => view === "galaxy" ? (systemMatchesFilter(s) || s.id === system?.id) : s.id === system?.id)
          .map((s) => (
          <SystemNode 
            key={s.id}
            system={s}
            galaxy={galaxy}
            view={view}
            controlsRef={controlsRef}
            isFocused={system?.id === s.id}
            isBodyFocused={body?.systemId === s.id}
            focusedBodyId={body?.id}
            onSelect={() => onSelectSystem(s.id)}
            onSelectBody={onSelectBody}
            filters={filters}
            isExplored={!fogOfWar || exploredSystemIds.has(s.id)}
            isKnown={!fogOfWar || knownSystemIds.has(s.id)}
            isPlayerHere={s.id === currentSystemId}
            isMobilePanelExpanded={isMobilePanelExpanded}
            quality={graphicsQuality}
          />
        ))}

        <PlayerFleetVisual 
          galaxy={galaxy} 
          playerSystemId={currentSystemId} 
          viewedSystemId={system?.id || null}
          travel={travel}
          view={view}
          controlsRef={controlsRef}
          focusedBodyId={body?.id}
          onSelect={() => onSelectBody("ship")}
        />
      </group>
    </>
  );
}

function SystemNode({ system, galaxy, view, controlsRef, isFocused, isBodyFocused, focusedBodyId, onSelect, onSelectBody, filters, isExplored, isKnown, isPlayerHere, isMobilePanelExpanded, quality }: any) {
  const { camera } = useThree();
  const starGroupRef = useRef<THREE.Group>(null);
  const htmlGroupRef = useRef<THREE.Group>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const hitboxRef = useRef<THREE.Mesh>(null);
  const [isNear, setIsNear] = useState(false);
  
  // Core is always visible/explored
  const explored = isExplored || system.id === "sys-center";
  const known = isKnown || system.id === "sys-center";
  const baseStarScale = system.id === "sys-center" ? 4.5 : 2.4;
  
  // Pre-calculate system vector to avoid instantiation in useFrame
  const sysPos = useMemo(() => new THREE.Vector3(...system.pos), [system.pos]);
  
  // Throttled distance check for performance
  const frameCount = useRef(Math.floor(Math.random() * 10)); 
  useFrame((state) => {
    // Only check distance every 10 frames if not focused for huge performance gain on mobile
    if (!isFocused && frameCount.current++ % 10 !== 0) return;

    const d = state.camera.position.distanceTo(sysPos);
    const safeD = Math.max(0.1, d); // Prevent division by zero
    
    const currentScale = isFocused ? baseStarScale : Math.min(20.0, Math.max(baseStarScale, safeD / 250));
    
    if (starGroupRef.current) {
      starGroupRef.current.scale.setScalar(currentScale / baseStarScale);
    }
    
    if (hitboxRef.current) {
      // Ensure hitbox has a minimum screen-space size (approx 48px diameter)
      const vFov = (state.camera as THREE.PerspectiveCamera).fov * Math.PI / 180;
      const screenH = window.innerHeight;
      const minHitRadius = 24; // 24px radius
      const hitScale = (minHitRadius * 2 * Math.tan(vFov / 2) * safeD) / screenH;
      hitboxRef.current.scale.setScalar(Math.max(1.0, hitScale / (baseStarScale * 3.5)));
    }
    
    if (htmlGroupRef.current) {
      // In galaxy view we can offset by world Y, but in system view (top-down) 
      // we rely on the CSS transform below. We set Y to 0 to avoid depth-fighting.
      htmlGroupRef.current.position.y = view === "galaxy" ? -currentScale - 4.5 : 0;
    }
    
    if (labelRef.current) {
      const op = (view === "galaxy") ? Math.max(0, 1 - (safeD - 400) / 600) : (isFocused ? 1 : 0);
      labelRef.current.style.opacity = op.toString();
      
      const vFov = (state.camera as THREE.PerspectiveCamera).fov * Math.PI / 180;
      const screenH = window.innerHeight;
      const screenRadius = (currentScale / (2 * Math.tan(vFov / 2) * safeD)) * screenH;
      // Increased offset to 24px to ensure it clears the star aura
      labelRef.current.style.transform = `translateY(${screenRadius + 24}px)`;
    }

    // Performance: Only render the expensive Html component if we are relatively close
    // On mobile, rendering 1000 HTML elements will crash the browser. 
    // Increased radius based on user feedback to balance visibility and performance.
    const isLow = quality === "low";
    const threshold = isLow ? 300 : 400;
    const isCamTooHigh = state.camera.position.y > 2500;
    const shouldBeNear = safeD < threshold && !isCamTooHigh;
    if (shouldBeNear !== isNear) setIsNear(shouldBeNear);
  });

  if (!known && !isFocused) return null; // Hidden in Fog of War

  // Only show details (planets, orbits) if explicitly focused in system or body view
  const showDetails = isFocused && (view === "system" || view === "body");

  return (
    <group position={system.pos}>
      <group ref={starGroupRef}>
        <StarVisual 
          type={system.starType} 
          scale={baseStarScale} 
          detailed={showDetails} 
          grayscale={!explored}
          quality={quality}
          onClick={(e: any) => { e.stopPropagation(); onSelect(); }}
          onPointerOver={() => { document.body.style.cursor = "pointer"; }}
          onPointerOut={() => { document.body.style.cursor = "default"; }}
        />
        {/* Invisible Hitbox for easier selection — Billboard ensures it's always a flat disk facing the camera */}
        <Billboard>
          <mesh 
            ref={hitboxRef}
            onClick={(e: any) => { e.stopPropagation(); onSelect(); }}
            onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
            onPointerOut={() => { document.body.style.cursor = "default"; }}
          >
            <planeGeometry args={[baseStarScale * 3.5, baseStarScale * 3.5]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        </Billboard>
      </group>
      


      {showDetails && (
        <>
          <pointLight 
            color={`#${STAR_META[system.starType]?.hex || "ffffff"}`} 
            intensity={15} 
            distance={3000} 
            decay={1.5} 
          />
          {system.bodies
            .filter(b => !b.parentId) // Only top-level planets/stations
            .map((b: Body) => (
            <PlanetNode 
              key={b.id} 
              body={b} 
              view={view}
              controlsRef={controlsRef}
              isFocused={focusedBodyId === b.id}
              filters={filters}
              onSelect={() => onSelectBody(b.id)} 
              onSelectBody={onSelectBody}
              focusedBodyId={focusedBodyId}
              starWorldPos={new THREE.Vector3(...system.pos)}
              starType={system.starType}
              isMobilePanelExpanded={isMobilePanelExpanded}
              quality={quality}
            >
              {system.bodies
                .filter(m => m.parentId === b.id)
                .map(m => (
                  <PlanetNode 
                    key={m.id} 
                    body={m} 
                    parentBody={b}
                    view={view}
                    controlsRef={controlsRef}
                    isFocused={focusedBodyId === m.id}
                    filters={filters}
                    onSelect={() => onSelectBody(m.id)} 
                    starType={system.starType}
                    starWorldPos={new THREE.Vector3(...system.pos)}
                    isMobilePanelExpanded={isMobilePanelExpanded}
                    quality={quality}
                  />
                ))}
            </PlanetNode>
          ))}
          {/* Orbits */}
          {filters.layers.has("orbitPaths") && system.bodies.map((b: Body) => (
            !b.parentId && (
              <DynamicOrbit 
                key={`orbit-${b.id}`} 
                radius={b.orbit} 
                color="white" 
                systemPos={new THREE.Vector3(...system.pos)}
              />
            )
          ))}
          <JumpGateMarkers system={system} galaxy={galaxy} onSelect={onSelectBody} />
          
          {/* Stellar Temperature Zones Overlay - Smooth Gradient Shader */}
          {filters.layers.has("habitableZones") && (() => {
            const lPow = Math.pow(STAR_LUMINOSITY[system.starType] || 1, 0.3);
            const inner = Math.max(12, 10 * lPow);
            const hotEnd = 64.34 * lPow;
            const tempEnd = 96 * lPow;
            
            // Calculate system extent for the cold zone fade
            const maxOrbit = system.bodies.reduce((max: number, b: Body) => Math.max(max, b.orbit), 0);
            const coldEnd = Math.max(tempEnd + 50, maxOrbit + 80);

            const uniforms = {
              uInner: { value: inner },
              uHotEnd: { value: hotEnd },
              uTempEnd: { value: tempEnd },
              uColdEnd: { value: coldEnd },
            };

            return (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[inner, coldEnd + 50, 128]} />
                <shaderMaterial
                  transparent
                  depthWrite={false}
                  side={THREE.DoubleSide}
                  uniforms={uniforms}
                  vertexShader={`
                    varying vec3 vPos;
                    void main() {
                      vPos = position;
                      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                  `}
                  fragmentShader={`
                    varying vec3 vPos;
                    uniform float uInner;
                    uniform float uHotEnd;
                    uniform float uTempEnd;
                    uniform float uColdEnd;

                    void main() {
                      float d = length(vPos);
                      vec3 col;
                      float alpha = 0.0;

                      if (d < uHotEnd) {
                        col = vec3(0.94, 0.27, 0.27); // Red
                        alpha = mix(0.15, 0.1, smoothstep(uInner, uHotEnd, d));
                      } else if (d < uTempEnd) {
                        col = vec3(0.06, 0.72, 0.51); // Green
                        alpha = 0.22;
                      } else {
                        col = vec3(0.23, 0.51, 0.96); // Blue
                        alpha = mix(0.15, 0.0, smoothstep(uColdEnd - 60.0, uColdEnd, d));
                        if (d > uColdEnd) discard;
                      }

                      // Soft edges at zone boundaries
                      float edge1 = smoothstep(uHotEnd - 2.0, uHotEnd + 2.0, d);
                      float edge2 = smoothstep(uTempEnd - 2.0, uTempEnd + 2.0, d);
                      
                      gl_FragColor = vec4(col, alpha);
                    }
                  `}
                />
              </mesh>
            );
          })()}
        </>
      )}

      {/* Labels - Optimized with distance culling */}
      {filters.layers.has("objectLabels") && (isNear || isFocused) && (
        <group ref={htmlGroupRef} position={[0, 0, 0]}>
          <Html center zIndexRange={[100, 0]}>
            <div 
              ref={labelRef}
              className="px-1 h-[12px] flex items-center justify-center bg-black/40 rounded-sm pointer-events-none whitespace-nowrap transition-opacity duration-300"
              style={{ opacity: 0 }}
            >
              <span className="font-mono-hud text-[7px] leading-none uppercase tracking-wider text-primary/60">
                {system.name}
              </span>
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}

function Clouds({ radius, opacity = 0.35, quality = "high" }: { radius: number; opacity?: number; quality?: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state, dt) => {
    if (ref.current) {
      ref.current.rotation.y += dt * 0.04;
      ref.current.rotation.x += dt * 0.01;
    }
  });

  if (quality === "low") return null; // Skip clouds on low

  return (
    <mesh ref={ref} scale={1.012}>
      <sphereGeometry args={[radius, quality === "medium" ? 32 : 64, quality === "medium" ? 32 : 64]} />
      <meshStandardMaterial
        color="#ffffff"
        transparent
        opacity={opacity}
        alphaTest={0.02}
        depthWrite={false}
      />
    </mesh>
  );
}

function PlanetNode({ body, parentBody, view, controlsRef, isFocused, onSelect, children, onSelectBody, focusedBodyId, starWorldPos, starType, filters, isMobilePanelExpanded, quality }: any) {
  const { camera } = useThree();
  const meshRef = useRef<THREE.Group>(null);
  const sphereRef = useRef<THREE.Object3D>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const hitboxRef = useRef<THREE.Mesh>(null);
  const lastWorldPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const hasInitialPosRef = useRef(false);
  const lightDirRef = useRef(new THREE.Vector3(1, 0.5, 1).normalize());
  const angle = body.phase || 0;
  
  // Deterministic rotation seed
  const rotationSeed = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < body.id.length; i++) hash = (hash << 5) - hash + body.id.charCodeAt(i);
    return Math.abs(hash % 100) / 100;
  }, [body.id]);

  // Analytical tracking to eliminate jitter.
  // IMPORTANT: `t` is captured ONCE and reused for both the mesh position and camera tracking.
  // Calling performance.now() twice in the same frame produces different values, causing jitter.
  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Single timestamp for this entire frame — mesh and camera MUST use the same value.
    const t = performance.now() / 1000;

    const speed = getOrbitalSpeed(body.orbit, starType, !!body.parentId);
    const currentAngle = (body.phase || 0) + (t * speed) % (Math.PI * 2);
    
    // Position relative to parent (star or planet)
    meshRef.current.position.set(
      Math.cos(currentAngle) * body.orbit,
      0,
      Math.sin(currentAngle) * body.orbit
    );

    // Force update of full parent chain so getWorldPosition is accurate for moons and planets
    meshRef.current.updateWorldMatrix(true, false);

    // High-precision Light Direction
    meshRef.current.getWorldPosition(tempVec);
    lightDirRef.current.copy(tempVec).normalize().multiplyScalar(-1);

    // Camera Tracking: use the mesh's ACTUAL world position (already computed above via getWorldPosition).
    // This guarantees zero divergence between where the mesh is and where the camera looks.
    if (isFocused && view === "body" && controlsRef.current) {
      const controls = controlsRef.current;
      controls.smoothTime = 0;

      if (!hasInitialPosRef.current) {
        const zoomDist = body.size * 12;
        controls.setLookAt(
          tempVec.x, tempVec.y + zoomDist * 0.6, tempVec.z + zoomDist,
          tempVec.x, tempVec.y, tempVec.z,
          true
        );
        hasInitialPosRef.current = true;
      } else {
        // moveTo keeps the camera's angle and distance while moving the orbit center
        // to the body's exact current world position — no formula, no drift.
        controls.moveTo(tempVec.x, tempVec.y, tempVec.z, false);
      }
    } else {
      hasInitialPosRef.current = false;
    }

    if (sphereRef.current) {
      const daySpeed = body.type === "gas_giant" ? 0.4 + rotationSeed * 0.4 : 0.08 + rotationSeed * 0.1;
      sphereRef.current.rotation.y = state.clock.elapsedTime * daySpeed;
    }

    if (hitboxRef.current) {
      // Dynamically scale hitbox to maintain a constant target screen-space radius
      // This makes planets easy to click when zoomed out AND prevents overlap when zoomed in.
      const d = state.camera.position.distanceTo(meshRef.current!.getWorldPosition(new THREE.Vector3()));
      const safeD = Math.max(0.1, d);
      const vFov = (state.camera as THREE.PerspectiveCamera).fov * Math.PI / 180;
      const screenH = window.innerHeight;
      // Target: planet's visual size + a small fixed padding in screen pixels
      const targetScreenRadius = Math.max(18, body.size * 12); // px — shrinks relative to planet at close range
      // Convert screen pixels → world units at this distance
      const targetWorldSize = (targetScreenRadius * 2 * Math.tan(vFov / 2) * safeD) / screenH;
      // Divide by the plane's base size to get the scale multiplier.
      // We clamp MIN to 1.0 so the hitbox is never smaller than the actual object,
      // and MAX to 6.0 to prevent overlapping neighboring bodies when zoomed out.
      const baseSize = body.size * 2.0;
      hitboxRef.current.scale.setScalar(Math.max(1.0, Math.min(6.0, targetWorldSize / baseSize)));
    }

    if (labelRef.current && view !== "galaxy") {
      meshRef.current.getWorldPosition(tempVec3);
      const d = camera.position.distanceTo(tempVec3);
      const vFov = (camera as THREE.PerspectiveCamera).fov * Math.PI / 180;
      const screenH = window.innerHeight;
      const sizeToUse = (body.hasRings && body.type === "gas_giant") ? body.size * 2.25 : body.size;
      const screenRadius = (sizeToUse / (2 * Math.tan(vFov / 2) * d)) * screenH;
      labelRef.current.style.transform = `translateY(${screenRadius + 8}px)`;
    }
  });

  const visualSize = body.size;
  const atmoColor = useMemo(() => new THREE.Color().setHSL((body.hue + 30) / 360, 0.5, 0.6), [body.hue]);
  const ringColor = useMemo(() => {
    if (!body.hasRings) return new THREE.Color();
    return new THREE.Color().setHSL((body.ringHue ?? 30) / 360, 0.35, 0.55);
  }, [body.hasRings, body.ringHue]);

  return (
    <group ref={meshRef}>
      {body.subtype === "station" ? (
        <group ref={sphereRef as any}>
          {/* Central Hub */}
          <mesh>
            <cylinderGeometry args={[visualSize * 0.35, visualSize * 0.35, visualSize * 2.5, 16]} />
            <meshStandardMaterial color="#7a8a9e" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Solar Panels / Radiators */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[visualSize * 3.8, visualSize * 0.1, visualSize * 1.2]} />
            <meshStandardMaterial color="#1a2538" metalness={0.9} roughness={0.2} emissive="#0d1b2a" emissiveIntensity={0.5} />
          </mesh>
          {/* Habitat Ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[visualSize * 1.4, visualSize * 0.25, 16, 48]} />
            <meshStandardMaterial color="#a0b0c0" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Docking Bay / Engineering Glow */}
          <mesh position={[0, visualSize * 1.3, 0]}>
            <cylinderGeometry args={[visualSize * 0.45, visualSize * 0.45, visualSize * 0.25, 16]} />
            <meshStandardMaterial color="#3a4a5a" emissive="#00ffff" emissiveIntensity={1.2} />
          </mesh>
        </group>
      ) : (
        <mesh 
          ref={sphereRef as any}
          scale={body.subtype === "asteroid" ? [1.0 + rotationSeed * 0.4, 1.0 + (1.0 - rotationSeed) * 0.2, 1.0 + rotationSeed * 0.3] : [1, 1, 1]}
        >
          {body.subtype === "asteroid" ? (
            // Smaller asteroids are more irregular; larger ones become spherical due to gravity.
            <dodecahedronGeometry args={[visualSize, body.size < 1.0 ? 0 : (body.size < 1.5 ? 1 : 2)]} />
          ) : (
            <sphereGeometry args={[visualSize, quality === "low" ? 16 : (quality === "medium" ? 32 : 64), quality === "low" ? 16 : (quality === "medium" ? 32 : 64)]} />
          )}
          <PlanetMaterial 
            subtype={body.subtype} 
            hue={body.hue} 
            lightDir={lightDirRef.current}
            color={new THREE.Color(`#${STAR_META[starType]?.hex || "ffffff"}`)}
            showWeather={filters.layers.has("weatherSystems")}
            showCityLights={filters.layers.has("cityLights")}
            quality={quality}
          />
        </mesh>
      )}

      {/* Invisible Hitbox for easier selection — Billboard ensures it's always a flat disk facing the camera */}
      <Billboard>
        <mesh 
          ref={hitboxRef}
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
          onPointerOut={() => { document.body.style.cursor = "default"; }}
        >
          <planeGeometry args={[visualSize * 2.0, visualSize * 2.0]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </Billboard>

      {/* Premium Atmospheric Effects */}
      {(body.type === "terrestrial" || body.type === "gaia" || body.subtype === "temperate") && (
        <>
          {filters.layers.has("weatherSystems") && <Clouds radius={visualSize} quality={quality} />}
          {/* Main Atmosphere */}
          <mesh scale={1.025}>
            <sphereGeometry args={[visualSize, quality === "low" ? 16 : 32, quality === "low" ? 16 : 32]} />
            <meshBasicMaterial
              color={atmoColor}
              transparent
              opacity={0.18}
              side={THREE.BackSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          {/* Outer Glow */}
          <mesh scale={1.08}>
            <sphereGeometry args={[visualSize, 32, 32]} />
            <meshBasicMaterial
              color={atmoColor}
              transparent
              opacity={0.06}
              side={THREE.BackSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </>
      )}

      {/* Planetary Rings — rendered as sibling so they don't spin with the planet */}
      {body.hasRings && body.type === "gas_giant" && (
        <PlanetaryRing
          radius={visualSize}
          innerRadius={visualSize * 1.35}
          outerRadius={visualSize * 2.25}
          color={ringColor}
        />
      )}

      {/* Body Label */}
      {view !== "galaxy" && filters.layers.has("objectLabels") && (
        <Html position={[0, 0, 0]} center zIndexRange={[100, 0]}>
          <div ref={labelRef} className="px-1 h-[10px] flex items-center justify-center bg-black/30 rounded-sm pointer-events-none whitespace-nowrap">
            <span className="font-mono-hud text-[6px] leading-none uppercase tracking-wider text-primary/50">
              {body.name}
            </span>
          </div>
        </Html>
      )}

      {/* Moon Orbits relative to planet */}
      {children && (
        <>
          {filters.layers.has("orbitPaths") && children.map((c: any) => (
            <mesh key={`orbit-line-${c.props.body.id}`} rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[c.props.body.orbit - 0.02, c.props.body.orbit + 0.02, 32]} />
              <meshBasicMaterial color="white" transparent opacity={0.08} side={THREE.DoubleSide} />
            </mesh>
          ))}
          {children}
        </>
      )}
    </group>
  );
}

/* ---------- Hyperlanes ---------- */
function HyperlaneLines({ galaxy, filters, matches, fogOfWar, knownSystemIds }: { 
  galaxy: Galaxy; 
  filters: FilterState; 
  matches: (s: StarSystem) => boolean;
  fogOfWar: boolean;
  knownSystemIds: Set<string>;
}) {
  const { camera } = useThree();
  const show = filters.layers.has("hyperlanes");
  

  const laneData = useMemo(() => {
    if (!show) return new Float32Array(0);
    
    const validLanes = [];
    for (const lane of galaxy.hyperlanes) {
      const a = galaxy.systemById[lane.a];
      const b = galaxy.systemById[lane.b];
      if (!a || !b) continue;

      if (fogOfWar) {
        const aKnown = knownSystemIds.has(a.id) || a.id === "sys-center";
        const bKnown = knownSystemIds.has(b.id) || b.id === "sys-center";
        if (!aKnown || !bKnown) continue;
      }

      if (!matches(a) && !matches(b)) continue;
      validLanes.push(a.pos, b.pos);
    }

    const array = new Float32Array(validLanes.length * 3);
    for (let i = 0; i < validLanes.length; i++) {
      array[i * 3 + 0] = validLanes[i][0];
      array[i * 3 + 1] = validLanes[i][1];
      array[i * 3 + 2] = validLanes[i][2];
    }
    return array;
  }, [galaxy, show, matches, fogOfWar, knownSystemIds]);

  if (!show || laneData.length === 0) return null;

  return (
    <lineSegments frustumCulled={true}>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          count={laneData.length / 3}
          array={laneData}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial 
        color="#2bd4e8" 
        transparent 
        opacity={0.3} 
        blending={THREE.AdditiveBlending} 
        depthWrite={false} 
      />
    </lineSegments>
  );
}

/* ---------- Sector Borders (Voronoi) ---------- */
function SectorBorders({ sectors }: { sectors: Sector[] }) {
  const uniforms = useMemo(() => {
    const centroids = new Float32Array(50 * 3);
    const hues = new Float32Array(50);
    sectors.slice(0, 50).forEach((s, i) => {
      centroids[i * 3 + 0] = s.centroid[0];
      centroids[i * 3 + 1] = s.centroid[1];
      centroids[i * 3 + 2] = s.centroid[2];
      hues[i] = s.hue / 360;
    });
    return {
      uCentroids: { value: centroids },
      uHues: { value: hues },
      uCount: { value: Math.min(sectors.length, 50) },
      uTime: { value: 0 }
    };
  }, [sectors]);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]} raycast={() => null}>
      <planeGeometry args={[1200, 1200]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vPos;
          void main() {
            vPos = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec3 vPos;
          uniform vec3 uCentroids[50];
          uniform float uHues[50];
          uniform int uCount;
          uniform float uTime;

          vec3 hsv2rgb(vec3 c) {
            vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
            vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
            return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
          }

          void main() {
            float minDist1 = 99999.0;
            float minDist2 = 99999.0;
            int nearestIdx = 0;
            for (int i = 0; i < 50; i++) {
              if (i >= uCount) break;
              float d = distance(vPos.xz, uCentroids[i].xz);
              if (d < minDist1) {
                minDist2 = minDist1;
                minDist1 = d;
                nearestIdx = i;
              } else if (d < minDist2) {
                minDist2 = d;
              }
            }
            float centerDist = length(vPos.xz);
            float alpha = smoothstep(600.0, 300.0, centerDist) * 0.12;
            vec3 sectorColor = hsv2rgb(vec3(uHues[nearestIdx], 0.5, 0.08));
            float borderDist = minDist2 - minDist1;
            float borderLine = 1.0 - smoothstep(0.0, 6.0, borderDist);
            vec3 finalColor = mix(sectorColor, hsv2rgb(vec3(uHues[nearestIdx], 0.8, 0.4)), borderLine * 0.5);
            gl_FragColor = vec4(finalColor, alpha);
          }
        `}
      />
    </mesh>
  );
}

/* ---------- Dynamic Orbit ---------- */
function DynamicOrbit({ radius, color, systemPos }: { radius: number; color: string; systemPos: THREE.Vector3 }) {
  const lineRef = useRef<any>(null);
  const points = useMemo(() => {
    const pts = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    return pts;
  }, [radius]);

  useFrame((state) => {
    if (lineRef.current && state.camera) {
      const camDist = state.camera.position.distanceTo(systemPos);
      lineRef.current.lineWidth = Math.max(0.6, Math.min(2.5, camDist / 120));
    }
  });

  return (
    <Line
      ref={lineRef}
      points={points}
      color={color}
      lineWidth={1}
      transparent
      opacity={0.2}
      depthWrite={false}
    />
  );
}

/* ---------- Jump Gates ---------- */
function getSystemGateRadius(system: any) {
  if (!system) return 25;
  const maxBodyOrbit = system.bodies && system.bodies.length > 0 
    ? Math.max(...system.bodies.map((b: any) => b.orbit)) 
    : 0;
  const starRadius = STAR_BASE_SIZE[system.starType as keyof typeof STAR_BASE_SIZE] || 1;
  const isExotic = system.starType === "blackhole" || system.starType === "whitehole";
  const starVisualExtent = isExotic ? starRadius * 15.0 : starRadius * 2.5;
  return Math.max(maxBodyOrbit, starVisualExtent, 15) + 30;
}

function JumpGateMarkers({ system, galaxy, onSelect }: { system: any; galaxy: any; onSelect: (id: string) => void }) {
  const outer = getSystemGateRadius(system);
  return (
    <group>
      {system.gates.map((gate: any, i: number) => {
        const angle = (i / system.gates.length) * Math.PI * 2;
        const pos: [number, number, number] = [Math.cos(angle) * outer, 0, Math.sin(angle) * outer];
        const isLocked = !!gate.locked;
        return (
          <group key={gate.id} position={pos} rotation={[0, -angle + Math.PI / 2, 0]}>
            <mesh>
              <torusGeometry args={[2.5, 0.35, 16, 64]} />
              <meshStandardMaterial
                color={isLocked ? "#ff4444" : "#7be9ff"}
                emissive={isLocked ? "#aa1111" : "#1eb5cc"}
                emissiveIntensity={0.8}
              />
            </mesh>
            {/* Invisible Hitbox for easier selection — Billboard ensures it's always a flat disk facing the camera */}
            <Billboard>
              <mesh
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isLocked) onSelect(`gate:${gate.targetSystemId}`);
                }}
                onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = isLocked ? "not-allowed" : "pointer"; }}
                onPointerOut={() => { document.body.style.cursor = "default"; }}
              >
                <planeGeometry args={[9.0, 9.0]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              </mesh>
            </Billboard>
            <Html distanceFactor={25} position={[0, 1.8, 0]} center occlude>
              <div className={`font-mono-hud text-[8px] bg-background/80 px-1 border whitespace-nowrap uppercase tracking-widest ${
                isLocked
                  ? "text-red-400 border-red-500/40"
                  : "text-primary border-primary/20"
              }`}>
                {isLocked ? "⛔ SEALED" : `GATE \u2192 ${galaxy?.systemById?.[gate.targetSystemId]?.name || gate.targetSystemId.split("-")[1] || "DEEP SPACE"}`}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

function getGateLocalPosition(system: any, targetSystemId: string) {
  if (!system || !system.gates) return new THREE.Vector3(15, 0, 0);
  const outer = getSystemGateRadius(system);

  const i = system.gates.findIndex((g: any) => g.targetSystemId === targetSystemId);
  if (i < 0) return new THREE.Vector3(outer, 0, 0);
  const angle = (i / system.gates.length) * Math.PI * 2;
  return new THREE.Vector3(Math.cos(angle) * outer, 0, Math.sin(angle) * outer);
}

function PlayerFleetVisual({ galaxy, playerSystemId, viewedSystemId, travel, view, controlsRef, focusedBodyId, onSelect }: { galaxy: Galaxy, playerSystemId: string, viewedSystemId: string | null, travel: any, view: string, controlsRef?: any, focusedBodyId?: string, onSelect?: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const shipMeshRef = useRef<THREE.Group>(null);
  const engineGlowRef = useRef<THREE.Group>(null);
  const engineLightRef = useRef<THREE.PointLight>(null);
  const flashRef = useRef<THREE.Mesh>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const hitboxRef = useRef<THREE.Mesh>(null);
  
  const [arrivalState, setArrivalState] = useState<{fromId: string, time: number} | null>(null);
  const prevSystemRef = useRef(playerSystemId);
  const prevPosRef = useRef(new THREE.Vector3());
  const arrivalDoneRef = useRef(false);
  
  // Camera Tracking Refs
  const lastWorldPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const hasInitialPosRef = useRef(false);
  const tempVec = useMemo(() => new THREE.Vector3(), []);
  const tempVec2 = useMemo(() => new THREE.Vector3(), []);
  const tempVec4 = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    if (!travel && prevSystemRef.current !== playerSystemId) {
       setArrivalState({ fromId: prevSystemRef.current, time: Date.now() });
       arrivalDoneRef.current = false;
       prevSystemRef.current = playerSystemId;
    } else if (travel) {
       prevSystemRef.current = playerSystemId;
    }
  }, [playerSystemId, travel]);
  
  // Tracking update.
  useFrame((state) => {
    if (!groupRef.current) return;
    const now = Date.now();
    const sourceSys = galaxy.systemById[playerSystemId];
    if (!sourceSys) return;
    
    let globalPos = new THREE.Vector3();
    let scale = 1;
    let engineColor = '#00ffff';
    let engineIntensity = 0.4;
    let flashScale = 0;
    let flashOpacity = 0;

    // Helper: calculate physical orbital position for idle states
    const getIdlePos = (sysPos: number[], time: number, starType: string) => {
      const t = time * 0.00008; // Slower, more majestic orbit
      const starRadius = STAR_BASE_SIZE[starType as keyof typeof STAR_BASE_SIZE] || 2.4;
      const orbitRadius = starRadius * 3.8; // Further from star surface
      return new THREE.Vector3(
        sysPos[0] + Math.cos(t) * orbitRadius,
        sysPos[1],
        sysPos[2] + Math.sin(t) * orbitRadius
      );
    };

    const SUB_LIGHT_VELOCITY = 2.0; // slightly faster for responsiveness

    if (travel) {
      const elapsed = now - travel.startTime;
      const total = travel.endTime - travel.startTime;
      const targetSys = galaxy.systemById[travel.targetId];

      // Calculate transit duration
      const startPos = getIdlePos(sourceSys.pos, travel.startTime, sourceSys.starType);
      const gateOffset = getGateLocalPosition(sourceSys, travel.targetId);
      const gatePos = new THREE.Vector3(...sourceSys.pos).add(gateOffset);
      const localDist = startPos.distanceTo(gatePos);
      
      // Dynamic timing: if total is small, compress animation phases
      // We want: Transit (40%), Charge (20%), Jump (40%)
      const idealTransit = (localDist / SUB_LIGHT_VELOCITY) * 1000;
      const idealCharge = 2500;
      const idealJump = 1000;
      const idealTotal = idealTransit + idealCharge + idealJump;
      
      // Scale everything to fit within 50% of the 'total' time to leave room for hyperspace
      const scaleFactor = Math.min(1.0, (total * 0.5) / idealTotal);
      const transitTime = idealTransit * scaleFactor;
      const chargeTime = idealCharge * scaleFactor;
      const jumpTime = idealJump * scaleFactor;
      const departureTotal = transitTime + chargeTime + jumpTime;

      if (total === 0) {
        scale = 0;
      } else if (elapsed < departureTotal) {
        // ─── DEPARTURE SEQUENCE ───
        if (elapsed < transitTime) {
          // 1: Transit to gate
          const p = elapsed / transitTime;
          const t = Math.pow(p, 1.2); 
          globalPos.lerpVectors(startPos, gatePos, t);
          engineColor = '#00ffff';
          engineIntensity = (0.8 + t * 2.5) * (1.0 + Math.random() * 0.15);
          if (view !== 'galaxy' && viewedSystemId !== playerSystemId) scale = 0;
        } else if (elapsed < transitTime + chargeTime) {
          // 2: Charge at gate
          const p = (elapsed - transitTime) / chargeTime;
          globalPos.copy(gatePos);
          engineColor = `hsl(${180 - p * 60}, 100%, 70%)`; // Blue to Green
          engineIntensity = 2.5 + Math.sin(p * Math.PI * 10) * 1.0;
          if (view !== 'galaxy' && viewedSystemId !== playerSystemId) scale = 0;
        } else {
          // 3: Flash and enter hyperspace
          const p = (elapsed - (transitTime + chargeTime)) / jumpTime;
          globalPos.copy(gatePos);
          scale = Math.max(0, 1.0 - p * 3);
          flashScale = p * 12;
          flashOpacity = 1.0 - p;
          engineColor = '#ffffff';
          engineIntensity = 5.0 * (1.0 + Math.random() * 0.2);
          if (view !== 'galaxy' && viewedSystemId !== playerSystemId) scale = 0;
        }
      } else if (elapsed < total) {
        // ─── HYPERSPACE (Global physical transit) ───
        const t = (elapsed - departureTotal) / Math.max(1, total - departureTotal);
        const sourceCenter = new THREE.Vector3(...sourceSys.pos);
        const targetCenter = new THREE.Vector3(...targetSys.pos);
        
        globalPos.lerpVectors(sourceCenter, targetCenter, t);
        engineColor = '#ffffff';
        engineIntensity = 3.0 + Math.random() * 1.0;
        scale = view === 'galaxy' ? 4.0 : 0; 
      } else {
        scale = 0;
      }
    } else if (arrivalState) {
      // ─── ARRIVAL SEQUENCE ───
      const elapsed = now - arrivalState.time;
      const targetSys = sourceSys; 
      const gateOffset = getGateLocalPosition(targetSys, arrivalState.fromId);
      const gatePos = new THREE.Vector3(...targetSys.pos).add(gateOffset);
      const targetIdlePos = getIdlePos(targetSys.pos, now, targetSys.starType);
      
      const localDist = gatePos.distanceTo(targetIdlePos);
      const transitTime = (localDist / SUB_LIGHT_VELOCITY) * 1200; // Slower arrival for effect
      const matTime = 800;
      const arrivalTotal = transitTime + matTime;

      if (elapsed < arrivalTotal) {
        if (elapsed < matTime) {
          // 1: Arrival flash & Materialize
          const p = elapsed / matTime;
          globalPos.copy(gatePos);
          scale = p;
          flashScale = (1.0 - p) * 10;
          flashOpacity = 1.0 - p;
          engineColor = '#00ff44';
          engineIntensity = 4.0 * (1.0 + Math.random() * 0.2);
        } else {
          // 2: Transit from gate to star
          const p = (elapsed - matTime) / transitTime;
          const eased = 1 - Math.pow(1 - p, 2.0);
          globalPos.lerpVectors(gatePos, targetIdlePos, eased);
          engineColor = '#00ffff';
          engineIntensity = (2.0 - p * 1.5) * (1.0 + Math.random() * 0.15);
          if (view !== 'galaxy' && viewedSystemId !== playerSystemId) scale = 0;
        }
      } else {
        if (!arrivalDoneRef.current) {
          arrivalDoneRef.current = true;
          setArrivalState(null);
        }
        globalPos.copy(getIdlePos(targetSys.pos, now, targetSys.starType));
      }
    } else {
      // ─── IDLE ORBIT ───
      globalPos.copy(getIdlePos(sourceSys.pos, now, sourceSys.starType));
      engineColor = '#00ffff';
      engineIntensity = 0.3 + Math.sin(now * 0.005) * 0.1;
    }

    // Orient ship toward velocity
    const velocity = globalPos.clone().sub(prevPosRef.current);
    if (velocity.lengthSq() > 0.0001) {
      const dir = velocity.clone().normalize();
      // Ship forward is +Z in this geometry
      const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      groupRef.current.quaternion.slerp(quaternion, 0.15);
    }
    prevPosRef.current.copy(globalPos);

    // Blinking navigation lights
    const isNavOn = Math.sin(now * 0.003) > 0;
    const navRed = groupRef.current.getObjectByName('navRed') as THREE.Mesh;
    const navGreen = groupRef.current.getObjectByName('navGreen') as THREE.Mesh;
    if (navRed) navRed.visible = isNavOn;
    if (navGreen) navGreen.visible = isNavOn;

    // Hide the 3D mesh in galaxy view when idle (HTML icon takes over)
    if (view === 'galaxy') {
      scale = 0;
    }

    // Dynamic Opacity for the CMDR HTML icon so it doesn't cover the 3D model
    const distToCamera = state.camera.position.distanceTo(globalPos);
    
    let htmlOpacity = 0;
    if (view === 'galaxy') {
      htmlOpacity = 1.0;
    } else if (scale > 0) {
      // If we are in system/body view and close enough to see the 3D model, hide the HTML icon
      htmlOpacity = Math.max(0, Math.min(1, (distToCamera - 15) / 10));
    }

    // Dynamic Hitbox Scaling
    if (hitboxRef.current) {
      const scaleFactor = Math.max(1, distToCamera * 0.06);
      hitboxRef.current.scale.setScalar(scaleFactor);
    }

    // Camera Tracking
    if (focusedBodyId === "ship" && controlsRef?.current) {
      const controls = controlsRef.current;
      controls.smoothTime = 0;
      controls.restThreshold = 0.0001; // Increase precision for extreme zoom tracking
      
      const sX = view === "galaxy" ? 0 : sourceSys.pos[0];
      const sY = view === "galaxy" ? 0 : sourceSys.pos[1];
      const sZ = view === "galaxy" ? 0 : sourceSys.pos[2];
      const wx = globalPos.x - sX;
      const wy = globalPos.y - sY;
      const wz = globalPos.z - sZ;

      if (!hasInitialPosRef.current) {
        // INITIAL SNAP: cinematic zoom to ship position
        const zoomDist = 6.0;
        controls.setLookAt(
          wx + zoomDist * 0.8, wy + zoomDist * 0.6, wz + zoomDist,
          wx, wy, wz,
          true
        );
        hasInitialPosRef.current = true;
      } else {
        // Delta-synchronized movement for ship tracking
        const currentTarget = new THREE.Vector3();
        controls.getTarget(currentTarget);
        const currentPos = new THREE.Vector3();
        controls.getPosition(currentPos);

        const dx = wx - currentTarget.x;
        const dy = wy - currentTarget.y;
        const dz = wz - currentTarget.z;

        controls.setLookAt(
          currentPos.x + dx, currentPos.y + dy, currentPos.z + dz,
          wx, wy, wz,
          false
        );
      }
    } else {
      hasInitialPosRef.current = false;
    }

    // Apply physical transform
    groupRef.current.position.copy(globalPos);
    groupRef.current.scale.setScalar(scale);

    // Apply engine glow color + intensity
    if (engineGlowRef.current) {
      engineGlowRef.current.children.forEach((child) => {
        const mesh = child as THREE.Mesh;
        mesh.scale.setScalar(engineIntensity);
        if (mesh.material) {
          (mesh.material as THREE.MeshBasicMaterial).color.set(engineColor);
        }
      });
    }
    if (engineLightRef.current) {
      engineLightRef.current.color.set(engineColor);
      engineLightRef.current.intensity = engineIntensity * 2;
    }

    // Flash sphere
    if (flashRef.current) {
      const mat = flashRef.current.material as THREE.MeshBasicMaterial;
      flashRef.current.scale.setScalar(Math.max(0, flashScale));
      mat.opacity = Math.max(0, flashOpacity);
      flashRef.current.visible = flashOpacity > 0;
    }

    // Apply HTML icon opacity via ref
    if (labelRef.current) {
      labelRef.current.style.opacity = htmlOpacity.toString();
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={shipMeshRef}>
        {/* Main Hull (Cylindrical) */}
        <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.5, 32]} />
          <meshStandardMaterial color="#d0d5dc" metalness={0.6} roughness={0.3} />
        </mesh>
        
        {/* Forward Nose (Cone) */}
        <mesh position={[0, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.1, 0.2, 16]} />
          <meshStandardMaterial color="#ffffff" metalness={0.5} roughness={0.3} />
        </mesh>

        {/* Cockpit / Command Bridge (Moved Forward to intersect hull and cone) */}
        <mesh position={[0, 0.07, 0.28]}>
          <boxGeometry args={[0.08, 0.05, 0.18]} />
          <meshStandardMaterial color="#111111" metalness={0.9} roughness={0.1} emissive="#0088ff" emissiveIntensity={0.6} />
        </mesh>
        
        {/* Cockpit Viewport Glass */}
        <mesh position={[0, 0.08, 0.36]}>
          <boxGeometry args={[0.07, 0.03, 0.03]} />
          <meshStandardMaterial color="#ffffff" emissive="#00ffff" emissiveIntensity={1.5} />
        </mesh>

        {/* Swept Wings */}
        <mesh position={[0.18, 0, -0.05]} rotation={[0, -0.2, 0]}>
          <boxGeometry args={[0.16, 0.03, 0.35]} />
          <meshStandardMaterial color="#8a95a5" metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[-0.18, 0, -0.05]} rotation={[0, 0.2, 0]}>
          <boxGeometry args={[0.16, 0.03, 0.35]} />
          <meshStandardMaterial color="#8a95a5" metalness={0.7} roughness={0.4} />
        </mesh>

        {/* Engine Nacelles */}
        <mesh position={[0.22, 0, -0.15]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.05, 0.25, 8]} />
          <meshStandardMaterial color="#606a75" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[-0.22, 0, -0.15]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.05, 0.25, 8]} />
          <meshStandardMaterial color="#606a75" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Warp Coil Glows */}
        <mesh position={[0.22, 0.02, -0.15]}>
          <boxGeometry args={[0.02, 0.02, 0.18]} />
          <meshStandardMaterial color="#ffffff" emissive="#0088ff" emissiveIntensity={2.0} />
        </mesh>
        <mesh position={[-0.22, 0.02, -0.15]}>
          <boxGeometry args={[0.02, 0.02, 0.18]} />
          <meshStandardMaterial color="#ffffff" emissive="#0088ff" emissiveIntensity={2.0} />
        </mesh>

        {/* Forward Deflector Dish */}
        <mesh position={[0, -0.04, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.02, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#00ccff" emissiveIntensity={2.0} />
        </mesh>

        {/* Navigation Lights (Blinking) */}
        <mesh name="navRed" position={[-0.26, 0.02, -0.1]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
        <mesh name="navGreen" position={[0.26, 0.02, -0.1]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshBasicMaterial color="#00ff00" />
        </mesh>

        {/* Hull Windows (Emissive) */}
        <mesh position={[0.08, 0, 0.1]}>
          <boxGeometry args={[0.045, 0.02, 0.05]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-0.08, 0, 0.1]}>
          <boxGeometry args={[0.045, 0.02, 0.05]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.08, 0, -0.05]}>
          <boxGeometry args={[0.045, 0.02, 0.05]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-0.08, 0, -0.05]}>
          <boxGeometry args={[0.045, 0.02, 0.05]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* Spotlight (Forward Facing) */}
        <spotLight 
          position={[0, 0, 0.4]} 
          angle={0.4} 
          penumbra={0.5} 
          intensity={0.5} 
          distance={10} 
          color="#ffffff" 
          target-position={[0, 0, 5]} 
        />

        {/* Engine Plumes (Volumetric Cones) */}
        <group ref={engineGlowRef}>
          {/* Main central exhaust */}
          <mesh position={[0, 0, -0.35]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.12, 0.4, 16, 1, true]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.6} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
          </mesh>
          {/* Port side nacelle exhaust */}
          <mesh position={[0.22, 0, -0.28]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.04, 0.18, 12, 1, true]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.5} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
          </mesh>
          {/* Starboard side nacelle exhaust */}
          <mesh position={[-0.22, 0, -0.28]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.04, 0.18, 12, 1, true]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.5} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
          </mesh>
        </group>
        <pointLight ref={engineLightRef} position={[0, 0, -0.4]} color="#00ffff" distance={15} />

        {/* Invisible Hitbox for Selection */}
        {onSelect && (
          <Billboard>
            <mesh 
              ref={hitboxRef}
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
              onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
              onPointerOut={() => { document.body.style.cursor = "default"; }}
            >
              <planeGeometry args={[2.5, 2.5]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* Jump Flash — lives outside the hull group so it doesn't rotate/scale with ship */}
      <mesh ref={flashRef} visible={false}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#88ffcc" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* The HTML icon represents the Commander. We conditionally render it to avoid Drei ghosting bugs. */}
      {(view === 'galaxy' || viewedSystemId === playerSystemId) && (
        <group>
          <Html center zIndexRange={[100, 0]}>
            <div ref={labelRef} className="cmdr-label text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse flex flex-col items-center pointer-events-none transition-opacity duration-300">
              <Rocket size={14} className="-rotate-45" />
              <div className="text-[6px] font-mono-hud mt-1 uppercase">CMDR</div>
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}
