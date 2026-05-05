import { useState, useMemo } from "react";
import { 
  Users, UserPlus, Shield, Flag, Globe, Coins, Settings, 
  MessageSquare, Award, ArrowRight, Lock, Plus, Search,
  Fingerprint, Sparkles, Building2,
  Rocket, Compass, Crosshair, Target, Sword, Anchor, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { type GalaxyApp } from "@/galaxy/useGalaxyApp";
import { type Party } from "@/galaxy/types";
import { Slider } from "@/components/ui/slider";

const PARTY_ICONS = [
  { name: "Shield", icon: Shield },
  { name: "Flag", icon: Flag },
  { name: "Globe", icon: Globe },
  { name: "Users", icon: Users },
  { name: "Award", icon: Award },
  { name: "Building2", icon: Building2 },
  { name: "Fingerprint", icon: Fingerprint },
  { name: "Sparkles", icon: Sparkles },
  { name: "Rocket", icon: Rocket },
  { name: "Compass", icon: Compass },
  { name: "Crosshair", icon: Crosshair },
  { name: "Target", icon: Target },
  { name: "Sword", icon: Sword },
  { name: "Anchor", icon: Anchor },
  { name: "Zap", icon: Zap },
];

export function PartyView({ app }: { app: GalaxyApp }) {
  const [activeTab, setActiveTab] = useState<"Browse" | "My Party">("Browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [newName, setNewName] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newIdeology, setNewIdeology] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState("Shield");
  const [selectedHue, setSelectedHue] = useState(200);

  const filteredParties = useMemo(() => {
    return app.parties.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.tag.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [app.parties, searchQuery]);

  const handleCreate = async () => {
    if (!newName || !newTag) {
      toast.error("Name and Tag are required");
      return;
    }
    await app.createParty(newName, newTag, newIdeology, newDesc, selectedSymbol, selectedHue);
    setIsCreating(false);
    setNewName("");
    setNewTag("");
    setNewIdeology("");
    setNewDesc("");
    setSelectedSymbol("Shield");
    setSelectedHue(200);
  };

  return (
    <div className="flex-1 flex flex-col bg-background/40 backdrop-blur-sm animate-fade-in overflow-hidden">
      {/* Header */}
      <header className="p-4 sm:p-8 border-b border-primary/20 bg-primary/5 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/20 rounded border border-primary/40 shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]">
              <Users className="text-primary" size={28} />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl text-primary text-glow uppercase tracking-[0.2em]">Political Hub</h1>
              <p className="font-mono-hud text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Ideology · Power · Governance</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant={activeTab === "Browse" ? "default" : "outline"}
              onClick={() => setActiveTab("Browse")}
              className="h-10 text-[10px] uppercase tracking-widest font-display"
            >
              Browse Factions
            </Button>
            <Button 
              variant={activeTab === "My Party" ? "default" : "outline"}
              onClick={() => setActiveTab("My Party")}
              className="h-10 text-[10px] uppercase tracking-widest font-display"
            >
              {app.userParty ? "My Faction" : "Join/Create"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          
          {activeTab === "Browse" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input 
                    placeholder="Filter by name or tag..." 
                    className="pl-10 h-11 bg-primary/5 border-primary/20 text-[11px] uppercase font-mono-hud tracking-wider"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="font-mono-hud text-[10px] text-muted-foreground uppercase">
                  {filteredParties.length} Factions Detected
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredParties.map(p => (
                  <div key={p.id} className="hud-panel border border-primary/20 bg-primary/5 group hover:border-primary/40 transition-all overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-primary/10 bg-primary/5 flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded border flex items-center justify-center text-xl shadow-[0_0_15px_rgba(var(--hue-rgb),0.3)]"
                          style={{ 
                            backgroundColor: `hsla(${p.hue || 200}, 70%, 20%, 0.4)`,
                            borderColor: `hsla(${p.hue || 200}, 70%, 50%, 0.6)`,
                            color: `hsl(${p.hue || 200}, 80%, 60%)`
                          } as any}
                        >
                          {(() => {
                            const Icon = PARTY_ICONS.find(i => i.name === p.logoSymbol)?.icon || Users;
                            return <Icon size={20} />;
                          })()}
                        </div>
                        <div>
                          <h3 className="font-display text-sm uppercase tracking-widest text-white group-hover:text-primary transition-colors">{p.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[8px] font-mono-hud px-1.5 py-0.5 bg-primary/20 text-primary rounded">[{p.tag}]</span>
                            <span className="text-[8px] font-mono-hud text-muted-foreground uppercase">{p.ideology || "No Ideology"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 flex-1 space-y-4">
                      <p className="text-[10px] font-mono-hud text-muted-foreground leading-relaxed line-clamp-3">
                        {p.description || "No manifesto broadcasted for this faction."}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-primary/5">
                        <div className="flex flex-col gap-1">
                          <span className="text-[7px] font-mono-hud text-muted-foreground uppercase">Jurisdiction</span>
                          <span className="text-[9px] font-display text-primary truncate">
                            {app.galaxy.systems.flatMap(s => s.bodies).find(b => b.id === p.regionId)?.name || app.galaxy.systemById[p.regionId]?.name || "Unmapped"}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 text-right">
                          <span className="text-[7px] font-mono-hud text-muted-foreground uppercase">Establishment</span>
                          <span className="text-[9px] font-display text-white">{new Date(p.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-primary/5">
                      {app.userParty?.id === p.id ? (
                        <Button variant="ghost" disabled className="w-full h-9 text-[9px] uppercase tracking-widest opacity-50">
                          Current Faction
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => app.applyToParty(p.id)}
                          disabled={!!app.userParty}
                          className="w-full h-9 text-[9px] uppercase tracking-widest group-hover:bg-primary group-hover:text-background"
                        >
                          Submit Application
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "My Party" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {!app.userParty ? (
                <div className="max-w-2xl mx-auto py-12 space-y-8">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full border border-primary/20 flex items-center justify-center mb-6">
                      <Shield className="text-primary/40" size={40} />
                    </div>
                    <h2 className="font-display text-2xl text-white uppercase tracking-[0.2em]">Establish a New Order</h2>
                    <p className="font-mono-hud text-[11px] text-muted-foreground uppercase leading-relaxed max-w-md mx-auto">
                      Founding a political party requires 100 SC in registration fees and a clearly defined mandate.
                    </p>
                  </div>

                  {!isCreating ? (
                    <div className="flex flex-col items-center gap-6">
                      {app.body ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/20 rounded text-[9px] font-mono-hud text-primary uppercase tracking-widest">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                          Founding Location: <span className="text-white font-bold ml-1">{app.body.name}</span>
                        </div>
                      ) : (
                        <div className="px-4 py-2 bg-destructive/10 border border-destructive/30 rounded text-[9px] font-mono-hud text-destructive uppercase tracking-widest">
                          ⚠ Must be orbiting a planet or moon to found a faction
                        </div>
                      )}
                      <Button 
                        onClick={() => setIsCreating(true)}
                        disabled={!app.body}
                        className="h-14 px-12 text-xs uppercase tracking-widest font-display gap-3"
                      >
                        <Plus size={18} /> Found New Faction
                      </Button>
                      <p className="text-[9px] font-mono-hud text-muted-foreground uppercase italic tracking-tighter">
                        Cost: 100.00 SC · Status: {app.sc >= 100 ? "Authorized" : "Insufficient Funds"}
                      </p>
                    </div>
                  ) : (
                    <div className="hud-panel p-8 border border-primary/30 bg-primary/5 space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[9px] font-mono-hud text-primary uppercase">Faction Name</label>
                          <Input 
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g. CORE LOYALISTS"
                            className="bg-background/40 border-primary/20 font-display text-[11px] tracking-widest uppercase"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-mono-hud text-primary uppercase">Identity Tag (3-4 chars)</label>
                          <Input 
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="e.g. CORE"
                            maxLength={4}
                            className="bg-background/40 border-primary/20 font-display text-[11px] tracking-widest uppercase"
                          />
                        </div>
                        <div className="col-span-full space-y-2">
                          <label className="text-[9px] font-mono-hud text-primary uppercase">Ideology / Mandate</label>
                          <Input 
                            value={newIdeology}
                            onChange={(e) => setNewIdeology(e.target.value)}
                            placeholder="e.g. Techno-Feudalism"
                            className="bg-background/40 border-primary/20 font-display text-[11px] tracking-widest uppercase"
                          />
                        </div>
                        <div className="col-span-full space-y-2">
                          <label className="text-[9px] font-mono-hud text-primary uppercase">Faction Manifesto</label>
                          <Textarea 
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                            className="bg-background/40 border-primary/20 font-mono-hud text-[10px] h-32 leading-relaxed"
                          />
                        </div>

                        {/* Branding Customization */}
                        <div className="col-span-full space-y-6 pt-4 border-t border-primary/10">
                          <div className="flex flex-col sm:flex-row gap-8">
                            {/* Icon Selection */}
                            <div className="flex-1 space-y-4">
                              <label className="text-[9px] font-mono-hud text-primary uppercase">Faction Icon</label>
                              <div className="grid grid-cols-5 gap-2">
                                {PARTY_ICONS.map(item => (
                                  <button
                                    key={item.name}
                                    onClick={() => setSelectedSymbol(item.name)}
                                    className={`aspect-square rounded border flex items-center justify-center transition-all ${selectedSymbol === item.name ? 'bg-primary/20 border-primary shadow-[0_0_10px_hsl(var(--primary)/0.3)]' : 'bg-white/5 border-white/10 hover:border-white/30'}`}
                                  >
                                    <item.icon size={16} className={selectedSymbol === item.name ? 'text-primary' : 'text-muted-foreground'} />
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Color Selection */}
                            <div className="flex-1 space-y-4">
                              <label className="text-[9px] font-mono-hud text-primary uppercase">Faction Color Hue</label>
                              <div className="space-y-6">
                                <div className="h-10 rounded-lg border border-white/10 flex items-center justify-center overflow-hidden relative">
                                   <div className="absolute inset-0 opacity-20" style={{ backgroundColor: `hsl(${selectedHue}, 70%, 50%)` }} />
                                   <div className="relative z-10 flex items-center gap-3">
                                      {(() => {
                                        const Icon = PARTY_ICONS.find(i => i.name === selectedSymbol)?.icon || Shield;
                                        return <Icon size={20} style={{ color: `hsl(${selectedHue}, 80%, 60%)` }} />;
                                      })()}
                                      <span className="font-display text-xs uppercase tracking-widest" style={{ color: `hsl(${selectedHue}, 80%, 60%)` }}>
                                        {newName || "Preview"}
                                      </span>
                                   </div>
                                </div>
                                <div className="px-2">
                                  <Slider 
                                    value={[selectedHue]} 
                                    onValueChange={([v]) => setSelectedHue(v)}
                                    max={360}
                                    step={1}
                                    className="hue-slider"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4 pt-4">
                        <Button 
                          variant="ghost" 
                          onClick={() => setIsCreating(false)}
                          className="flex-1 h-12 text-[10px] uppercase tracking-widest"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleCreate}
                          className="flex-1 h-12 text-[10px] uppercase tracking-widest"
                        >
                          Confirm Establishment (-100 SC)
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Detailed Party View */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sidebar / Stats */}
                    <div className="space-y-6">
                      <div className="hud-panel p-6 border border-primary/30 bg-primary/10 text-center space-y-4">
                        <div 
                          className="w-24 h-24 mx-auto rounded border-2 flex items-center justify-center text-5xl text-glow shadow-[0_0_30px_rgba(var(--hue-rgb),0.2)]"
                          style={{ 
                            backgroundColor: `hsla(${app.userParty.hue || 200}, 70%, 20%, 0.4)`,
                            borderColor: `hsla(${app.userParty.hue || 200}, 70%, 50%, 0.8)`,
                            color: `hsl(${app.userParty.hue || 200}, 80%, 60%)`
                          } as any}
                        >
                          {(() => {
                            const Icon = PARTY_ICONS.find(i => i.name === app.userParty?.logoSymbol)?.icon || Users;
                            return <Icon size={48} />;
                          })()}
                        </div>
                        <div>
                          <h2 className="font-display text-xl text-white uppercase tracking-widest">{app.userParty.name}</h2>
                          <div className="flex items-center justify-center gap-2 mt-1">
                            <span className="text-[10px] font-mono-hud px-2 py-0.5 bg-primary/20 text-primary rounded">[{app.userParty.tag}]</span>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-primary/10 flex flex-col gap-1">
                          <span className="text-[8px] font-mono-hud text-muted-foreground uppercase">Ideology</span>
                          <span className="text-[10px] font-display text-primary uppercase tracking-wider">{app.userParty.ideology || "None Defined"}</span>
                        </div>
                      </div>

                      <div className="hud-panel p-6 border border-primary/20 bg-primary/5 space-y-4">
                         <h4 className="font-display text-[10px] text-primary uppercase tracking-[0.2em] mb-4">Financial Status</h4>
                         <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-mono-hud text-muted-foreground uppercase">Daily Wage</span>
                              <span className="text-[10px] font-display text-success">{app.userParty.dailyWage} SC</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-mono-hud text-muted-foreground uppercase">Establishment</span>
                              <span className="text-[10px] font-display text-white">{new Date(app.userParty.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-mono-hud text-muted-foreground uppercase">Base System</span>
                              <span className="text-[10px] font-display text-info">{app.galaxy.systemById[app.userParty.regionId]?.name || "Unknown"}</span>
                            </div>
                         </div>
                      </div>
                    </div>

                    {/* Main Feed / Management */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="hud-panel p-6 border border-primary/20 bg-primary/5">
                        <div className="flex items-center gap-3 mb-6">
                          <Plus className="text-primary" size={20} />
                          <h3 className="font-display text-xs uppercase tracking-[0.2em] text-primary">Manifesto</h3>
                        </div>
                        <p className="font-mono-hud text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {app.userParty.description || "The faction leadership has not yet published an official manifesto. Establish a clear political mandate to attract more followers."}
                        </p>
                      </div>

                      <div className="hud-panel p-6 border border-primary/20 bg-primary/5">
                        <div className="flex items-center gap-3 mb-6">
                          <Sparkles className="text-primary" size={20} />
                          <h3 className="font-display text-xs uppercase tracking-[0.2em] text-primary">Active Members</h3>
                        </div>
                        
                        <div className="space-y-3">
                          {/* We'd need to fetch actual members here, for now just show a placeholder */}
                          <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded group">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center text-primary">
                                <Shield size={16} />
                              </div>
                              <div>
                                <div className="text-[10px] font-display uppercase tracking-widest text-white">{app.playerName}</div>
                                <div className="text-[8px] font-mono-hud text-primary uppercase">{app.userPartyMember?.role}</div>
                              </div>
                            </div>
                            <div className="text-[9px] font-mono-hud text-muted-foreground uppercase">
                              Joined {app.userPartyMember ? new Date(app.userPartyMember.joinedAt).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>

                          <div className="py-8 text-center border border-dashed border-primary/10 rounded opacity-40">
                            <span className="text-[9px] font-mono-hud uppercase italic">Scanning for additional faction members...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
