import { useState } from "react";
import { 
  Coins, Newspaper, Sparkles, User as UserIcon, Users as UsersIcon, 
  Globe, Zap, Shield, Rocket, TrendingUp, Anchor, History, Factory, Award, Hexagon
} from "lucide-react";
import { GalaxyIcon } from "./ResourceIcon";
import { PartyView } from "./PartyView";
import { type GalaxyApp } from "@/galaxy/useGalaxyApp";
import { RESOURCE_META } from "@/galaxy/meta";



function StatCard({ label, value, unit, icon: Icon, color }: { label: string; value: number | string; unit: string; icon: any; color: "primary" | "warning" | "success" | "purple" | "cyan" }) {
  const colorMap = {
    primary: "text-primary border-primary/20 bg-primary/10",
    warning: "text-warning border-warning/20 bg-warning/10",
    success: "text-success border-success/20 bg-success/10",
    purple: "text-purple-500 border-purple-500/20 bg-purple-500/10",
    cyan: "text-cyan-400 border-cyan-400/20 bg-cyan-400/10"
  };
  
  return (
    <div className={`hud-panel p-4 flex items-center gap-4 border ${colorMap[color].split(' ').slice(1).join(' ')} group hover:border-opacity-50 transition-colors`}>
      <div className={`p-3 rounded bg-background/50 ${colorMap[color].split(' ')[0]} group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
      <div className="flex flex-col">
        <span className="font-mono-hud text-[10px] uppercase text-muted-foreground">{label}</span>
        <div className="flex items-baseline gap-1">
          <span className={`font-display text-2xl text-glow ${colorMap[color].split(' ')[0]}`}>{value}</span>
          <span className="font-mono-hud text-[8px] text-muted-foreground uppercase">{unit}</span>
        </div>
      </div>
    </div>
  );
}

function LogEntry({ date, event, type, description }: { date: string, event: string, type: string, description?: string }) {
  return (
    <div className="flex items-start gap-4 p-4 bg-primary/5 border border-primary/10 rounded group hover:border-primary/30 transition-all">
      <div className="font-mono-hud text-[10px] text-primary/60 pt-1 whitespace-nowrap w-20">{date}</div>
      <div className="flex-1 space-y-2">
        <p className="font-display text-sm text-foreground group-hover:text-primary transition-colors uppercase tracking-wider">{event}</p>
        {description && (
          <p className="font-mono-hud text-[10px] text-muted-foreground leading-relaxed italic border-l border-primary/20 pl-3">
            "{description}"
          </p>
        )}
      </div>
      <div className="font-mono-hud text-[8px] uppercase px-2 py-1 bg-primary/10 text-primary/80 rounded mt-0.5 shrink-0">
        {type.replace('_', ' ')}
      </div>
    </div>
  );
}

export function ProfileView({ app, onPlayClick }: { app: GalaxyApp; onPlayClick: () => void }) {
  const [activeTab, setActiveTab] = useState("Overview");
  
  const TABS = [
    { label: "Overview", icon: UserIcon },
    { label: "Assets", icon: Coins },
    { label: "Political", icon: Shield },
    { label: "Reputation", icon: UsersIcon },
    { label: "Logbook", icon: Newspaper },
  ];

  return (
    <div className="flex-1 flex flex-col sm:flex-row bg-background/40 backdrop-blur-sm animate-fade-in overflow-hidden">
      {/* Profile Sidebar */}
      <aside className="w-full sm:w-[320px] border-b sm:border-b-0 sm:border-r border-primary/20 flex flex-col bg-primary/5 animate-in slide-in-from-left duration-500 shrink-0">
        <div className="p-3 sm:p-6 border-b border-primary/20 flex flex-row sm:flex-col items-center justify-center sm:justify-start gap-4">
          <div className="relative">
            <div className="w-12 h-12 sm:w-24 sm:h-24 rounded-full border-2 sm:border-4 border-primary/30 overflow-hidden shadow-[0_0_20px_hsl(var(--primary)/0.2)]">
              <img src={app.playerAvatar} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-primary text-background font-display text-[10px] sm:text-lg px-1 sm:px-2 rounded border border-background">
              {app.playerLevel}
            </div>
          </div>
          <div className="flex flex-col text-left sm:text-center min-w-0">
            <h2 className="font-display text-base sm:text-2xl text-primary text-glow uppercase tracking-[0.1em] truncate">{app.playerName}</h2>
            <p className="font-mono-hud text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-[0.2em] sm:tracking-[0.3em] truncate">Commander</p>
          </div>
        </div>

        <nav className="p-1 sm:p-2 flex flex-row sm:flex-col gap-1 overflow-x-auto sm:overflow-y-auto no-scrollbar">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.label}
                  onClick={() => {
                    setActiveTab(tab.label);
                    onPlayClick();
                  }}
                  className={`flex items-center gap-1.5 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-3 rounded transition-all whitespace-nowrap ${
                    activeTab === tab.label 
                      ? "bg-primary/20 text-primary border border-primary/40 shadow-[inset_0_0_10px_hsl(var(--primary)/0.1)]" 
                      : "text-muted-foreground hover:text-primary hover:bg-primary/5 border border-transparent"
                  }`}
                >
                  <Icon size={14} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="font-display text-[10px] sm:text-sm uppercase tracking-widest">{tab.label}</span>
                </button>
              );
            })}
        </nav>
      </aside>

      {/* Profile Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none scanline opacity-10" />
        
        <div className="flex-1 overflow-y-auto p-3 sm:p-10 custom-scrollbar relative z-10">
          <div className="max-w-4xl mx-auto">
            {activeTab === "Overview" && (
              <div className="space-y-6 sm:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard label="Action Potential" value={Math.floor(app.ap)} unit="AP" icon={Zap} color="primary" />
                  <StatCard label="Total Net Worth" value={Math.floor(app.sc).toLocaleString()} unit="SC" icon={Coins} color="warning" />
                  <StatCard label="Void Tokens" value={0} unit="VT" icon={Hexagon} color="purple" />
                  <StatCard label="Systems Discovered" value={app.exploredSystemIds.size} unit="SYS" icon={Globe} color="success" />
                  <StatCard label="Active Fleets" value={app.fleetCount} unit="FLT" icon={Rocket} color="primary" />
                  <StatCard label="Industrial Sites" value={app.userFactories?.length || 0} unit="FAC" icon={Factory} color="cyan" />
                </div>

                {/* Status Snapshot */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="hud-panel p-6 border border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-3 mb-6">
                      <Shield className="text-primary" size={20} />
                      <h3 className="font-display text-xs uppercase tracking-[0.2em] text-primary">Current Status</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-background/20 p-3 rounded">
                        <span className="font-mono-hud text-[10px] text-muted-foreground uppercase">Hegemony Status</span>
                        <span className="font-display text-[10px] text-success uppercase tracking-widest px-2 py-0.5 border border-success/40 rounded">Active Service</span>
                      </div>
                      <div className="flex justify-between items-center bg-background/20 p-3 rounded">
                        <span className="font-mono-hud text-[10px] text-muted-foreground uppercase">Planet Residency</span>
                        <span className="font-display text-[10px] text-primary uppercase tracking-widest px-2 py-0.5 border border-primary/40 rounded">
                          {app.userResidency?.bodyId || "None"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-background/20 p-3 rounded">
                        <span className="font-mono-hud text-[10px] text-muted-foreground uppercase">Bounty Priority</span>
                        <span className="font-display text-[10px] text-primary uppercase tracking-widest px-2 py-0.5 border border-primary/40 rounded">None</span>
                      </div>
                      <div className="flex justify-between items-center bg-background/20 p-3 rounded">
                        <span className="font-mono-hud text-[10px] text-muted-foreground uppercase">Next Requisition</span>
                        <span className="font-display text-[10px] text-warning uppercase">24h 12m 04s</span>
                      </div>
                    </div>
                  </div>

                  <div className="hud-panel p-6 border border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-3 mb-6">
                      <TrendingUp className="text-primary" size={20} />
                      <h3 className="font-display text-xs uppercase tracking-[0.2em] text-primary">Performance</h3>
                    </div>
                    <div className="h-24 flex items-end justify-between gap-1">
                      {[40, 20, 60, 80, 45, 90, 100].map((h, i) => (
                        <div 
                          key={i} 
                          className="flex-1 bg-primary/20 relative group"
                          style={{ height: `${h}%` }}
                        >
                          <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-40 transition-opacity" />
                          <div className="absolute bottom-full left-0 right-0 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="font-mono-hud text-[6px] text-primary text-center block">{h}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-2">
                       <span className="font-mono-hud text-[6px] text-muted-foreground uppercase">Projected Output</span>
                       <span className="font-mono-hud text-[6px] text-success uppercase">+12.4% Weekly</span>
                    </div>
                  </div>
                </div>

                {/* Career Timeline */}
                <section className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-primary/20" />
                    <h3 className="font-display text-sm uppercase tracking-[0.3em] text-primary/60">Recent Activity</h3>
                    <div className="h-px flex-1 bg-primary/20" />
                  </div>
                  
                  <div className="space-y-4">
                    {app.userLogs.slice(0, 3).map((log, i) => (
                      <LogEntry 
                        key={log.id} 
                        date={new Date(log.created_at).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.')} 
                        event={log.title} 
                        type={log.type} 
                        description={log.description}
                      />
                    ))}
                    {app.userLogs.length === 0 && (
                      <div className="text-center py-4 border border-dashed border-primary/10 rounded">
                        <span className="font-mono-hud text-[10px] text-muted-foreground uppercase italic">No activity recorded yet</span>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {activeTab === "Assets" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between border-b border-primary/20 pb-4">
                  <div>
                    <h3 className="font-display text-lg uppercase tracking-widest text-primary">Managed Assets</h3>
                    <p className="font-mono-hud text-[10px] text-muted-foreground uppercase mt-1">Ships, Factories & Holdings</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono-hud text-[10px] text-muted-foreground uppercase block">Available Liquidity</span>
                    <span className="font-display text-xl text-warning text-glow">{Math.floor(app.sc).toLocaleString()} SC</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Active Vessel */}
                  <div className="hud-panel p-4 border border-primary/20 bg-primary/5 group hover:border-primary/40 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <Rocket size={20} className="text-primary" />
                      <span className="font-display text-xs uppercase tracking-widest">{app.shipConfig.name}</span>
                      <span className="ml-auto font-mono-hud text-[8px] px-2 py-0.5 bg-success/20 text-success rounded">OPERATIONAL</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[9px] font-mono-hud uppercase text-muted-foreground">
                      <span>Hull: {app.shipConfig.hullId}</span>
                      <span>Hulls: 100%</span>
                      <span>Engines: {app.shipConfig.enginesId}</span>
                      <span>Status: {app.travel ? "In Transit" : "Stationary"}</span>
                    </div>
                  </div>

                  {/* Player Factories */}
                  {app.userFactories?.map(f => (
                    <div key={f.id} className="hud-panel p-4 border border-primary/10 bg-primary/5 group hover:border-primary/40 transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <Factory size={20} className="text-primary" />
                        <span className="font-display text-xs uppercase tracking-widest">{f.type}</span>
                        <span className="ml-auto font-mono-hud text-[8px] px-2 py-0.5 bg-info/20 text-info rounded">PRODUCING</span>
                      </div>
                      <div className="grid grid-cols-1 gap-1 text-[9px] font-mono-hud uppercase text-muted-foreground">
                        <span className="truncate">Loc: {app.galaxy.systemById[f.systemId]?.name || f.systemId} · {f.bodyId}</span>
                        <span>Wage: {f.wage} SC/shift</span>
                        <span>Capacity: {f.jobsAvailable} slots</span>
                      </div>
                    </div>
                  ))}

                  {(!app.userFactories || app.userFactories.length === 0) && (
                    <div className="hud-panel p-4 border border-dashed border-primary/10 bg-primary/5 flex flex-col items-center justify-center text-center opacity-50">
                      <Anchor size={20} className="text-muted-foreground mb-2" />
                      <p className="text-[8px] font-mono-hud italic text-muted-foreground uppercase">No industrial assets detected</p>
                    </div>
                  )}
                </div>

                {/* Resource Stockpiles */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-px w-8 bg-primary/20" />
                      <h3 className="font-display text-sm uppercase tracking-[0.3em] text-primary/60">Inventory Stockpiles</h3>
                      <div className="h-px flex-1 bg-primary/20" />
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="font-mono-hud text-[10px] uppercase text-muted-foreground">Cargo Hold</span>
                      <span className="font-display text-xs text-info">{app.userResources?.reduce((sum, r) => sum + r.amount, 0) || 0} / {app.cargoCapacity}</span>
                    </div>
                  </div>
                  
                  <div className="h-1 bg-primary/10 rounded-full overflow-hidden w-full">
                    <div 
                      className={`h-full transition-all ${(app.userResources?.reduce((sum, r) => sum + r.amount, 0) || 0) >= app.cargoCapacity ? 'bg-warning' : 'bg-info'}`}
                      style={{ width: `${Math.min(100, ((app.userResources?.reduce((sum, r) => sum + r.amount, 0) || 0) / app.cargoCapacity) * 100)}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {app.userResources?.map(r => {
                      const meta = (RESOURCE_META as any)[r.resourceType];
                      return (
                        <div key={r.resourceType} className="hud-panel p-3 border border-primary/10 bg-primary/5 flex flex-col items-center text-center group hover:border-primary/30 transition-all">
                          <div className="mb-2 group-hover:scale-110 transition-all" style={{ color: meta?.color || 'hsl(var(--primary))' }}>
                            <GalaxyIcon name={meta?.icon} className="w-6 h-6" />
                          </div>
                          <span className="font-mono-hud text-[8px] text-primary/60 uppercase truncate w-full">{r.resourceType}</span>
                          <span className="font-display text-xs text-foreground mt-1">{r.amount.toLocaleString()}</span>
                        </div>
                      );
                    })}
                    {(!app.userResources || app.userResources.length === 0) && (
                      <div className="col-span-full py-8 text-center border border-dashed border-primary/10 rounded">
                        <span className="font-mono-hud text-[10px] text-muted-foreground uppercase italic">Cargo bay empty</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Political" && (
              <div className="flex-1 flex flex-col min-h-0">
                 <PartyView app={app} />
              </div>
            )}

            {activeTab === "Reputation" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Community Reputation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="hud-panel p-6 border border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-3 mb-6">
                      <Award className="text-primary" size={20} />
                      <h3 className="font-display text-xs uppercase tracking-[0.2em] text-primary">Subspace Influence</h3>
                    </div>
                    <p className="font-mono-hud text-[9px] text-muted-foreground uppercase mb-4">Feedback received on your broadcasted articles</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-success/10 border border-success/20 rounded text-center">
                        <div className="font-mono-hud text-[8px] text-success/60 uppercase mb-1">Upvotes</div>
                        <div className="font-display text-xl text-success text-glow">+{app.socialStats.upvotesReceived}</div>
                      </div>
                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-center">
                        <div className="font-mono-hud text-[8px] text-destructive/60 uppercase mb-1">Downvotes</div>
                        <div className="font-display text-xl text-destructive text-glow">-{app.socialStats.downvotesReceived}</div>
                      </div>
                    </div>
                    <div className="mt-6">
                      <div className="flex justify-between text-[8px] font-mono-hud uppercase mb-2">
                        <span className="text-muted-foreground">Net Sentiment</span>
                        <span className="text-primary">{app.socialStats.upvotesReceived - app.socialStats.downvotesReceived >= 0 ? "+" : ""}{app.socialStats.upvotesReceived - app.socialStats.downvotesReceived}</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ 
                            width: `${Math.max(5, Math.min(95, (app.socialStats.upvotesReceived / (app.socialStats.upvotesReceived + app.socialStats.downvotesReceived || 1)) * 100))}%` 
                          }} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="hud-panel p-6 border border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-3 mb-6">
                      <UsersIcon className="text-primary" size={20} />
                      <h3 className="font-display text-xs uppercase tracking-[0.2em] text-primary">Galaxy Participation</h3>
                    </div>
                    <p className="font-mono-hud text-[9px] text-muted-foreground uppercase mb-4">Total feedback you have provided to other commanders</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-primary/10 border border-primary/20 rounded text-center">
                        <div className="font-mono-hud text-[8px] text-primary/60 uppercase mb-1">Given Up</div>
                        <div className="font-display text-xl text-primary text-glow">{app.socialStats.upvotesGiven}</div>
                      </div>
                      <div className="p-3 bg-primary/10 border border-primary/20 rounded text-center">
                        <div className="font-mono-hud text-[8px] text-primary/60 uppercase mb-1">Given Down</div>
                        <div className="font-display text-xl text-primary text-glow">{app.socialStats.downvotesGiven}</div>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-primary/10">
                      <div className="flex justify-between items-center text-[10px] font-mono-hud uppercase">
                        <span className="text-muted-foreground">Total Engagement</span>
                        <span className="text-primary">{app.socialStats.upvotesGiven + app.socialStats.downvotesGiven} Interactions</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hud-panel p-6 border border-primary/20 bg-primary/5">
                   <h3 className="font-display text-xs uppercase tracking-[0.2em] text-primary mb-6">Faction Standing</h3>
                   <div className="space-y-6">
                    {[
                      { name: "Hegemony High Command", value: 85, color: "text-primary" },
                      { name: "Independent Outer Rim", value: 12, color: "text-warning" },
                      { name: "Corporate Syndicate", value: 45, color: "text-success" },
                      { name: "Lost Colonies Envoy", value: -20, color: "text-destructive" },
                    ].map((f) => (
                      <div key={f.name} className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-display uppercase tracking-widest">
                          <span className={f.color}>{f.name}</span>
                          <span>{f.value > 0 ? "+" : ""}{f.value}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                          <div 
                            className={`h-full opacity-60 ${f.value > 0 ? "bg-primary" : "bg-destructive"}`}
                            style={{ 
                              width: `${Math.abs(f.value)}%`,
                              marginLeft: f.value < 0 ? `${100 - Math.abs(f.value)}%` : "0"
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Logbook" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between border-b border-primary/20 pb-4">
                  <div className="flex items-center gap-3">
                    <History size={20} className="text-primary" />
                    <h3 className="font-display text-lg uppercase tracking-widest text-primary">Chronological Registry</h3>
                  </div>
                  <span className="font-mono-hud text-[8px] text-muted-foreground uppercase">Archives: 3024.12.01 - Present</span>
                </div>

                <div className="space-y-8 relative">
                   <div className="absolute left-[70px] sm:left-[84px] top-4 bottom-4 w-px bg-primary/10" />
                   {app.userLogs.map((log) => (
                     <div key={log.id} className="flex gap-4 sm:gap-8 items-start relative group">
                        <div className="font-mono-hud text-[8px] sm:text-[10px] text-primary/40 pt-1 w-14 sm:w-20 shrink-0 text-right">
                          {new Date(log.created_at).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.')}
                        </div>
                        <div className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors mt-1.5 shrink-0 z-10" />
                        <div className="flex-1 bg-primary/5 border border-primary/10 p-4 rounded-lg group-hover:border-primary/30 transition-all">
                           <div className="flex justify-between items-center mb-1">
                              <h4 className="font-display text-xs uppercase tracking-widest text-primary">{log.title}</h4>
                              <span className="text-[7px] font-mono-hud px-1.5 py-0.5 bg-primary/10 text-primary/60 rounded uppercase">{log.type}</span>
                           </div>
                           <p className="text-[9px] font-mono-hud text-muted-foreground leading-relaxed">{log.description}</p>
                        </div>
                     </div>
                   ))}
                   {app.userLogs.length === 0 && (
                     <div className="text-center py-20 border border-dashed border-primary/10 rounded">
                       <p className="font-mono-hud text-xs text-muted-foreground uppercase tracking-widest italic">Personal registry is empty. Establish contact or construct assets to begin logging.</p>
                     </div>
                   )}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
