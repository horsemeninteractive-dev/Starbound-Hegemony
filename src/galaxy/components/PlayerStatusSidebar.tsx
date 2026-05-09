import React from "react";
import { motion } from "framer-motion";
import { Home, Shield, Flag, ChevronRight, ChevronLeft, MapPin, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerStatusSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  app: any;
  onNavigateMap: (systemId: string, bodyId?: string) => void;
}

export function PlayerStatusSidebar({ isOpen, onToggle, app, onNavigateMap }: PlayerStatusSidebarProps) {
  const { userResidency, userParty, galaxy, bodyGovernance, playerEmpiresFull } = app;

  const residencyBody = userResidency ? galaxy.bodyById[userResidency.bodyId] : null;
  const residencySystem = residencyBody ? galaxy.systemById[residencyBody.systemId] : null;
  
  const empireId = residencyBody ? bodyGovernance[residencyBody.id]?.empireId : null;
  const state = empireId ? playerEmpiresFull.find((e: any) => e.id === empireId) : null;

  return (
    <div className="absolute left-0 top-1/2 -translate-y-1/2 z-30 pointer-events-none">
      <motion.div 
        className="flex items-center h-[500px]"
        initial={false}
        animate={{ x: isOpen ? 0 : -288 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
      >
        {/* Main Panel */}
        <div 
          className={cn(
            "pointer-events-auto shrink-0 w-72 h-full bg-background/90 backdrop-blur-xl border-r border-primary/20 shadow-[10px_0_30px_rgba(0,0,0,0.5)] flex flex-col transition-opacity duration-300",
            isOpen ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="p-4 border-b border-primary/20 bg-primary/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-primary" />
              <h3 className="font-display text-[11px] uppercase tracking-[0.2em] text-foreground text-glow">
                Player Status
              </h3>
            </div>
            <Activity className="w-3 h-3 text-primary/40 animate-pulse" />
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {/* Planet of Residency */}
            <button
              onClick={() => {
                if (residencyBody && residencySystem) {
                  onNavigateMap(residencySystem.id, residencyBody.id);
                }
              }}
              disabled={!residencyBody}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-all duration-300 group relative overflow-hidden",
                "bg-background/20 border-primary/10 hover:border-primary/30 hover:bg-primary/5"
              )}
            >
              <div className="flex items-start gap-3 relative z-10">
                <div className="p-2 rounded bg-background/50 border border-primary/10 text-primary/40 group-hover:text-primary/60">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-display text-[10px] text-foreground uppercase tracking-widest truncate max-w-[120px]">
                    {residencyBody ? residencyBody.name : "None"}
                  </h4>
                  <p className="font-mono-hud text-[8px] text-primary/60">
                    RESIDENCY
                  </p>
                </div>
              </div>
              {residencySystem && (
                <div className="mt-3 pt-3 border-t border-primary/10 space-y-2 relative z-10">
                  <div className="flex items-center gap-2 opacity-80">
                    <span className="font-mono-hud text-[8px] text-muted-foreground uppercase tracking-tighter truncate">
                      {residencySystem.name} System
                    </span>
                  </div>
                </div>
              )}
            </button>

            {/* Political Party */}
            <button
              onClick={() => {
                if (userParty) {
                  app.navigateToPublicParty(userParty.id);
                } else {
                  app.setPage('party');
                }
              }}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-all duration-300 group relative overflow-hidden",
                "bg-background/20 border-primary/10 hover:border-primary/30 hover:bg-primary/5"
              )}
            >
              <div className="flex items-start gap-3 relative z-10">
                <div className="p-2 rounded bg-background/50 border border-primary/10 text-primary/40 group-hover:text-primary/60">
                  <Flag className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-display text-[10px] text-foreground uppercase tracking-widest truncate max-w-[120px]">
                    {userParty ? userParty.name : "None"}
                  </h4>
                  <p className="font-mono-hud text-[8px] text-primary/60">
                    PARTY AFFILIATION
                  </p>
                </div>
              </div>
            </button>

            {/* State */}
            <button
              onClick={() => {
                if (state) {
                  app.navigateToPublicState(state.id);
                }
              }}
              disabled={!state}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-all duration-300 group relative overflow-hidden",
                "bg-background/20 border-primary/10 hover:border-primary/30 hover:bg-primary/5"
              )}
            >
              <div className="flex items-start gap-3 relative z-10">
                <div className="p-2 rounded bg-background/50 border border-primary/10 text-primary/40 group-hover:text-primary/60">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-display text-[10px] text-foreground uppercase tracking-widest truncate max-w-[120px]">
                    {state ? state.name : "Independent"}
                  </h4>
                  <p className="font-mono-hud text-[8px] text-primary/60">
                    STATE
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Toggle Handle */}
        <button
          onClick={onToggle}
          className={cn(
            "pointer-events-auto shrink-0 h-32 w-6 bg-background/80 backdrop-blur-md border border-l-0 border-primary/30 rounded-r-xl flex flex-col items-center justify-center gap-2 text-primary hover:bg-primary/20 transition-all group shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]"
          )}
        >
          {isOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <div className="[writing-mode:vertical-rl] text-[8px] font-mono-hud uppercase tracking-widest rotate-180">
            Player Status
          </div>
        </button>
      </motion.div>
    </div>
  );
}
