import logo from "@/assets/logo.png";
import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Sheet, SheetContent, SheetOverlay, SheetClose, SheetTitle } from "@/components/ui/sheet";
import { Newspaper, Factory, Rocket, Users, User, Sparkles, Settings, X, Coins, Zap as ZapIcon, Bug, Hexagon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import type { Galaxy } from "@/galaxy/types";

interface Props {
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenMap: () => void;
  onOpenArticles?: () => void;
  onOpenFactories?: () => void;
  onOpenFleets?: () => void;
  onOpenParty?: () => void;
  onOpenSkills?: () => void;
  onOpenChangelog?: () => void;
  onOpenCredits?: () => void;
  ap: number;
  sc: number;
  vt?: number;
  playerName: string;
  playerLevel: number;
  playerXP: number;
  xpToNextLevel: number;
  playerAvatar: string;
  fogOfWar: boolean;
  setFogOfWar: (v: boolean) => void;
  instantJump: boolean;
  setInstantJump: (v: boolean) => void;
  playerSystemName?: string;
  playerSystemId?: string;
  travel?: { targetId?: string; endTime: number; startTime: number; type?: "inter" | "intra" } | null;
  arrival?: { fromId: string; startTime: number; duration: number } | null;
  currentTime: number;
  galaxy: Galaxy;
  onReset: () => void;
  onSetAp: (val: number) => void;
  onPlayClick?: () => void;
  isGameReady?: boolean;
}

import { Eye, EyeOff, Zap, Globe, Compass, Radio, RefreshCcw, BatteryFull } from "lucide-react";

const GAME_MENU = [
  { icon: Globe, label: "Galaxy Map", desc: "Celestial navigation", route: "map" },
  { icon: Newspaper, label: "Articles", desc: "Galactic news feed", route: "articles" },
  { icon: Factory, label: "Factories", desc: "Production lines", route: "factories" },
  { icon: Rocket, label: "Fleets", desc: "Fleet command", route: "fleets" },
  { icon: Users, label: "Party", desc: "Political party", route: "party" },
  { icon: User, label: "Profile", desc: "Commander profile", route: "profile" },
  { icon: Sparkles, label: "Skill Tree", desc: "Doctrines & perks", route: "skills" },
  { icon: Settings, label: "Settings", desc: "Preferences", route: "settings" },
];

export function TopBar({ 
  onOpenSettings, onOpenProfile, onOpenMap, onOpenArticles, 
  onOpenFactories, onOpenFleets, onOpenParty, onOpenSkills, onOpenChangelog, onOpenCredits,
  ap, sc, vt = 0, playerName, playerLevel, playerXP, xpToNextLevel, playerAvatar,
  fogOfWar, setFogOfWar, instantJump, setInstantJump,
  playerSystemName, playerSystemId, travel, arrival, currentTime, galaxy, onReset, onSetAp, onPlayClick, isGameReady = true
}: Props) {
  // Game menu state - Radix Sheet handles escape/outside-click automatically
  const [menuOpen, setMenuOpen] = useState(false);

  const destinationName = useMemo(() => {
    if (!travel?.targetId || !galaxy) return null;
    
    if (travel.type === "intra") {
      const currentSys = playerSystemId ? galaxy.systemById[playerSystemId] : null;
      if (!currentSys) return "Target Vector";
      if (travel.targetId === "star") return currentSys.name;
      const body = currentSys.bodies.find(b => b.id === travel.targetId);
      return body?.name || "Target Vector";
    }
    
    return galaxy.systemById[travel.targetId]?.name || "Deep Space";
  }, [travel, galaxy, playerSystemId]);

  return (
    <header className="z-50 w-full bg-background/80 backdrop-blur-md border-b border-primary/20">
      <div className="px-2 py-1.5 sm:px-4 sm:py-2 flex items-center gap-2 sm:gap-3">
        {/* Placeholder Logo — keeps TopBar layout intact */}
        <button
          tabIndex={-1}
          aria-hidden="true"
          className="shrink-0 -m-1 sm:m-0 p-1 rounded relative opacity-0 pointer-events-none"
        >
          <img
            src={logo}
            alt=""
            className="h-10 sm:h-14 w-auto"
          />
        </button>

        {/* Real Logo — portaled to z-[80] to sit above the sidebar overlay */}
        {typeof document !== "undefined" && createPortal(
          <button
            id="floating-logo"
            onClick={() => {
              onPlayClick?.();
              setMenuOpen((o) => !o);
            }}
            aria-label="Open game menu"
            className={`fixed z-[80] left-1 top-0.5 sm:left-4 sm:top-2 p-1 rounded hover:bg-primary/10 transition-all duration-1000 outline-none focus:outline-none ${isGameReady ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <img
              src={logo}
              alt="Starbound Hegemony"
              className="h-10 sm:h-14 w-auto drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
            />
          </button>,
          document.body
        )}

        {/* Player Profile HUD */}
        <div 
          className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1 bg-primary/5 border border-primary/20 rounded-lg group hover:bg-primary/10 transition-colors cursor-pointer" 
          onClick={() => {
            onPlayClick?.();
            onOpenProfile();
          }}
        >
          {/* Avatar with level badge */}
          <div className="relative shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-primary/40 overflow-hidden shadow-[0_0_10px_hsl(var(--primary)/0.2)]">
              <img src={playerAvatar} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-background border border-primary/40 rounded-full flex items-center justify-center">
              <span className="text-[7px] sm:text-[9px] font-bold text-primary">{playerLevel}</span>
            </div>
          </div>

          {/* Name and XP details - hidden on mobile to save space */}
          <div className="hidden lg:flex flex-col gap-0.5 min-w-[140px]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-display text-[10px] sm:text-[11px] uppercase tracking-wider text-primary text-glow truncate max-w-[120px] lg:max-w-[none]">
                {playerName}
              </span>
              <span className="font-mono-hud text-[7px] sm:text-[8px] text-muted-foreground uppercase tracking-tighter whitespace-nowrap">LVL {playerLevel}</span>
            </div>
            
            {/* XP Progress Bar */}
            <div className="w-full h-1 bg-primary/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary shadow-[0_0_5px_hsl(var(--primary))]" 
                style={{ width: `${(playerXP / xpToNextLevel) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Real-time Location Indicator */}
        <div className="flex items-center gap-1.5 sm:gap-3 px-1.5 sm:px-3 py-1 sm:py-1.5 bg-primary/5 border border-primary/15 rounded-lg border-l-4 border-l-cyan-500 min-w-0 flex-grow max-w-[140px] sm:min-w-[180px] sm:max-w-none">
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Compass size={10} className={`${(travel || arrival) ? "text-cyan-400 animate-spin-slow" : "text-cyan-400/60"} shrink-0`} />
              <span className="text-[8px] sm:text-[9px] font-display text-cyan-400 uppercase tracking-widest truncate">
                {travel ? `${travel.type === "intra" ? "SLT" : "FTL"} → ${destinationName}` : arrival ? `TRANSIT → STAR` : playerSystemName || "Unknown Space"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 h-2.5">
              {travel || arrival ? (
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[6px] sm:text-[7px] font-mono-hud text-cyan-400/80 uppercase tracking-widest">
                      {travel ? "Warping..." : "Landing..."}
                    </span>
                    <span className="text-[6px] sm:text-[7px] font-mono-hud text-cyan-400 font-bold uppercase tracking-widest">
                      {travel ? `ETA ${Math.max(0, Math.ceil((travel.endTime - currentTime) / 1000))}S` : "EST. CONTACT"}
                    </span>
                  </div>
                  <div className="h-1 bg-cyan-950 rounded-full overflow-hidden w-full border border-cyan-500/20">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_8px_cyan]"
                      style={{ 
                        width: travel 
                          ? `${Math.min(100, ((currentTime - travel.startTime) / (travel.endTime - travel.startTime)) * 100)}%`
                          : `${Math.min(100, ((currentTime - arrival!.startTime) / arrival!.duration) * 100)}%`,
                        transition: "width 0.1s linear"
                      }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-cyan-900 shrink-0" />
                  <span className="text-[6px] sm:text-[7px] font-mono-hud text-primary/40 tracking-[0.2em] truncate">SECTOR STATION</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Spacer to push content right */}
        <div className="flex-1" />

        {/* Action Points and Credits */}
        <div className="flex flex-row items-center gap-1 sm:gap-4 pr-1 sm:pr-4 ml-auto">
          {/* Action Points */}
          <div className="flex items-center gap-1 sm:gap-2 px-1 sm:px-3 py-0.5 sm:py-1.5 border-l-2 border-primary bg-primary/5 sm:min-w-0">
            <ZapIcon size={12} className="text-primary animate-pulse sm:w-3.5 sm:h-3.5" fill="currentColor" />
            <div className="flex flex-col leading-none">
              <span className="text-[9px] sm:text-[11px] text-primary font-bold tracking-wider">{Math.floor(ap)}</span>
              <span className="hidden sm:block text-[7px] text-primary/60 uppercase tracking-widest font-mono-hud">Action Points</span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 px-1 sm:px-3 py-0.5 sm:py-1.5 border-l-2 border-warning bg-warning/5 sm:min-w-0">
            <Coins size={12} className="text-warning sm:w-3.5 sm:h-3.5" />
            <div className="flex flex-col leading-none">
              <span className="text-[9px] sm:text-[11px] text-warning font-bold tracking-wider">
                {sc > 1000 && window.innerWidth < 640 ? `${Math.floor(sc / 1000)}k` : Math.floor(sc).toLocaleString()}
              </span>
              <span className="hidden sm:block text-[7px] text-warning/60 uppercase tracking-widest font-mono-hud">Standard Credits</span>
            </div>
          </div>

          {/* Void Tokens (Premium Currency) */}
          <div className="flex items-center gap-1 sm:gap-2 px-1 sm:px-3 py-0.5 sm:py-1.5 border-l-2 border-purple-500 bg-purple-500/10 sm:min-w-0">
            <Hexagon size={12} className="text-purple-400 sm:w-3.5 sm:h-3.5" />
            <div className="flex flex-col leading-none">
              <span className="text-[9px] sm:text-[11px] text-purple-400 font-bold tracking-wider">
                {vt.toLocaleString()}
              </span>
              <span className="hidden sm:block text-[7px] text-purple-400/60 uppercase tracking-widest font-mono-hud">Void Tokens</span>
            </div>
          </div>
        </div>

        {/* Condensed Debug Controls */}
        <div className="flex items-center gap-0.5 sm:gap-1 border-l border-primary/20 pl-1 sm:pl-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 sm:p-1.5 rounded bg-primary/5 border border-primary/20 text-primary/40 hover:text-primary hover:bg-primary/10 transition-all group"
                title="Debug Menu"
              >
                <Bug size={14} className="group-hover:rotate-12 transition-transform sm:w-4 sm:h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-xl border-primary/20 text-foreground font-mono-hud uppercase text-[10px] tracking-widest">
              <DropdownMenuLabel className="text-primary/40 text-[9px]">Neural Debug Interface</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-primary/10" />
              
              <DropdownMenuItem 
                onClick={() => { onReset(); onPlayClick?.(); }}
                className="focus:bg-primary/10 focus:text-primary cursor-pointer gap-3 py-2.5"
              >
                <Compass size={14} />
                <span>Reset Ship & Logs</span>
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => { setFogOfWar(!fogOfWar); onPlayClick?.(); }}
                className="focus:bg-primary/10 focus:text-primary cursor-pointer gap-3 py-2.5"
              >
                {fogOfWar ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>{fogOfWar ? "Disable Fog of War" : "Enable Fog of War"}</span>
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => { setInstantJump(!instantJump); onPlayClick?.(); }}
                className="focus:bg-primary/10 focus:text-primary cursor-pointer gap-3 py-2.5"
              >
                <Zap size={14} fill={instantJump ? "currentColor" : "none"} />
                <span>{instantJump ? "Disable Instant FTL" : "Enable Instant FTL"}</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-primary/10" />

              <DropdownMenuItem 
                onClick={() => { onSetAp(240); onPlayClick?.(); }}
                className="focus:bg-primary/10 focus:text-primary cursor-pointer gap-3 py-2.5 text-warning"
              >
                <BatteryFull size={14} />
                <span>Refill Action Points</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Game Menu Drawer */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent 
          side="left" 
          hideCloseButton 
          onInteractOutside={(e) => {
            if ((e.target as HTMLElement).closest('#floating-logo')) {
              e.preventDefault();
            }
          }}
          overlayClassName="bg-background/60 backdrop-blur-md z-[60]"
          className="w-[300px] sm:w-[380px] bg-background/95 backdrop-blur-xl border-r border-primary/20 p-0 flex flex-col z-[70] shadow-[10px_0_50px_rgba(0,0,0,0.8)] text-foreground"
        >
          <VisuallyHidden>
            <SheetTitle>Navigation Menu</SheetTitle>
          </VisuallyHidden>
          {/* Menu Header matching TopBar height */}
          <div className="h-[60px] sm:h-[72px] px-6 border-b border-primary/20 flex items-center bg-primary/5">
            <div className="flex items-center gap-3 sm:gap-4">
              <img src={logo} alt="" className="h-12 sm:h-14 w-auto opacity-0 pointer-events-none" />
              <div className="flex flex-col leading-none">
                <span className="font-display text-[12px] sm:text-[14px] tracking-[0.3em] text-primary text-glow uppercase">COMMAND</span>
                <span className="font-mono-hud text-[8px] sm:text-[10px] tracking-[0.3em] text-muted-foreground mt-1 uppercase">HEGEMONY MENU</span>
              </div>
            </div>
          </div>
          
          {/* Navigation Options */}
          <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
            {GAME_MENU.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setMenuOpen(false);
                  onPlayClick?.();
                  if (item.route === "settings") onOpenSettings?.();
                  if (item.route === "profile") onOpenProfile?.();
                  if (item.route === "map") onOpenMap?.();
                  if (item.route === "articles") onOpenArticles?.();
                  if (item.route === "factories") onOpenFactories?.();
                  if (item.route === "fleets") onOpenFleets?.();
                  if (item.route === "party") onOpenParty?.();
                  if (item.route === "skills") onOpenSkills?.();
                }}
                className="flex items-center gap-4 px-4 py-4 text-left border border-transparent hover:border-primary/30 rounded-lg hover:bg-primary/10 transition group"
              >
                <item.icon size={22} className="text-primary/70 group-hover:text-primary shrink-0 transition-colors" />
                <div className="flex flex-col leading-tight min-w-0">
                  <span className="font-display text-[14px] uppercase tracking-[0.2em] text-foreground group-hover:text-primary truncate transition-colors">
                    {item.label}
                  </span>
                  <span className="font-mono-hud text-[10px] uppercase tracking-wider text-muted-foreground truncate mt-1">
                    {item.desc}
                  </span>
                </div>
              </button>
            ))}
          </nav>
          
          {/* Footer matching main footer height */}
          <div className="h-14 border-t border-primary/20 flex flex-col items-center justify-center bg-primary/5 shrink-0 px-4 py-2 gap-1">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  setMenuOpen(false);
                  onPlayClick?.();
                  onOpenChangelog?.();
                }}
                className="font-mono-hud text-[8px] uppercase tracking-[0.25em] text-primary/60 hover:text-primary transition-colors"
              >
                Changelog
              </button>
              <span className="text-primary/20">•</span>
              <button 
                onClick={() => {
                  setMenuOpen(false);
                  onPlayClick?.();
                  onOpenCredits?.();
                }}
                className="font-mono-hud text-[8px] uppercase tracking-[0.25em] text-primary/60 hover:text-primary transition-colors"
              >
                Credits
              </button>
            </div>
            <span className="font-mono-hud text-[7px] uppercase tracking-[0.25em] text-primary/30">
              Starbound Hegemony OS v0.1.21
            </span>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
