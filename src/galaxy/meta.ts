// Star type metadata for rendering and overview UI.

import type { StarType } from "./types";

export interface StarMeta {
  label: string;
  /** Full descriptive type name. */
  description: string;
  /** Tailwind class for color swatches/text. */
  color: string;
  /** Hex (without #) approximating the star's emission for THREE.Color. */
  hex: string;
  /** Approx temperature in K for the overview. */
  temp: string;
}

export const BODY_META = {
  terrestrial: { label: "Terrestrial", icon: "Globe" },
  gas_giant: { label: "Gas Giant", icon: "CircleDot" },
  moon: { label: "Moon", icon: "Moon" },
  asteroid: { label: "Asteroid", icon: "Shapes" },
  station: { label: "Station", icon: "Hexagon" },
  jump_gate: { label: "Jump Gate", icon: "Hexagon" },
  ship: { label: "Flagship", icon: "Rocket" },
  star: { label: "Star", icon: "Sun" },
} as const;

export const STAR_BASE_SIZE: Record<StarType, number> = {
  O: 32.0, B: 24.0, A: 12.0, F: 6.0, G: 4.5, K: 3.2, M: 2.2,
  whitedwarf: 0.8, neutron: 0.4, pulsar: 0.5, binary: 18.0, trinary: 24.0, blackhole: 8.0, whitehole: 60.0,
  magnetar: 0.6, protostar: 12.0, dyson_swarm: 50.0,
};

export const STAR_MASS: Record<StarType, number> = {
  O: 16.0, B: 8.0, A: 3.0, F: 1.4, G: 1.0, K: 0.8, M: 0.4,
  whitedwarf: 0.6, neutron: 1.4, pulsar: 1.5, binary: 2.0, trinary: 3.0, blackhole: 10.0, whitehole: 50.0,
  magnetar: 1.6, protostar: 0.8, dyson_swarm: 1.0,
};

export function getOrbitalSpeed(r: number, starType: StarType, isMoon: boolean) {
  if (isMoon) return 0.08; // Moons stay at a fixed relative speed for now
  const mass = STAR_MASS[starType] || 1.0;
  // v = sqrt(GM/r). Greatly slowed down for easier clicking.
  return 0.04 * Math.sqrt(mass / Math.max(1, r));
}

export function getBodyPosition(body: { orbit: number; phase: number; type: string; parentId?: string | null }, starType: StarType, time: number) {
  const t = time * 0.001;
  const speed = getOrbitalSpeed(body.orbit, starType, !!body.parentId || body.type === "moon");
  const angle = (body.phase || 0) + (t * speed) % (Math.PI * 2);
  
  return {
    x: Math.cos(angle) * body.orbit,
    z: Math.sin(angle) * body.orbit
  };
}

export const STAR_LUMINOSITY: Record<StarType, number> = {
  O: 40.0, B: 15.0, A: 5.0, F: 2.5, G: 1.0, K: 0.4, M: 0.08,
  whitedwarf: 0.01, neutron: 0.005, pulsar: 0.005, binary: 2.0, trinary: 3.5, blackhole: 0.001, whitehole: 100.0,
  magnetar: 0.02, protostar: 0.2, dyson_swarm: 5.0,
};

export const STAR_META: Record<StarType, StarMeta> = {
  O: { label: "O-class", description: "Blue supergiant", color: "text-star-o", hex: "9bb8ff", temp: "30,000 K+" },
  B: { label: "B-class", description: "Blue-white giant", color: "text-star-b", hex: "aac8ff", temp: "10,000–30,000 K" },
  A: { label: "A-class", description: "White main sequence", color: "text-star-a", hex: "cfeaff", temp: "7,500–10,000 K" },
  F: { label: "F-class", description: "Yellow-white", color: "text-star-f", hex: "ffefb8", temp: "6,000–7,500 K" },
  G: { label: "G-class", description: "Yellow main sequence", color: "text-star-g", hex: "ffd24a", temp: "5,200–6,000 K" },
  K: { label: "K-class", description: "Orange dwarf", color: "text-star-k", hex: "ff9442", temp: "3,700–5,200 K" },
  M: { label: "M-class", description: "Red dwarf", color: "text-star-m", hex: "ff5535", temp: "2,400–3,700 K" },
  whitedwarf: { label: "White Dwarf", description: "Dense stellar remnant", color: "text-star-a", hex: "e8f4ff", temp: "8,000–40,000 K" },
  neutron: { label: "Neutron Star", description: "Ultra-dense remnant, rapid rotation", color: "text-star-neutron", hex: "d6f7ff", temp: "600,000 K" },
  pulsar: { label: "Pulsar", description: "Spinning remnant with relativistic jets", color: "text-star-pulsar", hex: "8ff5ff", temp: "1,000,000 K" },
  binary: { label: "Binary System", description: "Two stars in mutual orbit", color: "text-star-binary", hex: "ffb066", temp: "varies" },
  trinary: { label: "Trinary System", description: "Binary pair orbited by a third star", color: "text-star-binary", hex: "ffcc99", temp: "varies" },
  blackhole: { label: "Black Hole", description: "Singularity with accretion disk", color: "text-star-blackhole", hex: "1a0033", temp: "—" },
  whitehole: { label: "White Hole", description: "Sagittarius Z* - Galactic Fountain", color: "text-primary", hex: "ffffff", temp: "∞ K" },
  magnetar: { label: "Magnetar", description: "Remnant with extreme magnetic field", color: "text-star-neutron", hex: "bbf7ff", temp: "100,000 K" },
  protostar: { label: "Protostar", description: "Star in formation, nebular cocoon", color: "text-star-m", hex: "ff3300", temp: "2,000 K" },
  dyson_swarm: { label: "Dyson Swarm", description: "Artificial megastructure", color: "text-primary", hex: "ffcc00", temp: "300 K" },
};

export const CONTEST_META = {
  controlled: { label: "Controlled", color: "text-success", dot: "bg-success" },
  contested: { label: "Contested", color: "text-warning", dot: "bg-warning" },
  anarchic: { label: "Anarchic", color: "text-destructive", dot: "bg-destructive" },
  frontier: { label: "Frontier", color: "text-primary", dot: "bg-primary" },
} as const;

export const ECON_META = {
  boom: { label: "Boom", color: "text-success" },
  stable: { label: "Stable", color: "text-primary" },
  recession: { label: "Recession", color: "text-warning" },
  blockaded: { label: "Blockaded", color: "text-destructive" },
  untapped: { label: "Untapped", color: "text-muted-foreground" },
} as const;

export const RESOURCE_META = {
  // ── T1: Raw Extraction ───────────────────────────────────────
  "Helium-3":           { tier: 1, factory: "h3_extractor",       label: "H3 Extraction Hub",    icon: "CircleDot",  color: "#A5B4FC" },
  "Energy Crystals":    { tier: 1, factory: "crystal_resonator",  label: "Crystal Resonator",    icon: "Sparkles",   color: "#F472B6" },
  "Hydrogen":           { tier: 1, factory: "hydrogen_siphon",    label: "Hydrogen Siphon",      icon: "Droplets",   color: "#93C5FD" },
  "Exotic Matter":      { tier: 1, factory: "matter_stabilizer",  label: "Matter Stabilizer",    icon: "Orbit",      color: "#C084FC" },
  "Solar Energy":       { tier: 1, factory: "solar_array",        label: "Solar Array Node",     icon: "Sun",        color: "#FBBF24" },
  "Radiogenic Elements":{ tier: 1, factory: "isotope_separator",  label: "Isotope Separator",    icon: "Radiation",  color: "#BEF264" },
  "Ore":                { tier: 1, factory: "mineral_refinery",   label: "Mineral Refinery",     icon: "Hammer",     color: "#94A3B8" },
  "Organics":           { tier: 1, factory: "bio_vat",            label: "Bio-Vat Colony",       icon: "Leaf",       color: "#4ADE80" },
  "Rare Earths":        { tier: 1, factory: "lanthanide_forge",   label: "Lanthanide Forge",     icon: "Gem",        color: "#F87171" },
  "Silicates":          { tier: 1, factory: "silicate_kiln",      label: "Silicate Kiln",        icon: "Mountain",   color: "#E2C499" },
  "Water Ice":          { tier: 1, factory: "cryo_melter",        label: "Cryo-Melter",          icon: "Snowflake",  color: "#BAE6FD" },
  "Exotic Technology":  { tier: 1, factory: "tech_lab",           label: "Xenon Tech Lab",       icon: "Cpu",        color: "#22D3EE" },

  // ── T2: Refined Materials (each requires 2 T1 inputs per work shift) ──
  "Steel Alloy":        { tier: 2, factory: "steel_foundry",      label: "Steel Foundry",        icon: "Layers",     color: "#94A3B8",
    inputs: [{ resource: "Ore", qty: 2 }, { resource: "Silicates", qty: 2 }] },
  "Plasma Cells":       { tier: 2, factory: "plasma_condenser",   label: "Plasma Condenser",     icon: "Zap",        color: "#818CF8",
    inputs: [{ resource: "Helium-3", qty: 2 }, { resource: "Hydrogen", qty: 2 }] },
  "Biofuel":            { tier: 2, factory: "biofuel_vat",        label: "Biofuel Synthesizer",  icon: "FlaskConical", color: "#86EFAC",
    inputs: [{ resource: "Organics", qty: 2 }, { resource: "Water Ice", qty: 2 }] },
  "Rare Alloys":        { tier: 2, factory: "rare_forge",         label: "Rare-Alloy Forge",     icon: "Disc",       color: "#FCA5A5",
    inputs: [{ resource: "Rare Earths", qty: 2 }, { resource: "Ore", qty: 2 }] },
  "Crystal Circuits":   { tier: 2, factory: "circuit_press",      label: "Crystal Circuit Press",icon: "CircuitBoard", color: "#F9A8D4",
    inputs: [{ resource: "Energy Crystals", qty: 2 }, { resource: "Silicates", qty: 2 }] },
  "Fusion Cores":       { tier: 2, factory: "fusion_chamber",     label: "Fusion Chamber",       icon: "Flame",      color: "#FCD34D",
    inputs: [{ resource: "Helium-3", qty: 2 }, { resource: "Radiogenic Elements", qty: 2 }] },
  "Nanomaterials":      { tier: 2, factory: "nano_fab",           label: "Nano Fabricator",      icon: "Atom",       color: "#67E8F9",
    inputs: [{ resource: "Exotic Technology", qty: 2 }, { resource: "Rare Earths", qty: 2 }] },
  "Polymer Sheets":     { tier: 2, factory: "polymer_extruder",   label: "Polymer Extruder",     icon: "Layers2",    color: "#D9F99D",
    inputs: [{ resource: "Organics", qty: 2 }, { resource: "Silicates", qty: 2 }] },
  "Superconductors":    { tier: 2, factory: "cryo_conductor",     label: "Cryo Conductor Lab",   icon: "Radio",      color: "#A5F3FC",
    inputs: [{ resource: "Radiogenic Elements", qty: 2 }, { resource: "Exotic Technology", qty: 2 }] },
  "Dark Matter Gel":    { tier: 2, factory: "dm_condenser",       label: "Dark Matter Condenser",icon: "Eclipse",    color: "#7C3AED",
    inputs: [{ resource: "Exotic Matter", qty: 2 }, { resource: "Water Ice", qty: 2 }] },
  "Solar Capacitors":   { tier: 2, factory: "solar_capacitor",    label: "Solar Capacitor Bank", icon: "BatteryCharging", color: "#FDE68A",
    inputs: [{ resource: "Solar Energy", qty: 2 }, { resource: "Energy Crystals", qty: 2 }] },
  "Hydro-Gel":          { tier: 2, factory: "hydrogel_plant",     label: "Hydro-Gel Plant",      icon: "Waves",      color: "#7DD3FC",
    inputs: [{ resource: "Hydrogen", qty: 2 }, { resource: "Organics", qty: 2 }] },

  // ── T3: Manufactured Components (each requires 2 T2 inputs per work shift) ──
  "Warp Drives":        { tier: 3, factory: "warp_assembly",      label: "Warp Drive Assembly",  icon: "Rocket",     color: "#818CF8",
    inputs: [{ resource: "Plasma Cells", qty: 3 }, { resource: "Fusion Cores", qty: 3 }] },
  "Hull Plating":       { tier: 3, factory: "hull_forge",         label: "Hull Plating Forge",   icon: "Shield",     color: "#9CA3AF",
    inputs: [{ resource: "Steel Alloy", qty: 3 }, { resource: "Rare Alloys", qty: 3 }] },
  "Neural Arrays":      { tier: 3, factory: "array_foundry",      label: "Neural Array Foundry", icon: "Network",    color: "#C4B5FD",
    inputs: [{ resource: "Crystal Circuits", qty: 3 }, { resource: "Superconductors", qty: 3 }] },
  "Quantum Reactors":   { tier: 3, factory: "quantum_forge",      label: "Quantum Reactor Forge",icon: "Hexagon",    color: "#6EE7B7",
    inputs: [{ resource: "Dark Matter Gel", qty: 3 }, { resource: "Solar Capacitors", qty: 3 }] },
  "Biotech Modules":    { tier: 3, factory: "biotech_lab",        label: "Biotech Module Lab",   icon: "Microscope", color: "#86EFAC",
    inputs: [{ resource: "Biofuel", qty: 3 }, { resource: "Hydro-Gel", qty: 3 }] },
  "Xenotech Frames":    { tier: 3, factory: "xenotech_press",     label: "Xenotech Frame Press", icon: "Shapes",     color: "#22D3EE",
    inputs: [{ resource: "Nanomaterials", qty: 3 }, { resource: "Polymer Sheets", qty: 3 }] },
} as const;

export const INFRA_META = {
  silo: {
    label: "Resource Silo",
    type: "Resource Silo",
    icon: "Database",
    description: "Deep storage facility for bulk resources. Required for managing large T3 industrial chains.",
    tiers: [
      { level: 1, capacity: 5000, costSC: 2000, mats: [{ resource: "Ore", qty: 50 }] },
      { level: 2, capacity: 20000, costSC: 5000, mats: [{ resource: "Steel Alloy", qty: 100 }] },
      { level: 3, capacity: 75000, costSC: 15000, mats: [{ resource: "Hull Plating", qty: 200 }] }
    ]
  },
  shipyard: {
    label: "Shipyard",
    type: "Shipyard",
    icon: "Rocket",
    description: "Specialized construction hub for science vessels and heavy freighters.",
    tiers: [
      { level: 1, capacity: 1, costSC: 10000, mats: [{ resource: "Steel Alloy", qty: 200 }] },
      { level: 2, capacity: 3, costSC: 50000, mats: [{ resource: "Hull Plating", qty: 400 }] },
      { level: 3, capacity: 10, costSC: 250000, mats: [{ resource: "Quantum Reactors", qty: 100 }] }
    ]
  },
  drydock: {
    label: "Drydock",
    type: "Drydock",
    icon: "Anchor",
    description: "Modular docking bay for fleet storage and passive hull maintenance.",
    tiers: [
      { level: 1, capacity: 5, costSC: 5000, mats: [{ resource: "Steel Alloy", qty: 100 }] },
      { level: 2, capacity: 20, costSC: 25000, mats: [{ resource: "Hull Plating", qty: 200 }] },
      { level: 3, capacity: 100, costSC: 125000, mats: [{ resource: "Xenotech Frames", qty: 150 }] }
    ]
  },
  deep_space_array: {
    label: "Deep Space Array",
    type: "Deep Space Array",
    icon: "Activity",
    description: "High-gain sensory matrix. Reveals Sites of Interest in current system. Upgrades expand detection to adjacent systems.",
    tiers: [
      { level: 1, range: 0, costSC: 5000, mats: [{ resource: "Ore", qty: 200 }, { resource: "Silicates", qty: 200 }] },
      { level: 2, range: 1, costSC: 25000, mats: [{ resource: "Crystal Circuits", qty: 50 }, { resource: "Superconductors", qty: 25 }] },
      { level: 3, range: 2, costSC: 100000, mats: [{ resource: "Neural Arrays", qty: 20 }] }
    ]
  }
} as const;

export type ResourceKey = keyof typeof RESOURCE_META;

/** Tier 1 raw resources (planet deposits drive extraction) */
export const T1_RESOURCES = Object.entries(RESOURCE_META)
  .filter(([, v]) => v.tier === 1)
  .map(([k]) => k as ResourceKey);

/** Tier 2 refined materials */
export const T2_RESOURCES = Object.entries(RESOURCE_META)
  .filter(([, v]) => v.tier === 2)
  .map(([k]) => k as ResourceKey);

/** Tier 3 manufactured components */
export const T3_RESOURCES = Object.entries(RESOURCE_META)
  .filter(([, v]) => v.tier === 3)
  .map(([k]) => k as ResourceKey);

export const RICHNESS_VALUES = {
  "trace": 1,
  "moderate": 2,
  "significant": 3,
  "rich": 4,
  "abundant": 5,
} as const;

/** Base value per unit of each resource. Used for NPC buyback and market floor prices. */
export const BASE_PRICES: Record<ResourceKey, number> = {
  // T1
  "Helium-3": 12,
  "Energy Crystals": 15,
  "Hydrogen": 8,
  "Exotic Matter": 45,
  "Solar Energy": 5,
  "Radiogenic Elements": 25,
  "Ore": 10,
  "Organics": 12,
  "Rare Earths": 35,
  "Silicates": 10,
  "Water Ice": 8,
  "Exotic Technology": 50,
  // T2
  "Steel Alloy": 65,
  "Plasma Cells": 75,
  "Biofuel": 55,
  "Rare Alloys": 110,
  "Crystal Circuits": 120,
  "Fusion Cores": 140,
  "Nanomaterials": 160,
  "Polymer Sheets": 70,
  "Superconductors": 180,
  "Dark Matter Gel": 200,
  "Solar Capacitors": 90,
  "Hydro-Gel": 60,
  // T3
  "Warp Drives": 1200,
  "Hull Plating": 850,
  "Neural Arrays": 1500,
  "Quantum Reactors": 2200,
  "Biotech Modules": 950,
  "Xenotech Frames": 1100,
};

/** Multiplier for NPC buyback (players sell TO the NPC). Floor price. */
export const NPC_SELL_MULTIPLIER = 0.65;
/** Multiplier for NPC supply (players buy FROM the NPC). Ceiling price. */
export const NPC_BUY_MULTIPLIER = 1.85;


// ─── Ship Blueprints ──────────────────────────────────────────────────────────

export const SHIP_BLUEPRINTS = {
  freighter: {
    label:        "Atlas-Class Freighter",
    description:  "Bulk logistics vessel. Assign to automated trade routes for passive SC income.",
    buildTimeSecs: 86400,   // 24h
    costSC:        15000,
    cargoCapacity: 15000,
    health:        150,
    materials: [
      { resource: "Hull Plating",    qty: 5 },
      { resource: "Warp Drives",     qty: 3 },
      { resource: "Biotech Modules", qty: 2 },
    ],
  },
  science: {
    label:        "Veil-Class Survey Vessel",
    description:  "Long-range survey ship for Sites of Interest and archaeological expeditions.",
    buildTimeSecs: 172800,  // 48h
    costSC:        30000,
    cargoCapacity: 3000,
    health:        120,
    materials: [
      { resource: "Neural Arrays",    qty: 5 },
      { resource: "Xenotech Frames",  qty: 3 },
      { resource: "Warp Drives",      qty: 3 },
      { resource: "Biotech Modules",  qty: 2 },
    ],
  },
  // Corvette intentionally excluded until warfare system is built
} as const;

export type ShipBlueprintKey = keyof typeof SHIP_BLUEPRINTS;

/** AP cost multiplier for warship fleets — not used yet, reserved for warfare */
export const WARSHIP_JUMP_MULTIPLIER = 0.2; // +20% per warship, max 3×

export const SITE_TIERS = {
  minor:       { label: 'Minor Anomaly',       color: 'text-muted-foreground', lifespan: 48,    researchHours: 3,  successRate: 0.75, apCost: 5,  consolationXp: 100  },
  significant: { label: 'Significant Anomaly', color: 'text-info',             lifespan: 72,    researchHours: 12, successRate: 0.60, apCost: 5,  consolationXp: 400  },
  major:       { label: 'Major Anomaly',        color: 'text-warning',          lifespan: 96,    researchHours: 24, successRate: 0.45, apCost: 10, consolationXp: 1500 },
  precursor:   { label: 'Precursor Site',       color: 'text-purple-400',       lifespan: 336,   researchHours: 72, successRate: 0.30, apCost: 10, consolationXp: 8000 },
} as const;
