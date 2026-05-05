// Domain types for the galaxy simulation.

export type StarType =
  | "O" | "B" | "A" | "F" | "G" | "K" | "M"
  | "neutron" | "blackhole" | "pulsar" | "binary" | "trinary" | "whitedwarf" | "whitehole"
  | "magnetar" | "protostar" | "dyson_swarm";

export type BodyType = "terrestrial" | "gas_giant" | "moon" | "asteroid" | "station" | "jump_gate" | "ship" | "star";

export type ContestState = "controlled" | "contested" | "anarchic" | "frontier";

export type EconomicStatus = "boom" | "stable" | "recession" | "blockaded" | "untapped";

export interface GovernmentOfficial {
  name: string;
  role: string;
  party: string;
}

export interface CouncilSeat {
  id: number;
  factionId: string;
  occupantName?: string;
}

export type GovernmentType = 
  | "Parliamentary republic"
  | "Presidential republic"
  | "Dominant-party"
  | "Dictatorship"
  | "One-party system"
  | "Executive monarchy"
  | "Provisional Council";

export interface Empire {
  id: string;
  name: string;
  /** Hue 0-360 used to colour-code holdings. */
  hue: number;
  tag: string;
  /** Visual tokens for logo generation */
  logo: {
    symbol: string;         // Icon name
    pattern: string;        // 'grid' | 'dots' | 'waves' etc.
    secondaryHue: number;   // For the symbol
  };
  government: {
    type: GovernmentType;
    president: GovernmentOfficial | null;
    vicePresident: GovernmentOfficial | null;
    ministers: GovernmentOfficial[];
    council: {
      totalSeats: number;
      factions: { id: string; name: string; color: string; count: number }[];
      seats: CouncilSeat[];
    };
  };
}

export type PlanetSubtype = 
  // Habitable: Dry
  | "desert" | "arid" | "savanna"
  // Habitable: Temperate
  | "continental" | "ocean" | "tropical"
  // Habitable: Cold
  | "arctic" | "alpine" | "tundra"
  // Special Habitable
  | "gaia" | "tomb" | "relic" | "ecumenopolis" | "hive" | "machine" | "nanite"
  // Uninhabitable
  | "barren" | "toxic" | "frozen" | "gas_giant" | "molten" | "shrouded" | "broken" | "shattered" | "shielded" | "infested"
  // Utilities / legacy
  | "asteroid" | "station" | "station_habitat" | "station_refinery" | "station_outpost" | "station_hub" | "moon" | "rocky_moon" | "commander" | "gas_giant_hot" | "gas_giant_cold" | "lava" | "temperate" | "ice" | "rogue" | "carbon" | "super_earth";

export interface Body {
  id: string;
  systemId: string;
  name: string;
  type: BodyType;
  subtype: PlanetSubtype;
  /** Orbital radius in scene units. */
  orbit: number;
  /** Initial orbital phase in radians. */
  phase: number;
  /** Visual size in scene units. */
  size: number;
  /** Surface / atmosphere hue 0-360. */
  hue: number;
  /** Whether the world is encased in an energy shield. */
  isShielded?: boolean;
  ownerId: string | null;
  population: number; // millions
  deposits: ResourceDeposit[];
  economy: EconomicStatus;
  /** Parent body ID if this is a moon. */
  parentId?: string;
  children?: Body[];
  temperature: number; // K
  habitabilityZone: "hot" | "temperate" | "cold" | "none";
  flora: "none" | "sparse" | "abundant" | "exotic";
  fauna: "none" | "sparse" | "abundant" | "hostile";
  hazards: string[];
  landColor?: string; // hex
  seaColor?: string; // hex
  atmosphere?: string | null;
  hasRings?: boolean;
  ringHue?: number; // 0-360, tint colour of the ring system
  terrainSeed?: number;
  geographyType?: "pangaea" | "continental" | "islands";
}

export interface ResourceDeposit {
  resource: string;           // "Ore" | "Helium-3" | etc.
  richness: "trace" | "moderate" | "significant" | "rich" | "abundant";
  depleted: boolean;
}

export interface Installation {
  id: string;
  systemId: string;
  bodyId: string;
  type: string;
  resourceType: string;
  ownerId: string | null;            // null for NPC
  jobsAvailable: number;
  wage: number;
  isNpcOwned: boolean;
  storage: number;
  storageTier: number;
  slotTier: number;
  replenishTier: number;
  // Derived
  storageCapacity: number;           // computed from storageTier
}

export interface FactoryWorker {
  userId: string;
  factoryId: string;
  hiredAt: string;
}

export interface BodyResource {
  bodyId: string;
  resourceType: string;
  currentAmount: number;
  maxAmount: number;
  lastReplenishedAt: string;
  richnessValue: number;
}

export interface UserResource {
  userId: string;
  resourceType: string;
  amount: number;
}

export interface MarketListing {
  id: string;
  sellerId: string;
  resourceType: string;
  amount: number;
  amountRemaining: number;
  pricePerUnit: number;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'sold' | 'expired' | 'cancelled';
}

export interface Corporation {
  id: string;
  name: string;
  tag: string;
  ownerId: string;            // player id
  treasurySC: number;
  isPrimordial: boolean;      // NPC seeded corp
  dissolvesOnDay?: number;    // primordial dissolution schedule
}

export interface MarketOrder {
  id: string;
  sectorId: string;
  resource: string;
  type: "buy" | "sell";
  price: number;              // SC per unit
  quantity: number;
  postedById: string;         // player or corp id
  postedAt: number;           // timestamp
}

export interface JumpGate {
  id: string;
  systemId: string;
  /** Other system this gate connects to. */
  targetSystemId: string;
  ownerId: string | null;
  toll: number;
  /** If true, the gate is physically present but cannot be traversed (one-way passage). */
  locked?: boolean;
}

export interface StarSystem {
  id: string;
  sectorId: string;
  name: string;
  /** Galaxy-space position. */
  pos: [number, number, number];
  starType: StarType;
  contest: ContestState;
  economy: EconomicStatus;
  ownerId?: string | null;
  /** All orbiting bodies (planets, moons, asteroids, stations). */
  bodies: Body[];
  gates: JumpGate[];
  /** Sector hue, mirrored for quick rendering. */
  sectorHue: number;
}

export interface Sector {
  id: string;
  name: string;
  hue: number;
  /** Centroid of contained systems for label placement. */
  centroid: [number, number, number];
  /** Approx radius enclosing the sector's systems (for border rendering). */
  radius: number;
  systemIds: string[];
}

export interface Hyperlane {
  id: string;
  a: string; // systemId
  b: string; // systemId
}

export interface Galaxy {
  seed: number;
  sectors: Sector[];
  systems: StarSystem[];
  hyperlanes: Hyperlane[];
  empires: Empire[];
  /** Quick lookup. */
  systemById: Record<string, StarSystem>;
  sectorById: Record<string, Sector>;
  bodyById: Record<string, Body>;
}

// --- Political Factions (Parties) ---

export type PartyRole = "head" | "secretary" | "member";

export interface PartyMember {
  partyId: string;
  userId: string;
  role: PartyRole;
  joinedAt: string;
}

export interface Party {
  id: string;
  name: string;
  tag: string;
  ideology: string;
  description: string;
  logoUrl?: string;
  logoSymbol?: string;
  hue?: number;
  headId: string;
  regionId: string;      // bodyId (planet/moon) where founded
  dailyWage: number;     // SC daily wage
  customWages: Record<string, number>; // userId -> SC amount
  createdAt: string;
}
export interface Residency {
  userId: string;
  bodyId: string;
  joinedAt: string;
}

export interface ResidencyApplication {
  id: string;
  userId: string;
  bodyId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface StateElection {
  id: string;
  stateId: string;
  electionType: 'parliamentary' | 'presidential';
  startTime: string;
  endTime: string;
  status: 'upcoming' | 'active' | 'finished';
}

export interface StateVote {
  electionId: string;
  voterId: string;
  candidatePartyId?: string;
  candidateUserId?: string;
}

export interface StateFormationVote {
  id: string;
  bodyId: string;
  empireName: string;
  empireTag: string;
  hue: number;
  proposedBy: string;
  endsAt: string;
  status: 'pending' | 'passed' | 'failed';
  yesVotes: number;
  noVotes: number;
  createdAt: string;
}

export interface StateFormationBallot {
  referendumId: string;
  voterId: string;
  vote: 'yes' | 'no';
}

export interface BodyGovernanceEntry {
  status: string;
  electionEndTime: string | null;
  formationReferendumId?: string | null;
  empireId?: string | null;
}

export interface ElectionCandidate {
  id: string;
  electionId: string;
  partyId?: string | null;
  userId?: string | null;
  voteCount: number;
  registeredAt: string;
}

export interface ElectionBallot {
  electionId: string;
  voterId: string;
  candidateId: string;
}

export interface MinisterialAssignment {
  id: string;
  empireId: string;
  userId: string;
  roleName: string;
  appointedBy: string;
  appointedAt: string;
  // denormalized for display
  userName?: string;
  userAvatar?: string;
}

export interface PlayerEmpire {
  id: string;
  name: string;
  tag: string;
  hue: number;
  founderId: string;
  capitalBodyId: string;
  phase: 'formation' | 'primary' | 'leader' | 'active';
  leaderId?: string | null;
  viceLeaderId?: string | null;
  createdAt: string;
}
