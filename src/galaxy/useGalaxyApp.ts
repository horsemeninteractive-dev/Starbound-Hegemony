// Central UI state for the map app. Galaxy data is generated once (deterministic).

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { generateGalaxy } from "./generate";
import type { Galaxy, Empire, StarSystem, Body, ContestState, EconomicStatus, StarType, PlanetSubtype, Installation, BodyResource, UserResource, FactoryWorker, MarketListing, Party, PartyMember, PartyRole, Residency, ResidencyApplication, StateElection, StateVote, StateFormationVote, ElectionCandidate, MinisterialAssignment, PlayerEmpire, Vessel, VesselClass, Fleet, FleetEntity, ConstructionQueueEntry, SiloInventoryEntry, SiteOfInterest, SurveyMission } from "./types";
import { STAR_META, CONTEST_META, ECON_META, BODY_META, STAR_BASE_SIZE, getOrbitalSpeed, getBodyPosition, RESOURCE_META, RICHNESS_VALUES, T2_RESOURCES, T3_RESOURCES, INFRA_META, SHIP_BLUEPRINTS, ShipBlueprintKey } from "./meta";
import { ShipConfiguration, DEFAULT_SHIP_CONFIG, SHIP_PARTS } from "./shipPresets";

export type ViewMode = "galaxy" | "system" | "body" | "ship";
export type DisplayLayer = "hyperlanes" | "sectorBorders" | "sectorLabels" | "objectLabels" | "habitableZones" | "orbitPaths" | "weatherSystems" | "cityLights" | "empireColors" | "incursionLabels";

export interface FilterState {
  contest: Set<ContestState>;
  economy: Set<EconomicStatus>;
  starType: Set<StarType>;
  layers: Set<DisplayLayer>;
}

const ALL_CONTEST: ContestState[] = ["controlled", "contested", "anarchic", "frontier"];
const ALL_ECON: EconomicStatus[] = ["boom", "stable", "recession", "blockaded", "untapped"];
const ALL_STAR: StarType[] = ["O", "B", "A", "F", "G", "K", "M", "whitedwarf", "neutron", "pulsar", "binary", "trinary", "blackhole", "whitehole", "magnetar", "protostar", "dyson_swarm"];
const ALL_LAYERS: DisplayLayer[] = ["hyperlanes", "sectorBorders", "sectorLabels", "objectLabels", "habitableZones", "orbitPaths", "weatherSystems", "cityLights", "empireColors", "incursionLabels"];

import avatar from "@/assets/avatar.png";
import avatar_alt1 from "@/assets/avatar_alt1.png";
import avatar_alt2 from "@/assets/avatar_alt2.png";

import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { computeSkillBonus, SKILL_TREE, XP_REWARDS, type XPReason } from "./skills";
import { WIKI_DATA } from './components/WikiView';

export function useGalaxyApp(initialSeed = 20260423) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const [vesselId, setVesselId] = useState<string | null>(null);
  const [userVessels, setUserVessels] = useState<Vessel[]>([]);
  const [selectedVesselId, setSelectedVesselId] = useState<string | null>(null);
  const [isFleetSidebarOpen, setIsFleetSidebarOpen] = useState(false);
  const [isPlayerStatusSidebarOpen, setIsPlayerStatusSidebarOpen] = useState(false);
  const [otherPlayers, setOtherPlayers] = useState<any[]>([]);

  // Debug / Admin states
  const [adminDebugShowAllSites, setDebugShowAllSites] = useState(false);
  const [adminDebugInstantBuilds, setInstantBuilds] = useState(false);

  // Bake in a universal galaxy seed so all players see the exact same universe
  const UNIVERSAL_SEED = 20260423;
  const galaxy: Galaxy = useMemo(() => generateGalaxy(UNIVERSAL_SEED), []);


  const selectedFleetId = useMemo(() => {
    const v = userVessels.find(v => v.id === selectedVesselId) || userVessels[0];
    return v?.fleetId || null;
  }, [userVessels, selectedVesselId]);

  const vessel = useMemo(() => userVessels.find(v => v.id === selectedVesselId) || userVessels[0] || null, [userVessels, selectedVesselId]);

  const [view, setView] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("view") as ViewMode;
    if (saved === "galaxy" || saved === "system") return saved;
    return "galaxy";
  });
  // Derived positions based on selected vessel
  const [playerSystemIdState, setPlayerSystemId] = useState<string>("sys-center");
  const [playerBodyIdState, setPlayerBodyId] = useState<string>("star");

  const playerSystemId = playerSystemIdState;
  const playerBodyId = playerBodyIdState;

  const [exploredSystemIds, setExploredSystemIds] = useState<Set<string>>(new Set(["sys-center"]));
  const [exploredBodyIds, setExploredBodyIds] = useState<Set<string>>(new Set(["sys-center:star"]));
  const [fogOfWar, setFogOfWarState] = useState(() => localStorage.getItem("fogOfWar") !== "false");
  const [instantJump, setInstantJumpState] = useState(() => localStorage.getItem("instantJump") === "true");
  
  const [travel, setTravel] = useState<{ 
    targetId: string; 
    startTime: number; 
    endTime: number; 
    type?: "inter" | "intra";
    startPos?: { x: number; z: number }; // Relative to system center
  } | null>(null);
  const [arrival, setArrival] = useState<{ fromId: string; startTime: number; duration: number } | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const [ap, setAp] = useState(360);
  const [sc, setSc] = useState(15000);

  const [playerName, setPlayerName] = useState("Majora");
  const [playerLevel, setPlayerLevel] = useState(1);
  const [playerXP, setPlayerXP] = useState(0);
  const [playerAvatar, setPlayerAvatar] = useState(avatar);
  const [shipConfig, setShipConfig] = useState<ShipConfiguration>(DEFAULT_SHIP_CONFIG);
  const [page, setPage] = useState<"map" | "profile" | "articles" | "market" | "factories" | "fleets" | "party" | "skills" | "shipyard" | "empire" | "wiki">("map");
  const [selectedEmpireId, setSelectedEmpireId] = useState<string | null>(null);
  const [systemId, setSystemId] = useState<string | null>(() => localStorage.getItem("systemId"));
  const [bodyId, setBodyId] = useState<string | null>(() => localStorage.getItem("bodyId"));
  const [hoverSystemId, setHoverSystemId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // Sync local active vessel position back into the userVessels fleet array for UI consistency
  useEffect(() => {
    if (vesselId && initialDataLoaded) {
      setUserVessels(prev => {
        const index = prev.findIndex(v => v.id === vesselId);
        if (index === -1) return prev;
        const current = prev[index];
        if (current.systemId === playerSystemIdState && current.bodyId === playerBodyIdState) return prev;
        
        const next = [...prev];
        next[index] = { ...current, systemId: playerSystemIdState, bodyId: playerBodyIdState };
        return next;
      });
    }
  }, [playerSystemIdState, playerBodyIdState, vesselId, initialDataLoaded, setUserVessels]);
  
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
  const [viewedUserId, setViewedUserId] = useState<string | null>(null);
  const [viewedPartyId, setViewedPartyId] = useState<string | null>(null);
  const [viewedStateId, setViewedStateId] = useState<string | null>(null);
  const [returnPage, setReturnPage] = useState<"map" | "profile" | "articles" | "market" | "factories" | "fleets" | "party" | "skills" | "shipyard" | "empire" | "wiki">("map");
  const [wikiSectionId, setWikiSectionId] = useState<string>("vision");
  const [searchResults, setSearchResults] = useState<{ 
    users: any[], 
    parties: any[], 
    states: any[],
    systems?: any[],
    bodies?: any[],
    wiki?: any[]
  }>({ users: [], parties: [], states: [], systems: [], bodies: [], wiki: [] });
  const [isSearching, setIsSearching] = useState(false);

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
  const [partyInvitations, setPartyInvitations] = useState<any[]>([]);
  const [npcMarketState, setNpcMarketState] = useState<Record<string, { basePrice: number, currentPrice: number, lastUpdated: string }>>({});
  
  const [userFleets,        setUserFleets]        = useState<FleetEntity[]>([]);
  const [constructionQueue, setConstructionQueue] = useState<ConstructionQueueEntry[]>([]);
  const [siloInventory,     setSiloInventory]     = useState<SiloInventoryEntry[]>([]);
  const [selectedEntityId,  setSelectedEntityId]  = useState<string | null>(null);
  const [isTrackingShip,    setIsTrackingShip]    = useState<boolean>(false);
  
  const [sitesOfInterest, setSitesOfInterest] = useState<SiteOfInterest[]>([]);
  const [surveyMissions, setSurveyMissions] = useState<SurveyMission[]>([]);

  // Action Points Tick Logic
  const AP_REGEN_INTERVAL = 300000; // 5 minutes
  const [lastApTick, setLastApTick] = useState(Date.now());
  const [nextApTick, setNextApTick] = useState(Date.now() + AP_REGEN_INTERVAL);
  const [onlinePlayerCount, setOnlinePlayerCount] = useState(1);

  // Shared mapper: DB factory row → Installation
  const mapFactory = (f: any): Installation => {
    const storageTier = f.storage_tier ?? 0;
    const baseCapacity = [100, 300, 750, 2000, 5000][Math.min(storageTier, 4)];
    const storageCapacity = f.storage_capacity && f.storage_capacity > 0 ? f.storage_capacity : baseCapacity;
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

  const lastUserIdRef = useRef<string | null>(null);
  const lastLoadedPositionRef = useRef<{systemId: string, bodyId: string} | null>(null);
  const isEconomyLoadingRef = useRef(false);
  const lastEconomyFetchRef = useRef<number>(0);
  const profileCacheRef = useRef<Record<string, any>>({});
  const isFleetsLoadingRef = useRef(false);
  // "sys-center" initial state from overwriting the real saved position on refresh.
  const positionReadyRef = useRef<boolean>(false);

  // 2. Load User Data from Supabase
  useEffect(() => {
    if (!user) {
      lastUserIdRef.current = null;
      positionReadyRef.current = false;
      setInitialDataLoaded(false);
      return;
    }

    if (user.id === lastUserIdRef.current && initialDataLoaded) return;
    lastUserIdRef.current = user.id;

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

          // Load AP from DB and compute regen since last tick.
          // Rate: +1 AP per 5 minutes (AP_REGEN_INTERVAL = 300000 ms) — matches the live timer.
          const dbAp = profile.action_points ?? 360;
          const lastRegenAt = profile.last_ap_regen_at ? new Date(profile.last_ap_regen_at).getTime() : Date.now();
          const ticksSinceRegen = Math.floor((Date.now() - lastRegenAt) / 300000);
          const regenAmount = ticksSinceRegen; // +1 AP per tick
          const currentAp = Math.min(360, dbAp + regenAmount);
          setAp(currentAp);
          
          const newLastRegenAt = lastRegenAt + ticksSinceRegen * 300000;
          
          if (regenAmount > 0 && currentAp > dbAp) {
             supabase.from('profiles').update({
                action_points: currentAp,
                last_ap_regen_at: new Date(newLastRegenAt).toISOString()
             }).eq('id', user.id).then();
          }

          const nextTick = newLastRegenAt + 300000;
          setLastApTick(newLastRegenAt);
          setNextApTick(Math.max(Date.now() + 1000, nextTick));

          // Extract party info
          const partyMember = profile.party_members?.[0];
          if (partyMember?.parties) {
            setPlayerPartyIcon(partyMember.parties.logo_symbol);
            setPlayerPartyHue(partyMember.parties.hue);
          } else {
            setPlayerPartyIcon(undefined);
            setPlayerPartyHue(undefined);
          }
        } else {
          // PROFILE MISSING: DB was reset!
          // Reset gameplay state to defaults so we don't resurrect stale data,
          // but we leave playerName/Avatar as-is in memory so they pre-fill the onboarding form.
          setPlayerLevel(1);
          setPlayerXP(0);
          setSc(15000);
          setCargoCapacity(5000);
          setAp(360);
          setPlayerSystemId("sys-center");
          setPlayerBodyId("star");
          setExploredSystemIds(new Set(["sys-center"]));
          setExploredBodyIds(new Set(["sys-center:star"]));
          setVesselId(null);
          setUserResidency(null);
          setCurrentJob(null);
          setPlayerSkills([]);
        }

        // Check for Campaign Reset (Epoch)
        const { data: epochData } = await supabase.from('global_config').select('value').eq('key', 'campaign_epoch').single();
        if (epochData) {
          const currentEpoch = epochData.value;
          const storedEpoch = localStorage.getItem('campaign_epoch');
          if (storedEpoch && storedEpoch !== currentEpoch) {
            console.warn("Campaign reset detected. Force reloading...");
            localStorage.setItem('campaign_epoch', currentEpoch);
            window.location.reload();
            return;
          }
          localStorage.setItem('campaign_epoch', currentEpoch);
        }

        // Load Inventory
        const { data: inv } = await supabase.from('user_resources').select('*').eq('user_id', user.id);
        if (inv) setUserResources(inv.map(r => ({ userId: r.user_id, fleetId: r.fleet_id, resourceType: r.resource_type, amount: r.amount })));

        const fetchInventory = async () => {
          if (!user) return;
          const { data: inv } = await supabase.from('user_resources').select('*').eq('user_id', user.id);
          if (inv) setUserResources(inv.map(r => ({ userId: r.user_id, fleetId: r.fleet_id, resourceType: r.resource_type, amount: r.amount })));
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


        const { data: vss } = await supabase
          .from('vessels')
          .select('*, fleets(system_id, body_id)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        // Fetch positions separately for maximum robustness
        const { data: allPositions } = await supabase
          .from('fleet_positions')
          .select('*')
          .eq('user_id', user.id);

        if (vss) {
          const mappedVessels: Vessel[] = vss.map(v => {
            const pos = (allPositions || []).find(p => p.fleet_id === v.fleet_id) || allPositions?.find(p => p.vessel_id === v.id);
            return {
              id: v.id,
              userId: v.user_id,
              name: v.name,
              fleetId: v.fleet_id,
              class: (v.vessel_class || (v.is_active ? 'commander' : 'freighter')) as VesselClass,
              systemId: pos?.system_id || (v as any).fleets?.system_id || "sys-center",
              bodyId: pos?.body_id || (v as any).fleets?.body_id || "star",
              cargoCapacity: v.cargo_capacity || (v.vessel_class === 'freighter' ? 15000 : 5000),
              status: v.status || 'idle',
              drydockId: v.drydock_id,
              health: v.health || 100,
              maxHealth: v.max_health || 100,
              config: {
                hullId: v.hull_id,
                wingsId: v.wings_id,
                enginesId: v.engines_id,
                bridgeId: v.bridge_id,
                primaryColor: v.primary_color,
                accentColor: v.accent_color,
              }
            };
          });
          setUserVessels(mappedVessels);
          
          const activeVessel = mappedVessels.find(v => (vss.find(dbV => dbV.id === v.id) as any)?.is_active);
          const currentV = activeVessel || mappedVessels[0];
          if (currentV) {
            setVesselId(currentV.id);
            setSelectedVesselId(currentV.id);
            setShipConfig(currentV.config as any);
            setPlayerSystemId(currentV.systemId);
            setPlayerBodyId(currentV.bodyId || "star");
            lastLoadedPositionRef.current = { systemId: currentV.systemId, bodyId: currentV.bodyId || "star" };
            // Mark that we now have a real DB-confirmed position — unlock the sync effect
            positionReadyRef.current = true;

            // Restore travel/arrival state from the fetched position
            const pos = allPositions?.find(p => p.vessel_id === currentV.id);
            if (pos) {
              // RESOLVE OFFLINE JOURNEY PROGRESS
              let currentSystem = pos.system_id;
              let currentPath = pos.travel_path || [];
              let startTime = Number(pos.travel_start_time);
              let now = Date.now();
              let fastForwarded = false;

              if (currentPath.length > 1 && startTime > 0) {
                while (currentPath.length > 1) {
                  const fromId = currentPath[0];
                  const toId = currentPath[1];
                  const s1 = galaxy.systemById[fromId];
                  const s2 = galaxy.systemById[toId];
                  if (!s1 || !s2) break;

                  const dist = Math.hypot(s1.pos[0] - s2.pos[0], s1.pos[1] - s2.pos[1], s1.pos[2] - s2.pos[2]);
                  const duration = (15 + dist * 1.2) * 1000;

                  if (now >= startTime + duration) {
                    // Jump finished while offline
                    currentSystem = toId;
                    currentPath.shift();
                    startTime += duration;
                    fastForwarded = true;
                  } else {
                    // Jump still in progress
                    break;
                  }
                }

                if (fastForwarded) {
                  console.log(`[Navigation] Fast-forwarded journey to ${currentSystem}. Steps remaining: ${currentPath.length - 1}`);
                  setPlayerSystemId(currentSystem);
                  setJumpPath(currentPath);
                  // Update baseline ref so we don't immediately sync back the fast-forwarded position (it will sync anyway, but this is cleaner)
                  lastLoadedPositionRef.current = { systemId: currentSystem, bodyId: pos.body_id || "star" };
                }
              }

              if (pos.travel_type) {
                // If we fast-forwarded, we need to adjust the travel state for the *current* leg
                const nextTargetId = currentPath[1];
                if (nextTargetId) {
                  const s1 = galaxy.systemById[currentSystem];
                  const s2 = galaxy.systemById[nextTargetId];
                  const dist = s1 && s2 ? Math.hypot(s1.pos[0] - s2.pos[0], s1.pos[1] - s2.pos[1], s1.pos[2] - s2.pos[2]) : 10;
                  const duration = (15 + dist * 1.2) * 1000;
                  
                  setTravel({
                    targetId: nextTargetId,
                    startTime: startTime,
                    endTime: startTime + duration,
                    type: 'inter',
                    startPos: undefined
                  });
                } else {
                  setTravel(null);
                }
              }
              if (pos.arrival_from_id) {
                setArrival({
                  fromId: pos.arrival_from_id,
                  startTime: Number(pos.arrival_start_time),
                  duration: Number(pos.arrival_duration)
                });
              }
              if (pos.travel_path) {
                setJumpPath(pos.travel_path);
              }
            }
          }
        }

        // Load Exploration — always overwrite local state with DB truth
        const { data: exploration } = await supabase
          .from('exploration_logs')
          .select('system_id, body_id')
          .eq('user_id', user.id);
        
        // Always rebuild from DB — never guard on length, so cross-device sync works
        const exploredSysSet = new Set<string>(["sys-center"]);
        const exploredBodySet = new Set<string>(["sys-center:star"]);
        if (exploration) {
          exploration.forEach(e => {
            exploredSysSet.add(e.system_id);
            exploredBodySet.add(`${e.system_id}:${e.body_id || 'star'}`);
          });
        }
        setExploredSystemIds(exploredSysSet);
        setExploredBodyIds(exploredBodySet);
        console.log(`[Exploration] Loaded ${exploredSysSet.size} systems from DB`);

        // Load unlocked skills
        const { data: skills } = await supabase
          .from('player_skills')
          .select('skill_id')
          .eq('user_id', user.id);
        if (skills) setPlayerSkills(skills.map(s => s.skill_id));

        // Load Sites of Interest
        const { data: sites } = await supabase
          .from('sites_of_interest')
          .select('*')
          .in('status', ['active', 'in_progress']);
        if (sites) {
          setSitesOfInterest(sites.map(s => ({
            id: s.id,
            bodyId: s.body_id,
            systemId: s.system_id,
            tier: s.tier,
            appearsAt: s.appears_at,
            expiresAt: s.expires_at,
            status: s.status,
            claimedByPlayerId: s.claimed_by_player_id,
            discoveredBy: s.discovered_by,
            completedBy: s.completed_by
          })));
        }

        // Load Survey Missions
        const { data: missions } = await supabase
          .from('survey_missions')
          .select('*')
          .eq('player_id', user.id);
        if (missions) {
          const mappedMissions = missions.map(m => ({
            id: m.id,
            siteId: m.site_id,
            vesselId: m.vessel_id,
            playerId: m.player_id,
            startedAt: m.started_at,
            completesAt: m.completes_at,
            status: m.status,
            rewardClaimed: m.reward_claimed,
            rewardData: m.reward_data
          }));
          setSurveyMissions(mappedMissions);

          // Check for missions completed while offline
          const now = Date.now();
          const completedWhileAway = mappedMissions.filter(m => 
            m.status === 'researching' && 
            new Date(m.completesAt).getTime() < now
          );

          if (completedWhileAway.length > 0) {
            setTimeout(() => {
              toast.success("Scientific Data Ready", {
                description: `Welcome back, Commander. ${completedWhileAway.length} survey mission(s) have completed research while you were away.`
              });
            }, 1500); // Delay slightly for effect
          }
        }

      } catch (err) {
        console.error("Error loading user data:", err);
      } finally {
        setInitialDataLoaded(true);
      }
    };

    loadData();
  }, [user]);

  // 3. Profiles Realtime Sync
  useEffect(() => {
    if (!user || !initialDataLoaded) return;

    const channel = supabase
      .channel(`public:profiles:id=eq.${user.id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles',
        filter: `id=eq.${user.id}` 
      }, (payload) => {
        const p = payload.new;
        if (p.commander_name !== undefined) setPlayerName(p.commander_name);
        if (p.avatar_url !== undefined) setPlayerAvatar(p.avatar_url);
        if (p.level !== undefined) setPlayerLevel(p.level);
        if (p.xp !== undefined) setPlayerXP(p.xp);
        if (p.credits !== undefined) setSc(p.credits);
        if (p.action_points !== undefined) setAp(p.action_points);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, initialDataLoaded]);

  // Governance Realtime Sync
  useEffect(() => {
    if (!user || !initialDataLoaded) return;

    const channel = supabase
      .channel('governance_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'state_formation_votes' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const r = payload.new;
          setFormationReferendums(prev => {
             if (prev.some(x => x.id === r.id)) return prev;
             return [...prev, {
              id: r.id, bodyId: r.body_id, empireName: r.empire_name, empireTag: r.empire_tag,
              hue: r.hue, proposedBy: r.proposed_by, endsAt: r.ends_at,
              status: r.status, yesVotes: r.yes_votes, noVotes: r.no_votes, createdAt: r.created_at
            } as StateFormationVote];
          });
        } else if (payload.eventType === 'UPDATE') {
          const r = payload.new;
          if (r.status !== 'pending') {
            setFormationReferendums(prev => prev.filter(ref => ref.id !== r.id));
          } else {
            setFormationReferendums(prev => prev.map(ref => ref.id === r.id ? {
              ...ref,
              yesVotes: r.yes_votes,
              noVotes: r.no_votes,
              status: r.status
            } : ref));
          }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'body_governance' }, (payload) => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          const g = payload.new;
          setBodyGovernance(prev => ({
            ...prev,
            [g.body_id]: { status: g.status, electionEndTime: g.election_end_time, formationReferendumId: g.formation_referendum_id, empireId: g.empire_id }
          }));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'state_elections' }, (payload) => {
        const e = payload.new;
        if (e.status === 'active') {
          setActiveElections(prev => {
            if (prev.some(x => x.id === e.id)) return prev;
            return [...prev, { id: e.id, stateId: e.state_id, electionType: e.election_type, startTime: e.start_time, endTime: e.end_time, status: e.status }];
          });
          // Also load any candidates for this election
          supabase.from('election_candidates').select('*').eq('election_id', e.id).then(({ data: cands }) => {
            if (cands && cands.length > 0) {
              setElectionCandidates(prev => {
                const newOnes = cands.filter(c => !prev.some(x => x.id === c.id));
                return [...prev, ...newOnes.map(c => ({ id: c.id, electionId: c.election_id, partyId: c.party_id, userId: c.user_id, voteCount: c.vote_count, registeredAt: c.registered_at }))];
              });
            }
          });
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'state_elections' }, (payload) => {
        const e = payload.new;
        if (e.status !== 'active') {
          setActiveElections(prev => prev.filter(x => x.id !== e.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, initialDataLoaded]);

  // Sites of Interest & Survey Missions Realtime Sync
  useEffect(() => {
    if (!user || !initialDataLoaded) return;

    const channel = supabase
      .channel('sites_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sites_of_interest' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const s = payload.new;
          setSitesOfInterest(prev => [...prev, {
            id: s.id, bodyId: s.body_id, systemId: s.system_id, tier: s.tier,
            appearsAt: s.appears_at, expiresAt: s.expires_at, status: s.status,
            claimedByPlayerId: s.claimed_by_player_id, discoveredBy: s.discovered_by, completedBy: s.completed_by
          }]);
        } else if (payload.eventType === 'UPDATE') {
          const s = payload.new;
          setSitesOfInterest(prev => prev.map(x => x.id === s.id ? {
            ...x, status: s.status, claimedByPlayerId: s.claimed_by_player_id,
            discoveredBy: s.discovered_by, completedBy: s.completed_by
          } : x));
        } else if (payload.eventType === 'DELETE') {
          setSitesOfInterest(prev => prev.filter(x => x.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'survey_missions', filter: `player_id=eq.${user.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const m = payload.new;
          setSurveyMissions(prev => [...prev, {
            id: m.id, siteId: m.site_id, vesselId: m.vessel_id, playerId: m.player_id,
            startedAt: m.started_at, completesAt: m.completes_at, status: m.status,
            rewardClaimed: m.reward_claimed, rewardData: m.reward_data
          }]);
        } else if (payload.eventType === 'UPDATE') {
          const m = payload.new;
          setSurveyMissions(prev => prev.map(x => x.id === m.id ? {
            ...x, status: m.status, rewardClaimed: m.reward_claimed, rewardData: m.reward_data
          } : x));
        } else if (payload.eventType === 'DELETE') {
          setSurveyMissions(prev => prev.filter(x => x.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vessels', filter: `user_id=eq.${user.id}` }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          const v = payload.new;
          setUserVessels(prev => prev.map(x => x.id === v.id ? {
            ...x,
            status: v.status || x.status,
            name: v.name || x.name,
            class: (v.vessel_class || x.class) as VesselClass,
            health: v.health ?? x.health,
            maxHealth: v.max_health ?? x.maxHealth,
          } : x));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, initialDataLoaded]);


  useEffect(() => {
    if (!user || !vesselId || !initialDataLoaded) return;
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
  }, [user, initialDataLoaded, shipConfig, vesselId]);

  // Sync location to Supabase fleet_positions
  useEffect(() => {
    if (!user || !vesselId || !initialDataLoaded) return;

    // CRITICAL: Block the sync entirely until we have loaded a real position from the
    // database. Without this, the default "sys-center" initial state would race with
    // the async loadData and overwrite the player's actual saved position on page refresh.
    if (!positionReadyRef.current) return;

    const isDefaultPosition = playerSystemId === "sys-center" && playerBodyId === "star" && !travel && !arrival;

    // If we are at the same position we just loaded from the DB, and not currently moving,
    // no need to sync back immediately (prevents re-writing unchanged data)
    if (lastLoadedPositionRef.current &&
        playerSystemId === lastLoadedPositionRef.current.systemId &&
        playerBodyId === lastLoadedPositionRef.current.bodyId &&
        !travel && !arrival) {
      return;
    }

    // HYDRATION GUARD: If we have a lastLoadedPosition that is NOT sys-center, 
    // but our current state IS sys-center, it means the React state hasn't 
    // finished hydrating from the loadData call yet. 
    // Do NOT sync until playerSystemId catches up to the DB truth.
    if (lastLoadedPositionRef.current && 
        lastLoadedPositionRef.current.systemId !== "sys-center" &&
        playerSystemId === "sys-center" && !travel && !arrival) {
      return;
    }
    
    const syncPosition = async () => {
      // If we are at default position, only sync if initialDataLoaded has been true for a bit
      // or if we have explicitly moved there. For now, a simple guard:
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
        travel_path: jumpPath && jumpPath.length > 0 ? jumpPath : null,
      }, { onConflict: 'vessel_id' });
    };
    
    // Only sync if we've moved away from center or after a short delay to allow DB load to settle
    const timer = setTimeout(syncPosition, isDefaultPosition ? 2000 : 500);
    return () => clearTimeout(timer);
  }, [user, vesselId, initialDataLoaded, playerSystemId, playerBodyId, travel, arrival]);

  const knownSystemIds = useMemo(() => {
    // 1. Start with all explored systems (stay visible forever)
    const known = new Set<string>(exploredSystemIds);
    
    // 2. Add systems within sensor range of ALL active user vessels
    userVessels.forEach(v => {
      const vSystemId = v.systemId;
      const currentSystem = galaxy.systemById[vSystemId];
      if (!currentSystem) return;
      
      const region = currentSystem.regionId ? galaxy.regions?.find(r => r.id === currentSystem.regionId) : null;
      const sensorRange = (region?.type === "dust_cloud") ? 1 : 2;

      const queue: [string, number][] = [[vSystemId, 0]];
      known.add(vSystemId);
      
      const bfsVisited = new Set<string>([vSystemId]);
      let head = 0;
      while (head < queue.length) {
        const [id, depth] = queue[head++];
        if (depth >= sensorRange) continue;
        
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
    });

    return known;
  }, [exploredSystemIds, galaxy, userVessels]);

  const [jumpPath, setJumpPath] = useState<string[]>([]);
  const [journeyTargetBodyId, setJourneyTargetBodyId] = useState<string | null>(null);

  const calculatePath = useCallback((startId: string, targetId: string) => {
    // Dijkstra/BFS to find path through known systems
    const queue: [string, string[]][] = [[startId, [startId]]];
    const visited = new Set<string>([startId]);
    
    let head = 0;
    while (head < queue.length) {
      const [currentId, path] = queue[head++];
      if (currentId === targetId) return path;

      // Only travel through hyperlanes
      for (const lane of galaxy.hyperlanes) {
        let neighbor = "";
        if (lane.a === currentId) neighbor = lane.b;
        else if (lane.b === currentId) neighbor = lane.a;

        // Constraint: Must be known or in sensor range
        if (neighbor && !visited.has(neighbor) && knownSystemIds.has(neighbor)) {
          visited.add(neighbor);
          queue.push([neighbor, [...path, neighbor]]);
        }
      }
    }
    return null;
  }, [galaxy.hyperlanes, knownSystemIds]);

  const getJumpCostBetween = useCallback((s1Id: string, s2Id: string) => {
    const s1 = galaxy.systemById[s1Id];
    const s2 = galaxy.systemById[s2Id];
    if (!s1 || !s2) return 0;
    const dist = Math.hypot(s1.pos[0] - s2.pos[0], s1.pos[1] - s2.pos[1], s1.pos[2] - s2.pos[2]);
    const sourceRegion = s1.regionId ? galaxy.regions?.find(r => r.id === s1.regionId) : null;
    const penalty = (sourceRegion?.type === "gravity_rift") ? 1.5 : 1.0;
    const baseCost = 10 + dist / 30;
    return Math.floor(baseCost * penalty);
  }, [galaxy]);

  const getPathCost = useCallback((path: string[]) => {
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
      total += getJumpCostBetween(path[i], path[i+1]);
    }
    return total;
  }, [getJumpCostBetween]);

  // ── Other Players: Realtime subscription (replaces 5-second poll) ──────────
  // Strategy: do ONE initial fetch on mount to populate state, then maintain a
  // persistent Realtime channel for INSERT/UPDATE/DELETE incremental updates.
  // Client-side filter by knownSystemIds avoids the expensive OR query that was
  // the primary driver of PostgREST egress.
  // Note: Realtime postgres_changes does not support OR filters server-side, so
  // we subscribe to ALL fleet_positions changes and filter locally. This uses a
  // persistent WebSocket instead of repeated HTTP requests — far cheaper on egress.
  const knownSystemIdsRef = useRef<Set<string>>(new Set());
  knownSystemIdsRef.current = knownSystemIds;

  useEffect(() => {
    if (!user || !initialDataLoaded) return;

    // Helper: returns true if this fleet_positions row is visible to the player
    const isVisible = (row: any): boolean => {
      if (!row || row.user_id === user.id) return false; // skip own row
      const known = knownSystemIdsRef.current;
      if (known.has(row.system_id)) return true;
      if (row.travel_target_id && known.has(row.travel_target_id)) return true;
      if (Array.isArray(row.travel_path) && row.travel_path.some((s: string) => known.has(s))) return true;
      return false;
    };

    // Initial fetch — one-time, to populate the map on load
    const initialFetch = async () => {
      const systemArray = Array.from(knownSystemIdsRef.current);
      if (systemArray.length === 0) return;
      const { data } = await supabase
        .from('fleet_positions')
        .select('*, profiles(commander_name)')
        .or(`system_id.in.(${systemArray.join(',')}),travel_target_id.in.(${systemArray.join(',')})`);
      if (data) setOtherPlayers(data.filter(r => r.user_id !== user.id));
    };
    initialFetch();

    // Realtime subscription — incremental updates from here on
    const channel = supabase
      .channel('fleet_positions_realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'fleet_positions',
      }, (payload) => {
        if (payload.eventType === 'DELETE') {
          const oldId = payload.old?.vessel_id || payload.old?.fleet_id;
          setOtherPlayers(prev => prev.filter(p =>
            (p.vessel_id || p.fleet_id) !== oldId
          ));
          return;
        }
        const row = payload.new as any;
        if (!row || row.user_id === user.id) return; // ignore own updates
        if (!isVisible(row)) {
          // Row moved out of sensor range — remove it
          setOtherPlayers(prev => prev.filter(p =>
            (p.vessel_id || p.fleet_id) !== (row.vessel_id || row.fleet_id)
          ));
          return;
        }
        // Upsert into local state (INSERT or UPDATE)
        setOtherPlayers(prev => {
          const key = row.vessel_id || row.fleet_id;
          const existing = prev.find(p => (p.vessel_id || p.fleet_id) === key);
          
          if (existing) {
            // Preserve joined profile data that Realtime doesn't include
            return prev.map(p => (p.vessel_id || p.fleet_id) === key
              ? { ...row, profiles: p.profiles }
              : p
            );
          }

          // Check profile cache before fetching from DB (Massive egress saver)
          if (profileCacheRef.current[row.user_id]) {
            setOtherPlayers(cur => [
              ...cur.filter(p => (p.vessel_id || p.fleet_id) !== key),
              { ...row, profiles: profileCacheRef.current[row.user_id] },
            ]);
            return prev;
          }

          // New player in range — fetch their profile name then add
          supabase
            .from('profiles')
            .select('commander_name')
            .eq('id', row.user_id)
            .single()
            .then(({ data: profile }) => {
              if (profile) profileCacheRef.current[row.user_id] = profile;
              setOtherPlayers(cur => [
                ...cur.filter(p => (p.vessel_id || p.fleet_id) !== key),
                { ...row, profiles: profile },
              ]);
            });
          return prev; // optimistically unchanged until profile resolves
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, initialDataLoaded]);

  // Action Points Regeneration Timer
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= nextApTick) {
        setAp(prev => {
          const next = Math.min(360, prev + 1);
          // Sync AP and regen timestamp to DB for cross-device persistence
          if (user) {
            supabase.from('profiles').update({ 
              action_points: next,
              last_ap_regen_at: new Date().toISOString()
            }).eq('id', user.id).then();
          }
          return next;
        });
        const newTick = now + AP_REGEN_INTERVAL;
        setLastApTick(now);
        setNextApTick(newTick);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [nextApTick, user, ap]);

  // 11. Listen for Campaign Reset (Epoch) via Realtime
  useEffect(() => {
    if (!initialDataLoaded) return;

    const channel = supabase
      .channel('public:global_config')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'global_config',
        filter: 'key=eq.campaign_epoch' 
      }, (payload) => {
        const newEpoch = payload.new.value;
        const storedEpoch = localStorage.getItem('campaign_epoch');
        if (storedEpoch && storedEpoch !== newEpoch) {
          console.warn("Campaign reset detected via Realtime. Force reloading...");
          localStorage.setItem('campaign_epoch', newEpoch);
          window.location.reload();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialDataLoaded]);

  // 12. Listen for App Updates (Deployment) via polling
  useEffect(() => {
    const CURRENT_VERSION = "v0.3.2"; // This should match what's in public/version.txt
    
    const checkVersion = async () => {
      try {
        const response = await fetch('/version.txt?t=' + Date.now());
        if (!response.ok) return;
        const latestVersion = (await response.text()).trim();
        
        if (latestVersion && latestVersion !== CURRENT_VERSION) {
          console.warn(`New app version detected: ${latestVersion}. Reloading...`);
          window.location.reload();
        }
      } catch (err) {
        // Silently fail if offline or error
      }
    };

    // Check immediately on mount to catch stale cached loads
    checkVersion();

    // Then check every 60 seconds
    const interval = setInterval(checkVersion, 60000);
    return () => clearInterval(interval);
  }, []);

  // Global Online Players Count — derived from the Realtime otherPlayers state.
  // No DB query needed: count distinct user_ids in otherPlayers + 1 (self).
  // This updates automatically whenever the Realtime channel delivers changes.
  useEffect(() => {
    const uniqueUsers = new Set(otherPlayers.map((p: any) => p.user_id));
    setOnlinePlayerCount(Math.max(1, uniqueUsers.size + 1));
  }, [otherPlayers]);

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

  // Persistence sync is now handled primarily by Supabase DB calls in their respective functions
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
  // LocalStorage is strictly for UI preferences and non-gameplay settings
  useEffect(() => { localStorage.setItem("audioEnabled", String(audioEnabled)); }, [audioEnabled]);
  useEffect(() => { localStorage.setItem("musicVolume", String(musicVolume)); }, [musicVolume]);
  useEffect(() => { localStorage.setItem("sfxVolume", String(sfxVolume)); }, [sfxVolume]);
  useEffect(() => { localStorage.setItem("fxVolume", String(fxVolume)); }, [fxVolume]);
  useEffect(() => { localStorage.setItem("audioEnabled", String(audioEnabled)); }, [audioEnabled]);
  useEffect(() => { localStorage.setItem("musicVolume", String(musicVolume)); }, [musicVolume]);
  useEffect(() => { localStorage.setItem("sfxVolume", String(sfxVolume)); }, [sfxVolume]);
  useEffect(() => { localStorage.setItem("fxVolume", String(fxVolume)); }, [fxVolume]);

  // Unified Global Timer: Clock Update only
  // AP regen is handled by the AP Regeneration Timer above (DB-backed)
  useEffect(() => {
    const tick = () => setCurrentTime(Date.now());
    tick();
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
  }, [system, bodyId, shipConfig.name]);


  const getJumpCost = useCallback((targetId: string) => {
    const s1 = galaxy.systemById[playerSystemId];
    const s2 = galaxy.systemById[targetId];
    if (!s1 || !s2) return 0;
    const dist = Math.hypot(s1.pos[0] - s2.pos[0], s1.pos[1] - s2.pos[1], s1.pos[2] - s2.pos[2]);
    
    // Check for Gravity Rift in source system
    const sourceRegion = s1.regionId ? galaxy.regions?.find(r => r.id === s1.regionId) : null;
    const penalty = (sourceRegion?.type === "gravity_rift") ? 1.5 : 1.0;

    // Formula: 10 AP base + 1 AP per 30 scene units
    const baseCost = 10 + dist / 30;
    return Math.floor(baseCost * penalty);
  }, [galaxy, playerSystemId]);

  const getActionCost = useCallback((baseCost: number) => {
    const sys = galaxy.systemById[playerSystemId];
    const region = sys?.regionId ? galaxy.regions?.find(r => r.id === sys.regionId) : null;
    const multiplier = (region?.type === "ion_storm") ? 2.0 : 1.0;
    return Math.floor(baseCost * multiplier);
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

  const commissionVessel = async (vesselClass: VesselClass, name: string, config: ShipConfiguration) => {
    if (!user) return;
    const cost = vesselClass === 'freighter' ? 25000 : 10000;
    if (sc < cost) {
      toast.error("Insufficient credits", { description: `You need ${cost.toLocaleString()} SC to commission a ${vesselClass}.` });
      return;
    }

    try {
      // 1. Create Vessel
      const { data: v, error: vErr } = await supabase.from('vessels').insert({
        user_id: user.id,
        name,
        vessel_class: vesselClass,
        primary_color: config.primaryColor,
        accent_color: config.accentColor,
        hull_id: config.hullId,
        wings_id: config.wingsId,
        engines_id: config.enginesId,
        bridge_id: config.bridgeId,
        cargo_capacity: vesselClass === 'freighter' ? 15000 : 5000,
        status: 'idle',
        health: 100,
        max_health: 100
      }).select().single();

      if (vErr) throw vErr;

      // 2. Create Position (In orbit of current body or system center)
      const { error: pErr } = await supabase.from('fleet_positions').insert({
        user_id: user.id,
        vessel_id: v.id,
        system_id: playerSystemId,
        body_id: playerBodyId === 'ship' ? 'star' : playerBodyId
      });

      if (pErr) throw pErr;

      // 3. Deduct credits
      const { error: sErr } = await supabase.from('profiles').update({ credits: sc - cost }).eq('id', user.id);
      if (sErr) throw sErr;

      setSc(prev => prev - cost);
      
      const newVessel: Vessel = {
        id: v.id,
        userId: user.id,
        name,
        class: vesselClass,
        systemId: playerSystemId,
        bodyId: playerBodyId === 'ship' ? 'star' : playerBodyId,
        cargoCapacity: vesselClass === 'freighter' ? 15000 : 5000,
        status: 'idle',
        drydockId: null,
        fleetId: null,

        health: 100,
        maxHealth: 100,
        config: {
          hullId: config.hullId,
          wingsId: config.wingsId,
          enginesId: config.enginesId,
          bridgeId: config.bridgeId,
          primaryColor: config.primaryColor,
          accentColor: config.accentColor,
        }
      };

      setUserVessels(prev => [...prev, newVessel]);
      setFleetCount(prev => prev + 1);
      toast.success(`${vesselClass.toUpperCase()} Commissioned`, { description: `The ${name} is now in orbit.` });
      logAction('military', 'Vessel Commissioned', `Acquired new ${vesselClass} class vessel: ${name}`);

    } catch (err: any) {
      toast.error("Handshake failed", { description: err.message });
    }
  };

  const selectVessel = (id: string) => {
    setSelectedVesselId(id);
    const v = userVessels.find(v => v.id === id);
    if (v) {
      setPlayerSystemId(v.systemId);
      setPlayerBodyId(v.bodyId || 'star');
      toast.info(`Controlling ${v.name}`);
    }
  };

  const toggleFleetSidebar = () => setIsFleetSidebarOpen(prev => !prev);
  const togglePlayerStatusSidebar = () => setIsPlayerStatusSidebarOpen(prev => !prev);

  const fetchEconomyData = useCallback(async () => {
    const now = Date.now();
    // Throttle: don't hammer the economy endpoint more than once every 5 seconds per client
    if (isEconomyLoadingRef.current || (now - lastEconomyFetchRef.current < 5000)) return;
    
    isEconomyLoadingRef.current = true;
    lastEconomyFetchRef.current = now;
    try {
      const sysId = systemId || localStorage.getItem("systemId");
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
          ),
          article_comment_votes(user_id, vote_type)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);
    
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
      .order('created_at', { ascending: false })
      .limit(50);
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
    } finally {
      isEconomyLoadingRef.current = false;
    }
  }, [user?.id, systemId, system]);

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

  const fetchConstructionQueue = useCallback(async () => {
    if (!user) return;
    
    // Trigger completion check in DB for this user
    await supabase.rpc('check_and_complete_builds', { p_user_id: user.id });

    const { data } = await supabase
      .from('ship_construction_queue')
      .select('*')
      .eq('owner_id', user.id)
      .in('status', ['building', 'hangared']);

    if (data) {
      setConstructionQueue(data.map((q: any) => ({
        id:          q.id,
        shipyardId:  q.shipyard_id,
        bodyId:      q.body_id,
        systemId:    q.system_id,
        vesselClass: q.vessel_class,
        vesselName:  q.vessel_name,
        shipConfig:  q.ship_config ?? {},
        startedAt:   q.started_at,
        completesAt: q.completes_at,
        status:      q.status,
      })));
    }
  }, [user]);
 
  const fetchFleets = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('fleets')
      .select('*, fleet_vessels(vessel_id, vessels(*)), fleet_positions(*)')
      .eq('owner_id', user.id)
      .neq('status', 'disbanded');
    if (data) {
      setUserFleets(prev => data.map((f: any) => {
        const pos = Array.isArray(f.fleet_positions)
          ? f.fleet_positions.find((p: any) => p.fleet_id === f.id)
          : null;
        // Preserve any in-flight travel state from local optimistic updates.
        // fetchFleets is triggered by system navigation changes and must not
        // clobber travel that initiateFleetJump has already set locally.
        const existing = prev.find(e => e.id === f.id);
        const preservedTravel = existing?.travel ?? null;
        const vesselConfig = f.fleet_vessels?.[0]?.vessels 
          ? {
              name: f.name,
              primaryColor: f.fleet_vessels[0].vessels.primary_color,
              accentColor:  f.fleet_vessels[0].vessels.accent_color,
              hullId:       f.fleet_vessels[0].vessels.hull_id,
              wingsId:      f.fleet_vessels[0].vessels.wings_id,
              enginesId:    f.fleet_vessels[0].vessels.engines_id,
              bridgeId:     f.fleet_vessels[0].vessels.bridge_id,
            }
          : undefined;

        return {
          id:        f.id,
          ownerId:   f.owner_id,
          name:      f.name,
          systemId:  preservedTravel
            ? existing!.systemId
            : (pos?.system_id  ?? f.system_id  ?? "sys-center"),
          bodyId:    pos?.body_id ?? f.body_id ?? "star",
          status:    preservedTravel ? 'traveling' as const : f.status,
          vesselIds: (f.fleet_vessels ?? []).map((fv: any) => fv.vessel_id),
          vesselConfig,
          travel:    preservedTravel,                  // never wipe in-flight travel
          path:      pos?.travel_path ?? undefined,
        };
      }));
    }
  }, [user, playerSystemId, playerBodyId]);
 
  const fetchSiloInventory = useCallback(async () => {
    if (!user) return;
    // Get all silos owned by player
    const silos = (userFactories ?? []).filter((f: any) => f.type === 'Resource Silo');
    if (silos.length === 0) { setSiloInventory([]); return; }
    const siloIds = silos.map((s: any) => s.id);
    const { data } = await supabase
      .from('silo_inventory')
      .select('*')
      .in('silo_id', siloIds);
    if (data) {
      setSiloInventory(data.map((r: any) => ({
        siloId:       r.silo_id,
        resourceType: r.resource_type,
        amount:       r.amount,
      })));
    }
  }, [user?.id, userFactories]);
 
  // Poll build queue — check for completions every 30s
  useEffect(() => {
    if (!user) return;
    const poll = async () => {
      // Ask DB to mark any overdue builds as 'hangared'
      await supabase.rpc('check_and_complete_builds', { p_user_id: user.id });
      await fetchConstructionQueue();
    };
    poll();
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    if (user && initialDataLoaded) {
      fetchEconomyData();
      fetchConstructionQueue();
      fetchFleets();
      fetchSiloInventory();
    }
  }, [user?.id, initialDataLoaded, systemId]);

  // Site Maintenance Polling
  useEffect(() => {
    if (!user || !initialDataLoaded || !galaxy) return;

    const poll = async () => {
      // 1. Prepare precursor data
      const precursorData = (galaxy.precursor_bodies || []).map(id => {
        const b = galaxy.bodyById[id];
        return { body_id: id, system_id: b?.systemId };
      }).filter(d => d.system_id);

      // 2. Prepare random candidates (sample 200 non-precursor, non-sanctum bodies)
      const allBodies = Object.values(galaxy.bodyById);
      const candidates = allBodies
        .filter(b => !galaxy.precursor_bodies?.includes(b.id) && !b.systemId.startsWith('sys-inner-') && b.systemId !== 'sys-center' && b.type !== 'star' && b.type !== 'station')
        .sort(() => Math.random() - 0.5)
        .slice(0, 200)
        .map(b => ({ body_id: b.id, system_id: b.systemId }));

      await supabase.rpc('maintain_sites_of_interest', {
        p_precursor_data: precursorData,
        p_random_candidates: candidates
      });
    };

    poll();
    const interval = setInterval(poll, 300000); // 5 mins
    return () => clearInterval(interval);
  }, [user, initialDataLoaded, galaxy]);

  // Periodic build completion poller
  useEffect(() => {
    if (!user || !initialDataLoaded) return;
    const interval = setInterval(() => {
      fetchConstructionQueue();
    }, 20000);
    return () => clearInterval(interval);
  }, [user, initialDataLoaded, fetchConstructionQueue]);


  const queueShipBuild = useCallback(async (
    shipyardId:  string,
    vesselClass: ShipBlueprintKey,
    vesselName:  string,
    config:      ShipConfiguration,
    siloId:      string,
  ) => {
    if (!user) return;
    
    // Auto-complete any finished builds to free up the hangar
    await supabase.rpc('check_and_complete_builds', { p_user_id: user.id });

    const blueprint = SHIP_BLUEPRINTS[vesselClass];

 
    const { data, error } = await supabase.rpc('queue_ship_build', {
      p_shipyard_id:  shipyardId,
      p_vessel_class: vesselClass,
      p_vessel_name:  vesselName,
      p_ship_config:  config,
      p_cost_sc:      blueprint.costSC,
      p_build_secs:   blueprint.buildTimeSecs,
      p_materials:    blueprint.materials,
      p_silo_id:      siloId,
    });
 
    if (error || (data as any)?.error) {
      toast.error('Commission failed', { description: (data as any)?.error ?? error?.message });
      return;
    }

    const queueId = (data as any)?.id;
    if (adminDebugInstantBuilds && queueId) {
      await supabase.rpc('debug_instant_complete_build', { p_queue_id: queueId });
      toast.info("Instant Build Triggered");
    }
 
    // Consume credits from player profile in DB
    await supabase.from('profiles').update({ credits: sc - blueprint.costSC }).eq('id', user.id);
    setSc(prev => prev - blueprint.costSC);
    toast.success(`${blueprint.label} commissioned`, {
      description: adminDebugInstantBuilds ? "Build completed instantly." : `Build underway — completes in ${blueprint.buildTimeSecs / 3600}h. Track progress in Fleet Registry.`,
    });
    fetchConstructionQueue();
    fetchSiloInventory();
  }, [user, fetchConstructionQueue, fetchSiloInventory, adminDebugInstantBuilds, sc]);
 
  const transferShipToDrydock = useCallback(async (queueId: string) => {
    if (!user) return;
    const { data, error } = await supabase.rpc('transfer_ship_to_drydock', {
      p_queue_id: queueId,
    });
    if (error || (data as any)?.error) {
      toast.error('Transfer failed', { description: (data as any)?.error ?? error?.message });
      return;
    }
    toast.success('Ship transferred to Drydock', {
      description: `Now available in the Docked Ships pool. Form a fleet to deploy.`,
    });
    // Refresh vessels and queue
    fetchConstructionQueue();
    // Re-fetch vessels — reuse existing vessel fetch pattern
    const { data: vss } = await supabase
      .from('vessels').select('*, fleets(system_id, body_id)').eq('user_id', user.id);
    if (vss) {
      setUserVessels(vss.map((v: any) => {
        return {
          id: v.id,
          userId: v.user_id,
          name: v.name,
          class: (v.vessel_class || (v.is_active ? 'commander' : 'freighter')) as VesselClass,
          systemId: (v.fleets as any)?.system_id || "sys-center",
          bodyId: (v.fleets as any)?.body_id || "star",
          cargoCapacity: v.cargo_capacity || (v.vessel_class === 'freighter' ? 15000 : 5000),
          status: v.status || 'idle',
          drydockId: v.drydock_id,
          fleetId:   v.fleet_id,
          health: v.health || 100,
          maxHealth: v.max_health || 100,
          config: {
            hullId: v.hull_id,
            wingsId: v.wings_id,
            enginesId: v.engines_id,
            bridgeId: v.bridge_id,
            primaryColor: v.primary_color,
            accentColor: v.accent_color,
          }
        };
      }));

    }
  }, [user, fetchConstructionQueue]);

  const updateVesselConfig = useCallback(async (targetVesselId: string, config: ShipConfiguration) => {
    if (!user) return;
    
    // Update local state optimistically
    setUserVessels(prev => prev.map(v => v.id === targetVesselId ? { ...v, config, name: config.name } : v));
    
    // Persist to DB
    const { error } = await supabase.from('vessels').update({
      name: config.name,
      primary_color: config.primaryColor,
      accent_color: config.accentColor,
      hull_id: config.hullId,
      wings_id: config.wingsId,
      engines_id: config.enginesId,
      bridge_id: config.bridgeId,
    }).eq('id', targetVesselId).eq('user_id', user.id);

    if (error) {
      toast.error("Refit failed", { description: error.message });
    } else {
      toast.success("Vessel refitted", { description: `${config.name} has been updated.` });
      // If this is the active commander vessel, update the main shipConfig as well
      if (targetVesselId === vesselId) {
        setShipConfig(config);
      }
    }
  }, [user, vesselId]);
 
  const formFleet = useCallback(async (
    name:       string,
    vesselIds:  string[],
    drydockId:  string,
  ) => {
    if (!user) return;
    const { data, error } = await supabase.rpc('form_fleet', {
      p_user_id:    user.id,
      p_name:       name,
      p_vessel_ids: vesselIds,
      p_drydock_id: drydockId,
    });
    // The form_fleet RPC creates the fleet + fleet_vessels rows but tries to insert
    // a fleet_positions row with only fleet_id (no vessel_id). If vessel_id has a
    // NOT NULL constraint this will fail. We catch that specific error and continue —
    // the fleet was still created — then insert the position row ourselves below.
    // PERMANENT FIX: run this migration on the DB:
    //   ALTER TABLE fleet_positions ALTER COLUMN vessel_id DROP NOT NULL;
    const isPositionConstraintError = error?.message?.includes('vessel_id') && error?.message?.includes('not-null');
    if ((error && !isPositionConstraintError) || (data as any)?.error) {
      toast.error('Fleet formation failed', { description: (data as any)?.error ?? error?.message });
      return;
    }

    // Fetch the newly-created fleet to get its ID, then insert the position row ourselves
    // if the RPC couldn't do it (vessel_id NOT NULL constraint workaround).
    if (isPositionConstraintError) {
      const { data: newFleet } = await supabase
        .from('fleets')
        .select('id, system_id, body_id')
        .eq('owner_id', user.id)
        .eq('name', name)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (newFleet) {
        await supabase.from('fleet_positions').upsert({
          fleet_id:  newFleet.id,
          user_id:   user.id,
          system_id: newFleet.system_id ?? playerSystemId,
          body_id:   newFleet.body_id   ?? playerBodyId,
        }, { onConflict: 'fleet_id' });
      }
    }

    toast.success(`${name} deployed`, {
      description: 'Fleet is now active. Select it in the Fleet Registry to issue orders.',
    });
    fetchFleets();
    // Refresh vessel statuses — join fleets so fleet vessels resolve systemId correctly.
    // Fleet vessels don't have their own fleet_positions row (only the fleet entity does),
    // so we fall back to the parent fleet's system_id via the fleets join.
    const { data: vss } = await supabase
      .from('vessels')
      .select('*, fleets(system_id, body_id)')
      .eq('user_id', user.id);
    const { data: freshPositions } = await supabase
      .from('fleet_positions')
      .select('*')
      .eq('user_id', user.id);
    if (vss) {
      setUserVessels(vss.map((v: any) => {
        const pos = (freshPositions || []).find((p: any) => p.fleet_id === v.fleet_id) || freshPositions?.find((p: any) => p.vessel_id === v.id);
        return {
          id: v.id,
          userId: v.user_id,
          name: v.name,
          class: (v.vessel_class || (v.is_active ? 'commander' : 'freighter')) as VesselClass,
          systemId: pos?.system_id || (v.fleets as any)?.[0]?.system_id || playerSystemId,
          bodyId:   pos?.body_id   || (v.fleets as any)?.[0]?.body_id   || playerBodyId,
          cargoCapacity: v.cargo_capacity || (v.vessel_class === 'freighter' ? 15000 : 5000),
          status: v.status || 'idle',
          drydockId: v.drydock_id,
          fleetId:   v.fleet_id,
          health: v.health || 100,
          maxHealth: v.max_health || 100,
          config: {
            hullId:       v.hull_id,
            wingsId:      v.wings_id,
            enginesId:    v.engines_id,
            bridgeId:     v.bridge_id,
            primaryColor: v.primary_color,
            accentColor:  v.accent_color,
          }
        };
      }));
    }
  }, [user, fetchFleets, playerSystemId, playerBodyId]);

  const renameFleet = useCallback(async (fleetId: string, newName: string) => {
    if (!user) return;
    const { error } = await supabase.rpc('rename_fleet', {
      p_fleet_id: fleetId,
      p_new_name: newName,
      p_user_id: user.id
    });
    if (error) {
      toast.error('Rename failed', { description: error.message });
      return;
    }
    toast.success('Fleet renamed');
    await fetchFleets();
  }, [user, fetchFleets]);
 
  const disbandFleet = useCallback(async (fleetId: string) => {
    if (!user) return;
    const { data, error } = await supabase.rpc('disband_fleet', {
      p_user_id:  user.id,
      p_fleet_id: fleetId,
    });
    if (error || (data as any)?.error) {
      toast.error('Disband failed', { description: (data as any)?.error ?? error?.message });
      return;
    }
    const docked = (data as any)?.docked;
    toast.success('Fleet disbanded', {
      description: docked
        ? 'Vessels returned to drydock and available for reassignment.'
        : 'Warning: no local drydock — vessels are stranded in system orbit.',
    });
    fetchFleets();
    // Refresh vessel statuses — join fleets so fleet vessels resolve systemId correctly.
    // Fleet vessels don't have their own fleet_positions row (only the fleet entity does),
    // so we fall back to the parent fleet's system_id via the fleets join.
    const { data: vss } = await supabase
      .from('vessels')
      .select('*, fleets(system_id, body_id)')
      .eq('user_id', user.id);
    const { data: freshPositions } = await supabase
      .from('fleet_positions')
      .select('*')
      .eq('user_id', user.id);
    if (vss) {
      setUserVessels(vss.map((v: any) => {
        const pos = (freshPositions || []).find((p: any) => p.fleet_id === v.fleet_id) || freshPositions?.find((p: any) => p.vessel_id === v.id);
        return {
          id: v.id,
          userId: v.user_id,
          name: v.name,
          class: (v.vessel_class || (v.is_active ? 'commander' : 'freighter')) as VesselClass,
          systemId: pos?.system_id || (v.fleets as any)?.[0]?.system_id || playerSystemId,
          bodyId:   pos?.body_id   || (v.fleets as any)?.[0]?.body_id   || playerBodyId,
          cargoCapacity: v.cargo_capacity || (v.vessel_class === 'freighter' ? 15000 : 5000),
          status: v.status || 'idle',
          drydockId: v.drydock_id,
          fleetId:   v.fleet_id,
          health: v.health || 100,
          maxHealth: v.max_health || 100,
          config: {
            hullId:       v.hull_id,
            wingsId:      v.wings_id,
            enginesId:    v.engines_id,
            bridgeId:     v.bridge_id,
            primaryColor: v.primary_color,
            accentColor:  v.accent_color,
          }
        };
      }));
    }
  }, [user, fetchFleets, playerSystemId, playerBodyId]);
 
  // Ref-based fleet state to avoid stale closures inside setTimeout arrival handlers.
  // The commander uses jumpPath/playerSystemId refs for the same reason.
  const userFleetsRef = useRef<FleetEntity[]>([]);
  useEffect(() => { userFleetsRef.current = userFleets; }, [userFleets]);

  const initiateFleetJump = useCallback((fleetId: string, targetSystemId: string, isContinuation = false) => {
    // Read current fleet state from ref to avoid stale closure in setTimeout callbacks
    const fleet = userFleetsRef.current.find(f => f.id === fleetId);
    if (!fleet) return;

    // Guard: don't start a new jump if already traveling (unless it's an auto-continuation)
    if (!isContinuation && fleet.status === 'traveling') return;

    const currentSystemId = fleet.systemId;

    if (currentSystemId === targetSystemId) {
      // Already there
      return;
    }

    const path = calculatePath(currentSystemId, targetSystemId);

    if (!path || path.length < 2) {
      toast.error("No valid route", { description: "Cannot plot a course to that system." });
      return;
    }

    const nextTarget = path[1];
    const totalCost = getPathCost(path);

    if (!isContinuation && ap < totalCost) {
      toast.error(`Insufficient AP`, { description: `Fleet journey requires ${totalCost} AP.` });
      return;
    }

    const s1 = galaxy.systemById[currentSystemId];
    const s2 = galaxy.systemById[nextTarget];
    const dist = s1 && s2
      ? Math.hypot(s2.pos[0] - s1.pos[0], s2.pos[1] - s1.pos[1], s2.pos[2] - s1.pos[2])
      : 10;
    const durationMs = instantJump ? 0 : Math.max(8000, (15 + dist * 1.2) * 1000);
    const now = Date.now();

    if (!isContinuation) {
      setAp(prev => prev - totalCost);
    }

    // Update fleet travel state locally — include currentSystemId so visual can compute startPos
    setUserFleets(prev => prev.map(f =>
      f.id === fleetId
        ? { ...f, status: 'traveling' as const, travel: {
            targetId: nextTarget,
            startTime: now,
            endTime:   now + durationMs,
            type:      'inter' as const,
            path,
            // startPos mirrors the commander pattern: ship departs from near-star position
            startPos: s1 ? { x: 0, z: 0 } : undefined,
          }}
        : f
    ));

    // Persist travel state to DB
    supabase.from('fleet_positions').upsert({
      fleet_id:          fleetId,
      user_id:           user!.id,
      system_id:         currentSystemId,
      travel_type:       'inter',
      travel_target_id:  nextTarget,
      travel_start_time: now,
      travel_end_time:   now + durationMs,
    }, { onConflict: 'fleet_id' });

    // Arrival handler — uses fleetId + ref lookups only, never closed-over fleet object
    setTimeout(async () => {
      // Read fresh fleet state from ref (not stale closure)
      const arrivedFleet = userFleetsRef.current.find(f => f.id === fleetId);
      const vesselIds = arrivedFleet?.vesselIds ?? fleet.vesselIds;
      const fleetName  = arrivedFleet?.name ?? fleet.name;

      setUserFleets(prev => prev.map(f =>
        f.id === fleetId
          ? { ...f, systemId: nextTarget, status: 'idle', travel: null }
          : f
      ));

      // Keep member vessels in sync so sensor range / hyperlane visibility updates
      setUserVessels(prev => prev.map(v =>
        vesselIds.includes(v.id)
          ? { ...v, systemId: nextTarget, bodyId: 'star', status: 'idle' }
          : v
      ));

      await supabase.from('fleets').update({ system_id: nextTarget, body_id: 'star' }).eq('id', fleetId);
      await supabase.from('vessels').update({ status: 'idle' }).in('id', vesselIds);
      await supabase.from('fleet_positions').upsert({
        fleet_id:          fleetId,
        user_id:           user!.id,
        system_id:         nextTarget,
        body_id:           'star',
        travel_type:       null,
        travel_target_id:  null,
        travel_path:       path.length > 2 ? path.slice(1) : null,
      }, { onConflict: 'fleet_id' });

      const arrivedSysName = galaxy.systemById[nextTarget]?.name ?? nextTarget;
      toast.success(`${fleetName} arrived`, { description: `Fleet reached ${arrivedSysName}.` });

      // Mark the arrived system as explored (fleet scouts count as exploration)
      setExploredSystemIds(prev => {
        if (prev.has(nextTarget)) return prev;
        const next = new Set(prev).add(nextTarget);
        // Sync to DB in background
        supabase.from('exploration_logs').upsert({
          user_id: user!.id,
          system_id: nextTarget,
          body_id: 'star'
        }, { ignoreDuplicates: true }).then();
        return next;
      });

      // Continue multi-hop journey — nextTarget becomes new currentSystem via the ref update above
      if (path.length > 2) {
        setTimeout(() => initiateFleetJump(fleetId, targetSystemId, true), 800);
      }
    }, durationMs);

  }, [ap, instantJump, galaxy, calculatePath, getPathCost, user]);

  const initiateFleetTravelToBody = useCallback((fleetId: string, targetBodyId: string) => {
    const fleet = userFleetsRef.current.find(f => f.id === fleetId);
    if (!fleet || !user) return;
    if (fleet.status === 'traveling') return;

    const currentSystem = galaxy.systemById[fleet.systemId];
    if (!currentSystem) return;

    const sourceRegion = currentSystem.regionId ? galaxy.regions?.find(r => r.id === currentSystem.regionId) : null;
    const slowdown = (sourceRegion?.type === "nebula") ? 2.0 : 1.0;

    const now = Date.now();
    // Get fleet's current local position
    const currentBody = fleet.bodyId === "star" ? null : currentSystem.bodies.find(b => b.id === fleet.bodyId);
    const currentLocalPos = currentBody ? getBodyPosition(currentBody, currentSystem.starType, now) : { x: 0, z: 0 };

    const targetBody = targetBodyId === "star" ? null : currentSystem.bodies.find(b => b.id === targetBodyId);
    const targetPos = targetBody ? getBodyPosition(targetBody, currentSystem.starType, now) : { x: 0, z: 0 };
    
    const dx = targetPos.x - currentLocalPos.x;
    const dz = targetPos.z - currentLocalPos.z;
    const dist = Math.sqrt(dx*dx + dz*dz);

    const baseCost = 5 + Math.floor(dist / 250); 
    const cost = getActionCost(baseCost);
    if (ap < cost) {
      toast.error(`Insufficient AP! Travel requires ${cost} AP`);
      return;
    }

    const travelSpeed = 0.015 / slowdown; 
    const durationMs = instantJump ? 0 : Math.max(5000, dist / travelSpeed);
    
    setAp(prev => prev - cost);
    
    setUserFleets(prev => prev.map(f =>
      f.id === fleetId
        ? { ...f, status: 'traveling' as const, travel: {
            targetId: targetBodyId,
            startTime: now,
            endTime:   now + durationMs,
            type:      'intra' as const,
            path:      [],
            startPos: currentLocalPos,
          }}
        : f
    ));

    supabase.from('fleet_positions').upsert({
      fleet_id:          fleetId,
      user_id:           user.id,
      system_id:         fleet.systemId,
      body_id:           fleet.bodyId, // preserve until arrival
      travel_type:       'intra',
      travel_target_id:  targetBodyId,
      travel_start_time: now,
      travel_end_time:   now + durationMs,
    }, { onConflict: 'fleet_id' });

    setTimeout(async () => {
      const arrivedFleet = userFleetsRef.current.find(f => f.id === fleetId);
      const vesselIds = arrivedFleet?.vesselIds ?? fleet.vesselIds;
      const fleetName  = arrivedFleet?.name ?? fleet.name;

      setUserFleets(prev => prev.map(f =>
        f.id === fleetId
          ? { ...f, bodyId: targetBodyId, status: 'idle', travel: null }
          : f
      ));

      setUserVessels(prev => prev.map(v => 
        vesselIds.includes(v.id) 
          ? { ...v, bodyId: targetBodyId, status: 'idle' }
          : v
      ));

      await supabase.from('fleets').update({ body_id: targetBodyId }).eq('id', fleetId);
      await supabase.from('vessels').update({ status: 'idle' }).in('id', vesselIds);
      await supabase.from('fleet_positions').upsert({
        fleet_id:          fleetId,
        user_id:           user.id,
        system_id:         arrivedFleet?.systemId ?? fleet.systemId,
        body_id:           targetBodyId,
        travel_type:       null,
        travel_target_id:  null,
        travel_path:       null,
      }, { onConflict: 'fleet_id' });

      toast.success(`${fleetName} arrived`, { description: `Fleet reached destination.` });

      setExploredBodyIds(prev => {
        const key = `${fleet.systemId}:${targetBodyId}`;
        if (prev.has(key)) return prev;
        const next = new Set(prev).add(key);
        supabase.from('exploration_logs').upsert({
          user_id: user.id,
          system_id: fleet.systemId,
          body_id: targetBodyId
        }, { ignoreDuplicates: true }).then();
        return next;
      });

    }, durationMs);
  }, [ap, instantJump, galaxy, user, getActionCost]);

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
        description: `You gained a new skill point. Open the Skill Tree to spend it.`,
        action: {
          label: "View Skills",
          onClick: () => setPage("skills")
        }
      });
    }
  }, [user, playerSkills]);


  const initiateJump = useCallback((targetId: string, targetBodyId: string | null = null, isContinuation = false) => {
    if (travel) return; // Already moving
    
    // Check if we need to calculate a multi-jump path
    const isAdjacent = galaxy.hyperlanes.some(h => (h.a === playerSystemId && h.b === targetId) || (h.a === targetId && h.b === playerSystemId));
    let path = [playerSystemId, targetId];

    if (!isAdjacent) {
      const calcPath = calculatePath(playerSystemId, targetId);
      if (!calcPath || calcPath.length < 2) {
        toast.error("No valid route found", { description: "Destination must be reachable through known hyperlanes." });
        return;
      }
      path = calcPath;
    }

    const totalCost = getPathCost(path);
    if (!isContinuation && ap < totalCost) {
      toast.error(`Insufficient AP! Journey requires ${totalCost} AP`, {
        description: `Your batteries don't have enough charge to reach ${galaxy.systemById[targetId]?.name || targetId}.`
      });
      return;
    }

    // Start the first jump
    const nextTargetId = path[1];
    setJumpPath(path); // Store the FULL path
    setJourneyTargetBodyId(targetBodyId);
    
    const currentSystem = galaxy.systemById[playerSystemId];
    const sourceRegion = currentSystem.regionId ? galaxy.regions?.find(r => r.id === currentSystem.regionId) : null;
    const slowdown = (sourceRegion?.type === "nebula") ? 2.5 : 1.0;

    const currentPos = currentSystem.pos;
    const targetPos = galaxy.systemById[nextTargetId].pos;
    const dist = Math.hypot(currentPos[0] - targetPos[0], currentPos[1] - targetPos[1], currentPos[2] - targetPos[2]);
    
    const durationMs = instantJump ? 0 : (15 + dist * 1.2 * slowdown) * 1000;
    const now = Date.now();
    const currentLocalPos = getVesselLocalPos(now);
    
    if (!isContinuation) {
      setAp(prev => prev - totalCost);
    }
    setTravel({ 
      targetId: nextTargetId, 
      startTime: now, 
      endTime: now + durationMs, 
      type: "inter",
      startPos: currentLocalPos 
    });
    setArrival(null);
    if (!isContinuation) {
      logAction('navigation', `Multi-Jump Journey Initiated`, `Vessel targeting ${galaxy.systemById[targetId]?.name || targetId} (${path.length - 1} jumps). Total AP dedicated: ${totalCost}.`);
    }
  }, [playerSystemId, galaxy, travel, instantJump, ap, calculatePath, getPathCost, getVesselLocalPos, logAction, setAp]);

  const initiateTravelToBody = useCallback((targetBodyId: string) => {
    // 1. Calculate current position for starting (supports mid-flight redirection)
    const now = Date.now();
    const currentLocalPos = getVesselLocalPos(now);
    
    const currentSystem = galaxy.systemById[playerSystemId];
    if (!currentSystem) return;

    const sourceRegion = currentSystem.regionId ? galaxy.regions?.find(r => r.id === currentSystem.regionId) : null;
    const slowdown = (sourceRegion?.type === "nebula") ? 2.0 : 1.0;

    const targetBody = targetBodyId === "star" ? null : currentSystem.bodies.find(b => b.id === targetBodyId);
    const targetPos = targetBody ? getBodyPosition(targetBody, currentSystem.starType, now) : { x: 0, z: 0 };
    
    const dx = targetPos.x - currentLocalPos.x;
    const dz = targetPos.z - currentLocalPos.z;
    const dist = Math.sqrt(dx*dx + dz*dz);

    const baseCost = 5 + Math.floor(dist / 250); 
    const cost = getActionCost(baseCost);
    if (ap < cost) {
      toast.error(`Insufficient AP! Travel requires ${cost} AP`, {
        description: "Intra-system sub-light travel requires fuel based on distance."
      });
      return;
    }

    const travelSpeed = 0.015 / slowdown; 
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
  }, [ap, instantJump, playerSystemId, galaxy, getVesselLocalPos, logAction, getActionCost]);

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
      fetchEconomyData();
    }
  }, [user, playerSystemId, galaxy, fetchEconomyData, logAction]);

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

  const deleteArticle = useCallback(async (articleId: string) => {
    if (!user) return;
    const { error } = await supabase.from('articles').delete().eq('id', articleId).eq('author_id', user.id);
    if (error) {
      toast.error("Deletion failed", { description: error.message });
    } else {
      toast.success("Article retracted.");
      fetchEconomyData();
    }
  }, [user, fetchEconomyData]);

  const updateArticle = useCallback(async (articleId: string, title: string, content: string) => {
    if (!user) return;
    const { error } = await supabase.from('articles').update({ title, content }).eq('id', articleId).eq('author_id', user.id);
    if (error) {
      toast.error("Update failed", { description: error.message });
    } else {
      toast.success("Article updated.");
      fetchEconomyData();
    }
  }, [user, fetchEconomyData]);

  const voteComment = useCallback(async (commentId: string, voteType: 1 | -1) => {
    if (!user) return;
    const { error } = await supabase
      .from('article_comment_votes')
      .upsert({ comment_id: commentId, user_id: user.id, vote_type: voteType }, { onConflict: 'comment_id,user_id' });

    if (error) {
      toast.error("Failed to register vote", { description: error.message });
    } else {
      fetchEconomyData();
    }
  }, [user, fetchEconomyData]);

  const deleteComment = useCallback(async (commentId: string) => {
    if (!user) return;
    const { error } = await supabase.from('article_comments').delete().eq('id', commentId).eq('user_id', user.id);
    if (error) {
      toast.error("Deletion failed", { description: error.message });
    } else {
      toast.success("Comment removed.");
      fetchEconomyData();
    }
  }, [user, fetchEconomyData]);

  const updateComment = useCallback(async (commentId: string, content: string) => {
    if (!user) return;
    const { error } = await supabase.from('article_comments').update({ content }).eq('id', commentId).eq('user_id', user.id);
    if (error) {
      toast.error("Update failed", { description: error.message });
    } else {
      toast.success("Comment updated.");
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

  /** Helper to find all systems within N jumps of a source system */
  const getSystemsInRange = useCallback((startId: string, range: number) => {
    const results = new Set<string>([startId]);
    if (range <= 0) return results;

    let currentLayer = new Set<string>([startId]);
    for (let i = 0; i < range; i++) {
      const nextLayer = new Set<string>();
      for (const sysId of currentLayer) {
        for (const lane of galaxy.hyperlanes) {
          if (lane.a === sysId) nextLayer.add(lane.b);
          else if (lane.b === sysId) nextLayer.add(lane.a);
        }
      }
      for (const sysId of nextLayer) results.add(sysId);
      currentLayer = nextLayer;
    }
    return results;
  }, [galaxy.hyperlanes]);

  /** Derived: Sites of Interest visible to the player based on Science Vessels and Deep Space Arrays */
  const visibleSitesOfInterest = useMemo(() => {
    if (!sitesOfInterest.length) return [];
    if (adminDebugShowAllSites) return sitesOfInterest;
    
    // 1. Systems with active Science Vessels (must be deployed in a fleet)
    const scienceVesselSystems = new Set<string>();
    
    // Check all vessels, if they are in a system and are 'science' class
    userVessels.forEach(v => {
      // Commander ships should not find SoIs
      if (v.class === 'science' && v.status !== 'docked') {
        const fleet = (userFleets || []).find(f => f.id === v.fleetId);
        const sysId = fleet ? fleet.systemId : v.systemId;
        if (sysId) scienceVesselSystems.add(sysId);
      }
    });

    // 2. Systems within range of Deep Space Arrays
    const dsaSystems = new Set<string>();
    factories
      .filter(f => f.type === 'Deep Space Array' && f.ownerId === user?.id)
      .forEach(f => {
        // DSA Range: Level 1 = 0 (same system), Level 2 = 1, Level 3 = 2
        const range = (f.tier || 1) - 1;
        const inRange = getSystemsInRange(f.systemId, range);
        inRange.forEach(id => dsaSystems.add(id));
      });

    return sitesOfInterest.filter(site => {
      // Visible if:
      // - Science vessel in system
      // - Deep Space Array in range
      // - Player is currently surveying it (safety check)
      const isBeingSurveyed = surveyMissions.some(m => m.siteId === site.id && (m.status === 'researching' || m.status === 'traveling'));
      
      return scienceVesselSystems.has(site.systemId) || 
             dsaSystems.has(site.systemId) || 
             isBeingSurveyed;
    });
  }, [sitesOfInterest, userVessels, factories, user?.id, getSystemsInRange, surveyMissions, adminDebugShowAllSites]);

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
      let foundParty = null;
      let foundMember = null;

      // 1. Try to fetch from party_members
      const { data: membershipArray, error: memErr } = await supabase
        .from('party_members')
        .select('*, parties(*)')
        .eq('user_id', user.id)
        .limit(1);
      
      let membership = membershipArray && membershipArray.length > 0 ? membershipArray[0] : null;

      if (membership && membership.parties) {
        foundMember = membership;
        foundParty = Array.isArray(membership.parties) ? membership.parties[0] : membership.parties;
      } 
      
      // 2. Fallback: check if the user is head of any party (in case member row is missing)
      if (!foundParty) {
        const { data: headParties } = await supabase
          .from('parties')
          .select('*')
          .eq('head_id', user.id)
          .limit(1);
          
        if (headParties && headParties.length > 0) {
          foundParty = headParties[0];
          foundMember = {
            party_id: foundParty.id,
            user_id: user.id,
            role: 'head',
            joined_at: foundParty.created_at
          };
          // Auto-heal the missing party_members row silently
          supabase.from('party_members').insert({ party_id: foundParty.id, user_id: user.id, role: 'head' }).then();
        }
      }

      if (foundParty && foundMember) {
        setUserPartyMember({
          partyId: foundMember.party_id,
          userId: foundMember.user_id,
          role: foundMember.role as PartyRole,
          joinedAt: foundMember.joined_at
        });
        const p = foundParty;
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
          customWages: p.custom_wages || {},
          createdAt: p.created_at
        });
      } else {
        setUserParty(null);
        setUserPartyMember(null);
      }

      // Fetch pending invitations
      const { data: invites } = await supabase
        .from('party_invitations')
        .select('*, parties(*)')
        .eq('user_id', user.id);
      
      if (invites) {
        setPartyInvitations(invites);
      } else {
        setPartyInvitations([]);
      }
    }
  }, [user]);

  const acceptPartyInvite = useCallback(async (partyId: string) => {
    if (!user) return;
    const { error } = await supabase.from('party_members').insert({
      party_id: partyId,
      user_id: user.id,
      role: 'member'
    });
    
    if (error) {
      toast.error("Failed to join", { description: error.message });
    } else {
      // Remove the invitation
      await supabase.from('party_invitations').delete().eq('party_id', partyId).eq('user_id', user.id);
      toast.success("Welcome to the Faction!", { description: "You are now a registered member." });
      fetchParties();
    }
  }, [user, fetchParties]);

  const declinePartyInvite = useCallback(async (partyId: string) => {
    if (!user) return;
    await supabase.from('party_invitations').delete().eq('party_id', partyId).eq('user_id', user.id);
    fetchParties();
  }, [user, fetchParties]);

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

  const inviteToParty = useCallback(async (targetUserId: string) => {
    if (!user || !userPartyMember) return;
    if (userPartyMember.role !== 'head' && userPartyMember.role !== 'officer') {
      toast.error("Unauthorized", { description: "Only faction leaders and officers can send invitations." });
      return;
    }
    const { error } = await supabase.from('party_invitations').insert({
      party_id: userPartyMember.partyId,
      user_id: targetUserId,
      invited_by: user.id
    });
    if (error) {
      if (error.code === '23505') {
        toast.error("Already Invited", { description: "This commander has already been invited to your faction." });
      } else {
        toast.error("Failed to invite", { description: error.message });
      }
    } else {
      toast.success("Invitation Transmitted", { description: "The commander will receive your request to join." });
    }
  }, [user, userPartyMember]);

  const updateProfile = useCallback(async (name: string, avatarUrl: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ commander_name: name, avatar_url: avatarUrl })
      .eq('id', user.id);
    
    if (error) {
      toast.error("Update failed", { description: error.message });
    } else {
      setPlayerName(name);
      setPlayerAvatar(avatarUrl);
      toast.success("Profile Updated", { description: "Your neural identity has been synchronized." });
    }
  }, [user]);


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

  const buildInfrastructure = useCallback(async (infraKey: keyof typeof INFRA_META) => {
    if (!user || !body) return;
    
    // Check for Sanctum systems
    const isSanctum = body.systemId.startsWith('sys-inner-') || body.systemId === 'sys-center';
    if (isSanctum) {
      toast.error("Construction prohibited!", { description: "The Sanctum systems are under NPC jurisdiction." });
      return;
    }

    const meta = INFRA_META[infraKey];

    // Check if user already has this infrastructure type on this planet
    const alreadyHas = factories.some(f => f.bodyId === body.id && f.type === meta.type && f.ownerId === user.id);
    if (alreadyHas) {
      toast.error("Limit reached", { description: `You already own a ${meta.label} on this planet.` });
      return;
    }

    const firstTier = meta.tiers[0];
    const cost = firstTier.costSC;

    if (sc < cost) {
      toast.error("Insufficient Credits!", { description: `Building a ${meta.label} requires ${cost.toLocaleString()} SC.` });
      return;
    }

    // Check materials
    const silo = factories.find(f => f.bodyId === body.id && f.type === 'Resource Silo' && f.ownerId === user.id);
    const useSilo = infraKey === 'deep_space_array';

    if (useSilo && !silo) {
      toast.error("Silo required!", { description: "You must have a Resource Silo on this planet to build a Deep Space Array." });
      return;
    }

    for (const mat of firstTier.mats) {
      if (useSilo) {
        const siloRes = siloInventory.find(r => r.siloId === silo?.id && r.resourceType === mat.resource);
        if ((siloRes?.amount || 0) < mat.qty) {
          toast.error("Insufficient Silo Materials!", { description: `Construction of ${meta.label} requires ${mat.qty}× ${mat.resource} from this planet's silo.` });
          return;
        }
      } else {
        const userRes = userResources.find(r => r.resourceType === mat.resource);
        if ((userRes?.amount || 0) < mat.qty) {
          toast.error("Insufficient Materials!", { description: `Construction of ${meta.label} requires ${mat.qty}× ${mat.resource}.` });
          return;
        }
      }
    }

    // Insert infrastructure record
    const { data: newInfra, error } = await supabase.from('factories').insert({
      system_id: playerSystemId,
      body_id: body.id,
      owner_id: user.id,
      resource_type: 'Structure',
      type: meta.type,
      tier: 1,
      storage_capacity: meta.type === 'Resource Silo' ? (firstTier as {capacity:number}).capacity : (meta.type === 'Drydock' ? (firstTier as {capacity:number}).capacity : 0),
      max_jobs: 0,
      jobs_available: 0,
      wage: 0
    }).select().single();

    if (error) {
      toast.error("Build failed", { description: error.message });
    } else {
      // Spend SC
      await supabase.from('profiles').update({ credits: sc - cost }).eq('id', user.id);
      
      // Consume mats
      for (const mat of firstTier.mats) {
        if (useSilo && silo) {
          await supabase.rpc('consume_silo_resource', {
            p_silo_id: silo.id,
            p_resource_type: mat.resource,
            p_amount: mat.qty
          });
        } else {
          await supabase.rpc('consume_user_resource', {
            p_user_id: user.id,
            p_resource_type: mat.resource,
            p_amount: mat.qty
          });
        }
      }

      setSc(prev => prev - cost);
      toast.success(`${meta.label} Commissioned!`, { description: `Level 1 ${meta.label} has been established on ${body.name}.` });
      logAction('infra_build', `Infrastructure Built: ${meta.label}`, `Established a persistent ${meta.label} at the ${body.name} orbital station.`);
      grantXP('factory_built');
      fetchEconomyData();
    }
  }, [user, body, playerSystemId, sc, userResources, factories, siloInventory, fetchEconomyData, logAction, grantXP]);

  const upgradeInfrastructure = useCallback(async (infraId: string) => {
    if (!user) return;
    const infra = userFactories.find(f => f.id === infraId);
    if (!infra) return;

    const nextTier = (infra.tier || 1) + 1;
    if (nextTier > 3) {
      toast.error("Maximum tier reached!");
      return;
    }

    const infraKey = Object.keys(INFRA_META).find(k => (INFRA_META as any)[k].type === infra.type) as keyof typeof INFRA_META;
    if (!infraKey) return;

    const meta = (INFRA_META as any)[infraKey];
    const tierConfig = meta.tiers[nextTier - 1];
    const cost = tierConfig.costSC;

    if (sc < cost) {
      toast.error("Insufficient Credits!", { description: `Upgrading to T${nextTier} requires ${cost.toLocaleString()} SC.` });
      return;
    }

    // Check materials
    const silo = factories.find(f => f.bodyId === infra.bodyId && f.type === 'Resource Silo' && f.ownerId === user.id);
    const useSilo = infraKey === 'deep_space_array';

    if (useSilo && !silo) {
      toast.error("Silo required!", { description: "You must have a Resource Silo on this planet to upgrade the Deep Space Array." });
      return;
    }

    for (const mat of tierConfig.mats) {
      if (useSilo) {
        const siloRes = siloInventory.find(r => r.siloId === silo?.id && r.resourceType === mat.resource);
        if ((siloRes?.amount || 0) < mat.qty) {
          toast.error("Insufficient Silo Materials!", { description: `Upgrade of ${meta.label} requires ${mat.qty}× ${mat.resource} from this planet's silo.` });
          return;
        }
      } else {
        const userRes = userResources.find(r => r.resourceType === mat.resource);
        if ((userRes?.amount || 0) < mat.qty) {
          toast.error("Insufficient Materials!", { description: `Upgrade requires ${mat.qty}× ${mat.resource}.` });
          return;
        }
      }
    }

    // Apply upgrade
    const { error } = await supabase.from('factories').update({
       tier: nextTier,
       storage_capacity: (meta.type === 'Resource Silo' || meta.type === 'Drydock') ? tierConfig.capacity : 0
    }).eq('id', infraId);

    if (error) {
      toast.error("Upgrade failed", { description: error.message });
    } else {
       // Consume resources
       await supabase.from('profiles').update({ credits: sc - cost }).eq('id', user.id);
       for (const mat of tierConfig.mats) {
         if (useSilo && silo) {
           await supabase.rpc('consume_silo_resource', {
             p_silo_id: silo.id,
             p_resource_type: mat.resource,
             p_amount: mat.qty
           });
         } else {
           await supabase.rpc('consume_user_resource', {
             p_user_id: user.id,
             p_resource_type: mat.resource,
             p_amount: mat.qty
           });
         }
       }

       setSc(prev => prev - cost);
       toast.success(`${meta.label} Upgraded!`, { description: `Facility enhanced to Tier ${nextTier}.` });
       logAction('infra_upgrade', `Infrastructure Upgraded: ${meta.label}`, `Completed structural enhancements for Level ${nextTier} ${meta.label}.`);
       fetchEconomyData();
    }
  }, [user, factories, sc, userResources, siloInventory, fetchEconomyData, logAction]);

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
      if (inv) setUserResources(inv.map(r => ({ userId: r.user_id, fleetId: r.fleet_id, resourceType: r.resource_type, amount: r.amount })));
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

    const cost = getActionCost(5);
    if (ap < cost) {
      toast.error(`Insufficient AP! Shift requires ${cost} AP`);
      return;
    }

    const wageBonus = computeSkillBonus("factory_wage_bonus", playerSkills);
    const xpBonus   = computeSkillBonus("factory_xp_bonus", playerSkills);

    const { data, error } = await supabase.rpc('work_at_factory', {
      p_user_id: user.id,
      p_factory_id: currentJob.factoryId,
      p_ap_cost: cost,
      p_wage_bonus: wageBonus,
      p_xp_bonus: xpBonus
    });

    if (error || (data as any)?.error) {
      toast.error("Work failed", { description: (data as any)?.error || error?.message });
    } else {
      setAp(prev => prev - cost);
      // We don't manually update SC/Resource here, we let the polling/profile sync handle it
      // but we should trigger a refresh
      fetchEconomyData();
      
       // Manually refresh profile for credits and inventory
      const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
      if (profile) setSc(profile.credits);
      
      const { data: inv } = await supabase.from('user_resources').select('*').eq('user_id', user.id);
      if (inv) setUserResources(inv.map(r => ({ userId: r.user_id, fleetId: r.fleet_id, resourceType: r.resource_type, amount: r.amount })));
      
      if (data) {
        const result = data as { wage: number; resource_yield: number; resource_type: string; redirected_to_silo: boolean };
        const location = result.redirected_to_silo ? "deposited in local Silo" : "stored at factory";
        toast.success(`Shift complete — +${result.wage} SC, +${result.resource_yield}× ${result.resource_type} (${location})`);
      } else {
        toast.success("Work shift completed", { description: "Wages deposited to your account." });
      }
      
      const xpBonus = computeSkillBonus('factory_xp_bonus', playerSkills);
      grantXP('factory_worked', xpBonus);
    }
  }, [user, currentJob, ap, fetchEconomyData, grantXP, playerSkills, getActionCost]);

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
      if (inv) setUserResources(inv.map(r => ({ userId: r.user_id, fleetId: r.fleet_id, resourceType: r.resource_type, amount: r.amount })));
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

  const transferSiloResource = useCallback(async (siloId: string, resourceType: string, amount: number) => {
    if (!user) return;
    const { error } = await supabase.rpc('transfer_silo_resource', {
      p_silo_id: siloId,
      p_resource_type: resourceType,
      p_amount: amount
    });
    if (error) {
      toast.error("Transfer failed", { description: error.message });
    } else {
      toast.success(amount > 0 ? `Deposited ${amount}× ${resourceType}` : `Withdrew ${Math.abs(amount)}× ${resourceType}`);
      fetchEconomyData();
      fetchSiloInventory();
      // Refresh inventory
      const { data: inv } = await supabase.from('user_resources').select('*').eq('user_id', user.id);
      if (inv) setUserResources(inv.map(r => ({ userId: r.user_id, fleetId: r.fleet_id, resourceType: r.resource_type, amount: r.amount })));
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
      if (inv) setUserResources(inv.map(r => ({ userId: r.user_id, fleetId: r.fleet_id, resourceType: r.resource_type, amount: r.amount })));
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
      if (inv) setUserResources(inv.map(r => ({ userId: r.user_id, fleetId: r.fleet_id, resourceType: r.resource_type, amount: r.amount })));
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
      if (inv) setUserResources(inv.map(r => ({ userId: r.user_id, fleetId: r.fleet_id, resourceType: r.resource_type, amount: r.amount })));
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
      if (inv) setUserResources(inv.map(r => ({ userId: r.user_id, fleetId: r.fleet_id, resourceType: r.resource_type, amount: r.amount })));
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
      if (inv) setUserResources(inv.map(r => ({ userId: r.user_id, fleetId: r.fleet_id, resourceType: r.resource_type, amount: r.amount })));
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




  // Ensure current location is always marked as explored
  useEffect(() => {
    if (!initialDataLoaded || !user) return;
    
    const bodyId = playerBodyId || 'star';
    const bodyKey = `${playerSystemId}:${bodyId}`;
    
    if (playerSystemId && (!exploredSystemIds.has(playerSystemId) || !exploredBodyIds.has(bodyKey))) {
      // Sync to DB
      supabase.from('exploration_logs').upsert({
        user_id: user.id,
        system_id: playerSystemId,
        body_id: bodyId
      }, { ignoreDuplicates: true }).then();

      setExploredSystemIds(prev => new Set(prev).add(playerSystemId));
      setExploredBodyIds(prev => new Set(prev).add(bodyKey));
      console.log(`[Exploration] Physical discovery synced: ${playerSystemId} / ${bodyId}`);
    }
  }, [playerSystemId, playerBodyId, exploredSystemIds, exploredBodyIds, initialDataLoaded, user]);

  const lastResolvedTravelRef = useRef<string | null>(null);

  // Arrive at destination
  useEffect(() => {
    if (!initialDataLoaded || !travel) return;
    
    // Create a unique key for this specific jump
    const jumpKey = `${travel.targetId}:${travel.startTime}`;
    if (lastResolvedTravelRef.current === jumpKey) return;

    if (currentTime >= travel.endTime) {
      lastResolvedTravelRef.current = jumpKey;
      const targetId = travel.targetId;
      const travelType = travel.type ?? "inter";

      console.log(`[Navigation] Resolving ${travelType} transit to ${targetId}`);

      if (travelType === "intra") {
        setPlayerBodyId(targetId);
        setExploredBodyIds(prev => {
          const next = new Set(prev);
          next.add(`${playerSystemId}:${targetId}`);
          return next;
        });
        
        // Sync to DB
        if (user) {
          supabase.from('exploration_logs').upsert({
            user_id: user.id,
            system_id: playerSystemId,
            body_id: targetId
          }, { ignoreDuplicates: true }).then();
        }

        setTravel(null);
        toast.success("Arrival confirmed", {
          description: `Vessel has entered orbit around ${targetId === "star" ? "the system star" : targetId}.`
        });
      } else {
        const fromId = playerSystemId;
        setPlayerSystemId(targetId);
        setPlayerBodyId("star"); // Default to star on jump arrival
        setTravel(null);
        
        // Auto-focus the camera and UI on the new system if we are already viewing the player's old system
        if (view === "system" && systemId === playerSystemId) {
          setSystemId(targetId);
        }
        
        // Set arrival sequence (approx 10s sub-light transit to star)
        setArrival({ fromId, startTime: Date.now(), duration: 10000 });

        setExploredSystemIds(prev => {
          const next = new Set(prev);
          if (!next.has(targetId)) {
            next.add(targetId);
            logAction('exploration', `System Discovered: ${galaxy.systemById[targetId]?.name || targetId}`, `Successfully mapped the ${targetId} sector and established orbital reconnaissance.`);
            const explorationBonus = computeSkillBonus('exploration_xp_bonus', playerSkills);
            grantXP('system_explored', explorationBonus);
            
            // Sync to DB
            if (user) {
              supabase.from('exploration_logs').upsert({
                user_id: user.id,
                system_id: targetId,
                body_id: 'star'
              }, { ignoreDuplicates: true }).then();
            }
          }
          return next;
        });
        setExploredBodyIds(prev => {
          const next = new Set(prev);
          next.add(`${targetId}:star`);
          return next;
        });

        // Update path tracking
        setJumpPath(prev => {
          if (prev.length > 1 && prev[1] === targetId) {
            return prev.slice(1);
          }
          if (prev.length > 0 && prev[0] === targetId) {
             return prev; // Already arrived at first step
          }
          return []; // Path broken or finished
        });
      }
    }
  }, [travel, currentTime, playerSystemId, playerSkills, grantXP, logAction, galaxy, user, initialDataLoaded]);

  // Multi-jump journey auto-continuation
  useEffect(() => {
    if (!initialDataLoaded || travel) return;

    // Check if we are in an arrival sequence but have more jumps to do
    // We allow continuation even during arrival for a smoother journey
    if (jumpPath.length > 1) {
      // Trigger the next jump in the sequence
      const nextStepId = jumpPath[1];
      const finalDestId = jumpPath[jumpPath.length - 1];
      
      const timer = setTimeout(() => {
        // Journey is already paid for upfront, pass true for isContinuation
        initiateJump(finalDestId, journeyTargetBodyId, true);
      }, 800);

      return () => clearTimeout(timer);
    } else if (jumpPath.length === 1 && journeyTargetBodyId && journeyTargetBodyId !== "star") {
      // Arrived at final system, now initiate sub-light travel to the target body
      const timer = setTimeout(() => {
        initiateTravelToBody(journeyTargetBodyId);
        setJourneyTargetBodyId(null);
        setJumpPath([]);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [travel, arrival, jumpPath, initiateJump, initiateTravelToBody, initialDataLoaded, playerSystemId, ap, getJumpCostBetween, journeyTargetBodyId]);

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

  const assignSurveyMission = async (siteId: string, vesselId: string) => {
    if (!user) return;
    const { data, error } = await supabase.rpc('assign_survey_mission', {
      p_site_id: siteId,
      p_vessel_id: vesselId,
      p_player_id: user.id
    });
    if (error || (data as any)?.error) {
      toast.error('Mission Assignment Failed', { description: (data as any)?.error ?? error?.message });
      return;
    }
    toast.success('Survey Mission Assigned', { description: 'The vessel is preparing for reconnaissance.' });
    
    logAction('survey_start', `Survey Mission Initiated`, `A science vessel has been deployed to conduct an orbital survey of an anomaly.`);
    
    // Manually refresh to ensure UI state consistency
    if (data && (data as any).success) {
      const completesAt = (data as any).completes_at;
      // Optimistically add mission if not already there via realtime
      setSurveyMissions(prev => {
        if (prev.some(m => m.siteId === siteId)) return prev;
        return [...prev, {
          id: 'temp-' + Date.now(),
          siteId,
          vesselId,
          playerId: user.id,
          startedAt: new Date().toISOString(),
          completesAt,
          status: 'researching',
          rewardClaimed: false
        }];
      });

      // Update site status to in_progress locally
      setSitesOfInterest(prev => prev.map(s => s.id === siteId ? { ...s, status: 'in_progress' } : s));
      
      // Update vessel status to surveying locally
      setUserVessels(prev => prev.map(v => v.id === vesselId ? { ...v, status: 'surveying' } : v));
    }
  };

  const collectSurveyReward = async (missionId: string) => {
    if (!user) return;
    const { data, error } = await supabase.rpc('collect_survey_reward', {
      p_mission_id: missionId,
      p_player_id: user.id
    });
    if (error || (data as any)?.error) {
      toast.error('Reward Collection Failed', { description: (data as any)?.error ?? error?.message });
      return;
    }
    toast.success('Survey Rewards Collected', { description: 'Scientific data and assets processed.' });
    
    logAction('survey_complete', `Survey Rewards Collected`, `Successfully retrieved and processed scientific data from the survey site.`);
  };

  const abandonSurveyMission = async (missionId: string) => {
    if (!user) return;
    const { data, error } = await supabase.rpc('abandon_survey_mission', {
      p_mission_id: missionId,
      p_player_id: user.id
    });
    if (error || (data as any)?.error) {
      toast.error('Mission Abandon Failed', { description: (data as any)?.error ?? error?.message });
      return;
    }
    toast.info('Survey Mission Abandoned');
  };

  return {
    sitesOfInterest: visibleSitesOfInterest,
    surveyMissions,
    assignSurveyMission,
    collectSurveyReward,
    abandonSurveyMission,
    galaxy: effectiveGalaxy,
    view,
    setView,
    parties,
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
    getJumpCostBetween,
    getPathCost,
    calculatePath,
    jumpPath,
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
    debugShowAllSites: adminDebugShowAllSites,
    setDebugShowAllSites,
    instantBuilds: adminDebugInstantBuilds,
    setInstantBuilds,
    userFactories,
    bodyResources,
    userResources,
    currentJob,
    factoryInputStorage,
    depositFactoryInput,
    buildFactory,
    buildInfrastructure,
    upgradeInfrastructure,
    applyForJob,
    workJob,
    leaveJob,
    collectFactory,
    upgradeFactory,
    updateFactorySettings,
    cargoCapacity: vessel?.cargoCapacity || cargoCapacity,
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
    deleteArticle,
    updateArticle,
    postComment,
    voteComment,
    deleteComment,
    updateComment,
    userLogs,
    userFleets,
    setUserFleets,
    constructionQueue,
    fetchConstructionQueue,
    fetchFleets,
    siloInventory,
    fetchSiloInventory,
    transferSiloResource,
    queueShipBuild,
    updateVesselConfig,
    transferShipToDrydock,
    formFleet,
    disbandFleet,
    renameFleet,
    initiateFleetJump,
    initiateFleetTravelToBody,
    fleetCount,
    selectedEntityId,
    setSelectedEntityId,
    isTrackingShip,
    setIsTrackingShip,
    logAction,
    cargoUsed: userResources
      .filter(r => r.fleetId === selectedFleetId)
      .reduce((sum, r) => sum + r.amount, 0),
    userParty,
    userPartyMember,
    partyInvitations,
    createParty,
    joinParty,
    applyToParty,
    inviteToParty,
    acceptPartyInvite,
    declinePartyInvite,
    updateProfile,
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
    searchResults,
    isSearching,
    userVessels,
    selectedVesselId,
    selectVessel,
    commissionVessel,
    isFleetSidebarOpen,
    toggleFleetSidebar,
    isPlayerStatusSidebarOpen,
    togglePlayerStatusSidebar,

    performSearch: useCallback(async (query: string) => {
      if (!query || query.length < 2) {
        setSearchResults({ users: [], parties: [], states: [], systems: [], bodies: [], wiki: [] });
        return;
      }
      setIsSearching(true);
      try {
        const [profiles, partiesRes, empires] = await Promise.all([
          supabase.from('profiles').select('id, commander_name, avatar_url, level').ilike('commander_name', `%${query}%`).limit(5),
          supabase.from('parties').select('id, name, tag, logo_symbol, hue, region_id').or(`name.ilike.%${query}%,tag.ilike.%${query}%`).limit(5),
          supabase.from('player_empires').select('id, name, tag, hue').or(`name.ilike.%${query}%,tag.ilike.%${query}%`).limit(5)
        ]);

        const q = query.toLowerCase();
        
        // Search Systems
        const matchingSystems = galaxy.systems
          .filter(s => s.name.toLowerCase().includes(q))
          .slice(0, 5);

        // Search Bodies
        const matchingBodies: any[] = [];
        for (const s of galaxy.systems) {
          for (const b of s.bodies) {
            if (b.name.toLowerCase().includes(q)) {
              matchingBodies.push({ ...b, systemId: s.id, systemName: s.name });
              if (matchingBodies.length >= 5) break;
            }
          }
          if (matchingBodies.length >= 5) break;
        }

        // Search Wiki
        const matchingWiki = WIKI_DATA
          .filter(w => w.title.toLowerCase().includes(q) || w.content.toLowerCase().includes(q))
          .slice(0, 5)
          .map(w => ({ id: w.id, title: w.title, category: w.category }));
        
        setSearchResults({
          users: profiles.data || [],
          parties: partiesRes.data || [],
          states: empires.data || [],
          systems: matchingSystems,
          bodies: matchingBodies,
          wiki: matchingWiki
        });
      } catch (e) {
        console.error("Search failed", e);
      } finally {
        setIsSearching(false);
      }
    }, []),

    viewedUserId,
    setViewedUserId,
    viewedPartyId,
    viewedStateId,
    
    // Wiki
    wikiSectionId,
    setWikiSectionId,

    navigateToPublicProfile: useCallback((id: string) => {
      setReturnPage(page);
      setViewedUserId(id);
      setPage('profile');
    }, [page]),

    navigateToPublicParty: useCallback((id: string) => {
      setReturnPage(page);
      setViewedPartyId(id);
      setPage('party');
    }, [page]),

    navigateToPublicState: useCallback((id: string) => {
      setReturnPage(page);
      setViewedStateId(id);
      setPage('empire');
    }, [page]),

    resetPublicViews: useCallback(() => {
      setViewedUserId(null);
      setViewedPartyId(null);
      setViewedStateId(null);
      setPage(returnPage);
    }, [returnPage]),

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
          // Start primary election (24hrs)
          const primaryEnd = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
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
      // Fetch latest data to avoid stale state issues and ensure trigger counts are processed
      const { data: ref, error: fetchErr } = await supabase.from('state_formation_votes').select('*').eq('id', referendumId).single();
      if (fetchErr || !ref) { toast.error("Referendum data not found."); return; }
      
      if (ref.status !== 'pending') { toast.error("Referendum already resolved."); return; }
      if (new Date(ref.ends_at) > new Date()) { toast.error("Referendum has not ended yet."); return; }

      if (ref.yes_votes > ref.no_votes) {
        // Passed — create empire and start primary election
        const { data: empire, error: empireErr } = await supabase.from('player_empires').insert({
          name: ref.empire_name, tag: ref.empire_tag, hue: ref.hue,
          founder_id: user.id, capital_body_id: ref.body_id, phase: 'primary'
        }).select().single();
        if (empireErr) { toast.error("Failed to form empire: " + empireErr.message); return; }
        // Update body governance
        await supabase.from('body_governance').update({
          status: 'imperial', empire_id: empire.id, formation_referendum_id: null
        }).eq('body_id', ref.body_id);
        setBodyGovernance(prev => ({ ...prev, [ref.body_id]: { status: 'imperial', electionEndTime: null, formationReferendumId: null, empireId: empire.id } }));
        // Mark referendum passed
        await supabase.from('state_formation_votes').update({ status: 'passed' }).eq('id', referendumId);
        setFormationReferendums(prev => prev.filter(r => r.id !== referendumId));
        // Start primary election (24hrs)
        const primaryEnd = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await supabase.from('state_elections').insert({
          state_id: empire.id, election_type: 'parliamentary', start_time: new Date().toISOString(), end_time: primaryEnd, status: 'active'
        });
        toast.success(`${ref.empire_name} has been formally established!`, { description: "Primary elections are now open. Parties may register candidates." });
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
      
      // Momentarily pause sync effects during the multi-stage initialization
      setInitialDataLoaded(false);

      try {
        // 1. Create/Update Profile
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: user.id,
          commander_name: name,
          avatar_url: avatar,
          credits: 15000,
          cargo_capacity: 5000,
          level: 1,
          xp: 0,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        });
        if (profileError) throw new Error("Failed to create profile: " + profileError.message);

        // 2. Deactivate any existing commander vessels for this user
        await supabase.from('vessels').update({ is_active: false }).eq('user_id', user.id);

        // 3. Create Vessel
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
        
        if (vesselError) throw new Error("Failed to commission vessel: " + vesselError.message);

        // 3. Create initial Fleet Position at Central Star
        const { error: posError } = await supabase.from('fleet_positions').insert({
          user_id: user.id,
          vessel_id: vessel.id,
          system_id: 'sys-center',
          body_id: 'star'
        });
        if (posError) console.error("Initial position insertion error (ignoring):", posError);

        // 4. Update local state
        setPlayerName(name);
        setPlayerAvatar(avatar);
        setShipConfig(config);
        setVesselId(vessel.id);
        setSc(15000);
        setCargoCapacity(5000);
        setPlayerSystemId('sys-center');
        setPlayerBodyId('star');
        
        toast.success("Welcome to the Hegemony, Commander.");
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        // Always resume data sync after the attempt
        setInitialDataLoaded(true);
      }
    },
    logout: async () => {
      await supabase.auth.signOut();
      setPage("map");
      setInitialDataLoaded(false);
      lastUserIdRef.current = null;
    }
  };
}

export type GalaxyApp = ReturnType<typeof useGalaxyApp>;
