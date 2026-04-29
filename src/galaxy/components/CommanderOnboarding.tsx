import { useState } from "react";
import logo from "@/assets/logo.png";
import avatar from "@/assets/avatar.png";
import avatar_alt1 from "@/assets/avatar_alt1.png";
import avatar_alt2 from "@/assets/avatar_alt2.png";
import { User, Rocket } from "lucide-react";

interface Props {
  onComplete: (name: string, avatar: string) => void;
  playClick: () => void;
  playSuccess: () => void;
  playType: () => void;
}

const AVATARS = [
  { id: "male", path: avatar, label: "VANGUARD" },
  { id: "female", path: avatar_alt1, label: "STRATEGIST" },
  { id: "veteran", path: avatar_alt2, label: "VETERAN" },
];

export function CommanderOnboarding({ onComplete, playClick, playSuccess, playType }: Props) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0].path);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      playSuccess();
      onComplete(name.trim(), avatar);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-start sm:justify-center p-4 sm:p-6 animate-in fade-in duration-1000 overflow-y-auto">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-nebula opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-none" />
      
      <div className="relative w-full max-w-2xl flex flex-col items-center gap-4 sm:gap-8 py-8 sm:py-0">
        {/* Logo and Header */}
        <div className="flex flex-col items-center gap-2 sm:gap-4 text-center">
          <img 
            src={logo} 
            alt="Starbound Hegemony" 
            className="h-16 sm:h-32 w-auto drop-shadow-[0_0_20px_hsl(var(--primary)/0.4)]" 
          />
          <div className="space-y-1">
            <h1 className="font-display text-xl sm:text-4xl uppercase tracking-[0.3em] text-primary text-glow">
              NEW COMMANDER ENTRY
            </h1>
            <p className="font-mono-hud text-[8px] sm:text-[12px] uppercase tracking-widest text-primary/60">
              ESTABLISH IDENTITY FOR GALACTIC HEGEMONY PROTOCOLS
            </p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-6 sm:space-y-10 animate-in slide-in-from-bottom duration-700 delay-300">
          {/* Name Input */}
          <div className="space-y-3">
            <label className="font-mono-hud text-[11px] uppercase tracking-widest text-primary flex items-center gap-2">
              <User size={14} />
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
              className="w-full bg-primary/5 border-b-2 border-primary/20 focus:border-primary px-4 py-3 font-display text-xl uppercase tracking-widest text-primary outline-none transition-all placeholder:text-primary/20"
              required
            />
          </div>

          {/* Avatar Selection */}
          <div className="space-y-4">
            <label className="font-mono-hud text-[11px] uppercase tracking-widest text-primary flex items-center gap-2">
              <Rocket size={14} />
              <span>VISUAL PROFILE SELECTION</span>
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {AVATARS.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => {
                    setAvatar(av.path);
                    playClick();
                  }}
                  className={`relative group flex flex-col items-center gap-2 p-2 sm:p-4 border transition-all duration-300 ${
                    avatar === av.path 
                      ? "border-primary bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/0.2)]" 
                      : "border-primary/20 bg-black/40 hover:border-primary/40"
                  }`}
                >
                  <div className={`w-12 h-12 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 transition-all ${
                    avatar === av.path ? "border-primary scale-105" : "border-primary/20 group-hover:border-primary/40"
                  }`}>
                    <img src={av.path} alt={av.label} className="w-full h-full object-cover" />
                  </div>
                  <span className={`font-mono-hud text-[8px] sm:text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.2em] ${
                    avatar === av.path ? "text-primary" : "text-primary/40 group-hover:text-primary/70"
                  }`}>
                    {av.label}
                  </span>
                  {avatar === av.path && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3 sm:py-5 border-2 border-primary bg-primary/5 text-primary font-display text-lg sm:text-xl uppercase tracking-[0.4em] hover:bg-primary hover:text-background transition-all disabled:opacity-20 disabled:cursor-not-allowed group relative overflow-hidden"
          >
            <div className="relative z-10 flex items-center justify-center gap-4">
              <span>COMMENCE MISSION</span>
              <Rocket className="group-hover:translate-x-2 transition-transform" />
            </div>
            {/* Scanned scanline effect on button */}
            <div className="absolute inset-0 scanline opacity-20" />
          </button>
        </form>

        {/* Footer info */}
        <div className="font-mono-hud text-[8px] uppercase tracking-[0.25em] text-primary/30 text-center">
          HEGEMONY PROTOCOL v1.4.2 // SECTOR INITIALISATION COMPLETE
        </div>
      </div>
    </div>
  );
}
