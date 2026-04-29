import { useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CameraControls, Html, PerspectiveCamera, Line, Billboard, PositionalAudio } from "@react-three/drei";
import { Rocket, ChevronUp } from "lucide-react";
import * as THREE from "three";
import type { Galaxy, StarSystem, Body, Sector, ContestState, StarType } from "@/galaxy/types";
import type { FilterState, ViewMode } from "@/galaxy/useGalaxyApp";
import { SpaceBackground } from "./SpaceBackground";
import { StarVisual } from "./StarVisual";
import { PlanetMaterial } from "./PlanetMaterial";
import { PlanetaryRing } from "./PlanetaryRing";
import { STAR_LUMINOSITY, STAR_META, STAR_BASE_SIZE, getOrbitalSpeed, BODY_META } from "@/galaxy/meta";
import { ShipConfiguration } from "../shipPresets";
import { ModularShip } from "./ModularShip";

// --- AUDIO SYNTHESIS UTILITIES ---
const createJumpBuffer = (ctx: AudioContext) => {
  const duration = 1.0;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < buffer.length; i++) {
    const t = i / ctx.sampleRate;
    const freq = 400 * Math.exp(-t * 5.0) + 100 * Math.sin(t * 10.0);
    data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 3.0) * (1.0 - t / duration);
    // Add some noise
    data[i] += (Math.random() * 2 - 1) * 0.05 * Math.exp(-t * 10.0);
  }
  return buffer;
};

const createMatBuffer = (ctx: AudioContext) => {
  const duration = 0.8;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < buffer.length; i++) {
    const t = i / ctx.sampleRate;
    const p = t / duration;
    const freq = 50 + 600 * Math.pow(p, 2.0);
    data[i] = Math.sin(2 * Math.PI * freq * t) * Math.sin(p * Math.PI) * 0.6;
    data[i] += (Math.random() * 2 - 1) * 0.1 * (1.0 - p);
  }
  return buffer;
};

const createEngineBuffer = (ctx: AudioContext) => {
  const duration = 2.0;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < buffer.length; i++) {
    const t = i / ctx.sampleRate;
    // Layered hum
    data[i] = (
      Math.sin(2 * Math.PI * 55 * t) * 0.5 + 
      Math.sin(2 * Math.PI * 110 * t) * 0.2 +
      (Math.random() * 2 - 1) * 0.05 // low rumble noise
    );
  }
  return buffer;
};

// Shared temporary vectors for internal calculations within a single function call.
// DO NOT use these across async boundaries or between different components' useFrame calls.
const tempVec = new THREE.Vector3();
const tempVec2 = new THREE.Vector3();

function CloudLayer({ body, visualSize, quality, starWorldPos, starViewPos }: { body: Body; visualSize: number; quality: string; starWorldPos: THREE.Vector3; starViewPos: THREE.Vector3 }) {
  const cloudRef = useRef<THREE.Mesh>(null);
  const speed = useMemo(() => 0.05 + Math.random() * 0.1, []);
  const cloudLightDirRef = useRef(new THREE.Vector3(1, 0.5, 1).normalize());
  const cloudWorldPosVec = useMemo(() => new THREE.Vector3(), []);
  const starViewPosRef = useRef(new THREE.Vector3());

  useFrame((state) => {
    if (cloudRef.current) {
      cloudRef.current.rotation.y = state.clock.getElapsedTime() * speed;
      // Keep cloud light direction in sync with the star — same as PlanetNode
      cloudRef.current.getWorldPosition(cloudWorldPosVec);
      cloudLightDirRef.current.copy(starWorldPos).sub(cloudWorldPosVec).normalize();
    }
  });

  return (
    <mesh ref={cloudRef} scale={1.015}>
      <sphereGeometry args={[visualSize, quality === "low" ? 16 : 32, quality === "low" ? 16 : 32]} />
      <PlanetMaterial 
        subtype={body.subtype} 
        hue={body.hue} 
        isWeather 
        lightDir={cloudLightDirRef.current}
        starWorldPos={starWorldPos}
        starViewPos={starViewPosRef.current}
        quality={quality as "low" | "medium" | "high"}
        terrainSeed={body.terrainSeed}
        geographyType={body.geographyType}
      />
    </mesh>
  );
}

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
  travel?: { targetId: string; startTime: number; endTime: number } | null;
  isMobilePanelExpanded?: boolean;
  graphicsQuality?: "low" | "medium" | "high";
  shipConfig?: ShipConfiguration;
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
  currentSystemId, travel, isMobilePanelExpanded, containerRef, graphicsQuality, shipConfig
}: Props & { containerRef: React.RefObject<HTMLDivElement> }) {
  const { camera, gl } = useThree();
  const controlsRef = useRef<CameraControls>(null);
  const [listener, setListener] = useState<THREE.AudioListener | null>(null);
  const lastSystemRef = useRef<StarSystem | null>(null);

  const lastViewRef = useRef<ViewMode>(view);

  // Transition camera when view changes
  useEffect(() => {
    if (!controlsRef.current) return;

    if (system) {
      lastSystemRef.current = system;
    }

    if (view === "galaxy") {
      // If we just entered galaxy view, try to focus on the last system we were looking at
      const target = system || lastSystemRef.current;
      if (target) {
        const isNewEntry = lastViewRef.current !== "galaxy";
        
        // If we're coming from a system/body view, we need to compensate for the world-shift being removed.
        // We do an instant snap first so the user doesn't see the galaxy "jump" to the center,
        // then a smooth transition to the final preferred angle.
        controlsRef.current.setLookAt(
          target.pos[0], target.pos[1] + 400, target.pos[2] + 500,
          target.pos[0], target.pos[1], target.pos[2],
          !isNewEntry // Only smooth if we were already in galaxy view (e.g. clicking a star)
        );
      } else {
        controlsRef.current.setLookAt(0, 400, 500, 0, 0, 0, true);
      }
    } else if (view === "system" && system) {
      const maxOrbit = system.bodies.reduce((max, b) => Math.max(max, b.orbit), 0) || 150;
      const vFov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
      const aspect = window.innerWidth / window.innerHeight;
      const radiusToFit = maxOrbit * 1.2;
      
      const heightForVerticalFit = radiusToFit / Math.tan(vFov / 2);
      const heightForHorizontalFit = (radiusToFit / aspect) / Math.tan(vFov / 2);
      const idealHeight = Math.max(800, heightForVerticalFit, heightForHorizontalFit);

      // In system view, the galaxy is shifted so the system is at [0,0,0]
      controlsRef.current.setLookAt(
        0, idealHeight, 1, 
        0, 0, 0,
        true
      );
    } else if (view === "body" && body?.id === "star") {
      // Direct focus on the central star
      const starScale = system.id === "sys-center" ? 4.5 : 2.4;
      const zoomDist = starScale * 15;
      controlsRef.current.setLookAt(
        0, zoomDist * 0.6, zoomDist,
        0, 0, 0,
        true
      );
    } else if (view === "ship") {
      // Logic for snapping to ship handled in PlayerFleetVisual tracking
    }
    
    lastViewRef.current = view;
  }, [view, system, body?.id, camera]);

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
    controls.mouseButtons.right = 2; // TRUCK
    // @ts-ignore
    controls.touches.two = "truck"; 
    // @ts-ignore
    controls.touches.three = "truck"; 
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
      else if (view === "body" || view === "ship") targetViewPercentage = 0.25;
    }
    
    const targetViewOffset = targetViewPercentage * _state.size.height;
    if (Math.abs(targetOffsetRef.current - targetViewOffset) > 0.01) {
      targetOffsetRef.current = THREE.MathUtils.lerp(targetOffsetRef.current, targetViewOffset, 0.1);
      
      if (Math.abs(targetOffsetRef.current) > 0.1) {
        camera.setViewOffset(
          _state.size.width, _state.size.height,
          0, targetOffsetRef.current,
          _state.size.width, _state.size.height
        );
      } else {
        camera.clearViewOffset();
      }
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
        smoothTime={0.4}
        dollySpeed={1.0}
      />
        <PerspectiveCamera makeDefault position={[0, 400, 500]} far={20000} near={0.1}>
          <audioListener ref={setListener} />
        </PerspectiveCamera>
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
            {filters.layers.has("sectorLabels") && <SectorLabels sectors={galaxy.sectors} />}
            {filters.layers.has("empireColors") && (
              <EmpireTerritoryRings
                galaxy={galaxy}
                fogOfWar={fogOfWar}
                knownSystemIds={knownSystemIds}
              />
            )}
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
            onSelect={() => {
              if (view === "galaxy") {
                onSelectSystem(s.id);
              } else {
                // If already in a system, ship, or body view, click the star to focus it
                onSelectBody("star");
              }
            }}
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
          trackingShip={view === 'ship'}
          onSelect={() => onSelectBody("ship")}
          listener={listener}
          config={shipConfig}
        />
      </group>
    </>
  );
}

function ContestStatusRing({ contest }: { contest: ContestState }) {
  const ref = useRef<THREE.Group>(null);
  const color = contest === "contested" ? "#ffaa00" : "#ff3300"; // Amber vs Red
  
  useFrame((state) => {
    if (ref.current) {
      if (contest === "contested") {
        const s = 1.0 + Math.sin(state.clock.elapsedTime * 3.0) * 0.1;
        ref.current.scale.setScalar(s);
      }
    }
  });

  return (
    <group ref={ref}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.7, 32]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={contest === "contested" ? 0.4 : 0.25} 
          side={THREE.DoubleSide} 
          depthWrite={false} 
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Outer faint glow for contested */}
      {contest === "contested" && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.7, 2.2, 32]} />
          <meshBasicMaterial 
            color={color} 
            transparent 
            opacity={0.1} 
            side={THREE.DoubleSide} 
            depthWrite={false} 
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  );
}

function SystemNode({ system, galaxy, view, controlsRef, isFocused, isBodyFocused, focusedBodyId, onSelect, onSelectBody, filters, isExplored, isKnown, isPlayerHere, isMobilePanelExpanded, quality }: {
  system: StarSystem;
  galaxy: Galaxy;
  view: ViewMode;
  controlsRef: React.RefObject<CameraControls | null>;
  isFocused: boolean;
  isBodyFocused: boolean;
  focusedBodyId: string | null;
  onSelect: () => void;
  onSelectBody: (id: string) => void;
  filters: FilterState;
  isExplored: boolean;
  isKnown: boolean;
  isPlayerHere: boolean;
  isMobilePanelExpanded: boolean;
  quality: "low" | "medium" | "high";
}) {
  const { camera } = useThree();
  const starGroupRef = useRef<THREE.Group>(null);
  const htmlGroupRef = useRef<THREE.Group>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const hitboxRef = useRef<THREE.Mesh>(null);
  const [isNear, setIsNear] = useState(false);
  const hasInitialStarPosRef = useRef(false);
  
  // Component-local vectors for useFrame to avoid clobbering
  const localVec = useMemo(() => new THREE.Vector3(), []);
  const localVec2 = useMemo(() => new THREE.Vector3(), []);
  const localVec3 = useMemo(() => new THREE.Vector3(), []);
  
  // Core is always visible/explored
  const explored = isExplored || system.id === "sys-center";
  const known = isKnown || system.id === "sys-center";
  const rawBaseSize = system.id === "sys-center" ? 40.0 : (STAR_BASE_SIZE[system.starType as keyof typeof STAR_BASE_SIZE] || 2.4);
  const baseStarScale = view === "galaxy" 
    ? (Math.sqrt(rawBaseSize) * 1.1 + 0.9) * (system.starType === "binary" || system.starType === "trinary" ? 0.5 : 1.0)
    : rawBaseSize;
  
  // Pre-calculate system vector to avoid instantiation in useFrame
  const sysPos = useMemo(() => new THREE.Vector3(...system.pos), [system.pos]);
  const effectiveStarPos = useMemo(() => {
    return (view === "galaxy") ? sysPos : new THREE.Vector3(0, 0, 0);
  }, [view, sysPos]);
  
  // Throttled distance check for performance
  const frameCount = useRef(Math.floor(Math.random() * 10)); 
  useFrame((state) => {
    // Only check distance every 10 frames if not focused for huge performance gain on mobile
    if (!isFocused && frameCount.current++ % 10 !== 0) return;

    const d = state.camera.position.distanceTo(sysPos);
    const safeD = Math.max(0.1, d); // Prevent division by zero
    
    const currentScale = isFocused ? baseStarScale : Math.min(10.0, Math.max(baseStarScale, safeD / 500));
    
    if (starGroupRef.current) {
      starGroupRef.current.scale.setScalar(currentScale / baseStarScale);
    }
    
    if (hitboxRef.current) {
      // Reduced for 36-empire density: 12px desktop, 36px mobile (diameter ~24px/72px)
      const isMobile = window.innerWidth <= 768;
      const minHitRadius = isMobile ? 36 : 12; 
      const vFov2 = (state.camera as THREE.PerspectiveCamera).fov * Math.PI / 180;
      const screenH2 = window.innerHeight;
      const hitScale = (minHitRadius * 2 * Math.tan(vFov2 / 2) * safeD) / screenH2;
      // Cap the scale to prevent massive overlapping hitboxes at extreme zoom
      // Reduced max scale from 12.0 to 3.0 to keep interaction tight
      hitboxRef.current.scale.setScalar(Math.min(3.0, Math.max(1.0, hitScale / (baseStarScale * 2.0))));
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

    // Continuous Camera Tracking for Star (only needed if it actually moves, 
    // but useful for maintaining focus if something else moves the camera target)
    if (isFocused && focusedBodyId === "star" && controlsRef.current && view === "body") {
      const controls = controlsRef.current;
      controls.smoothTime = 0;
      
      // The star is at [0,0,0] in shifted space, so we just move to [0,0,0].
      // We force a matrix update to be sure.
      if (starGroupRef.current) {
        starGroupRef.current.updateWorldMatrix(true, false);
        controls.moveTo(0, 0, 0, false);
      }
    }
  });

  if (!known && !isFocused) return null; // Hidden in Fog of War

  // Only show details (planets, orbits) if explicitly focused in system or body view
  const showDetails = isFocused && (view === "system" || view === "body" || view === "ship");

  return (
    <group position={system.pos}>
      <group ref={starGroupRef}>
        <StarVisual 
          type={system.starType} 
          scale={baseStarScale} 
          detailed={showDetails} 
          grayscale={!explored}
          quality={quality}
          onClick={(e) => { 
            e.stopPropagation(); 
            onSelect();
          }}
          onPointerOver={() => { document.body.style.cursor = "pointer"; }}
          onPointerOut={() => { document.body.style.cursor = "default"; }}
        />
        {/* Contest Status Ring (only in galaxy view, non-frontier) */}
        {view === "galaxy" && (system.contest === "contested" || system.contest === "anarchic") && (
          <ContestStatusRing contest={system.contest} />
        )}
        {/* Invisible Hitbox for easier selection — Billboard ensures it's always a flat disk facing the camera */}
        <mesh 
          ref={hitboxRef}
          onClick={(e) => { 
            e.stopPropagation(); 
            onSelect();
          }}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
          onPointerOut={() => { document.body.style.cursor = "default"; }}
        >
          {/* Tight hitbox for exotic stars to allow clicking nearby objects; generous for others */}
          <sphereGeometry args={[baseStarScale * (rawBaseSize > 30.0 ? 0.7 : 1.6), 16, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
      
      {/* Local System Objects (Planets, Moons, Stations, etc.) */}
      {showDetails && (
        <>
          <pointLight 
            color={`#${STAR_META[system.starType as keyof typeof STAR_META]?.hex || "ffffff"}`} 
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
                parentBody={null}
                view={view}
                controlsRef={controlsRef}
                isFocused={focusedBodyId === b.id}
                filters={filters}
                onSelect={onSelectBody} 
                onSelectBody={onSelectBody}
                focusedBodyId={focusedBodyId}
                starWorldPos={effectiveStarPos}
                starType={system.starType}
                isMobilePanelExpanded={isMobilePanelExpanded}
                quality={quality}
                galaxy={galaxy}
                isSystemExplored={explored}
              />
            ))}
          {/* Orbits — hidden for the focused planet in body view (camera is inside that orbit, causing a horizon-line artifact) */}
          {filters.layers.has("orbitPaths") && system.bodies.map((b: Body) => (
            !b.parentId && !(view === "body" && focusedBodyId === b.id) && (
              <DynamicOrbit 
                key={`orbit-${b.id}`} 
                radius={b.orbit} 
                color="white" 
                systemPos={new THREE.Vector3(...system.pos)}
              />
            )
          ))}
          <JumpGateMarkers system={system} galaxy={galaxy} onSelect={onSelectBody} filters={filters} />
          
          {/* Stellar Temperature Zones Overlay - Smooth Gradient Shader */}
          {filters.layers.has("habitableZones") && (() => {
            const lPow = Math.pow(STAR_LUMINOSITY[system.starType] || 1, 0.5);
            const inner = Math.max(12, 10 * lPow);
            const hotEnd = 120 * lPow;
            const tempEnd = 240 * lPow;
            
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
              className="px-2 py-1 flex items-center gap-2 bg-black/50 backdrop-blur-sm border border-white/10 rounded-sm pointer-events-none whitespace-nowrap shadow-lg transition-opacity duration-300"
              style={{ opacity: 0 }}
            >
              {isPlayerHere && (
                <div className="flex items-center justify-center w-3 h-3 bg-cyan-400 rounded-full animate-pulse">
                  <div className="w-1 h-1 bg-white rounded-full" />
                </div>
              )}
              {isKnown && (
                <div className="flex flex-col items-center pointer-events-none whitespace-nowrap drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                  <span 
                    className="font-mono-hud text-[7px] leading-none uppercase tracking-wider"
                    style={{ 
                      color: system.ownerId 
                        ? `hsl(${galaxy.empires.find(e => e.id === system.ownerId)?.hue || 0} 75% 65%)` 
                        : "white"
                    }}
                  >
                    ★ {system.name}
                  </span>
                  {system.ownerId && (
                    <span className="font-mono-hud text-[5px] uppercase tracking-[0.2em] text-white/60 mt-0.5">
                      {galaxy.empires.find(e => e.id === system.ownerId)?.name}
                    </span>
                  )}
                </div>
              )}
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}



function TerritoryMarker({ body, visualSize, galaxy }: { body: Body; visualSize: number; galaxy: Galaxy }) {
  const meshRef = useRef<THREE.Group>(null);
  const empire = useMemo(() => galaxy.empires.find((e) => e.id === body.ownerId), [galaxy, body.ownerId]);
  
  const color = useMemo(() => {
    if (!empire) return new THREE.Color("#ffffff");
    return new THREE.Color().setHSL(empire.hue / 360, 0.72, 0.55);
  }, [empire]);

  const worldPos = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.getWorldPosition(worldPos);
      const d = state.camera.position.distanceTo(worldPos);
      
      // LOD Scaling: Marker grows when far away to maintain visibility
      const lodScale = Math.max(1.0, d / 250); 
      const pulse = 1.0 + Math.sin(state.clock.elapsedTime * 2.5) * 0.08;
      const s = lodScale * pulse;
      meshRef.current.scale.set(s, s, s);
    }
  });

  if (!empire) return null;

  return (
    <group ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, 0]}>
      {/* Inner solid ring for high contrast visibility */}
      <mesh>
        <ringGeometry args={[visualSize * 1.35, visualSize * 1.65, 64]} />
        <meshBasicMaterial 
          color={color} 
          transparent={true} 
          opacity={1.0}
          side={THREE.DoubleSide} 
          depthWrite={true}
          depthTest={true}
          toneMapped={false}
        />
      </mesh>
      {/* Large outer influence pulse */}
      <mesh>
        <ringGeometry args={[visualSize * 1.8, visualSize * 3.8, 64]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.12} 
          side={THREE.DoubleSide} 
          depthWrite={false} 
          blending={THREE.AdditiveBlending} 
        />
      </mesh>
    </group>
  );
}

function PlanetNode({ body, parentBody, view, controlsRef, isFocused, onSelect, onSelectBody, focusedBodyId, starWorldPos, starType, filters, isMobilePanelExpanded, quality, galaxy, isSystemExplored = true }: {
  body: Body;
  parentBody: Body | null;
  view: ViewMode;
  controlsRef: React.RefObject<CameraControls | null>;
  isFocused: boolean;
  onSelect: (id: string) => void;
  onSelectBody: (id: string) => void;
  focusedBodyId: string | null;
  starWorldPos: THREE.Vector3;
  starType: StarType;
  filters: FilterState;
  isMobilePanelExpanded?: boolean;
  quality: "low" | "medium" | "high";
  galaxy: Galaxy;
  isSystemExplored?: boolean;
}) {
  const { camera } = useThree();
  const meshRef = useRef<THREE.Group>(null);
  const sphereRef = useRef<any>(null);
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

  const localVec = useMemo(() => new THREE.Vector3(), []);
  const localVec2 = useMemo(() => new THREE.Vector3(), []);
  const localVec3 = useMemo(() => new THREE.Vector3(), []);
  const localVec4 = useMemo(() => new THREE.Vector3(), []);
  const moonVec = useMemo(() => new THREE.Vector3(), []); // scratch for moon occluder computation
  const planetViewPosRef = useRef(new THREE.Vector3());
  const starViewPosRef = useRef(new THREE.Vector3());
  // Pre-allocated moon occluder buffer: xyz=view-pos, w=radius. Only used when this node is a planet.
  const moonOccluderBuf = useRef([new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()]);

  // Analytical orbital tracking using Three.js clock time, NOT performance.now().
  // performance.now() jitters badly under load since it reflects true wall-clock time.
  // Heavy frames cause a big delta, planets visually lurch ahead. state.clock.elapsedTime is smoothed.
  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Single timestamp for this entire frame — mesh and camera MUST use the same value.
    // Using state.clock.elapsedTime instead of performance.now() is critical:
    // performance.now() reflects wall-clock time, so heavy frames cause large jumps and visible jitter.
    // Three.js's clock is delta-smoothed and frame-rate-aware.
    const t = state.clock.elapsedTime;

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
    meshRef.current.getWorldPosition(localVec);
    lightDirRef.current.copy(starWorldPos).sub(localVec).normalize();
    
    // Star View Position for shader point lighting
    starViewPosRef.current.copy(starWorldPos).applyMatrix4(state.camera.matrixWorldInverse);

    // Compute parent position in view space for shadow casting (moon -> planet)
    if (parentBody && meshRef.current.parent) {
      meshRef.current.parent.getWorldPosition(localVec4);
      planetViewPosRef.current.copy(localVec4).applyMatrix4(state.camera.matrixWorldInverse);
    } else {
      planetViewPosRef.current.setScalar(0);
    }

    // Compute moon positions analytically for shadow casting (planet <- moon)
    // localVec already holds this planet's world position at this point.
    if (!parentBody) {
      const moons = galaxy.systemById[body.systemId]?.bodies.filter((m) => m.parentId === body.id) || [];
      for (let i = 0; i < 4; i++) {
        if (i < moons.length) {
          const moon = moons[i];
          const moonSpeed = getOrbitalSpeed(moon.orbit, starType, true);
          const moonAngle = (moon.phase || 0) + (t * moonSpeed) % (Math.PI * 2);
          moonVec.set(
            localVec.x + Math.cos(moonAngle) * moon.orbit,
            localVec.y,
            localVec.z + Math.sin(moonAngle) * moon.orbit
          ).applyMatrix4(state.camera.matrixWorldInverse);
          moonOccluderBuf.current[i].set(moonVec.x, moonVec.y, moonVec.z, moon.size * 1.05);
        } else {
          moonOccluderBuf.current[i].set(0, 0, 0, 0);
        }
      }
    }

    // Camera Tracking: use the mesh's ACTUAL world position (already computed above via getWorldPosition).
    // This guarantees zero divergence between where the mesh is and where the camera looks.
    if (isFocused && view === "body" && controlsRef.current) {
      const controls = controlsRef.current;
      controls.smoothTime = 0;

      if (!hasInitialPosRef.current) {
        const zoomDist = body.size * 12;
        controls.setLookAt(
          localVec.x, localVec.y + zoomDist * 0.6, localVec.z + zoomDist,
          localVec.x, localVec.y, localVec.z,
          true
        );
        hasInitialPosRef.current = true;
      } else {
        // moveTo keeps the camera's angle and distance while moving the orbit center
        // to the body's exact current world position — no formula, no drift.
        controls.moveTo(localVec.x, localVec.y, localVec.z, false);
      }
    } else {
      hasInitialPosRef.current = false;
    }

    if (sphereRef.current) {
      const daySpeed = body.type === "gas_giant" ? 0.4 + rotationSeed * 0.4 : 0.08 + rotationSeed * 0.1;
      sphereRef.current.rotation.y = state.clock.elapsedTime * daySpeed;
    }

    if (hitboxRef.current) {
      // Dynamically scale hitbox to maintain a constant target screen-space radius.
      // Mobile needs significantly larger touch targets (44px+ per Apple HIG).
      meshRef.current!.getWorldPosition(localVec2);
      const d = state.camera.position.distanceTo(localVec2);
      const safeD = Math.max(0.1, d);
      const vFov = (state.camera as THREE.PerspectiveCamera).fov * Math.PI / 180;
      const screenH = window.innerHeight;
      const isMobile = window.innerWidth <= 768;
      const minPx = isMobile ? 36 : 18; // 36px mobile, 18px desktop
      const targetScreenRadius = Math.max(minPx, body.size * 12);
      const targetWorldSize = (targetScreenRadius * 2 * Math.tan(vFov / 2) * safeD) / screenH;
      const baseSize = body.size * 2.0;
      // Max 10× on mobile (more generous overlap okay), 6× on desktop
      const maxScale = isMobile ? 10.0 : 6.0;
      hitboxRef.current.scale.setScalar(Math.max(1.0, Math.min(maxScale, targetWorldSize / baseSize)));
    }

    if (labelRef.current && view !== "galaxy") {
      meshRef.current.getWorldPosition(localVec3);
      const d = camera.position.distanceTo(localVec3);
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
        <group ref={sphereRef}>
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
          ref={sphereRef}
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
            starWorldPos={starWorldPos}
            starViewPos={starViewPosRef.current}
            planetViewPos={parentBody ? planetViewPosRef.current : undefined}
            parentSize={parentBody ? parentBody.size * 1.05 : 0}
            moonOccluders={!parentBody ? moonOccluderBuf.current : undefined}
            color={new THREE.Color(`#${STAR_META[starType]?.hex || "ffffff"}`)}
            showWeather={filters.layers.has("weatherSystems") && !!body.atmosphere}
            showCityLights={filters.layers.has("cityLights")}
            quality={quality}
            terrainSeed={body.terrainSeed}
            geographyType={body.geographyType}
            grayscale={!isSystemExplored}
          />
        </mesh>
      )}

      {/* Planetary Shield Orb - Multi-layered for volume */}
      {body.isShielded && (
        <group>
          {/* Main Shield Shell */}
          <mesh scale={1.15}>
            <sphereGeometry args={[visualSize, quality === "low" ? 16 : 32, quality === "low" ? 16 : 32]} />
            <meshBasicMaterial 
              color="#7be9ff" 
              transparent 
              opacity={0.2} 
              blending={THREE.AdditiveBlending} 
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          {/* Outer Shield Glow */}
          <mesh scale={1.22}>
            <sphereGeometry args={[visualSize, quality === "low" ? 16 : 32, quality === "low" ? 16 : 32]} />
            <meshBasicMaterial 
              color="#00ffff" 
              transparent 
              opacity={0.1} 
              blending={THREE.AdditiveBlending} 
              side={THREE.BackSide}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}

      {/* Empire Territory Marker (System View) */}
      {filters.layers.has("empireColors") && body.ownerId && galaxy && (
        <TerritoryMarker body={body} visualSize={visualSize} galaxy={galaxy} />
      )}

      {/* Moving Weather System (Clouds) - Separate transparent layer */}
      {filters.layers.has("weatherSystems") && !!body.atmosphere && (
        <CloudLayer body={body} visualSize={visualSize} quality={quality || "high"} starWorldPos={starWorldPos} starViewPos={starViewPosRef.current} />
      )}

      {/* Invisible Hitbox for easier selection — Billboard ensures it's always a flat disk facing the camera */}
      <mesh 
        ref={hitboxRef}
        onClick={(e) => { e.stopPropagation(); onSelect(body.id); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = "default"; }}
      >
        <sphereGeometry args={[visualSize * 1.3, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Fog of War is now handled via the grayscale prop on PlanetMaterial */}

      {/* Premium Atmospheric Effects - Only show if body has an atmosphere */}
      {body.atmosphere && (
        <>
          {/* Main Atmosphere Glow */}
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
          color={!isSystemExplored ? new THREE.Color().setHSL((body.ringHue ?? 30) / 360, 0, 0.4) : ringColor}
        />
      )}

      {/* Body Label */}
      {view !== "galaxy" && filters.layers.has("objectLabels") && (
        <Html position={[0, 0, 0]} center zIndexRange={[100, 0]}>
          <div ref={labelRef} className={`px-1.5 py-0.5 flex items-center gap-1.5 bg-black/40 backdrop-blur-[2px] border border-white/5 rounded-sm pointer-events-none whitespace-nowrap ${!isSystemExplored ? 'opacity-50 grayscale' : ''}`}>
            <span 
              className="font-mono-hud text-[7px] leading-none uppercase"
              style={{ 
                color: (isSystemExplored && body.ownerId)
                  ? `hsl(${galaxy.empires.find(e => e.id === body.ownerId)?.hue || 0} 75% 65%)` 
                  : "white"
              }}
            >
              {body.type === "star" ? "★" : (BODY_META[body.type as keyof typeof BODY_META]?.icon || "○")} {body.name}
            </span>
          </div>
        </Html>
      )}


      {/* Moon Orbits & Nodes relative to planet */}
      {body.type !== "moon" && galaxy.systemById[body.systemId].bodies
        .filter((m) => m.parentId === body.id)
        .map((m) => (
          <group key={m.id}>
            {filters.layers.has("orbitPaths") && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[m.orbit - 0.02, m.orbit + 0.02, 32]} />
                <meshBasicMaterial color="white" transparent opacity={0.08} side={THREE.DoubleSide} />
              </mesh>
            )}
            <PlanetNode
              body={m}
              parentBody={body}
              view={view}
              controlsRef={controlsRef}
              isFocused={focusedBodyId === m.id}
              onSelect={onSelect}
              onSelectBody={onSelectBody}
              focusedBodyId={focusedBodyId}
              starWorldPos={starWorldPos}
              starType={starType}
              filters={filters}
              isMobilePanelExpanded={isMobilePanelExpanded}
              quality={quality}
              galaxy={galaxy}
              isSystemExplored={isSystemExplored}
            />
          </group>
        ))}
    </group>
  );
}

/* ---------- Hyperlanes ---------- */
import { memo } from "react";
const HyperlaneLines = memo(function HyperlaneLines({ galaxy, filters, matches, fogOfWar, knownSystemIds }: { 
  galaxy: Galaxy; 
  filters: FilterState; 
  matches: (s: StarSystem) => boolean;
  fogOfWar: boolean;
  knownSystemIds: Set<string>;
}) {
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
});

/* ---------- Sector Borders (Voronoi) ---------- */
const SectorBorders = memo(function SectorBorders({ sectors }: { sectors: Sector[] }) {
  const uniforms = useMemo(() => {
    const centroids = new Float32Array(100 * 3);
    const hues = new Float32Array(100);
    sectors.slice(0, 100).forEach((s, i) => {
      centroids[i * 3 + 0] = s.centroid[0];
      centroids[i * 3 + 1] = s.centroid[1];
      centroids[i * 3 + 2] = s.centroid[2];
      hues[i] = s.hue / 360;
    });
    return {
      uCentroids: { value: centroids },
      uHues: { value: hues },
      uCount: { value: Math.min(sectors.length, 100) },
      uTime: { value: 0 }
    };
  }, [sectors]);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.getElapsedTime();
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]} raycast={() => null}>
      <planeGeometry args={[15000, 15000]} />
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
          uniform vec3 uCentroids[100];
          uniform float uHues[100];
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
            for (int i = 0; i < 100; i++) {
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
            
            // "Hard Donut" mask: 
            // 1. Sharp inner hole for the Frontier Core
            float innerAlpha = smoothstep(540.0, 570.0, centerDist);
            // 2. Sharp outer rim at the edge of the stellar disk
            float outerAlpha = smoothstep(4600.0, 4570.0, centerDist);
            
            float alpha = innerAlpha * outerAlpha * 0.45;
            if (alpha < 0.01) discard;

            vec3 sectorColor = hsv2rgb(vec3(uHues[nearestIdx], 0.5, 0.12));
            float borderDist = minDist2 - minDist1;
            // Sharper border lines to prevent ghosting
            float borderLine = 1.0 - smoothstep(0.0, 6.0, borderDist);
            vec3 borderCol = hsv2rgb(vec3(uHues[nearestIdx], 0.8, 0.6));
            vec3 finalColor = mix(sectorColor, borderCol, borderLine * 0.9);
            gl_FragColor = vec4(finalColor, alpha);
          }
        `}
      />
    </mesh>
  );
});

/* ---------- Sector Labels ---------- */
const SectorLabels = memo(function SectorLabels({ sectors }: { sectors: Sector[] }) {
  return (
    <group>
      {sectors.map(s => (
        <Html 
          key={s.id} 
          position={[s.centroid[0], 2, s.centroid[2]]} 
          center 
          distanceFactor={1500}
        >
          <div className="font-mono-hud text-[11px] text-primary/30 uppercase tracking-[0.5em] select-none pointer-events-none whitespace-nowrap drop-shadow-[0_0_10px_rgba(0,255,255,0.2)]">
            {s.name}
          </div>
        </Html>
      ))}
    </group>
  );
});

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
      if (lineRef.current.material) {
        lineRef.current.material.linewidth = Math.max(0.6, Math.min(2.5, camDist / 120));
      }
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
function getSystemGateRadius(system: StarSystem) {
  if (!system) return 25;
  const maxBodyOrbit = system.bodies && system.bodies.length > 0 
    ? Math.max(...system.bodies.map((b) => b.orbit)) 
    : 0;
  const starRadius = STAR_BASE_SIZE[system.starType as keyof typeof STAR_BASE_SIZE] || 1;
  const isExotic = system.starType === "blackhole" || system.starType === "whitehole";
  const starVisualExtent = isExotic ? starRadius * 15.0 : starRadius * 2.5;
  return Math.max(maxBodyOrbit, starVisualExtent, 15) + 30;
}

function JumpGateVisual({ isLocked }: { isLocked: boolean }) {
  const lightsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (lightsRef.current) {
      const t = state.clock.getElapsedTime();
      const speed = isLocked ? 2.5 : 6.0;
      const totalLights = 6;
      
      // Calculate simultaneous blink for locked gates once per frame
      const blinkIntensity = isLocked ? Math.pow((Math.sin(t * speed) + 1) / 2, 8) : 0;
      
      lightsRef.current.children.forEach((lightGroup, i) => {
        let opacity = 0.1;

        if (isLocked) {
          // All blink at the same time
          opacity = 0.1 + blinkIntensity * 0.9;
        } else {
          // Chasing light sequence around the ring
          const normalizedTime = (t * speed) % totalLights;
          const positiveTime = (normalizedTime + totalLights) % totalLights;
          const diff = Math.abs((i - positiveTime + totalLights) % totalLights);
          const dist = Math.min(diff, totalLights - diff);
          
          // Sharp falloff for chasing effect
          const intensity = Math.max(0, 1 - dist * 1.8);
          opacity = 0.1 + intensity * 0.9;
        }

        lightGroup.children.forEach((mesh) => {
          const m = mesh as THREE.Mesh;
          if (m.material) {
            (m.material as THREE.MeshBasicMaterial).opacity = opacity;
          }
        });
      });
    }
  });

  const baseColor = "#000000";
  const glowColor = isLocked ? "#ff2222" : "#00ffff";

  return (
    <group>
      {/* Central light to illuminate the inside of the ring */}
      <pointLight position={[0, 0, 0]} color={glowColor} intensity={1.5} distance={15} />

      {/* Reflective Black Base Torus */}
      <mesh>
        <torusGeometry args={[2.5, 0.35, 32, 64]} />
        <meshStandardMaterial
          color={baseColor}
          metalness={0.9}
          roughness={0.15}
        />
      </mesh>
      
      {/* Outer Glow Torus - Made much smaller and dimmer */}
      <mesh>
        <torusGeometry args={[2.5, 0.45, 16, 64]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={isLocked ? 0.05 : 0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Static Lights that blink */}
      <group ref={lightsRef}>
        {[...Array(6)].map((_, i) => {
          const angle = (i / 6) * Math.PI * 2;
          return (
            <group key={i} position={[Math.cos(angle) * 2.5, Math.sin(angle) * 2.5, 0]}>
              {/* Front Light */}
              <mesh position={[0, 0, 0.36]}>
                <sphereGeometry args={[0.06, 8, 8]} />
                <meshBasicMaterial color={glowColor} transparent opacity={0.1} />
              </mesh>
              {/* Back Light */}
              <mesh position={[0, 0, -0.36]}>
                <sphereGeometry args={[0.06, 8, 8]} />
                <meshBasicMaterial color={glowColor} transparent opacity={0.1} />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
}

function JumpGateMarkers({ system, galaxy, onSelect, filters }: { system: StarSystem; galaxy: Galaxy; onSelect: (id: string) => void; filters: any }) {
  const outer = getSystemGateRadius(system);
  return (
    <group>
      {system.gates.map((gate, i: number) => {
        const angle = (i / system.gates.length) * Math.PI * 2;
        const pos: [number, number, number] = [Math.cos(angle) * outer, 0, Math.sin(angle) * outer];
        const isLocked = !!gate.locked;
        return (
          <group key={gate.id} position={pos} rotation={[0, -angle + Math.PI / 2, 0]}>
            <JumpGateVisual isLocked={isLocked} />
            {/* Invisible Hitbox for easier selection — Billboard ensures it's always a flat disk facing the camera */}
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                if (!isLocked) onSelect(`gate:${gate.targetSystemId}`);
              }}
              onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = isLocked ? "not-allowed" : "pointer"; }}
              onPointerOut={() => { document.body.style.cursor = "default"; }}
            >
              <sphereGeometry args={[4.5, 16, 16]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            {filters.layers.has("objectLabels") && (
              <Html position={[0, 3.5, 0]} center zIndexRange={[100, 0]}>
                <div className={`font-mono-hud text-[7px] bg-background/90 px-1.5 py-0.5 border backdrop-blur-sm whitespace-nowrap uppercase tracking-widest ${
                  isLocked
                    ? "text-red-400 border-red-500/40"
                    : "text-primary border-primary/20"
                }`}>
                  {isLocked ? "⛔ SEALED" : `GATE \u2192 ${galaxy?.systemById?.[gate.targetSystemId]?.name ?? "DEEP SPACE"}`}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

function getGateLocalPosition(system: StarSystem, targetSystemId: string) {
  if (!system || !system.gates) return new THREE.Vector3(15, 0, 0);
  const outer = getSystemGateRadius(system);

  const i = system.gates.findIndex((g) => g.targetSystemId === targetSystemId);
  if (i < 0) return new THREE.Vector3(outer, 0, 0);
  const angle = (i / system.gates.length) * Math.PI * 2;
  return new THREE.Vector3(Math.cos(angle) * outer, 0, Math.sin(angle) * outer);
}

function PlayerFleetVisual({ galaxy, playerSystemId, viewedSystemId, travel, view, controlsRef, trackingShip, onSelect, listener, config }: { galaxy: Galaxy, playerSystemId: string, viewedSystemId: string | null, travel: { targetId: string; startTime: number; endTime: number } | null, view: string, controlsRef?: React.RefObject<CameraControls | null>, trackingShip?: boolean, onSelect?: () => void, listener: THREE.AudioListener | null, config?: ShipConfiguration }) {
  const { camera } = useThree();
  
  const groupRef = useRef<THREE.Group>(null);
  const flashRef = useRef<THREE.Mesh>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const hitboxRef = useRef<THREE.Mesh>(null);
  const labelGroupRef = useRef<THREE.Group>(null);
  
  const [arrivalState, setArrivalState] = useState<{fromId: string, time: number} | null>(null);
  const prevSystemRef = useRef(playerSystemId);
  const prevPosRef = useRef(new THREE.Vector3());
  const arrivalDoneRef = useRef(false);
  
  const jumpSoundRef = useRef<THREE.PositionalAudio>(null);
  const matSoundRef = useRef<THREE.PositionalAudio>(null);
  const engineSoundRef = useRef<THREE.PositionalAudio>(null);
  const hasJumpedRef = useRef(false);
  const hasMattedRef = useRef(false);
  const intensityRef = useRef(0.4);

  // Initialize synthesized buffers
  useEffect(() => {
    if (!listener) return;
    const ctx = listener.context;
    
    if (jumpSoundRef.current) {
      jumpSoundRef.current.setBuffer(createJumpBuffer(ctx));
      jumpSoundRef.current.setRefDistance(15);
      jumpSoundRef.current.setRolloffFactor(1.1);
      jumpSoundRef.current.setVolume(0.2);
    }
    if (matSoundRef.current) {
      matSoundRef.current.setBuffer(createMatBuffer(ctx));
      matSoundRef.current.setRefDistance(15);
      matSoundRef.current.setRolloffFactor(1.1);
      matSoundRef.current.setVolume(0.2);
    }
    if (engineSoundRef.current) {
      engineSoundRef.current.setBuffer(createEngineBuffer(ctx));
      engineSoundRef.current.setRefDistance(20);
      engineSoundRef.current.setRolloffFactor(1.0);
      engineSoundRef.current.setLoop(true);
      engineSoundRef.current.setVolume(0);
      engineSoundRef.current.play();
    }
  }, [listener]);
  
  // Camera Tracking Refs
  const hasInitialPosRef = useRef(false);

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

    const currentViewedId = viewedSystemId || playerSystemId;
    const viewedSystem = galaxy.systemById[currentViewedId];
    if (!viewedSystem) return;

    const sX = view === 'galaxy' ? 0 : viewedSystem.pos[0];
    const sY = view === 'galaxy' ? 0 : viewedSystem.pos[1];
    const sZ = view === 'galaxy' ? 0 : viewedSystem.pos[2];
    
    const globalPos = new THREE.Vector3();
    let scale = 1;
    let engineIntensity = 0.4;
    let flashScale = 0;
    let flashOpacity = 0;

    // Helper: calculate orbital position for idle states (dynamic over time)
    const getIdlePos = (sysPos: number[], starType: string, time: number) => {
      const seed = Math.abs(Math.sin(sysPos[0] * 12.9898 + sysPos[2] * 78.233)) * 43758.5453;
      const baseAngle = (seed % 1) * Math.PI * 2;
      const orbitalPeriod = 60000;
      const timeAngle = ((time % orbitalPeriod) / orbitalPeriod) * Math.PI * 2;
      const angle = baseAngle + timeAngle;
      const starRadius = STAR_BASE_SIZE[starType as keyof typeof STAR_BASE_SIZE] || 2.4;
      const orbitRadius = starRadius * 1.6;
      return new THREE.Vector3(
        sysPos[0] + Math.cos(angle) * orbitRadius,
        sysPos[1],
        sysPos[2] + Math.sin(angle) * orbitRadius
      );
    };

    const SUB_LIGHT_VELOCITY = 2.0;

    if (travel) {
      const elapsed = now - travel.startTime;
      const total = travel.endTime - travel.startTime;
      const targetSys = galaxy.systemById[travel.targetId];
      const startPos = getIdlePos(sourceSys.pos, sourceSys.starType, travel.startTime);
      const gateOffset = getGateLocalPosition(sourceSys, travel.targetId);
      const gatePos = new THREE.Vector3(...sourceSys.pos).add(gateOffset);
      const localDist = startPos.distanceTo(gatePos);
      const idealTransit = (localDist / SUB_LIGHT_VELOCITY) * 1000;
      const idealCharge = 2500;
      const idealJump = 1000;
      const idealTotal = idealTransit + idealCharge + idealJump;
      const scaleFactor = Math.min(1.0, (total * 0.5) / idealTotal);
      const transitTime = idealTransit * scaleFactor;
      const chargeTime = idealCharge * scaleFactor;
      const jumpTime = idealJump * scaleFactor;
      const departureTotal = transitTime + chargeTime + jumpTime;

      if (total === 0) {
        scale = 0;
      } else if (elapsed < departureTotal) {
        if (elapsed < transitTime) {
          const p = elapsed / transitTime;
          const t = Math.pow(p, 1.2); 
          if (view === 'galaxy') {
            const starRadius = STAR_BASE_SIZE[sourceSys.starType as keyof typeof STAR_BASE_SIZE] || 2.4;
            globalPos.set(sourceSys.pos[0] - starRadius * 0.4, sourceSys.pos[1], sourceSys.pos[2] - starRadius * 0.4);
          } else {
            globalPos.lerpVectors(startPos, gatePos, t);
          }
          engineIntensity = (0.8 + t * 2.5) * (1.0 + Math.random() * 0.15);
          if (view !== 'galaxy' && viewedSystemId !== playerSystemId) scale = 0;
        } else if (elapsed < transitTime + chargeTime) {
          const p = (elapsed - transitTime) / chargeTime;
          if (view === 'galaxy') {
            const starRadius = STAR_BASE_SIZE[sourceSys.starType as keyof typeof STAR_BASE_SIZE] || 2.4;
            globalPos.set(sourceSys.pos[0] + starRadius * 0.4, sourceSys.pos[1], sourceSys.pos[2] - starRadius * 0.4);
          } else {
            globalPos.copy(gatePos);
          }
          engineIntensity = 2.5 + Math.sin(p * Math.PI * 10) * 1.0;
          if (view !== 'galaxy' && viewedSystemId !== playerSystemId) scale = 0;
        } else {
          const p = (elapsed - (transitTime + chargeTime)) / jumpTime;
          if (view === 'galaxy') {
            const starRadius = STAR_BASE_SIZE[sourceSys.starType as keyof typeof STAR_BASE_SIZE] || 2.4;
            globalPos.set(sourceSys.pos[0] + starRadius * 0.4, sourceSys.pos[1], sourceSys.pos[2] - starRadius * 0.4);
          } else {
            globalPos.copy(gatePos);
          }
          if (!hasJumpedRef.current && jumpSoundRef.current && view !== 'galaxy' && viewedSystemId === playerSystemId) {
            if (jumpSoundRef.current.isPlaying) jumpSoundRef.current.stop();
            jumpSoundRef.current.play();
            hasJumpedRef.current = true;
          }
          scale = Math.max(0, 1.0 - p * 3);
          flashScale = p * 12;
          flashOpacity = 1.0 - p;
          engineIntensity = 5.0 * (1.0 + Math.random() * 0.2);
          if (view !== 'galaxy' && viewedSystemId !== playerSystemId) scale = 0;
        }
      } else if (elapsed < total) {
        hasJumpedRef.current = false;
        const t = (elapsed - departureTotal) / Math.max(1, total - departureTotal);
        if (view === 'galaxy') {
          const sourceCenter = new THREE.Vector3(...sourceSys.pos);
          const targetCenter = new THREE.Vector3(...targetSys.pos);
          globalPos.lerpVectors(sourceCenter, targetCenter, t);
        } else {
          const sourceGate = new THREE.Vector3(...sourceSys.pos).add(getGateLocalPosition(sourceSys, travel.targetId));
          const targetGate = new THREE.Vector3(...targetSys.pos).add(getGateLocalPosition(targetSys, sourceSys.id));
          globalPos.lerpVectors(sourceGate, targetGate, t);
        }
        engineIntensity = 3.0 + Math.random() * 1.0;
        scale = view === 'galaxy' ? 4.0 : 0; 
      } else {
        scale = 0;
      }
    } else if (arrivalState) {
      const elapsed = now - arrivalState.time;
      const targetSys = sourceSys; 
      const gateOffset = getGateLocalPosition(targetSys, arrivalState.fromId);
      const gatePos = new THREE.Vector3(...targetSys.pos).add(gateOffset);
      const matTime = 800;
      let expectedArrivalEndTime = arrivalState.time + 10000;
      let targetIdlePos = new THREE.Vector3();
      let transitTime = 0;
      let arrivalTotal = 0;
      for (let i = 0; i < 3; i++) {
        targetIdlePos = getIdlePos(targetSys.pos, targetSys.starType, expectedArrivalEndTime);
        const localDist = gatePos.distanceTo(targetIdlePos);
        transitTime = (localDist / SUB_LIGHT_VELOCITY) * 1200;
        arrivalTotal = transitTime + matTime;
        expectedArrivalEndTime = arrivalState.time + arrivalTotal;
      }
      if (elapsed < arrivalTotal) {
        if (elapsed < matTime) {
          const p = elapsed / matTime;
          if (view === 'galaxy') {
            const starRadius = STAR_BASE_SIZE[targetSys.starType as keyof typeof STAR_BASE_SIZE] || 2.4;
            globalPos.set(targetSys.pos[0] + starRadius * 3.0, targetSys.pos[1], targetSys.pos[2] - starRadius * 3.0);
          } else {
            globalPos.copy(gatePos);
          }
          if (!hasMattedRef.current && matSoundRef.current && view !== 'galaxy' && viewedSystemId === playerSystemId) {
            if (matSoundRef.current.isPlaying) matSoundRef.current.stop();
            matSoundRef.current.play();
            hasMattedRef.current = true;
          }
          scale = p;
          flashScale = (1.0 - p) * 10;
          flashOpacity = 1.0 - p;
          engineIntensity = 4.0 * (1.0 + Math.random() * 0.2);
          intensityRef.current = engineIntensity;
        } else {
          hasMattedRef.current = false;
          const p = (elapsed - matTime) / transitTime;
          const eased = 1 - Math.pow(1 - p, 2.0);
          if (view === 'galaxy') {
            const starRadius = STAR_BASE_SIZE[targetSys.starType as keyof typeof STAR_BASE_SIZE] || 2.4;
            globalPos.set(targetSys.pos[0] + starRadius * 0.4, targetSys.pos[1], targetSys.pos[2] - starRadius * 0.4);
          } else {
            globalPos.lerpVectors(gatePos, targetIdlePos, eased);
          }
          engineIntensity = (2.0 - p * 1.5) * (1.0 + Math.random() * 0.15);
          intensityRef.current = engineIntensity;
          if (view !== 'galaxy' && viewedSystemId !== playerSystemId) scale = 0;
        }
      } else {
        if (!arrivalDoneRef.current) {
          arrivalDoneRef.current = true;
          setArrivalState(null);
        }
        globalPos.copy(getIdlePos(targetSys.pos, targetSys.starType, now));
      }
    } else {
      globalPos.copy(getIdlePos(sourceSys.pos, sourceSys.starType, now));
      engineIntensity = 0.3 + Math.sin(now * 0.005) * 0.1;
      intensityRef.current = engineIntensity;
      if (view !== 'galaxy' && viewedSystemId !== playerSystemId) scale = 0;
    }
    const velocity = globalPos.clone().sub(prevPosRef.current);
    if (velocity.lengthSq() > 1e-8) {
      const dir = velocity.clone().normalize();
      const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      groupRef.current.quaternion.slerp(quaternion, 0.15);
    }
    prevPosRef.current.copy(globalPos);
    if (view === 'galaxy') {
      scale = 0;
    }
    groupRef.current.position.copy(globalPos);
    groupRef.current.updateWorldMatrix(true, false);
    if (labelGroupRef.current) {
      labelGroupRef.current.position.copy(globalPos);
      labelGroupRef.current.visible = (view === 'galaxy' || viewedSystemId === playerSystemId);
    }
    const distToCamera = state.camera.position.distanceTo(globalPos);
    let htmlOpacity = 0;
    if (view === 'galaxy') {
      htmlOpacity = 1.0;
    } else if (scale > 0) {
      htmlOpacity = Math.max(0, Math.min(1, (distToCamera - 15) / 10));
    }
    if (hitboxRef.current) {
      const scaleFactor = Math.max(1, distToCamera * 0.06);
      hitboxRef.current.scale.setScalar(scaleFactor);
    }
    if (engineSoundRef.current) {
      const isAudible = view !== 'galaxy' && viewedSystemId === playerSystemId && scale > 0;
      if (!isAudible) {
        engineSoundRef.current.setVolume(0);
      } else {
        const vol = Math.max(0.01, Math.min(0.4, engineIntensity * 0.1));
        engineSoundRef.current.setVolume(vol);
        if (engineSoundRef.current.source) {
          engineSoundRef.current.setPlaybackRate(0.7 + engineIntensity * 0.5);
        }
      }
    }
    if (trackingShip && controlsRef?.current) {
      const controls = controlsRef.current;
      controls.smoothTime = 0;
      controls.restThreshold = 0.0001; 
      const targetX = globalPos.x - sX;
      const targetY = globalPos.y - sY;
      const targetZ = globalPos.z - sZ;
      if (!hasInitialPosRef.current) {
        const zoomDist = 6.0;
        controls.setLookAt(targetX + zoomDist * 0.8, targetY + zoomDist * 0.6, targetZ + zoomDist, targetX, targetY, targetZ, true);
        hasInitialPosRef.current = true;
      } else {
        controls.moveTo(targetX, targetY, targetZ, false);
      }
    } else {
      hasInitialPosRef.current = false;
    }
    groupRef.current.scale.setScalar(Math.max(0.0001, scale));
    if (flashRef.current) {
      const mat = flashRef.current.material as THREE.MeshBasicMaterial;
      flashRef.current.scale.setScalar(Math.max(0, flashScale));
      mat.opacity = Math.max(0, flashOpacity);
      flashRef.current.visible = flashOpacity > 0;
    }
    if (labelRef.current) {
      labelRef.current.style.opacity = htmlOpacity.toString();
      const s = view === 'galaxy' ? Math.max(0.9, Math.min(1.4, 1.0 + (distToCamera - 600) / 1500)) : 1.0;
      labelRef.current.style.transform = `scale(${s})`;
    }
  });

  return (
    <group>
      <group ref={groupRef}>
        {listener && (
          <>
            <positionalAudio ref={jumpSoundRef} args={[listener]} />
            <positionalAudio ref={matSoundRef} args={[listener]} />
            <positionalAudio ref={engineSoundRef} args={[listener]} />
          </>
        )}
        
        {config && (
          <ModularShip 
            config={config} 
            engineIntensityRef={intensityRef} 
            engineColor={config.accentColor} 
          />
        )}

        <mesh
          ref={hitboxRef}
          onClick={(e) => { e.stopPropagation(); onSelect?.(); }}
          onPointerOver={() => { document.body.style.cursor = "pointer"; }}
          onPointerOut={() => { document.body.style.cursor = "default"; }}
        >
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>

      <group ref={labelGroupRef}>
        <Html center position={[0, 0.4, 0]}>
          <div 
            ref={labelRef}
            className="flex flex-col items-center pointer-events-none select-none transition-opacity duration-300"
          >
            <div className="relative flex flex-col items-center text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse">
              <Rocket size={14} className="-rotate-45" />
              {(travel || arrivalState) && (
                <div className="absolute left-[100%] top-0 ml-0.5 flex flex-col-reverse items-center">
                  <ChevronUp size={7} className="text-emerald-400 animate-chevron-blink" style={{ animationDelay: '0s' }} />
                  <ChevronUp size={7} className="text-emerald-400 animate-chevron-blink -my-2.5" style={{ animationDelay: '0.2s' }} />
                  <ChevronUp size={7} className="text-emerald-400 animate-chevron-blink" style={{ animationDelay: '0.4s' }} />
                </div>
              )}
            </div>
            <div className="text-[6px] font-mono-hud mt-1 uppercase text-primary/80">CMDR</div>
          </div>
        </Html>
        
        <mesh ref={flashRef} visible={false}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial 
            color="#88ffcc" 
            transparent 
            opacity={0} 
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}

/* ---------- Empire Territory Rings ---------- */
const EmpireTerritoryRings = memo(function EmpireTerritoryRings({ galaxy, fogOfWar, knownSystemIds }: {
  galaxy: Galaxy;
  fogOfWar: boolean;
  knownSystemIds: Set<string>;
}) {
  const entries = useMemo(() => {
    return galaxy.systems.flatMap((sys) => {
      if (fogOfWar && !knownSystemIds.has(sys.id)) return [];
      
      const ownerCounts = new Map<string, number>();
      for (const b of sys.bodies) {
        if (b.ownerId) ownerCounts.set(b.ownerId, (ownerCounts.get(b.ownerId) ?? 0) + 1);
      }
      
      if (ownerCounts.size === 0) return [];
      
      const totalOwned = [...ownerCounts.values()].reduce((a, b) => a + b, 0);
      const segments = [...ownerCounts.entries()]
        .map(([id, count]) => ({
          empire: galaxy.empires.find(e => e.id === id)!,
          proportion: count / totalOwned
        }))
        .filter(s => s.empire)
        .sort((a, b) => b.proportion - a.proportion);

      return [{ sys, segments }];
    });
  }, [galaxy, fogOfWar, knownSystemIds]);

  return (
    <group>
      {entries.map(({ sys, segments }) => {
        const starRadius = STAR_BASE_SIZE[sys.starType as keyof typeof STAR_BASE_SIZE] || 2.4;
        const innerR = starRadius * 1.8;
        const ringThickness = 1.2;
        const midR = innerR + ringThickness;
        const outerR = midR + 3.5;
        
        const dominantColor = new THREE.Color().setHSL(segments[0].empire.hue / 360, 0.72, 0.55);
        let currentAngle = 0;

        return (
          <group key={sys.id} position={[sys.pos[0], sys.pos[1] + 2.0, sys.pos[2]]}>
            {/* Background Black Ring (Separator) - shifted slightly down */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
              <ringGeometry args={[innerR - 0.1, midR + 0.1, 64]} />
              <meshBasicMaterial color="#000000" transparent={true} opacity={1.0} depthWrite={true} />
            </mesh>
            {/* Proportional Segments */}
            {segments.map((seg) => {
              const gap = 0.04; // Small angular gap
              const thetaLength = Math.max(0.01, seg.proportion * Math.PI * 2 - gap);
              const color = new THREE.Color().setHSL(seg.empire.hue / 360, 0.72, 0.55);
              
              const segment = (
                <mesh key={seg.empire.id} rotation={[-Math.PI / 2, 0, currentAngle + gap / 2]}>
                  <ringGeometry args={[innerR, midR, 64, 1, 0, thetaLength]} />
                  <meshBasicMaterial 
                    color={color} 
                    transparent={true} 
                    opacity={1.0}
                    depthWrite={true}
                    depthTest={true}
                    polygonOffset={true}
                    polygonOffsetFactor={-4} 
                    polygonOffsetUnits={-4}
                    toneMapped={false}
                  />
                </mesh>
              );
              currentAngle += seg.proportion * Math.PI * 2;
              return segment;
            })}

            {/* Outer Influence Glow of dominant owner - shifted further down */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
              <ringGeometry args={[midR, outerR, 64]} />
              <meshBasicMaterial 
                color={dominantColor} 
                transparent 
                opacity={0.06} 
                side={THREE.DoubleSide} 
                depthWrite={false} 
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
});
