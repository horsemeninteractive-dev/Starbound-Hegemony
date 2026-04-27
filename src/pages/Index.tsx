import { Suspense, useMemo, useState, useEffect, useRef } from "react";
import { ChevronUp, ChevronDown, User as UserIcon, Users as UsersIcon, Coins, Newspaper, Sparkles, Globe, Zap } from "lucide-react";
import { Toaster } from "sonner";
import { useGalaxyApp } from "@/galaxy/useGalaxyApp";
import { UnifiedMap } from "@/galaxy/components/UnifiedMap";
import { GalaxyOverview, SystemOverview, BodyOverview, ShipOverview } from "@/galaxy/components/Overview";
import { TopBar } from "@/galaxy/components/TopBar";
import { FilterPanel } from "@/galaxy/components/FilterPanel";
import { Legend } from "@/galaxy/components/Legend";
import { SettingsModal } from "@/galaxy/components/SettingsModal";
import { MiniMap } from "@/galaxy/components/MiniMap";
import { CommanderOnboarding } from "@/galaxy/components/CommanderOnboarding";
import logo from "@/assets/logo.png";

const Index = () => {
  const app = useGalaxyApp(20260423);

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionKey, setTransitionKey] = useState(0);
  
  // Track view changes to trigger the "Processing" indicator
  useEffect(() => {
    if (transitionKey === 0) return;
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 1200);
    return () => clearTimeout(timer);
  }, [transitionKey]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobilePanelExpanded, setIsMobilePanelExpanded] = useState(false);
  const [graphicsQuality, setGraphicsQuality] = useState<"low" | "medium" | "high">(() => {
    return (localStorage.getItem("gfx_quality") as any) || "high";
  });

  useEffect(() => {
    localStorage.setItem("gfx_quality", graphicsQuality);
  }, [graphicsQuality]);

  // Cinematic view transitions with loading state deferral
  // This ensures the "Processing" HUD paints before the heavy React render blocks the thread
  const withLoading = (fn: (...args: any[]) => void) => (...args: any[]) => {
    setTransitionKey(prev => prev + 1);
    requestAnimationFrame(() => {
      setTimeout(() => fn(...args), 60);
    });
  };

  const handleOpenSystem = useMemo(() => withLoading(app.openSystem), [app.openSystem]);
  const handleBackToGalaxy = useMemo(() => withLoading(app.backToGalaxy), [app.backToGalaxy]);
  const handleBackToSystem = useMemo(() => withLoading(app.backToSystem), [app.backToSystem]);

  const handleSystemBodyClick = useMemo(() => withLoading((id: string) => {
    if (id.startsWith("gate:")) {
      app.openSystem(id.slice(5));
    } else if (id === "ship") {
      app.openShip();
    } else {
      app.openBody(id);
    }
  }), [app.openSystem, app.openShip, app.openBody]);

  const handleOnboardingComplete = (name: string, avatar: string) => {
    app.setPlayerName(name);
    app.setPlayerAvatar(avatar);
    app.setOnboardingCompleted(true);
  };

  const matches = useMemo(() => app.systemMatchesFilter, [app.systemMatchesFilter]);

  // Page transition
  const [pageKey, setPageKey] = useState(0);
  const [scanning, setScanning] = useState(false);
  const prevPage = useRef(app.page);
  const navigateTo = (page: "map" | "profile", extra?: () => void) => {
    if (page === prevPage.current && !extra) return;
    setScanning(true);
    setTimeout(() => {
      if (page !== prevPage.current) { app.setPage(page); prevPage.current = page; setPageKey(k => k + 1); }
      extra?.();
      setScanning(false);
    }, 200);
  };

  return (
    <main className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      {scanning && (
        <div className="fixed inset-0 z-[200] pointer-events-none" style={{ background: "linear-gradient(90deg,transparent 0%,hsl(var(--primary)/0.18) 50%,transparent 100%)", animation: "scan-wipe 0.4s ease-in-out both", transformOrigin: "left center" }} />
      )}
      {/* Top persistent navigation bar spanning whole width */}
      <div className="relative z-50">
        <TopBar
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenProfile={() => navigateTo("profile")}
          onOpenMap={() => navigateTo("map")}
          ap={app.ap}
          sc={app.sc}
          playerName={app.playerName}
          playerLevel={app.playerLevel}
          playerXP={app.playerXP}
          xpToNextLevel={app.xpToNextLevel}
          playerAvatar={app.playerAvatar}
          fogOfWar={app.fogOfWar}
          setFogOfWar={app.setFogOfWar}
          instantJump={app.instantJump}
          setInstantJump={app.setInstantJump}
        />
      </div>

      {/* Main Content Area — keyed so it animates on page change */}
      <div className="flex-1 flex overflow-hidden relative">
        <div key={pageKey} className="flex-1 flex overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-400">
          {app.page === "map" ? (
            <>
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
              
              <MiniMap 
                galaxy={app.galaxy} 
                currentSystem={app.system} 
                playerSystemId={app.playerSystemId} 
                view={app.view} 
              />

              <DataProcessingIndicator isBusy={isTransitioning} />

              {/* HUD Overlay within Map (Bottom Controls) */}
              <div className="relative z-20 flex flex-col h-full pointer-events-none">
                <div className="flex-1" />

                {/* Bottom Controls cluster — desktop only (mobile gets its own bar below) */}
                <div className="hidden sm:flex p-2 items-end justify-between w-full">
                  <Legend view={app.view} />
                  {(app.view === "galaxy" || app.view === "system" || app.view === "body" || app.view === "ship") && (
                    <FilterPanel filters={app.filters} onToggle={app.toggleFilter} view={app.view === "ship" ? "system" : app.view} />
                  )}
                </div>
              </div>
            </div>

            <aside className="hidden sm:flex w-[380px] h-full flex-col hud-panel border-l border-primary/20 z-40 animate-in slide-in-from-right duration-500">
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
                    getJumpCost={app.getJumpCost}
                    currentTime={app.currentTime}
                    isExplored={!app.fogOfWar || app.exploredSystemIds.has(app.system.id)}
                  />
                )}
                {app.view === "body" && app.body && <BodyOverview body={app.body} galaxy={app.galaxy} />}
                {app.view === "ship" && (
                  <ShipOverview
                    system={app.system}
                    travel={app.travel}
                    currentTime={app.currentTime}
                    onDeselect={handleBackToSystem}
                  />
                )}
              </div>
            </aside>
          </>
          ) : (
            <ProfileView app={app} />
          )}
        </div>
      </div>

      {/* ── Global Breadcrumb Footer ───────────────────────────────────────── */}
      <footer className="relative z-50 border-t border-primary/20 bg-black/60 backdrop-blur-md flex items-center justify-between px-3 h-8 shrink-0">
        <nav className="flex items-center gap-0.5 font-mono-hud text-[9px] uppercase tracking-widest overflow-hidden">
          <button
            onClick={() => navigateTo("map", handleBackToGalaxy)}
            className={`px-2 py-1 transition-colors shrink-0 uppercase ${
              app.view === "galaxy" && app.page === "map"
                ? "text-primary text-glow"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            Galaxy
          </button>
          {app.system && app.page === "map" && (
            <>
              <span className="text-primary/20 mx-0.5">/</span>
              <button
                onClick={handleBackToSystem}
                className={`px-2 py-1 transition-colors shrink-0 uppercase ${
                  app.view === "system"
                    ? "text-primary text-glow"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {app.system.name}
              </button>
            </>
          )}
          {app.body && app.page === "map" && (
            <>
              <span className="text-primary/20 mx-0.5">/</span>
              <span className="px-2 py-1 text-primary text-glow shrink-0 uppercase truncate max-w-[120px]">
                {app.body.name}
              </span>
            </>
          )}
          {app.page === "profile" && (
            <>
              <span className="text-primary/20 mx-0.5">/</span>
              <span className="px-2 py-1 text-primary text-glow shrink-0 uppercase">Commander Profile</span>
            </>
          )}
        </nav>

        <div className="flex items-center gap-4 text-[9px] font-mono-hud uppercase tracking-widest text-primary/40 whitespace-nowrap overflow-hidden">
          <span className="hidden sm:inline">Status: <span className="text-success/60">NOMINAL</span></span>
          <span>S-Time: <span className="text-primary/60">{new Date(app.currentTime).toISOString().slice(11, 19)}</span></span>
        </div>
      </footer>

      {/* Overlays */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        quality={graphicsQuality}
        setQuality={setGraphicsQuality}
      />

      {/* Mobile Tactical Panel Overlay */}
      {app.page === "map" && (
        <MobileHUD 
          app={app} 
          onSelectBody={handleSystemBodyClick} 
          expanded={isMobilePanelExpanded} 
          setExpanded={setIsMobilePanelExpanded} 
        />
      )}

      {/* Onboarding Screen - Overlay everything */}
      {!app.onboardingCompleted && (
        <CommanderOnboarding onComplete={handleOnboardingComplete} />
      )}
      
      <Toaster position="bottom-center" theme="dark" closeButton />
    </main>
  );
};

function DataProcessingIndicator({ isBusy }: { isBusy: boolean }) {
  if (!isBusy) return null;

  return (
    <div className="absolute top-4 right-4 z-40 pointer-events-none animate-in fade-in slide-in-from-right duration-500">
      <div className="hud-panel hud-corner bg-black/40 backdrop-blur-md border border-primary/20 px-3 py-2 flex items-center gap-3">
        <div className="relative w-4 h-4">
          <div className="absolute inset-0 border-2 border-primary/40 rounded-sm animate-spin-slow" />
          <div className="absolute inset-1 border border-primary animate-ping" />
        </div>
        <div className="flex flex-col">
          <div className="font-mono-hud text-[8px] uppercase tracking-[0.2em] text-primary text-glow animate-pulse">
            Neural Uplink Active
          </div>
          <div className="font-mono-hud text-[6px] uppercase tracking-widest text-primary/40">
            Syncing Star Chart Data...
          </div>
        </div>
        {/* Animated small bars */}
        <div className="flex gap-0.5 items-end h-3">
          {[1, 2, 3, 4].map(i => (
            <div 
              key={i}
              className="w-0.5 bg-primary/60 animate-bounce"
              style={{ 
                height: `${20 + Math.random() * 80}%`,
                animationDuration: `${0.4 + Math.random() * 0.4}s`,
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

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

function MobileHUD({ app, onSelectBody, expanded, setExpanded }: { app: any; onSelectBody: any; expanded: boolean; setExpanded: any }) {
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
  } else if (app.view === "ship") {
    title = "Commander's Vessel";
    subtitle = "Flagship · Deep Space";
  }

  const canJump = app.view === "system" && app.system && !app.travel && 
                 app.playerSystemId !== app.system.id && 
                 app.galaxy.systems.find((s: any) => s.id === app.playerSystemId)?.gates.includes(app.system.id);

  return (
    <div className="sm:hidden fixed inset-x-2 bottom-9 z-30 pointer-events-auto">
      <div className="hud-panel hud-corner overflow-hidden flex flex-col shadow-2xl shadow-primary/10">
        <div className="flex items-center gap-2 pr-3 bg-primary/5">
          <button
            onClick={() => setExpanded((e: boolean) => !e)}
            className="flex-1 flex items-center gap-2 px-3 py-2 text-left hover:bg-primary/5 transition min-w-0"
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
          
          {canJump && (
            <button
              onClick={() => app.initiateJump(app.system.id)}
              className="shrink-0 flex items-center gap-2 bg-primary text-background px-3 py-1.5 rounded font-mono-hud font-bold text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all"
            >
              <Zap size={14} fill="currentColor" />
              JUMP
            </button>
          )}
        </div>

        {expanded && (
          <div className="border-t border-primary/20 max-h-[40vh] overflow-y-auto p-2 animate-fade-in custom-scrollbar">
            {app.view === "galaxy" && <GalaxyOverview galaxy={app.galaxy} hideHeader={true} />}
            {app.view === "system" && app.system && (
              <SystemOverview
                system={app.system}
                galaxy={app.galaxy}
                onSelectBody={onSelectBody}
                playerSystemId={app.playerSystemId}
                travel={app.travel}
                initiateJump={app.initiateJump}
                getJumpCost={app.getJumpCost}
                currentTime={app.currentTime}
                isExplored={!app.fogOfWar || app.exploredSystemIds.has(app.system.id)}
                hideHeader={true}
              />
            )}
            {app.view === "body" && app.body && (
              <BodyOverview body={app.body} galaxy={app.galaxy} hideHeader={true} />
            )}
            {app.view === "ship" && (
              <ShipOverview
                system={app.system}
                travel={app.travel}
                currentTime={app.currentTime}
                onDeselect={() => setExpanded(false)}
                hideHeader={true}
              />
            )}
          </div>
        )}
      </div>

      {/* Mobile Legend & Filters */}
      <div className="flex items-center justify-between mt-2 pointer-events-auto w-full">
        <Legend view={app.view} />
        {(app.view === "galaxy" || app.view === "system" || app.view === "body" || app.view === "ship") && (
          <FilterPanel filters={app.filters} onToggle={app.toggleFilter} view={app.view === "ship" ? "system" : app.view} />
        )}
      </div>
    </div>
  );
}

function ProfileView({ app }: { app: any }) {
  const [activeTab, setActiveTab] = useState("Overview");
  
  const TABS = [
    { label: "Overview", icon: UserIcon },
    { label: "Assets", icon: Coins },
    { label: "Reputation", icon: UsersIcon },
    { label: "Logbook", icon: Newspaper },
    { label: "Doctrines", icon: Sparkles },
  ];

  return (
    <div className="flex-1 flex flex-col sm:flex-row bg-background/40 backdrop-blur-sm animate-fade-in overflow-hidden">
      {/* Profile Sidebar — slides in from left, mirroring the info panel */}
      <aside className="w-full sm:w-[320px] border-b sm:border-b-0 sm:border-r border-primary/20 flex flex-col bg-primary/5 animate-in slide-in-from-left duration-500">
        <div className="p-6 border-b border-primary/20 flex flex-col items-center text-center gap-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-primary/30 overflow-hidden shadow-[0_0_30px_hsl(var(--primary)/0.2)]">
              <img src={app.playerAvatar} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-primary text-background font-display text-lg px-2 rounded border-2 border-background">
              {app.playerLevel}
            </div>
          </div>
          <div className="flex flex-col">
            <h2 className="font-display text-2xl text-primary text-glow uppercase tracking-[0.1em]">{app.playerName}</h2>
            <p className="font-mono-hud text-[10px] text-muted-foreground uppercase tracking-[0.3em]">Hegemony Commander</p>
          </div>
        </div>

        <nav className="flex-1 p-2 flex flex-row sm:flex-col gap-1 overflow-x-auto sm:overflow-y-auto">
          {TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label)}
              className={`flex items-center gap-3 px-4 py-3 rounded transition-all whitespace-nowrap ${
                activeTab === tab.label 
                  ? "bg-primary/20 text-primary border border-primary/40 shadow-[inset_0_0_10px_hsl(var(--primary)/0.1)]" 
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5 border border-transparent"
              }`}
            >
              <tab.icon size={18} />
              <span className="font-display text-sm uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Profile Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none scanline opacity-10" />
        
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar relative z-10">
          <div className="max-w-4xl mx-auto space-y-12">
            
            {/* Detailed Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard label="Total Net Worth" value={Math.floor(app.sc).toLocaleString()} unit="SC" icon={Coins} color="warning" />
              <StatCard label="Systems Discovered" value={app.exploredSystemIds.size} unit="SYS" icon={Globe} color="success" />
              <StatCard label="Action Potential" value={Math.floor(app.ap)} unit="AP" icon={Zap} color="primary" />
            </div>

            {/* Career Timeline Mock */}
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-primary/20" />
                <h3 className="font-display text-sm uppercase tracking-[0.3em] text-primary/60">Commander's Log</h3>
                <div className="h-px flex-1 bg-primary/20" />
              </div>
              
              <div className="space-y-4">
                <LogEntry date="3024.12.01" event="Commissioned as Hegemony Commander" type="milestone" />
                <LogEntry date="3024.12.05" event="First jump to Alpha Centauri completed" type="flight" />
                <LogEntry date="3024.12.12" event="Achieved Level 5 Command Rating" type="milestone" />
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, unit, icon: Icon, color = "primary" }: any) {
  const colorMap: any = {
    primary: "border-l-primary bg-primary/5 text-primary",
    warning: "border-l-warning bg-warning/5 text-warning",
    success: "border-l-success bg-success/5 text-success",
    destructive: "border-l-destructive bg-destructive/5 text-destructive",
  };
  const currentColors = colorMap[color] || colorMap.primary;
  return (
    <div className={`p-4 flex items-center gap-4 border-l-2 transition-all hover:scale-[1.02] bg-background/40 backdrop-blur-md shadow-2xl ${currentColors}`}>
      <div className="p-3 bg-white/5 rounded-lg shrink-0">
        <Icon size={24} />
      </div>
      <div className="flex flex-col justify-center min-w-0">
        <div className="font-mono-hud text-[9px] uppercase tracking-widest opacity-60 mb-1 truncate">{label}</div>
        <div className="flex items-baseline gap-1">
          <span className="font-display text-2xl font-bold tracking-wider truncate text-glow">{value}</span>
          <span className="font-mono-hud text-[10px] opacity-70 shrink-0">{unit}</span>
        </div>
      </div>
    </div>
  );
}

function LogEntry({ date, event, type }: any) {
  return (
    <div className="flex gap-4 items-start group">
      <div className="font-mono-hud text-[10px] text-primary/30 pt-1 w-20 shrink-0">{date}</div>
      <div className="relative pt-1 px-1">
        <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
        <div className="absolute top-2.5 left-1.5 w-[1px] h-10 bg-primary/10" />
      </div>
      <div className="flex-1 pb-4">
        <div className="font-display text-xs uppercase tracking-widest text-primary/80 group-hover:text-primary transition-colors">{event}</div>
        <div className="font-mono-hud text-[9px] uppercase tracking-tighter text-muted-foreground/60">{type}</div>
      </div>
    </div>
  );
}

export default Index;

