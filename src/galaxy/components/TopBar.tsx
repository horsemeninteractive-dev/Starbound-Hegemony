import logo from "@/assets/logo.png";
import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Sheet, SheetContent, SheetOverlay, SheetClose, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Newspaper, Factory, Rocket, Users, User, Sparkles, Settings, X, Coins, Zap as ZapIcon, Bug, Hexagon, BookOpen, Shield, Search, Compass, Package, Eye, EyeOff, Globe, Radio, RefreshCcw, BatteryFull, ShoppingCart, LogOut, HelpCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UserAvatar } from "./UserAvatar";
import { GalaxyIcon } from "./ResourceIcon";


import type { Galaxy } from "@/galaxy/types";

interface Props {
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenMap: () => void;
  onOpenArticles?: () => void;
  onOpenMarket?: () => void;
  onOpenFactories?: () => void;
  onOpenFleets?: () => void;
  onOpenParty?: () => void;
  onOpenSkills?: () => void;
  onOpenWiki?: () => void;
  onOpenChangelog?: () => void;
  onOpenCredits?: () => void;
  onStartTutorial?: () => void;
  onLogout?: () => void;
  ap: number;
  sc: number;
  vt?: number;
  cargoCapacity?: number;
  cargoUsed?: number;
  playerName: string;
  playerLevel: number;
  playerXP: number;
  xpToNextLevel: number;
  playerSkills?: string[];
  playerAvatar: string;
  playerPartyIcon?: string;
  playerPartyHue?: number;
  fogOfWar: boolean;
  setFogOfWar: (v: boolean) => void;
  instantJump: boolean;
  setInstantJump: (v: boolean) => void;
  playerSystemId?: string;
  currentTime: number;
  galaxy: Galaxy;
  onReset: () => void;
  onSetAp: (val: number) => void;
  onPlayClick?: () => void;
  isGameReady?: boolean;
  nextApTick?: number;
  isAdmin?: boolean;
  searchResults?: { users: any[], parties: any[], states: any[] };
  isSearching?: boolean;
  onSearch?: (query: string) => void;
  onNavigateToUser?: (id: string) => void;
  onNavigateToParty?: (id: string) => void;
  onNavigateToState?: (id: string) => void;
}



const GAME_MENU = [
  { icon: Globe, label: "Galaxy Map", desc: "Celestial navigation", route: "map", disabled: false },
  { icon: User, label: "Profile", desc: "Commander profile", route: "profile", disabled: false },
  { icon: Sparkles, label: "Skills", desc: "Neural Uplink", route: "skills", disabled: false },
  { icon: Rocket, label: "Fleets", desc: "Fleet command", route: "fleets", disabled: false },
  { icon: Factory, label: "Factories", desc: "Production lines", route: "factories", disabled: false },
  { icon: ShoppingCart, label: "Market", desc: "Galactic Trade Hub", route: "market", disabled: false },
  { icon: Users, label: "Party", desc: "Political party", route: "party", disabled: false },
  { icon: Newspaper, label: "Articles", desc: "Galactic news feed", route: "articles", disabled: false },
  { icon: BookOpen, label: "Wiki", desc: "Galactic Archives", route: "wiki", disabled: false },
  { icon: Settings, label: "Settings", desc: "Preferences", route: "settings", disabled: false },
];

export function TopBar({ 
  onOpenSettings, onOpenProfile, onOpenMap, onOpenArticles, onOpenMarket,
  onOpenFactories, onOpenFleets, onOpenParty, onOpenSkills, onOpenWiki, onOpenChangelog, onOpenCredits, onStartTutorial, onLogout,
  ap, sc, vt = 0, cargoCapacity = 500, cargoUsed = 0, playerName, playerLevel, playerXP, xpToNextLevel, playerSkills = [], playerAvatar,
  playerPartyIcon, playerPartyHue,
  fogOfWar, setFogOfWar, instantJump, setInstantJump,
  playerSystemId, currentTime, galaxy, onReset, onSetAp, onPlayClick, isGameReady = true,
  nextApTick, isAdmin = false,
  searchResults = { users: [], parties: [], states: [] },
  isSearching = false,
  onSearch,
  onNavigateToUser,
  onNavigateToParty,
  onNavigateToState
}: Props) {
  // Game menu state - Radix Sheet handles escape/outside-click automatically
  const [menuOpen, setMenuOpen] = useState(false);


  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        onSearch?.(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeSearch = () => {
    setShowSearchResults(false);
    setMobileSearchOpen(false);
    setSearchQuery("");
  };

  const renderSearchResultsList = () => {
    if (!searchResults) return null;
    const hasResults = (searchResults.users?.length || 0) > 0 || 
                      (searchResults.parties?.length || 0) > 0 || 
                      (searchResults.states?.length || 0) > 0;
    
    return (
      <>
        <div className="max-h-[350px] sm:max-h-[400px] overflow-y-auto custom-scrollbar p-2 space-y-4">
          {/* Commanders */}
          {searchResults.users && searchResults.users.length > 0 && (
            <div>
              <div className="px-2 mb-1 flex items-center justify-between">
                <span className="text-[8px] font-display text-primary/40 uppercase tracking-widest">Commanders</span>
                <User className="w-2.5 h-2.5 text-primary/20" />
              </div>
              {searchResults.users.map(u => (
                <button
                  key={u.id}
                  onClick={() => {
                    onNavigateToUser?.(u.id);
                    closeSearch();
                  }}
                  className="w-full flex items-center gap-3 p-2 hover:bg-primary/10 rounded transition-colors group text-left"
                >
                  <UserAvatar avatarUrl={u.avatar_url} level={u.level} size="sm" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-display text-foreground group-hover:text-primary transition-colors truncate">{u.commander_name}</span>
                    <span className="text-[7px] font-mono-hud text-muted-foreground uppercase">Level {u.level} Commander</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Parties */}
          {searchResults.parties && searchResults.parties.length > 0 && (
            <div>
              <div className="px-2 mb-1 flex items-center justify-between border-t border-primary/5 pt-3 mt-1">
                <span className="text-[8px] font-display text-primary/40 uppercase tracking-widest">Political Parties</span>
                <Users className="w-2.5 h-2.5 text-primary/20" />
              </div>
              {searchResults.parties.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    onNavigateToParty?.(p.id);
                    closeSearch();
                  }}
                  className="w-full flex items-center gap-3 p-2 hover:bg-primary/10 rounded transition-colors group text-left"
                >
                  <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:border-primary/40 transition-colors">
                    <GalaxyIcon name={p.icon} className="w-3.5 h-3.5" color={`hsl(${p.hue} 70% 55%)`} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-display text-foreground group-hover:text-primary transition-colors truncate">{p.name}</span>
                      <span className="text-[7px] font-mono-hud text-primary/40">[{p.tag}]</span>
                    </div>
                    <span className="text-[7px] font-mono-hud text-muted-foreground uppercase">System: {p.system_id}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* States */}
          {searchResults.states && searchResults.states.length > 0 && (
            <div>
              <div className="px-2 mb-1 flex items-center justify-between border-t border-primary/5 pt-3 mt-1">
                <span className="text-[8px] font-display text-primary/40 uppercase tracking-widest">Sovereign States</span>
                <Shield className="w-2.5 h-2.5 text-primary/20" />
              </div>
              {searchResults.states.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    onNavigateToState?.(s.id);
                    closeSearch();
                  }}
                  className="w-full flex items-center gap-3 p-2 hover:bg-primary/10 rounded transition-colors group text-left"
                >
                  <div className="w-6 h-6 rounded-full border-2 border-primary/20 flex items-center justify-center group-hover:border-primary/50 transition-colors" style={{ borderColor: `hsl(${s.hue} 70% 40% / 0.3)` }}>
                    <div className="w-3 h-3 rounded-full" style={{ background: `hsl(${s.hue} 70% 55%)` }} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-display text-foreground group-hover:text-primary transition-colors truncate">{s.name}</span>
                      <span className="text-[7px] font-mono-hud text-primary/40">[{s.tag}]</span>
                    </div>
                    <span className="text-[7px] font-mono-hud text-muted-foreground uppercase">Hegemony Member State</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!hasResults && !isSearching && (
            <div className="p-8 text-center">
              <div className="font-display text-[10px] text-muted-foreground uppercase tracking-widest mb-2">No Intelligence Found</div>
              <p className="font-mono-hud text-[8px] text-muted-foreground/50 leading-relaxed italic">The archives contain no records matching your query. Verify coordinates and try again.</p>
            </div>
          )}
        </div>
        
        <div className="p-2 bg-primary/5 border-t border-primary/10 flex items-center justify-center">
          <span className="text-[7px] font-mono-hud text-primary/30 uppercase tracking-[0.2em]">Universal Archive Index</span>
        </div>
      </>
    );
  };

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
          className="flex flex-1 sm:flex-none items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1 bg-primary/5 border border-primary/20 rounded-lg group transition-colors min-w-0" 
        >
          {/* Avatar with level badge and party icon */}
          <div 
            className="cursor-pointer hover:scale-105 transition-transform"
            onClick={(e) => {
              e.stopPropagation();
              onPlayClick?.();
              onOpenProfile();
            }}
          >
            <UserAvatar 
              avatarUrl={playerAvatar} 
              level={playerLevel}
              partyIcon={playerPartyIcon}
              partyHue={playerPartyHue}
              size={window.innerWidth < 640 ? "md" : "lg"}
            />
          </div>

          {/* Name and XP details - now visible on mobile to fill space */}
          <div className="flex flex-col gap-0.5 min-w-0 flex-1 sm:min-w-[140px] sm:flex-none">
            <div 
              className="flex items-center justify-between gap-2 cursor-pointer hover:text-primary transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onPlayClick?.();
                onOpenProfile();
              }}
            >
              <span className="font-display text-[9px] sm:text-[11px] uppercase tracking-wider text-primary text-glow truncate max-w-[100px] xs:max-w-[140px] lg:max-w-[none]">
                {playerName}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono-hud text-[7px] sm:text-[8px] text-muted-foreground uppercase tracking-tighter whitespace-nowrap">LVL {playerLevel}</span>
              </div>
            </div>
            
            {/* XP Progress Bar - Click to open Skills */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="w-full h-1 bg-primary/10 rounded-full overflow-hidden cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayClick?.();
                    onOpenSkills?.();
                  }}
                >
                  <div 
                    className="h-full bg-primary shadow-[0_0_5px_hsl(var(--primary))]" 
                    style={{ width: `${(playerXP / xpToNextLevel) * 100}%` }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-background/95 border-primary/20 text-primary font-mono-hud text-[9px] uppercase tracking-widest">
                XP: {playerXP} / {xpToNextLevel} — Click to open Neural Uplink
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Universal Search Bar (Desktop) */}
        <div className="hidden xl:flex items-center relative ml-2" ref={searchRef}>
          <div className="relative group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="Search Galaxy..."
              className="w-48 xl:w-64 bg-primary/5 border border-primary/20 rounded-lg py-1.5 pl-8 pr-4 text-[10px] font-mono-hud text-foreground focus:outline-none focus:border-primary/50 focus:bg-primary/10 focus:w-72 transition-all duration-300 placeholder:text-primary/20"
            />
            <Compass className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isSearching ? "text-primary animate-spin" : "text-primary/30 group-focus-within:text-primary"} transition-colors`} />
            
            {showSearchResults && (searchQuery.length >= 2) && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-background/95 backdrop-blur-xl border border-primary/20 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {renderSearchResultsList()}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Sheet */}
        <div className="xl:hidden flex items-center ml-1">
          <Sheet open={mobileSearchOpen} onOpenChange={(open) => {
            setMobileSearchOpen(open);
            if (open) {
              setTimeout(() => {
                const input = document.getElementById('mobile-search-input');
                input?.focus();
              }, 200);
            }
          }}>
            <SheetTrigger asChild>
              <button 
                onClick={() => setMobileSearchOpen(true)}
                className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-lg bg-primary/5 border border-primary/20 text-primary/70 hover:text-primary hover:bg-primary/10 hover:border-primary/40 transition-all group"
              >
                <Search size={16} className={isSearching ? "animate-spin" : "group-hover:scale-110 transition-transform"} />
              </button>
            </SheetTrigger>
            <SheetContent side="top" className="w-full bg-background/95 backdrop-blur-xl border-b border-primary/20 p-4 pt-12 z-[100] outline-none">
              <VisuallyHidden>
                <SheetTitle>Search Galaxy Archives</SheetTitle>
              </VisuallyHidden>
              <div className="relative group mb-4">
                <input
                  id="mobile-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                  placeholder="Search Galaxy..."
                  className="w-full bg-primary/5 border border-primary/20 rounded-lg py-3 pl-10 pr-4 text-[12px] font-mono-hud text-foreground focus:outline-none focus:border-primary/50 focus:bg-primary/10 transition-all placeholder:text-primary/20"
                />
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isSearching ? "text-primary animate-spin" : "text-primary/30"} transition-colors`} />
              </div>
              
              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                {searchQuery.length >= 2 ? renderSearchResultsList() : (
                  <div className="py-12 text-center opacity-40 italic">
                    <span className="text-[10px] font-mono-hud uppercase tracking-widest">Type to search the archives...</span>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Spacer to push content right - hidden on mobile when profile fills space */}
        <div className="hidden sm:flex flex-1" />

        {/* Action Points and Credits */}
        <div className="grid grid-cols-2 grid-rows-2 gap-x-2 gap-y-1 sm:flex sm:flex-row sm:items-center sm:gap-4 pr-1 sm:pr-4 ml-auto">
          {/* Action Points */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div id="tour-ap" className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-0.5 sm:py-1.5 border-l-2 border-primary bg-primary/5 sm:min-w-0 cursor-help w-full">
                <ZapIcon size={12} className="text-primary animate-pulse sm:w-3.5 sm:h-3.5 shrink-0" fill="currentColor" />
                <div className="flex flex-col leading-none truncate">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[9px] sm:text-[11px] text-primary font-bold tracking-wider">{Math.floor(ap)}</span>
                    {nextApTick && ap < 240 && (
                      <span className="text-[6px] text-primary/40 font-mono-hud">
                        {Math.floor((nextApTick - currentTime) / 1000)}s
                      </span>
                    )}
                  </div>
                  <span className="hidden sm:block text-[7px] text-primary/60 uppercase tracking-widest font-mono-hud">Action Points</span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-background/95 border-primary/20 text-primary font-mono-hud text-[10px] uppercase tracking-widest p-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Neural Capacity:</span>
                  <span className="text-primary">{Math.floor(ap)} / 240</span>
                </div>
                {nextApTick && ap < 240 ? (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Next Cycle:</span>
                    <span className="text-success">{Math.floor((nextApTick - currentTime) / 1000)}s</span>
                  </div>
                ) : (
                  <div className="text-success text-[8px] animate-pulse">Neural Link Fully Charged</div>
                )}
                <div className="pt-1.5 border-t border-primary/10 text-[8px] text-muted-foreground">
                  Regenerates 1 AP every 5 minutes
                </div>
              </div>
            </TooltipContent>
          </Tooltip>

          <div id="tour-sc" className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-0.5 sm:py-1.5 border-l-2 border-warning bg-warning/5 sm:min-w-0 w-full">
            <Coins size={12} className="text-warning sm:w-3.5 sm:h-3.5 shrink-0" />
            <div className="flex flex-col leading-none truncate">
              <span className="text-[9px] sm:text-[11px] text-warning font-bold tracking-wider">
                {sc > 1000 && window.innerWidth < 640 ? `${Math.floor(sc / 1000)}k` : Math.floor(sc).toLocaleString()}
              </span>
              <span className="hidden sm:block text-[7px] text-warning/60 uppercase tracking-widest font-mono-hud">Standard Credits</span>
            </div>
          </div>

          {/* Void Tokens (Premium Currency) */}
          <div className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-0.5 sm:py-1.5 border-l-2 border-purple-500 bg-purple-500/10 sm:min-w-0 w-full">
            <Hexagon size={12} className="text-purple-400 sm:w-3.5 sm:h-3.5 shrink-0" />
            <div className="flex flex-col leading-none truncate">
              <span className="text-[9px] sm:text-[11px] text-purple-400 font-bold tracking-wider">
                {vt > 1000 && window.innerWidth < 640 ? `${Math.floor(vt / 1000)}k` : vt.toLocaleString()}
              </span>
              <span className="hidden sm:block text-[7px] text-purple-400/60 uppercase tracking-widest font-mono-hud">Void Tokens</span>
            </div>
          </div>

          {/* Cargo Hold */}
          <div id="tour-cargo" className={`flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-0.5 sm:py-1.5 border-l-2 sm:min-w-0 w-full ${cargoUsed >= cargoCapacity ? 'bg-destructive/10 border-destructive' : 'bg-blue-500/10 border-blue-500'}`}>
            <Package size={12} className={`${cargoUsed >= cargoCapacity ? 'text-destructive' : 'text-blue-400'} sm:w-3.5 sm:h-3.5 shrink-0`} />
            <div className="flex flex-col leading-none truncate">
              <span className={`text-[9px] sm:text-[11px] font-bold tracking-wider ${cargoUsed >= cargoCapacity ? 'text-destructive' : 'text-blue-400'}`}>
                {cargoUsed > 1000 && window.innerWidth < 640 ? `${Math.floor(cargoUsed / 1000)}k` : cargoUsed}/{cargoCapacity > 1000 && window.innerWidth < 640 ? `${Math.floor(cargoCapacity / 1000)}k` : cargoCapacity}
              </span>
              <span className={`hidden sm:block text-[7px] uppercase tracking-widest font-mono-hud ${cargoUsed >= cargoCapacity ? 'text-destructive/60' : 'text-blue-400/60'}`}>Cargo</span>
            </div>
          </div>
        </div>

        {/* Tutorial Button */}
        <div className="flex items-center gap-0.5 sm:gap-1 border-l border-primary/20 pl-1 sm:pl-2">
          <button
            onClick={() => { onStartTutorial?.(); onPlayClick?.(); }}
            className="p-1 sm:p-1.5 rounded bg-primary/5 border border-primary/20 text-primary/40 hover:text-primary hover:bg-primary/10 transition-all group"
            title="Interactive Guide"
          >
            <HelpCircle size={14} className="group-hover:rotate-12 transition-transform sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Condensed Debug Controls */}
        {isAdmin && (
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
                  <ZapIcon size={14} fill={instantJump ? "currentColor" : "none"} />
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
        )}
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
                  if (item.route === "market") onOpenMarket?.();
                  if (item.route === "factories") onOpenFactories?.();
                  if (item.route === "fleets") onOpenFleets?.();
                  if (item.route === "party") onOpenParty?.();
                  if (item.route === "skills") onOpenSkills?.();
                  if (item.route === "wiki") onOpenWiki?.();
                }}
                className={`flex items-center gap-4 px-4 py-4 text-left border rounded-lg transition group ${item.disabled ? 'opacity-40 grayscale border-transparent hover:border-primary/10' : 'border-transparent hover:border-primary/30 hover:bg-primary/10'}`}
              >
                <item.icon size={22} className={`${item.disabled ? 'text-muted-foreground' : 'text-primary/70 group-hover:text-primary'} shrink-0 transition-colors`} />
                <div className="flex flex-col leading-tight min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-display text-[14px] uppercase tracking-[0.2em] transition-colors ${item.disabled ? 'text-muted-foreground' : 'text-foreground group-hover:text-primary'} truncate`}>
                      {item.label}
                    </span>
                    {item.route === "skills" && (playerLevel - 1 - playerSkills.length) > 0 && (
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_hsl(var(--primary))]" />
                    )}
                    {item.disabled && (
                      <span className="text-[7px] border border-muted-foreground/30 px-1 rounded text-muted-foreground font-mono-hud uppercase tracking-tighter">In Dev</span>
                    )}
                  </div>
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
              <span className="text-primary/20">•</span>
              <button 
                onClick={() => {
                  setMenuOpen(false);
                  onLogout?.();
                }}
                className="font-mono-hud text-[8px] uppercase tracking-[0.25em] text-destructive/60 hover:text-destructive transition-colors flex items-center gap-1.5"
              >
                <LogOut size={10} />
                Logout
              </button>
            </div>
            <span className="font-mono-hud text-[7px] uppercase tracking-[0.25em] text-primary/30">
              Starbound Hegemony OS v0.3.1
            </span>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
