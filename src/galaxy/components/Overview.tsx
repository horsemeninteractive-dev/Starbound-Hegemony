import type { Galaxy, StarSystem, Body } from "@/galaxy/types";
import { STAR_META, CONTEST_META, ECON_META, BODY_META } from "@/galaxy/meta";

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
export function SystemOverview({ system, galaxy, onSelectBody, playerSystemId, travel, initiateJump, currentTime, isExplored, hideHeader }: {
  system: StarSystem;
  galaxy: Galaxy;
  onSelectBody: (id: string) => void;
  playerSystemId: string;
  travel: { targetId: string; startTime: number; endTime: number } | null;
  initiateJump: (id: string) => void;
  currentTime: number;
  isExplored: boolean;
  hideHeader?: boolean;
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
      {isCurrent && (
        <div className="mb-4 bg-primary/10 border border-primary/20 px-3 py-2 rounded flex items-center justify-between">
          <span className="text-[10px] font-bold text-primary">CURRENT LOCATION</span>
          <span className="text-[10px] text-primary/60">STATIONARY</span>
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
      
      {!isCurrent && !travel && isAdjacent && (
        <button 
          onClick={() => initiateJump(system.id)}
          className="w-full mt-4 bg-primary hover:bg-primary/80 text-background font-bold py-2 px-4 rounded text-xs tracking-widest transition-colors flex items-center justify-center gap-2"
        >
          <span>INITIATE FTL JUMP</span>
          <span className="opacity-60">→</span>
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
              <Row
                key={id}
                k={emp.tag}
                v={`${n} body${n > 1 ? "ies" : "y"}`}
                dotColor={`hsl(${emp.hue} 70% 55%)`}
              />
            );
          })}
        </>
      )}

      {explored && (
        <>
          <Divider />
          <SubTitle>Bodies (tap to view)</SubTitle>
          <div className="flex flex-col gap-1 max-h-[40vh] sm:max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
            {system.bodies
              .filter((b) => b.type !== "asteroid" || system.bodies.filter(x => x.type === "asteroid").indexOf(b) < 3)
              .slice(0, 20)
              .map((b) => (
                <button
                  key={b.id}
                  onClick={() => onSelectBody(b.id)}
                  className="flex items-center justify-between gap-2 px-2 py-1 text-[10px] uppercase tracking-wider border border-border hover:border-primary/60 hover:bg-primary/5 text-left transition"
                >
                  <span className="text-primary">{BODY_META[b.type].icon}</span>
                  <span className="flex-1 truncate text-foreground">{b.name}</span>
                  <span className="text-muted-foreground">{BODY_META[b.type].label}</span>
                </button>
              ))}
          </div>
        </>
      )}
    </Panel>
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

export function BodyOverview({ body, galaxy, hideHeader }: { body: Body; galaxy: Galaxy; hideHeader?: boolean }) {
  const owner = body.ownerId ? galaxy.empires.find((e) => e.id === body.ownerId) : null;
  
  const zoneColors = { hot: "text-error", temperate: "text-success", cold: "text-info" };
  const bioColors = { none: "text-muted-foreground", sparse: "text-foreground", abundant: "text-success", exotic: "text-accent", hostile: "text-error" };

  return (
    <Panel title={body.name} subtitle={BODY_META[body.type].label} hideHeader={hideHeader}>
      <Row k="Type" v={formatLabel(body.subtype)} />
      <Row k="Orbit" v={`${body.orbit.toFixed(2)} AU`} />
      <Row k="Size" v={`${(body.size * 6371).toFixed(0)} km radius`} />
      <Divider />
      <Row k="Temperature" v={`${body.temperature} K`} />
      <Row k="Environment" v={formatLabel(body.habitabilityZone)} accent={zoneColors[body.habitabilityZone]} />
      <Row k="Atmosphere" v={body.atmosphere ?? "None"} />
      <Divider />
      <Row k="Population" v={body.population > 0 ? `${body.population.toFixed(1)} M` : "Uninhabited"} />
      <Row k="Economy" v={ECON_META[body.economy].label} accent={ECON_META[body.economy].color} />
      <Row
        k="Sovereign"
        v={owner?.name ?? "Unclaimed"}
        dotColor={owner ? `hsl(${owner.hue} 70% 55%)` : undefined}
      />
      
      {body.type === "terrestrial" && (
        <>
          <Divider />
          <SubTitle>Biosphere</SubTitle>
          <Row k="Flora"  v={formatLabel(body.flora)}  accent={bioColors[body.flora]} />
          <Row k="Fauna"  v={formatLabel(body.fauna)}  accent={bioColors[body.fauna]} />
        </>
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

      <Divider />
      <SubTitle>Resources</SubTitle>
      <div className="flex flex-wrap gap-1.5">
        {body.resources.map((r) => (
          <span key={r} className="px-2 py-0.5 text-[10px] uppercase tracking-wider border border-primary/30 text-primary/90">
            {r}
          </span>
        ))}
      </div>
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
