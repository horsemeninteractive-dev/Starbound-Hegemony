import { useState } from "react";
import logo from "@/assets/logo.png";
import authBg from "@/assets/auth-bg.png";
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
    <div 
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black overflow-hidden animate-in fade-in duration-1000 exit:animate-out exit:fade-out exit:duration-1000"
      style={{
        backgroundImage: `url(${authBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark tint overlay for atmospheric depth */}
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />
      
      {/* Central Neural Band */}
      <div 
        className="relative w-full max-w-[800px] h-full flex flex-col items-center justify-start pt-6 sm:pt-10 lg:pt-12 px-4 sm:px-8 lg:px-12 bg-[#02090f]/95 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,1)] animate-in fade-in duration-1000 overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
        }}
      >
        {/* HUD Polish: Scanlines and Noise */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_3px,4px_100%]" />
        
        {/* Glowing border accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <div className="flex flex-col justify-start w-full max-w-[800px] mx-auto space-y-6 relative z-10 flex-1 min-h-0 pb-6 lg:pb-12">
          {/* Header Section */}
          <div className="flex flex-col items-center gap-1 sm:gap-2 text-center shrink-0">
            <div className="relative inline-block group">
              <div className="absolute -inset-4 bg-primary/20 blur-xl rounded-full opacity-40 group-hover:opacity-100 transition-opacity duration-1000" />
              <img 
                src={logo} 
                alt="Starbound Hegemony" 
                className="h-12 w-auto mx-auto drop-shadow-[0_0_20px_rgba(0,255,255,0.5)] relative" 
              />
            </div>
            <div className="space-y-0.5">
              <h1 className="font-display text-base sm:text-xl uppercase tracking-[0.3em] text-primary text-glow">
                {step === "identity" ? "COMMANDER REGISTRATION" : "VESSEL CONFIGURATION"}
              </h1>
              <p className="font-mono-hud text-[6px] sm:text-[8px] uppercase tracking-widest text-primary/40">
                {step === "identity" 
                  ? "ESTABLISH IDENTITY FOR GALACTIC HEGEMONY PROTOCOLS" 
                  : "CUSTOMIZE YOUR COMMAND FLAGSHIP FOR DEEP SPACE OPERATIONS"}
              </p>
            </div>
          </div>

          {step === "identity" ? (
            <form onSubmit={handleIdentitySubmit} className="w-full max-w-[400px] mx-auto flex-1 flex flex-col min-h-0 animate-in slide-in-from-bottom duration-700">
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
                    className="w-full bg-slate-900/50 border border-primary/20 focus:border-primary/50 px-4 py-2 font-display text-sm uppercase tracking-widest text-primary outline-none transition-all placeholder:text-primary/20 rounded-sm"
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

              <div className="shrink-0 pt-4 pb-2 mt-4">
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="w-full py-3 border border-primary/20 bg-primary/10 text-primary font-display text-xs uppercase tracking-[0.3em] hover:bg-primary hover:text-slate-950 transition-all disabled:opacity-20 disabled:cursor-not-allowed group relative overflow-hidden"
                >
                  <div className="relative z-10 flex items-center justify-center gap-4">
                    <span>PROCEED TO SHIPYARD</span>
                    <ChevronRight className="group-hover:translate-x-2 transition-transform" size={16} />
                  </div>
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
                  className="px-6 py-2 border border-primary/20 bg-slate-900/50 text-primary/60 font-display text-[10px] uppercase tracking-widest hover:border-primary/40 hover:text-primary transition-all flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={12} />
                  <span>BACK</span>
                </button>
                
                <button
                  onClick={handleFinalSubmit}
                  className="flex-1 py-2 border border-primary/20 bg-primary/10 text-primary font-display text-xs uppercase tracking-[0.3em] hover:bg-primary hover:text-slate-950 transition-all group relative overflow-hidden"
                >
                  <div className="relative z-10 flex items-center justify-center">
                    <span>COMMENCE MISSION</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Footer info */}
          <div className="pt-2 border-t border-primary/10 flex items-center justify-center shrink-0">
            <span className="text-[7px] font-mono-hud text-primary/20 uppercase tracking-[0.25em]">HEGEMONY PROTOCOL v1.5.0 // SHIPYARD MODULE LOADED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
