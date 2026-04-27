import logo from "@/assets/logo.png";
import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetOverlay, SheetClose } from "@/components/ui/sheet";
import { Newspaper, Factory, Rocket, Users, User, Sparkles, Settings, X, Coins, Zap as ZapIcon } from "lucide-react";

interface Props {
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenMap: () => void;
  ap: number;
  sc: number;
  playerName: string;
  playerLevel: number;
  playerXP: number;
  xpToNextLevel: number;
  playerAvatar: string;
  fogOfWar: boolean;
  setFogOfWar: (v: boolean) => void;
  instantJump: boolean;
  setInstantJump: (v: boolean) => void;
}

import { Eye, EyeOff, Zap, Globe } from "lucide-react";

const GAME_MENU = [
  { icon: Globe, label: "Galaxy Map", desc: "Celestial navigation" },
  { icon: Newspaper, label: "Articles", desc: "Galactic news feed" },
  { icon: Factory, label: "Factories", desc: "Production lines" },
  { icon: Rocket, label: "Fleets", desc: "Fleet command" },
  { icon: Users, label: "Party", desc: "Political party" },
  { icon: User, label: "Profile", desc: "Commander profile" },
  { icon: Sparkles, label: "Skill Tree", desc: "Doctrines & perks" },
  { icon: Settings, label: "Settings", desc: "Preferences" },
];

export function TopBar({ 
  onOpenSettings, onOpenProfile, onOpenMap, ap, sc,
  playerName, playerLevel, playerXP, xpToNextLevel, playerAvatar,
  fogOfWar, setFogOfWar, instantJump, setInstantJump
}: Props) {
  // Game menu state - Radix Sheet handles escape/outside-click automatically
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="z-50 w-full bg-background/80 backdrop-blur-md border-b border-primary/20">
      <div className="px-2 py-1.5 sm:px-4 sm:py-2 flex items-center gap-2 sm:gap-3">
        {/* Logo — opens game-wide menu */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Open game menu"
          className="shrink-0 -m-1 p-1 rounded hover:bg-primary/10 transition relative"
        >
          <img
            src={logo}
            alt="Starbound Hegemony"
            className="h-12 sm:h-14 w-auto drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
          />
        </button>

        {/* Player Profile HUD */}
        <div 
          className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1 bg-primary/5 border border-primary/20 rounded-lg group hover:bg-primary/10 transition-colors cursor-pointer" 
          onClick={onOpenProfile}
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
          <div className="hidden sm:flex flex-col gap-0.5 min-w-[140px] lg:min-w-[180px]">
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
            
            {/* XP Stats */}
            <div className="flex justify-between text-[7px] font-mono-hud uppercase tracking-widest text-primary/40">
              <span>XP {playerXP.toLocaleString()}</span>
              <span>NEXT: {(xpToNextLevel - playerXP).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Spacer to push content right */}
        <div className="flex-1" />

        {/* Action Points and Credits */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-4 pr-1 sm:pr-4">
          {/* Action Points */}
          <div className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-0.5 sm:py-1.5 border-l-2 border-primary bg-primary/5 min-w-[60px] sm:min-w-0">
            <ZapIcon size={14} className="text-primary animate-pulse" fill="currentColor" />
            <div className="flex flex-col leading-none">
              <span className="text-[10px] sm:text-[11px] text-primary font-bold tracking-wider">{Math.floor(ap)}</span>
              <span className="hidden sm:block text-[7px] text-primary/60 uppercase tracking-widest font-mono-hud">Action Points</span>
            </div>
          </div>

          {/* Standard Credits */}
          <div className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-0.5 sm:py-1.5 border-l-2 border-warning bg-warning/5 min-w-[60px] sm:min-w-0">
            <Coins size={14} className="text-warning" />
            <div className="flex flex-col leading-none">
              <span className="text-[10px] sm:text-[11px] text-warning font-bold tracking-wider">
                {sc > 1000 && window.innerWidth < 640 ? `${Math.floor(sc / 1000)}k` : Math.floor(sc).toLocaleString()}
              </span>
              <span className="hidden sm:block text-[7px] text-warning/60 uppercase tracking-widest font-mono-hud">Standard Credits</span>
            </div>
          </div>
        </div>

        {/* Debug Controls */}
        <div className="flex items-center gap-1 border-l border-primary/20 pl-2">
          <button
            onClick={() => setFogOfWar(!fogOfWar)}
            className={`p-1.5 rounded transition ${fogOfWar ? "text-muted-foreground hover:text-primary" : "text-primary bg-primary/10"}`}
            title="Toggle Fog of War"
          >
            {fogOfWar ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <button
            onClick={() => setInstantJump(!instantJump)}
            className={`p-1.5 rounded transition ${instantJump ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"}`}
            title="Toggle Instant FTL"
          >
            <Zap size={14} fill={instantJump ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {/* Game Menu Drawer */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetOverlay className="bg-black/60 backdrop-blur-sm z-[60]" />
        <SheetContent side="left" className="w-[300px] sm:w-[380px] bg-background/95 backdrop-blur-xl border-r border-primary/20 p-0 flex flex-col z-[70] shadow-[10px_0_50px_rgba(0,0,0,0.8)]">
          {/* Menu Header matching TopBar height */}
          <div className="h-[60px] sm:h-[72px] px-6 border-b border-primary/20 flex items-center justify-between bg-primary/5">
            <div className="flex items-center gap-3 sm:gap-4">
              <img src={logo} alt="" className="h-12 sm:h-14 w-auto drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)]" />
              <div className="flex flex-col leading-none">
                <span className="font-display text-[12px] sm:text-[14px] tracking-[0.3em] text-primary text-glow uppercase">COMMAND</span>
                <span className="font-mono-hud text-[8px] sm:text-[10px] tracking-[0.3em] text-muted-foreground mt-1 uppercase">HEGEMONY MENU</span>
              </div>
            </div>
            <SheetClose className="text-muted-foreground hover:text-primary p-2 rounded-full hover:bg-primary/10 transition outline-none">
              <X size={20} />
            </SheetClose>
          </div>
          
          {/* Navigation Options */}
          <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
            {GAME_MENU.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setMenuOpen(false);
                  if (item.label === "Settings") onOpenSettings();
                  if (item.label === "Profile") onOpenProfile();
                  if (item.label === "Galaxy Map") onOpenMap();
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
          <div className="h-8 border-t border-primary/20 flex items-center justify-center bg-primary/5 shrink-0 px-4">
            <span className="font-mono-hud text-[8px] uppercase tracking-[0.25em] text-primary/40">
              Starbound Hegemony OS v1.0.4
            </span>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
