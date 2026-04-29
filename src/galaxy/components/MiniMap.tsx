import { useMemo, useState } from "react";
import type { Galaxy, StarSystem } from "../types";
import { ChevronDown, ChevronUp, Map as MapIcon } from "lucide-react";

interface Props {
  galaxy: Galaxy;
  currentSystem: StarSystem | null;
  playerSystemId?: string;
  view: "galaxy" | "system" | "body" | "ship";
  knownSystemIds?: Set<string>;
  fogOfWar?: boolean;
  onToggle?: (expanded: boolean) => void;
}

export function MiniMap({ galaxy, currentSystem, playerSystemId, view, knownSystemIds, fogOfWar, onToggle }: Props) {
  const [isExpanded, setIsExpanded] = useState(
    () => localStorage.getItem("minimapExpanded") === "true"
  );

  const toggle = () => {
    setIsExpanded(prev => {
      const next = !prev;
      localStorage.setItem("minimapExpanded", String(next));
      if (onToggle) onToggle(next);
      return next;
    });
  };

  const size = 160;
  const padding = 10;
  const innerSize = size - padding * 2;
  
  const bounds = 4800;

  const points = useMemo(() => {
    return galaxy.systems
      .filter(s => {
        if (!fogOfWar || !knownSystemIds) return true;
        return knownSystemIds.has(s.id) || s.id === "sys-center";
      })
      .map(s => {
        const x = (s.pos[0] / bounds) * (innerSize / 2) + (size / 2);
        const y = (s.pos[2] / bounds) * (innerSize / 2) + (size / 2);
        // Dim color for known-but-not-visited systems
        const isExplored = !fogOfWar || !knownSystemIds || knownSystemIds.has(s.id);
        return { id: s.id, x, y, isExplored };
      });
  }, [galaxy.systems, innerSize, size, knownSystemIds, fogOfWar]);

  const playerPos = useMemo(() => {
    const pSys = galaxy.systems.find(s => s.id === playerSystemId);
    if (!pSys) return null;
    return {
      x: (pSys.pos[0] / bounds) * (innerSize / 2) + (size / 2),
      y: (pSys.pos[2] / bounds) * (innerSize / 2) + (size / 2)
    };
  }, [galaxy.systems, playerSystemId, innerSize, size]);

  const currentPos = useMemo(() => {
    if (!currentSystem) return null;
    return {
      x: (currentSystem.pos[0] / bounds) * (innerSize / 2) + (size / 2),
      y: (currentSystem.pos[2] / bounds) * (innerSize / 2) + (size / 2)
    };
  }, [currentSystem, innerSize, size]);

  if (view === "galaxy") return null;

  return (
    <div className="absolute top-4 left-4 z-40 pointer-events-auto animate-in fade-in zoom-in duration-500">
      <div className="hud-panel hud-corner bg-black/40 backdrop-blur-md border border-primary/20 flex flex-col">
        {/* Header / Toggle */}
        <button 
          onClick={toggle}
          className="flex items-center justify-between gap-3 px-2.5 py-1.5 border-b border-primary/10 hover:bg-primary/5 transition group"
        >
          <div className="flex items-center gap-2">
            <MapIcon size={12} className="text-primary/60 group-hover:text-primary transition-colors" />
            <span className="font-mono-hud text-[8px] text-primary/80 uppercase tracking-[0.2em]">Nav Deck</span>
          </div>
          {isExpanded ? <ChevronUp size={12} className="text-primary/40" /> : <ChevronDown size={12} className="text-primary/40" />}
        </button>

        {isExpanded ? (
          <div className="p-1.5 animate-in slide-in-from-top-1 duration-300">
            <div className="relative" style={{ width: size, height: size }}>
              {/* Galaxy Disk Background */}
              <div className="absolute inset-0 rounded-full bg-primary/5 border border-primary/10 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]" />
              
              <svg width={size} height={size} className="relative z-10">
                {/* System Dots — fog-of-war filtered */}
                {points.map(p => (
                  <circle 
                    key={p.id} 
                    cx={p.x} 
                    cy={p.y} 
                    r={0.6} 
                    className={p.isExplored ? "fill-primary/30" : "fill-primary/10"} 
                  />
                ))}

                {/* Current System Indicator */}
                {currentPos && (
                  <>
                    <circle 
                      cx={currentPos.x} 
                      cy={currentPos.y} 
                      r={3.5} 
                      className="fill-primary/40 animate-pulse" 
                    />
                    <circle 
                      cx={currentPos.x} 
                      cy={currentPos.y} 
                      r={1.5} 
                      className="fill-primary shadow-[0_0_8px_rgba(16,185,129,0.8)]" 
                    />
                  </>
                )}

                {/* Player Position Indicator (if different from viewed system) */}
                {playerPos && playerSystemId !== currentSystem?.id && (
                  <circle 
                    cx={playerPos.x} 
                    cy={playerPos.y} 
                    r={1.5} 
                    className="fill-cyan-400 animate-pulse" 
                  />
                )}
              </svg>

              {/* Compass labels */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[6px] font-mono-hud text-primary/40 uppercase">North</div>
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[6px] font-mono-hud text-primary/40 uppercase">South</div>
            </div>
            
            <div className="mt-1 px-1 flex justify-between items-center">
                <span className="font-mono-hud text-[7px] text-primary/60 uppercase tracking-tighter">Strategic Positioning</span>
                <span className="font-mono-hud text-[7px] text-primary/80 uppercase tracking-tighter">{view} NAV</span>
            </div>
          </div>
        ) : (
          <div className="px-2.5 py-1 text-[7px] font-mono-hud text-primary/40 uppercase tracking-widest italic animate-in fade-in duration-300">
            Navigation Minimized
          </div>
        )}
      </div>
    </div>
  );
}
