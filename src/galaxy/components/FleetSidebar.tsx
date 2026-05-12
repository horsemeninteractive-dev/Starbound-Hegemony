import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Box, Shield, Zap, Target, ChevronLeft, ChevronRight, Activity, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FleetInfo {
  id: string;
  name: string;
  vesselClass: "commander" | "freighter" | "corvette" | "science";
  systemName: string;
  bodyName?: string;
  status: string;
  isSelected?: boolean;
  travel?: { targetId?: string; endTime: number; startTime: number; type?: "inter" | "intra" } | null;
  arrival?: { fromId: string; startTime: number; duration: number } | null;
  destinationName?: string | null;
}

interface FleetSidebarProps {
  fleets: FleetInfo[];
  selectedFleetId: string | null;
  onSelectFleet: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onRenameFleet?: (id: string, newName: string) => void;
  currentTime: number;
}

export function FleetSidebar({ fleets, selectedFleetId, onSelectFleet, isOpen, onToggle, onRenameFleet, currentTime }: FleetSidebarProps) {
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [newName, setNewName] = React.useState("");
  return (
    <div className="absolute right-0 top-1/2 -translate-y-1/2 z-30 pointer-events-none">
      <motion.div 
        className="flex items-center h-[500px]"
        initial={false}
        animate={{ x: isOpen ? 0 : 288 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
      >
      {/* Toggle Handle */}
      <button
        onClick={onToggle}
        className={cn(
          "pointer-events-auto shrink-0 h-32 w-6 bg-background/80 backdrop-blur-md border border-r-0 border-primary/30 rounded-l-xl flex flex-col items-center justify-center gap-2 text-primary hover:bg-primary/20 transition-all group shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]"
        )}
      >
        <div className="[writing-mode:vertical-lr] text-[8px] font-mono-hud uppercase tracking-widest">
          Fleet Registry
        </div>
        {isOpen ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Main Panel */}
      <div 
        className={cn(
          "pointer-events-auto shrink-0 w-72 h-full bg-background/90 backdrop-blur-xl border-l border-primary/20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] flex flex-col transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
      >
            <div className="p-4 border-b border-primary/20 bg-primary/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-primary" />
                <h3 className="font-display text-[11px] uppercase tracking-[0.2em] text-foreground text-glow">
                  Interstellar Command
                </h3>
              </div>
              <Activity className="w-3 h-3 text-primary/40 animate-pulse" />
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {fleets.map((fleet) => (
                <button
                  key={fleet.id}
                  onClick={() => onSelectFleet(fleet.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-all duration-300 group relative overflow-hidden",
                    selectedFleetId === fleet.id
                      ? "bg-primary/15 border-primary/40 shadow-[0_0_15px_rgba(var(--primary-rgb),0.15)]"
                      : "bg-background/20 border-primary/10 hover:border-primary/30 hover:bg-primary/5"
                  )}
                >
                  {/* Selection Indicator */}
                  {selectedFleetId === fleet.id && (
                    <motion.div
                      layoutId="fleet-active-glow"
                      className="absolute inset-0 bg-primary/5 pointer-events-none"
                    />
                  )}
                  
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded bg-background/50 border",
                        selectedFleetId === fleet.id ? "border-primary/50 text-primary" : "border-primary/10 text-primary/40 group-hover:text-primary/60"
                      )}>
                        {fleet.vesselClass === "commander" ? <Shield className="w-4 h-4" /> : 
                         fleet.vesselClass === "freighter" ? <Box className="w-4 h-4" /> : 
                         fleet.vesselClass === "science" ? <Rocket className="w-4 h-4" /> :
                         <Activity className="w-4 h-4" />}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 group/name">
                          {renamingId === fleet.id ? (
                            <input
                              autoFocus
                              className="bg-background/80 border border-primary/30 rounded px-1 py-0 text-[10px] font-display uppercase tracking-widest text-foreground outline-none focus:border-primary w-24"
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              onBlur={() => {
                                if (onRenameFleet && newName && newName !== fleet.name) {
                                  onRenameFleet(fleet.id, newName);
                                }
                                setRenamingId(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  if (onRenameFleet && newName && newName !== fleet.name) {
                                    onRenameFleet(fleet.id, newName);
                                  }
                                  setRenamingId(null);
                                } else if (e.key === "Escape") {
                                  setRenamingId(null);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <>
                              <h4 className="font-display text-[10px] text-foreground uppercase tracking-widest truncate max-w-[120px]">
                                {fleet.name}
                              </h4>
                              {selectedFleetId === fleet.id && onRenameFleet && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRenamingId(fleet.id);
                                    setNewName(fleet.name);
                                  }}
                                  className="opacity-0 group-hover/name:opacity-100 p-0.5 hover:text-primary transition-all"
                                >
                                  <Pencil size={8} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                        <p className="font-mono-hud text-[8px] text-primary/60">
                          {fleet.vesselClass.toUpperCase()} CLASS
                        </p>
                      </div>
                    </div>
                    {selectedFleetId === fleet.id && (
                      <span className="text-[7px] font-mono-hud text-primary bg-primary/20 px-1.5 py-0.5 rounded border border-primary/30">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-primary/10 space-y-2 relative z-10">
                    <div className="flex items-center gap-2 opacity-80">
                      <Target className="w-3 h-3 text-primary/60" />
                      <span className="font-mono-hud text-[8px] text-muted-foreground uppercase tracking-tighter truncate">
                        {fleet.travel ? `${fleet.travel.type === "intra" ? "SLT" : "FTL"} → ${fleet.destinationName}` : fleet.arrival ? `TRANSIT → STAR` : `${fleet.systemName}${fleet.bodyName ? ` • ${fleet.bodyName}` : ""}`}
                      </span>
                    </div>

                    {(fleet.travel || fleet.arrival) ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[7px] font-mono-hud text-cyan-400 uppercase tracking-widest animate-pulse">
                            {fleet.travel ? "Warping..." : "Landing..."}
                          </span>
                          <span className="text-[7px] font-mono-hud text-cyan-400 font-bold uppercase tracking-widest">
                            {fleet.travel ? `ETA ${Math.max(0, Math.ceil((fleet.travel.endTime - currentTime) / 1000))}S` : "EST. CONTACT"}
                          </span>
                        </div>
                        <div className="h-1 bg-cyan-950/50 rounded-full overflow-hidden w-full border border-cyan-500/10">
                          <div 
                            className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_8px_cyan]"
                            style={{ 
                              width: fleet.travel 
                                ? `${Math.min(100, ((currentTime - fleet.travel.startTime) / (fleet.travel.endTime - fleet.travel.startTime)) * 100)}%`
                                : `${Math.min(100, ((currentTime - fleet.arrival!.startTime) / fleet.arrival!.duration) * 100)}%`,
                              transition: "width 0.1s linear"
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Zap className="w-3 h-3 text-warning/60" />
                        <span className="font-mono-hud text-[8px] text-muted-foreground uppercase tracking-tighter">
                            Status: <span className="text-foreground">{fleet.status}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              ))}

              {fleets.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground/30 border border-dashed border-primary/10 rounded-lg">
                  <Rocket className="w-8 h-8 mb-2 opacity-10" />
                  <p className="font-mono-hud text-[8px] uppercase tracking-widest text-center">
                    No active vessels detected<br/>in subspace network
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-primary/5 border-t border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono-hud text-[8px] text-primary/60 uppercase">Fleet Capacity</span>
                <span className="font-mono-hud text-[8px] text-foreground">{fleets.length} / 12</span>
              </div>
              <div className="w-full h-1 bg-primary/10 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-primary shadow-[0_0_5px_rgba(var(--primary-rgb),1)] transition-all duration-1000" 
                    style={{ width: `${(fleets.length / 12) * 100}%` }}
                />
              </div>
            </div>
      </div>
      </motion.div>
    </div>
  );
}
