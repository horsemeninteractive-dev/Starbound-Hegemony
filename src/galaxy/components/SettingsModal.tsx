import { X, Maximize, Minimize } from "lucide-react";
import { useState, useEffect } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  quality: "low" | "medium" | "high";
  setQuality: (q: "low" | "medium" | "high") => void;
}

export function SettingsModal({ isOpen, onClose, quality, setQuality }: Props) {
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="hud-panel hud-corner w-full max-w-[400px] animate-fade-in relative">
        <div className="flex items-center justify-between px-4 py-3 border-b border-primary/20">
          <div className="font-display text-sm uppercase tracking-[0.2em] text-primary text-glow">
            System Settings
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-primary transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Graphics Quality */}
          <div className="space-y-4">
            <div className="font-mono-hud text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
              Neural Rendering Fidelity
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {(["low", "medium", "high"] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className={`flex flex-col items-center gap-1 p-2 border transition ${
                    quality === q 
                      ? "border-primary bg-primary/10 text-primary shadow-[0_0_10px_hsl(var(--primary)/0.2)]" 
                      : "border-border hover:border-primary/30 text-muted-foreground"
                  }`}
                >
                  <span className="font-display text-[10px] uppercase tracking-widest">{q}</span>
                  <span className="text-[7px] font-mono-hud uppercase opacity-60">
                    {q === "low" ? "Performance" : q === "medium" ? "Balanced" : "Ultra"}
                  </span>
                </button>
              ))}
            </div>
            <div className="text-[9px] font-mono-hud text-muted-foreground/60 leading-relaxed italic">
              * Adjusted based on device core capacity. Lower settings reduce shader complexity and star density.
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-primary/10">
            <div className="font-mono-hud text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
              Display & HUD
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-display uppercase tracking-widest text-foreground">Fullscreen Mode</span>
                <span className="text-[9px] font-mono-hud text-muted-foreground">Maximize tactical display area</span>
              </div>
              <button
                onClick={toggleFullscreen}
                className={`flex items-center gap-2 px-3 py-1.5 border transition ${
                  isFullscreen 
                    ? "border-primary bg-primary/10 text-primary shadow-[0_0_10px_hsl(var(--primary)/0.3)]" 
                    : "border-border hover:border-primary/50 text-muted-foreground"
                }`}
              >
                {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                <span className="font-mono-hud text-[10px] uppercase tracking-wider">
                  {isFullscreen ? "Exit" : "Enter"}
                </span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-primary/10">
            <div className="font-mono-hud text-[8px] text-center text-muted-foreground/50 uppercase tracking-widest">
              Starbound Hegemony · Build v0.4.2-sb
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
