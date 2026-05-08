import React, { useState, useMemo } from "react";
import {
  Rocket, Box, Hammer, ChevronRight,
  Clock, AlertTriangle, Database,
  Lock, Zap, Package
} from "lucide-react";
import { PageHeader } from "./PageHeader";
import { Button } from "@/components/ui/button";
import { ShipCustomizer } from "./ShipCustomizer";
import { cn } from "@/lib/utils";
import { SHIP_BLUEPRINTS, type ShipBlueprintKey } from "../meta";
import { DEFAULT_SHIP_CONFIG, CLASS_DEFAULTS, type ShipConfiguration } from "../shipPresets";
import type { Installation, SiloInventoryEntry } from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(secs: number): string {
  if (secs >= 3600) return `${Math.round(secs / 3600)}h`;
  return `${Math.round(secs / 60)}m`;
}

function timeRemaining(completesAt: string): string {
  const diff = new Date(completesAt).getTime() - Date.now();
  if (diff <= 0) return "Complete";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function buildProgress(startedAt: string, completesAt: string): number {
  const start = new Date(startedAt).getTime();
  const end   = new Date(completesAt).getTime();
  return Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100));
}

function siloHas(inv: SiloInventoryEntry[], siloId: string, resource: string, qty: number): boolean {
  return (inv.find(s => s.siloId === siloId && s.resourceType === resource)?.amount ?? 0) >= qty;
}

// ─── Blueprint card ───────────────────────────────────────────────────────────

function BlueprintCard({ bpKey, selected, siloInventory, siloId, sc, onClick }: {
  bpKey: ShipBlueprintKey; selected: boolean;
  siloInventory: SiloInventoryEntry[]; siloId: string | null;
  sc: number; onClick: () => void;
}) {
  const bp        = SHIP_BLUEPRINTS[bpKey];
  const hasCredits = sc >= bp.costSC;
  const matsMet   = siloId ? bp.materials.every(m => siloHas(siloInventory, siloId, m.resource, m.qty)) : false;

  return (
    <button onClick={onClick} className={cn(
      "w-full text-left p-4 rounded-xl border transition-all",
      selected
        ? "bg-primary/15 border-primary/50 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]"
        : "bg-background/40 border-primary/10 hover:border-primary/30"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn("p-2.5 rounded-lg border shrink-0 mt-0.5",
          selected ? "bg-primary/20 border-primary/40 text-primary" : "bg-primary/5 border-primary/10 text-muted-foreground"
        )}>
          {bpKey === "freighter" ? <Box size={18} /> : <Rocket size={18} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="font-display text-[11px] uppercase tracking-wider text-foreground truncate">{bp.label}</h4>
            {siloId && (!hasCredits || !matsMet) && <AlertTriangle size={12} className="text-warning/60 shrink-0" />}
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed mb-3">{bp.description}</p>
          <div className="flex gap-4 text-[9px] font-mono-hud">
            <span className={hasCredits ? "text-primary/70" : "text-red-400"}>{bp.costSC.toLocaleString()} SC</span>
            <span className="text-muted-foreground flex items-center gap-1"><Clock size={9} />{formatDuration(bp.buildTimeSecs)}</span>
            <span className="text-info/70 flex items-center gap-1"><Package size={9} />{bp.cargoCapacity.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Shipyard list card ───────────────────────────────────────────────────────

function ShipyardCard({ shipyard, activeQueue, isAtBody, onEnter }: {
  shipyard: Installation; activeQueue: any | null;
  isAtBody: boolean; onEnter: () => void;
}) {
  const progress = activeQueue?.status === 'building'
    ? buildProgress(activeQueue.startedAt, activeQueue.completesAt) : 100;

  return (
    <div className={cn("hud-panel p-5 border transition-all",
      isAtBody ? "border-primary/30 bg-primary/5" : "border-primary/10 bg-background/30"
    )}>
      <div className="flex items-start gap-4 mb-4">
        <div className={cn("p-3 rounded-lg border shrink-0",
          isAtBody ? "bg-primary/15 border-primary/30 text-primary" : "bg-primary/5 border-primary/10 text-muted-foreground"
        )}>
          <Hammer size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display text-[12px] uppercase tracking-wider text-foreground">Orbital Shipyard</h3>
            <span className="text-[8px] font-mono-hud text-primary/60 border border-primary/20 px-1.5 py-0.5 rounded">T{shipyard.tier}</span>
          </div>
          <p className="text-[10px] font-mono-hud text-muted-foreground uppercase tracking-wide">
            {shipyard.bodyId} · {shipyard.systemId}
          </p>
        </div>
        {!isAtBody && (
          <div className="flex items-center gap-1 text-[9px] font-mono-hud text-warning/60 shrink-0">
            <Lock size={10} /><span>Remote</span>
          </div>
        )}
      </div>

      {activeQueue ? (
        <div className="mb-4 p-3 bg-info/5 border border-info/20 rounded-lg">
          <div className="flex justify-between items-center text-[9px] font-mono-hud mb-2">
            <span className="text-info uppercase tracking-wide">
              {activeQueue.status === 'hangared' ? '✓ Build Complete' : `Building: ${activeQueue.vesselName}`}
            </span>
            <span className={activeQueue.status === 'hangared' ? 'text-success' : 'text-muted-foreground'}>
              {activeQueue.status === 'hangared' ? 'Ready for transfer' : timeRemaining(activeQueue.completesAt)}
            </span>
          </div>
          {activeQueue.status === 'building' && (
            <div className="w-full h-1.5 bg-primary/10 rounded-full overflow-hidden">
              <div className="h-full bg-info transition-all duration-1000" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      ) : (
        <p className="text-[9px] font-mono-hud text-muted-foreground/50 uppercase mb-4">No active build — bay available</p>
      )}

      <Button onClick={onEnter} disabled={!isAtBody} className={cn(
        "w-full h-9 text-[10px] font-display uppercase tracking-widest",
        isAtBody
          ? "bg-primary text-black hover:bg-primary/80"
          : "bg-primary/5 border border-primary/10 text-primary/30 cursor-not-allowed"
      )}>
        {isAtBody
          ? <><span>Enter Shipyard</span><ChevronRight size={12} className="ml-2" /></>
          : <><Lock size={11} className="mr-2" /><span>Local Presence Required</span></>}
      </Button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ShipyardView({ app, onPlayClick }: { app: any; onPlayClick?: () => void }) {
  const [view,             setView]             = useState<'list' | 'detail'>('list');
  const [selectedShipyard, setSelectedShipyard] = useState<Installation | null>(null);
  const [selectedBp,       setSelectedBp]       = useState<ShipBlueprintKey>('freighter');
  const [vesselName,       setVesselName]        = useState('');
  const [shipConfig,       setShipConfig]        = useState<ShipConfiguration>(DEFAULT_SHIP_CONFIG);
  const [isCommissioning,  setIsCommissioning]   = useState(false);

  const userFactories:    Installation[]       = app.userFactories ?? [];
  const siloInventory:    SiloInventoryEntry[] = app.siloInventory ?? [];
  const constructionQueue                      = app.constructionQueue ?? [];
  const sc:               number               = app.sc ?? 0;
  const playerBodyId:     string               = app.playerBodyId ?? '';

  const shipyards = useMemo(
    () => userFactories.filter((f: Installation) => f.type === 'Shipyard'),
    [userFactories]
  );

  const siloForBody = (bodyId: string) =>
    userFactories.find((f: Installation) => f.type === 'Resource Silo' && f.bodyId === bodyId) ?? null;

  const activeQueueFor = (shipyardId: string) =>
    constructionQueue.find((q: any) =>
      q.shipyardId === shipyardId && (q.status === 'building' || q.status === 'hangared')
    ) ?? null;

  const handleEnter = (s: Installation) => {
    onPlayClick?.();
    setSelectedShipyard(s);
    setVesselName('');
    setShipConfig(CLASS_DEFAULTS[selectedBp]);
    setView('detail');
  };

  const handleCommission = async () => {
    if (!selectedShipyard || !vesselName.trim()) return;
    const silo = siloForBody(selectedShipyard.bodyId);
    if (!silo) return;
    onPlayClick?.();
    setIsCommissioning(true);
    await app.queueShipBuild(selectedShipyard.id, selectedBp, vesselName.trim(), shipConfig, silo.id);
    setIsCommissioning(false);
    setView('list');
  };

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (shipyards.length === 0) {
    return (
      <div className="flex-1 flex flex-col bg-background/40 backdrop-blur-sm overflow-hidden animate-in fade-in duration-500">
        <PageHeader title="Orbital Shipyard" subtitle="Vessel Commissioning" icon={<Hammer className="w-5 h-5 text-primary" />} onBack={() => app.setPage("map")} />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center mx-auto mb-6">
              <Hammer size={28} className="text-primary/30" />
            </div>
            <h3 className="font-display text-sm uppercase tracking-widest text-foreground mb-3">No Shipyards Detected</h3>
            <p className="text-[11px] font-mono-hud text-muted-foreground leading-relaxed mb-6">
              Build a Resource Silo on a terrestrial body first, then construct a Shipyard from the infrastructure panel.
            </p>
            <Button onClick={() => { onPlayClick?.(); app.setPage("map"); }} className="bg-primary/10 border border-primary/30 text-primary font-display text-[10px] uppercase tracking-widest hover:bg-primary/20">
              Return to Galaxy Map
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div className="flex-1 flex flex-col bg-background/40 backdrop-blur-sm overflow-hidden animate-in fade-in duration-500">
        <PageHeader title="Orbital Shipyard" subtitle="Vessel Commissioning & Hull Synthesis" icon={<Hammer className="w-5 h-5 text-primary" />} onBack={() => app.setPage("map")} />
        <main className="flex-1 p-4 sm:p-10 overflow-y-auto custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-4 pb-24">
            <p className="text-[10px] font-mono-hud text-muted-foreground uppercase tracking-widest mb-6">
              {shipyards.length} shipyard{shipyards.length !== 1 ? 's' : ''} registered — enter one to commission a build
            </p>
            {shipyards.map((s: Installation) => (
              <ShipyardCard key={s.id} shipyard={s} activeQueue={activeQueueFor(s.id)}
                isAtBody={playerBodyId === s.bodyId} onEnter={() => handleEnter(s)} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // ── Detail / build view ──────────────────────────────────────────────────────
  const silo      = selectedShipyard ? siloForBody(selectedShipyard.bodyId) : null;
  const bp        = SHIP_BLUEPRINTS[selectedBp];
  const activeQ   = selectedShipyard ? activeQueueFor(selectedShipyard.id) : null;
  const hasCredits = sc >= bp.costSC;
  const matsMet   = silo ? bp.materials.every(m => siloHas(siloInventory, silo.id, m.resource, m.qty)) : false;
  const queueFree = !activeQ || activeQ.status === 'hangared';
  const canCommission = hasCredits && matsMet && vesselName.trim().length > 0 && queueFree && !!silo;

  const disabledReason = !silo ? "Requires a Resource Silo on this body"
    : !queueFree          ? "Shipyard is busy — wait for current build to complete"
    : !hasCredits         ? `Insufficient credits (need ${bp.costSC.toLocaleString()} SC)`
    : !matsMet            ? "Insufficient materials in silo"
    : !vesselName.trim()  ? "Enter a vessel designation"
    : null;

  return (
    <div className="flex-1 flex flex-col bg-background/40 backdrop-blur-sm overflow-hidden animate-in fade-in duration-500">
      <PageHeader title="Commission Vessel" subtitle={`Orbital Shipyard · Tier ${selectedShipyard?.tier ?? 1}`}
        icon={<Hammer className="w-5 h-5 text-primary" />} onBack={() => setView('list')} backLabel="Back to Shipyards" />

      <main className="flex-1 p-4 sm:p-8 overflow-y-auto custom-scrollbar">
        <div className="max-w-3xl mx-auto space-y-8 pb-24">

          {/* TOP SECTION: Blueprint & Status */}
          <div className="space-y-6">
            {/* Silo status */}
            <div className={cn("p-4 rounded-xl border",
              silo ? "bg-success/5 border-success/20" : "bg-warning/5 border-warning/20"
            )}>
              <div className="flex items-center gap-3 mb-3">
                <Database size={14} className={silo ? "text-success" : "text-warning"} />
                <h3 className="font-display text-[10px] uppercase tracking-widest">
                  {silo ? "Resource Silo Connected" : "No Resource Silo Found"}
                </h3>
              </div>
              {silo ? (
                <div className="space-y-1.5">
                  {bp.materials.map(m => {
                    const have   = siloInventory.find(s => s.siloId === silo.id && s.resourceType === m.resource)?.amount ?? 0;
                    const enough = have >= m.qty;
                    return (
                      <div key={m.resource} className="flex justify-between items-center text-[10px] font-mono-hud">
                        <span className="text-muted-foreground">{m.resource}</span>
                        <span className={enough ? "text-success" : "text-red-400"}>
                          {have.toLocaleString()} / {m.qty} {enough ? "✓" : "✗"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[10px] text-warning/80 font-mono-hud">
                  Build a Resource Silo on this body first. Materials are drawn from the silo, not your cargo hold.
                </p>
              )}
            </div>

            {/* Blueprints */}
            <div>
              <h3 className="font-display text-[10px] uppercase tracking-widest text-primary/60 mb-3">Select Blueprint</h3>
              <div className="space-y-3">
                {(Object.keys(SHIP_BLUEPRINTS) as ShipBlueprintKey[]).map(key => (
                  <BlueprintCard key={key} bpKey={key} selected={selectedBp === key}
                    siloInventory={siloInventory} siloId={silo?.id ?? null} sc={sc}
                    onClick={() => { 
                      onPlayClick?.(); 
                      setSelectedBp(key); 
                      setShipConfig({ ...CLASS_DEFAULTS[key], name: vesselName || CLASS_DEFAULTS[key].name });
                    }} />
                ))}
                {/* Corvette — locked */}
                <div className="w-full p-4 rounded-xl border border-primary/5 bg-background/20 opacity-40 cursor-not-allowed">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg border bg-primary/5 border-primary/5 text-muted-foreground/30">
                      <Zap size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-display text-[11px] uppercase tracking-wider text-muted-foreground/40">Ironclad Corvette</h4>
                        <span className="text-[8px] font-mono-hud text-warning/50 border border-warning/20 px-1.5 py-0.5 rounded">WARFARE UPDATE</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground/30">Available when the warfare system is deployed.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-background/40 border border-primary/10 rounded-xl text-[10px] font-mono-hud space-y-2">
              <h3 className="font-display text-[10px] uppercase tracking-widest text-primary/60 mb-3">Commission Summary</h3>
              <div className="flex justify-between"><span className="text-muted-foreground">Credits</span><span className={hasCredits ? "text-success" : "text-red-400"}>{bp.costSC.toLocaleString()} SC</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Build time</span><span className="text-foreground">{formatDuration(bp.buildTimeSecs)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Cargo capacity</span><span className="text-info">{bp.cargoCapacity.toLocaleString()} units</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Hangar slot</span><span className={queueFree ? "text-success" : "text-warning"}>{queueFree ? "Available" : "Occupied"}</span></div>
            </div>
          </div>

          {/* BOTTOM SECTION: Customizer */}
          <div className="space-y-6 pt-8 border-t border-primary/10">
            <div>
              <h3 className="font-display text-[11px] uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
                <Rocket size={14} /> Hull Synthesis & Design
              </h3>
              <label className="font-mono-hud text-[9px] uppercase tracking-widest text-primary/60 block mb-2">Vessel Designation</label>
              <input type="text" value={vesselName} onChange={e => setVesselName(e.target.value)}
                placeholder="Enter vessel name..." maxLength={32}
                className="w-full bg-background/60 border border-primary/20 focus:border-primary/50 px-4 py-2.5 font-display text-sm uppercase tracking-widest text-primary outline-none transition-all placeholder:text-primary/20 rounded-lg" />
            </div>

            <div className="bg-background/40 border border-primary/10 rounded-xl overflow-hidden min-h-[400px]">
              <ShipCustomizer 
                config={shipConfig} 
                onChange={setShipConfig} 
                playClick={onPlayClick ?? (() => {})} 
                shipClass={selectedBp}
                hideClassSelector={true}
              />
            </div>

            <div className="pt-4">
              {disabledReason && (
                <div className="flex items-center gap-2 text-[9px] font-mono-hud text-warning/70 mb-3 bg-warning/5 p-2 rounded border border-warning/10">
                  <AlertTriangle size={11} /><span>{disabledReason}</span>
                </div>
              )}
              <Button onClick={handleCommission} disabled={!canCommission || isCommissioning}
                className={cn("w-full h-14 font-display text-[11px] uppercase tracking-[0.2em] transition-all",
                  canCommission
                    ? "bg-primary text-black hover:bg-primary/80 shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)]"
                    : "bg-primary/5 border border-primary/10 text-primary/30 cursor-not-allowed"
                )}>
                {isCommissioning ? "Initiating hull synthesis..." : <><Hammer size={16} className="mr-3" />Commission {bp.label}</>}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
