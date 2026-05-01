// Domain types for the galaxy simulation.

export type StarType =
  | "O" | "B" | "A" | "F" | "G" | "K" | "M"
  | "neutron" | "blackhole" | "pulsar" | "binary" | "trinary" | "whitedwarf" | "whitehole"
  | "magnetar" | "protostar" | "dyson_swarm";

export type BodyType = "terrestrial" | "gas_giant" | "moon" | "asteroid" | "station" | "jump_gate" | "ship" | "star";

export type ContestState = "controlled" | "contested" | "anarchic" | "frontier";

export type EconomicStatus = "boom" | "stable" | "recession" | "blockaded" | "untapped";

export interface Empire {
  id: string;
  name: string;
  /** Hue 0-360 used to colour-code holdings. */
  hue: number;
  tag: string;
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
  bodyId: string;
  type: "extraction_rig" | "fabricator" | "assembly_array" | "shipyard" | "power_plant" | "warehouse" | "market_terminal" | "barracks";
  ownerId: string;            // corp or empire
  level: number;              // 1–5
  workerCount: number;
  inputBuffer:  Record<string, number>;
  outputBuffer: Record<string, number>;
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
}
