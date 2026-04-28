// Seeded PRNG and naming helpers — fully deterministic.

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rng = () => number;

export const randInt = (rng: Rng, min: number, max: number) =>
  Math.floor(rng() * (max - min + 1)) + min;

export const pick = <T,>(rng: Rng, arr: T[]): T => arr[Math.floor(rng() * arr.length)];

export const weightedPick = <T,>(rng: Rng, items: [T, number][]): T => {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [v, w] of items) {
    r -= w;
    if (r <= 0) return v;
  }
  return items[items.length - 1][0];
};

const SECTOR_PREFIXES = [
  "Corvus", "Vela", "Lyra", "Orion", "Sagitta", "Draco", "Hydra", "Cygnus",
  "Andros", "Perseus", "Tethys", "Phobos", "Erebus", "Nyx", "Helio", "Kepler",
  "Tycho", "Galileo", "Vega", "Rigel", "Altair", "Centauri", "Sirius", "Procyon",
  "Mensa", "Pyxis", "Aquila", "Caelum", "Dorado", "Eridanus", "Fornax", "Gemini",
  "Hercules", "Indus", "Lacerta", "Mensa", "Norma", "Octans", "Pavo", "Reticulum",
];

const SECTOR_SUFFIXES = ["Reach", "Expanse", "Marches", "Verge", "Drift", "Cluster", "Belt", "Frontier", "Sprawl", "Dominion"];

const SYSTEM_PROPER = [
  "Aethel", "Valthor", "Kryon", "Zephyra", "Thalmos", "Oris", "Belenos", "Cynos", "Draken", "Elowen",
  "Fenris", "Galar", "Hesperis", "Ioran", "Kaelum", "Luvia", "Meryn", "Noxis", "Olyndia", "Porthos",
  "Quilla", "Rhovan", "Sylvar", "Tyrus", "Ulric", "Veyla", "Wynter", "Xora", "Ylva", "Zorion",
  "Aethelgard", "Volsung", "Miriad", "Forgeia", "Glassen", "Emberis", "Hollown", "Tidaris", "Crownis", "Ashen"
];

const SYSTEM_CATALOGS = ["KOR", "XEN", "VAL", "DRA", "NEX", "PHI", "RHO", "SIG", "VEX", "ZAR"];

const STATION_NAMES = [
  "Citadel", "Anchor", "Nexus", "Freeport", "Watchtower", "Sanctuary", "Vanguard", "Sentinel",
  "Terminal", "Outpost", "Bastion", "Garrison", "Spire", "Deep Space 9", "Babylon", "The Sprawl"
];

const PLANET_ROOTS = [
  "Aether", "Volans", "Mire", "Forge", "Glass", "Ember", "Hollow", "Tide", "Crown", "Ash",
  "Iron", "Salt", "Veil", "Shard", "Echo", "Drift", "Spire", "Dune", "Moss", "Rift",
];

export const sectorName = (rng: Rng) =>
  `${pick(rng, SECTOR_PREFIXES)} ${pick(rng, SECTOR_SUFFIXES)}`;

export const systemName = (rng: Rng, isImportant: boolean = false) => {
  if (isImportant || rng() < 0.15) {
    return pick(rng, SYSTEM_PROPER);
  }
  const catalog = pick(rng, SYSTEM_CATALOGS);
  const num = randInt(rng, 1000, 99999);
  return `${catalog} ${num}`;
};

export const stationName = (rng: Rng, parentName: string) => {
  return `${parentName} ${pick(rng, STATION_NAMES)}`;
};

const SUBTYPE_ABBR: Record<string, string> = {
  // Base & Harsh
  molten: "MLT",
  toxic: "TOX",
  barren: "BRN",
  frozen: "FRZ",
  // Dry
  desert: "DES",
  arid: "ARD",
  savanna: "SAV",
  // Temperate
  continental: "CON",
  ocean: "OCE",
  tropical: "TRO",
  // Cold
  arctic: "ARC",
  alpine: "ALP",
  tundra: "TUN",
  // Exotic & Engineered
  gaia: "GAI",
  relic: "RLC",
  ecumenopolis: "ECU",
  tomb: "TMB",
  hive: "HIV",
  machine: "MAC",
  shattered: "SHT",
  broken: "BRK",
  shielded: "SHD",
  nanite: "NAN",
  shrouded: "SHR",
  infested: "INF",
  // Giants & Special
  gas_giant: "GAS",
  gas_giant_hot: "HGS",
  gas_giant_cold: "CGS",
  super_earth: "SPR",
  carbon: "CRB",
  asteroid: "AST",
};

export const planetName = (parentName: string, subtype: string, idx: number) => {
  const abbr = SUBTYPE_ABBR[subtype] || "UNK";
  return `${parentName}/${abbr}/${idx + 1}`;
};

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

export const moonName = (parent: string, idx: number) => {
  const roman = ROMAN_NUMERALS[idx] || (idx + 1).toString();
  return `${parent}/${roman}`;
};
