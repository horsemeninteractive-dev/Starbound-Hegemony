// Central UI state for the map app. Galaxy data is generated once (deterministic).

import { useMemo, useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { generateGalaxy } from "./generate";
import type { Galaxy, Empire, StarSystem, Body, ContestState, EconomicStatus, StarType, PlanetSubtype, Installation, BodyResource, UserResource, FactoryWorker, MarketListing, Party, PartyMember, PartyRole, Residency, ResidencyApplication, StateElection, StateVote, StateFormationVote, ElectionCandidate, MinisterialAssignment, PlayerEmpire } from "./types";
import { STAR_META, CONTEST_META, ECON_META, BODY_META, STAR_BASE_SIZE, getOrbitalSpeed, getBodyPosition, RESOURCE_META, RICHNESS_VALUES, T2_RESOURCES, T3_RESOURCES } from "./meta";
import { ShipConfiguration, DEFAULT_SHIP_CONFIG } from "./shipPresets";

export type ViewMode = "galaxy" | "system" | "body" | "ship";
export type DisplayLayer = "hyperlanes" | "sectorBorders" | "sectorLabels" | "objectLabels" | "habitableZones" | "orbitPaths" | "weatherSystems" | "cityLights" | "empireColors";

export interface FilterState {
  contest: Set<ContestState>;
  economy: Set<EconomicStatus>;
  starType: Set<StarType>;
  layers: Set<DisplayLayer>;
}

const ALL_CONTEST: ContestState[] = ["controlled", "contested", "anarchic", "frontier"];
const ALL_ECON: EconomicStatus[] = ["boom", "stable", "recession", "blockaded", "untapped"];
const ALL_STAR: StarType[] = ["O", "B", "A", "F", "G", "K", "M", "whitedwarf", "neutron", "pulsar", "binary", "trinary", "blackhole", "whitehole", "magnetar", "protostar", "dyson_swarm"];
const ALL_LAYERS: DisplayLayer[] = ["hyperlanes", "sectorBorders", "sectorLabels", "objectLabels", "habitableZones", "orbitPaths", "weatherSystems", "cityLights", "empireColors"];

import avatar from "@/assets/avatar.png";
import avatar_alt1 from "@/assets/avatar_alt1.png";
import avatar_alt2 from "@/assets/avatar_alt2.png";

import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { computeSkillBonus, SKILL_TREE, XP_REWARDS } from "./skills";
import type { XPReason } from "./skills";

export function useGalaxyApp(initialSeed = 20260423) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const [vesselId, setVesselId] = useState<string | null>(null);
  const [otherPlayers, setOtherPlayers] = useState<any[]>([]);

  // Bake in a universal galaxy seed so all players see the exact same universe
  const UNIVERSAL_SEED = 20260423;
  const galaxy: Galaxy = useMemo(() => generateGalaxy(UNIVERSAL_SEED), []);


  const [view, setView] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("view") as ViewMode;
    if (saved === "galaxy" || saved === "system") return saved;
    return "galaxy";
  });
  const [playerSystemId, setPlayerSystemId] = useState<string>(() => {
    const saved = localStorage.getItem("playerSystemId");
    if (saved && galaxy.systemById[saved]) return saved;
    return Object.keys(galaxy.systemById)[0] || "sys-center";
  });
  const [playerBodyId, setPlayerBodyId] = useState<string>(
    () => localStorage.getItem("playerBodyId") ?? "star"
  );
  const [exploredSystemIds, setExploredSystemIds] = useState<Set<string>>(
    () => new Set(JSON.parse(localStorage.getItem("exploredIds") ?? '["sys-center"]'))
  );
  const [exploredBodyIds, setExploredBodyIds] = useState<Set<string>>(
    () => new Set(JSON.parse(localStorage.getItem("exploredBodyIds") ?? '["sys-center:star"]'))
  );
  const [fogOfWar, setFogOfWarState] = useState(() => localStorage.getItem("fogOfWar") !== "false");
  const [instantJump, setInstantJumpState] = useState(() => localStorage.getItem("instantJump") === "true");
  
  const [travel, setTravel] = useState<{ 
    targetId: string; 
    startTime: number; 
    endTime: number; 
    type?: "inter" | "intra";
    startPos?: { x: number; z: number }; // Relative to system center
  } | null>(() => {
    const saved = localStorage.getItem("travel");
    return saved ? JSON.parse(saved) : null;
  });
  const [arrival, setArrival] = useState<{ fromId: string; startTime: number; duration: number } | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const [ap, setAp] = useState(() => Number(localStorage.getItem("ap") ?? 240));
  const [sc, setSc] = useState(() => Number(localStorage.getItem("sc") ?? 15000));

  const [playerName, setPlayerName] = useState(() => localStorage.getItem("playerName") ?? "Majora");
  const [playerLevel, setPlayerLevel] = useState(() => Number(localStorage.getItem("playerLevel") ?? 1));
  const [playerXP, setPlayerXP] = useState(() => Number(localStorage.getItem("playerXP") ?? 0));
  const [playerAvatar, setPlayerAvatar] = useState(() => localStorage.getItem("playerAvatar") ?? avatar);
  const [shipConfig, setShipConfig] = useState<ShipConfiguration>(() => {
    const saved = localStorage.getItem("shipConfig");
    return saved ? JSON.parse(saved) : DEFAULT_SHIP_CONFIG;
  });
  const [page, setPage] = useState<"map" | "profile" | "articles" | "market" | "factories" | "fleets" | "party" | "skills" | "shipyard" | "empire">("map");
  const [selectedEmpireId, setSelectedEmpireId] = useState<string | null>(null);
  const [systemId, setSystemId] = useState<string | null>(() => localStorage.getItem("systemId"));
  const [bodyId, setBodyId] = useState<string | null>(() => localStorage.getItem("bodyId"));
  const [hoverSystemId, setHoverSystemId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  
  const [userResidency, setUserResidency] = useState<Residency | null>(null);
  const [residencyApplications, setResidencyApplications] = useState<ResidencyApplication[]>([]);
  const [activeElections, setActiveElections] = useState<StateElection[]>([]);
  const [userVotes, setUserVotes] = useState<StateVote[]>([]);
  const [playerEmpires, setPlayerEmpires] = useState<Empire[]>([]);
  const [bodyGovernance, setBodyGovernance] = useState<Record<string, { status: string, electionEndTime: string | null, formationReferendumId?: string | null, empireId?: string | null }>>({});
  const [formationReferendums, setFormationReferendums] = useState<StateFormationVote[]>([]);
  const [userFormationBallots, setUserFormationBallots] = useState<Record<string, 'yes' | 'no'>>({});
  const [playerEmpiresFull, setPlayerEmpiresFull] = useState<PlayerEmpire[]>([]);
  const [electionCandidates, setElectionCandidates] = useState<ElectionCandidate[]>([]);
  const [electionBallots, setElectionBallots] = useState<Record<string, string>>({});  // electionId -> candidateId voted for
  const [ministerialAssignments, setMinisterialAssignments] = useState<MinisterialAssignment[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, { name: string; avatar: string }>>({});
  const [playerPartyIcon, setPlayerPartyIcon] = useState<string | undefined>();
  const [playerPartyHue, setPlayerPartyHue] = useState<number | undefined>();
  const [playerSkills, setPlayerSkills] = useState<string[]>([]); // unlocked skill IDs

  const [socialStats, setSocialStats] = useState({
    upvotesReceived: 0,
    downvotesReceived: 0,
    upvotesGiven: 0,
    downvotesGiven: 0
  });
  
  const [audioEnabled, setAudioEnabled] = useState(() => localStorage.getItem("audioEnabled") !== "false");
  const [musicVolume, setMusicVolume] = useState(() => Number(localStorage.getItem("musicVolume") ?? 0.4));
  const [sfxVolume, setSfxVolume] = useState(() => Number(localStorage.getItem("sfxVolume") ?? 0.6));
  const [fxVolume, setFxVolume] = useState(() => Number(localStorage.getItem("fxVolume") ?? 0.5));
  const [theme, setThemeState] = useState<"dark" | "light">(() => (localStorage.getItem("theme") as "dark" | "light") || "dark");

  const setTheme = useCallback((newTheme: "dark" | "light") => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
  }, []);

  const [factories, setFactories] = useState<Installation[]>([]);
  const [userFactories, setUserFactories] = useState<Installation[]>([]);
  const [bodyResources, setBodyResources] = useState<BodyResource[]>([]);
  const [userResources, setUserResources] = useState<UserResource[]>([]);
  const [currentJob, setCurrentJob] = useState<FactoryWorker | null>(null);
  // factory_id -> resource_type -> amount in input storage
  const [factoryInputStorage, setFactoryInputStorage] = useState<Record<string, Record<string, number>>>({});
  const [articles, setArticles] = useState<any[]>([]);
  const [cargoCapacity, setCargoCapacity] = useState(5000);
  const [marketListings, setMarketListings] = useState<MarketListing[]>([]);
  const [userLogs, setUserLogs] = useState<any[]>([]);
  const [fleetCount, setFleetCount] = useState(0);
  const [parties, setParties] = useState<Party[]>([]);
  const [userParty, setUserParty] = useState<Party | null>(null);
  const [userPartyMember, setUserPartyMember] = useState<PartyMember | null>(null);
  const [npcMarketState, setNpcMarketState] = useState<Record<string, { basePrice: number, currentPrice: number, lastUpdated: string }>>({});
  
  // Action Points Tick Logic
  const AP_REGEN_INTERVAL = 300000; // 5 minutes
  const [lastApTick, setLastApTick] = useState(() => {
    const saved = localStorage.getItem("lastApTick");
    return saved ? Number(saved) : Date.now();
  });
  const [nextApTick, setNextApTick] = useState(lastApTick + AP_REGEN_INTERVAL);
  const [onlinePlayerCount, setOnlinePlayerCount] = useState(1);

  // Shared mapper: DB factory row → Installation
  const mapFactory = (f: any): Installation => {
    const storageTier = f.storage_tier ?? 0;
    const storageCapacity = [100, 300, 750, 2000, 5000][Math.min(storageTier, 4)];
    return {
      id: f.id,
      systemId: f.system_id,
      bodyId: f.body_id,
      ownerId: f.owner_id,
      type: f.type,
      resourceType: f.resource_type,
      wage: f.wage,
      treasury: f.treasury ?? 0,
      jobsAvailable: f.jobs_available,
      maxJobs: f.max_jobs ?? 5,
      isNpcOwned: f.is_npc_owned,
      storage: f.storage ?? 0,
      storageTier,
      slotTier: f.slot_tier ?? 0,
      replenishTier: f.replenish_tier ?? 0,
      tier: f.tier ?? 1,
      storageCapacity,
    };
  };


  // --- SUPABASE SYNC LOGIC ---

  // 1. Initial Session & Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setSessionLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Load User Data from Supabase
  useEffect(() => {
    if (!user) {
      setInitialDataLoaded(false);
      return;
    }

    const loadData = async () => {
      try {
        // Load Profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, party_members(party_id, parties(logo_symbol, hue))')
          .eq('id', user.id)
          .single();

        if (profile) {
          setPlayerName(profile.commander_name || "Majora");
          setPlayerAvatar(profile.avatar_url || avatar);
          setPlayerLevel(profile.level);
          setPlayerXP(profile.xp);
          setSc(profile.credits);
          setCargoCapacity(profile.cargo_capacity ?? 5000);
          setIsAdmin(profile.is_admin ?? false);

          // Extract party info
          const partyMember = profile.party_members?.[0];
          if (partyMember?.parties) {
            setPlayerPartyIcon(partyMember.parties.logo_symbol);
            setPlayerPartyHue(partyMember.parties.hue);
          } else {
            setPlayerPartyIcon(undefined);
            setPlayerPartyHue(undefined);
          }
        }

        // Load Inventory
        const { data: inv } = await supabase.from('user_resources').select('*').eq('user_id', user.id);
        if (inv) setUserResources(inv.map(r => ({ userId: r.user_id, resourceType: r.resource_type, amount: r.amount })));

        const fetchInventory = async () => {
          if (!user) return;
          const { data: inv } = await supabase.from('user_resources').select('*').eq('user_id', user.id);
          if (inv) setUserResources(inv.map(r => ({ userId: r.user_id, resourceType: r.resource_type, amount: r.amount })));
        };

        // Load current job
        const { data: job } = await supabase.from('factory_workers').select('*').eq('user_id', user.id).single();
        if (job) setCurrentJob({ userId: job.user_id, factoryId: job.factory_id, hiredAt: job.hired_at } as any);

        // Load Residency
        const { data: res } = await supabase.from('residencies').select('*').eq('user_id', user.id).maybeSingle();
        if (res) setUserResidency({ userId: res.user_id, bodyId: res.body_id, joinedAt: res.joined_at });

        const { data: apps } = await supabase.from('residency_applications').select('*').eq('user_id', user.id);
        if (apps) setResidencyApplications(apps.map(a => ({ id: a.id, userId: a.user_id, bodyId: a.body_id, status: a.status, createdAt: a.created_at } as ResidencyApplication)));

        // Load Governance
        const { data: elections } = await supabase.from('state_elections').select('*').eq('status', 'active');
        if (elections) setActiveElections(elections.map(e => ({ id: e.id, stateId: e.state_id, electionType: e.election_type, startTime: e.start_time, endTime: e.end_time, status: e.status } as StateElection)));

        const { data: votes } = await supabase.from('state_votes').select('*').eq('voter_id', user.id);
        if (votes) setUserVotes(votes.map(v => ({ electionId: v.election_id, voterId: v.voter_id, candidatePartyId: v.candidate_party_id, candidateUserId: v.candidate_user_id } as StateVote)));

        // Load Player Empires (rich)
        const { data: pEmps } = await supabase.from('player_empires').select('*');
        if (pEmps) {
          const richEmps: PlayerEmpire[] = pEmps.map(e => ({
            id: e.id, name: e.name, tag: e.tag, hue: e.hue,
            founderId: e.founder_id, capitalBodyId: e.capital_body_id,
            phase: e.phase || 'active', leaderId: e.leader_id, viceLeaderId: e.vice_leader_id,
            createdAt: e.created_at
          }));
          setPlayerEmpiresFull(richEmps);
          // Also set legacy Empire array for hemicycle compatibility
          const mappedEmps = pEmps.map(e => ({
            id: e.id, name: e.name, tag: e.tag, hue: e.hue,
            logo: { symbol: 'Crown', pattern: 'grid', secondaryHue: (e.hue + 180) % 360 },
            government: { type: 'Parliamentary republic', president: null, vicePresident: null, ministers: [], council: { totalSeats: 20, factions: [], seats: [] } }
          } as Empire));
          setPlayerEmpires(mappedEmps);
        }

        // Load Body Governance
        const { data: bGov } = await supabase.from('body_governance').select('*');
        if (bGov) {
          const govMap: Record<string, any> = {};
          bGov.forEach(g => {
            govMap[g.body_id] = { status: g.status, electionEndTime: g.election_end_time, formationReferendumId: g.formation_referendum_id, empireId: g.empire_id };
          });
          setBodyGovernance(govMap);
        }

        // Load Formation Referendums
        const { data: refs } = await supabase.from('state_formation_votes').select('*').eq('status', 'pending');
        if (refs) setFormationReferendums(refs.map(r => ({
          id: r.id, bodyId: r.body_id, empireName: r.empire_name, empireTag: r.empire_tag,
          hue: r.hue, proposedBy: r.proposed_by, endsAt: r.ends_at,
          status: r.status, yesVotes: r.yes_votes, noVotes: r.no_votes, createdAt: r.created_at
        } as StateFormationVote)));

        // Load user's formation ballots
        const { data: ballots } = await supabase.from('state_formation_ballots').select('referendum_id, vote').eq('voter_id', user.id);
        if (ballots) {
          const bmap: Record<string, 'yes' | 'no'> = {};
          ballots.forEach(b => { bmap[b.referendum_id] = b.vote as 'yes' | 'no'; });
          setUserFormationBallots(bmap);
        }

        // Load active elections and their candidates
        const { data: elecs } = await supabase.from('state_elections').select('*').eq('status', 'active');
        if (elecs) setActiveElections(elecs.map(e => ({ id: e.id, stateId: e.state_id, electionType: e.election_type, startTime: e.start_time, endTime: e.end_time, status: e.status })));
        if (elecs && elecs.length > 0) {
          const elecIds = elecs.map(e => e.id);
          const { data: cands } = await supabase.from('election_candidates').select('*').in('election_id', elecIds);
          if (cands) setElectionCandidates(cands.map(c => ({ id: c.id, electionId: c.election_id, partyId: c.party_id, userId: c.user_id, voteCount: c.vote_count, registeredAt: c.registered_at })));
          const { data: myBallots } = await supabase.from('election_ballots').select('election_id, candidate_id').eq('voter_id', user.id);
          if (myBallots) {
            const bmap: Record<string, string> = {};
            myBallots.forEach(b => { bmap[b.election_id] = b.candidate_id; });
            setElectionBallots(bmap);
          }
        }

        // Load ministerial assignments
        const { data: mins } = await supabase.from('ministerial_assignments').select('*, profiles!user_id(commander_name, avatar_url)');
        if (mins) setMinisterialAssignments(mins.map(m => ({ id: m.id, empireId: m.empire_id, userId: m.user_id, roleName: m.role_name, appointedBy: m.appointed_by, appointedAt: m.appointed_at, userName: (m.profiles as any)?.commander_name, userAvatar: (m.profiles as any)?.avatar_url })));

        // Load all player-owned factories for Assets tab
        const { data: pFact } = await supabase.from('factories').select('*').eq('owner_id', user.id);
        if (pFact) setUserFactories(pFact.map(mapFactory));


        // Load active Vessel
        const { data: vessel } = await supabase
          .from('vessels')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (vessel) {
          setVesselId(vessel.id);
          setShipConfig({
            name: vessel.name || "Aegis VII",
            primaryColor: vessel.primary_color,
            accentColor: vessel.accent_color,
            hullId: vessel.hull_id,
            wingsId: vessel.wings_id,
            enginesId: vessel.engines_id,
            bridgeId: vessel.bridge_id,
          });
        }

        // Load Exploration
        const { data: exploration } = await supabase
          .from('exploration_logs')
          .select('system_id')
          .eq('user_id', user.id);
        
        if (exploration && exploration.length > 0) {
          setExploredSystemIds(new Set(exploration.map(e => e.system_id)));
        }

        // Load unlocked skills
        const { data: skills } = await supabase
          .from('player_skills')
          .select('skill_id')
          .eq('user_id', user.id);
        if (skills) setPlayerSkills(skills.map(s => s.skill_id));
      } catch (err) {
        console.error("Error loading user data:", err);
      } finally {
        setInitialDataLoaded(true);
      }
    };

    loadData();
  }, [user]);

  // 3. Save Data to Supabase (Debounced/Automatic via useEffects)
  useEffect(() => {
    if (!user || !initialDataLoaded) return;
    const updateProfile = async () => {
      await supabase.from('profiles').upsert({
        id: user.id,
        commander_name: playerName,
        avatar_url: playerAvatar,
        level: playerLevel,
        xp: playerXP,
        credits: sc,
        updated_at: new Date().toISOString()
      });
    };
    updateProfile();
  }, [user, initialDataLoaded, playerName, playerAvatar, playerLevel, playerXP, sc]);

  useEffect(() => {
    if (!user || !initialDataLoaded) return;
    const updateVessel = async () => {
      await supabase.from('vessels').upsert({
        user_id: user.id,
        name: shipConfig.name,
        primary_color: shipConfig.primaryColor,
        accent_color: shipConfig.accentColor,
        hull_id: shipConfig.hullId,
        wings_id: shipConfig.wingsId,
        engines_id: shipConfig.enginesId,
        bridge_id: shipConfig.bridgeId,
        is_active: true
      }, { onConflict: 'user_id' }); 
    };
    updateVessel();
  }, [user, initialDataLoaded, shipConfig]);

  // Sync location to Supabase fleet_positions
  useEffect(() => {
    if (!user || !vesselId || !initialDataLoaded) return;
    
    const syncPosition = async () => {
      await supabase.from('fleet_positions').upsert({
        user_id: user.id,
        vessel_id: vesselId,
        system_id: playerSystemId,
        body_id: playerBodyId,
        travel_type: travel?.type || null,
        travel_target_id: travel?.targetId || null,
        travel_start_time: travel?.startTime || null,
        travel_end_time: travel?.endTime || null,
        travel_start_pos_x: travel?.startPos?.x || null,
        travel_start_pos_z: travel?.startPos?.z || null,
        arrival_from_id: arrival?.fromId || null,
        arrival_start_time: arrival?.startTime || null,
        arrival_duration: arrival?.duration || null,
      }, { onConflict: 'vessel_id' });
    };
    syncPosition();
  }, [user, vesselId, initialDataLoaded, playerSystemId, playerBodyId, travel, arrival]);

  const knownSystemIds = useMemo(() => {
    // 1. Start with all explored systems (stay visible forever)
    const known = new Set<string>(exploredSystemIds);
    
    // 2. Add systems within 2 jumps of current position (sensor range)
    const queue: [string, number][] = [[playerSystemId, 0]];
    known.add(playerSystemId);
    
    const bfsVisited = new Set<string>([playerSystemId]);
    let head = 0;
    while (head < queue.length) {
      const [id, depth] = queue[head++];
      if (depth >= 2) continue;
      
      for (const lane of galaxy.hyperlanes) {
        let neighbor = "";
        if (lane.a === id) neighbor = lane.b;
        else if (lane.b === id) neighbor = lane.a;
        
        if (neighbor && !bfsVisited.has(neighbor)) {
          bfsVisited.add(neighbor);
          known.add(neighbor);
          queue.push([neighbor, depth + 1]);
        }
      }
    }
    return known;
  }, [exploredSystemIds, galaxy, playerSystemId]);

  // Poll other players' positions
  useEffect(() => {
    if (!user || !initialDataLoaded) return;
    
    const fetchOthers = async () => {
      const systemArray = Array.from(knownSystemIds);
      if (systemArray.length === 0) return;

      const { data } = await supabase
        .from('fleet_positions')
        .select('*, profiles(commander_name)')
        .neq('user_id', user.id)
        .in('system_id', systemArray); 
        
      if (data) {
        setOtherPlayers(data);
      }
    };
    
    fetchOthers();
    const interval = setInterval(fetchOthers, 5000); 
    
    return () => clearInterval(interval);
  }, [user, initialDataLoaded, knownSystemIds]);

  // Action Points Regeneration Timer
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= nextApTick) {
        setAp(prev => {
          const next = Math.min(240, prev + 1);
          localStorage.setItem("ap", next.toString());
          return next;
        });
        const newTick = now + AP_REGEN_INTERVAL;
        setLastApTick(now);
        setNextApTick(newTick);
        localStorage.setItem("lastApTick", now.toString());
        
        // Sync AP to profile in background
        if (user) {
          supabase.from('profiles').update({ action_points: Math.min(240, ap + 1) }).eq('id', user.id).then();
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [nextApTick, user, ap]);

  // Global Online Players Count (Global scale)
  useEffect(() => {
    const fetchOnlineCount = async () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { count, error } = await supabase
        .from('fleet_positions')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', tenMinutesAgo);
        
      if (!error && count !== null) {
        setOnlinePlayerCount(Math.max(1, count));
      }
    };
    
    fetchOnlineCount();
    const interval = setInterval(fetchOnlineCount, 30000); // Every 30s
    return () => clearInterval(interval);
  }, []);

  // --- LOCALSTORAGE PERSISTENCE (Fallback/Sync) ---
  const setFogOfWar = (v: boolean) => {
    setFogOfWarState(v);
    localStorage.setItem("fogOfWar", String(v));
  };

  const setInstantJump = (v: boolean) => {
    setInstantJumpState(v);
    localStorage.setItem("instantJump", String(v));
  };

  const resetGalaxy = () => {
    setPlayerSystemId("sys-center");
    setExploredSystemIds(new Set(["sys-center"]));
    setTravel(null);
    setView("system");
    setSystemId("sys-center");
    setBodyId(null);
    toast.success("Galaxy reset", {
      description: "Returned to central star. Exploration logs cleared."
    });
  };

  // Persist state to localStorage
  useEffect(() => { localStorage.setItem("playerSystemId", playerSystemId); }, [playerSystemId]);
  useEffect(() => { localStorage.setItem("playerBodyId", playerBodyId); }, [playerBodyId]);
  useEffect(() => { localStorage.setItem("exploredIds", JSON.stringify([...exploredSystemIds])); }, [exploredSystemIds]);
  useEffect(() => { localStorage.setItem("exploredBodyIds", JSON.stringify([...exploredBodyIds])); }, [exploredBodyIds]);
  useEffect(() => { 
    if (view === "galaxy" || view === "system") {
      localStorage.setItem("view", view); 
    }
  }, [view]);
  useEffect(() => { 
    if (systemId) localStorage.setItem("systemId", systemId);
    else localStorage.setItem("systemId", "");
  }, [systemId]);
  useEffect(() => { 
    if (bodyId) localStorage.setItem("bodyId", bodyId);
    else localStorage.setItem("bodyId", "");
  }, [bodyId]);
  useEffect(() => { 
    if (travel) localStorage.setItem("travel", JSON.stringify(travel));
    else localStorage.removeItem("travel");
  }, [travel]);

  useEffect(() => { localStorage.setItem("ap", String(ap)); }, [ap]);
  useEffect(() => { localStorage.setItem("sc", String(sc)); }, [sc]);
  useEffect(() => { localStorage.setItem("playerName", playerName); }, [playerName]);
  useEffect(() => { localStorage.setItem("playerLevel", String(playerLevel)); }, [playerLevel]);
  useEffect(() => { localStorage.setItem("playerXP", String(playerXP)); }, [playerXP]);
  useEffect(() => { localStorage.setItem("playerAvatar", playerAvatar); }, [playerAvatar]);
  useEffect(() => { localStorage.setItem("shipConfig", JSON.stringify(shipConfig)); }, [shipConfig]);
  useEffect(() => { localStorage.setItem("audioEnabled", String(audioEnabled)); }, [audioEnabled]);
  useEffect(() => { localStorage.setItem("musicVolume", String(musicVolume)); }, [musicVolume]);
  useEffect(() => { localStorage.setItem("sfxVolume", String(sfxVolume)); }, [sfxVolume]);
  useEffect(() => { localStorage.setItem("fxVolume", String(fxVolume)); }, [fxVolume]);

  // Unified Global Timer: AP regeneration and Clock Update
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      setCurrentTime(now);

      // 1. AP Regen (20 AP/hour on the hour boundary)
      let lastRegenStr = localStorage.getItem("lastApRegen");
      if (!lastRegenStr) {
        const initialRegen = new Date(now).setMinutes(0, 0, 0);
        localStorage.setItem("lastApRegen", String(initialRegen));
        lastRegenStr = String(initialRegen);
      }
      
      const lastRegen = Number(lastRegenStr);
      const hoursPassed = Math.floor((now - lastRegen) / 3600000);

      if (hoursPassed > 0) {
        setAp(prev => Math.min(240, prev + (hoursPassed * 20)));
        const newRegenTime = lastRegen + (hoursPassed * 3600000);
        localStorage.setItem("lastApRegen", String(newRegenTime));
      }
    };

    tick(); // Initial sync
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);


  const [filters, setFilters] = useState<FilterState>({
    contest: new Set(ALL_CONTEST),
    economy: new Set(ALL_ECON),
    starType: new Set(ALL_STAR),
    layers: new Set(ALL_LAYERS),
  });

  const system: StarSystem | null = systemId ? galaxy.systemById[systemId] : null;
  const body: Body | null = useMemo(() => {
    if (!system || !bodyId) return null;
    if (bodyId === "ship") {
      const shipBody: Body = {
        id: "ship",
        systemId: system.id,
        name: shipConfig.name,
        type: "ship",
        subtype: "commander",
        size: 0.0003,
        orbit: 0,
        phase: 0,
        hue: 0,
        hasRings: false,
        population: 0,
        economy: "stable",
        habitabilityZone: "none",
        temperature: 295,
        flora: "none",
        fauna: "none",
        hazards: [],
        ownerId: "hegemony",
        deposits: []
      };
      return shipBody;
    }
    if (bodyId === "star") {
      const starBody: Body = {
        id: "star",
        systemId: system.id,
        name: system.name,
        type: "star",
        subtype: system.starType as PlanetSubtype,
        size: STAR_BASE_SIZE[system.starType] || 2,
        orbit: 0,
        phase: 0,
        hue: 0,
        hasRings: false,
        population: 0,
        economy: system.economy,
        habitabilityZone: "hot",
        temperature: 5000,
        flora: "none",
        fauna: "none",
        hazards: ["Radiation", "Extreme Heat"],
        ownerId: "hegemony",
        deposits: [],
        atmosphere: "Stellar Corona"
      };
      return starBody;
    }
    return system.bodies.find((b) => b.id === bodyId) ?? null;
  }, [system, bodyId]);


  const getJumpCost = useCallback((targetId: string) => {
    const s1 = galaxy.systemById[playerSystemId];
    const s2 = galaxy.systemById[targetId];
    if (!s1 || !s2) return 0;
    const dist = Math.hypot(s1.pos[0] - s2.pos[0], s1.pos[1] - s2.pos[1], s1.pos[2] - s2.pos[2]);
    // Formula: 10 AP base + 1 AP per 30 scene units
    return Math.floor(10 + dist / 30);
  }, [galaxy, playerSystemId]);

  const getGateLocalPos = useCallback((sysId: string, targetId: string) => {
    const system = galaxy.systemById[sysId];
    if (!system || !system.gates) return { x: 15, z: 0 };
    
    // Exact same logic as UnifiedMap's getGateLocalPosition
    const outer = 150; // Standard system radius for gates
    const i = system.gates.findIndex((g) => g.targetSystemId === targetId);
    if (i < 0) return { x: outer, z: 0 };
    const duration = Math.max(1, system.gates.length);
    const angle = (Math.max(0, i) / duration) * Math.PI * 2;
    return { x: Math.cos(angle) * outer, z: Math.sin(angle) * outer };
  }, [galaxy]);

  const getVesselLocalPos = useCallback((time: number) => {
    const sys = galaxy.systemById[playerSystemId];
    if (!sys) return { x: 0, z: 0 };

    if (travel) {
      if (travel.type === "intra") {
        const duration = Math.max(1, travel.endTime - travel.startTime);
        const p = Math.max(0, Math.min(1, (time - travel.startTime) / duration));
        const eased = 1 - Math.pow(1 - p, 2.0);
        const sP = travel.startPos || { x: 0, z: 0 };
        const tBody = sys.bodies.find(b => b.id === travel.targetId);
        const tP = tBody ? getBodyPosition(tBody, sys.starType, travel.endTime) : { x: 0, z: 0 };
        return {
          x: sP.x + (tP.x - sP.x) * eased,
          z: sP.z + (tP.z - sP.z) * eased
        };
      } else {
        // Inter-system travel is complex, but let's just return system center for now 
        // as redirection during hyperlane isn't supported yet.
        return { x: 0, z: 0 };
      }
    } else if (arrival) {
      const duration = Math.max(1, arrival.duration);
      const p = Math.max(0, Math.min(1, (time - arrival.startTime) / duration));
      const eased = 1 - Math.pow(1 - p, 2.0);
      const gP = getGateLocalPos(playerSystemId, arrival.fromId);
      return {
        x: gP.x * (1 - eased),
        z: gP.z * (1 - eased)
      };
    } else {
      const body = playerBodyId === "star" ? null : sys.bodies.find(b => b.id === playerBodyId);
      return body ? getBodyPosition(body, sys.starType, time) : { x: 0, z: 0 };
    }
  }, [galaxy, playerSystemId, travel, arrival, playerBodyId, getGateLocalPos]);

  const fetchEconomyData = useCallback(async () => {
    // 1. Fetch articles with votes and comments (Public access)
    const { data: art, error: artError } = await supabase
      .from('articles')
      .select(`
        *, 
        profiles(
          commander_name, 
          avatar_url, 
          level,
          party_members(parties(logo_symbol, hue))
        ),
        article_votes(user_id, vote_type),
        article_comments(
          *, 
          profiles(
            commander_name, 
            avatar_url, 
            level,
            party_members(parties(logo_symbol, hue))
          )
        )
      `)
      .order('created_at', { ascending: false });
    
    if (artError) {
      console.error("Subspace Relay Error:", artError.message);
    } else {
      setArticles(art || []);
    }

    // 2. Fetch dynamic NPC market state
    const { data: npcMarket, error: marketError } = await supabase.from('npc_market_state').select('*');
    if (!marketError && npcMarket) {
      const marketMap = npcMarket.reduce((acc: any, curr: any) => {
        acc[curr.resource_type] = {
          basePrice: curr.base_price,
          currentPrice: curr.current_price,
          lastUpdated: curr.last_updated
        };
        return acc;
      }, {});
      setNpcMarketState(marketMap);
    }

    if (!user || !systemId) return;
    
    // Fetch all factories in this system
    const { data: fact } = await supabase
      .from('factories')
      .select('*')
      .eq('system_id', systemId);
    if (fact) setFactories(fact.map(mapFactory));

    // Fetch all factories owned by the user
    const { data: uFact } = await supabase
      .from('factories')
      .select('*')
      .eq('owner_id', user.id);
    if (uFact) setUserFactories(uFact.map(mapFactory));

    // Fetch body resources for the current system
    const { data: bRes } = await supabase
      .from('body_resources')
      .select('*')
      .in('body_id', (system?.bodies.map(b => b.id) || []).concat(['star']));
    if (bRes) setBodyResources(bRes.map(r => ({
      bodyId: r.body_id,
      resourceType: r.resource_type,
      currentAmount: r.current_amount,
      maxAmount: r.max_amount,
      lastReplenishedAt: r.last_replenished_at,
      richnessValue: r.richness_value
    })));

    // Fetch active market listings
    const { data: listings } = await supabase
      .from('market_listings')
      .select('*')
      .eq('status', 'active');
    if (listings) {
      setMarketListings(listings.map(l => ({
        id: l.id,
        sellerId: l.seller_id,
        sellerName: l.seller_name,
        resourceType: l.resource_type,
        amount: l.amount,
        amountRemaining: l.amount_remaining,
        pricePerUnit: l.price_per_unit,
        createdAt: l.created_at,
        expiresAt: l.expires_at,
        status: l.status
      })));
    }

    // 6. Fetch social stats for the user
    const { data: receivedVotes } = await supabase
      .from('article_votes')
      .select('vote_type, articles!inner(author_id)')
      .eq('articles.author_id', user.id);

    const { data: givenVotes } = await supabase
      .from('article_votes')
      .select('vote_type')
      .eq('user_id', user.id);

    if (receivedVotes || givenVotes) {
      setSocialStats({
        upvotesReceived: receivedVotes?.filter(v => v.vote_type === 1).length || 0,
        downvotesReceived: receivedVotes?.filter(v => v.vote_type === -1).length || 0,
        upvotesGiven: givenVotes?.filter(v => v.vote_type === 1).length || 0,
        downvotesGiven: givenVotes?.filter(v => v.vote_type === -1).length || 0
      });
    }

    // 7. Fetch user logs
    const { data: logs } = await supabase
      .from('user_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (logs) setUserLogs(logs);

    // 8. Fetch fleet count (vessels)
    const { count } = await supabase
      .from('vessels')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    if (count !== null) setFleetCount(count);

    // 9. Fetch factory input storage for all user-owned T2/T3 factories
    if (uFact && uFact.length > 0) {
      const t2t3Ids = uFact.filter(f => (f.tier ?? 1) >= 2).map(f => f.id);
      if (t2t3Ids.length > 0) {
        const { data: inputRows } = await supabase
          .from('factory_input_storage')
          .select('*')
          .in('factory_id', t2t3Ids);
        if (inputRows) {
          const grouped: Record<string, Record<string, number>> = {};
          for (const row of inputRows) {
            if (!grouped[row.factory_id]) grouped[row.factory_id] = {};
            grouped[row.factory_id][row.resource_type] = row.amount;
          }
          setFactoryInputStorage(grouped);
        }
      }
    }
  }, [user, systemId, system]);

  const logAction = useCallback(async (type: string, title: string, description?: string) => {
    if (!user) return;
    await supabase.from('user_logs').insert({
      user_id: user.id,
      type,
      title,
      description
    });
    fetchEconomyData();
  }, [user, fetchEconomyData]);

  /** Award XP via the server-side grant_xp RPC and update local state. */
  const grantXP = useCallback(async (reason: XPReason, bonusFlat = 0) => {
    if (!user) return;
    const base = XP_REWARDS[reason] ?? 0;
    // Apply skill bonuses
    const flatBonus = computeSkillBonus('level_xp_bonus', playerSkills);
    const multiplier = 1 + flatBonus; // level_xp_bonus is stored as 0.05 per skill
    const total = Math.round((base + bonusFlat) * multiplier);
    if (total <= 0) return;
    const { data, error } = await supabase.rpc('grant_xp', {
      p_user_id: user.id,
      p_amount: total,
      p_reason: reason
    });
    if (error) { console.warn('XP grant failed:', error.message); return; }
    const result = data as { xp: number; level: number; leveled_up: boolean; xp_gained: number };
    setPlayerXP(result.xp);
    setPlayerLevel(result.level);
    if (result.leveled_up) {
      toast.success(`🎖 Level Up! Now Level ${result.level}`, {
        description: `You gained a new skill point. Open the Skill Tree to spend it.`
      });
    }
  }, [user, playerSkills]);


  const initiateJump = useCallback((targetId: string) => {
    if (travel) return; // Already moving
    
    const cost = getJumpCost(targetId);
    if (ap < cost) {
      toast.error(`Insufficient AP! Jump requires ${cost} AP (Current: ${Math.floor(ap)})`, {
      description: "AP regenerates at 20/hour (distributed on the hour)."
      });
      return;
    }

    const currentPos = galaxy.systemById[playerSystemId].pos;
    const targetPos = galaxy.systemById[targetId].pos;
    const dist = Math.hypot(currentPos[0] - targetPos[0], currentPos[1] - targetPos[1], currentPos[2] - targetPos[2]);
    
    const durationMs = instantJump ? 0 : (15 + dist * 1.2) * 1000;
    const now = Date.now();
    const currentLocalPos = getVesselLocalPos(now);
    
    setAp(prev => prev - cost);
    setTravel({ 
      targetId, 
      startTime: now, 
      endTime: now + durationMs, 
      type: "inter",
      startPos: currentLocalPos // Capture starting orbital position for sync
    });
    setArrival(null); // Clear any pending arrival animation
    logAction('navigation', `Hyperspace Jump Initiated`, `Vessel targeting ${galaxy.systemById[targetId]?.name || targetId}. Estimated transit: ${Math.floor(durationMs / 1000)}s.`);
  }, [playerSystemId, galaxy, travel, instantJump, ap, getJumpCost, getVesselLocalPos, logAction]);

  const initiateTravelToBody = useCallback((targetBodyId: string) => {
    // 1. Calculate current position for starting (supports mid-flight redirection)
    const now = Date.now();
    const currentLocalPos = getVesselLocalPos(now);
    
    // 2. Intra-system travel distance
    const currentSystem = galaxy.systemById[playerSystemId];
    if (!currentSystem) return;

    const targetBody = targetBodyId === "star" ? null : currentSystem.bodies.find(b => b.id === targetBodyId);
    const targetPos = targetBody ? getBodyPosition(targetBody, currentSystem.starType, now) : { x: 0, z: 0 };
    
    const dx = targetPos.x - currentLocalPos.x;
    const dz = targetPos.z - currentLocalPos.z;
    const dist = Math.sqrt(dx*dx + dz*dz);

    const cost = 5 + Math.floor(dist / 250); 
    if (ap < cost) {
      toast.error(`Insufficient AP! Travel requires ${cost} AP`, {
        description: "Intra-system sub-light travel requires fuel based on distance."
      });
      return;
    }

    const travelSpeed = 0.015; 
    const durationMs = instantJump ? 0 : Math.max(5000, dist / travelSpeed);    
    
    setAp(prev => prev - cost);
    // Important: Capture currentLocalPos as the explicit startPos for the travel lerp
    setTravel({ 
      targetId: targetBodyId, 
      startTime: now, 
      endTime: now + durationMs, 
      type: "intra",
      startPos: currentLocalPos
    });
    setArrival(null); // Stop any arrival sequence
    logAction('navigation', `Sub-light Transit Engaged`, `Destination: ${targetBodyId === 'star' ? 'System Star' : targetBodyId}. Speed: ${travelSpeed * 1000} u/s.`);
  }, [ap, instantJump, playerSystemId, galaxy, getVesselLocalPos, logAction]);

  const createArticle = useCallback(async (title: string, content: string, type: string) => {
    if (!user) return;
    const sys = galaxy.systemById[playerSystemId];
    
    const { error } = await supabase.from('articles').insert({
      author_id: user.id,
      title,
      content,
      type,
      system_id: type === 'system' ? playerSystemId : null,
      empire_id: type === 'empire' ? sys?.ownerId : null,
      sector_id: type === 'sector' ? sys?.sectorId : null
    });

    if (error) {
      toast.error("Failed to post article", { description: error.message });
    } else {
      toast.success("Article broadcasted!", { description: "Your message is propagating through the subspace relay." });
      logAction('article_post', `Broadcasting: ${title}`, `Neural broadcast transmitted to the ${type} relay network.`);
      const bonus = computeSkillBonus('article_xp_bonus', playerSkills);
      grantXP('article_published', bonus);
      fetchEconomyData();
    }
  }, [user, playerSystemId, galaxy, fetchEconomyData, logAction, grantXP, playerSkills]);

  const voteArticle = useCallback(async (articleId: string, voteType: 1 | -1) => {
    if (!user) return;
    const { error } = await supabase
      .from('article_votes')
      .upsert({ article_id: articleId, user_id: user.id, vote_type: voteType }, { onConflict: 'article_id,user_id' });

    if (error) {
      toast.error("Failed to register vote", { description: error.message });
    } else {
      fetchEconomyData();
    }
  }, [user, fetchEconomyData]);

  const postComment = useCallback(async (articleId: string, content: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('article_comments')
      .insert({ article_id: articleId, user_id: user.id, content });

    if (error) {
      toast.error("Failed to post comment", { description: error.message });
    } else {
      toast.success("Comment posted!");
      fetchEconomyData();
    }
  }, [user, fetchEconomyData]);

  // Derived filtered articles
  const filteredArticles = useMemo(() => {
    const sys = galaxy.systemById[playerSystemId];
    return articles.filter(a => {
      if (a.type === 'galaxy') return true;
      if (a.type === 'system' && a.system_id === playerSystemId) return true;
      if (a.type === 'empire' && a.empire_id === sys?.ownerId) return true;
      if (a.type === 'sector' && a.sector_id === sys?.sectorId) return true;
      return false;
    });
  }, [articles, playerSystemId, galaxy]);

  const fetchParties = useCallback(async () => {
    const { data: pData } = await supabase.from('parties').select('*');
    if (pData) {
      setParties(pData.map(p => ({
        id: p.id,
        name: p.name,
        tag: p.tag,
        ideology: p.ideology,
        description: p.description,
        logoUrl: p.logo_url,
        logoSymbol: p.logo_symbol,
        hue: p.hue,
        headId: p.head_id,
        regionId: p.region_id,
        dailyWage: p.daily_wage,
        customWages: p.custom_wages,
        createdAt: p.created_at
      })));
    }

    if (user) {
      const { data: membership } = await supabase
        .from('party_members')
        .select('*, parties(*)')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (membership) {
        setUserPartyMember({
          partyId: membership.party_id,
          userId: membership.user_id,
          role: membership.role as PartyRole,
          joinedAt: membership.joined_at
        });
        const p = membership.parties;
        setUserParty({
          id: p.id,
          name: p.name,
          tag: p.tag,
          ideology: p.ideology,
          description: p.description,
          logoUrl: p.logo_url,
          logoSymbol: p.logo_symbol,
          hue: p.hue,
          headId: p.head_id,
          regionId: p.region_id,
          dailyWage: p.daily_wage,
          customWages: p.custom_wages,
          createdAt: p.created_at
        });
      } else {
        setUserParty(null);
        setUserPartyMember(null);
      }
    }
  }, [user]);

  const createParty = useCallback(async (name: string, tag: string, ideology: string, description: string, logoSymbol: string, hue: number) => {
    if (!user) return;
    if (userParty) {
      toast.error("Already in a party!");
      return;
    }
    const cost = 100;
    if (sc < cost) {
      toast.error("Insufficient Credits!", { description: `Creating a party costs ${cost} SC.` });
      return;
    }

    if (!playerBodyId) {
      toast.error("Must be on a planet", { description: "You must be orbiting a planet or moon to found a faction there." });
      return;
    }

    const { data: party, error } = await supabase.from('parties').insert({
      name,
      tag,
      ideology,
      description,
      logo_symbol: logoSymbol,
      hue,
      head_id: user.id,
      region_id: playerBodyId
    }).select().single();

    if (error || !party) {
      toast.error("Failed to create party", { description: error?.message || "Internal registration failure." });
    } else {
      // Add head as member
      const { error: memberError } = await supabase.from('party_members').insert({
        party_id: party.id,
        user_id: user.id,
        role: 'head'
      });

      if (memberError) {
        toast.error("Failed to register leadership role", { description: memberError.message });
        return;
      }

      // Deduct credits in database
      const { error: creditsError } = await supabase
        .from('profiles')
        .update({ credits: sc - cost })
        .eq('id', user.id);

      if (creditsError) {
        toast.error("Failed to deduct credits", { description: creditsError.message });
      } else {
        setSc(prev => prev - cost);
      }

      // Manually update local state to reflect the new party membership immediately
      setUserParty({
        id: party.id,
        name: party.name,
        tag: party.tag,
        ideology: party.ideology,
        description: party.description,
        logoSymbol: party.logo_symbol,
        hue: party.hue,
        headId: party.head_id,
        regionId: party.region_id,
        dailyWage: party.daily_wage,
        customWages: party.custom_wages || {},
        createdAt: party.created_at
      });
      setUserPartyMember({
        partyId: party.id,
        userId: user.id,
        role: 'head',
        joinedAt: new Date().toISOString()
      });

      toast.success("Party established!", { description: `${name} [${tag}] has been registered with the Hegemony.` });
      logAction('party_create', `Founding: ${name}`, `Neural ideology broadcast as the head of ${name}.`);
      fetchParties();
    }
  }, [user, userParty, sc, playerBodyId, playerSystemId, logAction, fetchParties]);

  const applyToParty = useCallback(async (partyId: string) => {
    if (!user) return;
    const { error } = await supabase.from('party_applications').insert({
      party_id: partyId,
      user_id: user.id
    });
    if (error) toast.error("Application failed", { description: error.message });
    else toast.success("Application transmitted", { description: "Leadership will review your request." });
  }, [user]);

  const joinParty = useCallback(async (partyId: string) => {
    if (!user) return;
    const { error } = await supabase.from('party_members').insert({
      party_id: partyId,
      user_id: user.id,
      role: 'member'
    });
    if (error) toast.error("Failed to join", { description: error.message });
    else {
      toast.success("Welcome to the party!", { description: "Collective interests synchronized." });
      fetchParties();
    }
  }, [user, fetchParties]);

  useEffect(() => {
    fetchParties();
    const interval = setInterval(fetchParties, 20000);
    return () => clearInterval(interval);
  }, [fetchParties]);

  const buildFactory = useCallback(async (resourceType: string) => {
    if (!user || !body) return;
    
    // Check for Sanctum systems (inner stars + center)
    const isSanctum = body.systemId.startsWith('sys-inner-') || body.systemId === 'sys-center';
    const residencyProhibited = isSanctum || body.type === 'asteroid' || body.type === 'gas_giant' || body.type === 'star';
    if (residencyProhibited) {
      toast.error("Construction prohibited!", { description: "The Sanctum systems are under NPC jurisdiction." });
      return;
    }

    // Check if player already has this factory type on this planet
    const alreadyHas = factories.some(f => f.bodyId === body.id && f.resourceType === resourceType && f.ownerId === user.id);
    if (alreadyHas) {
      toast.error("Limit reached", { description: `You already own a ${resourceType} factory on this planet.` });
      return;
    }

    // Determine tier from RESOURCE_META
    const meta = RESOURCE_META[resourceType as keyof typeof RESOURCE_META];
    const tier = meta?.tier ?? 1;

    // Tiered build costs: T1=5000, T2=20000, T3=75000
    const TIER_COSTS = { 1: 5000, 2: 20000, 3: 75000 };
    const cost = TIER_COSTS[tier as 1|2|3] ?? 5000;

    if (sc < cost) {
      toast.error("Insufficient Credits!", { description: `Building a T${tier} factory requires ${cost.toLocaleString()} SC.` });
      return;
    }

    // T2/T3 don't need a body deposit — they process stored materials
    // T1 needs a planetary deposit
    if (tier === 1) {
      const hasDeposit = body.deposits.some(d => d.resource === resourceType && !d.depleted);
      if (!hasDeposit) {
        toast.error("No deposit found", { description: `This body has no ${resourceType} deposit available for extraction.` });
        return;
      }
    }

    const { data: newFactory, error } = await supabase.from('factories').insert({
      system_id: playerSystemId,
      body_id: body.id,
      owner_id: user.id,
      resource_type: resourceType,
      type: `${resourceType} ${tier === 1 ? 'Extractor' : tier === 2 ? 'Refinery' : 'Fabricator'}`,
      wage: 50,
      jobs_available: 5,
      tier
    }).select().single();

    if (!error && newFactory) {
      if (tier === 1) {
        // Seed body_resources for T1 so work RPC can find it
        const deposit = body.deposits.find(d => d.resource === resourceType);
        const richnessKey = deposit?.richness ?? 'moderate';
        const richnessValue = { trace: 1, moderate: 2, significant: 3, rich: 4, abundant: 5 }[richnessKey] ?? 2;
        await supabase.from('body_resources').upsert({
          body_id: body.id,
          resource_type: resourceType,
          current_amount: richnessValue * 500,
          max_amount: richnessValue * 500,
          richness_value: richnessValue,
          last_replenished_at: new Date().toISOString()
        }, { onConflict: 'body_id,resource_type', ignoreDuplicates: true });
      } else {
        // Pre-seed input storage rows for T2/T3 so they appear immediately
        const inputs = (meta as any).inputs as { resource: string; qty: number }[];
        for (const inp of inputs) {
          await supabase.from('factory_input_storage').upsert({
            factory_id: newFactory.id,
            resource_type: inp.resource,
            amount: 0
          }, { onConflict: 'factory_id,resource_type', ignoreDuplicates: true });
        }
      }
      
      logAction('factory_build', `T${tier} Factory Commissioned: ${resourceType}`,
        `Established a new ${resourceType} ${tier === 1 ? 'extraction' : tier === 2 ? 'refinery' : 'fabrication'} facility on ${body.name}.`);
      const buildBonus = computeSkillBonus('factory_build_discount', playerSkills); // not additive to XP here
      grantXP('factory_built');
    }

    if (error) {
      toast.error("Build failed", { description: error.message });
    } else {
      setSc(prev => prev - cost);
      toast.success("Factory constructed!", { description: `T${tier} ${resourceType} facility is now operational.` });
      fetchEconomyData();
    }
  }, [user, body, playerSystemId, sc, factories, logAction, fetchEconomyData, grantXP, playerSkills]);

  const depositFactoryInput = useCallback(async (factoryId: string, resourceType: string, amount: number) => {
    if (!user) return;
    const { error } = await supabase.rpc('deposit_factory_input', {
      p_user_id: user.id,
      p_factory_id: factoryId,
      p_resource_type: resourceType,
      p_amount: amount
    });
    if (error) {
      toast.error("Deposit failed", { description: error.message });
    } else {
      toast.success(`Deposited ${amount}× ${resourceType}`, { description: "Materials transferred to factory input storage." });
      // Refresh local state
      const { data: inputs } = await supabase
        .from('factory_input_storage')
        .select('*')
        .eq('factory_id', factoryId);
      if (inputs) {
        setFactoryInputStorage(prev => ({
          ...prev,
          [factoryId]: Object.fromEntries(inputs.map(i => [i.resource_type, i.amount]))
        }));
      }
      // Refresh cargo
      const { data: inv } = await supabase.from('user_resources').select('*').eq('user_id', user.id);
      if (inv) setUserResources(inv.map(r => ({ userId: r.user_id, resourceType: r.resource_type, amount: r.amount })));
    }
  }, [user]);

  const applyForJob = useCallback(async (factoryId: string) => {
    if (!user) return;
    if (currentJob) {
      toast.error("Already employed!", { description: "You must leave your current job before applying to a new one." });
      return;
    }

    const { error } = await supabase.rpc('apply_for_job', {
      p_user_id: user.id,
      p_factory_id: factoryId
    });

    if (error) {
      toast.error("Application failed", { description: error.message });
    } else {
      setCurrentJob({ userId: user.id, factoryId: factoryId, hiredAt: new Date().toISOString() } as any);
      toast.success("Job accepted!", { description: "You are now employed at this facility." });
      fetchEconomyData(); // Refresh to show updated worker status/counts if needed
    }
  }, [user, currentJob, fetchEconomyData]);

  const workJob = useCallback(async () => {
    if (!user || !currentJob) return;
    if (ap < 5) {
      toast.error("Insufficient AP!", { description: "Working requires 5 AP." });
      return;
    }

    const { data, error } = await supabase.rpc('work_at_factory', {
      p_user_id: user.id,
      p_factory_id: currentJob.factoryId,
      p_ap_cost: 5
    });

    if (error || (data as any)?.error) {
      toast.error("Work failed", { description: (data as any)?.error || error?.message });
    } else {
      setAp(prev => prev - 5);
      // We don't manually update SC/Resource here, we let the polling/profile sync handle it
      // but we should trigger a refresh
      fetchEconomyData();
      
       // Manually refresh profile for credits and inventory
      const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
      if (profile) setSc(profile.credits);
      
      const { data: inv } = await supabase.from('user_resources').select('*').eq('user_id', user.id);
      if (inv) setUserResources(inv.map(r => ({ userId: r.user_id, resourceType: r.resource_type, amount: r.amount })));
      
      if (data) {
        const result = data as { wage: number; resource_yield: number; resource_type: string };
        toast.success(`Shift complete — +${result.wage} SC, +${result.resource_yield}× ${result.resource_type}`);
      } else {
        toast.success("Work shift completed", { description: "Wages deposited to your account." });
      }
      
      const xpBonus = computeSkillBonus('factory_xp_bonus', playerSkills);
      grantXP('factory_worked', xpBonus);
    }
  }, [user, currentJob, ap, fetchEconomyData, grantXP, playerSkills]);

  const collectFactory = useCallback(async (factoryId: string) => {
    if (!user) return;
    const { data, error } = await supabase.rpc('collect_factory_storage', {
      p_user_id: user.id,
      p_factory_id: factoryId
    });
    if (error) {
      toast.error("Collection failed", { description: error.message });
    } else {
      const collected = data as number;
      toast.success(`Collected ${collected} units`, { description: "Resources transferred to cargo hold." });
      logAction('logistics', `Resource Collection: ${collected} units`, `Standard cargo retrieval operation completed at the extraction site.`);
      // Refresh state
      fetchEconomyData();
      const { data: inv } = await supabase.from('user_resources').select('*').eq('user_id', user.id);
      if (inv) setUserResources(inv.map(r => ({ userId: r.user_id, resourceType: r.resource_type, amount: r.amount })));
    }
  }, [user, fetchEconomyData]);

  const upgradeFactory = useCallback(async (factoryId: string, upgradeType: 'storage' | 'slots' | 'replenish') => {
    if (!user) return;
    const { error } = await supabase.rpc('upgrade_factory', {
      p_user_id: user.id,
      p_factory_id: factoryId,
      p_upgrade_type: upgradeType
    });
    if (error) {
      toast.error("Upgrade failed", { description: error.message });
    } else {
      toast.success("Upgrade installed!", { description: `Factory ${upgradeType} tier increased.` });
      const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
      if (profile) setSc(profile.credits);
      logAction('factory_upgrade', `Upgrade Installed: ${upgradeType}`, `Enhanced the facility's ${upgradeType} protocols to Tier ${[1,2,3,4][Math.floor(Math.random()*4)]}.`);
      fetchEconomyData();
    }
  }, [user, fetchEconomyData]);

  const updateFactorySettings = useCallback(async (factoryId: string, wage: number, jobsAvailable: number) => {
    if (!user) return;
    const { error } = await supabase.rpc('update_factory_settings', {
      p_user_id: user.id,
      p_factory_id: factoryId,
      p_wage: wage,
      p_jobs_available: jobsAvailable
    });
    if (error) {
      toast.error("Settings update failed", { description: error.message });
    } else {
      toast.success("Factory settings updated.");
      fetchEconomyData();
    }
  }, [user, fetchEconomyData]);

  const depositToFactoryTreasury = useCallback(async (factoryId: string, amount: number) => {
    if (!user || amount <= 0 || sc < amount) return;
    
    // Optimistic UI update
    setSc(prev => prev - amount);
    setUserFactories(prev => prev.map(f => f.id === factoryId ? { ...f, treasury: (f.treasury || 0) + amount } : f));
    
    const { error } = await supabase.rpc('deposit_to_factory_treasury', {
      p_user_id: user.id,
      p_factory_id: factoryId,
      p_amount: amount
    });
    
    if (error) {
      toast.error("Deposit failed", { description: error.message });
      // Revert optimistic update
      setSc(prev => prev + amount);
      setUserFactories(prev => prev.map(f => f.id === factoryId ? { ...f, treasury: (f.treasury || 0) - amount } : f));
    } else {
      toast.success("Deposit successful", { description: `Deposited ${amount} SC to factory treasury.` });
    }
  }, [user, sc]);

  const claimResidency = useCallback(async (bodyId: string, isClaimable: boolean) => {
    if (!user) return;
    
    // Check if the body/system is restricted
    const sysId = bodyId.includes('-') ? bodyId.split('-')[0] : bodyId; // Standard body ID format is systemId-index
    const isSanctum = sysId.startsWith('sys-inner-') || sysId === 'sys-center';
    
    // Find body to check type
    const bodyObj = galaxy.bodyById[bodyId];
    const isAsteroid = bodyObj?.type === 'asteroid';

    if (isSanctum) {
      toast.error("Residency prohibited", { description: "The Sanctum systems are under NPC jurisdiction. No permanent residency permits are issued." });
      return;
    }

    if (isAsteroid) {
      toast.error("Residency prohibited", { description: "Asteroid belts are not suitable for permanent residency." });
      return;
    }

    if (isClaimable) {
      const { error } = await supabase.from('residencies').upsert({
        user_id: user.id,
        body_id: bodyId,
        joined_at: new Date().toISOString()
      });
      
      if (error) {
        toast.error("Claim failed", { description: error.message });
      } else {
        setUserResidency({ userId: user.id, bodyId, joinedAt: new Date().toISOString() });
        toast.success("Residency claimed!", { description: `You are now a resident of ${bodyId}.` });
        logAction('governance', 'Residency Established', `Registered permanent address at celestial body ${bodyId}.`);
        const resBonus = computeSkillBonus('residency_xp_bonus', playerSkills);
        grantXP('residency_claimed', resBonus);
      }
    } else {
      const { error } = await supabase.from('residency_applications').insert({
        user_id: user.id,
        body_id: bodyId,
        status: 'pending'
      });
      
      if (error) {
        toast.error("Application failed", { description: error.message });
      } else {
        // Refresh apps
        const { data: apps } = await supabase.from('residency_applications').select('*').eq('user_id', user.id);
        if (apps) setResidencyApplications(apps.map(a => ({ id: a.id, userId: a.user_id, bodyId: a.body_id, status: a.status, createdAt: a.created_at } as ResidencyApplication)));
        toast.success("Application submitted", { description: "Your residency request is awaiting approval." });
      }
    }
  }, [user, galaxy]);

  const voteForStateParty = useCallback(async (electionId: string, partyId: string) => {
    if (!user) return;
    
    const { error } = await supabase.from('state_votes').insert({
      election_id: electionId,
      voter_id: user.id,
      candidate_party_id: partyId
    });
    
    if (error) {
      toast.error("Voting failed", { description: error.message });
    } else {
      setUserVotes(prev => [...prev, { electionId, voterId: user.id, candidatePartyId: partyId }]);
      toast.success("Vote registered!", { description: "Your contribution to the democratic process has been recorded." });
      logAction('governance', 'Election Participation', `Cast a ballot in the ongoing parliamentary election (ID: ${electionId}).`);
    }
  }, [user]);



  const createMarketListing = useCallback(async (resourceType: string, amount: number, pricePerUnit: number) => {
    if (!user) return;
    const { error } = await supabase.rpc('create_market_listing', {
      p_user_id: user.id,
      p_resource_type: resourceType,
      p_amount: amount,
      p_price_per_unit: pricePerUnit
    });
    if (error) {
      toast.error("Failed to create listing", { description: error.message });
    } else {
      toast.success("Listing created", { description: "Resources placed in escrow." });
      logAction('market_listing', `Trade Listing: ${resourceType}`, `Placed ${amount} units of ${resourceType} on the open market for ${pricePerUnit} SC each.`);
      fetchEconomyData();
      const { data: inv } = await supabase.from('user_resources').select('*').eq('user_id', user.id);
      if (inv) setUserResources(inv.map(r => ({ userId: r.user_id, resourceType: r.resource_type, amount: r.amount })));
    }
  }, [user, fetchEconomyData]);

  const cancelMarketListing = useCallback(async (listingId: string) => {
    if (!user) return;
    const { error } = await supabase.rpc('cancel_market_listing', {
      p_user_id: user.id,
      p_listing_id: listingId
    });
    if (error) {
      toast.error("Failed to cancel listing", { description: error.message });
    } else {
      toast.success("Listing cancelled", { description: "Resources returned to cargo." });
      fetchEconomyData();
      const { data: inv } = await supabase.from('user_resources').select('*').eq('user_id', user.id);
      if (inv) setUserResources(inv.map(r => ({ userId: r.user_id, resourceType: r.resource_type, amount: r.amount })));
    }
  }, [user, fetchEconomyData]);

  const buyMarketListing = useCallback(async (listingId: string, amount: number) => {
    if (!user) return;
    const { error } = await supabase.rpc('buy_market_listing', {
      p_buyer_id: user.id,
      p_listing_id: listingId,
      p_amount: amount
    });
    if (error) {
      toast.error("Purchase failed", { description: error.message });
    } else {
      toast.success("Purchase successful!", { description: "Resources added to cargo." });
      const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
      if (profile) setSc(profile.credits);
      logAction('market_purchase', `Acquired Resources: ${amount} units`, `Successfully procured ${amount} units from the galactic exchange.`);
      fetchEconomyData();
      const { data: inv } = await supabase.from('user_resources').select('*').eq('user_id', user.id);
      if (inv) setUserResources(inv.map(r => ({ userId: r.user_id, resourceType: r.resource_type, amount: r.amount })));
    }
  }, [user, fetchEconomyData]);

  const buyFromNPC = useCallback(async (resourceType: string, amount: number, pricePerUnit: number) => {
    if (!user) return;
    const totalCost = amount * pricePerUnit;
    if (sc < totalCost) {
      toast.error("Insufficient Funds", { description: "You cannot afford this requisition." });
      return;
    }
    const { error } = await supabase.rpc('buy_from_npc', {
      p_buyer_id: user.id,
      p_resource_type: resourceType,
      p_amount: amount,
      p_price_per_unit: pricePerUnit
    });
    if (error) {
      toast.error("Purchase failed", { description: error.message });
    } else {
      toast.success(`Requisitioned ${amount}× ${resourceType}`, { description: "Resources added to cargo hold." });
      setSc(prev => prev - totalCost);
      logAction('market_purchase_npc', `Requisition: ${amount} units`, `Procured ${amount} units of ${resourceType} from Hegemony supplies.`);
      fetchEconomyData();
      const { data: inv } = await supabase.from('user_resources').select('*').eq('user_id', user.id);
      if (inv) setUserResources(inv.map(r => ({ userId: r.user_id, resourceType: r.resource_type, amount: r.amount })));
    }
  }, [user, sc, logAction, fetchEconomyData]);

  const sellToNPC = useCallback(async (resourceType: string, amount: number, pricePerUnit: number) => {
    if (!user) return;
    const { error } = await supabase.rpc('sell_to_npc', {
      p_user_id: user.id,
      p_resource_type: resourceType,
      p_amount: amount,
      p_price_per_unit: pricePerUnit
    });
    if (error) {
      toast.error("Trade failed", { description: error.message });
    } else {
      toast.success(`Sold ${amount}× ${resourceType} to Galactic NPC`, { description: `Gained ${(amount * pricePerUnit).toLocaleString()} SC.` });
      fetchEconomyData();
      const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
      if (profile) setSc(profile.credits);
      const { data: inv } = await supabase.from('user_resources').select('*').eq('user_id', user.id);
      if (inv) setUserResources(inv.map(r => ({ userId: r.user_id, resourceType: r.resource_type, amount: r.amount })));
      grantXP('market_trade'); // Tiny XP for trade
    }
  }, [user, fetchEconomyData, grantXP]);

  const leaveJob = useCallback(async () => {
    if (!user || !currentJob) return;

    const { error } = await supabase
      .from('factory_workers')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      toast.error("Resignation failed", { description: error.message });
    } else {
      setCurrentJob(null);
      toast.success("Resigned from position", { description: "You are now seeking new employment." });
    }
  }, [user, currentJob]);




  // Arrive at destination
  useEffect(() => {
    if (travel && currentTime >= travel.endTime) {
      const targetId = travel.targetId;
      const travelType = travel.type ?? "inter";

      if (travelType === "intra") {
        setPlayerBodyId(targetId);
        setExploredBodyIds(prev => {
          const next = new Set(prev);
          next.add(`${playerSystemId}:${targetId}`);
          return next;
        });
        setTravel(null);
        toast.success("Arrival confirmed", {
          description: `Vessel has entered orbit around ${targetId === "star" ? "the system star" : targetId}.`
        });
      } else {
        const fromId = playerSystemId;
        setPlayerSystemId(targetId);
        setPlayerBodyId("star"); // Default to star on jump arrival
        setTravel(null);
        
        // Set arrival sequence (approx 10s sub-light transit to star)
        setArrival({ fromId, startTime: currentTime, duration: 10000 });

        setExploredSystemIds(prev => {
          const next = new Set(prev);
          if (!next.has(targetId)) {
            next.add(targetId);
            logAction('exploration', `System Discovered: ${galaxy.systemById[targetId]?.name || targetId}`, `Successfully mapped the ${targetId} sector and established orbital reconnaissance.`);
            const explorationBonus = computeSkillBonus('exploration_xp_bonus', playerSkills);
            grantXP('system_explored', explorationBonus);
          }
          return next;
        });
        setExploredBodyIds(prev => {
          const next = new Set(prev);
          next.add(`${targetId}:star`);
          return next;
        });
      }
    }
  }, [travel, currentTime, playerSystemId]);

  // --- BACKGROUND PRE-CACHING ---
  // During hyperspace jumps, use the transit time to pre-synthesize audio for the target system
  useEffect(() => {
    if (travel && travel.type === 'inter') {
      const targetSystem = galaxy.systemById[travel.targetId];
      if (!targetSystem) return;

      const synthesizeNext = async () => {
        // Find an un-cached body type in the destination system
        const bodiesToCache = targetSystem.bodies.map(b => ({
          type: b.type,
          subtype: b.subtype,
          starType: targetSystem.starType
        }));
        
        // Also cache the star itself
        bodiesToCache.push({ type: 'star', subtype: undefined, starType: targetSystem.starType });

        // Get AudioContext (from global if available, or create a temporary one)
        // Note: In a browser, we usually need a user gesture to start the real context, 
        // but for offline synthesis (creating buffers) we can often use an OfflineAudioContext or a dormant one.
        const ctx = (window as any)._galaxyAudioContext || new (window.AudioContext || (window as any).webkitAudioContext)();
        if (!ctx) return;
        (window as any)._galaxyAudioContext = ctx;

        // Perform synthesis incrementally to avoid blocking the main thread even during jumps
        for (const item of bodiesToCache) {
          try {
            // Import dynamically from UnifiedMap (if we export it)
            const { createCelestialBuffer } = await import('./components/UnifiedMap');
            createCelestialBuffer(ctx, item.type, item.subtype, item.starType);
          } catch (e) {
            console.warn("Pre-cache failed for", item.type, e);
          }
          // Small yield to allow UI/animations to stay smooth during jump
          await new Promise(r => setTimeout(r, 10));
        }
      };

      synthesizeNext();
    }
  }, [travel, galaxy]);

  // Clear arrival after duration
  useEffect(() => {
    if (arrival && currentTime >= arrival.startTime + arrival.duration) {
      setArrival(null);
    }
  }, [arrival, currentTime]);

  const openSystem = useCallback((id: string) => {
    setSystemId(id);
    setBodyId(null);
    setView("system");
  }, []);

  const selectSystem = useCallback((id: string | null) => {
    setSystemId(id);
    setBodyId(null);
  }, []);

  const openBody = useCallback((id: string) => {
    setBodyId(id);
    setView("body");
  }, []);

  const openShip = useCallback(() => {
    setBodyId("ship");
    setView("ship");
  }, []);

  const backToGalaxy = useCallback(() => {
    setView("galaxy");
    setSystemId(null);
    setBodyId(null);
  }, []);

  const backToSystem = useCallback(() => {
    setView("system");
    setBodyId(null);
  }, []);

  const toggleFilter = <K extends keyof FilterState>(kind: K, value: FilterState[K] extends Set<infer V> ? V : never) => {
    setFilters((prev) => {
      const next = new Set(prev[kind] as Set<unknown>);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...prev, [kind]: next } as FilterState;
    });
  };

  const systemMatchesFilter = useCallback(
    (s: StarSystem) =>
      filters.contest.has(s.contest) &&
      filters.economy.has(s.economy) &&
      filters.starType.has(s.starType),
    [filters]
  );

  const effectiveGalaxy = useMemo(() => {
    const combinedEmpires = [...galaxy.empires, ...playerEmpires];
    
    // Create virtual empires for bodies under provisional governance
    Object.keys(bodyGovernance).forEach(bodyId => {
       const gov = bodyGovernance[bodyId];
       if (gov.status === 'governed' && !combinedEmpires.find(e => e.id === bodyId)) {
          // Find body name for the provisional council name
          let bodyName = "Unknown";
          for (const sys of galaxy.systems) {
             const b = sys.bodies.find(b => b.id === bodyId);
             if (b) { bodyName = b.name; break; }
          }
          
          combinedEmpires.push({
             id: bodyId,
             name: `${bodyName} Provisional Council`,
             tag: 'PRV',
             hue: 0,
             logo: { symbol: 'Scale', pattern: 'dots', secondaryHue: 0 },
             government: {
                type: 'Parliamentary republic',
                president: null,
                vicePresident: null,
                ministers: [],
                council: { totalSeats: 20, factions: [], seats: [] }
             }
          });
       }
    });

    return {
      ...galaxy,
      empires: combinedEmpires
    };
  }, [galaxy, playerEmpires, bodyGovernance]);

  return {
    galaxy: effectiveGalaxy,
    view,
    system,
    body,
    hoverSystemId,
    setHoverSystemId,
    filters,
    toggleFilter,
    knownSystemIds,
    systemMatchesFilter,
    playerName,
    setPlayerName,
    playerLevel,
    playerXP,
    playerAvatar,
    playerPartyIcon,
    playerPartyHue,
    xpToNextLevel: playerLevel * 1000,
    setPlayerAvatar,
    shipConfig,
    setShipConfig,
    setPage,
    page,
    selectedEmpireId,
    setSelectedEmpireId,
    openSystem,
    selectSystem,
    openBody,
    openShip,
    backToGalaxy,
    backToSystem,
    playerSystemId,
    playerBodyId,
    travel,
    arrival,
    getJumpCost,
    initiateJump,
    initiateTravelToBody,
    currentTime,
    exploredSystemIds,
    exploredBodyIds,
    fogOfWar,
    setFogOfWar,
    instantJump,
    setInstantJump,
    resetGalaxy,
    seed: UNIVERSAL_SEED,
    ap,
    setAp,
    sc,
    setSc,
    audioEnabled,
    setAudioEnabled,
    musicVolume,
    setMusicVolume,
    sfxVolume,
    setSfxVolume,
    fxVolume,
    setFxVolume,
    theme,
    setTheme,
    user,
    vesselId,
    initialDataLoaded,
    sessionLoading,
    otherPlayers,
    factories,
    userFactories,
    bodyResources,
    userResources,
    currentJob,
    factoryInputStorage,
    depositFactoryInput,
    buildFactory,
    applyForJob,
    workJob,
    leaveJob,
    collectFactory,
    upgradeFactory,
    updateFactorySettings,
    cargoCapacity,
    marketListings,
    createMarketListing,
    cancelMarketListing,
    buyMarketListing,
    depositToFactoryTreasury,
    buyFromNPC,
    sellToNPC,
    npcMarketState,
    articles: filteredArticles,
    allArticles: articles,
    socialStats,
    createArticle,
    voteArticle,
    postComment,
    userLogs,
    fleetCount,
    logAction,
    cargoUsed: userResources.reduce((sum, r) => sum + r.amount, 0),
    parties,
    userParty,
    userPartyMember,
    createParty,
    joinParty,
    applyToParty,
    fetchParties,
    userResidency,
    residencyApplications,
    claimResidency,
    activeElections,
    userVotes,
    voteForStateParty,
    playerEmpires,
    playerEmpiresFull,
    bodyGovernance,
    userProfiles,
    electionCandidates,
    electionBallots,
    ministerialAssignments,
    nextApTick,
    onlinePlayerCount,
    isAdmin,

    // XP & Skill Tree
    playerSkills,
    skillTree: SKILL_TREE,
    grantXP,
    unlockSkill: async (skillId: string) => {
      if (!user) return;
      const { data, error } = await supabase.rpc('unlock_skill', {
        p_user_id: user.id,
        p_skill_id: skillId
      });
      if (error) {
        if (error.message.includes('insufficient_skill_points')) {
          toast.error("Not enough skill points!", { description: "Reach a higher level to earn more skill points." });
        } else if (error.message.includes('already_unlocked')) {
          toast.error("Already unlocked!");
        } else {
          toast.error("Failed to unlock skill", { description: error.message });
        }
        return;
      }
      setPlayerSkills(prev => [...prev, skillId]);
      const skill = SKILL_TREE.find(s => s.id === skillId);
      toast.success(`Skill Unlocked: ${skill?.name}`, { description: skill?.effect });
      // Apply immediate stat bonuses
      if (skill?.bonus.key === 'cargo_capacity_bonus') {
        setCargoCapacity(prev => prev + skill.bonus.value);
      }
    },

    initiateGovernance: async (bodyId: string) => {
      if (!user) return;
      // Check if resident
      if (userResidency?.bodyId !== bodyId) {
        toast.error("You must be a permanent resident to initiate governance.");
        return;
      }
      const endTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase.from('body_governance').upsert({
        body_id: bodyId,
        status: 'governed',
        election_end_time: endTime
      }, { onConflict: 'body_id' });
      if (error) {
        toast.error("Failed to initiate governance: " + error.message);
      } else {
        toast.success("Governance initiated! First election cycle has started.");
        // Immediately update local state so the UI reacts without a page reload
        setBodyGovernance(prev => ({
          ...prev,
          [bodyId]: { status: 'governed', electionEndTime: endTime }
        }));
      }
    },

    proposeStateFormation: async (bodyId: string, empireName: string, empireTag: string, hue: number) => {
      if (!user) return;
      // Must be a resident
      if (userResidency?.bodyId !== bodyId) {
        toast.error("You must be a resident to propose state formation.");
        return;
      }
      // Must be in provisional status
      const gov = bodyGovernance[bodyId];
      if (!gov || gov.status !== 'governed') {
        toast.error("Governance must be initiated before proposing state formation.");
        return;
      }
      // Can't have existing pending referendum
      if (gov.formationReferendumId) {
        toast.error("A formation referendum is already underway.");
        return;
      }
      const endsAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const { data: ref, error } = await supabase.from('state_formation_votes').insert({
        body_id: bodyId,
        empire_name: empireName,
        empire_tag: empireTag,
        hue,
        proposed_by: user.id,
        ends_at: endsAt
      }).select().single();
      if (error) {
        toast.error("Failed to propose formation: " + error.message);
        return;
      }
      // Link referendum to body governance
      await supabase.from('body_governance').update({ formation_referendum_id: ref.id }).eq('body_id', bodyId);
      setBodyGovernance(prev => ({ ...prev, [bodyId]: { ...prev[bodyId], formationReferendumId: ref.id } }));
      const newRef: StateFormationVote = {
        id: ref.id, bodyId: ref.body_id, empireName: ref.empire_name, empireTag: ref.empire_tag,
        hue: ref.hue, proposedBy: ref.proposed_by, endsAt: ref.ends_at,
        status: 'pending', yesVotes: 0, noVotes: 0, createdAt: ref.created_at
      };
      setFormationReferendums(prev => [...prev, newRef]);
      toast.success("State formation referendum opened!", { description: `Residents have 24 hours to vote. Closes ${new Date(endsAt).toLocaleString()}.` });
    },

    voteOnFormation: async (referendumId: string, vote: 'yes' | 'no') => {
      if (!user) return;
      if (userFormationBallots[referendumId]) {
        toast.error("You have already cast your ballot.");
        return;
      }
      const { error } = await supabase.from('state_formation_ballots').insert({
        referendum_id: referendumId,
        voter_id: user.id,
        vote
      });
      if (error) {
        toast.error("Failed to cast vote: " + error.message);
        return;
      }
      // Update local ballot cache
      setUserFormationBallots(prev => ({ ...prev, [referendumId]: vote }));
      // Optimistically update vote counts
      setFormationReferendums(prev => prev.map(r => r.id !== referendumId ? r : {
        ...r,
        yesVotes: vote === 'yes' ? r.yesVotes + 1 : r.yesVotes,
        noVotes:  vote === 'no'  ? r.noVotes  + 1 : r.noVotes,
      }));
      toast.success(vote === 'yes' ? "Ballot cast: YES" : "Ballot cast: NO");

      // Check if referendum has elapsed and resolve it
      const ref = formationReferendums.find(r => r.id === referendumId);
      if (ref && new Date(ref.endsAt) <= new Date()) {
        const totalYes = ref.yesVotes + (vote === 'yes' ? 1 : 0);
        const totalNo  = ref.noVotes  + (vote === 'no'  ? 1 : 0);
        if (totalYes > totalNo) {
          // Passed — create empire and start primary election
          const { data: empire, error: empireErr } = await supabase.from('player_empires').insert({
            name: ref.empireName, tag: ref.empireTag, hue: ref.hue,
            founder_id: user.id, capital_body_id: ref.bodyId, phase: 'primary'
          }).select().single();
          if (empireErr) { toast.error("Failed to form empire: " + empireErr.message); return; }
          // Update body governance
          await supabase.from('body_governance').update({
            status: 'imperial', empire_id: empire.id, formation_referendum_id: null
          }).eq('body_id', ref.bodyId);
          setBodyGovernance(prev => ({ ...prev, [ref.bodyId]: { status: 'imperial', electionEndTime: null, formationReferendumId: null, empireId: empire.id } }));
          // Mark referendum passed
          await supabase.from('state_formation_votes').update({ status: 'passed' }).eq('id', referendumId);
          setFormationReferendums(prev => prev.filter(r => r.id !== referendumId));
          // Start primary election (48hrs)
          const primaryEnd = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
          await supabase.from('state_elections').insert({
            state_id: empire.id, election_type: 'parliamentary', start_time: new Date().toISOString(), end_time: primaryEnd, status: 'active'
          });
          toast.success(`${ref.empireName} has been formally established!`, { description: "Primary elections are now open. Parties may register candidates." });
        } else {
          // Failed
          await supabase.from('state_formation_votes').update({ status: 'failed' }).eq('id', referendumId);
          await supabase.from('body_governance').update({ formation_referendum_id: null }).eq('body_id', ref.bodyId);
          setFormationReferendums(prev => prev.filter(r => r.id !== referendumId));
          setBodyGovernance(prev => ({ ...prev, [ref.bodyId]: { ...prev[ref.bodyId], formationReferendumId: null } }));
          toast.error("Referendum failed.", { description: "The motion to form a state did not pass." });
        }
      }
    },

    formationReferendums,
    userFormationBallots,
    resolveFormationReferendum: async (referendumId: string) => {
      if (!user) return;
      const ref = formationReferendums.find(r => r.id === referendumId);
      if (!ref) return;
      if (new Date(ref.endsAt) > new Date()) { toast.error("Referendum has not ended yet."); return; }

      if (ref.yesVotes > ref.noVotes) {
        // Passed — create empire and start primary election
        const { data: empire, error: empireErr } = await supabase.from('player_empires').insert({
          name: ref.empireName, tag: ref.empireTag, hue: ref.hue,
          founder_id: user.id, capital_body_id: ref.bodyId, phase: 'primary'
        }).select().single();
        if (empireErr) { toast.error("Failed to form empire: " + empireErr.message); return; }
        // Update body governance
        await supabase.from('body_governance').update({
          status: 'imperial', empire_id: empire.id, formation_referendum_id: null
        }).eq('body_id', ref.bodyId);
        setBodyGovernance(prev => ({ ...prev, [ref.bodyId]: { status: 'imperial', electionEndTime: null, formationReferendumId: null, empireId: empire.id } }));
        // Mark referendum passed
        await supabase.from('state_formation_votes').update({ status: 'passed' }).eq('id', referendumId);
        setFormationReferendums(prev => prev.filter(r => r.id !== referendumId));
        // Start primary election (48hrs)
        const primaryEnd = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
        await supabase.from('state_elections').insert({
          state_id: empire.id, election_type: 'parliamentary', start_time: new Date().toISOString(), end_time: primaryEnd, status: 'active'
        });
        toast.success(`${ref.empireName} has been formally established!`, { description: "Primary elections are now open. Parties may register candidates." });
      } else {
        // Failed
        await supabase.from('state_formation_votes').update({ status: 'failed' }).eq('id', referendumId);
        await supabase.from('body_governance').update({ formation_referendum_id: null }).eq('body_id', ref.bodyId);
        setFormationReferendums(prev => prev.filter(r => r.id !== referendumId));
        setBodyGovernance(prev => ({ ...prev, [ref.bodyId]: { ...prev[ref.bodyId], formationReferendumId: null } }));
        toast.error("Referendum failed.", { description: "The motion to form a state did not pass." });
      }
    },

    // --- Primary Election (Parties compete for parliamentary seats) ---
    registerPartyForElection: async (electionId: string, partyId: string) => {
      if (!user) return;
      const already = electionCandidates.some(c => c.electionId === electionId && c.partyId === partyId);
      if (already) { toast.error("Party already registered for this election."); return; }
      const { data, error } = await supabase.from('election_candidates').insert({ election_id: electionId, party_id: partyId }).select().single();
      if (error) { toast.error("Registration failed: " + error.message); return; }
      setElectionCandidates(prev => [...prev, { id: data.id, electionId, partyId, userId: null, voteCount: 0, registeredAt: data.registered_at }]);
      toast.success("Party registered for primary election!");
    },

    voteInElection: async (electionId: string, candidateId: string) => {
      if (!user) return;
      if (electionBallots[electionId]) { toast.error("You have already voted in this election."); return; }
      const { error } = await supabase.from('election_ballots').insert({ election_id: electionId, voter_id: user.id, candidate_id: candidateId });
      if (error) { toast.error("Vote failed: " + error.message); return; }
      // Increment vote count on candidate
      await supabase.from('election_candidates').update({ vote_count: (electionCandidates.find(c => c.id === candidateId)?.voteCount || 0) + 1 }).eq('id', candidateId);
      setElectionBallots(prev => ({ ...prev, [electionId]: candidateId }));
      setElectionCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, voteCount: c.voteCount + 1 } : c));
      toast.success("Ballot cast!");
    },

    resolveElection: async (electionId: string) => {
      if (!user) return;
      const election = activeElections.find(e => e.id === electionId);
      if (!election) return;
      if (new Date(election.endTime) > new Date()) { toast.error("Election has not ended yet."); return; }
      const candidates = electionCandidates.filter(c => c.electionId === electionId).sort((a, b) => b.voteCount - a.voteCount);
      if (candidates.length === 0) { toast.error("No candidates registered."); return; }

      if (election.electionType === 'parliamentary') {
        // Distribute seats proportionally (D'Hondt-style simplified)
        const TOTAL_SEATS = 20;
        const totalVotes = candidates.reduce((s, c) => s + c.voteCount, 0);
        const seats: { partyId: string; seats: number }[] = candidates.map(c => ({
          partyId: c.partyId!,
          seats: totalVotes > 0 ? Math.round((c.voteCount / totalVotes) * TOTAL_SEATS) : Math.floor(TOTAL_SEATS / candidates.length)
        }));
        // Insert seat records
        for (const s of seats) {
          await supabase.from('state_council_seats').upsert({ state_id: election.stateId, party_id: s.partyId, seat_index: seats.indexOf(s) + 1, occupant_name: s.seats + ' seats' }, { onConflict: 'id' });
        }
        // Mark election finished, transition empire to 'leader' phase, start leader election
        await supabase.from('state_elections').update({ status: 'finished' }).eq('id', electionId);
        await supabase.from('player_empires').update({ phase: 'leader' }).eq('id', election.stateId);
        const leaderEnd = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await supabase.from('state_elections').insert({ state_id: election.stateId, election_type: 'presidential', start_time: new Date().toISOString(), end_time: leaderEnd, status: 'active' });
        setActiveElections(prev => prev.filter(e => e.id !== electionId));
        setPlayerEmpiresFull(prev => prev.map(e => e.id === election.stateId ? { ...e, phase: 'leader' } : e));
        toast.success("Primary election resolved! Leader election now open.", { description: "Citizens nominate and vote for Head of State over the next 24 hours." });
      } else if (election.electionType === 'presidential') {
        // Winner is top vote-getter
        const winner = candidates[0];
        if (!winner?.userId) { toast.error("No candidates stood for leader election."); return; }
        await supabase.from('player_empires').update({ leader_id: winner.userId, phase: 'active' }).eq('id', election.stateId);
        await supabase.from('state_elections').update({ status: 'finished' }).eq('id', electionId);
        setPlayerEmpiresFull(prev => prev.map(e => e.id === election.stateId ? { ...e, phase: 'active', leaderId: winner.userId } : e));
        setActiveElections(prev => prev.filter(e => e.id !== electionId));
        toast.success("Head of State elected!", { description: "The leader may now appoint ministerial roles." });
      }
    },

    nominateForLeaderElection: async (electionId: string) => {
      if (!user) return;
      const already = electionCandidates.some(c => c.electionId === electionId && c.userId === user.id);
      if (already) { toast.error("You are already nominated."); return; }
      const { data, error } = await supabase.from('election_candidates').insert({ election_id: electionId, user_id: user.id }).select().single();
      if (error) { toast.error("Nomination failed: " + error.message); return; }
      setElectionCandidates(prev => [...prev, { id: data.id, electionId, partyId: null, userId: user.id, voteCount: 0, registeredAt: data.registered_at }]);
      toast.success("You are now a candidate for Head of State!");
    },

    // --- Cabinet ---
    assignMinisterialRole: async (empireId: string, targetUserId: string, roleName: string) => {
      if (!user) return;
      const emp = playerEmpiresFull.find(e => e.id === empireId);
      if (!emp || emp.leaderId !== user.id) { toast.error("Only the Head of State can appoint ministers."); return; }
      const { data, error } = await supabase.from('ministerial_assignments').upsert({ empire_id: empireId, user_id: targetUserId, role_name: roleName, appointed_by: user.id }, { onConflict: 'empire_id,role_name' }).select().single();
      if (error) { toast.error("Appointment failed: " + error.message); return; }
      setMinisterialAssignments(prev => [...prev.filter(m => !(m.empireId === empireId && m.roleName === roleName)), { id: data.id, empireId, userId: targetUserId, roleName, appointedBy: user.id, appointedAt: data.appointed_at }]);
      toast.success(`Ministerial appointment confirmed: ${roleName}`);
    },

    removeMinisterialRole: async (assignmentId: string) => {
      if (!user) return;
      const assignment = ministerialAssignments.find(m => m.id === assignmentId);
      if (!assignment) return;
      const emp = playerEmpiresFull.find(e => e.id === assignment.empireId);
      if (!emp || emp.leaderId !== user.id) { toast.error("Only the Head of State can remove ministers."); return; }
      const { error } = await supabase.from('ministerial_assignments').delete().eq('id', assignmentId);
      if (error) { toast.error("Removal failed: " + error.message); return; }
      setMinisterialAssignments(prev => prev.filter(m => m.id !== assignmentId));
      toast.success("Minister removed.");
    },

    completeOnboarding: async (name: string, avatar: string, config: ShipConfiguration) => {
      if (!user) return;
      
      // 1. Create/Update Profile
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        commander_name: name,
        avatar_url: avatar,
        credits: 15000,
        level: 1,
        xp: 0,
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      });
      if (profileError) { toast.error("Failed to create profile: " + profileError.message); return; }

      // 2. Create Vessel
      const { data: vessel, error: vesselError } = await supabase.from('vessels').insert({
        user_id: user.id,
        name: config.name,
        primary_color: config.primaryColor,
        accent_color: config.accentColor,
        hull_id: config.hullId,
        wings_id: config.wingsId,
        engines_id: config.enginesId,
        bridge_id: config.bridgeId,
        is_active: true
      }).select().single();
      
      if (vesselError) { toast.error("Failed to commission vessel: " + vesselError.message); return; }

      setPlayerName(name);
      setPlayerAvatar(avatar);
      setShipConfig(config);
      setVesselId(vessel.id);
      setSc(15000);
      toast.success("Welcome to the Hegemony, Commander.");
    },
  };
}

export type GalaxyApp = ReturnType<typeof useGalaxyApp>;
