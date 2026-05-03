import { X, Maximize, Minimize, Volume2, VolumeX, Music, Zap, Radio, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quality: "low" | "medium" | "high";
  onQualityChange: (q: "low" | "medium" | "high") => void;
  audioEnabled: boolean;
  onAudioEnabledChange: (v: boolean) => void;
  musicVolume: number;
  onMusicVolumeChange: (v: number) => void;
  sfxVolume: number;
  onSfxVolumeChange: (v: number) => void;
  fxVolume: number;
  onFxVolumeChange: (v: number) => void;
  theme: "dark" | "light";
  onThemeChange: (t: "dark" | "light") => void;
  onPlayClick?: () => void;
}

export function SettingsModal({ 
  open, 
  onOpenChange, 
  quality, 
  onQualityChange,
  audioEnabled,
  onAudioEnabledChange,
  musicVolume,
  onMusicVolumeChange,
  sfxVolume,
  onSfxVolumeChange,
  fxVolume,
  onFxVolumeChange,
  theme,
  onThemeChange,
  onPlayClick
}: Props) {
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

  if (!open) return null;

  // Per-channel muted state: volume === 0 acts as the muted indicator
  // We track a "pre-mute" value to restore when toggling back on
  const isMusicMuted = musicVolume === 0;
  const isSfxMuted = sfxVolume === 0;
  const isFxMuted = fxVolume === 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      
      <div className="hud-panel hud-corner w-full max-w-[420px] animate-fade-in relative text-foreground">
        <div className="flex items-center justify-between px-4 py-3 border-b border-primary/20">
          <div className="font-display text-sm uppercase tracking-[0.2em] text-primary text-glow">
            System Settings
          </div>
          <button 
            onClick={() => {
              onOpenChange(false);
              onPlayClick?.();
            }} 
            className="text-muted-foreground hover:text-primary transition"
          >
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
                  onClick={() => {
                    onQualityChange(q);
                    onPlayClick?.();
                  }}
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

          {/* Audio Settings */}
          <div className="space-y-4 pt-2 border-t border-primary/10">
            {/* Master Audio Toggle */}
            <div className="flex items-center justify-between">
              <div className="font-mono-hud text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
                Neural Audio Uplink
              </div>
              <button 
                onClick={() => {
                  onAudioEnabledChange(!audioEnabled);
                  onPlayClick?.();
                }}
                className={`p-1 rounded transition-colors ${audioEnabled ? 'text-primary' : 'text-muted-foreground'}`}
              >
                {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            </div>

            <div className="space-y-4">
              {/* Ambient Music */}
              <AudioChannel
                icon={<Music size={12} className="opacity-60" />}
                label="Ambient Music"
                volume={musicVolume}
                setVolume={onMusicVolumeChange}
                isMuted={isMusicMuted}
                masterDisabled={!audioEnabled}
                onToggleMute={() => onMusicVolumeChange(isMusicMuted ? 0.4 : 0)}
                onPlayClick={onPlayClick}
              />

              {/* HUD SFX */}
              <AudioChannel
                icon={<Zap size={12} className="opacity-60" />}
                label="HUD Feedback"
                volume={sfxVolume}
                setVolume={onSfxVolumeChange}
                isMuted={isSfxMuted}
                masterDisabled={!audioEnabled}
                onToggleMute={() => onSfxVolumeChange(isSfxMuted ? 0.6 : 0)}
                onPlayClick={onPlayClick}
              />

              {/* Positional / FX Audio */}
              <AudioChannel
                icon={<Radio size={12} className="opacity-60" />}
                label="FX Audio"
                sublabel="Stars · Planets · Ships · Gates"
                volume={fxVolume}
                setVolume={onFxVolumeChange}
                isMuted={isFxMuted}
                masterDisabled={!audioEnabled}
                onToggleMute={() => onFxVolumeChange(isFxMuted ? 0.5 : 0)}
                onPlayClick={onPlayClick}
              />
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-primary/10">
            <div className="font-mono-hud text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
              Display &amp; HUD
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-display uppercase tracking-widest text-foreground">Interface Theme</span>
                <span className="text-[9px] font-mono-hud text-muted-foreground">Toggle Dark / Light mode</span>
              </div>
              <div className="flex bg-primary/5 border border-primary/20 p-0.5 rounded gap-1">
                {(["dark", "light"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      onThemeChange(t);
                      onPlayClick?.();
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 transition ${
                      theme === t 
                        ? "bg-primary text-background shadow-[0_0_10px_hsl(var(--primary)/0.3)]" 
                        : "text-muted-foreground hover:text-primary"
                    }`}
                  >
                    {t === "dark" ? <Moon size={12} /> : <Sun size={12} />}
                    <span className="font-mono-hud text-[9px] uppercase tracking-widest">{t}</span>
                  </button>
                ))}
              </div>
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
              Starbound Hegemony · Build v0.1.21-sb
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Reusable audio channel row: icon, label, mute toggle, volume %, slider */
function AudioChannel({
  icon,
  label,
  sublabel,
  volume,
  setVolume,
  isMuted,
  masterDisabled,
  onToggleMute,
  onPlayClick,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  volume: number;
  setVolume: (v: number) => void;
  isMuted: boolean;
  masterDisabled: boolean;
  onToggleMute: () => void;
  onPlayClick?: () => void;
}) {
  const disabled = masterDisabled;

  return (
    <div className={`space-y-2 transition-opacity ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
      <div className="flex justify-between items-center font-mono-hud text-[10px] uppercase tracking-widest">
        {/* Left: icon + labels */}
        <div className="flex items-center gap-2">
          {icon}
          <div className="flex flex-col leading-none gap-0.5">
            <span>{label}</span>
            {sublabel && (
              <span className="text-[7px] text-muted-foreground/60 normal-case tracking-wider">{sublabel}</span>
            )}
          </div>
        </div>
        {/* Right: percentage + mute toggle */}
        <div className="flex items-center gap-2">
          <span className={`tabular-nums w-8 text-right ${isMuted ? "text-muted-foreground/40" : "text-primary"}`}>
            {isMuted ? "OFF" : `${Math.round(volume * 100)}%`}
          </span>
          <button
            onClick={() => { onToggleMute(); onPlayClick?.(); }}
            className={`p-0.5 rounded transition-colors ${isMuted ? "text-muted-foreground/40" : "text-primary"}`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>
        </div>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={(e) => {
          setVolume(parseFloat(e.target.value));
          onPlayClick?.();
        }}
        disabled={disabled}
        className="w-full h-1 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-30 disabled:cursor-not-allowed"
      />
    </div>
  );
}
