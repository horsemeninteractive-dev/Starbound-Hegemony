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
import { MarketView } from "@/galaxy/components/MarketView";
import { FactoriesView } from "@/galaxy/components/FactoriesView";
import { FleetsView } from "@/galaxy/components/FleetsView";
import { ArticlesView } from "@/galaxy/components/ArticlesView";
import { ProfileView } from "@/galaxy/components/ProfileView";
import { PartyView } from "@/galaxy/components/PartyView";
import { useAudio } from "@/galaxy/useAudio";
import { ChangelogModal } from "@/galaxy/components/ChangelogModal";
import { CreditsScreen } from "@/galaxy/components/CreditsScreen";
import { RESOURCE_META } from "@/galaxy/meta";
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
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Track view changes to trigger the "Processing" indicator
  useEffect(() => {
    if (transitionKey === 0) return;
    setIsTransitioning(true);
    playNotification();
    const timer = setTimeout(() => setIsTransitioning(false), 1200);
    return () => clearTimeout(timer);
  }, [transitionKey, playNotification]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);
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
    setPlayerName, setPlayerAvatar
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



  const circles = useMemo(() => app.systemMatchesFilter, [app]);

  // Page transition
  const [pageKey, setPageKey] = useState(0);
  const [scanning, setScanning] = useState(false);
  const prevPage = useRef(app.page);
  const navigateTo = (page: "map" | "profile" | "articles" | "market" | "factories" | "fleets" | "party" | "skills", extra?: () => void) => {
    if (page === prevPage.current && !extra) return;
    setScanning(true);
    setTimeout(() => {
      if (page !== prevPage.current) { app.setPage(page); prevPage.current = page; setPageKey(k => k + 1); }
      extra?.();
      setScanning(false);
    }, 200);
  };

  const isGameReady = !!app.user && !!app.vesselId;
  const isInitialLoading = app.sessionLoading || (!app.initialDataLoaded && !!app.user);

  // Apply theme class to document root for global inheritance
  useEffect(() => {
    const root = document.documentElement;
    if (app.theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
  }, [app.theme]);

  return (
    <main className={`relative flex flex-col h-screen w-screen overflow-hidden bg-background`}>
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
          onOpenMarket={() => navigateTo("market")}
          onOpenFactories={() => navigateTo("factories")}
          onOpenFleets={() => navigateTo("fleets")}
          onOpenParty={() => navigateTo("party")}
          onOpenSkills={() => navigateTo("skills")}
          onOpenChangelog={() => setIsChangelogOpen(true)}
          onOpenCredits={() => setIsCreditsOpen(true)}
          ap={app.ap}
          sc={app.sc}
          cargoCapacity={app.cargoCapacity}
          cargoUsed={app.userResources.reduce((sum, r) => sum + r.amount, 0)}
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
          playerSystemId={app.playerSystemId}
          travel={app.travel}
          arrival={app.arrival}
          currentTime={app.currentTime}
          galaxy={app.galaxy}
          onReset={app.resetGalaxy}
          onSetAp={app.setAp}
          onPlayClick={playClick}
          isGameReady={isGameReady}
          shipName={app.shipConfig.name}
          nextApTick={app.nextApTick}
          onlinePlayerCount={app.onlinePlayerCount}
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
                    playerBodyId={app.playerBodyId}
                    travel={app.travel}
                    isMobilePanelExpanded={isMobilePanelExpanded}
                    graphicsQuality={graphicsQuality}
                    shipConfig={app.shipConfig}
                    fxVolume={app.audioEnabled ? app.fxVolume : 0}
                    arrival={app.arrival}
                    otherPlayers={app.otherPlayers}
                    userResidency={app.userResidency}
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
                 <Sonner closeButton />
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
                      shipName={app.shipConfig.name}
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
                    shipName={app.shipConfig.name}
                  />
                )}
                {app.view === "body" && app.body && app.system && (
                    <BodyOverview 
                      body={app.body} 
                      galaxy={app.galaxy} 
                      isExplored={!app.fogOfWar || app.exploredSystemIds.has(app.system.id)}
                      isVisited={app.exploredBodyIds.has(`${app.system.id}:${app.body.id}`)}
                      onPlayClick={playClick}
                      onSelectEmpire={handleSelectEmpire}
                      playerSystemId={app.playerSystemId}
                      playerBodyId={app.playerBodyId}
                      travel={app.travel}
                      initiateTravelToBody={app.initiateTravelToBody}
                      currentTime={app.currentTime}
                      factories={app.factories}
                      bodyResources={app.bodyResources}
                      userResources={app.userResources}
                      currentJob={app.currentJob}
                      onBuildFactory={app.buildFactory}
                      onApplyForJob={app.applyForJob}
                      onWorkJob={app.workJob}
                      onLeaveJob={app.leaveJob}
                      onCollect={app.collectFactory}
                      onUpgrade={app.upgradeFactory}
                      onSaveSettings={app.updateFactorySettings}
                      userId={app.user?.id || null}
                      userResidency={app.userResidency}
                      residencyApplications={app.residencyApplications}
                      onClaimResidency={app.claimResidency}
                      bodyGovernance={app.bodyGovernance}
                      onInitiateGovernance={app.initiateGovernance}
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
                    shipName={app.shipConfig.name}
                  />
                )}
              </div>
            </aside>
          </>
          ) : app.page === "profile" ? (
            <ProfileView app={app} onPlayClick={playClick} />
          ) : app.page === "party" ? (
            <PartyView app={app} />
          ) : app.page === "market" ? (
            <MarketView app={app} onPlayClick={playClick} />
          ) : app.page === "factories" ? (
            <FactoriesView app={app} onPlayClick={playClick} />
          ) : app.page === "fleets" ? (
            <FleetsView app={app} onPlayClick={playClick} />
          ) : app.page === "articles" ? (
            <ArticlesView app={app} onPlayClick={playClick} />
          ) : app.page === "empire" ? (
            <EmpireView app={app} onPlayClick={playClick} />
          ) : (
            <div className={`flex-1 bg-background/40 backdrop-blur-sm p-4 ${app.page === 'shipyard' ? 'sm:p-4' : 'sm:p-12'} custom-scrollbar animate-in slide-in-from-bottom-2 duration-500 flex flex-col ${app.page === 'shipyard' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
               <div className={`max-w-6xl mx-auto w-full flex flex-col ${app.page === 'shipyard' ? 'flex-1 min-h-0 h-full' : 'space-y-12 pb-24'}`}>
                  {app.page !== 'shipyard' && (
                    <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-primary/20 pb-10">
                     <div className="flex items-center gap-5">
                        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg shadow-[0_0_20px_hsl(var(--primary)/0.1)]">
                           {app.page === "skills" && <Sparkles size={32} className="text-primary" />}
                        </div>
                        <div>
                           <h1 className="font-display text-2xl sm:text-4xl text-primary text-glow uppercase tracking-[0.2em]">
                              {app.page === "skills" && "Neural Uplink"}
                           </h1>
                           <p className="font-mono-hud text-[10px] sm:text-xs text-muted-foreground uppercase tracking-[0.3em] mt-2">
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

                        {!["skills", "shipyard"].includes(app.page) && (
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
      <footer className="relative z-50 border-t border-primary/20 bg-background/80 backdrop-blur-md flex items-center justify-between px-3 h-8 shrink-0">
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
        open={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen} 
        quality={graphicsQuality}
        onQualityChange={setGraphicsQuality}
        musicVolume={app.musicVolume}
        onMusicVolumeChange={app.setMusicVolume}
        sfxVolume={app.sfxVolume}
        onSfxVolumeChange={app.setSfxVolume}
        fxVolume={app.fxVolume}
        onFxVolumeChange={app.setFxVolume}
        audioEnabled={app.audioEnabled}
        onAudioEnabledChange={app.setAudioEnabled}
        theme={app.theme}
        onThemeChange={app.setTheme}
        onPlayClick={playClick}
      />

      <ChangelogModal 
        open={isChangelogOpen} 
        onOpenChange={setIsChangelogOpen} 
        onPlayClick={playClick}
      />

      <AnimatePresence>
        {isCreditsOpen && (
          <CreditsScreen 
            onClose={() => setIsCreditsOpen(false)} 
            onPlayClick={playClick}
          />
        )}
      </AnimatePresence>

      {app.page !== "map" && <Sonner position="top-right" theme="dark" closeButton />}

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
        {app.user && !app.vesselId && app.initialDataLoaded && (
          <motion.div 
            key="onboarding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400]"
          >
            <CommanderOnboarding 
              onComplete={app.completeOnboarding}
              playClick={playClick}
              playSuccess={playSuccess}
              playType={playType}
            />
          </motion.div>
        )}


        {/* Authentication Screen - Priority 1 */}
        {!app.user && !app.sessionLoading && (
          <motion.div 
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 z-[300]"
          >
            <AuthScreen 
              onSuccess={() => {}} 
              playClick={playClick}
              playSuccess={playSuccess}
            />
          </motion.div>
        )}

        {/* Welcome Screen for returning users to unlock Audio Context */}
        {app.user && !hasInteracted && (
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
          className="hud-panel p-8 md:p-12 border border-primary/40 bg-background/60 hover:bg-primary/10 transition-colors flex flex-col items-center gap-6 group cursor-pointer w-[300px] md:w-[400px]"
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
      <div className="hud-panel hud-corner bg-background/40 backdrop-blur-md border border-primary/20 px-3 py-2 flex items-center gap-3">
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

  if (app.view === "ship") {
    title = "Commander's Vessel";
    subtitle = "Flagship · Deep Space";
  } else if (app.view === "body" && app.body) {
    title = app.body.name;
    subtitle =
      app.body.population > 0
        ? `${app.body.type.replace("_", " ")} · ${app.body.population.toFixed(1)}M pop`
        : `${app.body.type.replace("_", " ")} · uninhabited`;
  } else if (app.system) {
    title = app.system.name;
    subtitle = `${app.system.bodies.length} bodies · ${app.system.starType.toUpperCase()}-class`;
  }

  const isAdjacent = app.galaxy.hyperlanes.some(h => (h.a === app.playerSystemId && h.b === app.system?.id) || (h.a === app.system?.id && h.b === app.playerSystemId));

  const canJump = app.system && !app.travel && 
                 app.playerSystemId !== app.system.id && 
                 isAdjacent;

  const canEnterSystem = app.view === "galaxy" && app.system !== null;
  const canTravel = (app.view === "system" || app.view === "body") && app.body && 
                    app.playerSystemId === app.system?.id && 
                    app.playerBodyId !== app.body.id && 
                    !app.travel && !app.body.id.startsWith("ship");

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
            <div className="font-display text-sm uppercase tracking-[0.15em] text-primary text-glow truncate w-full flex items-center gap-2">
              {app.travel?.type === "intra" && <Zap size={10} className="text-warning animate-pulse" />}
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

          {canTravel && (
            <button
              onClick={() => {
                app.initiateTravelToBody(app.body!.id);
                onPlayClick();
              }}
              className="shrink-0 flex items-center gap-1.5 bg-primary/20 text-primary border border-primary/50 px-3 py-1.5 rounded font-mono-hud font-bold text-[9px] tracking-widest hover:bg-primary/30 active:scale-95 transition-all"
            >
              <Zap size={14} fill="currentColor" />
              TRAVEL
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
              <BodyOverview 
                body={app.body} 
                galaxy={app.galaxy} 
                hideHeader={true} 
                onPlayClick={onPlayClick} 
                onSelectEmpire={onSelectEmpire}
                playerSystemId={app.playerSystemId}
                playerBodyId={app.playerBodyId}
                travel={app.travel}
                initiateTravelToBody={app.initiateTravelToBody}
                currentTime={app.currentTime}
                factories={app.factories}
                bodyResources={app.bodyResources}
                userResources={app.userResources}
                currentJob={app.currentJob}
                onBuildFactory={app.buildFactory}
                onApplyForJob={app.applyForJob}
                onWorkJob={app.workJob}
                onLeaveJob={app.leaveJob}
                onCollect={app.collectFactory}
                onUpgrade={app.upgradeFactory}
                onSaveSettings={app.updateFactorySettings}
                userId={app.user?.id || null}
                userResidency={app.userResidency}
                residencyApplications={app.residencyApplications}
                onClaimResidency={app.claimResidency}
                bodyGovernance={app.bodyGovernance}
                onInitiateGovernance={app.initiateGovernance}
                isExplored={!app.fogOfWar || app.exploredSystemIds.has(app.system.id)}
                isVisited={app.exploredBodyIds.has(`${app.system.id}:${app.body.id}`)}
              />
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



function EmpireLogo({ empire, size = 120 }: { empire: Empire; size?: number }) {
  const Icon = ICON_MAP[empire.logo.symbol] || Shield;
  const primaryColor = `hsl(${empire.hue} 70% 50%)`;
  const secondaryColor = `hsl(${empire.logo.secondaryHue} 70% 60%)`;
  
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
       {/* Background Hexagon with Pattern */}
       <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
          <defs>
            <pattern id={`pattern-${empire.id.replace(/:/g, '-')}`} patternUnits="userSpaceOnUse" width="10" height="10">
               {empire.logo.pattern === 'grid' && <path d="M 10 0 L 0 0 0 10" fill="none" stroke={primaryColor} strokeWidth="0.5" opacity="0.3" />}
               {empire.logo.pattern === 'dots' && <circle cx="2" cy="2" r="1" fill={primaryColor} opacity="0.3" />}
               {empire.logo.pattern === 'waves' && <path d="M 0 5 Q 2.5 0 5 5 T 10 5" fill="none" stroke={primaryColor} strokeWidth="0.5" opacity="0.3" />}
               {empire.logo.pattern === 'circles' && <circle cx="5" cy="5" r="3" fill="none" stroke={primaryColor} strokeWidth="0.5" opacity="0.3" />}
               {empire.logo.pattern === 'cross' && <path d="M 0 0 L 10 10 M 10 0 L 0 10" stroke={primaryColor} strokeWidth="0.5" opacity="0.3" />}
            </pattern>
          </defs>
          <path 
            d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z" 
            fill={`url(#pattern-${empire.id.replace(/:/g, '-')})`}
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

  const getOfficialColor = (official: any) => {
    if (!official) return '#444';
    return empire.government.council.factions.find(f => f.name === official.party)?.color || "var(--primary)";
  };

  // Leadership Ring (6 fixed seats, potentially vacant)
  const leadershipSeats = [
    { key: 'pres', role: empire.government.type.includes("Dictator") || empire.government.type.includes("party") || empire.government.type.includes("monarchy") ? "Head of State" : "President", official: empire.government.president, color: getOfficialColor(empire.government.president) },
    { key: 'vp', role: "Vice President", official: empire.government.vicePresident, color: getOfficialColor(empire.government.vicePresident) },
    ...Array.from({ length: 4 }).map((_, i) => ({
      key: `min-${i}`,
      role: empire.government.ministers[i]?.role || "Minister",
      official: empire.government.ministers[i] || null,
      color: getOfficialColor(empire.government.ministers[i])
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
            <div className="hud-panel p-3 border-l-2 bg-background/90 backdrop-blur-md min-w-[140px] shadow-2xl" style={{ borderLeftColor: hoveredSeat.color }}>
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
  const [activeTab, setActiveTab] = useState<"overview" | "parliament" | "government" | "laws" | "diplomacy">("overview");
  const [newEmpireName, setNewEmpireName] = useState("");
  const [newEmpireTag, setNewEmpireTag] = useState("");
  let empire = app.galaxy.empires.find(e => e.id === app.selectedEmpireId);
  if (!empire) {
    empire = app.playerEmpires.find(e => e.id === app.selectedEmpireId);
  }

  // Handle provisional body-based governments
  const bodyId = app.selectedEmpireId;
  const gov = bodyId ? app.bodyGovernance[bodyId] : null;
  
  if (!empire && gov && gov.status === 'governed') {
    const body = app.galaxy.bodyById[bodyId!];
    empire = {
      id: bodyId!,
      name: (body?.name || "Unknown") + " Provisional Authority",
      tag: "PROV",
      hue: 200,
      logo: { symbol: 'Shield', pattern: 'grid', secondaryHue: 20 },
      government: { 
        type: 'Provisional Council', 
        president: null, 
        vicePresident: null, 
        ministers: [], 
        council: { totalSeats: 20, factions: [], seats: [] } 
      }
    } as any as Empire;
  }

  if (!empire) return <div className="p-20 text-center text-primary font-display uppercase tracking-widest animate-pulse">Sovereign Data Encrypted</div>;

  const systemsOwned = app.galaxy.systems.filter(s => s.bodies.some(b => b.ownerId === empire.id));
  const bodiesOwned = app.galaxy.systems.flatMap(s => s.bodies).filter(b => b.ownerId === empire.id);
  const totalPop = bodiesOwned.reduce((sum, b) => sum + b.population, 0);

  const activeElection = app.activeElections.find(e => e.stateId === empire.id);
  const hasVoted = app.userVotes.some(v => v.electionId === activeElection?.id);
  const empireData = app.playerEmpiresFull.find(e => e.id === empire.id);
  const empirePhase = empireData?.phase ?? 'active';
  const isLeader = empireData?.leaderId === app.user?.id;
  const activeElectionCandidates = app.electionCandidates.filter(c => c.electionId === activeElection?.id);
  const myElectionBallot = activeElection ? app.electionBallots[activeElection.id] : null;
  const empireMinsters = app.ministerialAssignments.filter(m => m.empireId === empire.id);
  const MINISTERIAL_ROLES = ['Minister of Finance', 'Minister of Defense', 'Minister of Foreign Affairs', 'Minister of Justice', 'Minister of Industry'];
  const electionTimeLeft = activeElection ? Math.max(0, new Date(activeElection.endTime).getTime() - Date.now()) : 0;
  const electionExpired = activeElection && electionTimeLeft <= 0;

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

      {/* Tabs */}
      <div className="px-6 border-b border-primary/20 bg-background/20 flex gap-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'State Overview', icon: LayoutGrid },
          { id: 'parliament', label: 'Parliament', icon: Scale },
          { id: 'government', label: 'Cabinet', icon: Crown },
          { id: 'laws', label: 'Legislation', icon: BookOpen },
          { id: 'diplomacy', label: 'Diplomacy', icon: Globe },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 font-display text-[10px] uppercase tracking-widest transition-all border-b-2 ${
                activeTab === tab.id 
                  ? 'border-primary text-primary bg-primary/5' 
                  : 'border-transparent text-muted-foreground hover:text-primary hover:bg-primary/5'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar relative z-10">
        <div className="max-w-6xl mx-auto">
          {activeTab === "overview" && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                            {empire.government.council.factions.map(f => {
                              const outerCount = empire.government.council.seats.filter(s => s.factionId === f.id && !!s.occupantName).length;
                              const innerCount = [
                                empire.government.president,
                                empire.government.vicePresident,
                                ...empire.government.ministers
                              ].filter(m => m && m.party === f.name).length;
                              const actualCount = outerCount + innerCount;
                              
                              if (actualCount === 0) return null;
                              
                              return (
                                <div key={f.id} className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }} />
                                  <span className="font-mono-hud text-[8px] uppercase text-muted-foreground">{f.name} ({actualCount})</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        <div className="space-y-6">
                          <div className="p-4 border border-primary/10 bg-background/20 rounded space-y-4">
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
                          {empire.government.ministers.map((m, i) => {
                            const partyColor = empire.government.council.factions.find(f => f.name === m.party)?.color || "hsl(var(--primary) / 0.4)";
                            return (
                              <div key={i} className="flex items-center gap-3 p-3 border border-primary/5 bg-white/5 rounded">
                                <div className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] shrink-0" style={{ backgroundColor: partyColor }} />
                                <div className="min-w-0">
                                  <div className="text-[8px] font-mono-hud text-primary/60 uppercase truncate">{m.role}</div>
                                  <div className="text-[10px] font-display uppercase truncate">{m.name}</div>
                                </div>
                              </div>
                            );
                          })}
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
        )}

          {activeTab === "parliament" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="hud-panel p-8 border border-primary/20 bg-primary/5">
                <h3 className="font-display text-sm uppercase tracking-[0.3em] text-primary mb-10 flex items-center gap-2">
                  <Scale size={16} />
                  State Council & Parliamentary Distribution
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <CouncilHemicycle empire={empire} />
                  </div>
                  <div className="space-y-6">
                     <div className="bg-background/40 p-6 rounded border border-primary/10">
                        <div className="text-[10px] font-mono-hud text-primary uppercase tracking-[0.2em] mb-4">Legislative Composition</div>
                        <div className="space-y-4">
                           {empire.government.council.factions.map(f => {
                             const seats = empire.government.council.seats.filter(s => s.factionId === f.id && !!s.occupantName).length;
                             const percent = (seats / empire.government.council.totalSeats) * 100;
                             return (
                               <div key={f.id} className="space-y-2">
                                 <div className="flex justify-between text-[10px] font-mono-hud uppercase">
                                    <span className="text-muted-foreground">{f.name}</span>
                                    <span className="text-foreground">{seats} Seats ({percent.toFixed(0)}%)</span>
                                 </div>
                                 <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: f.color, width: `${percent}%` }} />
                                 </div>
                               </div>
                             );
                           })}
                        </div>
                     </div>
                  </div>
                </div>
              </div>

              <div className="hud-panel p-8 border border-primary/20 bg-primary/5">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-display text-sm uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                    <UsersIcon size={16} />
                    Active Election Cycle
                  </h3>
                  {activeElection && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-success/10 border border-success/20 rounded">
                       <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                       <span className="text-[9px] font-mono-hud text-success uppercase tracking-widest">
                         {activeElection.electionType === 'parliamentary' ? 'Primary Election Live' : 'Leader Election Live'}
                       </span>
                    </div>
                  )}
                </div>

                {activeElection ? (
                  <div className="space-y-8">
                    {/* Phase banner */}
                    <div className={`p-4 rounded border text-center ${activeElection.electionType === 'parliamentary' ? 'bg-primary/10 border-primary/20' : 'bg-warning/10 border-warning/20'}`}>
                      <div className="text-[8px] font-mono-hud uppercase tracking-widest text-muted-foreground mb-1">
                        {activeElection.electionType === 'parliamentary' ? 'Phase 1 of 2' : 'Phase 2 of 2'}
                      </div>
                      <div className={`text-sm font-display uppercase tracking-widest ${activeElection.electionType === 'parliamentary' ? 'text-primary' : 'text-warning'}`}>
                        {activeElection.electionType === 'parliamentary' ? 'Primary Parliamentary Election' : 'Head of State Election'}
                      </div>
                      <div className="text-[9px] font-mono-hud text-muted-foreground mt-2">
                        {activeElection.electionType === 'parliamentary'
                          ? 'Parties compete for council seats. Register your party and invite residents to vote.'
                          : 'Nominate yourself and campaign for Head of State. The top vote-getter wins.'}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="p-4 bg-background/20 border border-primary/10 rounded">
                          <div className="text-[8px] font-mono-hud text-muted-foreground uppercase mb-1">Election Type</div>
                          <div className="text-xs font-display text-primary uppercase tracking-widest">{activeElection.electionType === 'parliamentary' ? 'Primary' : 'Presidential'}</div>
                       </div>
                       <div className="p-4 bg-background/20 border border-primary/10 rounded">
                          <div className="text-[8px] font-mono-hud text-muted-foreground uppercase mb-1">Time Remaining</div>
                          <div className="text-xs font-display text-warning uppercase tracking-widest">
                            {electionExpired ? 'Elapsed — Awaiting resolution' : (Math.floor(electionTimeLeft / 3600000) + 'h ' + Math.floor((electionTimeLeft % 3600000) / 60000) + 'm')}
                          </div>
                       </div>
                       <div className="p-4 bg-background/20 border border-primary/10 rounded">
                          <div className="text-[8px] font-mono-hud text-muted-foreground uppercase mb-1">Your Status</div>
                          <div className={`text-xs font-display uppercase tracking-widest ${myElectionBallot ? 'text-success' : 'text-destructive'}`}>
                            {myElectionBallot ? 'Ballot Cast' : 'No Vote Registered'}
                          </div>
                       </div>
                    </div>

                    {/* Candidates / voting */}
                    {activeElection.electionType === 'parliamentary' ? (
                      <div className="space-y-6">
                        <div className="h-px bg-primary/10 w-full" />
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-mono-hud text-primary/60 uppercase tracking-[0.3em]">Registered Parties</h4>
                          <div className="flex gap-4">
                            {electionExpired && (
                              <button onClick={() => app.resolveElection(activeElection.id)} className="px-4 py-2 bg-success text-background hover:bg-success/80 font-display text-[9px] uppercase tracking-widest transition-all rounded shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                                Certify Results & Form Council
                              </button>
                            )}
                            {app.parties.some(p => p.headId === app.user?.id && p.regionId === empire.id) && !activeElectionCandidates.some(c => app.parties.find(p => p.id === c.partyId)?.headId === app.user?.id) && (
                              <button onClick={() => {
                                const myParty = app.parties.find(p => p.headId === app.user?.id && p.regionId === empire.id);
                                if (myParty) app.registerPartyForElection(activeElection.id, myParty.id);
                              }} className="px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-display text-[9px] uppercase tracking-widest transition-all rounded">
                                Register My Party
                              </button>
                            )}
                          </div>
                        </div>
                        {activeElectionCandidates.length === 0 ? (
                          <div className="py-10 text-center border border-dashed border-primary/20 rounded text-[10px] font-mono-hud text-muted-foreground uppercase italic">No parties registered yet</div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeElectionCandidates.map(cand => {
                              const party = app.parties.find(p => p.id === cand.partyId);
                              const voted = myElectionBallot === cand.id;
                              return party ? (
                                <button key={cand.id} onClick={() => !myElectionBallot && app.voteInElection(activeElection.id, cand.id)}
                                  className={`hud-panel p-5 border transition-all text-left group relative overflow-hidden ${voted ? 'border-success/40 bg-success/5' : 'border-primary/20 hover:border-primary/60 bg-background/40 hover:bg-primary/5'}`}>
                                  <div className="flex items-center gap-4 mb-3">
                                    <div className="w-10 h-10 rounded border border-primary/20 flex items-center justify-center bg-background" style={{ borderLeft: `4px solid hsl(${party.hue || 0} 70% 55%)` }}>
                                      <UsersIcon size={20} style={{ color: `hsl(${party.hue || 0} 70% 55%)` }} />
                                    </div>
                                    <div>
                                      <div className="text-xs font-display uppercase tracking-widest">{party.name}</div>
                                      <div className="text-[8px] font-mono-hud text-muted-foreground uppercase">{party.tag}</div>
                                    </div>
                                  </div>
                                  <div className="flex justify-between text-[8px] font-mono-hud uppercase mb-2">
                                    <span className="text-muted-foreground">Votes</span>
                                    <span className="text-primary">{cand.voteCount}</span>
                                  </div>
                                  <div className={`w-full py-2 font-display text-[9px] uppercase tracking-widest text-center rounded transition-all ${voted ? 'bg-success/20 text-success' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-background'}`}>
                                    {voted ? 'Voted' : myElectionBallot ? 'Ballot Cast' : 'Cast Ballot'}
                                  </div>
                                </button>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="h-px bg-warning/10 w-full" />
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-mono-hud text-warning/60 uppercase tracking-[0.3em]">Candidates for Head of State</h4>
                          <div className="flex gap-4">
                            {electionExpired && (
                              <button onClick={() => app.resolveElection(activeElection.id)} className="px-4 py-2 bg-success text-background hover:bg-success/80 font-display text-[9px] uppercase tracking-widest transition-all rounded shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                                Certify Election & Inaugurate Leader
                              </button>
                            )}
                            {!activeElectionCandidates.some(c => c.userId === app.user?.id) && (
                              <button onClick={() => app.nominateForLeaderElection(activeElection.id)}
                                className="px-4 py-2 bg-warning/10 hover:bg-warning/20 border border-warning/30 text-warning font-display text-[9px] uppercase tracking-widest transition-all rounded">
                                Nominate Myself
                              </button>
                            )}
                          </div>
                        </div>
                        {activeElectionCandidates.length === 0 ? (
                          <div className="py-10 text-center border border-dashed border-warning/20 rounded text-[10px] font-mono-hud text-muted-foreground uppercase italic">No candidates yet — nominate yourself</div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeElectionCandidates.map(cand => {
                              const voted = myElectionBallot === cand.id;
                              const isMe = cand.userId === app.user?.id;
                              return (
                                <button key={cand.id} onClick={() => !myElectionBallot && !isMe && app.voteInElection(activeElection.id, cand.id)}
                                  className={`hud-panel p-5 border transition-all text-left ${voted ? 'border-success/40 bg-success/5' : 'border-warning/20 hover:border-warning/60 bg-background/40'}`}>
                                  <div className="flex items-center gap-4 mb-3">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${cand.userId}`} alt="" className="w-10 h-10 rounded-full border border-warning/20" />
                                    <div>
                                      <div className="text-xs font-display uppercase tracking-widest text-warning">{isMe ? 'You' : 'Candidate'}</div>
                                      <div className="text-[8px] font-mono-hud text-muted-foreground uppercase">{cand.voteCount} votes</div>
                                    </div>
                                  </div>
                                  <div className={`w-full py-2 font-display text-[9px] uppercase tracking-widest text-center rounded ${voted ? 'bg-success/20 text-success' : isMe ? 'bg-warning/5 text-warning/40 cursor-default' : 'bg-warning/10 text-warning hover:bg-warning/20'}`}>
                                    {voted ? 'Voted' : isMe ? 'Your Candidacy' : myElectionBallot ? 'Ballot Cast' : 'Vote For'}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {electionExpired && (
                      <div className="pt-4 border-t border-primary/10">
                        <button onClick={() => app.resolveElection(activeElection.id)}
                          className="w-full py-3 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-display text-[10px] uppercase tracking-widest transition-all rounded">
                          Resolve Election & Advance Phase
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-20 text-center border border-dashed border-primary/20 rounded flex flex-col items-center justify-center">
                     <UsersIcon size={32} className="text-primary/20 mb-4" />
                     <div className="text-[10px] font-mono-hud text-muted-foreground uppercase tracking-[0.3em] italic">
                       {empirePhase === 'active' ? 'State Assembly is stable. No active elections.' :
                        empirePhase === 'primary' ? 'Primary election starting — check back shortly.' :
                        empirePhase === 'leader' ? 'Leader election starting — check back shortly.' :
                        'Governance pending state formation.'}
                     </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "government" && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="hud-panel p-8 border border-primary/20 bg-primary/5">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="font-display text-sm uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                      <Crown size={16} />
                      Executive Branch &amp; Cabinet
                    </h3>
                    {empirePhase === 'active' ? (
                      <div className="px-3 py-1 bg-success/10 border border-success/20 rounded text-[9px] font-mono-hud text-success uppercase tracking-widest">Fully Governed</div>
                    ) : (
                      <div className="px-3 py-1 bg-warning/10 border border-warning/20 rounded text-[9px] font-mono-hud text-warning uppercase tracking-widest animate-pulse">{empirePhase === 'primary' ? 'Primary Elections' : empirePhase === 'leader' ? 'Leader Election' : 'Formation'}</div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                     <div className="space-y-6">
                        {/* Head of State */}
                        <div className="p-6 border border-primary/20 bg-background/40 rounded-lg relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Shield size={80} /></div>
                           <div className="text-[10px] font-mono-hud text-primary uppercase tracking-[0.4em] mb-4">Head of State</div>
                           {empireData?.leaderId ? (
                             <div className="flex items-center gap-6">
                               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${empireData.leaderId}`} alt="" className="w-16 h-16 rounded-full border-2 border-primary/30" />
                               <div>
                                 <div className="text-xl font-display uppercase tracking-wider text-glow">
                                   {empireData.leaderId === app.user?.id ? app.playerName || 'You' : (app.userProfiles[empireData.leaderId!]?.name || 'Commander')}
                                 </div>
                                 <div className="text-[10px] font-mono-hud text-muted-foreground uppercase tracking-widest">
                                   {empireData.leaderId === app.user?.id ? 'You are Head of State' : 'Head of State'}
                                 </div>
                               </div>
                             </div>
                           ) : (
                             <div className="flex items-center gap-4 opacity-50">
                               <div className="w-16 h-16 rounded-full border-2 border-dashed border-primary/20 flex items-center justify-center"><Crown size={24} className="text-primary/30" /></div>
                               <div>
                                 <div className="text-xl font-display uppercase tracking-wider">VACANT</div>
                                 <div className="text-[10px] font-mono-hud text-muted-foreground uppercase tracking-widest">
                                   {empirePhase === 'leader' ? 'Leader election in progress' : 'Awaiting election results'}
                                 </div>
                               </div>
                             </div>
                           )}
                        </div>
                     </div>

                     {/* Ministers */}
                     <div className="space-y-4">
                        <div className="text-[10px] font-mono-hud text-primary uppercase tracking-[0.4em] mb-4 border-b border-primary/10 pb-4 flex items-center justify-between">
                          <span>Appointed Ministers</span>
                          {isLeader && <span className="text-primary/40 text-[8px]">You may appoint</span>}
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {MINISTERIAL_ROLES.map(role => {
                            const assignment = empireMinsters.find(m => m.roleName === role);
                            return (
                              <div key={role} className="flex items-center justify-between p-4 border border-primary/10 bg-background/20 rounded hover:border-primary/30 transition-all group">
                                 <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full border border-primary/20 overflow-hidden bg-background group-hover:scale-110 transition-transform">
                                      {assignment ? (
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${assignment.userId}`} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center opacity-20"><UsersIcon size={14} /></div>
                                      )}
                                    </div>
                                    <div>
                                       <div className="text-[9px] font-mono-hud text-primary/60 uppercase">{role}</div>
                                       <div className="text-xs font-display uppercase tracking-wider">
                                         {assignment ? (assignment.userId === app.user?.id ? 'You' : assignment.userName || 'Commander') : 'Vacant'}
                                       </div>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-2">
                                   {assignment && isLeader && (
                                     <button onClick={() => app.removeMinisterialRole(assignment.id)} className="text-[8px] font-mono-hud text-destructive/60 hover:text-destructive uppercase transition-colors">Remove</button>
                                   )}
                                   {!assignment && isLeader && (
                                     <button onClick={() => {
                                       const userId = prompt('Enter player User ID to appoint:');
                                       if (userId) app.assignMinisterialRole(empire.id, userId, role);
                                     }} className="text-[8px] font-mono-hud text-primary/40 hover:text-primary uppercase transition-colors">Appoint</button>
                                   )}
                                 </div>
                              </div>
                            );
                          })}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}
          {activeTab === "laws" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="hud-panel p-8 border border-primary/20 bg-primary/5">
                  <div className="flex items-center justify-between mb-10">
                     <h3 className="font-display text-sm uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                       <BookOpen size={16} />
                       Active Legislation & Decrees
                     </h3>
                     <button className="px-4 py-2 border border-primary/30 hover:bg-primary/10 text-primary font-display text-[9px] uppercase tracking-widest transition-all rounded">
                        Propose New Law
                     </button>
                  </div>
                  
                  <div className="space-y-4">
                     {empire.id in app.bodyGovernance && app.bodyGovernance[empire.id].status === 'governed' && (() => {
                       const referendum = app.formationReferendums.find(r => r.bodyId === empire.id);
                       const myBallot = referendum ? app.userFormationBallots[referendum.id] : null;
                       const isResident = app.userResidency?.bodyId === empire.id;
                       const timeLeft = referendum ? Math.max(0, new Date(referendum.endsAt).getTime() - Date.now()) : 0;
                       const hoursLeft = Math.floor(timeLeft / 3600000);
                       const minutesLeft = Math.floor((timeLeft % 3600000) / 60000);
                       const expired = referendum && timeLeft <= 0;
                       return (
                         <div className="p-6 border-2 border-warning/30 bg-warning/5 rounded group relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-4 opacity-5"><Crown size={64} /></div>
                           <div className="flex items-center justify-between mb-4">
                             <div className="flex items-center gap-3">
                               <div className="px-2 py-0.5 rounded font-mono-hud text-[8px] uppercase tracking-widest bg-warning/20 text-warning animate-pulse">
                                 {referendum ? 'Referendum Active' : 'State Formation Decree'}
                               </div>
                               <span className="text-[8px] font-mono-hud text-muted-foreground uppercase">Sovereignty</span>
                             </div>
                             <span className="text-[7px] font-mono-hud text-warning/60 uppercase">Ref: PRV-001</span>
                           </div>
                           {!referendum ? (
                             <>
                               <h4 className="text-base font-display uppercase tracking-widest mb-2 text-warning">Found State</h4>
                               <p className="text-[10px] font-mono-hud text-muted-foreground leading-relaxed mb-6">
                                 Propose the formation of a sovereign state. All residents vote over 24 hours. A majority YES triggers primary parliamentary elections, followed by a head of state election.
                               </p>
                               {isResident ? (
                                 <div className="space-y-4 max-w-md relative z-10">
                                   <input type="text" placeholder="State Name (e.g. Terran Mandate)"
                                     value={newEmpireName} onChange={(e) => setNewEmpireName(e.target.value)}
                                     className="w-full bg-background/50 border border-warning/20 rounded px-3 py-2 text-xs font-display uppercase tracking-wider text-warning placeholder:text-warning/30 focus:outline-none focus:border-warning/60"
                                   />
                                   <div className="flex gap-4">
                                     <input type="text" placeholder="TAG (3-4 chars)" maxLength={4}
                                       value={newEmpireTag} onChange={(e) => setNewEmpireTag(e.target.value)}
                                       className="w-28 bg-background/50 border border-warning/20 rounded px-3 py-2 text-xs font-display uppercase tracking-widest text-warning placeholder:text-warning/30 focus:outline-none focus:border-warning/60"
                                     />
                                     <button onClick={() => {
                                       if (!newEmpireName || !newEmpireTag) { toast.error('Provide both a state name and tag.'); return; }
                                       app.proposeStateFormation(empire.id, newEmpireName, newEmpireTag.toUpperCase(), Math.floor(Math.random() * 360));
                                     }} className="flex-1 bg-warning/10 hover:bg-warning/20 border border-warning/40 text-warning font-display text-[10px] uppercase tracking-widest transition-all rounded py-2">
                                       Open Referendum
                                     </button>
                                   </div>
                                 </div>
                               ) : (
                                 <p className="text-[10px] font-mono-hud text-destructive">Only residents may propose state formation.</p>
                               )}
                             </>
                           ) : (
                             <>
                               <h4 className="text-base font-display uppercase tracking-widest mb-1 text-warning">{referendum.empireName} [{referendum.empireTag}]</h4>
                               <p className="text-[10px] font-mono-hud text-muted-foreground mb-6">Active referendum — residents are voting on state formation.</p>
                               <div className="grid grid-cols-3 gap-4 mb-6">
                                 <div className="p-4 bg-success/10 border border-success/20 rounded text-center">
                                   <div className="text-2xl font-display text-success">{referendum.yesVotes}</div>
                                   <div className="text-[8px] font-mono-hud text-muted-foreground uppercase mt-1">Yes</div>
                                 </div>
                                 <div className="p-4 bg-destructive/10 border border-destructive/20 rounded text-center">
                                   <div className="text-2xl font-display text-destructive">{referendum.noVotes}</div>
                                   <div className="text-[8px] font-mono-hud text-muted-foreground uppercase mt-1">No</div>
                                 </div>
                                 <div className="p-4 bg-warning/10 border border-warning/20 rounded text-center">
                                   <div className="text-lg font-display text-warning">{expired ? 'Elapsed' : (hoursLeft + 'h ' + minutesLeft + 'm')}</div>
                                   <div className="text-[8px] font-mono-hud text-muted-foreground uppercase mt-1">Remaining</div>
                                 </div>
                               </div>
                               {!myBallot && isResident && !expired && (
                                 <div className="flex gap-4">
                                   <button onClick={() => app.voteOnFormation(referendum.id, 'yes')} className="flex-1 py-3 bg-success/10 hover:bg-success/20 border border-success/40 text-success font-display text-[10px] uppercase tracking-widest transition-all rounded">Vote YES</button>
                                   <button onClick={() => app.voteOnFormation(referendum.id, 'no')} className="flex-1 py-3 bg-destructive/10 hover:bg-destructive/20 border border-destructive/40 text-destructive font-display text-[10px] uppercase tracking-widest transition-all rounded">Vote NO</button>
                                 </div>
                               )}
                               {myBallot && (
                                 <div className={'text-center py-3 rounded border text-[10px] font-mono-hud uppercase tracking-widest ' + (myBallot === 'yes' ? 'bg-success/10 border-success/30 text-success' : 'bg-destructive/10 border-destructive/30 text-destructive')}>
                                   Ballot Cast: {myBallot.toUpperCase()} — Awaiting result
                                 </div>
                               )}
                               {expired && (
                                 <button onClick={() => app.resolveFormationReferendum(referendum.id)} className="w-full mt-4 py-3 bg-warning/20 hover:bg-warning/30 border border-warning/40 text-warning font-display text-[10px] uppercase tracking-widest transition-all rounded shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                                   Certify Result & Form State
                                 </button>
                               )}
                               {!isResident && <p className="text-[10px] font-mono-hud text-muted-foreground mt-4">Only residents may vote.</p>}
                             </>
                           )}
                         </div>
                       );
                     })()}
                     {[
                       { title: "Planetary Resource Tax", desc: "Sets the baseline industrial export tax for all territorial bodies to 15%.", status: "Active", type: "Economic" },
                       { title: "Inter-System Transit Levy", desc: "Implements a 50 SC fee for FTL travel into sovereign space for non-residents.", status: "Proposed", type: "Security" },
                       { title: "Industrial Minimum Wage", desc: "Mandates a floor of 450 SC per shift for all state-certified factories.", status: "Active", type: "Labor" },
                       { title: "Territorial Expansion Act", desc: "Authorizes the deployment of automated outposts to unclaimed sectors in the outer rim.", status: "Voting", type: "Expansion" }
                     ].map((law, i) => (
                       <div key={i} className="p-6 border border-primary/10 bg-background/20 rounded group hover:border-primary/40 transition-all">
                          <div className="flex items-center justify-between mb-3">
                             <div className="flex items-center gap-3">
                                <div className={`px-2 py-0.5 rounded font-mono-hud text-[8px] uppercase tracking-widest ${
                                  law.status === "Active" ? "bg-success/20 text-success" : 
                                  law.status === "Voting" ? "bg-warning/20 text-warning animate-pulse" : 
                                  "bg-primary/20 text-primary"
                                }`}>
                                  {law.status}
                                </div>
                                <span className="text-[8px] font-mono-hud text-muted-foreground uppercase">{law.type}</span>
                             </div>
                             <span className="text-[7px] font-mono-hud text-primary/40 uppercase">Ref: LEG-2024-{1000 + i}</span>
                          </div>
                          <h4 className="text-base font-display uppercase tracking-widest mb-2 group-hover:text-primary transition-colors">{law.title}</h4>
                          <p className="text-[10px] font-mono-hud text-muted-foreground leading-relaxed">{law.desc}</p>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          )}

          {activeTab === "diplomacy" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="hud-panel p-8 border border-primary/20 bg-primary/5">
                  <div className="flex items-center justify-between mb-10">
                     <h3 className="font-display text-sm uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                       <Globe size={16} />
                       Diplomatic Relations & Expansion
                     </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-6">
                        <div className="p-6 border border-primary/10 bg-background/20 rounded">
                           <h4 className="text-sm font-display uppercase tracking-widest mb-2 text-primary flex items-center gap-2">
                             <Target size={14} />
                             Territorial Annexation
                           </h4>
                           <p className="text-[10px] font-mono-hud text-muted-foreground leading-relaxed mb-6">
                              Expand sovereign borders by annexing neighboring independent regions. Requires a majority vote in parliament and a significant expenditure of State Capital (SC) to integrate the new territory.
                           </p>
                           <button className="w-full bg-primary/10 hover:bg-primary/20 border border-primary/40 text-primary font-display text-[9px] uppercase tracking-widest py-2 rounded transition-all">
                              Propose Annexation
                           </button>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="p-6 border border-warning/10 bg-warning/5 rounded">
                           <h4 className="text-sm font-display uppercase tracking-widest mb-2 text-warning flex items-center gap-2">
                             <Shield size={14} />
                             Inter-State Consolidation
                           </h4>
                           <p className="text-[10px] font-mono-hud text-warning/70 leading-relaxed mb-6">
                              Merge with another sovereign state to form a larger Hegemonic bloc. This requires bilateral agreements between both Heads of State and a supermajority ratification in both parliaments.
                           </p>
                           <button className="w-full bg-warning/10 hover:bg-warning/20 border border-warning/40 text-warning font-display text-[9px] uppercase tracking-widest py-2 rounded transition-all">
                              Draft Consolidation Treaty
                           </button>
                        </div>
                     </div>
                  </div>
                  
                  <div className="mt-8 pt-8 border-t border-primary/10">
                     <h4 className="text-[10px] font-mono-hud text-primary/40 uppercase tracking-[0.4em] mb-6">Active Treaties</h4>
                     <div className="py-12 text-center border border-dashed border-primary/20 rounded">
                        <div className="text-[10px] font-mono-hud text-muted-foreground uppercase tracking-[0.3em] italic">No active diplomatic agreements found.</div>
                     </div>
                  </div>
               </div>
            </div>
          )}
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
