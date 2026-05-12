import React, { useState, useMemo } from "react";
import {
  Rocket, Anchor, Ship, Hammer, ArrowRight,
  AlertTriangle, CheckCircle2, Clock, Package,
  ChevronRight, Trash2, Plus, Users, MapPin, Palette, X, Pencil
} from "lucide-react";
import { PageHeader } from "./PageHeader";
import { Button } from "@/components/ui/button";
import { ShipCustomizer } from "./ShipCustomizer";
import { cn } from "@/lib/utils";
import type { FleetEntity, ConstructionQueueEntry, Vessel } from "../types";
import type { ShipConfiguration } from "../shipPresets";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const CLASS_LABELS: Record<string, string> = {
  commander: "Commander Ship",
  freighter: "Atlas-Class Freighter",
  science:   "Veil-Class Survey Vessel",
  corvette:  "Ironclad Corvette",
};

const CLASS_ICON: Record<string, React.ReactNode> = {
  freighter: <Package size={16} />,
  science:   <Rocket   size={16} />,
  corvette:  <Ship     size={16} />,
};

// ─── Active fleet card ────────────────────────────────────────────────────────

function FleetCard({ fleet, vessels, commanderId, onDisband, onPlayClick, onRefit, onRename }: {
  fleet:       FleetEntity;
  vessels:     Vessel[];
  commanderId: string;
  onDisband:   (id: string) => void;
  onPlayClick: () => void;
  onRefit:     (v: Vessel) => void;
  onRename:    (id: string, name: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(fleet.name);
  const fleetVessels = vessels.filter(v => fleet.vesselIds.includes(v.id));

  return (
    <div className="hud-panel border border-primary/20 bg-primary/5 p-4 rounded-xl">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/15 border border-primary/30 text-primary">
            <Ship size={18} />
          </div>
          <div>
            {isRenaming ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onRename(fleet.id, newName);
                      setIsRenaming(false);
                    } else if (e.key === 'Escape') {
                      setIsRenaming(false);
                      setNewName(fleet.name);
                    }
                  }}
                  className="bg-background/80 border border-primary/30 rounded px-1.5 py-0.5 text-[11px] font-display uppercase tracking-wider text-foreground focus:outline-none focus:border-primary w-32"
                />
                <button 
                  onClick={() => { onRename(fleet.id, newName); setIsRenaming(false); }}
                  className="text-success hover:text-success/80 p-0.5"
                >
                  <CheckCircle2 size={12} />
                </button>
                <button 
                  onClick={() => setIsRenaming(false)}
                  className="text-error hover:text-error/80 p-0.5"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group/title">
                <h3 className="font-display text-[12px] uppercase tracking-wider text-foreground">{fleet.name}</h3>
                <button 
                  onClick={() => setIsRenaming(true)}
                  className="opacity-0 group-hover/title:opacity-100 p-0.5 hover:text-primary transition-all text-muted-foreground"
                >
                  <Pencil size={10} />
                </button>
              </div>
            )}
            <p className="text-[9px] font-mono-hud text-muted-foreground uppercase">
              {fleet.systemId} · {fleetVessels.length} vessel{fleetVessels.length !== 1 ? 's' : ''} · {fleet.status.toUpperCase()}
            </p>
          </div>
        </div>
        <button
          onClick={() => { onPlayClick(); setExpanded(p => !p); }}
          className="text-[9px] font-mono-hud text-primary/50 hover:text-primary flex items-center gap-1 transition-colors shrink-0"
        >
          {expanded ? "Collapse" : "Details"}
          <ChevronRight size={10} className={cn("transition-transform", expanded && "rotate-90")} />
        </button>
      </div>

      {expanded && (
        <div className="mb-3 space-y-2 border-t border-primary/10 pt-3">
          {fleetVessels.map(v => (
            <div key={v.id} className="flex items-center justify-between text-[10px] font-mono-hud px-2 group/vessel">
              <div className="flex items-center gap-2 text-muted-foreground">
                {CLASS_ICON[v.class] ?? <Ship size={12} />}
                <span className="text-foreground/80">{v.name}</span>
                <span className="text-primary/40">·</span>
                <span className="text-primary/50">{CLASS_LABELS[v.class] ?? v.class}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onRefit(v)}
                  className="p-1.5 hover:text-primary text-primary/60 border border-primary/20 rounded hover:border-primary/50 bg-primary/5 transition-all"
                  title="Refit Visuals"
                >
                  <Palette size={11} />
                </button>
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1 bg-primary/10 rounded-full overflow-hidden">
                    <div className="h-full bg-success" style={{ width: `${v.health}%` }} />
                  </div>
                  <span className="text-success">{v.health}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 text-[9px] font-mono-hud text-muted-foreground">
          <MapPin size={10} />
          <span>Deployed in {fleet.systemId}</span>
        </div>
        {!fleet.vesselIds.includes(commanderId) && (
          <button
            onClick={() => { onPlayClick(); onDisband(fleet.id); }}
            className="flex items-center gap-1.5 text-[9px] font-mono-hud text-red-400/60 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg border border-red-400/10 hover:border-red-400/30"
          >
            <Trash2 size={10} />
            <span>Disband</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Docked ship card (selectable for fleet formation) ────────────────────────

function DockedVesselCard({ vessel, selected, onToggle, drydockBody, onRefit, onDeploy }: {
  vessel:      Vessel;
  selected:    boolean;
  onToggle:    () => void;
  drydockBody: string;
  onRefit:     () => void;
  onDeploy:    () => void;
}) {
  return (
    <div
      className={cn(
        "w-full p-3 rounded-xl border transition-all flex items-center gap-3",
        selected
          ? "bg-primary/15 border-primary/40 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]"
          : "bg-background/30 border-primary/10 hover:border-primary/25"
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all",
          selected ? "bg-primary border-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" : "border-primary/30"
        )}
      >
        {selected && <CheckCircle2 size={10} className="text-black" />}
      </button>
      <div 
        className="flex-1 flex items-center gap-3 cursor-pointer"
        onClick={onToggle}
      >
        <div className={cn("p-2 rounded-lg border shrink-0",
          selected ? "bg-primary/20 border-primary/30 text-primary" : "bg-primary/5 border-primary/10 text-muted-foreground"
        )}>
          {CLASS_ICON[vessel.class] ?? <Ship size={14} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-[11px] uppercase tracking-wider text-foreground truncate">{vessel.name}</p>
          <p className="text-[9px] font-mono-hud text-muted-foreground uppercase">{CLASS_LABELS[vessel.class]} · {drydockBody}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right hidden sm:block">
          <p className="text-[9px] font-mono-hud text-success">{vessel.health}% hull</p>
          <p className="text-[9px] font-mono-hud text-muted-foreground">{vessel.cargoCapacity.toLocaleString()} cap</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onRefit(); }}
          className="p-2.5 rounded-lg bg-primary/5 border border-primary/10 text-primary/40 hover:text-primary hover:bg-primary/20 hover:border-primary/40 transition-all flex items-center gap-2 group"
        >
          <Palette size={14} className="group-hover:rotate-12 transition-transform" />
          <span className="text-[8px] font-display uppercase tracking-widest hidden lg:inline">Refit</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDeploy(); }}
          className="p-2.5 rounded-lg bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 transition-all flex items-center gap-2 group"
        >
          <Rocket size={14} className="group-hover:-translate-y-0.5 transition-transform" />
          <span className="text-[8px] font-display uppercase tracking-widest hidden lg:inline">Deploy</span>
        </button>
      </div>
    </div>
  );
}

// ─── Construction queue item ──────────────────────────────────────────────────

function QueueItem({ entry, hasDrydock, onTransfer, onPlayClick }: {
  entry:       ConstructionQueueEntry;
  hasDrydock:  boolean;
  onTransfer:  (id: string) => void;
  onPlayClick: () => void;
}) {
  const isHangared = entry.status === 'hangared';
  const progress   = isHangared ? 100 : buildProgress(entry.startedAt, entry.completesAt);

  return (
    <div className={cn(
      "p-4 rounded-xl border",
      isHangared ? "bg-success/5 border-success/20" : "bg-background/30 border-primary/10"
    )}>
      <div className="flex items-start gap-3 mb-3">
        <div className={cn("p-2.5 rounded-lg border shrink-0",
          isHangared
            ? "bg-success/15 border-success/30 text-success"
            : "bg-primary/5 border-primary/10 text-muted-foreground"
        )}>
          <Hammer size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-display text-[11px] uppercase tracking-wider text-foreground mb-0.5">{entry.vesselName}</h4>
          <p className="text-[9px] font-mono-hud text-muted-foreground uppercase">
            {CLASS_LABELS[entry.vesselClass]} · {entry.bodyId}
          </p>
        </div>
        <div className={cn("text-[9px] font-mono-hud shrink-0", isHangared ? "text-success" : "text-muted-foreground")}>
          {isHangared ? "Ready" : timeRemaining(entry.completesAt)}
        </div>
      </div>

      {!isHangared && (
        <div className="mb-3">
          <div className="w-full h-1.5 bg-primary/10 rounded-full overflow-hidden">
            <div className="h-full bg-info transition-all duration-1000" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[8px] font-mono-hud text-muted-foreground/50 mt-1 text-right">{Math.round(progress)}% complete</p>
        </div>
      )}

      {isHangared && (
        <div>
          {!hasDrydock && (
            <div className="flex items-center gap-2 text-[9px] font-mono-hud text-warning/70 mb-2">
              <AlertTriangle size={11} />
              <span>No Drydock found in this system — ship will remain in hangar until one is built</span>
            </div>
          )}
          <Button
            onClick={() => { onPlayClick(); onTransfer(entry.id); }}
            disabled={!hasDrydock}
            className={cn(
              "w-full h-8 text-[10px] font-display uppercase tracking-widest",
              hasDrydock
                ? "bg-success/20 border border-success/40 text-success hover:bg-success/30"
                : "bg-primary/5 border border-primary/10 text-primary/30 cursor-not-allowed"
            )}
          >
            <ArrowRight size={12} className="mr-2" />
            Transfer to Drydock
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Fleet formation panel ────────────────────────────────────────────────────

function FormFleetPanel({ selectedIds, vessels, drydockId, onConfirm, onCancel, onPlayClick }: {
  selectedIds: string[];
  vessels:     Vessel[];
  drydockId:   string;
  onConfirm:   (name: string) => void;
  onCancel:    () => void;
  onPlayClick: () => void;
}) {
  const [fleetName, setFleetName] = useState('');
  const selected = vessels.filter(v => selectedIds.includes(v.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md hud-panel border border-primary/30 bg-background/95 rounded-2xl p-6">
        <h2 className="font-display text-sm uppercase tracking-[0.2em] text-primary mb-1">Form Fleet</h2>
        <p className="text-[10px] font-mono-hud text-muted-foreground mb-6">
          {selected.length} vessel{selected.length !== 1 ? 's' : ''} selected — name your fleet to deploy
        </p>

        <div className="space-y-2 mb-6">
          {selected.map(v => (
            <div key={v.id} className="flex items-center gap-2 text-[10px] font-mono-hud text-muted-foreground px-2">
              {CLASS_ICON[v.class] ?? <Ship size={12} />}
              <span className="text-foreground">{v.name}</span>
              <span className="text-primary/40">·</span>
              <span>{CLASS_LABELS[v.class]}</span>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <label className="font-mono-hud text-[9px] uppercase tracking-widest text-primary/60 block mb-2">Fleet Designation</label>
          <input
            type="text"
            value={fleetName}
            onChange={e => setFleetName(e.target.value)}
            placeholder="Enter fleet name..."
            maxLength={32}
            className="w-full bg-background/60 border border-primary/20 focus:border-primary/50 px-4 py-2.5 font-display text-sm uppercase tracking-widest text-primary outline-none transition-all placeholder:text-primary/20 rounded-lg"
          />
        </div>

        <div className="flex gap-3">
          <Button onClick={() => { onPlayClick(); onCancel(); }}
            className="flex-1 h-10 bg-primary/5 border border-primary/20 text-primary font-display text-[10px] uppercase tracking-widest hover:bg-primary/10">
            Cancel
          </Button>
          <Button
            onClick={() => { if (fleetName.trim()) { onPlayClick(); onConfirm(fleetName.trim()); } }}
            disabled={!fleetName.trim()}
            className="flex-1 h-10 bg-primary text-black font-display text-[10px] uppercase tracking-widest hover:bg-primary/80 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Ship size={13} className="mr-2" /> Deploy Fleet
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Refit Modal ──────────────────────────────────────────────────────────────

function RefitModal({ vessel, onSave, onCancel, onPlayClick }: {
  vessel:      Vessel;
  onSave:      (config: ShipConfiguration) => void;
  onCancel:    () => void;
  onPlayClick: () => void;
}) {
  const [config, setConfig] = useState<ShipConfiguration>({ ...vessel.config, name: vessel.name });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-4xl h-[85vh] flex flex-col hud-panel border border-primary/30 bg-background/95 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(var(--primary-rgb),0.2)]">
        <div className="p-4 border-b border-primary/20 flex items-center justify-between bg-primary/5">
          <div className="flex items-center gap-3">
            <Palette className="text-primary" size={18} />
            <div>
              <h2 className="font-display text-sm uppercase tracking-[0.2em] text-primary">Vessel Refit</h2>
              <p className="text-[9px] font-mono-hud text-muted-foreground uppercase tracking-widest">Adjusting {vessel.name} · {vessel.class.toUpperCase()} Class</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 min-h-0">
          <ShipCustomizer 
            config={config} 
            onChange={setConfig} 
            playClick={onPlayClick} 
            shipClass={vessel.class}
            hideClassSelector={true}
          />
        </div>

        <div className="p-4 bg-primary/5 border-t border-primary/20 flex justify-end gap-3">
          <Button onClick={onCancel} className="h-10 px-6 bg-primary/5 border border-primary/20 text-primary font-display text-[10px] uppercase tracking-widest hover:bg-primary/10">
            Discard Changes
          </Button>
          <Button onClick={() => onSave(config)} className="h-10 px-8 bg-primary text-black font-display text-[10px] uppercase tracking-widest hover:bg-primary/80">
            Apply Configuration
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function FleetsView({ app, onPlayClick }: { app: any; onPlayClick?: () => void }) {
  const [selectedDockedIds, setSelectedDockedIds] = useState<string[]>([]);
  const [formingFleet,      setFormingFleet]       = useState(false);
  const [customizingVessel, setCustomizingVessel] = useState<Vessel | null>(null);
  const play = () => onPlayClick?.();

  const userFleets: FleetEntity[] = useMemo(() => {
    const baseFleets = app.userFleets ?? [];
    const commanderInFleet = baseFleets.some(f => f.vesselIds.includes(app.vesselId));
    
    if (commanderInFleet) return baseFleets;

    return [
      {
        id: app.vesselId,
        ownerId: app.user?.id ?? "",
        name: app.playerName ?? "Commander Fleet",
        systemId: app.playerSystemId,
        bodyId: app.playerBodyId,
        status: "active",
        vesselIds: [app.vesselId],
        travel: app.travel,
      },
      ...baseFleets
    ];
  }, [app.vesselId, app.user?.id, app.playerName, app.playerSystemId, app.playerBodyId, app.travel, app.userFleets]);
  
  const userVessels:  Vessel[]                   = app.userVessels ?? [];
  const constrQueue:  ConstructionQueueEntry[]   = app.constructionQueue ?? [];
  const userFactories                            = app.userFactories ?? [];

  // Docked vessels — exclude commander
  const dockedVessels = useMemo(
    () => userVessels.filter(v => v.status === 'docked' && v.class !== 'commander'),
    [userVessels]
  );

  // Queue entries that are active (building or hangared)
  const activeQueue = useMemo(
    () => constrQueue.filter((q: ConstructionQueueEntry) =>
      q.status === 'building' || q.status === 'hangared'
    ),
    [constrQueue]
  );

  // Drydock lookup by body
  const drydockForBody = (bodyId: string) =>
    userFactories.find((f: any) => f.type === 'Drydock' && f.bodyId === bodyId) ?? null;

  const drydockForSystem = (systemId: string) =>
    userFactories.find((f: any) => f.type === 'Drydock' && f.systemId === systemId) ?? null;

  // Group docked vessels by drydock
  const dockedByDrydock = useMemo(() => {
    const groups: Record<string, Vessel[]> = {};
    for (const v of dockedVessels) {
      const key = v.drydockId ?? 'unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(v);
    }
    return groups;
  }, [dockedVessels]);

  const toggleDockedVessel = (id: string) => {
    play();
    setSelectedDockedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllDocked = (vesselIds: string[]) => {
    play();
    setSelectedDockedIds(prev => {
      const next = new Set([...prev, ...vesselIds]);
      return Array.from(next);
    });
  };

  const deselectAllDocked = (vesselIds: string[]) => {
    play();
    setSelectedDockedIds(prev => prev.filter(id => !vesselIds.includes(id)));
  };

  // For fleet formation: find the drydock ID of the first selected vessel
  const formationDrydockId = useMemo(() => {
    if (selectedDockedIds.length === 0) return null;
    const firstVessel = dockedVessels.find(v => selectedDockedIds[0] === v.id);
    return firstVessel?.drydockId ?? null;
  }, [selectedDockedIds, dockedVessels]);


  const handleFormFleet = async (name: string) => {
    if (!formationDrydockId) return;
    await app.formFleet(name, selectedDockedIds, formationDrydockId);
    setSelectedDockedIds([]);
    setFormingFleet(false);
  };

  const handleDisband = async (fleetId: string) => {
    play();
    await app.disbandFleet(fleetId);
  };

  const handleTransfer = async (queueId: string) => {
    play();
    await app.transferShipToDrydock(queueId);
  };

  const handleRefit = async (config: ShipConfiguration) => {
    if (!customizingVessel) return;
    play();
    await app.updateVesselConfig(customizingVessel.id, config);
    setCustomizingVessel(null);
  };

  return (
    <>
      {formingFleet && formationDrydockId && (
        <FormFleetPanel
          selectedIds={selectedDockedIds}
          vessels={dockedVessels}
          drydockId={formationDrydockId}
          onConfirm={handleFormFleet}
          onCancel={() => setFormingFleet(false)}
          onPlayClick={play}
        />
      )}

      {customizingVessel && (
        <RefitModal 
          vessel={customizingVessel}
          onSave={handleRefit}
          onCancel={() => setCustomizingVessel(null)}
          onPlayClick={play}
        />
      )}

      <div className="flex-1 flex flex-col bg-background/40 backdrop-blur-sm overflow-hidden animate-in fade-in duration-500">
        <PageHeader title="Fleet Registry" subtitle="Command & Fleet Management" icon={<Ship className="w-5 h-5 text-primary" />} onBack={() => app.setPage("map")} />

        <main className="flex-1 p-4 sm:p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-10 pb-24">

            {/* ── Active Fleets ─────────────────────────────────────────────── */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-[11px] uppercase tracking-[0.2em] text-primary/70 flex items-center gap-2">
                  <Ship size={14} /> Active Fleets
                </h2>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => { play(); app.setPage("shipyard"); }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-info/10 border border-info/30 text-info font-display text-[9px] uppercase tracking-widest rounded-lg hover:bg-info/20 transition-all group"
                  >
                    <Hammer size={11} className="group-hover:rotate-12 transition-transform" />
                    Shipyard Hub
                  </button>
                  <button
                    onClick={() => { play(); setCustomizingVessel(userVessels.find(v => v.id === app.vesselId) || userVessels[0]); }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary font-display text-[9px] uppercase tracking-widest rounded-lg hover:bg-primary/20 transition-all group"
                  >
                    <Palette size={11} className="group-hover:rotate-12 transition-transform" />
                    Fleet Visual Refit
                  </button>
                  <span className="text-[9px] font-mono-hud text-muted-foreground/50">{userFleets.length} deployed</span>
                </div>

              </div>

              {userFleets.length === 0 ? (
                <div className="hud-panel border border-primary/10 bg-background/20 rounded-xl p-8 text-center">
                  <Ship size={28} className="text-primary/20 mx-auto mb-3" />
                  <p className="text-[10px] font-mono-hud text-muted-foreground/50 uppercase">No active fleets — dock vessels and form a fleet below</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userFleets.map(fleet => (
                    <FleetCard key={fleet.id} fleet={fleet} vessels={userVessels} commanderId={app.vesselId}
                      onDisband={handleDisband} onPlayClick={play} onRefit={setCustomizingVessel} onRename={app.renameFleet} />
                  ))}
                </div>
              )}
            </section>

            {/* ── Docked Ships ──────────────────────────────────────────────── */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-[11px] uppercase tracking-[0.2em] text-primary/70 flex items-center gap-2">
                  <Anchor size={14} /> Docked Ships
                </h2>
                {selectedDockedIds.length > 0 && (
                  <button
                    onClick={() => { play(); setFormingFleet(true); }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary/15 border border-primary/40 text-primary font-display text-[9px] uppercase tracking-widest rounded-lg hover:bg-primary/25 transition-all"
                  >
                    <Plus size={11} />
                    Form Fleet ({selectedDockedIds.length})
                  </button>
                )}
              </div>

              {dockedVessels.length === 0 ? (
                <div className="hud-panel border border-primary/10 bg-background/20 rounded-xl p-8 text-center">
                  <Anchor size={28} className="text-primary/20 mx-auto mb-3" />
                  <p className="text-[10px] font-mono-hud text-muted-foreground/50 uppercase">No docked ships — transfer built vessels from the Shipyard Hangar below</p>
                </div>
              ) : (
                Object.entries(dockedByDrydock).map(([drydockId, vessels]) => {
                  const drydock = userFactories.find(f => f.id === drydockId);
                  const system = drydock ? app.galaxy.systemById[drydock.systemId] : null;
                  const body = system?.bodies.find(b => b.id === drydock?.bodyId) || (drydock?.bodyId === 'star' ? { name: 'Star' } : null);

                  const locationName = system ? `${system.name} · ${body?.name || 'Orbital Space'}` : 'Unknown Location';
                  
                  const allInGroupSelected = vessels.every(v => selectedDockedIds.includes(v.id));

                  return (
                    <div key={drydockId} className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[9px] font-mono-hud text-muted-foreground/50 uppercase tracking-widest flex items-center gap-2">
                          <Anchor size={10} /> Drydock · {locationName}
                        </p>
                        <button 
                          onClick={() => allInGroupSelected ? deselectAllDocked(vessels.map(v => v.id)) : selectAllDocked(vessels.map(v => v.id))}
                          className="text-[8px] font-bold text-primary/60 uppercase hover:text-primary transition-colors px-2 py-0.5 border border-primary/10 rounded hover:bg-primary/5"
                        >
                          {allInGroupSelected ? "Deselect Group" : "Select Group"}
                        </button>
                      </div>
                      <div className="space-y-2">
                        {vessels.map(v => (
                          <DockedVesselCard
                            key={v.id}
                            vessel={v}
                            selected={selectedDockedIds.includes(v.id)}
                            onToggle={() => toggleDockedVessel(v.id)}
                            drydockBody={locationName}
                            onRefit={() => setCustomizingVessel(v)}
                            onDeploy={() => {
                              if (!selectedDockedIds.includes(v.id)) {
                                setSelectedDockedIds(prev => [...prev, v.id]);
                              }
                              setFormingFleet(true);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })
              )}


              {selectedDockedIds.length > 0 && (
                <p className="text-[9px] font-mono-hud text-primary/50 mt-2">
                  {selectedDockedIds.length} ship{selectedDockedIds.length !== 1 ? 's' : ''} selected — all must be at the same drydock to form a fleet
                </p>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-[11px] uppercase tracking-[0.2em] text-primary/70 flex items-center gap-2">
                    <Hammer size={14} /> Shipyard Hangar
                  </h2>
                  <span className="text-[9px] font-mono-hud text-muted-foreground/50">{activeQueue.length} active builds</span>
                </div>
                <button
                  onClick={() => { play(); app.setPage("shipyard"); }}
                  className="text-[9px] font-bold text-primary/60 uppercase hover:text-primary transition-colors px-2 py-1 border border-primary/10 rounded hover:bg-primary/5 flex items-center gap-2"
                >
                  <Plus size={10} /> Commission New Vessel
                </button>
              </div>

              {activeQueue.length === 0 ? (
                <div className="hud-panel border border-primary/10 bg-background/20 rounded-xl p-8 text-center">
                  <Hammer size={28} className="text-primary/20 mx-auto mb-3" />
                  <p className="text-[10px] font-mono-hud text-muted-foreground/50 uppercase mb-4">No active builds detected in any shipyard</p>
                  <button
                    onClick={() => { play(); app.setPage("shipyard"); }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 text-primary font-display text-[10px] uppercase tracking-widest rounded-lg hover:bg-primary/20 transition-all"
                  >
                    <Hammer size={11} /> Visit Shipyard
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeQueue.map((entry: ConstructionQueueEntry) => {
                    // Check for drydock in system
                    const hasDrydock = !!drydockForSystem(entry.systemId);
                    return (
                      <QueueItem key={entry.id} entry={entry} hasDrydock={hasDrydock}
                        onTransfer={handleTransfer} onPlayClick={play} />
                    );
                  })}
                </div>
              )}
            </section>


          </div>
        </main>
      </div>
    </>
  );
}
