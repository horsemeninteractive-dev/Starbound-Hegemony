import logo from "@/assets/logo.png";
import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetOverlay, SheetClose } from "@/components/ui/sheet";
import { Newspaper, Factory, Rocket, Users, User, Sparkles, Settings, X, Coins, Zap as ZapIcon } from "lucide-react";

interface Props {
  onOpenSettings: () => void;
  ap: number;
  sc: number;
  fogOfWar: boolean;
  setFogOfWar: (v: boolean) => void;
  instantJump: boolean;
  setInstantJump: (v: boolean) => void;
}

import { Eye, EyeOff, Zap } from "lucide-react";

const GAME_MENU = [
  { icon: Newspaper, label: "Articles", desc: "Galactic news feed" },
  { icon: Factory, label: "Factories", desc: "Production lines" },
  { icon: Rocket, label: "Fleets", desc: "Fleet command" },
  { icon: Users, label: "Party", desc: "Political party" },
  { icon: User, label: "Profile", desc: "Commander profile" },
  { icon: Sparkles, label: "Skill Tree", desc: "Doctrines & perks" },
  { icon: Settings, label: "Settings", desc: "Preferences" },
];

export function TopBar({ 
  onOpenSettings, ap, sc,
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

        {/* Spacer to push content right */}
        <div className="flex-1" />

        {/* Action Points and Credits */}
        <div className="flex items-center gap-2 sm:gap-4 pr-1 sm:pr-4">
          {/* Action Points */}
          <div className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 border-l-2 border-primary bg-primary/5">
            <ZapIcon size={14} className="text-primary animate-pulse" fill="currentColor" />
            <div className="flex flex-col leading-none">
              <span className="text-[10px] sm:text-[11px] text-primary font-bold tracking-wider">{ap}</span>
              <span className="hidden sm:block text-[7px] text-primary/60 uppercase tracking-widest font-mono-hud">Action Points</span>
            </div>
          </div>

          {/* Standard Credits */}
          <div className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 border-l-2 border-warning bg-warning/5">
            <Coins size={14} className="text-warning" />
            <div className="flex flex-col leading-none">
              <span className="text-[10px] sm:text-[11px] text-warning font-bold tracking-wider">
                {sc > 1000 && window.innerWidth < 640 ? `${(sc / 1000).toFixed(1)}k` : sc.toLocaleString()}
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

      {/* Game menu drawer using Sheet for smooth animations */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent 
          side="left" 
          className="p-0 border-r border-primary/20 w-[min(360px,100vw)] bg-background/95 shadow-[4px_0_24px_hsl(var(--primary)/0.15)] flex flex-col"
          hideCloseButton // We have our own custom close button in the header
          overlayClassName="bg-background/40 backdrop-blur-md duration-500"
        >
          
          {/* Header matching TopBar height */}
          <div className="h-[60px] sm:h-[72px] flex items-center justify-between px-4 sm:px-6 border-b border-primary/20 bg-primary/5 shrink-0">
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
