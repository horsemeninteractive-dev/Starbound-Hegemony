import { 
  Building2, 
  MapPin, 
  Package, 
  ArrowUp, 
  Settings, 
  Factory,
  Database,
  ArrowRight,
  Lock
} from "lucide-react";
import { GalaxyIcon } from "./ResourceIcon";
import { useState, useMemo } from "react";
import { Installation } from "../types";
import { RESOURCE_META } from "../meta";
import { Button } from "@/components/ui/button";

interface FactoriesViewProps {
  app: any;
  onPlayClick?: () => void;
}



function FactoryRow({ f, galaxy, playerSystemId, playerBodyId, onCollect, onUpgrade, updateFactorySettings, onPlayClick }: any) {
  const rMeta = (RESOURCE_META as any)[f.resourceType];
  const system = galaxy.systemById[f.systemId];
  const body = system?.bodies.find((b: any) => b.id === f.bodyId) || (f.bodyId === "star" ? { name: system?.name } : null);

  const isAtLocation = playerSystemId === f.systemId && playerBodyId === f.bodyId;

  const [showSettings, setShowSettings] = useState(false);
  const [wageInput, setWageInput] = useState(String(f.wage));
  const [jobsInput, setJobsInput] = useState(String(f.jobsAvailable));

  const STORAGE_CAPACITY = [100, 300, 750, 2000, 5000];
  const storageCapacity = f.storageCapacity ?? STORAGE_CAPACITY[Math.min(f.storageTier ?? 0, 4)];
  const storagePct = storageCapacity > 0 ? Math.min(100, (f.storage / storageCapacity) * 100) : 0;

  return (
    <div className="hud-panel border border-primary/20 bg-primary/5 overflow-hidden group">
      <div className="p-4 border-b border-primary/10 bg-primary/5">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className={`p-2 border rounded ${isAtLocation ? 'bg-primary/10 border-primary/20 shadow-[0_0_10px_rgba(var(--primary-rgb),0.1)]' : 'bg-muted/10 border-muted/20 opacity-50'}`} style={isAtLocation ? { color: rMeta?.color } : undefined}>
              <GalaxyIcon name={rMeta?.icon} className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="text-xs font-bold text-white uppercase tracking-wider">{rMeta?.label || f.type}</div>
                {!isAtLocation && (
                  <div className="px-1.5 py-0.5 rounded-sm bg-destructive/10 border border-destructive/20 flex items-center gap-1">
                    <Lock size={8} className="text-destructive" />
                    <span className="text-[7px] font-bold text-destructive uppercase tracking-tighter">Remote Access Restricted</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground uppercase mt-1">
                <MapPin size={10} />
                <span>{system?.name}</span>
                <ArrowRight size={8} />
                <span className="text-primary/60">{body?.name || "Unknown Location"}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-success uppercase">{f.wage} SC / Shift</div>
            <div className="text-[8px] text-muted-foreground uppercase mt-1">{f.jobsAvailable} Open Positions</div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Storage Bar */}
        <div>
          <div className="flex justify-between items-end mb-1.5">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
              <Package size={10} /> Storage Utilization
            </span>
            <span className="text-[10px] font-mono-hud text-white">{f.storage} / {storageCapacity} <span className="text-primary/60 ml-1">({Math.floor(storagePct)}%)</span></span>
          </div>
          <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden border border-primary/5">
            <div 
              className={`h-full transition-all duration-500 ${storagePct > 90 ? 'bg-destructive shadow-[0_0_8px_rgba(var(--destructive-rgb),0.5)]' : 'bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]'}`}
              style={{ width: `${storagePct}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className={`flex-1 h-8 text-[10px] border-primary/20 transition-all ${isAtLocation ? 'hover:bg-primary/10' : 'opacity-40 cursor-not-allowed'}`}
            disabled={f.storage === 0 || !isAtLocation}
            onClick={() => { onPlayClick?.(); onCollect(f.id); }}
          >
            {isAtLocation ? <Package size={12} className="mr-2" /> : <Lock size={12} className="mr-2" />}
            {isAtLocation ? "Collect All" : "Local Presence Required"}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className={`h-8 w-8 p-0 border-info/20 text-info transition-all ${isAtLocation ? 'hover:bg-info/10' : 'opacity-40 cursor-not-allowed'}`}
            disabled={!isAtLocation}
            onClick={() => { onPlayClick?.(); onUpgrade(f.id, 'storage'); }}
            title={isAtLocation ? "Upgrade Capacity" : "Upgrade requires local presence"}
          >
            <ArrowUp size={12} />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className={`h-8 w-8 p-0 border-primary/20 transition-all ${showSettings ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-primary/10'}`}
            onClick={() => setShowSettings(!showSettings)}
            title="Factory Settings"
          >
            <Settings size={12} />
          </Button>
        </div>

        {/* Inline Settings */}
        {showSettings && (
          <div className="animate-in slide-in-from-top-2 duration-300 p-3 bg-black/40 border border-primary/20 rounded-md space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Wage (SC)</label>
                <input 
                  type="number" 
                  value={wageInput} 
                  onChange={(e) => setWageInput(e.target.value)}
                  className="w-full bg-black/60 border border-primary/20 rounded px-2 py-1 text-xs text-white focus:border-primary outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Jobs</label>
                <input 
                  type="number" 
                  value={jobsInput} 
                  onChange={(e) => setJobsInput(e.target.value)}
                  className="w-full bg-black/60 border border-primary/20 rounded px-2 py-1 text-xs text-white focus:border-primary outline-none"
                />
              </div>
            </div>
            <Button 
              className="w-full h-7 text-[9px] uppercase tracking-widest font-bold" 
              onClick={() => {
                onPlayClick?.();
                updateFactorySettings(f.id, Number(wageInput), Number(jobsInput));
                setShowSettings(false);
              }}
            >
              Update Directives
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function FactoriesView({ app, onPlayClick }: FactoriesViewProps) {
  const { userFactories, galaxy, collectFactory, upgradeFactory, updateFactorySettings, user, playerSystemId, playerBodyId } = app;
  const userId = user?.id;
  const onCollect = collectFactory;
  const onUpgrade = upgradeFactory;
  const [filter, setFilter] = useState<string>("all");

  const resourceTypes = useMemo(() => {
    const types = new Set<string>();
    userFactories.forEach((f: Installation) => types.add(f.resourceType));
    return Array.from(types);
  }, [userFactories]);

  const filteredFactories = useMemo(() => {
    if (filter === "all") return userFactories;
    return userFactories.filter((f: Installation) => f.resourceType === filter);
  }, [userFactories, filter]);

  const stats = useMemo(() => {
    return {
      count: userFactories.length,
      totalStorage: userFactories.reduce((acc: number, f: Installation) => acc + (f.storage || 0), 0),
      byType: userFactories.reduce((acc: any, f: Installation) => {
        acc[f.resourceType] = (acc[f.resourceType] || 0) + 1;
        return acc;
      }, {})
    };
  }, [userFactories]);

  return (
    <div className="flex-1 bg-background/40 backdrop-blur-sm p-4 sm:p-12 overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-2 duration-500">
      <div className="max-w-6xl mx-auto space-y-12 pb-24">
        {/* Header with Background Pattern */}
        <div className="relative p-8 hud-panel border border-primary/20 bg-primary/5 overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.05),transparent)] pointer-events-none" />
          <div className="absolute -top-24 -right-24 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
            <Factory size={320} />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl shadow-[0_0_20px_hsl(var(--primary)/0.1)]">
                  <Building2 size={32} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-3xl font-display text-white tracking-[0.2em] uppercase text-glow leading-none mb-2">Industrial Complex</h2>
                  <p className="text-xs font-mono-hud text-muted-foreground uppercase tracking-[0.3em]">Production & Supply Chain Management</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-6 pt-4 border-t border-primary/10">
                <div className="space-y-1">
                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Global Efficiency</span>
                    <div className="text-sm font-mono-hud text-white">94.2% <span className="text-success text-[10px] ml-1">▲</span></div>
                </div>
                <div className="space-y-1">
                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Active Workforce</span>
                    <div className="text-sm font-mono-hud text-white">{userFactories.reduce((acc, f) => acc + (5 - f.jobsAvailable), 0)} / {userFactories.length * 5}</div>
                </div>
                <div className="space-y-1">
                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">System Coverage</span>
                    <div className="text-sm font-mono-hud text-white">{new Set(userFactories.map(f => f.systemId)).size} Sectors</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 shrink-0">
              <div className="hud-panel p-4 border border-success/20 bg-success/5 min-w-[140px]">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="text-success" size={14} />
                  <span className="text-[9px] font-bold text-success uppercase tracking-widest">Stockpile</span>
                </div>
                <div className="text-2xl font-display text-white">{stats.totalStorage}</div>
                <div className="text-[7px] text-muted-foreground uppercase tracking-tighter">Units available</div>
              </div>
              <div className="hud-panel p-4 border border-info/20 bg-info/5 min-w-[140px]">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="text-info" size={14} />
                  <span className="text-[9px] font-bold text-info uppercase tracking-widest">Portfolio</span>
                </div>
                <div className="text-2xl font-display text-white">{stats.count}</div>
                <div className="text-[7px] text-muted-foreground uppercase tracking-tighter">Active lines</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar with Glow Effect */}
        <div className="flex items-center gap-4 bg-primary/5 p-2 border border-primary/10 rounded-lg backdrop-blur-md sticky top-0 z-20">
          <span className="text-[9px] font-bold text-primary/40 uppercase tracking-[0.2em] ml-2 shrink-0">Filter Inventory:</span>
          <div className="flex gap-1 overflow-x-auto no-scrollbar py-1">
            <button 
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all border shrink-0 ${filter === "all" ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]" : "bg-black/40 text-muted-foreground border-primary/10 hover:border-primary/30"}`}
            >
              All Facilities
            </button>
            {resourceTypes.map(type => (
              <button 
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all border shrink-0 ${filter === type ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]" : "bg-black/40 text-muted-foreground border-primary/10 hover:border-primary/30"}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Factory List with Enhanced Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredFactories.length > 0 ? (
          filteredFactories.map((f: Installation) => (
            <FactoryRow 
              key={f.id} 
              f={f} 
              galaxy={galaxy} 
              playerSystemId={playerSystemId}
              playerBodyId={playerBodyId}
              onCollect={onCollect}
              onUpgrade={onUpgrade}
              updateFactorySettings={updateFactorySettings}
              onPlayClick={onPlayClick}
            />
          ))
        ) : (
          <div className="col-span-full py-20 text-center hud-panel border border-dashed border-primary/20 rounded-lg bg-primary/5">
            <Building2 size={48} className="mx-auto text-primary/20 mb-4" />
            <p className="text-primary/40 uppercase tracking-widest text-sm font-bold">No industrial facilities detected</p>
            <p className="text-muted-foreground text-[10px] uppercase tracking-widest mt-2 italic">Select a resource deposit on any planet to begin construction.</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
