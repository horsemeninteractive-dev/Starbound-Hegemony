import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Globe, Zap, Shield, Rocket, TrendingUp, Anchor, History, Factory, Award, Hexagon,
  ShieldAlert, Coins, Newspaper, Sparkles, User as UserIcon, Users as UsersIcon,
  Settings, Check
} from "lucide-react";
import { GalaxyIcon } from "./ResourceIcon";
import { PartyView } from "./PartyView";
import { type GalaxyApp } from "@/galaxy/useGalaxyApp";
import { RESOURCE_META } from "@/galaxy/meta";
import { UserAvatar } from "./UserAvatar";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "./PageHeader";



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

export function ProfileView({ app, onPlayClick, isPublic = false }: { app: GalaxyApp; onPlayClick: () => void; isPublic?: boolean }) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(app.playerName);
  const [editAvatar, setEditAvatar] = useState(app.playerAvatar);
  const [targetProfile, setTargetProfile] = useState<{ 
    name: string; 
    avatar: string; 
    level: number; 
    id: string;
    partyName?: string;
    partyId?: string;
    residencyBodyId?: string;
    factoryCount?: number;
    exploredCount?: number;
    updatedAt?: string;
    createdAt?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [friendStatus, setFriendStatus] = useState<"none" | "pending_sent" | "pending_received" | "accepted">("none");
  const [friendsList, setFriendsList] = useState<any[]>([]);

  useEffect(() => {
    if (isPublic && app.viewedUserId) {
      const fetchProfile = async () => {
        setIsLoading(true);
        const { data } = await supabase.from('profiles').select('id, commander_name, avatar_url, level, updated_at, created_at').eq('id', app.viewedUserId).single();
        if (data) {
          const { data: party } = await supabase.from('party_members').select('parties(name)').eq('user_id', app.viewedUserId).maybeSingle();
          const { data: residency } = await supabase.from('residencies').select('body_id').eq('user_id', app.viewedUserId).maybeSingle();
          const { count: factoryCount } = await supabase.from('factories').select('*', { count: 'exact', head: true }).eq('owner_id', app.viewedUserId);
          const { count: exploredCount } = await supabase.from('exploration_logs').select('*', { count: 'exact', head: true }).eq('user_id', app.viewedUserId);

          setTargetProfile({
            id: data.id,
            name: data.commander_name,
            avatar: data.avatar_url,
            level: data.level,
            updatedAt: data.updated_at,
            createdAt: data.created_at,
            partyName: (party?.parties as any)?.name,
            partyId: (party?.parties as any)?.id,
            residencyBodyId: residency?.body_id,
            factoryCount: factoryCount || 0,
            exploredCount: exploredCount || 0
          });
          
          // Check friendship
          if (app.user) {
            const { data: friendship } = await supabase
              .from('friendships')
              .select('*')
              .or(`and(user_id.eq.${app.user.id},friend_id.eq.${data.id}),and(user_id.eq.${data.id},friend_id.eq.${app.user.id})`)
              .single();
            
            if (friendship) {
              if (friendship.status === 'accepted') setFriendStatus('accepted');
              else if (friendship.user_id === app.user.id) setFriendStatus('pending_sent');
              else setFriendStatus('pending_received');
            } else {
              setFriendStatus('none');
            }
          }
        }
        setIsLoading(false);
      };
      fetchProfile();
    } else if (!isPublic && app.user) {
      // Load my friends
      const fetchFriends = async () => {
        const { data } = await supabase
          .from('friendships')
          .select('*, friend:friend_id(id, commander_name, avatar_url, level), requester:user_id(id, commander_name, avatar_url, level)')
          .or(`user_id.eq.${app.user!.id},friend_id.eq.${app.user!.id}`);
        
        if (data) {
          const list = data.map((f: any) => {
            const other = f.user_id === app.user!.id ? f.friend : f.requester;
            return { ...other, status: f.status, isRequester: f.user_id === app.user!.id };
          });
          setFriendsList(list);
        }
      };
      fetchFriends();
    }
  }, [isPublic, app.viewedUserId, app.user]);

  const handleAddFriend = async () => {
    if (!app.user || !targetProfile || app.user.id === targetProfile.id) return;
    const { error } = await supabase.from('friendships').insert({
      user_id: app.user.id,
      friend_id: targetProfile.id,
      status: 'pending'
    });
    if (!error) setFriendStatus('pending_sent');
  };

  const handleAcceptFriend = async (requesterId: string) => {
    if (!app.user) return;
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .match({ user_id: requesterId, friend_id: app.user.id });
    
    if (!error) {
      if (isPublic) setFriendStatus('accepted');
      else {
        setFriendsList(prev => prev.map(f => f.id === requesterId ? { ...f, status: 'accepted' } : f));
      }
    }
  };

  const displayUser = isPublic && targetProfile ? targetProfile : {
    name: app.playerName,
    avatar: app.playerAvatar,
    level: app.playerLevel
  };
  
  const TABS = [
    { label: "Overview", icon: UserIcon },
    { label: "Friends", icon: UsersIcon },
    { label: "Assets", icon: Coins, restricted: true },
    { label: "Political", icon: Shield, restricted: true },
    { label: "Reputation", icon: UsersIcon, restricted: true },
    { label: "Logbook", icon: Newspaper, restricted: true },
  ].filter(t => !isPublic || !t.restricted);

  return (
    <div className="flex-1 flex flex-col bg-background/40 backdrop-blur-sm animate-fade-in overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none scanline opacity-10" />
      
      <PageHeader 
        title={
          <div className="flex items-center gap-3 md:gap-6">
            <UserAvatar 
              avatarUrl={displayUser.avatar} 
              level={displayUser.level}
              partyIcon={isPublic ? undefined : app.playerPartyIcon}
              partyHue={isPublic ? undefined : app.playerPartyHue}
              size={window.innerWidth < 640 ? "sm" : "xl"}
            />
            <div className="flex flex-col text-left min-w-0 flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <input 
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="bg-background/50 border border-primary/30 rounded px-2 py-1 font-display text-sm md:text-xl text-primary uppercase w-full max-w-md focus:border-primary outline-none"
                    placeholder="Commander Name"
                  />
                  <div className="flex flex-col gap-1">
                    <span className="font-mono-hud text-[8px] text-muted-foreground uppercase">Avatar Uplink URL</span>
                    <input 
                      value={editAvatar}
                      onChange={e => setEditAvatar(e.target.value)}
                      className="bg-background/50 border border-primary/30 rounded px-2 py-1 font-mono-hud text-[8px] md:text-[10px] text-muted-foreground w-full max-w-md focus:border-primary outline-none"
                      placeholder="Neural Identity (Image URL)"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="font-display text-base md:text-3xl text-primary text-glow uppercase tracking-wider truncate leading-tight">
                    {displayUser.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-primary/10 border border-primary/20 rounded">
                      <Award className="w-2 h-2 md:w-3 md:h-3 text-primary" />
                      <span className="font-mono-hud text-[7px] md:text-[8px] uppercase text-primary">LVL {displayUser.level}</span>
                    </div>
                    <p className="font-mono-hud text-[7px] md:text-xs text-muted-foreground uppercase tracking-widest">
                      {isPublic ? "Foreign Commander" : "Hegemony Commander"}
                    </p>
                    {isPublic && (
                      <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-warning/10 border border-warning/20 rounded">
                        <ShieldAlert className="w-2 h-2 md:w-3 md:h-3 text-warning" />
                        <span className="font-mono-hud text-[7px] md:text-[8px] uppercase text-warning">Encrypted</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        }
        subtitle={null}
        onBack={() => app.setPage("map")}
        actions={
          <div className="flex items-center gap-2">
            {!isPublic && (
              <>
                {isEditing && (
                  <Button 
                    onClick={() => setIsEditing(false)}
                    size="sm"
                    variant="ghost"
                    className="text-[10px] font-bold uppercase tracking-widest rounded text-muted-foreground hover:text-white"
                  >
                    Cancel
                  </Button>
                )}
                <Button 
                  onClick={() => {
                    if (isEditing) {
                      app.updateProfile && app.updateProfile(editName, editAvatar);
                      setIsEditing(false);
                    } else {
                      setEditName(app.playerName);
                      setEditAvatar(app.playerAvatar);
                      setIsEditing(true);
                    }
                  }}
                  size="sm"
                  variant="outline"
                  className="text-[10px] font-bold uppercase tracking-widest rounded flex items-center gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                >
                  {isEditing ? <Check size={12} /> : <Settings size={12} />} {isEditing ? "Save Identity" : "Edit Identity"}
                </Button>
              </>
            )}
            
            {isPublic && app.userPartyMember && (app.userPartyMember.role === 'head' || app.userPartyMember.role === 'officer') && targetProfile && targetProfile.id !== app.user?.id && targetProfile.partyName !== app.userParty?.name && (
              <Button 
                onClick={() => targetProfile && app.inviteToParty && app.inviteToParty(targetProfile.id)}
                size="sm"
                variant="outline"
                className="text-[10px] font-bold uppercase tracking-widest rounded flex items-center gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
              >
                <Rocket size={12} /> Invite to Faction
              </Button>
            )}
            
            {isPublic && friendStatus === 'none' && targetProfile && targetProfile.id !== app.user?.id ? (
              <Button 
                onClick={handleAddFriend}
                size="sm"
                className="bg-primary text-background font-display text-[10px] font-bold uppercase tracking-widest rounded hover:bg-primary/80 transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]"
              >
                <UsersIcon size={12} /> Add Friend
              </Button>
            ) : isPublic && friendStatus === 'pending_received' ? (
              <Button 
                onClick={() => targetProfile && handleAcceptFriend(targetProfile.id)}
                size="sm"
                className="bg-success text-background font-display text-[10px] font-bold uppercase tracking-widest rounded hover:bg-success/80 transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(var(--success-rgb),0.3)]"
              >
                <UsersIcon size={12} /> Accept Request
              </Button>
            ) : isPublic && friendStatus === 'pending_sent' ? (
               <div className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary/60 font-display text-[10px] font-bold uppercase tracking-widest rounded flex items-center gap-2">
                  <Sparkles size={12} /> Friend Request Sent
               </div>
            ) : isPublic && friendStatus === 'accepted' ? (
               <div className="px-3 py-1 bg-success/10 border border-success/20 text-success font-display text-[10px] font-bold uppercase tracking-widest rounded flex items-center gap-2">
                  <Shield size={12} /> Trusted Contact
               </div>
            ) : null}
          </div>
        }
        bottom={
          <div className="bg-background/20 px-4 py-2 md:px-8 border-t border-primary/10">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
              <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.label}
                      onClick={() => {
                        setActiveTab(tab.label);
                        onPlayClick();
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded transition-all whitespace-nowrap ${
                        activeTab === tab.label 
                          ? "bg-primary/20 text-primary border border-primary/40 shadow-[inset_0_0_10px_hsl(var(--primary)/0.1)]" 
                          : "text-muted-foreground hover:text-primary hover:bg-primary/5 border border-transparent"
                      }`}
                    >
                      <Icon size={window.innerWidth < 640 ? 12 : 14} />
                      <span className="font-display text-[9px] md:text-[10px] uppercase tracking-widest">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              {!isPublic && (
                <div className="hidden md:flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="font-mono-hud text-[8px] text-muted-foreground uppercase">Commander Net Worth</span>
                    <span className="font-display text-sm text-warning tracking-widest">{Math.floor(app.sc).toLocaleString()} SC</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        }
      />

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Profile Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar relative z-10">
          <div className="max-w-6xl mx-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="w-full">
                {isPublic && (
                  <div className="mb-8 p-3 bg-primary/5 border border-primary/20 rounded flex items-center gap-3">
                    <ShieldAlert className="text-warning shrink-0" size={16} />
                    <div className="flex flex-col">
                       <span className="font-display text-[9px] text-primary uppercase tracking-widest">Public Archive Access</span>
                       <span className="font-mono-hud text-[7px] text-muted-foreground uppercase tracking-tighter">Sensitive data restricted by Hegemony Privacy Protocol</span>
                    </div>
                  </div>
                )}
            {activeTab === "Overview" && (
              <div className="space-y-6 sm:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard label="Action Potential" value={isPublic ? "REDACTED" : Math.floor(app.ap)} unit="AP" icon={Zap} color="primary" />
                  <StatCard label="Total Net Worth" value={isPublic ? "REDACTED" : Math.floor(app.sc).toLocaleString()} unit="SC" icon={Coins} color="warning" />
                  <StatCard label="Void Tokens" value={isPublic ? "REDACTED" : 0} unit="VT" icon={Hexagon} color="purple" />
                  <StatCard label="Systems Discovered" value={isPublic ? (targetProfile?.exploredCount || "???") : app.exploredSystemIds.size} unit="SYS" icon={Globe} color="success" />
                  <StatCard label="Active Fleets" value={isPublic ? "???" : app.fleetCount} unit="FLT" icon={Rocket} color="primary" />
                  <StatCard label="Industrial Sites" value={isPublic ? (targetProfile?.factoryCount || 0) : (app.userFactories?.length || 0)} unit="FAC" icon={Factory} color="cyan" />
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
                        <span className="font-mono-hud text-[10px] text-muted-foreground uppercase">Party Affiliation</span>
                        <button 
                          onClick={() => {
                            if (!isPublic) {
                              app.setPage("political");
                            } else if (targetProfile?.partyName) {
                              // If public, we might want to go to political and filter
                              app.setPage("political");
                            }
                          }}
                          className={`font-display text-[10px] uppercase tracking-widest px-2 py-0.5 border rounded transition-all ${
                            (isPublic ? targetProfile?.partyName : app.userParty?.name) 
                              ? "text-primary border-primary/40 hover:bg-primary/10 hover:border-primary cursor-pointer" 
                              : "text-muted-foreground border-muted-foreground/20 cursor-default"
                          }`}
                        >
                          {isPublic ? (targetProfile?.partyName || "Independent") : (app.userParty?.name || "Independent")}
                        </button>
                      </div>
                      <div className="flex justify-between items-center bg-background/20 p-3 rounded">
                        <span className="font-mono-hud text-[10px] text-muted-foreground uppercase">Planet Residency</span>
                        <span className="font-display text-[10px] text-primary uppercase tracking-widest px-2 py-0.5 border border-primary/40 rounded">
                          {isPublic ? (targetProfile?.residencyBodyId || "None") : (app.userResidency?.bodyId || "None")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-background/20 p-3 rounded">
                        <span className="font-mono-hud text-[10px] text-muted-foreground uppercase">Last Active</span>
                        <span className="font-display text-[10px] text-warning uppercase">
                          {isPublic ? (targetProfile?.updatedAt ? new Date(targetProfile.updatedAt).toLocaleDateString() : "Unknown") : new Date().toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-background/20 p-3 rounded">
                        <span className="font-mono-hud text-[10px] text-muted-foreground uppercase">Service Began</span>
                        <span className="font-display text-[10px] text-primary uppercase">
                          {isPublic ? (targetProfile?.createdAt ? new Date(targetProfile.createdAt).toLocaleDateString() : "Unknown") : (app.user?.created_at ? new Date(app.user.created_at).toLocaleDateString() : "Classified")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="hud-panel p-6 border border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-3 mb-6">
                      <TrendingUp className="text-primary" size={20} />
                      <h3 className="font-display text-xs uppercase tracking-[0.2em] text-primary">Asset Distribution</h3>
                    </div>
                    <div className="space-y-4">
                      {[
                        { label: "Fleet Command", count: isPublic ? "???" : app.fleetCount, icon: Rocket, color: "text-primary" },
                        { label: "Industrial Hubs", count: isPublic ? (targetProfile?.factoryCount || 0) : (app.userFactories?.length || 0), icon: Factory, color: "text-cyan-400" },
                        { label: "Exploration Log", count: isPublic ? (targetProfile?.exploredCount || "???") : app.exploredSystemIds.size, icon: Globe, color: "text-success" }
                      ].map((asset, i) => (
                        <div key={i} className="flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <asset.icon size={14} className={asset.color} />
                            <span className="font-mono-hud text-[10px] text-muted-foreground uppercase group-hover:text-foreground transition-colors">{asset.label}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className={`font-display text-xs ${asset.color} text-glow`}>{asset.count}</span>
                            <div className="w-20 h-0.5 bg-background mt-1 rounded-full overflow-hidden">
                              <div 
                                className={`h-full bg-current ${asset.color}`} 
                                style={{ width: typeof asset.count === 'number' ? `${Math.min(100, (asset.count / 10) * 100)}%` : '0%' }} 
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 pt-4 border-t border-primary/5 flex justify-between">
                       <span className="font-mono-hud text-[7px] text-muted-foreground uppercase">Neural Link Sync Status</span>
                       <span className="font-mono-hud text-[7px] text-success uppercase">Optimal</span>
                    </div>
                  </div>
                </div>

                {/* Career Timeline */}
                {!isPublic && (
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
                )}
              </div>
            )}

            {activeTab === "Friends" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between border-b border-primary/20 pb-4">
                  <div>
                    <h3 className="font-display text-lg uppercase tracking-widest text-primary">Communications Network</h3>
                    <p className="font-mono-hud text-[10px] text-muted-foreground uppercase mt-1">Direct Neural Links & Contacts</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {friendsList.length === 0 && (
                    <div className="col-span-full py-20 text-center border border-dashed border-primary/10 rounded">
                      <UsersIcon size={40} className="mx-auto text-primary/10 mb-4" />
                      <p className="font-display text-[10px] text-muted-foreground uppercase tracking-widest">No social links established</p>
                      <p className="font-mono-hud text-[8px] text-muted-foreground/50 mt-2">Search for other commanders in the archives to add them.</p>
                    </div>
                  )}
                  {friendsList.map(friend => (
                    <div key={friend.id} className="hud-panel p-4 border border-primary/20 bg-primary/5 flex items-center gap-4 group hover:border-primary/40 transition-all">
                      <UserAvatar avatarUrl={friend.avatar_url} level={friend.level} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-display text-sm uppercase tracking-widest text-foreground group-hover:text-primary transition-colors truncate">{friend.commander_name}</span>
                          <span className="font-mono-hud text-[8px] text-muted-foreground uppercase">LVL {friend.level}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {friend.status === 'accepted' ? (
                            <span className="text-[7px] font-mono-hud text-success uppercase tracking-tighter bg-success/10 px-1.5 py-0.5 rounded border border-success/20">ESTABLISHED</span>
                          ) : (
                            <span className="text-[7px] font-mono-hud text-warning uppercase tracking-tighter bg-warning/10 px-1.5 py-0.5 rounded border border-warning/20">
                              {friend.isRequester ? "REQUEST SENT" : "PENDING ACCEPTANCE"}
                            </span>
                          )}
                          {!friend.isRequester && friend.status === 'pending' && (
                            <button 
                              onClick={() => handleAcceptFriend(friend.id)}
                              className="text-[7px] font-mono-hud text-primary hover:text-white uppercase tracking-tighter bg-primary/20 hover:bg-primary px-1.5 py-0.5 rounded transition-all"
                            >
                              ACCEPT
                            </button>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={() => app.navigateToPublicProfile(friend.id)}
                        className="p-2 text-primary/40 hover:text-primary transition-colors"
                        title="View Profile"
                      >
                        <TrendingUp size={16} />
                      </button>
                    </div>
                  ))}
                </div>
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
                      <span className="font-mono-hud text-[10px] uppercase text-muted-foreground">Global Cargo Hold</span>
                      <span className="font-display text-xs text-info">
                        {app.userResources?.reduce((sum, r) => sum + r.amount, 0) || 0} / {(app.userVessels ?? []).reduce((sum, v) => sum + (v.cargoCapacity || 0), 0) || app.cargoCapacity}
                      </span>
                    </div>
                  </div>
                  
                  <div className="h-1 bg-primary/10 rounded-full overflow-hidden w-full">
                    <div 
                      className={`h-full transition-all ${(app.userResources?.reduce((sum, r) => sum + r.amount, 0) || 0) >= ((app.userVessels ?? []).reduce((sum, v) => sum + (v.cargoCapacity || 0), 0) || app.cargoCapacity) ? 'bg-warning' : 'bg-info'}`}
                      style={{ width: `${Math.min(100, ((app.userResources?.reduce((sum, r) => sum + r.amount, 0) || 0) / ((app.userVessels ?? []).reduce((sum, v) => sum + (v.cargoCapacity || 0), 0) || app.cargoCapacity)) * 100)}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {(() => {
                      const aggregated = (app.userResources ?? []).reduce((acc: Record<string, number>, r) => {
                        acc[r.resourceType] = (acc[r.resourceType] || 0) + r.amount;
                        return acc;
                      }, {});
                      return Object.entries(aggregated).map(([type, amount]) => {
                        const meta = (RESOURCE_META as any)[type];
                        return (
                          <div key={type} className="hud-panel p-3 border border-primary/10 bg-primary/5 flex flex-col items-center text-center group hover:border-primary/30 transition-all">
                            <div className="mb-2 group-hover:scale-110 transition-all" style={{ color: meta?.color || 'hsl(var(--primary))' }}>
                              <GalaxyIcon name={meta?.icon} className="w-6 h-6" />
                            </div>
                            <span className="font-mono-hud text-[8px] text-primary/60 uppercase truncate w-full">{type}</span>
                            <span className="font-display text-xs text-foreground mt-1">{amount.toLocaleString()}</span>
                          </div>
                        );
                      });
                    })()}
                    {(!app.userResources || app.userResources.length === 0) && (
                      <div className="col-span-full py-8 text-center border border-dashed border-primary/10 rounded">
                        <span className="font-mono-hud text-[10px] text-muted-foreground uppercase italic">Cargo bay empty</span>
                      </div>
                    )}
                  </div>

                  {/* Fleet Cargo Breakdown */}
                  <div className="space-y-4 mt-8">
                    <div className="flex items-center gap-4">
                      <div className="h-px w-8 bg-primary/20" />
                      <h3 className="font-display text-sm uppercase tracking-[0.3em] text-primary/60">Fleet Cargo Breakdown</h3>
                      <div className="h-px flex-1 bg-primary/20" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {(app.userFleets ?? []).map(f => {
                         const fleetVessels = (app.userVessels ?? []).filter(v => f.vesselIds?.includes(v.id));
                         const fleetCapacity = fleetVessels.reduce((sum, v) => sum + (v.cargoCapacity || 0), 0);
                         const fleetResources = (app.userResources ?? []).filter(r => r.fleetId === f.id);
                         const fleetCargoUsed = fleetResources.reduce((sum, r) => sum + r.amount, 0);

                         return (
                           <div key={f.id} className="hud-panel p-4 border border-primary/10 bg-primary/5">
                             <div className="flex justify-between items-center mb-2">
                               <span className="font-display text-xs uppercase tracking-widest">{f.name}</span>
                               <span className={`font-mono-hud text-[9px] ${fleetCargoUsed >= fleetCapacity ? 'text-error' : 'text-info'}`}>
                                 {fleetCargoUsed} / {fleetCapacity}
                               </span>
                             </div>
                             <div className="space-y-1">
                               {fleetResources.map(r => (
                                 <div key={r.resourceType} className="flex justify-between text-[8px] uppercase font-mono-hud text-muted-foreground">
                                   <span>{r.resourceType}</span>
                                   <span className="text-foreground">{r.amount.toLocaleString()}</span>
                                 </div>
                               ))}
                               {fleetResources.length === 0 && (
                                 <div className="text-[8px] font-mono-hud text-muted-foreground italic uppercase">Empty</div>
                               )}
                             </div>
                           </div>
                         );
                       })}
                    </div>
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
        )}
        </div>
      </main>
    </div>
  </div>
);
}
