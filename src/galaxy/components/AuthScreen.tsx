import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Mail, Lock, ShieldCheck, Cpu, ChevronRight } from "lucide-react";
import logo from "@/assets/logo.png";
import authBg from "@/assets/auth-bg.png";
import { toast } from "sonner";

interface AuthScreenProps {
  onSuccess: () => void;
  playClick: () => void;
  playSuccess: () => void;
}

export function AuthScreen({ onSuccess, playClick, playSuccess }: AuthScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Account created!", {
          description: "Check your email for the verification link."
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        playSuccess();
        onSuccess();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      toast.error("Authentication Failed", {
        description: message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black overflow-hidden"
      style={{
        backgroundImage: `url(${authBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark tint overlay for atmospheric depth */}
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />

      {/* Central Neural Band - precise dark blue with horizontal fade-in */}
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

        {/* Compact Content Wrapper */}
        <div className="flex flex-col justify-center w-full max-w-[400px] mx-auto space-y-6 relative z-10">
          {/* Header Section */}
          <div className="text-center space-y-2">
            <div className="relative inline-block group">
              <div className="absolute -inset-4 bg-primary/20 blur-xl rounded-full opacity-40 group-hover:opacity-100 transition-opacity duration-1000" />
              <img 
                src={logo} 
                alt="Starbound Hegemony" 
                className="h-12 w-auto mx-auto drop-shadow-[0_0_20px_rgba(0,255,255,0.5)] relative" 
              />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-display tracking-[0.4em] text-primary text-glow uppercase">Neural Uplink</h1>
              <p className="text-[8px] font-mono-hud text-primary/40 uppercase tracking-[0.2em]">Verify credentials to access fleet command</p>
            </div>
          </div>

          {/* Authentication Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-1 group">
                <label className="flex items-center gap-2 text-[9px] font-mono-hud text-primary/60 uppercase tracking-widest ml-1 transition-colors">
                  <Mail size={10} />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/50 border border-primary/20 rounded-sm px-3 py-2.5 text-xs font-mono-hud text-primary placeholder:text-primary/10 focus:outline-none focus:border-primary/50 focus:bg-slate-900/80 transition-all"
                  placeholder="commander@hegemony.os"
                  required
                />
              </div>

              <div className="space-y-1 group">
                <label className="flex items-center gap-2 text-[9px] font-mono-hud text-primary/60 uppercase tracking-widest ml-1 transition-colors">
                  <Lock size={10} />
                  Security Token
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-primary/20 rounded-sm px-3 py-2.5 text-xs font-mono-hud text-primary placeholder:text-primary/10 focus:outline-none focus:border-primary/50 focus:bg-slate-900/80 transition-all"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full group relative overflow-hidden bg-primary py-3 text-slate-950 font-display text-sm tracking-[0.3em] uppercase hover:bg-white transition-all disabled:opacity-50"
            >
              <div className="relative z-10 flex items-center justify-center gap-3">
                {loading ? <Loader2 className="animate-spin" /> : (
                  <>
                    <span>{mode === "login" ? "Establish Link" : "Initialize Account"}</span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Social and Guest Actions */}
          <div className="flex flex-col gap-4">
            <button
              onClick={() => { playClick(); setMode(mode === "login" ? "signup" : "login"); }}
              className="text-[9px] font-mono-hud text-primary/40 uppercase tracking-widest hover:text-primary transition-colors text-center"
            >
              {mode === "login" ? "New Commander? Register Registry" : "Already Registered? Login"}
            </button>
            
            <div className="flex items-center gap-4 py-1">
              <div className="h-px flex-1 bg-primary/10" />
              <span className="text-[7px] font-mono-hud text-primary/20 uppercase tracking-widest">OR SOCIAL UPLINK</span>
              <div className="h-px flex-1 bg-primary/10" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  playClick();
                  supabase.auth.signInWithOAuth({ 
                    provider: 'google',
                    options: { redirectTo: window.location.origin }
                  });
                }}
                className="flex items-center justify-center gap-2 py-2 border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all font-display text-[9px] uppercase tracking-widest text-primary/60 hover:text-primary"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Google</span>
              </button>
              <button
                onClick={() => {
                  playClick();
                  supabase.auth.signInWithOAuth({ 
                    provider: 'discord',
                    options: { redirectTo: window.location.origin }
                  });
                }}
                className="flex items-center justify-center gap-2 py-2 border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all font-display text-[9px] uppercase tracking-widest text-primary/60 hover:text-primary"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.086 2.157 2.419c0 1.334-.947 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.086 2.157 2.419c0 1.334-.946 2.419-2.157 2.419z"/>
                </svg>
                <span>Discord</span>
              </button>
            </div>

        </div>
      </div>
    </div>
  </div>
);
}
