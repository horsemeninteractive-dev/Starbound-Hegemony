import { useState } from "react";
import { Info, ChevronUp, ChevronDown } from "lucide-react";
import { STAR_META, BODY_META } from "@/galaxy/meta";

interface Props {
  view: "galaxy" | "system" | "body";
}

export function Legend({ view }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <aside className="relative pointer-events-auto flex flex-col items-start">
      {open && (
        <div className="absolute bottom-full left-0 mb-2 hud-panel hud-corner p-3 w-[280px] max-h-[50vh] overflow-y-auto animate-fade-in-up">
          <div className="font-display text-[10px] uppercase tracking-[0.2em] text-primary text-glow mb-3 border-b border-primary/20 pb-1">
            {view === "galaxy" ? "Strategic Legend" : "Tactical Legend"}
          </div>

          <div className="space-y-4">
            {view === "galaxy" && (
              <LegendSection title="Star Classifications">
                {Object.entries(STAR_META).map(([key, meta]) => (
                  <div key={key} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full bg-current ${meta.color} shadow-[0_0_8px_currentColor]`} />
                    <div className="flex flex-col leading-none">
                      <span className="text-[10px] font-mono-hud text-foreground">{meta.label}</span>
                      <span className="text-[8px] text-muted-foreground uppercase tracking-wider">{meta.description}</span>
                    </div>
                  </div>
                ))}
              </LegendSection>
            )}

            {(view === "system" || view === "body") && (
              <LegendSection title="Celestial Bodies">
                {Object.entries(BODY_META).map(([key, meta]) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-5 text-center text-primary font-mono-hud text-sm">{meta.icon}</span>
                    <span className="text-[10px] font-mono-hud text-foreground uppercase tracking-widest">{meta.label}</span>
                  </div>
                ))}
              </LegendSection>
            )}

            <LegendSection title="Map Symbols">
              {view === "galaxy" && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-[1px] bg-primary/40 relative">
                      <div className="absolute inset-0 bg-primary/20 blur-[1px]" />
                    </div>
                    <span className="text-[10px] font-mono-hud text-foreground uppercase">Hyperlane</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border border-primary/40 rounded-sm" />
                    <span className="text-[10px] font-mono-hud text-foreground uppercase">Sector Border</span>
                  </div>
                </>
              )}
              {view === "system" && (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin-slow scale-50" />
                  <span className="text-[10px] font-mono-hud text-foreground uppercase">Jump Gate</span>
                </div>
              )}
            </LegendSection>
          </div>
        </div>
      )}
      
      <button
        onClick={() => setOpen((o) => !o)}
        className="hud-panel hud-corner flex items-center gap-2 px-3 py-1.5 font-mono-hud text-[10px] uppercase tracking-widest text-primary hover:text-glow transition"
      >
        <Info size={14} />
        {open ? "Close Legend" : "Map Legend"}
        {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>
    </aside>
  );
}

function LegendSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono-hud text-[8px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
        {title}
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}
