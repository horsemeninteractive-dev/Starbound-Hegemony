import { 
  Rocket, 
  Settings, 
  Shield, 
  Zap, 
  Box, 
  ArrowRight,
  Gauge,
  Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FleetsViewProps {
  app: any;
  onPlayClick?: () => void;
}

export function FleetsView({ app, onPlayClick }: FleetsViewProps) {
  const { shipConfig, setPage } = app;

  return (
    <div className="flex-1 bg-background/40 backdrop-blur-sm p-4 sm:p-12 overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-2 duration-500">
      <div className="max-w-6xl mx-auto space-y-12 pb-24">
        {/* Fleet Overview Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 hud-panel p-8 border border-primary/20 bg-primary/5 relative overflow-hidden group">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
              <Rocket size={160} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-5 mb-8">
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl shadow-[0_0_20px_hsl(var(--primary)/0.1)]">
                  <Rocket className="text-primary" size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-display text-white tracking-[0.2em] uppercase text-glow leading-none mb-2">{shipConfig.name || "COMMANDER FLAGSHIP"}</h2>
                  <p className="text-xs font-mono-hud text-muted-foreground uppercase tracking-[0.3em]">Vanguard-Class Tactical Explorer</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-primary/10">
                <div className="space-y-1">
                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Hull Integrity</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(var(--success-rgb),0.5)]" />
                    <span className="text-sm font-mono-hud text-white uppercase tracking-wider">100%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Power Grid</span>
                  <div className="text-sm font-mono-hud text-info uppercase tracking-wider">Stable</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Crew Status</span>
                  <div className="text-sm font-mono-hud text-white uppercase tracking-wider">12 / 12</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">FTL Drives</span>
                  <div className="text-sm font-mono-hud text-warning uppercase tracking-wider">Primed</div>
                </div>
              </div>
            </div>
          </div>

          <div className="hud-panel p-8 border border-info/20 bg-info/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Settings size={14} className="text-info" />
                <h3 className="text-[10px] font-bold text-info uppercase tracking-[0.3em]">Drydock Status</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed italic border-l-2 border-info/30 pl-4 py-1">
                Standard maintenance and hull calibration modules are available. Components can be hot-swapped while in drydock.
              </p>
            </div>
            <Button 
              className="w-full mt-8 bg-info/20 border border-info/40 hover:bg-info/30 text-info font-display text-[10px] uppercase tracking-[0.3em] h-12 shadow-[0_0_20px_rgba(var(--info-rgb),0.2)]"
              onClick={() => { onPlayClick?.(); setPage("shipyard"); }}
            >
              Enter Orbital Drydock
            </Button>
          </div>
        </div>

        {/* Component Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: Shield, label: "Hull", value: shipConfig.hullId, color: "text-primary" },
          { icon: Gauge, label: "Wings", value: shipConfig.wingsId, color: "text-success" },
          { icon: Zap, label: "Engines", value: shipConfig.enginesId, color: "text-warning" },
          { icon: Cpu, label: "Bridge", value: shipConfig.bridgeId, color: "text-info" }
        ].map((comp, idx) => (
          <div key={idx} className="hud-panel p-4 border border-primary/10 bg-primary/5 hover:border-primary/30 transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <comp.icon size={16} className={comp.color} />
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{comp.label}</span>
            </div>
            <div className="text-[11px] font-mono-hud text-white uppercase tracking-wider mb-2">{comp.value}</div>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`h-0.5 flex-1 ${i <= 1 ? 'bg-primary shadow-[0_0_5px_rgba(var(--primary-rgb),0.5)]' : 'bg-primary/10'}`} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Logistics & Cargo */}
      <div className="hud-panel border border-primary/20 bg-black/20 overflow-hidden">
        <div className="px-6 py-4 border-b border-primary/20 bg-primary/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Box size={18} className="text-primary" />
            <h3 className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Logistic Capacity</h3>
          </div>
          <span className="font-mono-hud text-xs text-white">{app.cargoUsed} / {app.cargoCapacity} <span className="text-muted-foreground ml-1">Units</span></span>
        </div>
        <div className="p-6">
          <div className="w-full h-2 bg-primary/10 rounded-full overflow-hidden border border-primary/5 mb-4">
            <div 
              className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)] transition-all duration-500"
              style={{ width: `${(app.cargoUsed / app.cargoCapacity) * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground italic">
            Automated drones are currently managing standard resource distribution. Cargo holds are optimized for bulk storage of Tier 1 materials.
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}
