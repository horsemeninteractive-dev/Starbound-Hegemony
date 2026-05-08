import { 
  Building2, 
  MapPin, 
  Package, 
  ArrowUp, 
  Settings, 
  Factory,
  Database,
  ArrowRight,
  Lock,
  ChevronLeft
} from "lucide-react";
import { GalaxyIcon } from "./ResourceIcon";
import { useState, useMemo } from "react";
import { Installation, UserResource } from "../types";
import { RESOURCE_META, INFRA_META } from "../meta";
import { Button } from "@/components/ui/button";
import { PageHeader } from "./PageHeader";

interface FactoriesViewProps {
  app: any;
  onPlayClick?: () => void;
}



function FactoryRow({ f, galaxy, playerSystemId, playerBodyId, onCollect, onUpgrade, onUpgradeInfrastructure, updateFactorySettings, depositToFactoryTreasury, userResources, onPlayClick }: any) {
  const isInfrastructure = f.resourceType === 'Structure';
  const rMeta = isInfrastructure 
    ? Object.values(INFRA_META).find(m => m.type === f.type)
    : (RESOURCE_META as any)[f.resourceType];
    
  const system = galaxy.systemById[f.systemId];
  const body = system?.bodies.find((b: any) => b.id === f.bodyId) || (f.bodyId === "star" ? { name: system?.name } : null);

  const isAtLocation = playerSystemId === f.systemId && playerBodyId === f.bodyId;

  const [showSettings, setShowSettings] = useState(false);
  const [wageInput, setWageInput] = useState(String(f.wage));
  const [jobsInput, setJobsInput] = useState(String(f.jobsAvailable));
  const [depositInput, setDepositInput] = useState("");

  const STORAGE_CAPACITY = [100, 300, 750, 2000, 5000];
  const storageCapacity = f.storageCapacity ?? STORAGE_CAPACITY[Math.min(f.storageTier ?? 0, 4)];
  const storagePct = storageCapacity > 0 ? Math.min(100, (f.storage / storageCapacity) * 100) : 0;
  const [showUpgrades, setShowUpgrades] = useState(false);

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
                {isInfrastructure && <div className="px-1 py-0.5 rounded-sm bg-info/10 border border-info/20 text-[7px] font-bold text-info uppercase tracking-tighter">Level {f.tier} Infrastructure</div>}
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
            <div className="text-[8px] text-muted-foreground uppercase mt-1 mb-1">Occupancy: {(f.maxJobs || 5) - f.jobsAvailable} / {f.maxJobs || 5}</div>
            {f.treasury < f.wage && (
              <div className="inline-block px-1.5 py-0.5 bg-destructive/10 border border-destructive/20 rounded text-[8px] font-bold text-destructive uppercase tracking-widest">
                Underfunded
              </div>
            )}
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
          {!isInfrastructure && (
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
          )}
          {isInfrastructure && (
             <Button 
               variant="outline" 
               size="sm" 
               className={`flex-1 h-8 text-[10px] border-info/20 text-info transition-all ${isAtLocation ? 'hover:bg-info/10' : 'opacity-40 cursor-not-allowed'}`}
               disabled={!isAtLocation}
               onClick={() => { onPlayClick?.(); setShowUpgrades(!showUpgrades); setShowSettings(false); }}
             >
               <ArrowUp size={12} className="mr-2" />
               Upgrade Facility
             </Button>
          )}
          {!isInfrastructure && (
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
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className={`h-8 w-8 p-0 border-primary/20 transition-all ${showSettings ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-primary/10'}`}
            onClick={() => { setShowSettings(!showSettings); setShowUpgrades(false); }}
            title="Factory Settings"
          >
            <Settings size={12} />
          </Button>
        </div>

        {/* Upgrade Details (for Infrastructure) */}
        {showUpgrades && isInfrastructure && (
          <div className="animate-in slide-in-from-top-2 duration-300 p-3 bg-info/5 border border-info/20 rounded-md space-y-3">
             {(() => {
                const infraKey = Object.keys(INFRA_META).find(k => (INFRA_META as any)[k].type === f.type) as keyof typeof INFRA_META;
                if (!infraKey) return null;
                const meta = (INFRA_META as any)[infraKey];
                const currentTier = f.tier || 1;
                const nextTierConfig = meta.tiers[currentTier]; 

                if (!nextTierConfig) return <div className="text-[10px] text-success italic font-mono-hud text-center py-2">Maximum persistent efficiency reached.</div>;

                return (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] text-white uppercase tracking-wider font-bold">
                       <span>Target: Tier {currentTier + 1}</span>
                       <span className="text-info">{nextTierConfig.costSC.toLocaleString()} SC</span>
                    </div>
                    
                    <div className="p-2 bg-black/40 rounded border border-info/10">
                       <div className="text-[8px] text-muted-foreground uppercase font-bold mb-1">Required Components:</div>
                       <div className="grid grid-cols-2 gap-2">
                          {nextTierConfig.mats.map((m: any) => {
                             const has = userResources.find((ur: any) => ur.resourceType === m.resource)?.amount || 0;
                             return (
                               <div key={m.resource} className={`text-[9px] font-mono-hud flex justify-between ${has >= m.qty ? 'text-success' : 'text-destructive'}`}>
                                 <span>{m.resource}</span>
                                 <span>{has}/{m.qty}</span>
                               </div>
                             );
                          })}
                       </div>
                    </div>

                    <Button 
                      className="w-full h-8 bg-info hover:bg-info/80 text-background font-bold text-[10px] uppercase tracking-widest"
                      onClick={() => {
                        onPlayClick?.();
                        onUpgradeInfrastructure(f.id);
                        setShowUpgrades(false);
                      }}
                    >
                      Authorize Upgrade
                    </Button>
                  </div>
                );
             })()}
          </div>
        )}

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
              }}
            >
              Update Directives
            </Button>
            
            <div className="pt-2 border-t border-primary/20 space-y-2 mt-2">
              <div className="flex justify-between items-center text-[9px]">
                <span className="text-muted-foreground uppercase tracking-widest font-bold">Treasury Balance</span>
                <span className="font-mono-hud text-white">{f.treasury} SC</span>
              </div>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="Amount"
                  value={depositInput} 
                  onChange={(e) => setDepositInput(e.target.value)}
                  className="flex-1 bg-black/60 border border-primary/20 rounded px-2 py-1 text-xs text-white focus:border-primary outline-none"
                />
                <Button 
                  variant="outline"
                  className="h-7 text-[9px] uppercase tracking-widest font-bold" 
                  onClick={() => {
                    onPlayClick?.();
                    const amt = Number(depositInput);
                    if (amt > 0) {
                      depositToFactoryTreasury(f.id, amt);
                      setDepositInput("");
                    }
                  }}
                >
                  Deposit
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function FactoriesView({ app, onPlayClick }: FactoriesViewProps) {
  const { userFactories, galaxy, collectFactory, upgradeFactory, upgradeInfrastructure, updateFactorySettings, depositToFactoryTreasury, user, playerSystemId, playerBodyId, userResources } = app;
  const userId = user?.id;
  const onCollect = collectFactory;
  const onUpgrade = upgradeFactory;
  const onUpgradeInfrastructure = upgradeInfrastructure;
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
    <div className="flex-1 flex flex-col bg-background/40 backdrop-blur-sm animate-fade-in overflow-hidden">
      <PageHeader 
        title="Industrial Complex"
        subtitle="Production & Supply Chain Management"
        icon={<Building2 />}
        onBack={() => app.setPage("map")}
      />

      <main className="flex-1 p-4 sm:p-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-12 pb-24">
          {/* Summary Banner */}
          <div className="relative p-8 hud-panel border border-primary/20 bg-primary/5 overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.05),transparent)] pointer-events-none" />
            <div className="absolute -top-24 -right-24 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
              <Factory size={320} />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-6 pt-4 border-t border-primary/10">
                  <div className="space-y-1">
                      <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Global Efficiency</span>
                      <div className="text-sm font-mono-hud text-white">94.2% <span className="text-success text-[10px] ml-1">▲</span></div>
                  </div>
                  <div className="space-y-1">
                      <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Active Workforce</span>
                      <div className="text-sm font-mono-hud text-white">{userFactories.reduce((acc, f) => acc + ((f.maxJobs || 5) - f.jobsAvailable), 0)} / {userFactories.reduce((acc, f) => acc + (f.maxJobs || 5), 0)}</div>
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
              onUpgradeInfrastructure={onUpgradeInfrastructure}
              updateFactorySettings={updateFactorySettings}
              depositToFactoryTreasury={depositToFactoryTreasury}
              userResources={userResources}
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
    </main>
  </div>
);
}
