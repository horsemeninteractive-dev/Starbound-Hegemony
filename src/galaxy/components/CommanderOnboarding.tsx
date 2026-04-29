import { useState } from "react";
import logo from "@/assets/logo.png";
import avatar_img from "@/assets/avatar.png";
import avatar_alt1 from "@/assets/avatar_alt1.png";
import avatar_alt2 from "@/assets/avatar_alt2.png";
import avatar_alt3 from "@/assets/avatar_alt3.png";
import { User, Rocket, ChevronRight, ChevronLeft } from "lucide-react";
import { ShipCustomizer } from "./ShipCustomizer";
import { ShipConfiguration, DEFAULT_SHIP_CONFIG } from "../shipPresets";

interface Props {
  onComplete: (name: string, avatar: string, shipConfig: ShipConfiguration) => void;
  playClick: () => void;
  playSuccess: () => void;
  playType: () => void;
}

const AVATARS = [
  { id: "male", path: avatar_img, label: "VANGUARD" },
  { id: "female", path: avatar_alt1, label: "STRATEGIST" },
  { id: "veteran", path: avatar_alt2, label: "VETERAN" },
  { id: "synth", path: avatar_alt3, label: "SYNTH-AI" },
];

export function CommanderOnboarding({ onComplete, playClick, playSuccess, playType }: Props) {
  const [step, setStep] = useState<"identity" | "vessel">("identity");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0].path);
  const [shipConfig, setShipConfig] = useState<ShipConfiguration>(DEFAULT_SHIP_CONFIG);

  const handleIdentitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      playClick();
      setStep("vessel");
    }
  };

  const handleFinalSubmit = () => {
    playSuccess();
    onComplete(name.trim(), avatar, shipConfig);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-background flex flex-col items-center p-4 sm:p-6 animate-in fade-in duration-1000 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-nebula opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-none" />
      
      <div className="relative w-full max-w-5xl flex-1 flex flex-col items-center gap-4 sm:gap-6 min-h-0">
        {/* Logo and Header */}
        <div className="flex flex-col items-center gap-1 sm:gap-2 text-center shrink-0">
          <img 
            src={logo} 
            alt="Starbound Hegemony" 
            className="h-10 sm:h-14 w-auto drop-shadow-[0_0_20px_hsl(var(--primary)/0.4)]" 
          />
          <div className="space-y-0.5">
            <h1 className="font-display text-base sm:text-xl uppercase tracking-[0.3em] text-primary text-glow">
              {step === "identity" ? "COMMANDER REGISTRATION" : "VESSEL CONFIGURATION"}
            </h1>
            <p className="font-mono-hud text-[6px] sm:text-[8px] uppercase tracking-widest text-primary/60">
              {step === "identity" 
                ? "ESTABLISH IDENTITY FOR GALACTIC HEGEMONY PROTOCOLS" 
                : "CUSTOMIZE YOUR COMMAND FLAGSHIP FOR DEEP SPACE OPERATIONS"}
            </p>
          </div>
        </div>

        {step === "identity" ? (
          <form onSubmit={handleIdentitySubmit} className="w-full max-w-xl flex-1 flex flex-col min-h-0 animate-in slide-in-from-bottom duration-700">
            <div className="flex-1 flex flex-col gap-4 sm:gap-6 min-h-0 px-2 overflow-hidden">
              {/* Name Input */}
              <div className="space-y-2 shrink-0">
                <label className="font-mono-hud text-[9px] sm:text-[10px] uppercase tracking-widest text-primary flex items-center gap-2">
                  <User size={12} />
                  <span>COMMANDER DESIGNATION</span>
                </label>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    playType();
                  }}
                  placeholder="ENTER NAME..."
                  className="w-full bg-primary/5 border-b border-primary/20 focus:border-primary px-4 py-2 font-display text-lg uppercase tracking-widest text-primary outline-none transition-all placeholder:text-primary/20"
                  required
                />
              </div>

              {/* Avatar Selection */}
              <div className="flex-1 flex flex-col gap-3 min-h-0">
                <label className="font-mono-hud text-[9px] sm:text-[10px] uppercase tracking-widest text-primary flex items-center gap-2 shrink-0">
                  <Rocket size={12} />
                  <span>VISUAL PROFILE SELECTION</span>
                </label>
                <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
                  {AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => { setAvatar(av.path); playClick(); }}
                      className={`relative rounded border-2 transition-all group overflow-hidden ${
                        avatar === av.path ? 'border-primary shadow-glow-sm' : 'border-primary/10 opacity-50 grayscale hover:grayscale-0 hover:opacity-100'
                      }`}
                    >
                      <img src={av.path} alt={av.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <span className="absolute bottom-1.5 left-2 font-mono-hud text-[8px] sm:text-[9px] tracking-widest text-primary/80">
                        {av.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="shrink-0 pt-4 pb-2">
              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full py-3 sm:py-4 border-2 border-primary bg-primary/5 text-primary font-display text-base sm:text-lg uppercase tracking-[0.4em] hover:bg-primary hover:text-background transition-all disabled:opacity-20 disabled:cursor-not-allowed group relative overflow-hidden"
              >
                <div className="relative z-10 flex items-center justify-center gap-4">
                  <span>PROCEED TO SHIPYARD</span>
                  <ChevronRight className="group-hover:translate-x-2 transition-transform" size={18} />
                </div>
                <div className="absolute inset-0 scanline opacity-20" />
              </button>
            </div>
          </form>
        ) : (
          <div className="w-full flex-1 flex flex-col gap-4 min-h-0 animate-in slide-in-from-right duration-700">
            <div className="flex-1 min-h-0">
              <ShipCustomizer 
                config={shipConfig} 
                onChange={setShipConfig} 
                playClick={playClick} 
              />
            </div>

            <div className="flex gap-2 shrink-0 pb-1 px-1">
              <button
                onClick={() => { setStep("identity"); playClick(); }}
                className="px-6 py-2 border border-primary/20 bg-black/40 text-primary/60 font-display text-[10px] uppercase tracking-widest hover:border-primary/40 hover:text-primary transition-all flex items-center justify-center gap-2"
              >
                <ChevronLeft size={12} />
                <span>BACK</span>
              </button>
              
              <button
                onClick={handleFinalSubmit}
                className="flex-1 py-2 border-2 border-primary bg-primary/5 text-primary font-display text-sm uppercase tracking-[0.3em] hover:bg-primary hover:text-background transition-all group relative overflow-hidden"
              >
                <div className="relative z-10 flex items-center justify-center">
                  <span>COMMENCE MISSION</span>
                </div>
                <div className="absolute inset-0 scanline opacity-20" />
              </button>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="font-mono-hud text-[8px] uppercase tracking-[0.25em] text-primary/30 text-center shrink-0">
          HEGEMONY PROTOCOL v1.5.0 // SHIPYARD MODULE LOADED
        </div>
      </div>
    </div>
  );
}
