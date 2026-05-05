import { X, History } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChangelogEntry {
  version: string;
  title: string;
  date: string;
  type: "feature" | "fix" | "polish" | "perf";
  changes: string[];
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.2.1",
    title: "Phase 2: Empire Governance",
    date: "2026-05-04",
    type: "feature",
    changes: [
      "Transitioned to Phase 2: Player-driven Galactic Lifecycle",
      "Implemented Empire Formation Referendums and State Elections",
      "Added Ministerial Appointment system for Imperial Heads of State",
      "Integrated residency indicators with amber HUD markers on 3D map",
      "Removed legacy 'mock' state data for a clean 'Day 1' player start",
      "Optimized SystemNode performance during large-scale map zooms"
    ]
  },
  {
    version: "0.1.21",
    title: "Cinematic Credits & UI Restyle",
    date: "2026-05-02",
    type: "feature",
    changes: [
      "Integrated high-fidelity cinematic Credits Screen with space-parallax background",
      "Restyled System Changelog to match tactical HUD and Settings Modal aesthetic",
      "Added animated nebula layers, digital grids, and scan-line effects to credits",
      "Corrected contributor metadata for Claude 4.6 and Triskelion Audio"
    ]
  },
  {
    version: "0.1.20",
    title: "Focus-Aware Audio Muting",
    date: "2026-05-02",
    type: "polish",
    changes: [
      "Implemented automatic audio context suspension when window loses focus",
      "Added visibilitychange observer to mute ambient and positional audio background leakage",
      "Optimized power consumption by pausing Web Audio processing when backgrounded"
    ]
  },
  {
    version: "0.1.19",
    title: "Galactic Navigation & Visual Polish",
    date: "2026-05-02",
    type: "feature",
    changes: [
      "Implemented Warp Bubble shader during FTL transit",
      "Doubled Gas Giant celestial scaling for improved visual identification",
      "Fixed ship orientation snap glitch during system rematerialization",
      "Balanced jumpgate audio attenuation and planetary ambient volumes"
    ]
  },
  {
    version: "0.1.18",
    title: "Mobile Navigation Optimizations",
    date: "2026-05-02",
    type: "polish",
    changes: [
      "Restricted critical navigation actions to HUD header on mobile devices",
      "Fixed interaction conflicts with HTML labels by disabling pointer-events",
      "Repositioned mobile control buttons for better ergonomic accessibility"
    ]
  },
  {
    version: "0.1.17",
    title: "Political Systems & Hemicycle UI",
    date: "2026-05-01",
    type: "feature",
    changes: [
      "Implemented interactive Council Hemicycle with dynamic seat occupancy",
      "Added 'VACANT' status handling for empire leadership roles",
      "Integrated political seat tooltips and legislative visualizations"
    ]
  },
  {
    version: "0.1.16",
    title: "Stellar Fidelity & Audio Signatures",
    date: "2026-05-01",
    type: "feature",
    changes: [
      "Added high-contrast cyan-white shaders for Pulsars and Magnetars",
      "Implemented unique spatial audio signatures for all celestial body types",
      "Integrated AudioListener tracking for accurate spatial audio relative to camera"
    ]
  },
  {
    version: "0.1.15",
    title: "Cinematic Auth & Onboarding",
    date: "2026-04-29",
    type: "feature",
    changes: [
      "Deployed hidden-until-auth cinematic landing interface",
      "Integrated Supabase authentication flow with environment variable injection",
      "Optimized PWA caching for faster production build updates"
    ]
  },
  {
    version: "0.1.14",
    title: "Planetary Lighting & Performance",
    date: "2026-04-29",
    type: "perf",
    changes: [
      "Implemented bi-directional shadow casting for multiple moon occluders",
      "Optimized rendering by gating viewport updates and memoizing heavy map components",
      "Stabilized navigation transitions across view modes"
    ]
  },
  {
    version: "0.1.13",
    title: "Jumpgate Visuals & FTL Movement",
    date: "2026-04-29",
    type: "feature",
    changes: [
      "Upgraded jumpgate rendering with high-fidelity energy effects",
      "Added animated FTL movement cues and relocated transit icons",
      "Implemented viewport-relative HUD scaling for deep space navigation"
    ]
  },
  {
    version: "0.1.12",
    title: "White Hole Dynamics",
    date: "2026-04-28",
    type: "feature",
    changes: [
      "Normalized White Hole shader math and disk dynamics across all views",
      "Optimized supermassive stellar hitboxes for better ship proximity handling",
      "Implemented procedural ejection disk turbulence"
    ]
  },
  {
    version: "0.1.11",
    title: "Ship Customization Systems",
    date: "2026-04-27",
    type: "feature",
    changes: [
      "Added Modular Ship preset system with dynamic part rendering",
      "Implemented engine thruster scaling based on transit velocity",
      "Integrated Ship Customizer interface in the onboarding flow"
    ]
  },
  {
    version: "0.1.10",
    title: "Imperial Territory Rings",
    date: "2026-04-26",
    type: "feature",
    changes: [
      "Implemented Proportional Sovereignty Rings for contested systems",
      "Added sovereignty auras for fully owned imperial systems",
      "Optimized territory ring rendering using additive blending"
    ]
  },
  {
    version: "0.1.9",
    title: "Fog of War & Exploration",
    date: "2026-04-25",
    type: "feature",
    changes: [
      "Implemented data-driven Fog of War with per-system exploration state",
      "Restricted celestial telemetry for unvisited systems",
      "Added system 'discovery' notifications"
    ]
  },
  {
    version: "0.1.8",
    title: "Sector Map Navigation",
    date: "2026-04-24",
    type: "feature",
    changes: [
      "Added navigable Sector Map view with coordinate-based system layout",
      "Implemented sub-light navigation between local celestial bodies",
      "Integrated distance-based transit timers"
    ]
  },
  {
    version: "0.1.7",
    title: "Analytical Orbital Mechanics",
    date: "2026-04-23",
    type: "polish",
    changes: [
      "Fixed orbital jitter by transitioning to frame-rate-independent time",
      "Implemented analytical ray-sphere intersection for high-performance shadows",
      "Normalized planetary rotation and orbital speeds"
    ]
  },
  {
    version: "0.1.6",
    title: "Galaxy Generation Engine",
    date: "2026-04-22",
    type: "feature",
    changes: [
      "Implemented procedural galaxy generation with 500+ unique systems",
      "Added spectral class distribution and star type variety",
      "Optimized system lookup using spatial hashing"
    ]
  },
  {
    version: "0.1.5",
    title: "HUD & Resource Management",
    date: "2026-04-21",
    type: "feature",
    changes: [
      "Implemented main HUD with real-time AP and Credit tracking",
      "Added resource abundance telemetry for planetary bodies",
      "Integrated context-aware tooltips for UI elements"
    ]
  },
  {
    version: "0.1.4",
    title: "Space Environment Assets",
    date: "2026-04-20",
    type: "polish",
    changes: [
      "Added procedural Nebula shaders for galaxy background",
      "Implemented dynamic starfield parallax effects",
      "Enhanced volumetric lighting for stellar bodies"
    ]
  },
  {
    version: "0.1.3",
    title: "Procedural Naming & Classes",
    date: "2026-04-19",
    type: "feature",
    changes: [
      "Integrated procedural naming generator for systems and planets",
      "Implemented spectral class property mapping for stars",
      "Added orbital constraint logic for system generation"
    ]
  },
  {
    version: "0.1.2",
    title: "Three.js Foundation",
    date: "2026-04-18",
    type: "feature",
    changes: [
      "Established Three.js scene architecture and R3F integration",
      "Implemented CameraControls with focus-shifting capabilities",
      "Added basic sphere geometries for celestial bodies"
    ]
  },
  {
    version: "0.1.1",
    title: "Project Initialization",
    date: "2026-04-17",
    type: "feature",
    changes: [
      "Initialized Vite + React + TypeScript project",
      "Integrated TailwindCSS and Shadcn UI component library",
      "Configured baseline project directory structure"
    ]
  }
];

export function ChangelogModal({ open, onOpenChange, onPlayClick }: { open: boolean, onOpenChange: (open: boolean) => void, onPlayClick?: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      
      <div className="hud-panel hud-corner w-full max-w-[640px] animate-fade-in relative flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-primary/20">
          <div className="flex items-center gap-3">
            <History size={16} className="text-primary/60" />
            <div className="font-display text-sm uppercase tracking-[0.2em] text-primary text-glow">
              System Changelog
            </div>
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

        <ScrollArea className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <div className="space-y-8 pb-4">
            {CHANGELOG.map((entry) => (
              <div key={entry.version} className="relative pl-6 border-l border-primary/20">
                {/* Timeline Dot */}
                <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
                
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono-hud text-[9px] bg-primary/10 text-primary px-2 py-0.5 border border-primary/20 rounded">
                        v{entry.version}
                      </span>
                      <h3 className="font-display text-[12px] uppercase tracking-wider text-foreground">
                        {entry.title}
                      </h3>
                    </div>
                    <span className="text-[9px] font-mono-hud text-muted-foreground/60 uppercase">
                      {entry.date}
                    </span>
                  </div>

                  <div className="space-y-2 mt-1">
                    {entry.changes.map((change, i) => (
                      <div key={i} className="flex items-start gap-2 group">
                        <div className="mt-1.5 w-1 h-1 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                        <span className="text-[11px] text-muted-foreground group-hover:text-foreground/80 transition-colors leading-relaxed font-mono-hud">
                          {change}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-primary/10 bg-primary/5 flex flex-col items-center gap-3">
          <button
            onClick={() => {
              onOpenChange(false);
              onPlayClick?.();
            }}
            className="w-full sm:w-auto px-10 py-2 border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary font-display text-[10px] uppercase tracking-[0.3em] transition-all"
          >
            Acknowledge
          </button>
          <div className="font-mono-hud text-[8px] text-muted-foreground/30 uppercase tracking-[0.2em]">
            Starbound Hegemony · Build v0.2.1-sb
          </div>
        </div>
      </div>
    </div>
  );
}
