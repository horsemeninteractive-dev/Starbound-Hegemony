// Central UI state for the map app. Galaxy data is generated once (deterministic).

import { useMemo, useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { generateGalaxy } from "./generate";
import type { Galaxy, StarSystem, Body, ContestState, EconomicStatus, StarType, PlanetSubtype } from "./types";
import { STAR_META, CONTEST_META, ECON_META, BODY_META, STAR_BASE_SIZE, getOrbitalSpeed, getBodyPosition } from "./meta";
import { ShipConfiguration, DEFAULT_SHIP_CONFIG } from "./shipPresets";

export type ViewMode = "galaxy" | "system" | "body" | "ship";
export type DisplayLayer = "hyperlanes" | "sectorBorders" | "sectorLabels" | "objectLabels" | "habitableZones" | "orbitPaths" | "weatherSystems" | "cityLights" | "empireColors";

export interface FilterState {
  contest: Set<ContestState>;
  economy: Set<EconomicStatus>;
  starType: Set<StarType>;
  layers: Set<DisplayLayer>;
}

const ALL_CONTEST: ContestState[] = ["controlled", "contested", "anarchic", "frontier"];
const ALL_ECON: EconomicStatus[] = ["boom", "stable", "recession", "blockaded", "untapped"];
const ALL_STAR: StarType[] = ["O", "B", "A", "F", "G", "K", "M", "whitedwarf", "neutron", "pulsar", "binary", "trinary", "blackhole", "whitehole", "magnetar", "protostar", "dyson_swarm"];
const ALL_LAYERS: DisplayLayer[] = ["hyperlanes", "sectorBorders", "sectorLabels", "objectLabels", "habitableZones", "orbitPaths", "weatherSystems", "cityLights", "empireColors"];

import avatar from "@/assets/avatar.png";
import avatar_alt1 from "@/assets/avatar_alt1.png";
import avatar_alt2 from "@/assets/avatar_alt2.png";

import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export function useGalaxyApp(initialSeed = 20260423) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const [seed, setSeed] = useState(() => {
    const saved = localStorage.getItem("galaxy_seed");
    return saved ? Number(saved) : initialSeed;
  });

  const galaxy: Galaxy = useMemo(() => generateGalaxy(seed), [seed]);

  const [view, setView] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("view") as ViewMode;
    if (saved === "galaxy" || saved === "system") return saved;
    return "galaxy";
  });
  const [playerSystemId, setPlayerSystemId] = useState<string>(
    () => localStorage.getItem("playerSystemId") ?? "sys-center"
  );
  const [playerBodyId, setPlayerBodyId] = useState<string>(
    () => localStorage.getItem("playerBodyId") ?? "star"
  );
  const [exploredSystemIds, setExploredSystemIds] = useState<Set<string>>(
    () => new Set(JSON.parse(localStorage.getItem("exploredIds") ?? '["sys-center"]'))
  );
  const [exploredBodyIds, setExploredBodyIds] = useState<Set<string>>(
    () => new Set(JSON.parse(localStorage.getItem("exploredBodyIds") ?? '["sys-center:star"]'))
  );
  const [fogOfWar, setFogOfWarState] = useState(() => localStorage.getItem("fogOfWar") !== "false");
  const [instantJump, setInstantJumpState] = useState(() => localStorage.getItem("instantJump") === "true");
  
  const [travel, setTravel] = useState<{ targetId: string; startTime: number; endTime: number; type?: "inter" | "intra" } | null>(() => {
    const saved = localStorage.getItem("travel");
    return saved ? JSON.parse(saved) : null;
  });
  const [currentTime, setCurrentTime] = useState(Date.now());

  const [ap, setAp] = useState(() => Number(localStorage.getItem("ap") ?? 240));
  const [sc, setSc] = useState(() => Number(localStorage.getItem("sc") ?? 15000));

  const [playerName, setPlayerName] = useState(() => localStorage.getItem("playerName") ?? "Majora");
  const [playerLevel, setPlayerLevel] = useState(() => Number(localStorage.getItem("playerLevel") ?? 1));
  const [playerXP, setPlayerXP] = useState(() => Number(localStorage.getItem("playerXP") ?? 0));
  const [playerAvatar, setPlayerAvatar] = useState(() => localStorage.getItem("playerAvatar") ?? avatar);
  const [shipConfig, setShipConfig] = useState<ShipConfiguration>(() => {
    const saved = localStorage.getItem("shipConfig");
    return saved ? JSON.parse(saved) : DEFAULT_SHIP_CONFIG;
  });
  const [page, setPage] = useState<"map" | "profile" | "articles" | "factories" | "fleets" | "party" | "skills" | "shipyard" | "empire">("map");
  const [selectedEmpireId, setSelectedEmpireId] = useState<string | null>(null);
  const [systemId, setSystemId] = useState<string | null>(() => localStorage.getItem("systemId"));
  const [bodyId, setBodyId] = useState<string | null>(() => localStorage.getItem("bodyId"));
  const [hoverSystemId, setHoverSystemId] = useState<string | null>(null);

  const [onboardingCompleted, setOnboardingCompleted] = useState(() => localStorage.getItem("onboardingCompleted") === "true");
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  
  const [audioEnabled, setAudioEnabled] = useState(() => localStorage.getItem("audioEnabled") !== "false");
  const [musicVolume, setMusicVolume] = useState(() => Number(localStorage.getItem("musicVolume") ?? 0.4));
  const [sfxVolume, setSfxVolume] = useState(() => Number(localStorage.getItem("sfxVolume") ?? 0.6));
  const [fxVolume, setFxVolume] = useState(() => Number(localStorage.getItem("fxVolume") ?? 0.5));

  // --- SUPABASE SYNC LOGIC ---

  // 1. Initial Session & Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setSessionLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Load User Data from Supabase
  useEffect(() => {
    if (!user) {
      setInitialDataLoaded(false);
      return;
    }

    const loadData = async () => {
      try {
        // Load Profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setPlayerName(profile.commander_name || "Majora");
          setPlayerAvatar(profile.avatar_url || avatar);
          setPlayerLevel(profile.level);
          setPlayerXP(profile.xp);
          setSc(profile.credits);
          setOnboardingCompleted(profile.onboarding_completed);
        }

        // Load active Vessel
        const { data: vessel } = await supabase
          .from('vessels')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (vessel) {
          setShipConfig({
            primaryColor: vessel.primary_color,
            accentColor: vessel.accent_color,
            hullId: vessel.hull_id,
            wingsId: vessel.wings_id,
            enginesId: vessel.engines_id,
            bridgeId: vessel.bridge_id,
          });
        }

        // Load Exploration
        const { data: exploration } = await supabase
          .from('exploration_logs')
          .select('system_id')
          .eq('user_id', user.id);
        
        if (exploration && exploration.length > 0) {
          setExploredSystemIds(new Set(exploration.map(e => e.system_id)));
        }
      } catch (err) {
        console.error("Error loading user data:", err);
      } finally {
        setInitialDataLoaded(true);
      }
    };

    loadData();
  }, [user]);

  // 3. Save Data to Supabase (Debounced/Automatic via useEffects)
  useEffect(() => {
    if (!user || !initialDataLoaded) return;
    const updateProfile = async () => {
      await supabase.from('profiles').upsert({
        id: user.id,
        commander_name: playerName,
        avatar_url: playerAvatar,
        level: playerLevel,
        xp: playerXP,
        credits: sc,
        onboarding_completed: onboardingCompleted,
        updated_at: new Date().toISOString()
      });
    };
    updateProfile();
  }, [user, initialDataLoaded, playerName, playerAvatar, playerLevel, playerXP, sc, onboardingCompleted]);

  useEffect(() => {
    if (!user || !initialDataLoaded) return;
    const updateVessel = async () => {
      await supabase.from('vessels').upsert({
        user_id: user.id,
        primary_color: shipConfig.primaryColor,
        accent_color: shipConfig.accentColor,
        hull_id: shipConfig.hullId,
        wings_id: shipConfig.wingsId,
        engines_id: shipConfig.enginesId,
        bridge_id: shipConfig.bridgeId,
        is_active: true
      }, { onConflict: 'user_id' }); 
    };
    updateVessel();
  }, [user, initialDataLoaded, shipConfig]);

  // --- LOCALSTORAGE PERSISTENCE (Fallback/Sync) ---
  const setFogOfWar = (v: boolean) => {
    setFogOfWarState(v);
    localStorage.setItem("fogOfWar", String(v));
  };

  const setInstantJump = (v: boolean) => {
    setInstantJumpState(v);
    localStorage.setItem("instantJump", String(v));
  };

  const resetGalaxy = () => {
    setPlayerSystemId("sys-center");
    setExploredSystemIds(new Set(["sys-center"]));
    setTravel(null);
    setView("system");
    setSystemId("sys-center");
    setBodyId(null);
    toast.success("Galaxy reset", {
      description: "Returned to central star. Exploration logs cleared."
    });
  };

  const regenerateGalaxy = () => {
    const newSeed = Math.floor(Math.random() * 1000000);
    setSeed(newSeed);
    localStorage.setItem("galaxy_seed", String(newSeed));
    
    // Reset state as well
    setPlayerSystemId("sys-center");
    setExploredSystemIds(new Set(["sys-center"]));
    setTravel(null);
    setView("system");
    setSystemId("sys-center");
    setBodyId(null);

    toast.success("Galaxy regenerated", {
      description: `New Seed: ${newSeed}. Coordinates shifted.`
    });
  };

  // Persist state to localStorage
  useEffect(() => { localStorage.setItem("playerSystemId", playerSystemId); }, [playerSystemId]);
  useEffect(() => { localStorage.setItem("playerBodyId", playerBodyId); }, [playerBodyId]);
  useEffect(() => { localStorage.setItem("exploredIds", JSON.stringify([...exploredSystemIds])); }, [exploredSystemIds]);
  useEffect(() => { localStorage.setItem("exploredBodyIds", JSON.stringify([...exploredBodyIds])); }, [exploredBodyIds]);
  useEffect(() => { 
    if (view === "galaxy" || view === "system") {
      localStorage.setItem("view", view); 
    }
  }, [view]);
  useEffect(() => { 
    if (systemId) localStorage.setItem("systemId", systemId);
    else localStorage.setItem("systemId", "");
  }, [systemId]);
  useEffect(() => { 
    if (bodyId) localStorage.setItem("bodyId", bodyId);
    else localStorage.setItem("bodyId", "");
  }, [bodyId]);
  useEffect(() => { 
    if (travel) localStorage.setItem("travel", JSON.stringify(travel));
    else localStorage.removeItem("travel");
  }, [travel]);

  useEffect(() => { localStorage.setItem("ap", String(ap)); }, [ap]);
  useEffect(() => { localStorage.setItem("sc", String(sc)); }, [sc]);
  useEffect(() => { localStorage.setItem("playerName", playerName); }, [playerName]);
  useEffect(() => { localStorage.setItem("playerLevel", String(playerLevel)); }, [playerLevel]);
  useEffect(() => { localStorage.setItem("playerXP", String(playerXP)); }, [playerXP]);
  useEffect(() => { localStorage.setItem("playerAvatar", playerAvatar); }, [playerAvatar]);
  useEffect(() => { localStorage.setItem("shipConfig", JSON.stringify(shipConfig)); }, [shipConfig]);
  useEffect(() => { localStorage.setItem("onboardingCompleted", String(onboardingCompleted)); }, [onboardingCompleted]);
  useEffect(() => { localStorage.setItem("audioEnabled", String(audioEnabled)); }, [audioEnabled]);
  useEffect(() => { localStorage.setItem("musicVolume", String(musicVolume)); }, [musicVolume]);
  useEffect(() => { localStorage.setItem("sfxVolume", String(sfxVolume)); }, [sfxVolume]);
  useEffect(() => { localStorage.setItem("fxVolume", String(fxVolume)); }, [fxVolume]);

  // Unified Global Timer: AP regeneration and Clock Update
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      setCurrentTime(now);

      // 1. AP Regen (20 AP/hour on the hour boundary)
      let lastRegenStr = localStorage.getItem("lastApRegen");
      if (!lastRegenStr) {
        const initialRegen = new Date(now).setMinutes(0, 0, 0);
        localStorage.setItem("lastApRegen", String(initialRegen));
        lastRegenStr = String(initialRegen);
      }
      
      const lastRegen = Number(lastRegenStr);
      const hoursPassed = Math.floor((now - lastRegen) / 3600000);

      if (hoursPassed > 0) {
        setAp(prev => Math.min(240, prev + (hoursPassed * 20)));
        const newRegenTime = lastRegen + (hoursPassed * 3600000);
        localStorage.setItem("lastApRegen", String(newRegenTime));
      }
    };

    tick(); // Initial sync
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);


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
      const shipBody: Body = {
        id: "ship",
        systemId: system.id,
        name: "Commander's Vessel",
        type: "ship",
        subtype: "commander",
        size: 0.0003,
        orbit: 0,
        phase: 0,
        hue: 0,
        hasRings: false,
        population: 0,
        economy: "stable",
        habitabilityZone: "none",
        temperature: 295,
        flora: "none",
        fauna: "none",
        hazards: [],
        ownerId: "hegemony",
        deposits: []
      };
      return shipBody;
    }
    if (bodyId === "star") {
      const starBody: Body = {
        id: "star",
        systemId: system.id,
        name: system.name,
        type: "star",
        subtype: system.starType as PlanetSubtype,
        size: STAR_BASE_SIZE[system.starType] || 2,
        orbit: 0,
        phase: 0,
        hue: 0,
        hasRings: false,
        population: 0,
        economy: system.economy,
        habitabilityZone: "hot",
        temperature: 5000,
        flora: "none",
        fauna: "none",
        hazards: ["Radiation", "Extreme Heat"],
        ownerId: "hegemony",
        deposits: [],
        atmosphere: "Stellar Corona"
      };
      return starBody;
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

  const getJumpCost = useCallback((targetId: string) => {
    const s1 = galaxy.systemById[playerSystemId];
    const s2 = galaxy.systemById[targetId];
    if (!s1 || !s2) return 0;
    const dist = Math.hypot(s1.pos[0] - s2.pos[0], s1.pos[1] - s2.pos[1], s1.pos[2] - s2.pos[2]);
    // Formula: 10 AP base + 1 AP per 30 scene units
    return Math.floor(10 + dist / 30);
  }, [galaxy, playerSystemId]);

  const initiateJump = useCallback((targetId: string) => {
    if (travel) return; // Already moving
    
    const cost = getJumpCost(targetId);
    if (ap < cost) {
      toast.error(`Insufficient AP! Jump requires ${cost} AP (Current: ${Math.floor(ap)})`, {
      description: "AP regenerates at 20/hour (distributed on the hour)."
      });
      return;
    }

    const currentPos = galaxy.systemById[playerSystemId].pos;
    const targetPos = galaxy.systemById[targetId].pos;
    const dist = Math.hypot(currentPos[0] - targetPos[0], currentPos[1] - targetPos[1], currentPos[2] - targetPos[2]);
    
    // Total travel time includes: 
    // - Sub-light departure (transit to gate + charge)
    // - FTL transit (proportional to distance)
    // - Sub-light arrival (materialize + transit to star)
    // FTL transit: 15s base (prep) + distance factor
    const durationMs = instantJump ? 0 : (15 + dist * 1.2) * 1000;
    const now = Date.now();
    
    setAp(prev => prev - cost);
    setTravel({ targetId, startTime: now, endTime: now + durationMs, type: "inter" });
  }, [playerSystemId, galaxy, travel, instantJump, ap, getJumpCost]);

  const initiateTravelToBody = useCallback((targetBodyId: string) => {
    if (travel) return;
    
    // Intra-system travel distance
    const currentSystem = galaxy.systemById[playerSystemId];
    if (!currentSystem) return;

    const startBody = playerBodyId === "star" ? null : currentSystem.bodies.find(b => b.id === playerBodyId);
    const targetBody = targetBodyId === "star" ? null : currentSystem.bodies.find(b => b.id === targetBodyId);
    
    const now = Date.now();
    const startPos = startBody ? getBodyPosition(startBody, currentSystem.starType, now) : { x: 0, z: 0 };
    const targetPos = targetBody ? getBodyPosition(targetBody, currentSystem.starType, now) : { x: 0, z: 0 };
    
    const dx = targetPos.x - startPos.x;
    const dz = targetPos.z - startPos.z;
    const dist = Math.sqrt(dx*dx + dz*dz);

    // Intra-system travel cost: 5 AP base + 2 AP per 500 AU
    const cost = 5 + Math.floor(dist / 250); 
    if (ap < cost) {
      toast.error(`Insufficient AP! Travel requires ${cost} AP`, {
        description: "Intra-system sub-light travel requires fuel based on distance."
      });
      return;
    }

    // Dynamic speed (AU/ms) - Cinematic pace (15 AU/s)
    const travelSpeed = 0.015; 
    const durationMs = instantJump ? 0 : Math.max(5000, dist / travelSpeed);    
    setAp(prev => prev - cost);
    setTravel({ targetId: targetBodyId, startTime: now, endTime: now + durationMs, type: "intra" });
  }, [travel, ap, instantJump, playerSystemId, playerBodyId, galaxy]);

  const [arrival, setArrival] = useState<{ fromId: string; startTime: number; duration: number } | null>(null);

  // Arrive at destination
  useEffect(() => {
    if (travel && currentTime >= travel.endTime) {
      const targetId = travel.targetId;
      const travelType = travel.type ?? "inter";

      if (travelType === "intra") {
        setPlayerBodyId(targetId);
        setExploredBodyIds(prev => {
          const next = new Set(prev);
          next.add(`${playerSystemId}:${targetId}`);
          return next;
        });
        setTravel(null);
        toast.success("Arrival confirmed", {
          description: `Vessel has entered orbit around ${targetId === "star" ? "the system star" : targetId}.`
        });
      } else {
        const fromId = playerSystemId;
        setPlayerSystemId(targetId);
        setPlayerBodyId("star"); // Default to star on jump arrival
        setTravel(null);
        
        // Set arrival sequence (approx 10s sub-light transit to star)
        setArrival({ fromId, startTime: currentTime, duration: 10000 });

        setExploredSystemIds(prev => {
          const next = new Set(prev);
          next.add(targetId);
          return next;
        });
        setExploredBodyIds(prev => {
          const next = new Set(prev);
          next.add(`${targetId}:star`);
          return next;
        });
      }
    }
  }, [travel, currentTime, playerSystemId]);

  // Clear arrival after duration
  useEffect(() => {
    if (arrival && currentTime >= arrival.startTime + arrival.duration) {
      setArrival(null);
    }
  }, [arrival, currentTime]);

  const openSystem = useCallback((id: string) => {
    setSystemId(id);
    setBodyId(null);
    setView("system");
  }, []);

  const selectSystem = useCallback((id: string | null) => {
    setSystemId(id);
    setBodyId(null);
  }, []);

  const openBody = useCallback((id: string) => {
    setBodyId(id);
    setView("body");
  }, []);

  const openShip = useCallback(() => {
    setBodyId("ship");
    setView("ship");
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
    knownSystemIds,
    systemMatchesFilter,
    playerName,
    setPlayerName,
    playerLevel,
    playerXP,
    playerAvatar,
    setPlayerAvatar,
    shipConfig,
    setShipConfig,
    onboardingCompleted,
    setOnboardingCompleted,
    setPage,
    page,
    selectedEmpireId,
    setSelectedEmpireId,
    xpToNextLevel: playerLevel * 1000,
    openSystem,
    selectSystem,
    openBody,
    openShip,
    backToGalaxy,
    backToSystem,
    playerSystemId,
    playerBodyId,
    travel,
    arrival,
    getJumpCost,
    initiateJump,
    initiateTravelToBody,
    currentTime,
    exploredSystemIds,
    exploredBodyIds,
    fogOfWar,
    setFogOfWar,
    instantJump,
    setInstantJump,
    resetGalaxy,
    regenerateGalaxy,
    seed,
    ap,
    setAp,
    sc,
    setSc,
    audioEnabled,
    setAudioEnabled,
    musicVolume,
    setMusicVolume,
    sfxVolume,
    setSfxVolume,
    fxVolume,
    setFxVolume,
    user,
    sessionLoading,
  };
}

export type GalaxyApp = ReturnType<typeof useGalaxyApp>;
