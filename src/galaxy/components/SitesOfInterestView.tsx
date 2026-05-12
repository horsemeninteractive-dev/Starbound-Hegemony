import React from 'react';
import { Activity, Zap, Search, Clock, CheckCircle2, XCircle, AlertTriangle, FlaskConical, Award, Coins, Box, Star } from 'lucide-react';
import type { SiteOfInterest, SurveyMission, SiteTier, Vessel, FleetEntity } from '../types';
import { SITE_TIERS } from '../meta';

interface SitesOfInterestViewProps {
  bodyId: string;
  sites: SiteOfInterest[];
  missions: SurveyMission[];
  userVessels: Vessel[];
  userFleets: FleetEntity[];
  onAssignMission: (siteId: string, vesselId: string) => Promise<void>;
  onCollectReward: (missionId: string) => Promise<void>;
  onAbandonMission: (missionId: string) => Promise<void>;
  currentTime: number;
}

export const SitesOfInterestView: React.FC<SitesOfInterestViewProps> = ({
  bodyId,
  sites,
  missions,
  userVessels,
  userFleets,
  onAssignMission,
  onCollectReward,
  onAbandonMission,
  currentTime
}) => {
  const bodySites = sites.filter(s => s.bodyId === bodyId);
  const bodyMissions = missions.filter(m => bodySites.some(s => s.id === m.siteId));

  if (bodySites.length === 0) return null;

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center gap-2 mb-2">
        <Search size={14} className="text-primary" />
        <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest">Anomalies Detected</h3>
      </div>

      <div className="space-y-3">
        {bodySites.map(site => {
          const mission = missions.find(m => m.siteId === site.id);
          const tierInfo = SITE_TIERS[site.tier];
          const expiresAt = new Date(site.expiresAt).getTime();
          const timeLeft = Math.max(0, Math.floor((expiresAt - currentTime) / 1000));
          
          return (
            <div key={site.id} className="bg-primary/5 border border-primary/10 rounded overflow-hidden">
              {/* Header */}
              <div className="p-2 border-b border-primary/10 flex items-center justify-between bg-primary/10">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${tierInfo.color.replace('text-', 'bg-')}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${tierInfo.color}`}>{tierInfo.label}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-mono-hud text-muted-foreground">
                  <Clock size={10} />
                  <span>{formatTime(timeLeft)}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-[8px] text-muted-foreground uppercase font-mono-hud">Research Effort</div>
                    <div className="text-[10px] font-bold text-foreground">{tierInfo.researchHours}h Man-Hours</div>
                  </div>
                  <div className="space-y-1 text-right">
                    <div className="text-[8px] text-muted-foreground uppercase font-mono-hud">Risk Factor</div>
                    <div className="text-[10px] font-bold text-error">{(100 - tierInfo.successRate * 100).toFixed(0)}% Hazard</div>
                  </div>
                </div>

                {/* Mission Status */}
                {mission ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono-hud uppercase text-muted-foreground">Status: {mission.status}</span>
                      {mission.status === 'researching' && (
                        <span className="text-[9px] font-mono-hud text-primary">
                          {Math.max(0, Math.ceil((new Date(mission.completesAt).getTime() - currentTime) / 1000))}s remaining
                        </span>
                      )}
                    </div>

                    {mission.status === 'researching' && (
                      <div className="h-1 w-full bg-primary/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary animate-pulse" 
                          style={{ 
                            width: `${Math.min(100, ((currentTime - new Date(mission.startedAt).getTime()) / (new Date(mission.completesAt).getTime() - new Date(mission.startedAt).getTime())) * 100)}%` 
                          }} 
                        />
                      </div>
                    )}

                    {mission.status === 'succeeded' && !mission.rewardClaimed && (
                      <button
                        onClick={() => onCollectReward(mission.id)}
                        className="w-full py-2 bg-success/20 border border-success/40 text-success font-bold text-[9px] tracking-widest rounded hover:bg-success/30 transition-all flex items-center justify-center gap-2"
                      >
                        <Award size={12} />
                        COLLECT SCIENTIFIC DATA
                      </button>
                    )}

                    {mission.status === 'failed' && (
                      <div className="p-2 bg-error/10 border border-error/20 rounded flex items-center gap-2">
                        <XCircle size={14} className="text-error" />
                        <span className="text-[9px] text-error font-bold uppercase">Expedition Lost</span>
                      </div>
                    )}

                    {(mission.status === 'traveling' || mission.status === 'researching') && (
                      <button
                        onClick={() => onAbandonMission(mission.id)}
                        className="w-full py-1 text-[8px] text-muted-foreground hover:text-error transition-colors uppercase tracking-widest"
                      >
                        Abort Mission
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[9px] text-muted-foreground italic leading-tight">
                      Orbital scanning has revealed an anomaly. A scientific vessel is required to conduct a detailed survey.
                    </p>
                    
                    {/* Vessel Selector */}
                    <div className="space-y-1.5">
                      <div className="text-[8px] text-muted-foreground uppercase font-mono-hud pl-1">Available Science Vessels</div>
                      {userVessels
                        .filter(v => {
                          const fleet = (userFleets || []).find(f => f.id === v.fleetId);
                          const bid = fleet ? fleet.bodyId : v.bodyId;
                          // Commander ships should not be able to research SoIs
                          return v.class === 'science' && bid === bodyId && (v.status === 'idle' || v.status === 'active');
                        })
                        .map(vessel => (
                          <button
                            key={vessel.id}
                            onClick={() => onAssignMission(site.id, vessel.id)}
                            className="w-full p-2 bg-primary/10 border border-primary/20 hover:bg-primary/20 rounded flex items-center justify-between group transition-all"
                          >
                            <div className="flex items-center gap-2">
                              <FlaskConical size={12} className="text-primary group-hover:scale-110 transition-transform" />
                              <span className="text-[10px] font-bold text-foreground">{vessel.name}</span>
                            </div>
                            <span className="text-[9px] font-mono-hud text-primary/60 border-l border-primary/20 pl-2">DEPLOY</span>
                          </button>
                        ))}
                      
                      {userVessels.filter(v => {
                        const fleet = (userFleets || []).find(f => f.id === v.fleetId);
                        const bid = fleet ? fleet.bodyId : v.bodyId;
                        return v.class === 'science' && bid === bodyId && v.status === 'idle';
                      }).length === 0 && (
                        <div className="p-2 border border-dashed border-primary/20 rounded text-center">
                          <span className="text-[8px] text-muted-foreground uppercase tracking-widest">No Science Vessels in Orbit</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Rewards Preview */}
              <div className="px-3 py-1.5 bg-primary/5 border-t border-primary/10 flex items-center gap-3">
                <span className="text-[8px] text-muted-foreground uppercase font-mono-hud">Potential:</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-[9px] text-primary">
                    <Activity size={10} />
                    <span>XP</span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-success">
                    <Coins size={10} />
                    <span>SC</span>
                  </div>
                  {site.tier === 'precursor' && (
                    <div className="flex items-center gap-1 text-[9px] text-accent">
                      <Star size={10} className="fill-accent" />
                      <span>LEGACY</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
function formatTime(seconds: number): string {
  if (seconds <= 0) return "EXPIRED";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m ${seconds % 60}s`;
}
