import { Terminal, Shield, Zap, Eye, EyeOff, FastForward } from "lucide-react";

interface Props {
  fogOfWar: boolean;
  setFogOfWar: (v: boolean) => void;
  instantJump: boolean;
  setInstantJump: (v: boolean) => void;
}

export function DebugPanel({ fogOfWar, setFogOfWar, instantJump, setInstantJump }: Props) {
  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
      <div className="hud-panel hud-corner p-3 border-warning/40 bg-warning/5 animate-fade-in w-[220px]">
        <div className="flex items-center gap-2 mb-3 border-b border-warning/20 pb-2">
          <Terminal size={14} className="text-warning" />
          <span className="text-[10px] font-mono-hud uppercase tracking-[0.2em] text-warning font-bold">Override Console</span>
        </div>
        
        <div className="space-y-2">
          <button
            onClick={() => setFogOfWar(!fogOfWar)}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded border transition ${
              fogOfWar ? "border-primary/20 bg-primary/5 text-primary/60" : "border-success bg-success/10 text-success text-glow"
            }`}
          >
            <div className="flex items-center gap-2">
              {fogOfWar ? <EyeOff size={12} /> : <Eye size={12} />}
              <span className="text-[9px] font-mono uppercase tracking-widest">God Mode</span>
            </div>
            <span className="text-[8px] font-bold">{fogOfWar ? "OFF" : "ON"}</span>
          </button>

          <button
            onClick={() => setInstantJump(!instantJump)}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded border transition ${
              !instantJump ? "border-primary/20 bg-primary/5 text-primary/60" : "border-warning bg-warning/10 text-warning text-glow"
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap size={12} />
              <span className="text-[9px] font-mono uppercase tracking-widest">Insta-Jump</span>
            </div>
            <span className="text-[8px] font-bold">{instantJump ? "ON" : "OFF"}</span>
          </button>
        </div>

        <div className="mt-3 pt-2 border-t border-warning/10">
          <p className="text-[8px] text-warning/40 font-mono italic leading-tight">
            Developer credentials verified. Cheats enabled for simulation stress-testing.
          </p>
        </div>
      </div>
    </div>
  );
}
