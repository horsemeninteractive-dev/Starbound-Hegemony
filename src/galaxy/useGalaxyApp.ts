// Central UI state for the map app. Galaxy data is generated once (deterministic).

import { useMemo, useState, useCallback, useEffect } from "react";
import { generateGalaxy } from "./generate";
import type { Galaxy, StarSystem, Body, ContestState, EconomicStatus, StarType } from "./types";

export type ViewMode = "galaxy" | "system" | "body";
export type DisplayLayer = "hyperlanes" | "sectorBorders" | "sectorLabels" | "objectLabels" | "habitableZones" | "orbitPaths" | "weatherSystems" | "cityLights" | "empireColors";

export interface FilterState {
  contest: Set<ContestState>;
  economy: Set<EconomicStatus>;
  starType: Set<StarType>;
  layers: Set<DisplayLayer>;
}

const ALL_CONTEST: ContestState[] = ["controlled", "contested", "anarchic", "frontier"];
const ALL_ECON: EconomicStatus[] = ["boom", "stable", "recession", "blockaded", "untapped"];
const ALL_STAR: StarType[] = ["O", "B", "A", "F", "G", "K", "M", "whitedwarf", "neutron", "pulsar", "binary", "blackhole", "whitehole", "quasar", "magnetar", "protostar", "dyson_swarm"];
const ALL_LAYERS: DisplayLayer[] = ["hyperlanes", "sectorBorders", "sectorLabels", "objectLabels", "habitableZones", "orbitPaths", "weatherSystems", "cityLights", "empireColors"];

export function useGalaxyApp(seed = 42) {
  const galaxy: Galaxy = useMemo(() => generateGalaxy(seed), [seed]);

  const [view, setView] = useState<ViewMode>("galaxy");
  const [playerSystemId, setPlayerSystemId] = useState<string>("sys-center");
  const [exploredSystemIds, setExploredSystemIds] = useState<Set<string>>(new Set(["sys-center"]));
  const [fogOfWar, setFogOfWar] = useState(true);
  const [instantJump, setInstantJump] = useState(false);
  
  const [travel, setTravel] = useState<{ targetId: string; startTime: number; endTime: number } | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const [ap, setAp] = useState(240);
  const [sc, setSc] = useState(15200);

  // Update clock for countdowns
  useEffect(() => {
    if (!travel) return;
    const t = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(t);
  }, [travel]);

  const [systemId, setSystemId] = useState<string | null>(null);
  const [bodyId, setBodyId] = useState<string | null>(null);
  const [hoverSystemId, setHoverSystemId] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    contest: new Set(ALL_CONTEST),
    economy: new Set(ALL_ECON),
    starType: new Set(ALL_STAR),
    layers: new Set(ALL_LAYERS),
  });

  const system: StarSystem | null = systemId ? galaxy.systemById[systemId] : null;
  const body: Body | null = useMemo(() => {
    if (!system || !bodyId) return null;
    if (bodyId === "ship") {
      return {
        id: "ship",
        systemId: system.id,
        name: "HEG Flagship",
        type: "ship",
        subtype: "commander",
        size: 0.0003,
        orbit: 0,
        phase: 0,
        hue: 0,
        hasRings: false,
        desc: "The Commander's flagship. Fully equipped for deep space exploration and combat.",
        resources: [],
        structures: [],
        population: 0,
        economy: "stable",
        habitabilityZone: "none",
        temperature: 295,
        flora: "none",
        fauna: "none",
        hazards: [],
        ownerId: "hegemony"
      } as any as Body;
    }
    return system.bodies.find((b) => b.id === bodyId) ?? null;
  }, [system, bodyId]);

  const knownSystemIds = useMemo(() => {
    // 1. Start with all explored systems (stay visible forever)
    const known = new Set<string>(exploredSystemIds);
    
    // 2. Add systems within 2 jumps of current position (sensor range)
    const queue: [string, number][] = [[playerSystemId, 0]];
    known.add(playerSystemId);
    
    const bfsVisited = new Set<string>([playerSystemId]);
    let head = 0;
    while (head < queue.length) {
      const [id, depth] = queue[head++];
      if (depth >= 2) continue;
      
      for (const lane of galaxy.hyperlanes) {
        let neighbor = "";
        if (lane.a === id) neighbor = lane.b;
        else if (lane.b === id) neighbor = lane.a;
        
        if (neighbor && !bfsVisited.has(neighbor)) {
          bfsVisited.add(neighbor);
          known.add(neighbor);
          queue.push([neighbor, depth + 1]);
        }
      }
    }
    return known;
  }, [playerSystemId, galaxy, exploredSystemIds]);

  const initiateJump = useCallback((targetId: string) => {
    if (travel) return; // Already moving
    const currentPos = galaxy.systemById[playerSystemId].pos;
    const targetPos = galaxy.systemById[targetId].pos;
    const dist = Math.hypot(currentPos[0] - targetPos[0], currentPos[1] - targetPos[1], currentPos[2] - targetPos[2]);
    
    // Total travel time includes: 
    // - Sub-light departure (transit to gate + charge)
    // - FTL transit (proportional to distance)
    // - Sub-light arrival (materialize + transit to star)
    const subLightBuffer = 25; // Increased buffer for variable local transits
    const durationMs = instantJump ? 0 : (subLightBuffer + dist * 1.5) * 1000;
    const now = Date.now();
    setTravel({ targetId, startTime: now, endTime: now + durationMs });
  }, [playerSystemId, galaxy, travel, instantJump]);

  // Arrive at destination
  useEffect(() => {
    if (travel && currentTime >= travel.endTime) {
      const targetId = travel.targetId;
      setPlayerSystemId(targetId);
      setTravel(null);
      setExploredSystemIds(prev => {
        const next = new Set(prev);
        next.add(targetId);
        return next;
      });
    }
  }, [travel, currentTime]);

  const openSystem = useCallback((id: string) => {
    setSystemId(id);
    setBodyId(null);
    setView("system");
  }, []);

  const openBody = useCallback((id: string) => {
    setBodyId(id);
    setView("body");
  }, []);

  const backToGalaxy = useCallback(() => {
    setView("galaxy");
    setSystemId(null);
    setBodyId(null);
  }, []);

  const backToSystem = useCallback(() => {
    setView("system");
    setBodyId(null);
  }, []);

  const toggleFilter = <K extends keyof FilterState>(kind: K, value: FilterState[K] extends Set<infer V> ? V : never) => {
    setFilters((prev) => {
      const next = new Set(prev[kind] as Set<unknown>);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...prev, [kind]: next } as FilterState;
    });
  };

  const systemMatchesFilter = useCallback(
    (s: StarSystem) =>
      filters.contest.has(s.contest) &&
      filters.economy.has(s.economy) &&
      filters.starType.has(s.starType),
    [filters]
  );

  return {
    galaxy,
    view,
    system,
    body,
    hoverSystemId,
    setHoverSystemId,
    filters,
    toggleFilter,
    systemMatchesFilter,
    openSystem,
    openBody,
    backToGalaxy,
    backToSystem,
    playerSystemId,
    travel,
    initiateJump,
    currentTime,
    exploredSystemIds,
    knownSystemIds,
    fogOfWar,
    setFogOfWar,
    instantJump,
    setInstantJump,
    ap,
    setAp,
    sc,
    setSc,
  };
}

export type GalaxyApp = ReturnType<typeof useGalaxyApp>;
