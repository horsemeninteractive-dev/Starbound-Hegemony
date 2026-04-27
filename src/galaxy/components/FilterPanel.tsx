import { useState } from "react";
import type { FilterState, DisplayLayer } from "@/galaxy/useGalaxyApp";
import { CONTEST_META, ECON_META, STAR_META } from "@/galaxy/meta";
import type { ContestState, EconomicStatus, StarType } from "@/galaxy/types";

interface Props {
  filters: FilterState;
  onToggle: <K extends keyof FilterState>(kind: K, value: FilterState[K] extends Set<infer V> ? V : never) => void;
  view: "galaxy" | "system" | "body" | "ship";
}

const CONTEST_ORDER: ContestState[] = ["controlled", "contested", "anarchic", "frontier"];
const ECON_ORDER: EconomicStatus[] = ["boom", "stable", "recession", "blockaded", "untapped"];
const STAR_ORDER: StarType[] = ["O", "B", "A", "F", "G", "K", "M", "whitedwarf", "neutron", "pulsar", "binary", "blackhole", "whitehole", "quasar", "magnetar", "protostar", "dyson_swarm"];
const LAYER_ORDER: { key: DisplayLayer; label: string; views?: string[] }[] = [
  { key: "hyperlanes",    label: "Hyperlanes",      views: ["galaxy"] },
  { key: "sectorBorders", label: "Sector Borders",  views: ["galaxy"] },
  { key: "sectorLabels",  label: "Sector Labels",   views: ["galaxy"] },
  { key: "empireColors",  label: "Empire Territory",views: ["galaxy", "system", "body"] },
  { key: "objectLabels",  label: "Object Labels",   views: ["galaxy", "system"] },
  { key: "habitableZones",label: "Habitable Zones", views: ["system", "body"] },
  { key: "orbitPaths",    label: "Orbit Paths",     views: ["system", "body"] },
  { key: "weatherSystems",label: "Weather Systems", views: ["body"] },
  { key: "cityLights",    label: "City Lights",     views: ["body"] },
];

export function FilterPanel({ filters, onToggle, view }: Props) {
  const [open, setOpen] = useState(false);
  const layers = LAYER_ORDER.filter(l => !l.views || l.views.includes(view));
  return (
    <aside className="relative pointer-events-auto">
      <button
        onClick={() => setOpen((o) => !o)}
        className="hud-panel hud-corner px-3 py-2 font-mono-hud text-[10px] uppercase tracking-widest text-primary hover:text-glow transition"
      >
        {open ? "× Filters" : "⚙ Filters"}
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 hud-panel hud-corner p-3 w-[260px] max-h-[70vh] overflow-y-auto animate-fade-in-up">
          <Section title="Display Layers">
            {layers.map((l) => (
              <Chip
                key={l.key}
                active={filters.layers.has(l.key)}
                onClick={() => onToggle("layers", l.key)}
                label={l.label}
              />
            ))}
          </Section>
          <Section title="System State">
            {CONTEST_ORDER.map((k) => (
              <Chip
                key={k}
                active={filters.contest.has(k)}
                onClick={() => onToggle("contest", k)}
                label={CONTEST_META[k].label}
                dot={CONTEST_META[k].dot}
              />
            ))}
          </Section>
          <Section title="Economy">
            {ECON_ORDER.map((k) => (
              <Chip
                key={k}
                active={filters.economy.has(k)}
                onClick={() => onToggle("economy", k)}
                label={ECON_META[k].label}
                colorClass={ECON_META[k].color}
              />
            ))}
          </Section>
          <Section title="Star Type">
            {STAR_ORDER.map((k) => (
              <Chip
                key={k}
                active={filters.starType.has(k)}
                onClick={() => onToggle("starType", k)}
                label={STAR_META[k].label}
                colorClass={STAR_META[k].color}
              />
            ))}
          </Section>
        </div>
      )}
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="font-mono-hud text-[9px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
        {title}
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, label, dot, colorClass }: {
  active: boolean;
  onClick: () => void;
  label: string;
  dot?: string;
  colorClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2 py-1 text-[10px] uppercase tracking-wider border transition ${
        active
          ? "border-primary/60 bg-primary/10 text-primary"
          : "border-border bg-transparent text-muted-foreground hover:border-primary/30"
      }`}
    >
      {dot && <span className={`inline-block w-1.5 h-1.5 rounded-full ${dot}`} />}
      <span className={active ? "" : colorClass}>{label}</span>
    </button>
  );
}
