import type { Galaxy, StarSystem, Body, Installation, BodyResource, UserResource, FactoryWorker, Residency, ResidencyApplication, SiloInventoryEntry } from "@/galaxy/types";
import { STAR_META, CONTEST_META, ECON_META, BODY_META, RESOURCE_META, INFRA_META, RICHNESS_VALUES, T1_RESOURCES, T2_RESOURCES, T3_RESOURCES } from "@/galaxy/meta";
import { Zap, Scale, Crown, Shield, Building2, Pickaxe, UserPlus, LogOut, Briefcase as JobIcon, Coins as SC_Icon, Package, Settings, ArrowUp, ArrowUpDown, ChevronRight, Thermometer, Wind, Mountain, Users, Globe, Activity, CircleDot, Anchor, Hammer } from "lucide-react";
import { GalaxyIcon } from "./ResourceIcon";
import { useMemo, useState } from "react";
import { PlanetSurface } from "./PlanetSurface";

/* ======================= GALAXY OVERVIEW ======================= */
export function GalaxyOverview({ galaxy, hideHeader }: { galaxy: Galaxy; hideHeader?: boolean }) {
  const bodyCount = galaxy.systems.reduce((s, x) => s + x.bodies.length, 0);
  const contested = galaxy.systems.filter((s) => s.contest === "contested").length;
  const controlled = galaxy.systems.filter((s) => s.contest === "controlled").length;
  return (
    <Panel title="The Viridian Expanse" subtitle={`Census · Seed ${galaxy.seed}`} hideHeader={hideHeader}>
      <Row k="Sectors" v={galaxy.sectors.length} />
      <Row k="Star Systems" v={galaxy.systems.length} />
      <Row k="Celestial Bodies" v={bodyCount} />
      <Row k="Hyperlanes" v={galaxy.hyperlanes.length} />
      <Row k="Empires" v={galaxy.empires.length} />
      <Divider />
      <Row k="Controlled" v={controlled} accent="text-success" />
      <Row k="Contested" v={contested} accent="text-warning" />
      <Hint>Tap a star to enter its system.</Hint>
    </Panel>
  );
}

/* ======================= SYSTEM OVERVIEW ======================= */
export function SystemOverview({ system, galaxy, onSelectBody, playerSystemId, originSystemId, travel, arrival, initiateJump, calculatePath, getPathCost, getJumpCostBetween, currentTime, isExplored, hideHeader, hideActions, onPlayClick, onSelectEmpire, onEnterSystem, shipName }: {
  system: StarSystem;
  galaxy: Galaxy;
  onSelectBody: (id: string) => void;
  playerSystemId: string;
  originSystemId?: string;
  travel: { targetId: string; startTime: number; endTime: number } | null;
  arrival: { fromId: string; startTime: number; duration: number } | null;
  initiateJump: (id: string) => void;
  calculatePath: (startId: string, targetId: string) => string[] | null;
  getPathCost: (path: string[]) => number;
  getJumpCostBetween: (s1Id: string, s2Id: string) => number;
  currentTime: number;
  isExplored: boolean;
  hideHeader?: boolean;
  hideActions?: boolean;
  onPlayClick?: () => void;
  onSelectEmpire?: (id: string) => void;
  onEnterSystem?: () => void;
  shipName?: string;
}) {
  const [activeTab, setActiveTab] = useState<"info" | "bodies">("info");
  const explored = isExplored || system.id === "sys-center";
  const meta = STAR_META[system.starType];
  const sector = galaxy.sectorById[system.sectorId];
  const planets = system.bodies.filter((b) => b.type === "terrestrial" || b.type === "gas_giant");
  const moons = system.bodies.filter((b) => b.type === "moon").length;
  const asteroids = system.bodies.filter((b) => b.type === "asteroid").length;
  const stations = system.bodies.filter((b) => b.type === "station").length;

  const owners = new Map<string, number>();
  for (const b of system.bodies) {
    if (b.ownerId) owners.set(b.ownerId, (owners.get(b.ownerId) ?? 0) + 1);
  }

  const originSysId = originSystemId || playerSystemId;
  const isCurrent = playerSystemId === system.id;
  const isOriginCurrent = originSysId === system.id;
  const isTravelingToThis = travel?.targetId === system.id;

  const path = useMemo(() => {
    if (isOriginCurrent) return null;
    return calculatePath(originSysId, system.id);
  }, [calculatePath, originSysId, system.id, isOriginCurrent]);

  const pathCost = useMemo(() => {
    if (!path || path.length < 2) return 0;
    return getPathCost(path);
  }, [getPathCost, path]);

  const canJump = path && path.length >= 2;
  const isAdjacent = canJump && path.length === 2;

  const eta = useMemo(() => {
    if (!path || path.length < 2) return 0;
    let totalDuration = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const s1 = galaxy.systemById[path[i]];
      const s2 = galaxy.systemById[path[i + 1]];
      if (!s1 || !s2) continue;
      const region = s1.regionId ? galaxy.regions?.find(r => r.id === s1.regionId) : null;
      const slowdown = region?.type === "nebula" ? 2.5 : 1.0;
      const dist = Math.hypot(s1.pos[0] - s2.pos[0], s1.pos[1] - s2.pos[1], s1.pos[2] - s2.pos[2]);
      totalDuration += (15 + dist * 1.2 * slowdown);
    }
    return Math.ceil(totalDuration);
  }, [path, galaxy]);

  return (
    <Panel title={system.name} subtitle={sector?.name ?? "Unknown Sector"} hideHeader={hideHeader}>
      {/* High-Level System Actions */}
      <div className="space-y-3 mb-4">
        {!hideActions && onEnterSystem && (
          <button
            onClick={() => {
              onEnterSystem();
              onPlayClick?.();
            }}
            className="w-full py-2.5 bg-primary text-background font-display text-[10px] font-bold uppercase tracking-[0.2em] rounded border border-primary/40 hover:bg-primary/80 transition-all flex items-center justify-center gap-2 group"
          >
            <Zap size={14} fill="currentColor" className="group-hover:scale-110 transition-transform" />
            Enter System
          </button>
        )}

        {isCurrent && (
          <div className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded flex items-center justify-between">
            <span className="text-[9px] font-bold text-primary tracking-widest">STATIONARY</span>
            <span className="text-[9px] text-primary/60 font-mono-hud uppercase">Current Location</span>
          </div>
        )}

        {!isCurrent && isOriginCurrent && (
          <div className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded flex items-center justify-between">
            <span className="text-[9px] font-bold text-primary tracking-widest">STATIONARY</span>
            <span className="text-[9px] text-primary/60 font-mono-hud uppercase">Selected Entity Location</span>
          </div>
        )}

        {isTravelingToThis && travel && (
          <div className="bg-warning/10 border border-warning/20 px-3 py-2 rounded">
            <div className="flex justify-between mb-1">
              <span className="text-[10px] font-bold text-warning uppercase">FTL Transit</span>
              <span className="text-[10px] text-warning font-mono-hud">{Math.ceil((travel.endTime - currentTime) / 1000)}s</span>
            </div>
            <div className="h-1 w-full bg-warning/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-warning animate-pulse" 
                style={{ width: `${Math.min(100, ((currentTime - travel.startTime) / (travel.endTime - travel.startTime)) * 100)}%` }} 
              />
            </div>
          </div>
        )}

        {!hideActions && !isOriginCurrent && !travel && canJump && (
          <div className="flex flex-col gap-1 w-full">
            <button 
              onClick={() => {
                onPlayClick?.();
                initiateJump(system.id);
              }}
              className="w-full bg-primary hover:bg-primary/80 text-background font-bold py-2 px-4 rounded text-xs tracking-widest transition-colors flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2 text-[10px]">
                <Zap size={12} />
                <span>{isAdjacent ? "FTL JUMP" : `JOURNEY [${path.length - 1} JUMPS]`}</span>
              </span>
              <span className="text-[9px] font-mono-hud text-background/80 border-l border-background/20 pl-2">{pathCost} AP</span>
            </button>
            <div className="text-[9px] text-muted-foreground font-mono-hud text-center uppercase tracking-widest opacity-60">
              Est. Arrival: {eta}s
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-primary/20 mb-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <button 
          onClick={() => { onPlayClick?.(); setActiveTab("info"); }}
          className={`flex-1 py-2 text-[9px] uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 ${activeTab === "info" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-primary/60"}`}
        >
          <Activity size={12} /> Intelligence
        </button>
        <button 
          onClick={() => { onPlayClick?.(); setActiveTab("bodies"); }}
          className={`flex-1 py-2 text-[9px] uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 ${activeTab === "bodies" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-primary/60"}`}
        >
          <Globe size={12} /> Bodies
        </button>
      </div>

      {activeTab === "info" ? (
        <div className="animate-in fade-in slide-in-from-right-2 duration-300">
          <Row k="Star Class" v={explored ? meta.label : "???"} accent={explored ? meta.color : "text-muted-foreground"} />
          <Row k="Description" v={explored ? meta.description : "???"} small />
          <Row k="Temperature" v={explored ? meta.temp : "???"} small />
          
          <Divider />
          <Row k="Status" v={explored ? CONTEST_META[system.contest].label : "???"} accent={explored ? CONTEST_META[system.contest].color : "text-muted-foreground"} />
          <Row k="Economy" v={explored ? ECON_META[system.economy].label : "???"} accent={explored ? ECON_META[system.economy].color : "text-muted-foreground"} />
          <Row k="Jump Gates" v={explored ? system.gates.length : "???"} />
          
          {explored && system.regionId && galaxy.regions && (
            <>
              <Divider />
              {(() => {
                const region = galaxy.regions.find(r => r.id === system.regionId);
                if (!region) return null;
                return (
                  <>
                    <Row k="Regional Zone" v={region.name} accent="text-warning" />
                    <Row k="Hazard Class" v={region.type.replace('_', ' ').toUpperCase()} small />
                    <div className="mt-2 space-y-1">
                      {region.type === "nebula" && (
                        <div className="flex items-center gap-2 text-[8px] text-warning/80 font-mono-hud uppercase tracking-widest pl-2 border-l border-warning/30">
                          <Zap size={10} /> Dimensional Drag: -35% Warp Speed
                        </div>
                      )}
                      {region.type === "dust_cloud" && (
                        <div className="flex items-center gap-2 text-[8px] text-warning/80 font-mono-hud uppercase tracking-widest pl-2 border-l border-warning/30">
                          <Activity size={10} /> Sensor Interference: Range 1 Jump
                        </div>
                      )}
                      {region.type === "ion_storm" && (
                        <div className="flex items-center gap-2 text-[8px] text-warning/80 font-mono-hud uppercase tracking-widest pl-2 border-l border-warning/30">
                          <Zap size={10} /> Neural Scattering: +100% AP Cost
                        </div>
                      )}
                      {region.type === "gravity_rift" && (
                        <div className="flex items-center gap-2 text-[8px] text-warning/80 font-mono-hud uppercase tracking-widest pl-2 border-l border-warning/30">
                          <Zap size={10} /> Gravity Well: +50% Departure AP
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </>
          )}
          
          <Divider />
          <div className="grid grid-cols-2 gap-2">
            <StatCard icon={Globe} label="Planets" value={explored ? planets.length.toString() : "???"} />
            <StatCard icon={CircleDot} label="Moons" value={explored ? moons.toString() : "???"} />
            <StatCard icon={Mountain} label="Asteroids" value={explored ? asteroids.toString() : "???"} />
            <StatCard icon={Building2} label="Stations" value={explored ? stations.toString() : "???"} />
          </div>
          
          {!explored && (
            <div className="mt-4 p-3 border border-dashed border-primary/20 rounded bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 bg-warning rounded-full animate-pulse" />
                <span className="text-[9px] font-mono-hud uppercase text-warning tracking-widest font-bold">Uncharted</span>
              </div>
              <p className="text-[9px] text-primary/60 leading-tight font-mono-hud italic">
                Intelligence blacked out. Physical exploration required for scanning.
              </p>
            </div>
          )}

          {explored && owners.size > 0 && (
            <>
              <Divider />
              <SubTitle>Holdings</SubTitle>
              <div className="space-y-1">
                {Array.from(owners.entries()).map(([id, n]) => {
                  const emp = galaxy.empires.find((e) => e.id === id);
                  if (!emp) return null;
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        onPlayClick?.();
                        onSelectEmpire?.(id);
                      }}
                      className="w-full flex items-center justify-between gap-3 text-[10px] hover:bg-primary/5 transition-colors p-1.5 rounded border border-primary/5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ background: `hsl(${emp.hue} 70% 55%)` }} />
                        <span className="font-mono-hud text-[9px] uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">{emp.tag}</span>
                      </div>
                      <span className="text-foreground font-bold">{n} Assets</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-right-2 duration-300">
          <SubTitle>Orbital Objects (tap to scan)</SubTitle>
          <div className="flex flex-col gap-1 max-h-[40vh] sm:max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
            {/* 1. Internal Vessel Location */}
            {isCurrent && (
              <button
                onClick={() => {
                  onPlayClick?.();
                  onSelectBody("ship");
                }}
                className="flex items-center justify-between gap-2 px-2 py-1.5 text-[9px] uppercase tracking-wider border border-primary/40 bg-primary/20 hover:bg-primary/30 text-left transition mb-1 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]"
              >
                <div className="flex items-center gap-2">
                  <GalaxyIcon name={BODY_META.ship.icon} className="w-3 h-3 text-primary" />
                  <span className="truncate text-primary font-bold">{shipName || "COMMAND SHIP"}</span>
                </div>
                <span className="text-primary/60 font-mono-hud">Flagship</span>
              </button>
            )}

            {!explored ? (
              <div className="p-8 text-center border border-dashed border-primary/10 rounded">
                <Globe size={24} className="mx-auto text-primary/20 mb-2" />
                <div className="text-[9px] text-muted-foreground uppercase tracking-widest">Bodies detected, composition unknown</div>
              </div>
            ) : (
              system.bodies
                .filter(b => !b.parentId) // Top-level only
                .filter((b) => b.type !== "asteroid" || system.bodies.filter(x => x.type === "asteroid").indexOf(b) < 3) // Cap asteroids
                .sort((a, b) => a.orbit - b.orbit) // Orbital order
                .slice(0, 40)
                .map((b) => (
                  <BodyListEntry key={b.id} body={b} onSelect={onSelectBody} depth={0} onPlayClick={onPlayClick} />
                ))
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}

function BodyListEntry({ body, onSelect, depth, onPlayClick }: { body: Body; onSelect: (id: string) => void; depth: number; onPlayClick?: () => void }) {
  const meta = BODY_META[body.type as keyof typeof BODY_META];
  return (
    <>
      <button
        onClick={() => {
          onPlayClick?.();
          onSelect(body.id);
        }}
        className="flex items-center justify-between gap-2 px-2 py-1 text-[10px] uppercase tracking-wider border border-border hover:border-primary/60 hover:bg-primary/5 text-left transition"
        style={{ marginLeft: `${depth * 10}px` }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {depth > 0 && <span className="text-primary/20">└</span>}
          <GalaxyIcon name={meta?.icon} className="w-3 h-3 text-primary shrink-0" />
          <span className="flex-1 truncate text-foreground">{body.name}</span>
        </div>
        <span className="text-muted-foreground shrink-0">{meta?.label || body.type}</span>
      </button>
      {body.children?.map(child => (
        <BodyListEntry key={child.id} body={child} onSelect={onSelect} depth={depth + 1} onPlayClick={onPlayClick} />
      ))}
    </>
  );
}

/* ======================= BODY OVERVIEW ======================= */

/**
 * Converts raw snake_case/underscore enum values to readable labels.
 * Examples:
 *   gas_giant_hot  → "Hot Gas Giant"
 *   gas_giant_cold → "Cold Gas Giant"
 *   gas_giant      → "Gas Giant"
 *   temperate      → "Temperate"
 *   super_earth    → "Super Earth"
 */
function formatLabel(raw: string): string {
  // Special compound mappings first
  const SPECIAL: Record<string, string> = {
    gas_giant_hot:  "Hot Gas Giant",
    gas_giant_cold: "Cold Gas Giant",
    gas_giant:      "Gas Giant",
    super_earth:    "Super Earth",
    dyson_swarm:    "Dyson Swarm",
    white_hole:     "White Hole",
  };
  if (SPECIAL[raw]) return SPECIAL[raw];
  // Generic: replace underscores with spaces, title-case each word
  return raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

  export function BodyOverview({
  body, 
  galaxy, 
  hideHeader, 
  isExplored, 
  isVisited,
  onPlayClick,
  onSelectEmpire,
  playerSystemId,
  originSystemId,
  playerBodyId,
  originBodyId,
  travel,
  initiateTravelToBody,
  currentTime,
  factories,
  bodyResources,
  userResources,
  currentJob,
  onBuildFactory,
  onApplyForJob,
  onWorkJob,
  onLeaveJob,
  onCollect,
  onUpgrade,
  onSaveSettings,
  userId,
  userResidency,
  residencyApplications,
  onClaimResidency,
  bodyGovernance,
  onInitiateGovernance,
  factoryInputStorage,
  onDepositInput,
  onUpgradeInfrastructure,
  onBuildInfrastructure,
  initiateJump,
  calculatePath,
  getPathCost,
  siloInventory,
  onTransferSiloResource
}: { 
  body: Body; 
  galaxy: Galaxy; 
  hideHeader?: boolean; 
  isExplored?: boolean; 
  isVisited?: boolean;
  onPlayClick?: () => void;
  onSelectEmpire?: (id: string) => void;
  playerSystemId: string;
  originSystemId?: string;
  playerBodyId: string;
  originBodyId?: string;
  travel: { targetId: string; startTime: number; endTime: number; type?: "inter" | "intra"; startPos?: { x: number; z: number } } | null;
  initiateTravelToBody: (id: string) => void;
  initiateJump?: (sysId: string, bodyId: string | null) => void;
  calculatePath?: (startId: string, targetId: string) => string[] | null;
  getPathCost?: (path: string[]) => number;
  currentTime: number;
  factories: Installation[];
  bodyResources: BodyResource[];
  userResources: UserResource[];
  currentJob: FactoryWorker | null;
  onBuildFactory: (res: string) => void;
  onApplyForJob: (id: string) => void;
  onWorkJob: () => void;
  onLeaveJob: () => void;
  onCollect: (id: string) => void;
  onUpgrade: (id: string, type: 'storage' | 'slots' | 'replenish') => void;
  onUpgradeInfrastructure?: (id: string) => void;
  onSaveSettings: (id: string, wage: number, jobs: number) => void;
  userId: string | null;
  userResidency: Residency | null;
  residencyApplications: ResidencyApplication[];
  onClaimResidency: (id: string, isClaimable: boolean) => void;
  bodyGovernance: Record<string, any>;
  onInitiateGovernance: (id: string) => void;
  factoryInputStorage: Record<string, Record<string, number>>;
  onDepositInput: (factoryId: string, resource: string, amount: number) => void;
  onBuildInfrastructure?: (key: any) => void;
  siloInventory: SiloInventoryEntry[];
  onTransferSiloResource: (siloId: string, res: string, amount: number) => void;
}) {
  const [activeTab, setActiveTab] = useState<"info" | "economy" | "governance">("info");
  const owner = body.ownerId ? galaxy.empires.find((e) => e.id === body.ownerId) : null;
  
  const zoneColors = { hot: "text-error", temperate: "text-success", cold: "text-info" };
  const bioColors = { none: "text-muted-foreground", sparse: "text-foreground", abundant: "text-success", exotic: "text-accent", hostile: "text-error" };

  const isStar = body.type === "star";
  const isPlanet = body.type === "terrestrial" || body.type === "gas_giant";
  const isMoon = body.type === "moon";
  const isStation = body.type === "station";
  const isShip = body.type === "ship";

  const isTravelingToThis = travel?.targetId === body.id && travel?.type === "intra";
  const originSysId = originSystemId || playerSystemId;
  const originBodId = originBodyId || playerBodyId;

  const isInSameSystem = originSysId === body.systemId;
  const isAtThisBody = originBodId === body.id;
  const isCurrentCommanderAtThisBody = playerBodyId === body.id;
  const effectiveIsVisited = isVisited || isAtThisBody || isCurrentCommanderAtThisBody;

  const path = useMemo(() => {
    if (isInSameSystem || !isExplored || !calculatePath) return null;
    return calculatePath(originSysId, body.systemId);
  }, [calculatePath, originSysId, body.systemId, isInSameSystem, isExplored]);

  const pathCost = useMemo(() => {
    if (!path || path.length < 2 || !getPathCost) return 0;
    return getPathCost(path);
  }, [getPathCost, path]);

  const canJourney = path && path.length >= 2;

  const eta = useMemo(() => {
    if (!path || path.length < 2) return 0;
    let totalDuration = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const s1 = galaxy.systemById[path[i]];
      const s2 = galaxy.systemById[path[i + 1]];
      if (!s1 || !s2) continue;
      const region = s1.regionId ? galaxy.regions?.find(r => r.id === s1.regionId) : null;
      const slowdown = region?.type === "nebula" ? 2.5 : 1.0;
      const dist = Math.hypot(s1.pos[0] - s2.pos[0], s1.pos[1] - s2.pos[1], s1.pos[2] - s2.pos[2]);
      totalDuration += (15 + dist * 1.2 * slowdown);
    }
    return Math.ceil(totalDuration);
  }, [path, galaxy]);

  const isSanctum = body.systemId.startsWith('sys-inner-') || body.systemId === 'sys-center';
  const residencyProhibited = isSanctum || body.type === 'asteroid' || body.type === 'gas_giant' || body.type === 'star';

  return (
    <Panel title={body.name} subtitle={BODY_META[body.type].label} hideHeader={hideHeader}>
      {/* 1. High-Level Summary Header (Non-Scrolling) */}
      {isExplored && (
        <div className="grid grid-cols-4 gap-2 mb-4 animate-in fade-in slide-in-from-top-2 duration-500">
          <BodyStatBadge 
            icon={Globe} 
            value={formatLabel(body.subtype).split(' ')[0]} 
            label="Type" 
          />
          <BodyStatBadge 
            icon={CircleDot} 
            value={isStar 
              ? `${(body.size * 0.4).toFixed(1)}R☉` 
              : isShip 
                ? `${(body.size * 100).toFixed(0)}m`
                : `${(body.size * 6371).toFixed(0)}km`
            } 
            label="Size" 
          />
          <BodyStatBadge 
            icon={Users} 
            value={body.population > 0 ? (body.population > 1000 ? `${(body.population/1000).toFixed(1)}B` : `${body.population.toFixed(1)}M`) : "0"} 
            label="Pop." 
          />
          <BodyStatBadge 
            icon={Shield} 
            value={owner?.tag ?? "NONE"} 
            label="Sovereign" 
            accent={owner ? "text-primary" : "text-muted-foreground"}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-primary/20 mb-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <button 
          onClick={() => { onPlayClick?.(); setActiveTab("info"); }}
          className={`flex-1 py-1.5 text-[9px] uppercase tracking-widest font-bold transition-all flex flex-col items-center justify-center gap-1 ${activeTab === "info" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-primary/60"}`}
        >
          <Activity size={12} /> 
          <span>Intelligence</span>
        </button>
        {!isStar && !isShip && (
          <button 
            onClick={() => { onPlayClick?.(); setActiveTab("economy"); }}
            className={`flex-1 py-1.5 text-[9px] uppercase tracking-widest font-bold transition-all flex flex-col items-center justify-center gap-1 ${activeTab === "economy" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-primary/60"}`}
          >
            <Scale size={12} />
            <span>Economy</span>
          </button>
        )}
        {!isStar && !isShip && (
          <button 
            onClick={() => { onPlayClick?.(); setActiveTab("governance"); }}
            className={`flex-1 py-1.5 text-[9px] uppercase tracking-widest font-bold transition-all flex flex-col items-center justify-center gap-1 ${activeTab === "governance" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-primary/60"}`}
          >
            <Shield size={12} />
            <span>Governance</span>
          </button>
        )}
      </div>

      {activeTab === "info" ? (
        <div className="animate-in fade-in slide-in-from-left-2 duration-300 space-y-4">
          {(isPlanet || isMoon || isStar || body.type === "asteroid") && (
            <PlanetSurface body={body} galaxy={galaxy} className="mb-0" />
          )}

          {isTravelingToThis && travel && (
            <div className="bg-warning/10 border border-warning/20 px-3 py-2 rounded">
              <div className="flex justify-between mb-1">
                <span className="text-[10px] font-bold text-warning uppercase text-glow">Sub-Light Transit</span>
                <span className="text-[10px] text-warning">ETA: {Math.ceil((travel.endTime - currentTime) / 1000)}s</span>
              </div>
              <div className="h-1 w-full bg-warning/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-warning animate-pulse" 
                  style={{ width: `${Math.min(100, ((currentTime - travel.startTime) / (travel.endTime - travel.startTime)) * 100)}%` }} 
                />
              </div>
            </div>
          )}

          {isInSameSystem && !isAtThisBody && !travel && !isShip && (
            <button 
              onClick={() => {
                onPlayClick?.();
                initiateTravelToBody(body.id);
              }}
              className="w-full bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary font-bold py-2.5 px-4 rounded text-[10px] tracking-[0.2em] transition-all flex items-center justify-between group"
            >
              <span className="flex items-center gap-2">
                <Zap size={12} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                <span>INITIATE TRAVEL</span>
              </span>
              <span className="text-[9px] font-mono-hud text-primary/60 border-l border-primary/20 pl-2">5 AP</span>
            </button>
          )}

          {!isInSameSystem && canJourney && !travel && !isShip && initiateJump && (
            <div className="flex flex-col gap-1 w-full">
              <button 
                onClick={() => {
                  onPlayClick?.();
                  initiateJump(body.systemId, body.id);
                }}
                className="w-full bg-primary hover:bg-primary/80 text-background font-bold py-2.5 px-4 rounded text-[10px] tracking-[0.2em] transition-all flex items-center justify-between group"
              >
                <span className="flex items-center gap-2">
                  <Zap size={12} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                  <span>JOURNEY TO BODY</span>
                </span>
                <span className="text-[9px] font-mono-hud text-background/80 border-l border-background/20 pl-2">{pathCost + 5} AP</span>
              </button>
              <div className="text-[9px] text-muted-foreground font-mono-hud text-center uppercase tracking-widest opacity-60">
                Est. Arrival: {eta}s
              </div>
            </div>
          )}

          {isAtThisBody && isInSameSystem && !travel && !isShip && (
            <div className="bg-primary/10 border border-primary/20 px-3 py-2 rounded flex items-center justify-between">
              <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Vessel in Orbit</span>
              <span className="text-[10px] font-bold text-primary/60">STATIONARY</span>
            </div>
          )}

          {isExplored && !effectiveIsVisited && !isShip && !isStar && (
            <div className="bg-info/10 border border-info/20 px-3 py-2 rounded">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-info animate-pulse" />
                <span className="text-[10px] font-bold text-info uppercase tracking-widest">Awaiting Survey</span>
              </div>
              <p className="text-[9px] text-info/60 mt-1 italic leading-tight">Orbital sensors have identified resource signatures. Surface survey required for tactical quantification.</p>
            </div>
          )}

          {isExplored && (
            <div className="grid grid-cols-2 gap-2">
              <StatCard 
                icon={Thermometer} 
                label="Climate" 
                value={`${body.temperature} K`} 
              />
              <StatCard 
                icon={Mountain} 
                label="Environment" 
                value={formatLabel(body.habitabilityZone)} 
                accent={zoneColors[body.habitabilityZone]}
              />
              <StatCard 
                icon={Wind} 
                label="Atmosphere" 
                value={body.atmosphere ?? "Vacuum"} 
                caption={isStar ? "Stellar Envelope" : undefined}
              />
              <StatCard 
                icon={Zap} 
                label="Economy" 
                value={ECON_META[body.economy].label} 
                accent={ECON_META[body.economy].color}
              />
            </div>
          )}

          {!isStar && !isShip && <Divider />}

          {!isExplored ? (
            <div className="p-3 border border-dashed border-primary/20 rounded bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-warning rounded-full animate-pulse" />
                <span className="text-[9px] font-mono-hud uppercase text-warning tracking-widest font-bold">Data Corrupted</span>
              </div>
              <p className="text-[10px] text-primary/60 leading-relaxed font-mono-hud italic">
                Long-range sensor data insufficient for detailed planetary analysis. Explore the system to reveal body characteristics.
              </p>
            </div>
          ) : (
            <div className="space-y-4 pb-2">
              {body.type === "terrestrial" && (
                <div className="grid grid-cols-2 gap-2 p-2 border border-primary/10 rounded">
                  <div className="space-y-0.5">
                    <div className="text-[8px] text-muted-foreground uppercase font-mono-hud">Biosphere: Flora</div>
                    <div className={`text-[10px] font-bold ${bioColors[body.flora]}`}>{formatLabel(body.flora)}</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[8px] text-muted-foreground uppercase font-mono-hud">Biosphere: Fauna</div>
                    <div className={`text-[10px] font-bold ${bioColors[body.fauna]}`}>{formatLabel(body.fauna)}</div>
                  </div>
                </div>
              )}

              {body.hazards.length > 0 && (
                <>
                  <Divider />
                  <SubTitle>Active Hazards</SubTitle>
                  <div className="flex flex-wrap gap-1">
                    {body.hazards.map((h) => (
                      <span key={h} className="px-1.5 py-0.5 text-[9px] uppercase tracking-wider bg-error/10 border border-error/30 text-error">
                        {h}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ) : activeTab === "governance" ? (
        <div className="animate-in fade-in slide-in-from-right-2 duration-300 space-y-4">
          {isExplored && (
            <div className="space-y-4 pb-2">
              {/* Sovereignty Info (Compact) */}
              <div className="flex items-center justify-between p-2 rounded bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${owner ? "" : "bg-muted-foreground"}`} style={owner ? { background: `hsl(${owner.hue} 70% 55%)` } : {}} />
                  <span className="text-[9px] font-mono-hud uppercase text-muted-foreground tracking-widest text-glow">Sovereign Control</span>
                </div>
                <button
                  disabled={!owner}
                  onClick={() => owner && onSelectEmpire?.(owner.id)}
                  className={`text-[10px] font-bold ${owner ? "text-primary hover:underline hover:text-primary-bright" : "text-muted-foreground"}`}
                >
                  {owner?.name ?? "Independent Area"}
                </button>
              </div>

              {/* Residency Section */}
              {!isShip && !isStar && !residencyProhibited && (
                <div className="p-3 bg-primary/5 border border-primary/10 rounded space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Residency Status</span>
                    {userResidency?.bodyId === body.id && <span className="px-1.5 py-0.5 rounded bg-success/20 text-success text-[7px] font-bold uppercase tracking-widest border border-success/30">Citizen</span>}
                  </div>
                  
                  {userResidency?.bodyId === body.id ? (
                    <div className="bg-success/10 border border-success/20 px-3 py-2 rounded flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-success rounded-full" />
                        <span className="text-[9px] text-success font-mono-hud font-bold">Resident of {body.name}</span>
                      </div>
                      <span className="text-[8px] text-success/60 font-mono-hud">{new Date(userResidency.joinedAt).toLocaleDateString()}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {residencyApplications.find(a => a.bodyId === body.id && a.status === 'pending') ? (
                        <div className="bg-warning/10 border border-warning/20 px-3 py-2 rounded flex items-center justify-between">
                           <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
                            <span className="text-[9px] font-bold text-warning uppercase">Application Under Review</span>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { onPlayClick?.(); onClaimResidency(body.id, !body.ownerId); }}
                          className="w-full py-2 bg-primary/20 border border-primary/40 text-primary font-bold text-[9px] tracking-widest rounded hover:bg-primary/30 transition-all"
                        >
                          {body.ownerId ? "Request Citizenship" : "Establish First Residency"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Local Governance Section */}
              {!isShip && !isStar && !body.ownerId && !residencyProhibited && (
                <div className="p-3 bg-primary/5 border border-primary/10 rounded space-y-3">
                  <SubTitle>Territorial Administration</SubTitle>
                  {bodyGovernance[body.id] && bodyGovernance[body.id].status !== 'neutral' && (bodyGovernance[body.id].status === 'governed' || bodyGovernance[body.id].empireId) ? (
                    <div className="bg-primary/10 border border-primary/20 px-3 py-2 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                          {bodyGovernance[body.id].status === 'governed' ? "Local Council" : "Imperial Control"}
                        </span>
                      </div>
                      <button
                        onClick={() => { 
                          onPlayClick?.(); 
                          const targetId = bodyGovernance[body.id].status === 'governed' ? body.id : bodyGovernance[body.id].empireId;
                          if (targetId) onSelectEmpire?.(targetId); 
                        }}
                        className="w-full bg-primary/20 hover:bg-primary/40 border border-primary/40 text-primary font-bold py-1.5 px-4 rounded text-[9px] tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                      >
                        <Scale size={12} />
                        MANAGE TERRITORY
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <p className="text-[9px] text-muted-foreground italic leading-tight">
                        This region lacks formal infrastructure. Establish a regional authority to unlock advanced features.
                      </p>
                      <button
                        onClick={() => { onPlayClick?.(); onInitiateGovernance(body.id); }}
                        disabled={userResidency?.bodyId !== body.id}
                        className="w-full bg-warning/10 hover:bg-warning/20 border border-warning/30 text-warning font-bold py-2 px-4 rounded text-[9px] tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Scale size={12} />
                        INITIATE GOVERNANCE
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <EconomyTab 
          body={body}
          factories={factories.filter(f => f.bodyId === body.id)}
          bodyResources={bodyResources.filter(r => r.bodyId === body.id)}
          userResources={userResources}
          currentJob={currentJob}
          onBuildFactory={onBuildFactory}
          onBuildInfrastructure={onBuildInfrastructure}
          onApplyForJob={onApplyForJob}
          onWorkJob={onWorkJob}
          onLeaveJob={onLeaveJob}
          onPlayClick={onPlayClick}
          isAtThisBody={isAtThisBody}
          userId={userId}
          onCollect={onCollect}
          onUpgrade={onUpgrade}
          onUpgradeInfrastructure={onUpgradeInfrastructure}
          onSaveSettings={onSaveSettings}
          factoryInputStorage={factoryInputStorage}
          onDepositInput={onDepositInput}
          siloInventory={siloInventory}
          onTransferSiloResource={onTransferSiloResource}
          isVisited={effectiveIsVisited}
        />
      )}
    </Panel>
  );
}

const STORAGE_CAPACITY = [100, 300, 750, 2000, 5000];
const STORAGE_COST = [2000, 6000, 15000, 40000];
const SLOT_CAPACITY = [3, 5, 10, 20];
const SLOT_COST = [1500, 5000, 12000];
const REPLENISH_BONUS = ["0%", "+25%", "+60%", "+100%"];
const REPLENISH_COST = [3000, 8000, 20000];

function FactoryCard({
  f, currentJob, isAtThisBody, userId, onPlayClick,
  onWorkJob, onApplyForJob, onLeaveJob, onCollect, onUpgrade, onUpgradeInfrastructure, onSaveSettings,
  factoryInputStorage, onDepositInput, userResources, siloInventory, onTransferSiloResource, bodyName
}: {
  f: Installation; currentJob: any; isAtThisBody: boolean; userId: string | null;
  onPlayClick?: () => void;
  onWorkJob: () => void; onApplyForJob: (id: string) => void; onLeaveJob: () => void;
  onCollect: (id: string) => void;
  onUpgrade: (id: string, type: 'storage' | 'slots' | 'replenish') => void;
  onUpgradeInfrastructure?: (id: string) => void;
  onSaveSettings: (id: string, wage: number, jobs: number) => void;
  factoryInputStorage: Record<string, Record<string, number>>;
  onDepositInput: (factoryId: string, resource: string, amount: number) => void;
  userResources: UserResource[];
  siloInventory: SiloInventoryEntry[];
  onTransferSiloResource: (siloId: string, res: string, amount: number) => void;
  bodyName: string;
}) {
  const rMeta = (RESOURCE_META as any)[f.resourceType] || Object.values(INFRA_META).find(m => m.type === f.type);
  const isWorkingHere = currentJob?.factoryId === f.id;
  const isInfrastructure = f.resourceType === 'Structure';
  const isOwner = f.ownerId === userId && !f.isNpcOwned;
  const [showSettings, setShowSettings] = useState(false);
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [showSiloTransfer, setShowSiloTransfer] = useState(false);
  const [transferAmount, setTransferAmount] = useState(10);
  const [transferRes, setTransferRes] = useState<string>("");
  const [wageInput, setWageInput] = useState(String(f.wage));
  const [jobsInput, setJobsInput] = useState(String(f.jobsAvailable));

  const storageCapacity = f.storageCapacity ?? STORAGE_CAPACITY[Math.min(f.storageTier ?? 0, 4)];
  const storagePct = storageCapacity > 0 ? Math.min(100, (f.storage / storageCapacity) * 100) : 0;
  const storageFull = f.storage >= storageCapacity;
  
  const siloItems = siloInventory.filter(i => i.siloId === f.id);
  const usedCap = siloItems.reduce((acc, i) => acc + i.amount, 0);
  const totalCap = [5000, 15000, 50000, 150000, 500000][Math.min(f.storageTier ?? 0, 4)];

  return (
    <div className={`border rounded transition-all flex flex-col overflow-hidden ${isWorkingHere ? 'border-primary bg-primary/10' : 'border-primary/20 bg-primary/5'}`}>
      {/* Condensed Header */}
      <div className="px-2 py-1.5 border-b border-primary/10 flex items-center justify-between gap-2 overflow-hidden bg-primary/5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 bg-primary/10 rounded">
            {isInfrastructure ? <GalaxyIcon name={rMeta?.icon} className="w-3.5 h-3.5 text-primary" /> : <Building2 size={14} className="text-primary/70 shrink-0" />}
          </div>
          <div className="truncate">
            <div className="text-[9px] font-bold text-primary uppercase leading-tight truncate">{rMeta?.label || f.type}</div>
            <div className="text-[6px] text-muted-foreground uppercase leading-none">{isInfrastructure ? `Tier ${f.tier}` : (f.isNpcOwned ? "NPC Facility" : "Private Asset")}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {!f.isNpcOwned && !isInfrastructure && (
            <div className="text-[9px] font-bold text-success flex items-center gap-0.5 leading-none bg-success/10 px-1 py-0.5 rounded border border-success/20">
              <SC_Icon size={8} /> {f.wage}
            </div>
          )}
          {isOwner && (
            <div className="flex gap-0.5">
              {!isInfrastructure && (
                <button 
                  onClick={() => { setShowSettings(s => !s); setShowUpgrades(false); }}
                  className={`p-1 rounded transition-all ${showSettings ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-primary'}`}
                >
                  <Settings size={10} />
                </button>
              )}
              <button 
                onClick={() => { setShowUpgrades(u => !u); setShowSettings(false); }}
                className={`p-1 rounded transition-all ${showUpgrades ? 'bg-info/20 text-info' : 'text-muted-foreground hover:text-info'}`}
              >
                <ArrowUp size={10} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-2 space-y-2">
        {/* Storage bar */}
        {!f.isNpcOwned && (
          <div className="space-y-1">
            <div className="flex justify-between text-[7px] font-mono-hud uppercase leading-none">
              <span className="text-muted-foreground">Output: {f.storage}u</span>
              <span className={storageFull ? "text-warning" : "text-primary/60"}>Cap: {storageCapacity}</span>
            </div>
            <div className="h-0.5 bg-primary/10 rounded-full overflow-hidden">
              <div className={`h-full transition-all ${storageFull ? 'bg-warning' : 'bg-primary'}`} style={{ width: `${storagePct}%` }} />
            </div>
          </div>
        )}

        {/* Inputs (Grid-based if multiple) */}
        {(f.tier ?? 1) > 1 && (
          <div className="grid grid-cols-1 gap-1.5 p-1.5 bg-primary/5 rounded border border-primary/10">
            {rMeta?.inputs?.map((inp: any) => {
              const currentInput = factoryInputStorage[f.id]?.[inp.resource] ?? 0;
              const userInCargo = userResources.find(r => r.resourceType === inp.resource)?.amount ?? 0;
              const inputMeta = (RESOURCE_META as any)[inp.resource];
              
              return (
                <div key={inp.resource} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <GalaxyIcon name={inputMeta?.icon} className="w-3 h-3 shrink-0" color={inputMeta?.color} />
                    <span className="text-[8px] text-primary/80 font-mono-hud uppercase truncate leading-none">{inp.resource}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-mono-hud text-primary leading-none">{currentInput}u</span>
                    {isOwner && isAtThisBody && userInCargo > 0 && (
                      <button 
                        onClick={() => onDepositInput(f.id, inp.resource, 10)}
                        className="px-1 py-0.5 border border-primary/20 hover:bg-primary/10 text-[7px] text-primary uppercase rounded"
                      >
                        Add 10
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-1.5">
          {!isInfrastructure && (
            isWorkingHere ? (
              <>
                <button
                  disabled={!isAtThisBody || storageFull}
                  onClick={() => { onPlayClick?.(); onWorkJob(); }}
                  className={`flex-1 py-1.5 bg-primary text-background font-bold text-[9px] uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1.5 ${(!isAtThisBody || storageFull) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Pickaxe size={11} />
                  Shift
                </button>
                <button onClick={() => { onPlayClick?.(); onLeaveJob(); }}
                  className="px-2 border border-error/40 text-error hover:bg-error/10 transition-all rounded">
                  <LogOut size={11} />
                </button>
              </>
            ) : (
              <button
                disabled={!!currentJob || !isAtThisBody}
                onClick={() => { onPlayClick?.(); onApplyForJob(f.id); }}
                className={`flex-1 py-1.5 border border-primary text-primary font-bold text-[9px] uppercase tracking-wider rounded hover:bg-primary/10 transition-all flex items-center justify-center gap-1.5 ${(!!currentJob || !isAtThisBody) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <UserPlus size={11} />
                Contract
              </button>
            )
          )}
          {showSiloTransfer && f.type === 'Resource Silo' && (
            <div className="mt-4 p-4 rounded-lg bg-success/5 border border-success/20 space-y-4 animate-in slide-in-from-bottom-2 duration-300 relative">
              {/* Dedicated Close Row */}
              <div className="flex justify-end -mt-2 -mr-2">
                <button 
                  onClick={() => setShowSiloTransfer(false)}
                  className="p-1.5 hover:bg-success/20 rounded-full text-success/60 transition-colors bg-success/5 border border-success/10"
                  title="Close Manager"
                >
                  <LogOut size={12} className="rotate-180" />
                </button>
              </div>

              <div className="flex items-center justify-between border-b border-success/10 pb-2">
                <h4 className="font-display text-[9px] uppercase tracking-widest text-success">Storage Management</h4>
                <span className="font-mono-hud text-[8px] text-success/60">{usedCap} / {totalCap} Units</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-mono-hud text-[8px] uppercase tracking-widest text-muted-foreground block">Resource</label>
                  <select 
                    value={transferRes} 
                    onChange={e => setTransferRes(e.target.value)}
                    className="w-full bg-background/60 border border-success/20 text-[10px] font-mono-hud py-1 px-2 rounded outline-none"
                  >
                    <option value="" disabled>Select...</option>
                    {/* Unique resources from both silo and user cargo */}
                    {Array.from(new Set([
                      ...siloItems.map(i => i.resourceType),
                      ...userResources.map(r => r.resourceType)
                    ])).sort().map(res => (
                      <option key={res} value={res}>{res}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-mono-hud text-[8px] uppercase tracking-widest text-muted-foreground block">Amount</label>
                  <input 
                    type="number" 
                    value={transferAmount} 
                    onChange={e => setTransferAmount(parseInt(e.target.value) || 0)}
                    className="w-full bg-background/60 border border-success/20 text-[10px] font-mono-hud py-1 px-2 rounded outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { onTransferSiloResource(f.id, transferRes, transferAmount); onPlayClick?.(); }}
                  disabled={!transferRes || transferAmount <= 0}
                  className="flex-1 py-2 bg-success/20 border border-success/40 text-success font-display text-[9px] uppercase tracking-widest rounded hover:bg-success/30 disabled:opacity-30 transition-all"
                >
                  Deposit to Silo
                </button>
                <button
                  onClick={() => { onTransferSiloResource(f.id, transferRes, -transferAmount); onPlayClick?.(); }}
                  disabled={!transferRes || transferAmount <= 0}
                  className="flex-1 py-2 bg-success/10 border border-success/20 text-success/70 font-display text-[9px] uppercase tracking-widest rounded hover:bg-success/20 disabled:opacity-30 transition-all"
                >
                  Withdraw to Cargo
                </button>
              </div>
            </div>
          )}

          {isInfrastructure && isOwner && isAtThisBody && (
            <div className="flex gap-2 flex-1 mt-4">

              {f.type === 'Resource Silo' && !showSiloTransfer && (
                <button
                  onClick={() => { setShowSiloTransfer(true); if (!transferRes && siloItems.length > 0) setTransferRes(siloItems[0].resourceType); }}
                  className="flex-1 py-1.5 font-bold text-[9px] uppercase tracking-wider rounded flex items-center justify-center gap-1.5 transition-all bg-success/20 border border-success/40 text-success hover:bg-success/30"
                >
                  <ArrowUpDown size={11} />
                  Silo Manager
                </button>
              )}
            </div>
          )}

          {showUpgrades && (
            <div className="mt-4 p-4 rounded-lg bg-info/5 border border-info/20 space-y-4 animate-in slide-in-from-top-2 duration-300">
               <div className="flex items-center justify-between border-b border-info/10 pb-2">
                <h4 className="font-display text-[9px] uppercase tracking-widest text-info">Facility Upgrade Matrix</h4>
              </div>
              
              <div className="space-y-2">
                {/* Storage Upgrade */}
                <div className="flex items-center justify-between p-2.5 rounded bg-background/40 border border-info/10">
                  <div className="space-y-0.5">
                    <div className="text-[9px] font-bold text-foreground uppercase tracking-tight">Expand Storage Capacity</div>
                    <div className="text-[8px] text-muted-foreground uppercase font-mono-hud">Grade T{f.storageTier} → T{f.storageTier + 1}</div>
                  </div>
                  <button 
                    onClick={() => { onUpgrade(f.id, 'storage'); onPlayClick?.(); }}
                    className="px-3 py-1.5 bg-info/15 hover:bg-info/25 text-info text-[8px] font-bold uppercase rounded border border-info/30 transition-all active:scale-95"
                  >
                    Initiate
                  </button>
                </div>

                {/* Only for industrial factories */}
                {!isInfrastructure && (
                  <>
                    <div className="flex items-center justify-between p-2.5 rounded bg-background/40 border border-info/10">
                      <div className="space-y-0.5">
                        <div className="text-[9px] font-bold text-foreground uppercase tracking-tight">Workforce Hub Expansion</div>
                        <div className="text-[8px] text-muted-foreground uppercase font-mono-hud">Grade T{f.slotTier} → T{f.slotTier + 1}</div>
                      </div>
                      <button 
                        onClick={() => { onUpgrade(f.id, 'slots'); onPlayClick?.(); }}
                        className="px-3 py-1.5 bg-info/15 hover:bg-info/25 text-info text-[8px] font-bold uppercase rounded border border-info/30 transition-all active:scale-95"
                      >
                        Initiate
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded bg-background/40 border border-info/10">
                      <div className="space-y-0.5">
                        <div className="text-[9px] font-bold text-foreground uppercase tracking-tight">Operational Throughput</div>
                        <div className="text-[8px] text-muted-foreground uppercase font-mono-hud">Grade T{f.replenishTier} → T{f.replenishTier + 1}</div>
                      </div>
                      <button 
                        onClick={() => { onUpgrade(f.id, 'replenish'); onPlayClick?.(); }}
                        className="px-3 py-1.5 bg-info/15 hover:bg-info/25 text-info text-[8px] font-bold uppercase rounded border border-info/30 transition-all active:scale-95"
                      >
                        Initiate
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}


          {isOwner && isAtThisBody && f.storage > 0 && (
            <button onClick={() => { onPlayClick?.(); onCollect(f.id); }}
              className="px-2 py-1.5 border border-success/40 text-success hover:bg-success/10 transition-all rounded flex items-center gap-1 text-[8px] font-bold uppercase truncate">
              Collect
            </button>
          )}
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && isOwner && (
        <div className="border-t border-primary/20 p-3 bg-primary/5 space-y-2">
          <div className="text-[8px] font-bold text-primary/70 uppercase tracking-widest mb-1">Factory Settings</div>
          <div className="flex items-center gap-2">
            <label className="text-[8px] text-muted-foreground uppercase w-16 shrink-0">Wage (SC)</label>
            <input type="number" min={1} value={wageInput}
              onChange={e => setWageInput(e.target.value)}
              className="flex-1 bg-background border border-primary/20 rounded px-2 py-1 text-[9px] font-mono-hud text-primary focus:outline-none focus:border-primary/60" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[8px] text-muted-foreground uppercase w-16 shrink-0">Job Slots</label>
            <input type="number" min={0} value={jobsInput}
              onChange={e => setJobsInput(e.target.value)}
              className="flex-1 bg-background border border-primary/20 rounded px-2 py-1 text-[9px] font-mono-hud text-primary focus:outline-none focus:border-primary/60" />
          </div>
          <button onClick={() => { onSaveSettings(f.id, Number(wageInput), Number(jobsInput)); setShowSettings(false); }}
            className="w-full py-1.5 bg-primary/20 border border-primary/40 text-primary text-[8px] font-bold uppercase rounded hover:bg-primary/30 transition-all">
            Save Settings
          </button>
        </div>
      )}

      {/* Upgrades panel */}
      {showUpgrades && isOwner && (
        <div className="border-t border-primary/20 p-3 bg-info/5 space-y-2">
          <div className="text-[8px] font-bold text-info/70 uppercase tracking-widest mb-1">{isInfrastructure ? "Structural Upgrades" : "Factory Upgrades"}</div>
          {isInfrastructure ? (
            (() => {
              const infraKey = Object.keys(INFRA_META).find(k => (INFRA_META as any)[k].type === f.type) as keyof typeof INFRA_META;
              if (!infraKey) return null;
              const meta = (INFRA_META as any)[infraKey];
              const currentTier = f.tier || 1;
              const nextTierConfig = meta.tiers[currentTier]; // tiers are 0-indexed, so tiers[1] is T2

              if (!nextTierConfig) return <div className="text-[9px] text-success italic font-mono-hud">Facility at maximum theoretical efficiency.</div>;

              return (
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-[10px] font-bold text-foreground">Target: Tier {currentTier + 1}</div>
                      <div className="text-[7px] text-muted-foreground uppercase">{meta.type === 'Resource Silo' ? `Capacity: ${nextTierConfig.capacity}u` : "Advanced Protocols"}</div>
                    </div>
                    <div className="text-right">
                       <div className="text-[10px] text-info font-mono-hud">{nextTierConfig.costSC.toLocaleString()} SC</div>
                    </div>
                  </div>
                  
                  <div className="bg-black/20 p-2 rounded border border-info/10">
                    <div className="text-[7px] text-muted-foreground uppercase tracking-widest mb-1">Required Materials:</div>
                    <div className="flex flex-wrap gap-2">
                      {nextTierConfig.mats.map((m: any) => {
                         const has = userResources.find(ur => ur.resourceType === m.resource)?.amount || 0;
                         return (
                           <div key={m.resource} className={`text-[8px] font-mono-hud ${has >= m.qty ? 'text-success' : 'text-error'}`}>
                             {m.resource}: {has}/{m.qty}
                           </div>
                         );
                      })}
                    </div>
                  </div>

                  <button 
                    onClick={() => { onPlayClick?.(); onUpgradeInfrastructure?.(f.id); }}
                    className="w-full py-1.5 bg-info text-background text-[8px] font-bold uppercase rounded hover:bg-info/90 shadow-[0_0_10px_rgba(var(--info-rgb),0.3)]"
                  >
                    Authorize Upgrade
                  </button>
                </div>
              );
            })()
          ) : (
            <>
              {/* Storage */}
          {(() => {
            const tier = f.storageTier ?? 0;
            const nextCost = STORAGE_COST[tier];
            const nextCap = STORAGE_CAPACITY[tier + 1];
            return (
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="text-[8px] text-muted-foreground uppercase">Storage</div>
                  <div className="text-[9px] text-foreground font-mono-hud">{STORAGE_CAPACITY[tier]} → {nextCap ?? "MAX"} units</div>
                </div>
                <button disabled={!nextCost}
                  onClick={() => { onPlayClick?.(); onUpgrade(f.id, 'storage'); }}
                  className={`shrink-0 px-2 py-1 text-[8px] font-bold uppercase rounded border transition-all flex items-center gap-1 ${nextCost ? 'border-info/40 text-info hover:bg-info/20' : 'border-primary/10 text-muted-foreground opacity-40 cursor-not-allowed'}`}>
                  <ArrowUp size={9} /> {nextCost ? `${nextCost.toLocaleString()} SC` : "MAX"}
                </button>
              </div>
            );
          })()}
          {/* Job Slots */}
          {(() => {
            const tier = f.slotTier ?? 0;
            const nextCost = SLOT_COST[tier];
            const nextSlots = SLOT_CAPACITY[tier + 1];
            return (
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="text-[8px] text-muted-foreground uppercase">Job Slots</div>
                  <div className="text-[9px] text-foreground font-mono-hud">{SLOT_CAPACITY[tier]} → {nextSlots ?? "MAX"} slots</div>
                </div>
                <button disabled={!nextCost}
                  onClick={() => { onPlayClick?.(); onUpgrade(f.id, 'slots'); }}
                  className={`shrink-0 px-2 py-1 text-[8px] font-bold uppercase rounded border transition-all flex items-center gap-1 ${nextCost ? 'border-info/40 text-info hover:bg-info/20' : 'border-primary/10 text-muted-foreground opacity-40 cursor-not-allowed'}`}>
                  <ArrowUp size={9} /> {nextCost ? `${nextCost.toLocaleString()} SC` : "MAX"}
                </button>
              </div>
            );
          })()}
          {/* Replenishment */}
          {(() => {
            const tier = f.replenishTier ?? 0;
            const nextCost = REPLENISH_COST[tier];
            return (
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="text-[8px] text-muted-foreground uppercase">Replenish Rate</div>
                  <div className="text-[9px] text-foreground font-mono-hud">{REPLENISH_BONUS[tier]} → {REPLENISH_BONUS[tier + 1] ?? "MAX"}</div>
                </div>
                <button disabled={!nextCost}
                  onClick={() => { onPlayClick?.(); onUpgrade(f.id, 'replenish'); }}
                  className={`shrink-0 px-2 py-1 text-[8px] font-bold uppercase rounded border transition-all flex items-center gap-1 ${nextCost ? 'border-info/40 text-info hover:bg-info/20' : 'border-primary/10 text-muted-foreground opacity-40 cursor-not-allowed'}`}>
                  <ArrowUp size={9} /> {nextCost ? `${nextCost.toLocaleString()} SC` : "MAX"}
                </button>
              </div>
            );
          })()}
          </>
          )}
        </div>
      )}
    </div>
  );
}

function EconomyTab({ 
  body, factories, bodyResources, userResources, currentJob, 
  onBuildFactory, onBuildInfrastructure, onApplyForJob, onWorkJob, onLeaveJob, onPlayClick,
  isAtThisBody, userId, onCollect, onUpgrade, onUpgradeInfrastructure, onSaveSettings,
  factoryInputStorage, onDepositInput, siloInventory, onTransferSiloResource, isVisited
}: {
  body: Body;
  factories: Installation[];
  bodyResources: BodyResource[];
  userResources: UserResource[];
  currentJob: FactoryWorker | null;
  onBuildFactory: (res: string) => void;
  onBuildInfrastructure?: (key: any) => void;
  onApplyForJob: (id: string) => void;
  onWorkJob: () => void;
  onLeaveJob: () => void;
  onPlayClick?: () => void;
  isAtThisBody: boolean;
  userId: string | null;
  onCollect: (id: string) => void;
  onUpgrade: (id: string, type: 'storage' | 'slots' | 'replenish') => void;
  onUpgradeInfrastructure?: (id: string) => void;
  onSaveSettings: (id: string, wage: number, jobs: number) => void;
  factoryInputStorage: Record<string, Record<string, number>>;
  onDepositInput: (factoryId: string, resource: string, amount: number) => void;
  siloInventory: SiloInventoryEntry[];
  onTransferSiloResource: (siloId: string, res: string, amount: number) => void;
  isVisited: boolean;
}) {
  const isSanctum = body.systemId.startsWith('sys-inner-') || body.systemId === 'sys-center';
  const [activeSubTab, setActiveSubTab] = useState<"logistics" | "production" | "assets">("production");
  const [buildConfirm, setBuildConfirm] = useState<{ res: string; cost: number; isInfra?: boolean; infraKey?: any } | null>(null);

  const richnessSymbols = {
    trace: "★",
    moderate: "★★",
    significant: "★★★",
    rich: "★★★★",
    abundant: "★★★★★"
  } as const;

  return (
    <div className="animate-in fade-in slide-in-from-right-2 duration-300 space-y-4">
      {/* Economy Sub-Tabs */}
      <div className="flex bg-primary/5 p-1 rounded-md gap-1">
        <button
          onClick={() => setActiveSubTab("production")}
          className={`flex-1 py-1 text-[8px] font-bold uppercase tracking-wider rounded transition-all ${activeSubTab === "production" ? "bg-primary text-background shadow-lg" : "text-primary/60 hover:text-primary"}`}
        >
          Production
        </button>
        <button
          onClick={() => setActiveSubTab("logistics")}
          className={`flex-1 py-1 text-[8px] font-bold uppercase tracking-wider rounded transition-all ${activeSubTab === "logistics" ? "bg-primary text-background shadow-lg" : "text-primary/60 hover:text-primary"}`}
        >
          Logistics
        </button>
        <button
          onClick={() => setActiveSubTab("assets")}
          className={`flex-1 py-1 text-[8px] font-bold uppercase tracking-wider rounded transition-all ${activeSubTab === "assets" ? "bg-primary text-background shadow-lg" : "text-primary/60 hover:text-primary"}`}
        >
          Assets ({factories.length})
        </button>
      </div>

      {activeSubTab === "production" && (
        <div className="space-y-4 animate-in slide-in-from-left-2 duration-300">
          {/* Planetary Resources Section */}
          <section>
            <SubTitle>Surface Deposits</SubTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {body.deposits.map((d) => {
            const bRes = bodyResources.find(r => r.resourceType === d.resource);
            const rMeta = (RESOURCE_META as any)[d.resource];
            
            let liveAmount = bRes?.currentAmount || 0;
            if (bRes) {
              const secondsElapsed = (Date.now() - new Date(bRes.lastReplenishedAt).getTime()) / 1000;
              const replenishRate = bRes.richnessValue * 0.002;
              const replenished = Math.floor(secondsElapsed * replenishRate);
              liveAmount = Math.min(bRes.maxAmount, liveAmount + replenished);
            }
            
            const pct = bRes ? (liveAmount / bRes.maxAmount) * 100 : 100;
            const isDepleted = liveAmount <= 0;
            const hasOwnFactory = factories.some((f: any) => f.resourceType === d.resource && f.ownerId === userId);

            return (
              <div key={d.resource} className="space-y-1">
                <div className={`p-2 border rounded bg-primary/5 transition-all ${hasOwnFactory ? "border-primary/40 bg-primary/10" : "border-primary/15"}`}>
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <GalaxyIcon name={rMeta?.icon} className="w-4 h-4 shrink-0" color={rMeta?.color} />
                      <div className="text-[9px] font-bold text-primary uppercase leading-tight truncate shrink">{d.resource}</div>
                    </div>
                    {!isSanctum && !hasOwnFactory && (
                      <button 
                        disabled={!isAtThisBody}
                        onClick={() => { 
                          onPlayClick?.(); 
                          setBuildConfirm(prev => prev?.res === d.resource ? null : { res: d.resource, cost: 0 }); // Free for T1
                        }}
                        className={`px-1.5 py-0.5 border border-primary/40 text-primary text-[7px] font-bold uppercase rounded hover:bg-primary/20 transition-all ${!isAtThisBody ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {buildConfirm?.res === d.resource ? "Cancel" : "Build"}
                      </button>
                    )}
                    {hasOwnFactory && <div className="text-[7px] text-success font-bold uppercase tracking-tighter shrink-0">Owned</div>}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-[7px] font-mono-hud uppercase leading-none">
                      <span className={isDepleted ? "text-error" : "text-muted-foreground"}>
                        {isDepleted ? "Empty" : isVisited ? richnessSymbols[d.richness as keyof typeof richnessSymbols] : "???"}
                      </span>
                      <span className="text-primary/70">{isVisited && bRes ? liveAmount : "???"}</span>
                    </div>
                    <div className="h-0.5 bg-primary/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${isDepleted ? 'bg-error' : 'bg-primary'}`} 
                        style={{ width: `${isVisited ? pct : 100}%` }} 
                      />
                    </div>
                  </div>
                </div>
                {buildConfirm?.res === d.resource && (
                  <BuildConfirmation 
                    buildConfirm={buildConfirm} 
                    onCancel={() => setBuildConfirm(null)} 
                    onConfirm={() => {
                      onBuildFactory(buildConfirm.res);
                      setBuildConfirm(null);
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

          <Divider />
          
          {/* Advanced Industry Section */}
          {!isSanctum && (
            <section className="space-y-3">
              <SubTitle>Specialized Industry (T2/T3)</SubTitle>
              
              <div className="grid grid-cols-1 gap-2">
                {[...T2_RESOURCES, ...T3_RESOURCES].map(res => {
                  const meta = (RESOURCE_META as any)[res];
                  const alreadyHas = factories.some(f => f.resourceType === res && f.ownerId === userId);
                  const cost = meta.tier === 3 ? 75000 : 20000;
                  
                  return (
                    <div key={res} className="space-y-1">
                      <div className={`p-2 border rounded flex items-center justify-between transition-all ${alreadyHas ? 'border-success/40 bg-success/5 opacity-60' : meta.tier === 3 ? 'border-accent/20 bg-accent/5' : 'border-primary/20 bg-primary/5'} ${!isAtThisBody && !alreadyHas ? 'opacity-30' : ''}`}>
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2 bg-primary/10 rounded border border-primary/20">
                            <GalaxyIcon name={meta.icon} className="w-4 h-4" color={meta.color} />
                          </div>
                          <div className="overflow-hidden">
                            <div className="text-[10px] font-bold text-foreground uppercase leading-tight truncate">{meta.label}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[7px] text-muted-foreground uppercase tracking-widest shrink-0">
                                Tier {meta.tier} · {alreadyHas ? "Active" : `${cost.toLocaleString()} SC`}
                              </span>
                              {!alreadyHas && meta.inputs && (
                                <div className="flex items-center gap-1 overflow-hidden">
                                  <span className="text-[6px] text-primary/40 uppercase">Needs:</span>
                                  {meta.inputs.map((inp: any) => (
                                    <GalaxyIcon key={inp.resource} name={(RESOURCE_META as any)[inp.resource]?.icon} className="w-2 h-2 text-primary/60 shrink-0" />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {!alreadyHas && (
                          <button
                            disabled={!isAtThisBody}
                            onClick={() => setBuildConfirm(prev => prev?.res === res ? null : { res, cost })}
                            className={`px-2 py-1 text-background text-[8px] font-bold uppercase rounded transition-all shrink-0 ${meta.tier === 3 ? 'bg-accent hover:bg-accent/90 shadow-[0_0_10px_rgba(var(--accent-rgb),0.2)]' : 'bg-primary hover:bg-primary/90 shadow-[0_0_10px_rgba(var(--primary-rgb),0.2)]'}`}
                          >
                            {buildConfirm?.res === res ? "Cancel" : "Build"}
                          </button>
                        )}
                      </div>
                      {buildConfirm?.res === res && (
                        <BuildConfirmation 
                          buildConfirm={buildConfirm} 
                          onCancel={() => setBuildConfirm(null)} 
                          onConfirm={() => {
                            onBuildFactory(buildConfirm.res);
                            setBuildConfirm(null);
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {activeSubTab === "logistics" && !isSanctum && (
        <section className="space-y-3 animate-in slide-in-from-right-2 duration-300">
          <SubTitle>Orbital Infrastructure</SubTitle>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(INFRA_META).map(([key, meta]) => {
              const alreadyHas = factories.some(f => f.type === meta.type && f.ownerId === userId);
              const firstTier = (meta as any).tiers[0];
              const canBuild = !alreadyHas && isAtThisBody;

              return (
                <div key={key} className="space-y-1">
                  <div className={`p-2 border rounded flex items-center justify-between transition-all ${alreadyHas ? 'border-primary/40 bg-primary/10 opacity-60' : 'border-primary/20 bg-primary/5 hover:border-primary/40'} ${!isAtThisBody && !alreadyHas ? 'opacity-30' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded border border-primary/20">
                        <GalaxyIcon name={meta.icon} className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-foreground uppercase leading-tight">{meta.label}</div>
                        <div className="text-[7px] text-muted-foreground uppercase tracking-widest">{alreadyHas ? "Active Facility" : `${firstTier.costSC.toLocaleString()} SC`}</div>
                      </div>
                    </div>
                    {!alreadyHas && (
                      <button
                        disabled={!isAtThisBody}
                        onClick={() => setBuildConfirm(prev => prev?.res === meta.label ? null : { res: meta.label, cost: firstTier.costSC, isInfra: true, infraKey: key as any })}
                        className="px-2 py-1 bg-primary text-background text-[8px] font-bold uppercase rounded hover:bg-primary/90 transition-all shadow-[0_0_10px_rgba(var(--primary-rgb),0.2)]"
                      >
                        {buildConfirm?.res === meta.label ? "Cancel" : "Commission"}
                      </button>
                    )}
                  </div>
                  {buildConfirm?.res === meta.label && (
                    <BuildConfirmation 
                      buildConfirm={buildConfirm} 
                      onCancel={() => setBuildConfirm(null)} 
                      materials={(meta as any).tiers[0].mats}
                      userResources={userResources}
                      onConfirm={() => {
                        onBuildInfrastructure?.(buildConfirm.infraKey);
                        setBuildConfirm(null);
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {activeSubTab === "assets" && (
        <section className="space-y-3 animate-in fade-in duration-300">
          <SubTitle>Active Facilities</SubTitle>
          <div className="space-y-4 pb-10">
            {factories.length === 0 ? (
              <div className="p-10 border border-dashed border-primary/20 rounded text-center">
                <Building2 size={24} className="mx-auto text-primary/20 mb-2" />
                <span className="text-[9px] text-muted-foreground uppercase tracking-widest italic">No active industrial operations on this body</span>
              </div>
            ) : (
              <>
                {/* Factory Subgroups */}
                {[1, 2, 3].map(tier => {
                  const tierFactories = factories.filter(f => f.resourceType !== 'Structure' && f.tier === tier);
                  if (tierFactories.length === 0) return null;
                  return (
                    <div key={`tier-${tier}`} className="space-y-2">
                      <div className="flex items-center gap-2 px-1">
                        <div className="h-px flex-1 bg-primary/10" />
                        <span className="text-[7px] font-bold text-primary/50 uppercase tracking-[0.3em]">Tier {tier} Factories</span>
                        <div className="h-px flex-1 bg-primary/10" />
                      </div>
                      {tierFactories.map(f => (
                        <FactoryCard
                          key={f.id}
                          f={f}
                          currentJob={currentJob}
                          isAtThisBody={isAtThisBody}
                          userId={userId}
                          onPlayClick={onPlayClick}
                          onWorkJob={onWorkJob}
                          onApplyForJob={onApplyForJob}
                          onLeaveJob={onLeaveJob}
                          onCollect={onCollect}
                          onUpgrade={onUpgrade}
                          onUpgradeInfrastructure={onUpgradeInfrastructure}
                          onSaveSettings={onSaveSettings}
                          factoryInputStorage={factoryInputStorage}
                          onDepositInput={onDepositInput}
                          userResources={userResources}
                          siloInventory={siloInventory}
                          onTransferSiloResource={onTransferSiloResource}
                          bodyName={body.name}
                        />
                      ))}
                    </div>
                  );
                })}

                {/* Infrastructure Subgroup */}
                {(() => {
                  const infra = factories.filter(f => f.resourceType === 'Structure');
                  if (infra.length === 0) return null;
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-1">
                        <div className="h-px flex-1 bg-info/10" />
                        <span className="text-[7px] font-bold text-info/50 uppercase tracking-[0.3em]">Orbital Infrastructure</span>
                        <div className="h-px flex-1 bg-info/10" />
                      </div>
                      {infra.map(f => (
                        <FactoryCard
                          key={f.id}
                          f={f}
                          currentJob={currentJob}
                          isAtThisBody={isAtThisBody}
                          userId={userId}
                          onPlayClick={onPlayClick}
                          onWorkJob={onWorkJob}
                          onApplyForJob={onApplyForJob}
                          onLeaveJob={onLeaveJob}
                          onCollect={onCollect}
                          onUpgrade={onUpgrade}
                          onUpgradeInfrastructure={onUpgradeInfrastructure}
                          onSaveSettings={onSaveSettings}
                          factoryInputStorage={factoryInputStorage}
                          onDepositInput={onDepositInput}
                          userResources={userResources}
                          siloInventory={siloInventory}
                          onTransferSiloResource={onTransferSiloResource}
                          bodyName={body.name}
                        />
                      ))}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </section>
      )}

      {currentJob && activeSubTab !== "assets" && !factories.some((f) => f.id === currentJob.factoryId) && (
        <div className="p-3 bg-warning/10 border border-warning/20 rounded animate-in slide-in-from-bottom-2 duration-300">
           <div className="flex justify-between items-start gap-4">
             <div>
               <div className="text-[9px] font-bold text-warning uppercase flex items-center gap-2">
                 <JobIcon size={12} /> Remote Employment Active
               </div>
               <p className="text-[8px] text-warning/70 mt-1 italic">Currently employed at a factory elsewhere.</p>
             </div>
             <button 
               onClick={() => { onPlayClick?.(); onLeaveJob(); }}
               className="shrink-0 px-2 py-1.5 bg-warning/20 border border-warning/40 text-warning text-[8px] font-bold uppercase rounded hover:bg-warning/30 transition-all"
             >
               Leave Job
             </button>
           </div>
        </div>
      )}
    </div>
  );
}

function BuildConfirmation({ buildConfirm, onCancel, onConfirm, materials, userResources }: { buildConfirm: any; onCancel: () => void; onConfirm: () => void; materials?: any[]; userResources?: UserResource[] }) {
  return (
    <div className="p-3 bg-primary/10 border border-primary/30 rounded backdrop-blur-md animate-in slide-in-from-top-1 duration-200 shadow-xl overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-[7px] text-muted-foreground uppercase tracking-widest mb-1">Confirm Installation</div>
          <div className="text-[10px] font-bold text-primary uppercase">{buildConfirm.res}</div>
        </div>
        <div className="text-right">
          <div className="text-[7px] text-muted-foreground uppercase tracking-widest mb-1">Build Fee</div>
          <div className="text-[10px] font-mono-hud text-success">{buildConfirm.cost.toLocaleString()} SC</div>
        </div>
      </div>

      {materials && materials.length > 0 && (
        <div className="mb-3 p-2 bg-black/30 rounded border border-primary/10">
          <div className="text-[7px] text-muted-foreground uppercase tracking-widest mb-1">Required Materials:</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {materials.map((m: any) => {
              const has = userResources?.find(ur => ur.resourceType === m.resource)?.amount || 0;
              const enough = has >= m.qty;
              return (
                <div key={m.resource} className="flex items-center gap-1.5">
                  <GalaxyIcon name={(RESOURCE_META as any)[m.resource]?.icon} className={`w-2.5 h-2.5 ${enough ? 'text-success' : 'text-error'}`} />
                  <span className={`text-[8px] font-mono-hud ${enough ? 'text-success/80' : 'text-error/80'}`}>
                    {m.resource}: {has}/{m.qty}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button 
          onClick={onCancel}
          className="flex-1 py-1.5 border border-primary/20 text-muted-foreground text-[8px] font-bold uppercase rounded hover:bg-primary/10"
        >
          Cancel
        </button>
        <button 
          onClick={onConfirm}
          className="flex-1 py-1.5 bg-primary text-background text-[8px] font-bold uppercase rounded hover:bg-primary/90 shadow-lg"
        >
          Confirm Build
        </button>
      </div>
    </div>
  );
}

/* ======================= SHIP OVERVIEW ======================= */
export function ShipOverview({ system, travel, arrival, currentTime, onDeselect, hideHeader, onPlayClick, shipName }: {
  system: StarSystem | null;
  travel: { targetId: string; startTime: number; endTime: number } | null;
  arrival: { fromId: string; startTime: number; duration: number } | null;
  currentTime: number;
  onDeselect?: () => void;
  hideHeader?: boolean;
  onPlayClick?: () => void;
  shipName?: string;
}) {
  const isMoving = !!travel || !!arrival;
  const transitPct = travel
    ? Math.min(100, ((currentTime - travel.startTime) / (travel.endTime - travel.startTime)) * 100)
    : arrival 
      ? Math.min(100, ((currentTime - arrival.startTime) / arrival.duration) * 100)
      : 0;
  const etaSec = travel ? Math.max(0, Math.ceil((travel.endTime - currentTime) / 1000)) : 0;

  return (
    <Panel title={shipName || "Commander Vessel"} subtitle="Fleet · Flagship" hideHeader={hideHeader}>
      <div className="mb-3 p-2 bg-primary/10 border border-primary/20 rounded flex items-center gap-2">
        <span className="text-xl">🚀</span>
        <div>
          <div className="text-[10px] font-bold text-primary uppercase tracking-widest">{shipName || "Flagship"}</div>
          <div className="text-[9px] text-muted-foreground uppercase">Commander Vessel · Class I</div>
        </div>
      </div>
      <Row k="Status" v={isMoving ? (travel ? "FTL Transit" : "Inbound Transit") : "Stationary"} accent={isMoving ? "text-warning" : "text-success"} />
      <Row k="Location" v={system?.name ?? "Deep Space"} />
      <Row k="Hull Integrity" v="100%" accent="text-success" />
      <Row k="Shield Status" v="Online" accent="text-info" />
      <Divider />
      <SubTitle>Drive Systems</SubTitle>
      <Row k="Sub-Light Drive" v="Online" accent="text-success" />
      <Row k="FTL Drive" v={travel ? "Active" : "Standby"} accent={travel ? "text-warning" : "text-success"} />
      {isMoving && (
        <>
          <Divider />
          <SubTitle>{travel ? "FTL Transit" : "Sub-Light Arrival"}</SubTitle>
          {!arrival && <Row k="ETA" v={`${etaSec}s`} accent="text-warning" />}
          <div className="h-1 w-full bg-warning/20 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-warning rounded-full" style={{ width: `${transitPct}%` }} />
          </div>
        </>
      )}
      {onDeselect && (
        <>
          <Divider />
          <button
            onClick={() => {
              onPlayClick?.();
              onDeselect();
            }}
            className="w-full mt-1 px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold text-muted-foreground border border-border hover:border-primary/40 hover:text-primary transition"
          >
            Dismiss
          </button>
        </>
      )}
    </Panel>
  );
}

/* ======================= UI bits ======================= */
function Panel({ title, subtitle, children, hideHeader }: { title: string; subtitle?: string; children: React.ReactNode; hideHeader?: boolean }) {
  return (
    <div className="w-full animate-fade-in pointer-events-auto">
      {!hideHeader && (
        <div className="border-b border-primary/20 pb-2 mb-4">
          <div className="font-mono-hud text-[9px] uppercase tracking-[0.3em] text-primary/70">{subtitle ?? "—"}</div>
          <div className="font-display text-lg uppercase tracking-[0.15em] text-primary text-glow truncate">
            {title}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function Row({ k, v, accent, small, dotColor }: { k: string; v: React.ReactNode; accent?: string; small?: boolean; dotColor?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[11px]">
      <span className="font-mono-hud text-[9px] uppercase tracking-widest text-muted-foreground">{k}</span>
      <span className={`flex items-center gap-1.5 text-right ${small ? "text-[10px]" : ""} ${accent ?? "text-foreground"}`}>
        {dotColor && <span className="inline-block w-2 h-2 rounded-full" style={{ background: dotColor }} />}
        {v}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="my-1.5 border-t border-primary/15" />;
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <div className="font-mono-hud text-[9px] uppercase tracking-[0.25em] text-primary/70 mt-1 mb-1">{children}</div>;
}

function Hint({ children }: { children: React.ReactNode }) {
  return <div className="mt-2 text-[10px] text-muted-foreground italic">{children}</div>;
}

/* ======================= COMPACT UI PIECES ======================= */

function BodyStatBadge({ icon: Icon, value, label, accent }: { icon: any; value: string | number; label: string; accent?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-2 rounded bg-primary/5 border border-primary/10 gap-0.5 hover:bg-primary/10 transition-colors">
      <Icon size={12} className={accent || "text-primary/70"} />
      <div className="text-[10px] font-bold text-foreground leading-none">{value}</div>
      <div className="text-[7px] text-muted-foreground uppercase tracking-wider text-center">{label}</div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, caption, accent }: { icon: any; label: string; value: string; caption?: string; accent?: string }) {
  return (
    <div className="p-2 border border-primary/15 rounded bg-primary/5 flex flex-col gap-1 hover:border-primary/30 transition-all">
      <div className="flex items-center gap-1.5">
        <Icon size={10} className="text-primary/60" />
        <span className="text-[8px] font-mono-hud uppercase tracking-widest text-muted-foreground truncate">{label}</span>
      </div>
      <div className={`text-[10px] font-medium truncate ${accent || "text-foreground"}`}>{value}</div>
      {caption && <div className="text-[7px] text-muted-foreground italic leading-tight truncate">{caption}</div>}
    </div>
  );
}
