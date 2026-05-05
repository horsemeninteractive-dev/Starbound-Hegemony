import type { Galaxy, StarSystem, Body, Installation, BodyResource, UserResource, FactoryWorker, Residency, ResidencyApplication } from "@/galaxy/types";
import { STAR_META, CONTEST_META, ECON_META, BODY_META } from "@/galaxy/meta";
import { Zap, Scale, Crown, Shield } from "lucide-react";
import { GalaxyIcon } from "./ResourceIcon";

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
export function SystemOverview({ system, galaxy, onSelectBody, playerSystemId, travel, arrival, initiateJump, getJumpCost, currentTime, isExplored, hideHeader, hideActions, onPlayClick, onSelectEmpire, onEnterSystem, shipName }: {
  system: StarSystem;
  galaxy: Galaxy;
  onSelectBody: (id: string) => void;
  playerSystemId: string;
  travel: { targetId: string; startTime: number; endTime: number } | null;
  arrival: { fromId: string; startTime: number; duration: number } | null;
  initiateJump: (id: string) => void;
  getJumpCost: (id: string) => number;
  currentTime: number;
  isExplored: boolean;
  hideHeader?: boolean;
  hideActions?: boolean;
  onPlayClick?: () => void;
  onSelectEmpire?: (id: string) => void;
  onEnterSystem?: () => void;
  shipName?: string;
}) {
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

  const isAdjacent = galaxy.hyperlanes.some(h => (h.a === playerSystemId && h.b === system.id) || (h.a === system.id && h.b === playerSystemId));
  const isCurrent = playerSystemId === system.id;
  const isTravelingToThis = travel?.targetId === system.id;

  return (
    <Panel title={system.name} subtitle={sector?.name ?? "Unknown Sector"} hideHeader={hideHeader}>
      {!hideActions && onEnterSystem && (
        <button
          onClick={() => {
            onEnterSystem();
            onPlayClick?.();
          }}
          className="w-full mb-4 py-3 bg-primary text-background font-display text-[10px] font-bold uppercase tracking-[0.2em] rounded border border-primary/40 hover:bg-primary/80 transition-all flex items-center justify-center gap-2 group"
        >
          <Zap size={14} fill="currentColor" className="group-hover:scale-110 transition-transform" />
          Enter System
        </button>
      )}

      {isCurrent && (
        <div className="mb-4 bg-primary/10 border border-primary/20 px-3 py-2 rounded flex items-center justify-between">
          <span className="text-[10px] font-bold text-primary">CURRENT LOCATION</span>
          <span className={`text-[10px] font-bold ${(travel || arrival) ? "text-warning animate-pulse" : "text-primary/60"}`}>
            {(travel || arrival) ? "IN TRANSIT" : "STATIONARY"}
          </span>
        </div>
      )}

      {isTravelingToThis && travel && (
        <div className="mb-4 bg-warning/10 border border-warning/20 px-3 py-2 rounded">
          <div className="flex justify-between mb-1">
            <span className="text-[10px] font-bold text-warning uppercase">FTL Travel in Progress</span>
            <span className="text-[10px] text-warning">EST. ARRIVAL: {Math.ceil((travel.endTime - currentTime) / 1000)}s</span>
          </div>
          <div className="h-1 w-full bg-warning/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-warning animate-pulse" 
              style={{ width: `${Math.min(100, ((currentTime - travel.startTime) / (travel.endTime - travel.startTime)) * 100)}%` }} 
            />
          </div>
        </div>
      )}

      <Row k="Star Class" v={explored ? meta.label : "???"} accent={explored ? meta.color : "text-muted-foreground"} />
      <Row k="Description" v={explored ? meta.description : "???"} small />
      <Row k="Temperature" v={explored ? meta.temp : "???"} small />
      
      {!hideActions && !isCurrent && !travel && isAdjacent && (
        <button 
          onClick={() => {
            onPlayClick?.();
            initiateJump(system.id);
          }}
          className="w-full mt-4 bg-primary hover:bg-primary/80 text-background font-bold py-2 px-4 rounded text-xs tracking-widest transition-colors flex items-center justify-between gap-2"
        >
          <span className="flex items-center gap-2">
            <span>INITIATE FTL JUMP</span>
            <span className="opacity-60">→</span>
          </span>
          <span className="text-[9px] font-mono-hud text-background/80 border-l border-background/20 pl-2">{getJumpCost(system.id)} AP</span>
        </button>
      )}

      <Divider />
      <Row k="Status" v={explored ? CONTEST_META[system.contest].label : "???"} accent={explored ? CONTEST_META[system.contest].color : "text-muted-foreground"} />
      <Row k="Economy" v={explored ? ECON_META[system.economy].label : "???"} accent={explored ? ECON_META[system.economy].color : "text-muted-foreground"} />
      <Row k="Jump Gates" v={explored ? system.gates.length : "???"} />
      <Divider />
      <Row k="Planets" v={explored ? planets.length : "???"} />
      <Row k="Moons" v={explored ? moons : "???"} />
      <Row k="Asteroids" v={explored ? asteroids : "???"} />
      <Row k="Stations" v={explored ? stations : "???"} />
      
      {!explored && (
        <div className="mt-4 p-3 border border-dashed border-primary/20 rounded bg-primary/5">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-warning rounded-full animate-pulse" />
            <span className="text-[9px] font-mono-hud uppercase text-warning tracking-widest font-bold">Uncharted Territory</span>
          </div>
          <p className="text-[10px] text-primary/60 leading-relaxed font-mono-hud italic">
            Detailed system intelligence unavailable. Establish physical presence to reveal tactical data.
          </p>
        </div>
      )}

      {explored && owners.size > 0 && (
        <>
          <Divider />
          <SubTitle>Holdings</SubTitle>
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
                className="w-full flex items-center justify-between gap-3 text-[11px] hover:bg-primary/5 transition-colors p-1 rounded group"
              >
                <span className="font-mono-hud text-[9px] uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">{emp.tag}</span>
                <span className="flex items-center gap-1.5 text-right text-foreground">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: `hsl(${emp.hue} 70% 55%)` }} />
                  {n} body{n > 1 ? "ies" : "y"}
                </span>
              </button>
            );
          })}
        </>
      )}

      {explored && (
        <>
          <Divider />
          <SubTitle>Bodies (tap to view)</SubTitle>
          <div className="flex flex-col gap-1 max-h-[40vh] sm:max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
            {/* 1. Ships (Top of the list) */}
            {isCurrent && (
              <button
                onClick={() => {
                  onPlayClick?.();
                  onSelectBody("ship");
                }}
                className="flex items-center justify-between gap-2 px-2 py-1 text-[10px] uppercase tracking-wider border border-primary/30 bg-primary/10 hover:bg-primary/20 text-left transition mb-1 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
              >
                <GalaxyIcon name={BODY_META.ship.icon} className="w-3 h-3 text-primary" />
                <span className="flex-1 truncate text-primary font-bold">{shipName || "Commander's Vessel"}</span>
                <span className="text-primary/60">{BODY_META.ship.label}</span>
              </button>
            )}

            {/* 2. Sorted Hierarchical Bodies (Planets -> Moons) */}
            {system.bodies
              .filter(b => !b.parentId) // Top-level only
              .filter((b) => b.type !== "asteroid" || system.bodies.filter(x => x.type === "asteroid").indexOf(b) < 3) // Cap asteroids
              .sort((a, b) => a.orbit - b.orbit) // Orbital order
              .slice(0, 30) // Increased cap
              .map((b) => (
                <BodyListEntry key={b.id} body={b} onSelect={onSelectBody} depth={0} onPlayClick={onPlayClick} />
              ))}
          </div>
        </>
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
  playerBodyId,
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
  onInitiateGovernance
}: { 
  body: Body; 
  galaxy: Galaxy; 
  hideHeader?: boolean; 
  isExplored?: boolean; 
  isVisited?: boolean;
  onPlayClick?: () => void;
  onSelectEmpire?: (id: string) => void;
  playerSystemId: string;
  playerBodyId: string;
  travel: { targetId: string; startTime: number; endTime: number; type?: "inter" | "intra"; startPos?: { x: number; z: number } } | null;
  initiateTravelToBody: (id: string) => void;
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
  onSaveSettings: (factoryId: string, wage: number, jobsAvailable: number) => Promise<void>;
  userId: string | null;
  userResidency: Residency | null;
  residencyApplications: ResidencyApplication[];
  onClaimResidency: (bodyId: string, instant: boolean) => void;
  bodyGovernance: Record<string, { status: string, electionEndTime: string | null, empireId?: string | null }>;
  onInitiateGovernance: (bodyId: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"info" | "economy">("info");
  const owner = body.ownerId ? galaxy.empires.find((e) => e.id === body.ownerId) : null;
  
  const zoneColors = { hot: "text-error", temperate: "text-success", cold: "text-info" };
  const bioColors = { none: "text-muted-foreground", sparse: "text-foreground", abundant: "text-success", exotic: "text-accent", hostile: "text-error" };

  const isStar = body.type === "star";
  const isPlanet = body.type === "terrestrial" || body.type === "gas_giant";
  const isMoon = body.type === "moon";
  const isStation = body.type === "station";
  const isShip = body.type === "ship";

  const isTravelingToThis = travel?.targetId === body.id && travel?.type === "intra";
  const isInSameSystem = playerSystemId === body.systemId;
  const isAtThisBody = playerBodyId === body.id;
  const effectiveIsVisited = isVisited || isAtThisBody;

  return (
    <Panel title={body.name} subtitle={BODY_META[body.type].label} hideHeader={hideHeader}>
      {/* Tabs */}
      <div className="flex border-b border-primary/20 mb-4">
        <button 
          onClick={() => { onPlayClick?.(); setActiveTab("info"); }}
          className={`flex-1 py-2 text-[10px] uppercase tracking-widest font-bold transition-all ${activeTab === "info" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-primary/60"}`}
        >
          Intelligence
        </button>
        {!isStar && !isShip && (
          <button 
            onClick={() => { onPlayClick?.(); setActiveTab("economy"); }}
            className={`flex-1 py-2 text-[10px] uppercase tracking-widest font-bold transition-all ${activeTab === "economy" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-primary/60"}`}
          >
            Economy
          </button>
        )}
      </div>

      {activeTab === "info" ? (
        <div className="animate-in fade-in slide-in-from-left-2 duration-300">
          {isTravelingToThis && travel && (
            <div className="mb-4 bg-warning/10 border border-warning/20 px-3 py-2 rounded">
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
              className="w-full mb-4 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary font-bold py-2.5 px-4 rounded text-[10px] tracking-[0.2em] transition-all flex items-center justify-between group"
            >
              <span className="flex items-center gap-2">
                <Zap size={12} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                <span>INITIATE TRAVEL</span>
              </span>
              <span className="text-[9px] font-mono-hud text-primary/60 border-l border-primary/20 pl-2">5 AP</span>
            </button>
          )}

          {isAtThisBody && isInSameSystem && !travel && !isShip && (
            <div className="mb-4 bg-primary/10 border border-primary/20 px-3 py-2 rounded flex items-center justify-between">
              <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Vessel in Orbit</span>
              <span className="text-[10px] font-bold text-primary/60">STATIONARY</span>
            </div>
          )}

          {isExplored && !effectiveIsVisited && !isShip && !isStar && (
            <div className="mb-4 bg-info/10 border border-info/20 px-3 py-2 rounded">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-info animate-pulse" />
                <span className="text-[10px] font-bold text-info uppercase tracking-widest">Awaiting Survey</span>
              </div>
              <p className="text-[9px] text-info/60 mt-1 italic">Orbital sensors have identified resource signatures. Surface survey required for tactical quantification.</p>
            </div>
          )}

          <Row k={isStar ? "Stellar Class" : "Type"} v={formatLabel(body.subtype)} />
          {!isStar && !isShip && <Row k="Orbit" v={`${body.orbit.toFixed(2)} AU`} />}
          
          <Row 
            k="Size" 
            v={isStar 
              ? `${(body.size * 0.4).toFixed(2)} R☉` // Approximate Solar Radii
              : isShip 
                ? `${(body.size * 100).toFixed(0)} m length`
                : `${(body.size * 6371).toFixed(0)} km radius`
            } 
          />

          {isPlanet && (
            <Row k="Satellites" v={body.children?.length ? (isExplored ? `${body.children.length} Moons` : "???") : "None"} />
          )}

          <Divider />

          {!isExplored ? (
            <div className="p-3 border border-dashed border-primary/20 rounded bg-primary/5 mb-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-warning rounded-full animate-pulse" />
                <span className="text-[9px] font-mono-hud uppercase text-warning tracking-widest font-bold">Data Corrupted</span>
              </div>
              <p className="text-[10px] text-primary/60 leading-relaxed font-mono-hud italic">
                Long-range sensor data insufficient for detailed planetary analysis. Explore the system to reveal body characteristics.
              </p>
            </div>
          ) : (
            <>
              <Row k="Temperature" v={`${body.temperature} K`} />
              <Row k="Environment" v={formatLabel(body.habitabilityZone)} accent={zoneColors[body.habitabilityZone]} />
              <Row k="Atmosphere" v={body.atmosphere ?? "None"} />
              
              <Divider />
              
              <Row k="Population" v={body.population > 0 ? `${body.population.toFixed(1)} M` : "Uninhabited"} />
              <Row k="Economy" v={ECON_META[body.economy].label} accent={ECON_META[body.economy].color} />
              <button
                onClick={() => {
                  if (owner) {
                    onPlayClick?.();
                    onSelectEmpire?.(owner.id);
                  }
                }}
                className={`w-full flex items-center justify-between gap-3 text-[11px] p-1 rounded transition-colors ${owner ? 'hover:bg-primary/5 group' : ''}`}
              >
                <span className={`font-mono-hud text-[9px] uppercase tracking-widest text-muted-foreground ${owner ? 'group-hover:text-primary transition-colors' : ''}`}>Sovereign</span>
                <span className="flex items-center gap-1.5 text-right text-foreground">
                  {owner && <span className="inline-block w-2 h-2 rounded-full" style={{ background: `hsl(${owner.hue} 70% 55%)` }} />}
                  {owner?.name ?? "Unclaimed"}
                </span>
              </button>
              
              {body.type === "terrestrial" && (
                <>
                  <Divider />
                  <SubTitle>Biosphere</SubTitle>
              <Row k="Flora"  v={formatLabel(body.flora)}  accent={bioColors[body.flora]} />
                  <Row k="Fauna"  v={formatLabel(body.fauna)}  accent={bioColors[body.fauna]} />
                </>
              )}
               {/* Residency Section */}
              {!isShip && !isStar && isExplored && (
                <div className="mt-4 border-t border-primary/20 pt-4">
                  <SubTitle>Citizenship</SubTitle>
                  {userResidency?.bodyId === body.id ? (
                    <div className="bg-success/10 border border-success/20 px-3 py-2 rounded flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-success rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                        <span className="text-[10px] font-bold text-success uppercase tracking-widest">Permanent Resident</span>
                      </div>
                      <span className="text-[9px] text-success/60 font-mono-hud">Joined {new Date(userResidency.joinedAt).toLocaleDateString()}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {residencyApplications.find(a => a.bodyId === body.id && a.status === 'pending') ? (
                        <div className="bg-warning/10 border border-warning/20 px-3 py-2 rounded flex items-center justify-between animate-pulse">
                           <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-warning rounded-full" />
                            <span className="text-[10px] font-bold text-warning uppercase tracking-widest">Application Pending</span>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { onPlayClick?.(); onClaimResidency(body.id, !body.ownerId); }}
                          className="w-full bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-bold py-2 px-4 rounded text-[9px] tracking-[0.2em] transition-all flex items-center justify-center gap-2 group"
                        >
                          <UserPlus size={12} className="group-hover:scale-110 transition-transform" />
                          {body.ownerId ? "APPLY FOR RESIDENCY" : "CLAIM RESIDENCY"}
                        </button>
                      )}
                      {userResidency && userResidency.bodyId !== body.id && (
                        <p className="text-[8px] text-muted-foreground text-center italic">Current Residency: {userResidency.bodyId}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Local Governance Section */}
              {!isShip && !isStar && isExplored && !body.ownerId && (
                <div className="mt-4 border-t border-primary/20 pt-4">
                  <SubTitle>Local Governance</SubTitle>
                  {bodyGovernance[body.id] ? (
                    <div className="bg-primary/10 border border-primary/20 px-3 py-2 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                          {bodyGovernance[body.id].status === 'governed' ? "Provisional Council" : "Imperial Territory"}
                        </span>
                        <span className="text-[8px] text-primary/60 font-mono-hud uppercase">
                          {bodyGovernance[body.id].status === 'governed' ? "Active Cycle" : "Established"}
                        </span>
                      </div>
                      {bodyGovernance[body.id].electionEndTime && (
                        <div className="text-[8px] font-mono-hud text-muted-foreground mt-1 uppercase mb-3">
                          Council Formed: {new Date(bodyGovernance[body.id].electionEndTime).toLocaleDateString()}
                        </div>
                      )}
                      <button
                        onClick={() => { 
                          onPlayClick?.(); 
                          const targetId = bodyGovernance[body.id].status === 'governed' ? body.id : bodyGovernance[body.id].empireId;
                          if (targetId) onSelectEmpire?.(targetId); 
                        }}
                        className="w-full bg-primary/20 hover:bg-primary/40 border border-primary/40 text-primary font-bold py-1.5 px-4 rounded text-[9px] tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                      >
                        <Scale size={12} />
                        ACCESS COUNCIL
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <p className="text-[8px] text-muted-foreground italic leading-relaxed">
                        This body is an independent region. Establish a local council to begin the path to statehood.
                      </p>
                      <button
                        onClick={() => { onPlayClick?.(); onInitiateGovernance(body.id); }}
                        disabled={userResidency?.bodyId !== body.id}
                        className="w-full bg-warning/10 hover:bg-warning/20 border border-warning/30 text-warning font-bold py-2 px-4 rounded text-[9px] tracking-[0.2em] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Scale size={12} className="group-hover:rotate-12 transition-transform" />
                        INITIATE GOVERNANCE
                      </button>
                      {userResidency?.bodyId !== body.id && (
                        <p className="text-[7px] text-destructive/60 uppercase text-center tracking-widest">Permanent Residency Required</p>
                      )}
                    </div>
                  )}
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

              {!isStar && body.deposits.length > 0 && (
                <>
                  <Divider />
                  <SubTitle>Resources</SubTitle>
                  <div className="flex flex-wrap gap-1.5">
                    {body.deposits.map((d) => {
                      const richnessColor = {
                        trace: "text-muted-foreground/80",
                        moderate: "text-info/90",
                        significant: "text-primary/90",
                        rich: "text-success/90",
                        abundant: "text-warning/90"
                      }[d.richness];
                      const richnessSymbols = {
                        trace: "★",
                        moderate: "★★",
                        significant: "★★★",
                        rich: "★★★★",
                        abundant: "★★★★★"
                      }[d.richness];

                      return (
                        <div key={d.resource} className="px-2 py-1 flex flex-col border border-primary/20 bg-primary/5 rounded-sm min-w-[70px]">
                          <span className="text-[9px] uppercase tracking-wider text-primary/80 font-bold leading-tight">
                            {d.resource}
                          </span>
                          <span className={`text-[9px] font-mono-hud font-bold tracking-tighter ${effectiveIsVisited ? richnessColor : "text-muted-foreground"}`}>
                            {effectiveIsVisited ? richnessSymbols : "???"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      ) : (
        <EconomyTab 
          body={body}
          factories={factories}
          bodyResources={bodyResources}
          userResources={userResources}
          currentJob={currentJob}
          onBuildFactory={onBuildFactory}
          onApplyForJob={onApplyForJob}
          onWorkJob={onWorkJob}
          onLeaveJob={onLeaveJob}
          onPlayClick={onPlayClick}
          isAtThisBody={isAtThisBody}
          userId={userId}
          onCollect={onCollect}
          onUpgrade={onUpgrade}
          onSaveSettings={onSaveSettings}
        />
      )}
    </Panel>
  );
}

import { Building2, Pickaxe, UserPlus, LogOut, Briefcase as JobIcon, Coins as SC_Icon, Package, Settings, ArrowUp, ChevronRight } from "lucide-react";
import { RESOURCE_META, RICHNESS_VALUES } from "@/galaxy/meta";
import { useState } from "react";

const STORAGE_CAPACITY = [100, 300, 750, 2000, 5000];
const STORAGE_COST = [2000, 6000, 15000, 40000];
const SLOT_CAPACITY = [3, 5, 10, 20];
const SLOT_COST = [1500, 5000, 12000];
const REPLENISH_BONUS = ["0%", "+25%", "+60%", "+100%"];
const REPLENISH_COST = [3000, 8000, 20000];

function FactoryCard({
  f, currentJob, isAtThisBody, userId, onPlayClick,
  onWorkJob, onApplyForJob, onLeaveJob, onCollect, onUpgrade, onSaveSettings
}: {
  f: Installation; currentJob: any; isAtThisBody: boolean; userId: string | null;
  onPlayClick?: () => void;
  onWorkJob: () => void; onApplyForJob: (id: string) => void; onLeaveJob: () => void;
  onCollect: (id: string) => void;
  onUpgrade: (id: string, type: 'storage' | 'slots' | 'replenish') => void;
  onSaveSettings: (id: string, wage: number, jobs: number) => void;
}) {
  const rMeta = (RESOURCE_META as any)[f.resourceType];
  const isWorkingHere = currentJob?.factoryId === f.id;
  const isOwner = f.ownerId === userId && !f.isNpcOwned;
  const [showSettings, setShowSettings] = useState(false);
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [wageInput, setWageInput] = useState(String(f.wage));
  const [jobsInput, setJobsInput] = useState(String(f.jobsAvailable));

  const storageCapacity = f.storageCapacity ?? STORAGE_CAPACITY[Math.min(f.storageTier ?? 0, 4)];
  const storagePct = storageCapacity > 0 ? Math.min(100, (f.storage / storageCapacity) * 100) : 0;
  const storageFull = f.storage >= storageCapacity;

  return (
    <div className={`border rounded transition-all ${isWorkingHere ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]' : 'border-primary/20 bg-primary/5'}`}>
      {/* Header */}
      <div className="p-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 border border-primary/20 rounded">
              <Building2 size={16} className="text-primary" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-primary uppercase">{rMeta?.label || f.type}</div>
              <div className="text-[8px] text-muted-foreground uppercase">{f.isNpcOwned ? "NPC Controlled" : "Player Owned"}</div>
            </div>
          </div>
          <div className="text-right flex items-center gap-2">
            {!f.isNpcOwned && (
              <div className="text-right">
                <div className="text-[10px] font-bold text-success flex items-center gap-1 justify-end">
                  <SC_Icon size={10} /> {f.wage} SC
                </div>
                <div className="text-[8px] text-muted-foreground uppercase mt-0.5">wage/shift</div>
              </div>
            )}
            {isOwner && (
              <div className="flex gap-1">
                <button onClick={() => { setShowSettings(s => !s); setShowUpgrades(false); }}
                  className={`p-1 rounded border transition-all ${showSettings ? 'border-primary bg-primary/20 text-primary' : 'border-primary/20 text-muted-foreground hover:border-primary/40 hover:text-primary'}`}
                  title="Factory Settings">
                  <Settings size={11} />
                </button>
                <button onClick={() => { setShowUpgrades(u => !u); setShowSettings(false); }}
                  className={`p-1 rounded border transition-all ${showUpgrades ? 'border-info bg-info/20 text-info' : 'border-primary/20 text-muted-foreground hover:border-info/40 hover:text-info'}`}
                  title="Upgrades">
                  <ArrowUp size={11} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Storage bar (player factories only) */}
        {!f.isNpcOwned && (
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-[8px] font-mono-hud uppercase">
              <span className="flex items-center gap-1 text-muted-foreground"><Package size={8} /> Storage</span>
              <span className={storageFull ? "text-warning" : "text-primary"}>{f.storage} / {storageCapacity}</span>
            </div>
            <div className="h-1 bg-primary/10 rounded-full overflow-hidden">
              <div className={`h-full transition-all ${storageFull ? 'bg-warning' : 'bg-primary'}`} style={{ width: `${storagePct}%` }} />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-3 flex gap-2">
          {isWorkingHere ? (
            <>
              <button
                disabled={!isAtThisBody || storageFull}
                onClick={() => { onPlayClick?.(); onWorkJob(); }}
                className={`flex-1 py-2 bg-primary text-background font-bold text-[9px] uppercase tracking-widest rounded shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 ${(!isAtThisBody || storageFull) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Pickaxe size={12} />
                {storageFull ? "Storage Full" : (isOwner ? "Work (no wage)" : "Work (5 AP)")}
              </button>
              <button onClick={() => { onPlayClick?.(); onLeaveJob(); }}
                className="p-2 border border-error/40 text-error hover:bg-error/10 transition-all rounded" title="Quit Job">
                <LogOut size={12} />
              </button>
            </>
          ) : (
            <button
              disabled={!!currentJob || !isAtThisBody}
              onClick={() => { onPlayClick?.(); onApplyForJob(f.id); }}
              className={`flex-1 py-2 border border-primary text-primary font-bold text-[9px] uppercase tracking-widest rounded hover:bg-primary/10 transition-all flex items-center justify-center gap-2 ${(!!currentJob || !isAtThisBody) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <UserPlus size={12} />
              {currentJob ? "Already Employed" : "Accept Job"}
            </button>
          )}
          {/* Collect button — owner, at body, has stock */}
          {isOwner && isAtThisBody && f.storage > 0 && (
            <button onClick={() => { onPlayClick?.(); onCollect(f.id); }}
              className="px-2 py-2 border border-success/40 text-success hover:bg-success/10 transition-all rounded flex items-center gap-1 text-[8px] font-bold uppercase"
              title={`Collect ${f.storage} units`}>
              <Package size={11} /> Collect
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
          <div className="text-[8px] font-bold text-info/70 uppercase tracking-widest mb-1">Factory Upgrades</div>
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
        </div>
      )}
    </div>
  );
}

function EconomyTab({ 
  body, factories, bodyResources, userResources, currentJob, 
  onBuildFactory, onApplyForJob, onWorkJob, onLeaveJob, onPlayClick,
  isAtThisBody, userId, onCollect, onUpgrade, onSaveSettings
}: {
  body: Body;
  factories: Installation[];
  bodyResources: BodyResource[];
  userResources: UserResource[];
  currentJob: FactoryWorker | null;
  onBuildFactory: (res: string) => void;
  onApplyForJob: (id: string) => void;
  onWorkJob: () => void;
  onLeaveJob: () => void;
  onPlayClick?: () => void;
  isAtThisBody: boolean;
  userId: string | null;
  onCollect: (id: string) => void;
  onUpgrade: (id: string, type: 'storage' | 'slots' | 'replenish') => void;
  onSaveSettings: (id: string, wage: number, jobs: number) => void;
}) {
  const isSanctum = body.systemId.startsWith('sys-inner-') || body.systemId === 'sys-center';
  
  return (
    <div className="animate-in fade-in slide-in-from-right-2 duration-300 space-y-4">
      {/* Planetary Resources Section */}
      <section>
        <SubTitle>Surface Resources</SubTitle>
        <div className="space-y-2">
          {body.deposits.map((d) => {
            const bRes = bodyResources.find(r => r.resourceType === d.resource);
            const rMeta = (RESOURCE_META as any)[d.resource];
            const richness = RICHNESS_VALUES[d.richness as keyof typeof RICHNESS_VALUES] || 1;
            
            let liveAmount = bRes?.currentAmount || 0;
            if (bRes) {
              const secondsElapsed = (Date.now() - new Date(bRes.lastReplenishedAt).getTime()) / 1000;
              const replenishRate = bRes.richnessValue * 0.002;
              const replenished = Math.floor(secondsElapsed * replenishRate);
              liveAmount = Math.min(bRes.maxAmount, liveAmount + replenished);
            }
            
            const pct = bRes ? (liveAmount / bRes.maxAmount) * 100 : 100;
            const isDepleted = liveAmount <= 0;

            return (
              <div key={d.resource} className="p-3 border border-primary/20 bg-primary/5 rounded">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <GalaxyIcon name={rMeta?.icon} className="w-5 h-5" color={rMeta?.color} />
                    <div>
                      <div className="text-[10px] font-bold text-primary uppercase">{d.resource}</div>
                      <div className="text-[8px] text-muted-foreground uppercase">Richness: {d.richness} ({richness}★)</div>
                    </div>
                  </div>
                  {!isSanctum && !factories.some((f: any) => f.resourceType === d.resource && f.ownerId === userId) && (
                    <button 
                      disabled={!isAtThisBody}
                      onClick={() => { onPlayClick?.(); onBuildFactory(d.resource); }}
                      className={`px-2 py-1 border border-primary/40 text-primary text-[8px] font-bold uppercase rounded hover:bg-primary/20 transition-all ${!isAtThisBody ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Build Factory
                    </button>
                  )}
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] font-mono-hud uppercase">
                    <span className={isDepleted ? "text-error" : "text-muted-foreground"}>
                      {isDepleted ? "DEPLETED" : "AVAILABILITY"}
                    </span>
                    <span className="text-primary">{bRes ? liveAmount : "???"} / {bRes ? bRes.maxAmount : "???"}</span>
                  </div>
                  <div className="h-1 bg-primary/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${isDepleted ? 'bg-error' : 'bg-primary'}`} 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Divider />

      {/* Industrial Facilities Section */}
      <section>
        <SubTitle>Active Facilities</SubTitle>
        <div className="space-y-2">
          {factories.length === 0 && (
            <div className="p-4 border border-dashed border-primary/20 rounded text-center">
              <span className="text-[9px] text-muted-foreground uppercase tracking-widest italic">No active industrial operations</span>
            </div>
          )}
          {factories.map((f) => (
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
              onSaveSettings={onSaveSettings}
            />
          ))}
        </div>
      </section>

      {currentJob && !factories.some((f) => f.id === currentJob.factoryId) && (
        <div className="p-3 bg-warning/10 border border-warning/20 rounded">
           <div className="flex justify-between items-start gap-4">
             <div>
               <div className="text-[9px] font-bold text-warning uppercase flex items-center gap-2">
                 <JobIcon size={12} /> Remote Employment Active
               </div>
               <p className="text-[8px] text-warning/70 mt-1 italic">You are currently employed at a factory elsewhere. Leave that job to apply here.</p>
             </div>
             <button 
               onClick={() => { onPlayClick?.(); onLeaveJob(); }}
               className="shrink-0 px-2 py-1.5 bg-warning/20 border border-warning/40 text-warning text-[8px] font-bold uppercase rounded hover:bg-warning/30 transition-all flex items-center gap-1.5"
             >
               <LogOut size={10} />
               Leave Job
             </button>
           </div>
        </div>
      )}
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
    <Panel title={shipName || "Commander's Vessel"} subtitle="Fleet · Flagship" hideHeader={hideHeader}>
      <div className="mb-3 p-2 bg-primary/10 border border-primary/20 rounded flex items-center gap-2">
        <span className="text-xl">🚀</span>
        <div>
          <div className="text-[10px] font-bold text-primary uppercase tracking-widest">IXS Hegemony</div>
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
