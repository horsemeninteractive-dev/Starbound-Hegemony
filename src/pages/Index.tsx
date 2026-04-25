import { Suspense, useMemo, useState, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useGalaxyApp } from "@/galaxy/useGalaxyApp";
import { UnifiedMap } from "@/galaxy/components/UnifiedMap";
import { GalaxyOverview, SystemOverview, BodyOverview } from "@/galaxy/components/Overview";
import { TopBar } from "@/galaxy/components/TopBar";
import { FilterPanel } from "@/galaxy/components/FilterPanel";
import { Legend } from "@/galaxy/components/Legend";
import { SettingsModal } from "@/galaxy/components/SettingsModal";
import { DebugPanel } from "@/galaxy/components/DebugPanel";
import logo from "@/assets/logo.png";

const Index = () => {
  const app = useGalaxyApp(20260423);

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobilePanelExpanded, setIsMobilePanelExpanded] = useState(false);
  const [graphicsQuality, setGraphicsQuality] = useState<"low" | "medium" | "high">(() => {
    return (localStorage.getItem("gfx_quality") as any) || "high";
  });

  useEffect(() => {
    localStorage.setItem("gfx_quality", graphicsQuality);
  }, [graphicsQuality]);

  // Cinematic view transitions
  const handleSystemBodyClick = (id: string) => {
    if (id.startsWith("gate:")) {
      app.openSystem(id.slice(5));
    } else {
      app.openBody(id);
    }
  };

  const handleOpenSystem = (id: string) => {
    app.openSystem(id);
  };

  const handleBackToGalaxy = () => {
    app.backToGalaxy();
  };

  const handleBackToSystem = () => {
    app.backToSystem();
  };

  const matches = useMemo(() => app.systemMatchesFilter, [app.systemMatchesFilter]);

  return (
    <main className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      {/* Top persistent navigation bar spanning whole width */}
      <div className="relative z-50">
        <TopBar
          onOpenSettings={() => setIsSettingsOpen(true)}
          ap={app.ap}
          sc={app.sc}
          fogOfWar={app.fogOfWar}
          setFogOfWar={app.setFogOfWar}
          instantJump={app.instantJump}
          setInstantJump={app.setInstantJump}
        />
      </div>

      {/* Main Content Area: Map + Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Map Viewport Area */}
        <div className="relative flex-1 flex flex-col min-w-0">
          {/* Subtle nebula vignette */}
          <div className="pointer-events-none absolute inset-0 bg-nebula opacity-40 z-0" />

          {/* 3D viewport */}
          <div className="absolute inset-0 z-10">
            <Suspense fallback={<LoadingHud />}>
              <UnifiedMap
                galaxy={app.galaxy}
                view={app.view}
                system={app.system}
                body={app.body}
                filters={app.filters}
                onSelectSystem={handleOpenSystem}
                onSelectBody={handleSystemBodyClick}
                onHoverSystem={app.setHoverSystemId}
                hoverSystemId={app.hoverSystemId}
                fogOfWar={app.fogOfWar}
                exploredSystemIds={app.exploredSystemIds}
                knownSystemIds={app.knownSystemIds}
                systemMatchesFilter={app.systemMatchesFilter}
                currentSystemId={app.playerSystemId}
                travel={app.travel}
                isMobilePanelExpanded={isMobilePanelExpanded}
                graphicsQuality={graphicsQuality}
              />
            </Suspense>
          </div>

          {/* HUD Overlay within Map (Bottom Controls) */}
          <div className="relative z-20 flex flex-col h-full pointer-events-none">
            <div className="flex-1" />

            {/* Bottom Controls cluster — desktop only (mobile gets its own bar below) */}
            <div className="hidden sm:flex p-2 items-end gap-2">
              <Legend view={app.view} />
              {(app.view === "galaxy" || app.view === "system" || app.view === "body") && (
                <FilterPanel filters={app.filters} onToggle={app.toggleFilter} view={app.view} />
              )}
            </div>
          </div>

          {/* Scanline overlay */}
          <div className="pointer-events-none absolute inset-0 z-30 scanline opacity-30" />
        </div>

        <aside className="hidden sm:flex w-[380px] h-full flex-col hud-panel border-l border-primary/20 z-40 animate-in slide-in-from-right duration-500">
          {/* Sidebar Header matching TopBar height */}
          <div className="h-[60px] sm:h-[72px] px-4 sm:px-6 border-b border-primary/20 flex items-center shrink-0 bg-background/40 backdrop-blur-sm">
            <div className="flex flex-col">
              <span className="font-mono-hud text-[9px] uppercase tracking-[0.3em] text-primary/50 leading-none mb-1.5">Sector Intel</span>
              <span className="font-display text-lg uppercase tracking-[0.15em] text-primary text-glow leading-none">Tactical Overview</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {app.view === "galaxy" && <GalaxyOverview galaxy={app.galaxy} />}
            {app.view === "system" && app.system && (
              <SystemOverview 
                system={app.system} 
                galaxy={app.galaxy} 
                onSelectBody={handleSystemBodyClick}
                playerSystemId={app.playerSystemId}
                travel={app.travel}
                initiateJump={app.initiateJump}
                currentTime={app.currentTime}
                isExplored={!app.fogOfWar || app.exploredSystemIds.has(app.system.id)}
              />
            )}
            {app.view === "body" && app.body && <BodyOverview body={app.body} galaxy={app.galaxy} />}
          </div>
          
        </aside>
      </div>

      {/* ── Global Breadcrumb Footer ───────────────────────────────────────── */}
      {/* Spans full width below both the map and the sidebar on all viewports */}
      <footer className="relative z-50 border-t border-primary/20 bg-black/60 backdrop-blur-md flex items-center gap-0 px-3 h-8 shrink-0">
        {/* Breadcrumb navigation */}
        <nav className="flex items-center gap-0.5 font-mono-hud text-[9px] uppercase tracking-widest overflow-hidden">
          <button
            onClick={handleBackToGalaxy}
            className={`px-2 py-1 transition-colors shrink-0 uppercase ${
              app.view === "galaxy"
                ? "text-primary text-glow"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            Galaxy
          </button>
          {app.system && (
            <>
              <span className="text-primary/30 shrink-0 select-none">›</span>
              <button
                onClick={handleBackToSystem}
                className={`px-2 py-1 transition-colors truncate max-w-[160px] uppercase ${
                  app.view === "system"
                    ? "text-primary text-glow"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {app.system.name}
              </button>
            </>
          )}
          {app.body && (
            <>
              <span className="text-primary/30 shrink-0 select-none">›</span>
              <span className="px-2 py-1 text-primary text-glow truncate max-w-[160px] uppercase">
                {app.body.name}
              </span>
            </>
          )}
        </nav>

        {/* Right-aligned Commander Location / FTL Status */}
        <div className="ml-auto flex items-center gap-4 font-mono-hud text-[8px] uppercase tracking-widest">
          {app.travel ? (
            <div className="flex items-center gap-2">
              <span className="text-warning shrink-0 uppercase animate-pulse">IN TRANSIT TO:</span>
              <span className="text-warning text-glow font-bold shrink-0 uppercase">
                {app.galaxy.systemById[app.travel.targetId]?.name || "DEEP SPACE"}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-primary/40 shrink-0 uppercase">COMMANDER LOC:</span>
              <span className="text-primary text-glow shrink-0 uppercase">
                {app.galaxy.systems.find(s => s.id === app.playerSystemId)?.name || "DEEP SPACE"}
              </span>
            </div>
          )}

          {app.travel && (
            <div className="flex items-center gap-2 border-l border-primary/20 pl-4">
              <span className="text-warning shrink-0 animate-pulse">FTL TRANSIT:</span>
              <span className="text-warning font-bold shrink-0">
                {Math.max(0, Math.ceil((app.travel.endTime - app.currentTime) / 1000))}S
              </span>
            </div>
          )}
        </div>
      </footer>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        quality={graphicsQuality}
        setQuality={setGraphicsQuality}
      />

      {/* Mobile Controls Bar — sits between the info panel and the footer */}
      {/* Filter on the left, Legend on the far right */}
      <div className="sm:hidden fixed inset-x-0 bottom-8 z-40 h-10 border-t border-primary/20 bg-black/70 backdrop-blur-md flex items-center px-3 gap-2">
        {(app.view === "system" || app.view === "body") && (
          <button
            onClick={app.view === "body" ? handleBackToSystem : handleBackToGalaxy}
            className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 border border-primary/30 rounded text-[9px] text-primary font-bold tracking-widest uppercase hover:bg-primary/20 transition"
          >
            <span className="opacity-60 text-xs">←</span>
            <span>BACK</span>
          </button>
        )}
        {(app.view === "galaxy" || app.view === "system" || app.view === "body") && (
          <FilterPanel filters={app.filters} onToggle={app.toggleFilter} view={app.view} />
        )}
        <div className="ml-auto">
          <Legend view={app.view} />
        </div>
      </div>

      <MobileOverview 
        app={app} 
        onSelectBody={handleSystemBodyClick} 
        expanded={isMobilePanelExpanded}
        setExpanded={setIsMobilePanelExpanded}
      />
    </main>
  );
};

function LoadingHud() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-[100] animate-in fade-in duration-1000">
      <div className="relative w-48 h-48 sm:w-64 sm:h-64 mb-8">
        <img 
          src={logo} 
          alt="Starbound Hegemony" 
          className="w-full h-full object-contain animate-pulse-slow drop-shadow-[0_0_30px_rgba(16,185,129,0.3)]"
        />
        <div className="absolute inset-0 border border-primary/20 rounded-full animate-spin-slow" />
      </div>
      
      <div className="flex flex-col items-center gap-2 max-w-[90vw]">
        <div className="font-display text-base sm:text-xl uppercase tracking-[0.2em] sm:tracking-[0.5em] text-primary text-glow mb-2 animate-pulse text-center">
          Initialising Star Chart
        </div>
        <div className="flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div 
              key={i} 
              className="w-8 h-1 bg-primary/20 overflow-hidden rounded-full"
            >
              <div 
                className="h-full bg-primary animate-loading-bar" 
                style={{ animationDelay: `${i * 0.2}s` }} 
              />
            </div>
          ))}
        </div>
        <div className="font-mono-hud text-[8px] uppercase tracking-widest text-primary/40 mt-4">
          Decrypting galactic telemetry...
        </div>
      </div>
    </div>
  );
}

function MobileOverview({
  app,
  onSelectBody,
  expanded,
  setExpanded
}: {
  app: ReturnType<typeof useGalaxyApp>;
  onSelectBody: (id: string) => void;
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  useEffect(() => {
    setExpanded(false);
  }, [app.view, app.system?.id, app.body?.id]);

  let title = "Galaxy";
  let subtitle = `${app.galaxy.systems.length} systems · ${app.galaxy.sectors.length} sectors`;
  if (app.view === "system" && app.system) {
    title = app.system.name;
    subtitle = `${app.system.bodies.length} bodies · ${app.system.starType.toUpperCase()}-class`;
  } else if (app.view === "body" && app.body) {
    title = app.body.name;
    subtitle =
      app.body.population > 0
        ? `${app.body.type.replace("_", " ")} · ${app.body.population.toFixed(1)}M pop`
        : `${app.body.type.replace("_", " ")} · uninhabited`;
  }

  return (
    <div className="sm:hidden fixed inset-x-2 bottom-[4.5rem] z-30 pointer-events-auto">
      <div className="hud-panel hud-corner overflow-hidden flex flex-col shadow-2xl shadow-primary/10">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-2 px-3 py-2 text-left hover:bg-primary/5 transition"
          aria-label={expanded ? "Collapse panel" : "Expand panel"}
        >
          <div className="flex-1 min-w-0">
            <div className="font-mono-hud text-[9px] uppercase tracking-[0.3em] text-primary/70 truncate">
              {subtitle}
            </div>
            <div className="font-display text-sm uppercase tracking-[0.15em] text-primary text-glow truncate">
              {title}
            </div>
          </div>
          <span className="shrink-0 text-primary border border-primary/40 rounded p-1">
            {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </span>
        </button>

        {expanded && (
          <div className="border-t border-primary/20 max-h-[40vh] overflow-y-auto p-2 animate-fade-in">
            {app.view === "galaxy" && <GalaxyOverview galaxy={app.galaxy} hideHeader={true} />}
            {app.view === "system" && app.system && (
              <SystemOverview
                system={app.system}
                galaxy={app.galaxy}
                onSelectBody={onSelectBody}
                playerSystemId={app.playerSystemId}
                travel={app.travel}
                initiateJump={app.initiateJump}
                currentTime={app.currentTime}
                isExplored={app.exploredSystemIds.has(app.system.id)}
                hideHeader={true}
              />
            )}
            {app.view === "body" && app.body && (
              <BodyOverview body={app.body} galaxy={app.galaxy} hideHeader={true} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Index;
