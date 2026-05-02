import { Suspense, useMemo, useState, useEffect, useRef, useCallback } from "react";
import * as THREE from 'three';
import { toast } from "sonner";
import { 
  ChevronUp, ChevronDown, ChevronLeft, User as UserIcon, Users as UsersIcon, Coins, 
  Newspaper, Sparkles, Globe, Zap, BarChart, TrendingUp, Shield, 
  Anchor, Cpu, BookOpen, Rocket, Award, History, Factory,
  Crown, Scale, Target, Flame, Droplets, Hexagon, Circle, Triangle, Briefcase, Star,
  Sword, Fingerprint, LayoutGrid, ShieldAlert
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useGalaxyApp, type GalaxyApp } from "@/galaxy/useGalaxyApp";
import type { StarSystem, Body, Empire } from "@/galaxy/types";
import { UnifiedMap } from "@/galaxy/components/UnifiedMap";
import { GalaxyOverview, SystemOverview, BodyOverview, ShipOverview } from "@/galaxy/components/Overview";
import { TopBar } from "@/galaxy/components/TopBar";
import { FilterPanel } from "@/galaxy/components/FilterPanel";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Legend } from "@/galaxy/components/Legend";
import { SettingsModal } from "@/galaxy/components/SettingsModal";
import { MiniMap } from "@/galaxy/components/MiniMap";
import { CommanderOnboarding } from "@/galaxy/components/CommanderOnboarding";
import { ShipCustomizer } from "@/galaxy/components/ShipCustomizer";
import { type ShipConfiguration } from "@/galaxy/shipPresets";
import { AuthScreen } from "@/galaxy/components/AuthScreen";
import { useAudio } from "@/galaxy/useAudio";
import logo from "@/assets/logo.png";

const ICON_MAP: Record<string, any> = {
  Shield, Zap, Globe, Anchor, Cpu, Award, Rocket, Star, Flame, Droplets, Target, Hexagon, Circle, Triangle, Briefcase, Crown, TrendingUp
};

const Index = () => {
  const app = useGalaxyApp(20260423);
  const { playClick, playTransition, playExpand, playCollapse, playAlert, playSuccess, playType, playNotification } = useAudio(app.audioEnabled, app.musicVolume, app.sfxVolume);

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionKey, setTransitionKey] = useState(0);
  
  // Track user interaction for audio unlocking
  const [hasInteracted, setHasInteracted] = useState(!app.onboardingCompleted);
  const [guestMode, setGuestMode] = useState(false);
  
  // Track view changes to trigger the "Processing" indicator
  useEffect(() => {
    if (transitionKey === 0) return;
    setIsTransitioning(true);
    playNotification();
    const timer = setTimeout(() => setIsTransitioning(false), 1200);
    return () => clearTimeout(timer);
  }, [transitionKey, playNotification]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobilePanelExpanded, setIsMobilePanelExpanded] = useState(false);
  const [graphicsQuality, setGraphicsQuality] = useState<"low" | "medium" | "high">(() => {
    return (localStorage.getItem("gfx_quality") as "low" | "medium" | "high") || "high";
  });

  useEffect(() => {
    localStorage.setItem("gfx_quality", graphicsQuality);
  }, [graphicsQuality]);

  // Cinematic view transitions with loading state deferral
  // This ensures the "Processing" HUD paints before the heavy React render blocks the thread
  // Cinematic view transitions with loading state deferral
  // This ensures the "Processing" HUD paints before the heavy React render blocks the thread
  const withLoading = useCallback(<T extends unknown[]>(fn: (...args: T) => void) => (...args: T) => {
    setTransitionKey(prev => prev + 1);
    requestAnimationFrame(() => {
      setTimeout(() => fn(...args), 60);
    });
  }, []);

  const handleSelectEmpire = useCallback(withLoading((id: string) => {
    playTransition();
    app.setSelectedEmpireId(id);
    app.setPage("empire");
  }), [withLoading, playTransition, app]);

  const { 
    openSystem, backToGalaxy, backToSystem, openBody, openShip, 
    galaxy, fogOfWar, exploredSystemIds, setPage, 
    setPlayerName, setPlayerAvatar, setOnboardingCompleted
  } = app;

  const handleSelectSystem = useCallback(withLoading((id: string) => {
    playTransition();
    app.selectSystem(id);
  }), [withLoading, playTransition, app.selectSystem]);

  const handleEnterSystem = useCallback(withLoading((id: string) => {
    playTransition();
    app.openSystem(id);
  }), [withLoading, playTransition, app.openSystem]);

  const handleBackToGalaxy = useCallback(withLoading(() => {
    playTransition();
    app.backToGalaxy();
    app.selectSystem(null); // Clear selection when going back to full galaxy view
  }), [withLoading, playTransition, app.backToGalaxy, app.selectSystem]);

  const handleBackToSystem = useCallback(withLoading(() => {
    playTransition();
    backToSystem();
  }), [withLoading, playTransition, backToSystem]);

  const handleSystemBodyClick = useCallback(withLoading((id: string) => {
    playClick();
    if (id.startsWith("gate:")) {
      openSystem(id.slice(5));
    } else if (id === "ship") {
      openShip();
    } else {
      // Restriction: Only open body details if system is explored or if it's the player's current system
      const system = galaxy.systems.find(s => s.bodies.some(b => b.id === id));
      const isSystemExplored = system ? (!fogOfWar || exploredSystemIds.has(system.id)) : true;

      if (isSystemExplored) {
        openBody(id);
      } else {
        playAlert();
        toast.error("Telemetry Corrupted", {
          description: "System coordinates unverified. Neural link unable to resolve surface telemetry."
        });
      }
    }
  }), [withLoading, playClick, playAlert, openSystem, openShip, openBody, galaxy, fogOfWar, exploredSystemIds]);

  const handleOnboardingComplete = (name: string, avatar: string, shipConfig: ShipConfiguration) => {
    setPlayerName(name);
    setPlayerAvatar(avatar);
    app.setShipConfig(shipConfig);
    setOnboardingCompleted(true);
    setHasInteracted(true);
    
    // Resume Web Audio Context for Three.js Positional Audio
    if (THREE.AudioContext.getContext().state === 'suspended') {
      THREE.AudioContext.getContext().resume();
    }
  };

  const circles = useMemo(() => app.systemMatchesFilter, [app]);

  // Page transition
  const [pageKey, setPageKey] = useState(0);
  const [scanning, setScanning] = useState(false);
  const prevPage = useRef(app.page);
  const navigateTo = (page: "map" | "profile" | "articles" | "factories" | "fleets" | "party" | "skills", extra?: () => void) => {
    if (page === prevPage.current && !extra) return;
    setScanning(true);
    setTimeout(() => {
      if (page !== prevPage.current) { app.setPage(page); prevPage.current = page; setPageKey(k => k + 1); }
      extra?.();
      setScanning(false);
    }, 200);
  };

  const isGameReady = (app.user || guestMode) && app.onboardingCompleted;

  return (
    <main className="relative flex flex-col h-screen w-screen overflow-hidden bg-background">
      {/* Game Content — only mounted after auth + onboarding complete to avoid
          loading the heavy WebGL canvas and galaxy generation during auth flows. */}
      <AnimatePresence>
        {isGameReady && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="flex flex-col h-full w-full absolute inset-0"
          >
        {scanning && (
          <div className="fixed inset-0 z-[200] pointer-events-none" style={{ background: "linear-gradient(90deg,transparent 0%,hsl(var(--primary)/0.18) 50%,transparent 100%)", animation: "scan-wipe 0.4s ease-in-out both", transformOrigin: "left center" }} />
        )}
        {/* Top persistent navigation bar spanning whole width */}
      <div className="relative z-50">
        <TopBar
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenProfile={() => navigateTo("profile")}
          onOpenMap={() => navigateTo("map")}
          onOpenArticles={() => navigateTo("articles")}
          onOpenFactories={() => navigateTo("factories")}
          onOpenFleets={() => navigateTo("fleets")}
          onOpenParty={() => navigateTo("party")}
          onOpenSkills={() => navigateTo("skills")}
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
          playerSystemName={app.galaxy.systemById[app.playerSystemId]?.name}
          travel={app.travel}
          arrival={app.arrival}
          currentTime={app.currentTime}
          galaxy={app.galaxy}
          onRegenerate={app.regenerateGalaxy}
          onReset={app.resetGalaxy}
          onSetAp={app.setAp}
          onPlayClick={playClick}
          isGameReady={isGameReady}
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
                    onSelectSystem={handleSelectSystem}
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
                    shipConfig={app.shipConfig}
                    fxVolume={app.audioEnabled ? app.fxVolume : 0}
                  />
                </Suspense>
              </div>
              
              {!isTransitioning && (
                <MiniMap 
                  galaxy={app.galaxy} 
                  currentSystem={app.system} 
                  playerSystemId={app.playerSystemId} 
                  view={app.view}
                  knownSystemIds={app.knownSystemIds}
                  fogOfWar={app.fogOfWar}
                  onToggle={(exp) => exp ? playExpand() : playCollapse()}
                />
              )}

              <DataProcessingIndicator isBusy={isTransitioning} />

              <div className="absolute top-0 right-0 bottom-0 left-0 pointer-events-none z-[100]">
                 <Sonner />
              </div>

              {/* HUD Overlay within Map (Bottom Controls) */}
              <div className="relative z-20 flex flex-col h-full pointer-events-none">
                <div className="flex-1" />

                {/* Bottom Controls cluster — desktop only (mobile gets its own bar below) */}
                <div className="hidden sm:flex p-2 items-end justify-between w-full">
                  <Legend 
                    view={app.view} 
                    onPlayClick={playClick} 
                    onPlayExpand={playExpand} 
                    onPlayCollapse={playCollapse} 
                  />
                  {(app.view === "galaxy" || app.view === "system" || app.view === "body" || app.view === "ship") && (
                    <FilterPanel 
                      filters={app.filters} 
                      onToggle={app.toggleFilter} 
                      view={app.view === "ship" ? "system" : app.view} 
                      onPlayClick={playClick}
                      onPlayExpand={playExpand}
                      onPlayCollapse={playCollapse}
                    />
                  )}
                </div>
              </div>
            </div>

            <aside className="hidden sm:flex w-[380px] h-full flex-col hud-panel border-l border-primary/20 z-40 animate-in slide-in-from-right duration-500">
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {app.view === "galaxy" && (
                  app.system ? (
                    <SystemOverview 
                      system={app.system} 
                      galaxy={app.galaxy} 
                      onSelectBody={handleSystemBodyClick}
                      playerSystemId={app.playerSystemId}
                      travel={app.travel}
                      arrival={app.arrival}
                      initiateJump={app.initiateJump}
                      getJumpCost={app.getJumpCost}
                      currentTime={app.currentTime}
                      isExplored={!app.fogOfWar || app.exploredSystemIds.has(app.system.id)}
                      onPlayClick={playClick}
                      onSelectEmpire={handleSelectEmpire}
                      onEnterSystem={() => handleEnterSystem(app.system!.id)}
                    />
                  ) : (
                    <GalaxyOverview galaxy={app.galaxy} />
                  )
                )}
                {app.view === "system" && app.system && (
                  <SystemOverview 
                    system={app.system} 
                    galaxy={app.galaxy} 
                    onSelectBody={handleSystemBodyClick}
                    playerSystemId={app.playerSystemId}
                    travel={app.travel}
                    arrival={app.arrival}
                    initiateJump={app.initiateJump}
                    getJumpCost={app.getJumpCost}
                    currentTime={app.currentTime}
                    isExplored={!app.fogOfWar || app.exploredSystemIds.has(app.system.id)}
                    onPlayClick={playClick}
                    onSelectEmpire={handleSelectEmpire}
                  />
                )}
                {app.view === "body" && app.body && app.system && (
                    <BodyOverview 
                      body={app.body} 
                      galaxy={app.galaxy} 
                      isExplored={!app.fogOfWar || app.exploredSystemIds.has(app.system.id)}
                      onPlayClick={playClick}
                      onSelectEmpire={handleSelectEmpire}
                    />
                )}
                {app.view === "ship" && (
                  <ShipOverview
                    system={app.system}
                    travel={app.travel}
                    arrival={app.arrival}
                    currentTime={app.currentTime}
                    onDeselect={handleBackToSystem}
                    onPlayClick={playClick}
                  />
                )}
              </div>
            </aside>
          </>
          ) : app.page === "profile" ? (
            <ProfileView app={app} onPlayClick={playClick} />
          ) : app.page === "empire" ? (
            <EmpireView app={app} onPlayClick={playClick} />
          ) : (
            <div className={`flex-1 bg-background/40 backdrop-blur-sm p-4 ${app.page === 'shipyard' ? 'sm:p-4' : 'sm:p-12'} custom-scrollbar animate-in slide-in-from-bottom-2 duration-500 flex flex-col ${app.page === 'shipyard' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
               <div className={`max-w-6xl mx-auto w-full flex flex-col ${app.page === 'shipyard' ? 'flex-1 min-h-0 h-full' : 'space-y-12 pb-24'}`}>
                  {app.page !== 'shipyard' && (
                    <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-primary/20 pb-10">
                     <div className="flex items-center gap-5">
                        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg shadow-[0_0_20px_hsl(var(--primary)/0.1)]">
                           {app.page === "articles" && <Newspaper size={32} className="text-primary" />}
                           {app.page === "factories" && <Factory size={32} className="text-primary" />}
                           {app.page === "fleets" && <Rocket size={32} className="text-primary" />}
                           {app.page === "party" && <UsersIcon size={32} className="text-primary" />}
                           {app.page === "skills" && <Sparkles size={32} className="text-primary" />}
                        </div>
                        <div>
                           <h1 className="font-display text-2xl sm:text-4xl text-primary text-glow uppercase tracking-[0.2em]">
                              {app.page === "articles" && "Communication Hub"}
                              {app.page === "factories" && "Industrial Complex"}
                              {app.page === "fleets" && "Strategic Command"}
                              {app.page === "party" && "Political Center"}
                              {app.page === "skills" && "Neural Uplink"}
                           </h1>
                           <p className="font-mono-hud text-[10px] sm:text-xs text-muted-foreground uppercase tracking-[0.3em] mt-2">
                              {app.page === "articles" && "Hegemony Information Service"}
                              {app.page === "factories" && "Production & Supply Chain Management"}
                              {app.page === "fleets" && "Fleet Deployment & Logistics"}
                              {app.page === "party" && "Internal Relations & Governance"}
                              {app.page === "skills" && "Tier 4 Doctrine Training"}
                           </p>
                        </div>
                     </div>
                     <button 
                       onClick={() => withLoading(app.setPage)("map")}
                       className="px-4 py-2 bg-primary/10 border border-primary/30 text-primary font-display text-[10px] uppercase tracking-widest hover:bg-primary/20 transition-all rounded"
                     >
                       Return to Map
                     </button>
                   </header>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     <div className="lg:col-span-2 space-y-8">
                        {app.page === "articles" && (
                          <div className="space-y-6">
                            {[
                              { title: "He-3 Output Record Reached", date: "3024.12.18", author: "Ministry of Industry", excerpt: "New extraction techniques at the Centauri Alpha hub have resulted in a 40% increase in fuel refinement efficiency.", category: "Economy" },
                              { title: "Jump Gate Maintenance Scheduled", date: "3024.12.17", author: "Hegemony Transport", excerpt: "Fleet admirals warn of brief FTL delays as core stabilizers undergo bi-annual calibration.", category: "Logistics" },
                              { title: "Economic Shift: SC Value Rises", date: "3024.12.15", author: "Central Bank", excerpt: "The Standard Credit has strengthened against local outer-rim currencies following the latest resource reports.", category: "Finance" },
                              { title: "Sector 7 Border Tensions", date: "3024.12.12", author: "Imperial Intelligence", excerpt: "Unidentified signatures detected near the nebula rim. Border patrol presence increased in adjacent systems.", category: "Security" }
                            ].map((article, i) => (
                              <article key={i} className="hud-panel p-6 border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer group">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center gap-3">
                                    <span className="font-mono-hud text-[10px] text-primary/60">{article.date}</span>
                                    <span className="px-1.5 py-0.5 bg-primary/10 text-primary font-mono-hud text-[8px] rounded border border-primary/20 uppercase">{article.category}</span>
                                  </div>
                                  <span className="font-mono-hud text-[10px] text-muted-foreground">{article.author}</span>
                                </div>
                                <h3 className="font-display text-lg text-primary group-hover:text-glow transition-all uppercase tracking-wider mb-2">{article.title}</h3>
                                <p className="font-mono-hud text-xs text-muted-foreground leading-relaxed italic">"{article.excerpt}"</p>
                                <div className="mt-4 flex items-center gap-2">
                                  <div className="h-px flex-1 bg-primary/10" />
                                  <span className="font-display text-[8px] text-primary tracking-[0.2em] uppercase opacity-60 group-hover:opacity-100 transition-opacity">Read Full Transmission</span>
                                  <div className="h-px w-4 bg-primary/20" />
                                </div>
                              </article>
                            ))}
                          </div>
                        )}

                        {app.page === "factories" && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              <StatCard label="Total Output" value={142} unit="MT/H" icon={BarChart} color="primary" />
                              <StatCard label="Efficiency" value={98} unit="%" icon={TrendingUp} color="success" />
                              <StatCard label="Active Lines" value={12} unit="" icon={Zap} color="primary" />
                            </div>
                            <div className="hud-panel border border-primary/20 bg-primary/5 overflow-hidden">
                              <div className="p-4 border-b border-primary/20 bg-primary/10 flex justify-between items-center">
                                <h3 className="font-display text-xs uppercase tracking-widest text-primary">Active Facilities</h3>
                                <button className="font-mono-hud text-[10px] text-primary hover:underline uppercase">Manage All</button>
                              </div>
                              <table className="w-full text-left border-collapse">
                                <thead className="bg-primary/5">
                                  <tr>
                                    <th className="p-4 font-display text-[9px] uppercase tracking-widest text-muted-foreground">Facility</th>
                                    <th className="p-4 font-display text-[9px] uppercase tracking-widest text-muted-foreground text-center">Load</th>
                                    <th className="p-4 font-display text-[9px] uppercase tracking-widest text-muted-foreground text-center">Status</th>
                                    <th className="p-4 font-display text-[9px] uppercase tracking-widest text-muted-foreground text-right">Yield</th>
                                  </tr>
                                </thead>
                                <tbody className="font-mono-hud text-[10px] uppercase">
                                  {[
                                    { name: "Centauri Mine Alpha", load: 85, status: "Active", yield: "4.2 He-3/h" },
                                    { name: "Rigel Silicate Works", load: 0, status: "Idle", yield: "0.0 Si/h" },
                                    { name: "Nebula Refinery IV", load: 92, status: "Active", yield: "12.8 Fuel/h" },
                                    { name: "Sanctum Fabricator", load: 45, status: "Active", yield: "2.1 Units/h" }
                                  ].map((facility, i) => (
                                    <tr key={i} className="border-b border-primary/10 hover:bg-white/5 transition-colors group">
                                      <td className="p-4 font-display text-[11px] text-primary group-hover:text-glow">{facility.name}</td>
                                      <td className="p-4 text-center">
                                        <div className="w-16 h-1 w-full bg-primary/10 rounded-full mx-auto overflow-hidden">
                                          <div className="h-full bg-primary" style={{ width: `${facility.load}%` }} />
                                        </div>
                                      </td>
                                      <td className={`p-4 text-center ${facility.status === "Active" ? "text-success" : "text-muted-foreground opacity-50"}`}>
                                        {facility.status}
                                      </td>
                                      <td className="p-4 text-right text-primary/80">{facility.yield}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {app.page === "fleets" && (
                          <div className="space-y-6">
                            <div className="flex justify-between items-center mb-4">
                              <div className="space-y-1">
                                <h3 className="font-display text-xs uppercase tracking-[0.2em] text-primary/60">Fleet Manifest</h3>
                                <p className="font-mono-hud text-[8px] text-muted-foreground uppercase">Strategic Deployment & Vessel Customization</p>
                              </div>
                              <button 
                                onClick={() => { playClick(); app.setPage("shipyard"); }}
                                className="px-6 py-2.5 border-2 border-primary bg-primary/10 text-primary font-mono-hud text-[11px] uppercase tracking-[0.2em] hover:bg-primary hover:text-background transition-all shadow-[0_0_20px_hsl(var(--primary)/0.2)] flex items-center gap-2 group"
                              >
                                <Rocket size={14} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                                <span>Shipyard Registry</span>
                              </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                              {[
                                { label: "Total Ships", val: "14" },
                                { label: "Capital Ships", val: "2" },
                                { label: "Escorts", val: "8" },
                                { label: "Auxiliary", val: "4" }
                              ].map(s => (
                                <div key={s.label} className="hud-panel p-3 border border-primary/10 bg-primary/5 text-center">
                                  <div className="text-xl font-display text-primary">{s.val}</div>
                                  <div className="text-[8px] font-mono-hud text-muted-foreground uppercase mt-1">{s.label}</div>
                                </div>
                              ))}
                            </div>
                            
                            <div className="space-y-4">
                              {[
                                { name: "HGV-01 VANGUARD", class: "Swift-Class Explorer", status: "Stationary", pos: "Sanctum 11", hull: 100, shield: 100 },
                                { name: "HGV-02 SENTINEL", class: "Aegis-Class Defender", status: "Patrolling", pos: "Inner Ring", hull: 92, shield: 85 },
                                { name: "HGV-08 BROADSWORD", class: "Hammer-Class Corvette", status: "Docked", pos: "Centauri Hub", hull: 100, shield: 100 }
                              ].map((ship, i) => (
                                <div key={i} className="hud-panel p-6 border border-primary/20 bg-primary/5 flex flex-col sm:flex-row items-center gap-6 group hover:border-primary/40 transition-all">
                                  <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-all">
                                    <Rocket size={36} className="text-primary/40 group-hover:text-primary/60" />
                                  </div>
                                  <div className="flex-1 w-full">
                                    <div className="flex justify-between items-start mb-4">
                                      <div>
                                        <h4 className="font-display text-lg text-primary tracking-widest group-hover:text-glow">{ship.name}</h4>
                                        <p className="font-mono-hud text-[10px] text-muted-foreground uppercase">{ship.class}</p>
                                      </div>
                                      <span className="font-mono-hud text-[8px] bg-primary text-background px-2 py-0.5 rounded font-bold uppercase tracking-widest">{ship.status}</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                      <div className="space-y-2">
                                        <div className="flex justify-between items-center text-[9px] font-mono-hud">
                                          <span className="text-muted-foreground uppercase">Hull Integrity</span>
                                          <span className="text-foreground">{ship.hull}%</span>
                                        </div>
                                        <div className="h-1 bg-primary/10 rounded-full overflow-hidden">
                                          <div className="h-full bg-success" style={{ width: `${ship.hull}%` }} />
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <div className="flex justify-between items-center text-[9px] font-mono-hud">
                                          <span className="text-muted-foreground uppercase">Shield Strength</span>
                                          <span className="text-foreground">{ship.shield}%</span>
                                        </div>
                                        <div className="h-1 bg-primary/10 rounded-full overflow-hidden">
                                          <div className="h-full bg-cyan-400" style={{ width: `${ship.shield}%` }} />
                                        </div>
                                      </div>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between">
                                      <span className="font-mono-hud text-[9px] text-muted-foreground uppercase tracking-widest">Current Sector: <span className="text-primary">{ship.pos}</span></span>
                                      <button className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary font-mono-hud text-[9px] uppercase tracking-widest hover:bg-primary/20 transition-all">Open Helm</button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {app.page === "shipyard" && (
                          <div className="space-y-4 flex-1 flex flex-col min-h-0">
                            <div className="flex justify-between items-center mb-2 shrink-0">
                              <div className="space-y-1">
                                <h3 className="font-display text-xl text-primary tracking-[0.3em] uppercase text-glow">Orbital Drydock</h3>
                                <p className="font-mono-hud text-[10px] text-muted-foreground uppercase tracking-widest">Flagship Refit & Hull Calibration Module</p>
                              </div>
                              <button 
                                onClick={() => { playClick(); app.setPage("fleets"); }}
                                className="px-4 py-2 border border-primary/20 bg-primary/5 text-primary font-mono-hud text-[10px] uppercase tracking-widest hover:border-primary/60 hover:bg-primary/10 transition-all flex items-center gap-2"
                              >
                                <span>← Return to Command</span>
                              </button>
                            </div>
                            <div className="flex-1 min-h-0">
                              <ShipCustomizer 
                                config={app.shipConfig} 
                                onChange={app.setShipConfig} 
                                playClick={playClick} 
                              />
                            </div>
                          </div>
                        )}

                        {app.page === "skills" && (
                          <div className="space-y-8">
                             <div className="hud-panel p-8 border border-primary/20 bg-primary/5">
                               <div className="flex justify-between items-center mb-10">
                                  <h3 className="font-display text-xs uppercase tracking-[0.2em] text-primary">Doctrine Progress</h3>
                                  <div className="font-mono-hud text-[10px] text-primary">Available SP: <span className="text-lg font-display ml-2">24</span></div>
                               </div>
                               <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 relative pb-4">
                                  {[
                                    { label: "Navigation", level: 4, max: 10, icon: Globe, color: "text-cyan-400" },
                                    { label: "Extraction", level: 2, max: 10, icon: Factory, color: "text-warning" },
                                    { label: "Logistics", level: 7, max: 10, icon: Rocket, color: "text-primary" },
                                    { label: "Governance", level: 1, max: 10, icon: UsersIcon, color: "text-success" }
                                  ].map((skill, i) => {
                                    const Icon = skill.icon;
                                    return (
                                      <div key={skill.label} className="flex flex-col items-center gap-4 group">
                                        <div className="w-16 h-16 rounded-full border-2 border-primary/20 flex items-center justify-center relative group-hover:border-primary/40 transition-all">
                                          <Icon size={24} className={`${skill.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
                                          <div className="absolute -top-3 -right-3 bg-primary text-background text-[11px] font-bold h-7 w-7 flex items-center justify-center rounded-full shadow-[0_0_10px_hsl(var(--primary)/0.4)]">
                                            {skill.level}
                                          </div>
                                          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                                            <circle 
                                              cx="50" cy="50" r="48" 
                                              fill="none" 
                                              stroke="currentColor" 
                                              strokeWidth="2" 
                                              className="text-primary/10"
                                            />
                                            <circle 
                                              cx="50" cy="50" r="48" 
                                              fill="none" 
                                              stroke="currentColor" 
                                              strokeWidth="3" 
                                              strokeDasharray={`${(skill.level / skill.max) * 301} 301`}
                                              className="text-primary"
                                            />
                                          </svg>
                                        </div>
                                        <span className="font-mono-hud text-[10px] uppercase tracking-widest text-muted-foreground text-center line-clamp-1">{skill.label}</span>
                                      </div>
                                    );
                                  })}
                               </div>
                               <div className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded text-center">
                                  <p className="font-mono-hud text-[10px] text-primary uppercase tracking-[0.2em]">Next Milestone: Tier 5 Master Doctrine</p>
                               </div>
                             </div>

                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {[
                                  { name: "Orbital Striker", desc: "Unlock tactical planetary strike capability from orbit. Increases military projection in contested systems by 40%.", cost: "15 SP", req: "Logistics IV" },
                                  { name: "Singularity Core", desc: "Reduces FTL cooldown by 40% across the fleet. Essential for rapid response across multiple sectors.", cost: "12 SP", req: "Navigation III" },
                                  { name: "AI Extraction Bot", desc: "Automated He-3 harvesting drones. Increases passive resource generation by 15% even in remote stations.", cost: "10 SP", req: "Extraction II" },
                                  { name: "Hegemony Diploma", desc: "Advanced training in imperial bureaucracy. Reduces colony upkeep costs and increases stability.", cost: "8 SP", req: "Governance I" }
                                ].map((perk, i) => (
                                  <div key={i} className="hud-panel p-6 border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                      <h4 className="font-display text-xs text-primary uppercase tracking-widest">{perk.name}</h4>
                                      <span className="font-mono-hud text-[8px] text-muted-foreground uppercase">{perk.req}</span>
                                    </div>
                                    <p className="font-mono-hud text-[10px] text-muted-foreground mb-6 uppercase leading-relaxed text-balance">{perk.desc}</p>
                                    <button className="w-full py-2 border border-primary/30 text-primary font-mono-hud text-[10px] uppercase tracking-widest hover:bg-primary/20 transition-all shadow-[0_0_15px_hsl(var(--primary)/0.1)]">Unlock for {perk.cost}</button>
                                  </div>
                                ))}
                             </div>
                          </div>
                        )}

                        {app.page === "party" && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="hud-panel p-6 border border-primary/20 bg-primary/5">
                                <h3 className="font-display text-[10px] uppercase tracking-widest text-primary mb-6">Current Affiliation</h3>
                                <div className="flex items-center gap-6 p-4 border border-primary/10 bg-primary/5 rounded">
                                  <div className="w-16 h-16 bg-primary/20 border border-primary/30 rounded-full flex items-center justify-center">
                                    <UsersIcon size={32} className="text-primary" />
                                  </div>
                                  <div>
                                    <h4 className="font-display text-lg text-primary tracking-widest uppercase">Independent</h4>
                                    <p className="font-mono-hud text-[10px] text-muted-foreground uppercase mt-1">Status: Unaffiliated</p>
                                  </div>
                                </div>
                                <div className="mt-8 space-y-4">
                                  <div className="flex justify-between items-center text-[10px] font-mono-hud">
                                    <span className="text-muted-foreground uppercase">Political Favor</span>
                                    <span className="text-primary">Neutral (0)</span>
                                  </div>
                                  <div className="h-1.5 bg-primary/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: "50%" }} />
                                  </div>
                                </div>
                              </div>
                              
                              <div className="hud-panel p-6 border border-primary/20 bg-primary/5">
                                <h3 className="font-display text-[10px] uppercase tracking-widest text-primary mb-6">Council Decisions</h3>
                                <div className="space-y-4">
                                  {[
                                    { vote: "Prop 382: Fuel Taxation", date: "3024.11.22", res: "Passed" },
                                    { vote: "Prop 391: Sector 4 Relief", date: "3024.11.18", res: "Failed" }
                                  ].map((v, i) => (
                                    <div key={i} className="p-3 border border-primary/10 bg-primary/5 rounded flex justify-between items-center">
                                      <div>
                                        <div className="font-display text-[10px] text-foreground tracking-widest uppercase">{v.vote}</div>
                                        <div className="font-mono-hud text-[8px] text-muted-foreground mt-1">{v.date}</div>
                                      </div>
                                      <span className={`font-mono-hud text-[8px] uppercase ${v.res === "Passed" ? "text-success" : "text-destructive"}`}>{v.res}</span>
                                    </div>
                                  ))}
                                  <button className="w-full py-2 border border-primary/20 text-muted-foreground font-mono-hud text-[10px] uppercase tracking-widest hover:text-primary transition-all">View All Propositions</button>
                                </div>
                              </div>
                            </div>

                            <div className="hud-panel p-12 border border-primary/20 bg-primary/5 text-center relative overflow-hidden group">
                               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.03)_0%,transparent_70%)]" />
                               <UsersIcon size={48} className="text-primary mx-auto mb-6 opacity-30 group-hover:scale-110 transition-transform duration-500" />
                               <h3 className="font-display text-xl text-primary tracking-widest mb-4 uppercase">Political Influence Restricted</h3>
                               <p className="font-mono-hud text-xs text-muted-foreground max-w-sm mx-auto uppercase leading-loose text-balance">
                                 Membership in the Hegemony Strategic Council is currently by invitation only. 
                                 Maintain a Level 20 command rating and 15,000+ favor for evaluation by the Inner Sanctum.
                               </p>
                               <div className="mt-8 flex justify-center gap-1 opacity-20">
                                 {[...Array(8)].map((_, i) => <div key={i} className="w-8 h-1 bg-primary" />)}
                               </div>
                            </div>
                          </div>
                        )}

                        {!["articles", "factories", "fleets", "skills", "party"].includes(app.page) && (
                          <div className="hud-panel p-12 border border-primary/20 bg-primary/5 flex flex-col items-center justify-center text-center gap-6 relative overflow-hidden">
                             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.05)_0%,transparent_70%)]" />
                             <div className="w-16 h-16 rounded-full border border-primary/40 flex items-center justify-center animate-pulse">
                                <Cpu size={32} className="text-primary/60" />
                             </div>
                             <div className="space-y-4 relative z-10 max-w-sm">
                                <h2 className="font-display text-lg uppercase tracking-widest text-primary">Terminal Access restricted</h2>
                                <p className="font-mono-hud text-[10px] text-muted-foreground leading-relaxed uppercase opacity-80">
                                   Your current security clearance level allows read-only access to this terminal. 
                                   Interactive controls are currently restricted by Hegemony High Command.
                                </p>
                             </div>
                          </div>
                        )}
                     </div>
                     
                     <div className="space-y-6">
                        <div className="hud-panel p-6 border border-primary/20 bg-primary/5">
                           <h3 className="font-display text-xs uppercase tracking-[0.2em] text-primary mb-6">Service Status</h3>
                           <div className="space-y-4">
                              <div className="flex justify-between items-center py-2 border-b border-primary/10">
                                 <span className="font-mono-hud text-[10px] text-muted-foreground uppercase">Connection</span>
                                 <span className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                    <span className="font-mono-hud text-[10px] text-success uppercase">Synced</span>
                                 </span>
                              </div>
                              <div className="flex justify-between items-center py-2 border-b border-primary/10">
                                 <span className="font-mono-hud text-[10px] text-muted-foreground uppercase">Latency</span>
                                 <span className="font-mono-hud text-[10px] text-primary">12ms</span>
                              </div>
                              <div className="flex justify-between items-center py-2">
                                 <span className="font-mono-hud text-[10px] text-muted-foreground uppercase">Encryption</span>
                                 <span className="font-mono-hud text-[10px] text-warning uppercase">AES-GCM-4096</span>
                              </div>
                           </div>
                        </div>

                        <div className="hud-panel p-6 border border-primary/20 bg-primary/5">
                           <h3 className="font-display text-xs uppercase tracking-[0.2em] text-primary mb-6">Terminal Logs</h3>
                           <div className="space-y-3 font-mono-hud text-[8px] text-muted-foreground uppercase">
                              <div className="flex gap-2">
                                 <span className="text-primary">[OK]</span>
                                 <span>Neural Link Stabilized</span>
                              </div>
                              <div className="flex gap-2">
                                 <span className="text-primary">[OK]</span>
                                 <span>Query Handshake Success</span>
                              </div>
                              <div className="flex gap-2">
                                 <span className="text-warning">[WRN]</span>
                                 <span>Sub-optimal FTL Bandwidth</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
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
          <span>S-Time: <span className="text-primary/60">{new Date(app.currentTime).toISOString().slice(11, 19)} GMT</span></span>
        </div>
      </footer>

      {/* Overlays */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        quality={graphicsQuality}
        setQuality={setGraphicsQuality}
        audioEnabled={app.audioEnabled}
        setAudioEnabled={app.setAudioEnabled}
        musicVolume={app.musicVolume}
        setMusicVolume={app.setMusicVolume}
        sfxVolume={app.sfxVolume}
        setSfxVolume={app.setSfxVolume}
        fxVolume={app.fxVolume}
        setFxVolume={app.setFxVolume}
        onPlayClick={playClick}
      />

      {/* Mobile Tactical Panel Overlay */}
      {app.page === "map" && (
        <MobileHUD 
          app={app} 
          onSelectBody={handleSystemBodyClick} 
          onBackToGalaxy={handleBackToGalaxy}
          onBackToSystem={handleBackToSystem}
          onPlayClick={playClick}
          onPlayExpand={playExpand}
          onPlayCollapse={playCollapse}
          expanded={isMobilePanelExpanded} 
          setExpanded={setIsMobilePanelExpanded} 
          onSelectEmpire={handleSelectEmpire}
          onEnterSystem={() => handleEnterSystem(app.system?.id || "")}
        />
      )}
    </motion.div>
    )}
    </AnimatePresence>

      {/* Screen Overlays */}
      <AnimatePresence>
        {/* Onboarding Screen - Overlay everything */}
        {!app.onboardingCompleted && (guestMode || app.user) && (
          <motion.div 
            key="onboarding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 z-[200]"
          >
            <CommanderOnboarding 
              onComplete={handleOnboardingComplete} 
              playClick={playClick}
              playSuccess={playSuccess}
              playType={playType}
            />
          </motion.div>
        )}

        {/* Authentication Screen - Priority 1 */}
        {!app.user && !guestMode && !app.sessionLoading && (
          <motion.div 
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 z-[300]"
          >
            <AuthScreen 
              onSuccess={() => setGuestMode(true)} 
              playClick={playClick}
              playSuccess={playSuccess}
            />
          </motion.div>
        )}

        {/* Welcome Screen for returning users to unlock Audio Context */}
        {app.onboardingCompleted && !hasInteracted && (
          <motion.div 
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[200]"
          >
            <WelcomeScreen 
              playerName={app.playerName} 
              onEnter={() => {
                setHasInteracted(true);
                playSuccess();
                // Resume Web Audio Context for Three.js Positional Audio
                if (THREE.AudioContext.getContext().state === 'suspended') {
                  THREE.AudioContext.getContext().resume();
                }
              }} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

function WelcomeScreen({ playerName, onEnter }: { playerName: string; onEnter: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in duration-500">
      <div className="relative p-1">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 animate-scan pointer-events-none" />
        <button 
          onClick={onEnter}
          className="hud-panel p-8 md:p-12 border border-primary/40 bg-black/60 hover:bg-primary/10 transition-colors flex flex-col items-center gap-6 group cursor-pointer w-[300px] md:w-[400px]"
        >
          <div className="w-16 h-16 rounded-full border border-primary flex items-center justify-center bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Zap className="text-primary w-8 h-8 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="font-display text-2xl md:text-3xl text-primary text-glow uppercase tracking-[0.2em] pointer-events-none">
              Uplink Ready
            </h2>
            <p className="font-mono-hud text-[10px] md:text-xs tracking-widest text-primary/60 uppercase pointer-events-none">
              Welcome back, Commander {playerName}
            </p>
          </div>
          
          <div className="mt-4 w-full px-8 py-3 border border-primary/30 bg-primary/5 group-hover:bg-primary/20 transition-colors font-display tracking-[0.3em] uppercase text-sm text-primary text-glow animate-pulse text-center">
            Initialize
          </div>
        </button>
      </div>
    </div>
  );
}

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

function MobileHUD({ 
  app, 
  onSelectBody, 
  onBackToGalaxy,
  onBackToSystem,
  onPlayClick,
  onPlayExpand,
  onPlayCollapse,
  expanded, 
  setExpanded,
  onSelectEmpire,
  onEnterSystem
}: { 
  app: GalaxyApp; 
  onSelectBody: (id: string) => void; 
  onBackToGalaxy: () => void;
  onBackToSystem: () => void;
  onPlayClick: () => void;
  onPlayExpand: () => void;
  onPlayCollapse: () => void;
  expanded: boolean; 
  setExpanded: (v: boolean) => void;
  onSelectEmpire: (id: string) => void;
  onEnterSystem: () => void;
}) {
  useEffect(() => {
    setExpanded(false);
  }, [app.view, app.system?.id, app.body?.id, setExpanded]);

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
                 app.galaxy.systems.find((s) => s.id === app.playerSystemId)?.gates.some((g) => g.targetSystemId === app.system.id);

  const canEnterSystem = app.view === "galaxy" && app.system !== null;

  return (
    <div className="sm:hidden fixed inset-x-2 bottom-9 z-30 pointer-events-auto">
      <div className="hud-panel hud-corner overflow-hidden flex flex-col shadow-2xl shadow-primary/10">
        <div className="flex items-center gap-2 pr-3 bg-primary/5">
          <button
            onClick={() => {
              const next = !expanded;
              setExpanded(next);
              if (next) onPlayExpand();
              else onPlayCollapse();
            }}
            className="flex-1 flex flex-col justify-center px-3 py-2 text-left hover:bg-primary/5 transition min-w-0"
            aria-label={expanded ? "Collapse panel" : "Expand panel"}
          >
            <div className="font-mono-hud text-[9px] uppercase tracking-[0.3em] text-primary/70 truncate w-full">
              {subtitle}
            </div>
            <div className="font-display text-sm uppercase tracking-[0.15em] text-primary text-glow truncate w-full">
              {title}
            </div>
          </button>
          
          {canEnterSystem && (
            <button
              onClick={() => {
                onEnterSystem();
                onPlayClick();
              }}
              className="shrink-0 flex items-center gap-1.5 bg-primary/20 text-primary border border-primary/50 px-3 py-1.5 rounded font-mono-hud font-bold text-[9px] tracking-widest hover:bg-primary/30 active:scale-95 transition-all"
            >
              <Target size={14} />
              ENTER
            </button>
          )}

          {canJump && (
            <button
              onClick={() => {
                app.initiateJump(app.system!.id);
                onPlayClick();
              }}
              className="shrink-0 flex items-center gap-1.5 bg-primary text-background border border-primary px-3 py-1.5 rounded font-mono-hud font-bold text-[9px] tracking-widest hover:bg-primary/80 active:scale-95 transition-all"
            >
              <Rocket size={14} fill="currentColor" />
              JUMP
            </button>
          )}

          <button
            onClick={() => {
              const next = !expanded;
              setExpanded(next);
              if (next) onPlayExpand();
              else onPlayCollapse();
            }}
            className="shrink-0 text-primary border border-primary/40 rounded p-1 hover:bg-primary/10 transition-colors"
            aria-label={expanded ? "Collapse panel" : "Expand panel"}
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>

        {expanded && (
          <div className="border-t border-primary/20 max-h-[40vh] overflow-y-auto p-2 animate-fade-in custom-scrollbar">
            {app.view === "galaxy" && (
              app.system ? (
                <SystemOverview
                  system={app.system}
                  galaxy={app.galaxy}
                  onSelectBody={onSelectBody}
                  playerSystemId={app.playerSystemId}
                  travel={app.travel}
                  arrival={app.arrival}
                  initiateJump={app.initiateJump}
                  getJumpCost={app.getJumpCost}
                  currentTime={app.currentTime}
                  isExplored={!app.fogOfWar || app.exploredSystemIds.has(app.system.id)}
                  hideHeader={true}
                  hideActions={true}
                  onPlayClick={onPlayClick}
                  onSelectEmpire={onSelectEmpire}
                  onEnterSystem={onEnterSystem}
                />
              ) : (
                <GalaxyOverview galaxy={app.galaxy} hideHeader={true} />
              )
            )}
            {app.view === "system" && app.system && (
              <SystemOverview
                system={app.system}
                galaxy={app.galaxy}
                onSelectBody={onSelectBody}
                playerSystemId={app.playerSystemId}
                travel={app.travel}
                arrival={app.arrival}
                initiateJump={app.initiateJump}
                getJumpCost={app.getJumpCost}
                currentTime={app.currentTime}
                isExplored={!app.fogOfWar || app.exploredSystemIds.has(app.system.id)}
                hideHeader={true}
                hideActions={true}
                onPlayClick={onPlayClick}
                onSelectEmpire={onSelectEmpire}
              />
            )}
            {app.view === "body" && app.body && (
              <BodyOverview body={app.body} galaxy={app.galaxy} hideHeader={true} onPlayClick={onPlayClick} onSelectEmpire={onSelectEmpire} />
            )}
            {app.view === "ship" && (
              <ShipOverview
                system={app.system}
                travel={app.travel}
                arrival={app.arrival}
                currentTime={app.currentTime}
                onDeselect={() => setExpanded(false)}
                hideHeader={true}
                onPlayClick={onPlayClick}
              />
            )}
          </div>
        )}
      </div>

      {/* Mobile Legend & Filters */}
      <div className="flex items-center justify-between mt-2 pointer-events-auto w-full">
        <div className="flex items-center gap-2">
          {app.view !== "galaxy" && (
            <button
              onClick={() => {
                const action = app.view === "system" ? onBackToGalaxy : onBackToSystem;
                action();
                onPlayClick();
              }}
              className="hud-panel hud-corner flex items-center justify-center w-10 h-8 text-primary hover:text-glow transition"
              aria-label="Back"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <Legend 
             view={app.view} 
             onPlayClick={onPlayClick} 
             onPlayExpand={onPlayExpand} 
             onPlayCollapse={onPlayCollapse} 
          />
        </div>
        {(app.view === "galaxy" || app.view === "system" || app.view === "body" || app.view === "ship") && (
          <FilterPanel 
            filters={app.filters} 
            onToggle={app.toggleFilter} 
            view={app.view === "ship" ? "system" : app.view} 
            onPlayClick={onPlayClick}
            onPlayExpand={onPlayExpand}
            onPlayCollapse={onPlayCollapse}
          />
        )}
      </div>
    </div>
  );
}

function ProfileView({ app, onPlayClick }: { app: GalaxyApp; onPlayClick: () => void }) {
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
      {/* Profile Sidebar */}
      <aside className="w-full sm:w-[320px] border-b sm:border-b-0 sm:border-r border-primary/20 flex flex-col bg-primary/5 animate-in slide-in-from-left duration-500 shrink-0">
        <div className="p-3 sm:p-6 border-b border-primary/20 flex flex-row sm:flex-col items-center justify-center sm:justify-start gap-4">
          <div className="relative">
            <div className="w-12 h-12 sm:w-24 sm:h-24 rounded-full border-2 sm:border-4 border-primary/30 overflow-hidden shadow-[0_0_20px_hsl(var(--primary)/0.2)]">
              <img src={app.playerAvatar} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-primary text-background font-display text-[10px] sm:text-lg px-1 sm:px-2 rounded border border-background">
              {app.playerLevel}
            </div>
          </div>
          <div className="flex flex-col text-left sm:text-center min-w-0">
            <h2 className="font-display text-base sm:text-2xl text-primary text-glow uppercase tracking-[0.1em] truncate">{app.playerName}</h2>
            <p className="font-mono-hud text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-[0.2em] sm:tracking-[0.3em] truncate">Commander</p>
          </div>
        </div>

        <nav className="p-1 sm:p-2 flex flex-row sm:flex-col gap-1 overflow-x-auto sm:overflow-y-auto no-scrollbar">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.label}
                  onClick={() => {
                    setActiveTab(tab.label);
                    onPlayClick();
                  }}
                  className={`flex items-center gap-1.5 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-3 rounded transition-all whitespace-nowrap ${
                    activeTab === tab.label 
                      ? "bg-primary/20 text-primary border border-primary/40 shadow-[inset_0_0_10px_hsl(var(--primary)/0.1)]" 
                      : "text-muted-foreground hover:text-primary hover:bg-primary/5 border border-transparent"
                  }`}
                >
                  <Icon size={14} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="font-display text-[10px] sm:text-sm uppercase tracking-widest">{tab.label}</span>
                </button>
              );
            })}
        </nav>
      </aside>

      {/* Profile Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none scanline opacity-10" />
        
        <div className="flex-1 overflow-y-auto p-3 sm:p-10 custom-scrollbar relative z-10">
          <div className="max-w-4xl mx-auto">
            {activeTab === "Overview" && (
              <div className="space-y-6 sm:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Currency Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard label="Action Potential" value={Math.floor(app.ap)} unit="AP" icon={Zap} color="primary" />
                  <StatCard label="Total Net Worth" value={Math.floor(app.sc).toLocaleString()} unit="SC" icon={Coins} color="warning" />
                  <StatCard label="Void Tokens" value={0} unit="VT" icon={Hexagon} color="purple" />
                </div>

                {/* Exploration Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <StatCard label="Systems Discovered" value={app.exploredSystemIds.size} unit="SYS" icon={Globe} color="success" />
                  <StatCard label="Active Fleets" value={14} unit="FLT" icon={Rocket} color="primary" />
                </div>

                {/* Status Snapshot */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="hud-panel p-6 border border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-3 mb-6">
                      <Shield className="text-primary" size={20} />
                      <h3 className="font-display text-xs uppercase tracking-[0.2em] text-primary">Current Status</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-black/20 p-3 rounded">
                        <span className="font-mono-hud text-[10px] text-muted-foreground uppercase">Hegemony Status</span>
                        <span className="font-display text-[10px] text-success uppercase tracking-widest px-2 py-0.5 border border-success/40 rounded">Active Service</span>
                      </div>
                      <div className="flex justify-between items-center bg-black/20 p-3 rounded">
                        <span className="font-mono-hud text-[10px] text-muted-foreground uppercase">Bounty Priority</span>
                        <span className="font-display text-[10px] text-primary uppercase tracking-widest px-2 py-0.5 border border-primary/40 rounded">None</span>
                      </div>
                      <div className="flex justify-between items-center bg-black/20 p-3 rounded">
                        <span className="font-mono-hud text-[10px] text-muted-foreground uppercase">Next Requisition</span>
                        <span className="font-display text-[10px] text-warning uppercase">24h 12m 04s</span>
                      </div>
                    </div>
                  </div>

                  <div className="hud-panel p-6 border border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-3 mb-6">
                      <TrendingUp className="text-primary" size={20} />
                      <h3 className="font-display text-xs uppercase tracking-[0.2em] text-primary">Performance</h3>
                    </div>
                    <div className="h-24 flex items-end justify-between gap-1">
                      {[40, 20, 60, 80, 45, 90, 100].map((h, i) => (
                        <div 
                          key={i} 
                          className="flex-1 bg-primary/20 relative group"
                          style={{ height: `${h}%` }}
                        >
                          <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-40 transition-opacity" />
                          <div className="absolute bottom-full left-0 right-0 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="font-mono-hud text-[6px] text-primary text-center block">{h}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-2">
                       <span className="font-mono-hud text-[6px] text-muted-foreground uppercase">Projected Output</span>
                       <span className="font-mono-hud text-[6px] text-success uppercase">+12.4% Weekly</span>
                    </div>
                  </div>
                </div>

                {/* Career Timeline Mock */}
                <section className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-primary/20" />
                    <h3 className="font-display text-sm uppercase tracking-[0.3em] text-primary/60">Recent Activity</h3>
                    <div className="h-px flex-1 bg-primary/20" />
                  </div>
                  
                  <div className="space-y-4">
                    <LogEntry date="3024.12.01" event="Commissioned as Hegemony Commander" type="milestone" />
                    <LogEntry date="3024.12.05" event="First jump to Alpha Centauri completed" type="flight" />
                    <LogEntry date="3024.12.12" event="Achieved Level 5 Command Rating" type="milestone" />
                  </div>
                </section>
              </div>
            )}

            {activeTab === "Assets" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between border-b border-primary/20 pb-4">
                  <div>
                    <h3 className="font-display text-lg uppercase tracking-widest text-primary">Managed Assets</h3>
                    <p className="font-mono-hud text-[10px] text-muted-foreground uppercase mt-1">Ships, Factories & Holdings</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono-hud text-[10px] text-muted-foreground uppercase block">Available Liquidity</span>
                    <span className="font-display text-xl text-warning text-glow">{Math.floor(app.sc).toLocaleString()} SC</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="hud-panel p-4 border border-primary/10 bg-primary/5 group hover:border-primary/40 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <Rocket size={20} className="text-primary" />
                      <span className="font-display text-xs uppercase tracking-widest">HGV-01 "Vanguard"</span>
                      <span className="ml-auto font-mono-hud text-[8px] px-2 py-0.5 bg-success/20 text-success rounded">OPERATIONAL</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[9px] font-mono-hud uppercase text-muted-foreground">
                      <span>Type: Fast Explorer</span>
                      <span>Hulls: 100%</span>
                      <span>FTL Drive: Mk II</span>
                      <span>Fuel: 84%</span>
                    </div>
                  </div>
                  
                  <div className="hud-panel p-4 border border-primary/10 bg-primary/5 group hover:border-primary/40 transition-all opacity-50">
                    <div className="flex items-center gap-3 mb-4 text-muted-foreground">
                      <Anchor size={20} />
                      <span className="font-display text-xs uppercase tracking-widest">Mining Outpost Alpha</span>
                      <span className="ml-auto font-mono-hud text-[8px] px-2 py-0.5 bg-destructive/20 text-destructive rounded">OFFLINE</span>
                    </div>
                    <p className="text-[8px] font-mono-hud text-center italic text-muted-foreground/60">Establish ownership to activate asset telemetry</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Reputation" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 border border-primary/20 rounded">
                    <Award size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg uppercase tracking-widest text-primary">Faction Standing</h3>
                    <p className="font-mono-hud text-[10px] text-muted-foreground uppercase mt-1">Diplomatic Influence Matrix</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {[
                    { name: "Hegemony High Command", value: 85, color: "text-primary" },
                    { name: "Independent Outer Rim", value: 12, color: "text-warning" },
                    { name: "Corporate Syndicate", value: 45, color: "text-success" },
                    { name: "Lost Colonies Envoy", value: -20, color: "text-destructive" },
                  ].map((f) => (
                    <div key={f.name} className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-display uppercase tracking-widest">
                        <span className={f.color}>{f.name}</span>
                        <span>{f.value > 0 ? "+" : ""}{f.value}</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                        <div 
                          className={`h-full opacity-60 ${f.value > 0 ? "bg-primary" : "bg-destructive"}`}
                          style={{ 
                            width: `${Math.abs(f.value)}%`,
                            marginLeft: f.value < 0 ? `${100 - Math.abs(f.value)}%` : "0"
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "Logbook" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between border-b border-primary/20 pb-4">
                  <div className="flex items-center gap-3">
                    <History size={20} className="text-primary" />
                    <h3 className="font-display text-lg uppercase tracking-widest text-primary">Chronological Registry</h3>
                  </div>
                  <span className="font-mono-hud text-[8px] text-muted-foreground uppercase">Archives: 3024.12.01 - Present</span>
                </div>

                <div className="space-y-8 relative">
                   <div className="absolute left-[70px] sm:left-[84px] top-4 bottom-4 w-px bg-primary/10" />
                   {[
                     { date: "3024.12.15", title: "Anomaly Detected", desc: "Scientific scans in the Veil sector returned unusual hyper-spatial echoes.", type: "intel" },
                     { date: "3024.12.12", title: "Rank Promotion", desc: "Command Rating increased to Level 5. Basic orbital strike clearance granted.", type: "rank" },
                     { date: "3024.12.05", title: "Expansion Milestone", desc: "Confirmed landing on New Terra. Atmospheric sensors nominal.", type: "discovery" },
                     { date: "3024.12.01", title: "Deployment Active", desc: "Initialized neural uplink for Starbound Hegemony Fleet Operations.", type: "system" },
                   ].map((entry, i) => (
                     <div key={i} className="flex gap-4 sm:gap-8 items-start relative group">
                        <div className="font-mono-hud text-[8px] sm:text-[10px] text-primary/40 pt-1 w-14 sm:w-20 shrink-0 text-right">{entry.date}</div>
                        <div className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors mt-1.5 shrink-0 z-10" />
                        <div className="flex-1 bg-primary/5 border border-primary/10 p-4 rounded-lg group-hover:border-primary/30 transition-all">
                           <div className="flex justify-between items-center mb-1">
                              <h4 className="font-display text-xs uppercase tracking-widest text-primary">{entry.title}</h4>
                              <span className="text-[7px] font-mono-hud px-1.5 py-0.5 bg-primary/10 text-primary/60 rounded">{entry.type}</span>
                           </div>
                           <p className="text-[9px] font-mono-hud text-muted-foreground leading-relaxed">{entry.desc}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            )}

            {activeTab === "Doctrines" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-primary/20 pb-6">
                  <div className="flex items-center gap-3">
                    <Sparkles size={28} className="text-primary animate-pulse" />
                    <div>
                      <h3 className="font-display text-lg uppercase tracking-widest text-primary">Neural Doctrines</h3>
                      <p className="font-mono-hud text-[10px] text-muted-foreground uppercase mt-1">Unlockable Expertise & Tactics</p>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 bg-primary border border-primary/40 text-background rounded font-mono-hud text-[10px] font-bold tracking-widest">
                    Available Credits: 2
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { name: "Hyper-Efficiency", cost: 1, desc: "Reduces fuel consumption by 15% when jumping between adjacent systems.", active: true, icon: Zap },
                    { name: "Market Dominance", cost: 2, desc: "Sell ores at a 10% premium in Hegemony controlled sectors.", active: false, icon: TrendingUp },
                    { name: "Deep Scans", cost: 1, desc: "Increases exploration rewards and anomaly detection radius by 25%.", active: true, icon: Globe },
                    { name: "Combat Stance", cost: 3, desc: "Unlocks offensive drone capability for planetary extraction protection.", active: false, icon: Shield },
                  ].map((node) => {
                    const Icon = node.icon;
                    return (
                      <button 
                      key={node.name}
                      className={`hud-panel p-4 border flex items-start gap-4 text-left transition-all relative overflow-hidden ${
                        node.active 
                          ? "bg-primary/10 border-primary/40 shadow-[inset_0_0_15px_rgba(16,185,129,0.1)]" 
                          : "bg-white/5 border-white/10 opacity-60 hover:opacity-100 hover:border-white/30"
                      }`}
                    >
                      <div className={`p-2 rounded ${node.active ? "bg-primary text-background" : "bg-white/10 text-muted-foreground"}`}>
                          <Icon size={18} />
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`font-display text-[10px] uppercase tracking-widest ${node.active ? "text-primary" : "text-foreground"}`}>
                            {node.name}
                          </span>
                          {!node.active && <span className="font-mono-hud text-[8px] text-warning shrink-0">{node.cost} SP</span>}
                        </div>
                        <p className="font-mono-hud text-[9px] text-muted-foreground leading-snug line-clamp-2">
                          {node.desc}
                        </p>
                      </div>
                      {node.active && (
                        <div className="absolute -top-1 -right-1 bg-primary px-2 py-0.5 transform rotate-1 text-[6px] font-bold font-mono-hud uppercase tracking-widest">
                          Active
                        </div>
                      )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


function EmpireLogo({ empire, size = 120 }: { empire: Empire; size?: number }) {
  const Icon = ICON_MAP[empire.logo.symbol] || Shield;
  const primaryColor = `hsl(${empire.hue} 70% 50%)`;
  const secondaryColor = `hsl(${empire.logo.secondaryHue} 70% 60%)`;
  
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
       {/* Background Hexagon with Pattern */}
       <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
          <defs>
            <pattern id={`pattern-${empire.id}`} patternUnits="userSpaceOnUse" width="10" height="10">
               {empire.logo.pattern === 'grid' && <path d="M 10 0 L 0 0 0 10" fill="none" stroke={primaryColor} strokeWidth="0.5" opacity="0.3" />}
               {empire.logo.pattern === 'dots' && <circle cx="2" cy="2" r="1" fill={primaryColor} opacity="0.3" />}
               {empire.logo.pattern === 'waves' && <path d="M 0 5 Q 2.5 0 5 5 T 10 5" fill="none" stroke={primaryColor} strokeWidth="0.5" opacity="0.3" />}
               {empire.logo.pattern === 'circles' && <circle cx="5" cy="5" r="3" fill="none" stroke={primaryColor} strokeWidth="0.5" opacity="0.3" />}
               {empire.logo.pattern === 'cross' && <path d="M 0 0 L 10 10 M 10 0 L 0 10" stroke={primaryColor} strokeWidth="0.5" opacity="0.3" />}
            </pattern>
          </defs>
          <path 
            d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z" 
            fill={`url(#pattern-${empire.id})`}
            className="transition-all duration-700"
          />
          <path 
            d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z" 
            fill="none" 
            stroke={primaryColor} 
            strokeWidth="2"
            className="transition-all duration-700"
          />
       </svg>
       {/* Central Symbol */}
       <div className="absolute inset-0 flex items-center justify-center">
          <Icon size={size * 0.4} style={{ color: secondaryColor }} className="drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
       </div>
    </div>
  );
}

function CouncilHemicycle({ empire }: { empire: Empire }) {
  const [hoveredSeat, setHoveredSeat] = useState<{ name: string; party: string; role?: string; color: string } | null>(null);
  const council = empire.government.council;
  
  const GOV_ICON_MAP: Record<string, any> = {
    "Parliamentary republic": Scale,
    "Presidential republic": Briefcase,
    "Dominant-party": LayoutGrid,
    "Dictatorship": ShieldAlert,
    "One-party system": Fingerprint,
    "Executive monarchy": Crown
  };
  const GovIcon = GOV_ICON_MAP[empire.government.type] || Crown;

  // Layout Constants
  const CX = 100;
  const CY = 105; // Lower base line to prevent cutting
  const START_ANGLE = Math.PI + 0.3;
  const END_ANGLE = -0.3;

  // Leadership Ring (6 fixed seats, potentially vacant)
  const leadershipSeats = [
    { key: 'pres', role: "President", official: empire.government.president, color: "var(--primary)" },
    { key: 'vp', role: "Vice President", official: empire.government.vicePresident, color: "#22d3ee" },
    ...Array.from({ length: 4 }).map((_, i) => ({
      key: `min-${i}`,
      role: empire.government.ministers[i]?.role || "Minister",
      official: empire.government.ministers[i] || null,
      color: "#818cf8"
    }))
  ];

  // Council Distribution
  const numRows = council.totalSeats > 40 ? 3 : 2;
  const rowConfig = numRows === 3 
    ? [Math.floor(council.totalSeats * 0.25), Math.floor(council.totalSeats * 0.35), council.totalSeats - (Math.floor(council.totalSeats * 0.25) + Math.floor(council.totalSeats * 0.35))]
    : [Math.floor(council.totalSeats * 0.4), council.totalSeats - Math.floor(council.totalSeats * 0.4)];

  return (
    <div className="relative w-full aspect-[2/1.2] max-w-[400px] mx-auto overflow-visible group">
      <svg viewBox="0 0 200 120" className="w-full h-full overflow-visible">
        {/* Leadership Ring (Inner-most) */}
        {leadershipSeats.map((seat, i) => {
          const radius = 28;
          const step = (START_ANGLE - END_ANGLE) / (leadershipSeats.length - 1);
          const angle = START_ANGLE - i * step;
          const x = CX + Math.cos(angle) * radius;
          const y = CY - Math.sin(angle) * radius;
          const isOccupied = !!seat.official;

          return (
            <circle 
              key={seat.key}
              cx={x} cy={y} r="3"
              fill={isOccupied ? seat.color : '#444'}
              className={`${isOccupied ? 'cursor-help hover:r-[4] hover:brightness-125' : 'opacity-40'} transition-all`}
              onMouseEnter={() => isOccupied && setHoveredSeat({ 
                name: seat.official!.name, 
                party: seat.official!.party, 
                role: seat.role, 
                color: seat.color 
              })}
              onMouseLeave={() => setHoveredSeat(null)}
            />
          );
        })}

        {/* Council Rings */}
        {rowConfig.map((count, rowIndex) => {
          const radius = 45 + rowIndex * 18;
          const step = (START_ANGLE - END_ANGLE) / (count - 1);
          
          return Array.from({ length: count }).map((_, i) => {
            // i=0 is Left, i=count-1 is Right
            // We want seatIndex 0 to be Front-Right
            const rightToLeftIndex = count - 1 - i;
            const angle = START_ANGLE - i * step;
            const x = CX + Math.cos(angle) * radius;
            const y = CY - Math.sin(angle) * radius;
            
            const prevSeats = rowConfig.slice(0, rowIndex).reduce((a, b) => a + b, 0);
            const seatIndex = prevSeats + rightToLeftIndex;
            const seat = council.seats[seatIndex];
            const faction = council.factions.find(f => f.id === seat?.factionId);
            const isOccupied = !!seat?.occupantName;
            const color = isOccupied ? (faction?.color || '#333') : '#444';

            return (
              <circle 
                key={`${rowIndex}-${i}`}
                cx={x} cy={y} r="2.2"
                fill={color}
                className={`transition-all duration-300 ${isOccupied ? 'cursor-help hover:r-[3.2]' : 'opacity-40'}`}
                onMouseEnter={() => isOccupied && setHoveredSeat({ 
                  name: seat.occupantName!, 
                  party: faction?.name || "Independent", 
                  color: color 
                })}
                onMouseLeave={() => setHoveredSeat(null)}
              />
            );
          });
        })}

        {/* Central Logo (Leader) */}
        <g 
          transform={`translate(${CX}, ${CY - 2})`}
          className={empire.government.president ? "cursor-help group/leader" : ""}
          onMouseEnter={() => {
            const leaderFaction = council.factions.find(f => f.name === empire.government.president?.party);
            const leaderColor = leaderFaction?.color || "var(--primary)";
            if (empire.government.president) setHoveredSeat({
              name: empire.government.president.name,
              party: empire.government.president.party,
              role: empire.government.type.includes("Dictator") || empire.government.type.includes("monarchy") ? "Head of State" : "President",
              color: leaderColor
            });
          }}
          onMouseLeave={() => setHoveredSeat(null)}
        >
          <circle 
            r="16" 
            fill={council.factions.find(f => f.name === empire.government.president?.party)?.color || "currentColor"} 
            className="opacity-90 group-hover/leader:opacity-100 transition-opacity" 
          />
          <circle 
            r="16" 
            fill="none" 
            stroke="white" 
            strokeWidth="0.5" 
            className="opacity-20" 
          />
          <foreignObject x="-9" y="-9" width="18" height="18">
            <div className="flex items-center justify-center w-full h-full">
              <GovIcon 
                size={14} 
                className="text-black"
              />
            </div>
          </foreignObject>
        </g>
      </svg>

      {/* Label Underneath */}
      <div className="mt-6 text-center">
        <div className="font-mono-hud text-[8px] uppercase tracking-[0.4em] text-primary/60 border-t border-primary/10 pt-4 inline-block px-12">
          {empire.government.type}
        </div>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredSeat && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[120%] z-50 pointer-events-none"
          >
            <div className="hud-panel p-3 border-l-2 bg-black/90 backdrop-blur-md min-w-[140px] shadow-2xl" style={{ borderLeftColor: hoveredSeat.color }}>
              {hoveredSeat.role && (
                <div className="text-[7px] font-mono-hud text-primary uppercase tracking-[0.2em] mb-1">{hoveredSeat.role}</div>
              )}
              <div className="text-xs font-display uppercase tracking-wider mb-1">{hoveredSeat.name}</div>
              <div className="text-[8px] font-mono-hud text-muted-foreground uppercase">{hoveredSeat.party}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmpireView({ app, onPlayClick }: { app: GalaxyApp; onPlayClick: () => void }) {
  const empire = app.galaxy.empires.find(e => e.id === app.selectedEmpireId);
  if (!empire) return <div className="p-20 text-center text-primary font-display uppercase tracking-widest animate-pulse">Sovereign Data Encrypted</div>;

  const systemsOwned = app.galaxy.systems.filter(s => s.bodies.some(b => b.ownerId === empire.id));
  const bodiesOwned = app.galaxy.systems.flatMap(s => s.bodies).filter(b => b.ownerId === empire.id);
  const totalPop = bodiesOwned.reduce((sum, b) => sum + b.population, 0);

  return (
    <div className="flex-1 flex flex-col bg-background/40 backdrop-blur-sm animate-fade-in overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none scanline opacity-5" />
      
      {/* Header */}
      <header className="px-6 py-3 sm:py-4 border-b border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4 bg-primary/5">
        <div className="flex items-center gap-6">
          <EmpireLogo empire={empire} size={56} />
          <div>
            <h2 className="font-display text-lg sm:text-xl text-glow uppercase tracking-[0.2em]" style={{ color: `hsl(${empire.hue} 70% 55%)` }}>
              {empire.name}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-mono-hud text-[8px] sm:text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Sovereign State</span>
              <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary font-mono-hud text-[8px] tracking-widest">{empire.tag}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
           <button 
             onClick={() => { onPlayClick(); app.setPage("map"); }}
             className="px-4 py-1.5 bg-primary text-background font-display text-[9px] uppercase tracking-widest hover:scale-105 transition-all rounded font-bold"
           >
             Return to Map
           </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Key Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Territorial Systems" value={systemsOwned.length} unit="SYS" icon={Globe} />
            <StatCard label="Managed Bodies" value={bodiesOwned.length} unit="BOD" icon={Cpu} color="success" />
            <StatCard label="Gross Population" value={totalPop.toFixed(1)} unit="M" icon={UsersIcon} color="warning" />
            <StatCard label="Industrial Rating" value={(bodiesOwned.length * 1.4).toFixed(1)} unit="IDX" icon={Factory} color="primary" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Intel Section */}
            <div className="lg:col-span-2 space-y-8">
               {/* Government / Council Section */}
               <div className="hud-panel p-8 border border-primary/20 bg-primary/5 relative overflow-hidden">
                  <h3 className="font-display text-sm uppercase tracking-[0.3em] text-primary mb-10 flex items-center gap-2">
                    <Scale size={16} />
                    High Council Representation
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                      <CouncilHemicycle empire={empire} />
                      <div className="flex flex-wrap justify-center gap-4">
                        {empire.government.council.factions.map(f => (
                          <div key={f.id} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }} />
                            <span className="font-mono-hud text-[8px] uppercase text-muted-foreground">{f.name} ({f.count})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="p-4 border border-primary/10 bg-black/20 rounded space-y-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded ${empire.government.president ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground'}`}>
                            {empire.government.type.includes("monarchy") || empire.government.type.includes("Dictator") ? <ShieldAlert size={18} /> : <Crown size={18} />}
                          </div>
                          <div>
                            <div className="text-[10px] font-mono-hud text-primary uppercase tracking-widest">
                              {empire.government.type.includes("Dictator") || empire.government.type.includes("party") || empire.government.type.includes("monarchy") ? "Head of State" : "President"}
                            </div>
                            <div className={`text-sm font-display uppercase tracking-widest ${!empire.government.president && 'opacity-30'}`}>
                              {empire.government.president?.name || "VACANT"}
                            </div>
                            {empire.government.president && (
                              <div className="text-[8px] font-mono-hud text-muted-foreground uppercase">{empire.government.president.party}</div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded ${empire.government.vicePresident ? 'bg-primary/10 text-primary/70' : 'bg-white/5 text-muted-foreground'}`}>
                            <UsersIcon size={18} />
                          </div>
                          <div>
                            <div className="text-[10px] font-mono-hud text-primary/70 uppercase tracking-widest">Vice President</div>
                            <div className={`text-sm font-display uppercase tracking-widest ${!empire.government.vicePresident && 'opacity-30'}`}>
                              {empire.government.vicePresident?.name || "VACANT"}
                            </div>
                            {empire.government.vicePresident && (
                              <div className="text-[8px] font-mono-hud text-muted-foreground uppercase">{empire.government.vicePresident.party}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-12 pt-8 border-t border-primary/10">
                    <h4 className="text-[10px] font-mono-hud text-primary/40 uppercase tracking-[0.4em] mb-6">Cabinet Ministers</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {empire.government.ministers.map((m, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 border border-primary/5 bg-white/5 rounded">
                          <Briefcase size={14} className="text-primary/40" />
                          <div>
                            <div className="text-[8px] font-mono-hud text-primary/60 uppercase">{m.role}</div>
                            <div className="text-[10px] font-display uppercase">{m.name}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
               </div>

               <div className="hud-panel p-8 border border-primary/20 bg-primary/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <History size={120} className="text-primary" />
                  </div>
                  <h3 className="font-display text-sm uppercase tracking-[0.3em] text-primary mb-6 flex items-center gap-2">
                    <BookOpen size={16} />
                    Tactical Intelligence
                  </h3>
                  <div className="space-y-4 text-xs font-mono-hud text-muted-foreground leading-relaxed">
                    <p>
                      The <span className="text-primary font-bold">{empire.name}</span> maintain a presence across {systemsOwned.length} systems in this sector. 
                      Their core doctrine appears focused on {bodiesOwned.length > 10 ? "rapid colonial expansion" : "high-density industrial consolidation"}.
                    </p>
                    <p>
                      Recent telemetry indicates a significant shift in orbital logistics. Intelligence reports suggest a high level of neural integration within their command structure, 
                      providing them with a distinct advantage in complex celestial navigation and fleet coordination.
                    </p>
                  </div>
               </div>
            </div>

            {/* Faction Relations */}
            <div className="space-y-6">
              <div className="hud-panel p-6 border border-primary/20 bg-primary/5">
                <h3 className="font-display text-sm uppercase tracking-[0.3em] text-primary mb-6 flex items-center gap-2">
                  <TrendingUp size={16} />
                  Hegemony Standing
                </h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-mono-hud uppercase">
                      <span>Diplomatic Status</span>
                      <span className="text-success">Cordial</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-success w-[72%]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-mono-hud uppercase">
                      <span>Trade Access</span>
                      <span className="text-primary">Restricted</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[45%]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-mono-hud uppercase">
                      <span>Military Threat</span>
                      <span className="text-warning">Nominal</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-warning w-[15%]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                 <h3 className="font-display text-sm uppercase tracking-[0.3em] text-primary/60 px-2">Primary Holdings</h3>
                 <div className="space-y-3">
                   {bodiesOwned.slice(0, 8).map(b => (
                     <div key={b.id} className="flex items-center justify-between p-4 border border-primary/10 bg-primary/5 rounded hover:border-primary/40 transition-colors group">
                       <div className="flex items-center gap-3">
                         <Globe size={14} className="text-primary/60 group-hover:text-primary transition-colors" />
                         <span className="font-display text-[10px] uppercase tracking-widest text-foreground">{b.name}</span>
                       </div>
                       <span className="font-mono-hud text-[8px] text-muted-foreground uppercase">{b.type}</span>
                     </div>
                   ))}
                 </div>
               </div>

              <div className="p-4 border border-warning/20 bg-warning/5 rounded">
                <p className="text-[9px] font-mono-hud text-warning/80 uppercase tracking-widest leading-relaxed">
                  <Zap size={10} className="inline mr-2" />
                  Note: Access to full strategic dossiers requires Level 10 Hegemony clearance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, icon: Icon, color = "primary" }: { label: string; value: string | number; unit: string; icon: React.ElementType; color?: "primary" | "warning" | "success" | "destructive" | "purple" }) {
  const colorMap: Record<string, string> = {
    primary: "border-l-primary bg-primary/5 text-primary",
    warning: "border-l-warning bg-warning/5 text-warning",
    success: "border-l-success bg-success/5 text-success",
    destructive: "border-l-destructive bg-destructive/5 text-destructive",
    purple: "border-l-purple-500 bg-purple-500/5 text-purple-400",
  };
  const currentColors = colorMap[color] || colorMap.primary;
  return (
    <div className={`p-2 sm:p-4 flex items-center gap-2 sm:gap-4 border-l-2 transition-all hover:scale-[1.02] bg-background/40 backdrop-blur-md shadow-2xl ${currentColors}`}>
      <div className="p-1.5 sm:p-3 bg-white/5 rounded-lg shrink-0">
        <Icon size={16} className="sm:w-6 sm:h-6" />
      </div>
      <div className="flex flex-col justify-center min-w-0">
        <div className="font-mono-hud text-[7px] sm:text-[9px] uppercase tracking-widest opacity-60 mb-0.5 truncate">{label}</div>
        <div className="flex items-baseline gap-1">
          <span className="font-display text-sm sm:text-2xl font-bold tracking-wider truncate text-glow">{value}</span>
          <span className="font-mono-hud text-[8px] sm:text-[10px] opacity-70 shrink-0">{unit}</span>
        </div>
      </div>
    </div>
  );
}

function LogEntry({ date, event, type }: { date: string; event: string; type: string }) {
  return (
    <div className="flex gap-2 sm:gap-4 items-start group">
      <div className="font-mono-hud text-[8px] sm:text-[10px] text-primary/30 pt-0.5 sm:pt-1 w-16 sm:w-20 shrink-0">{date}</div>
      <div className="relative pt-0.5 sm:pt-1 px-1">
        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
        <div className="absolute top-2.5 left-1.5 w-[1px] h-8 sm:h-10 bg-primary/10" />
      </div>
      <div className="flex-1 pb-2 sm:pb-4">
        <div className="font-display text-[10px] sm:text-xs uppercase tracking-widest text-primary/80 group-hover:text-primary transition-colors">{event}</div>
        <div className="font-mono-hud text-[7px] sm:text-[9px] uppercase tracking-tighter text-muted-foreground/60">{type}</div>
      </div>
    </div>
  );
}

export default Index;
