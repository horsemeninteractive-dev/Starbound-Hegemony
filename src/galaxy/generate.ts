// Procedural galaxy generator. Deterministic from a single seed.
// Targets bible-spec scale: ~40 sectors, ~400 systems, ~2000 bodies.

import * as THREE from "three";
import {
  Body, BodyType, ContestState, EconomicStatus, Empire,
  Galaxy, Hyperlane, JumpGate, Sector, StarSystem, StarType, PlanetSubtype, ResourceDeposit,
} from "./types";
import { mulberry32, pick, randInt, weightedPick, sectorName, systemName, planetName, moonName, Rng } from "./rng";

import { STAR_BASE_SIZE, STAR_LUMINOSITY, STAR_META, CONTEST_META, ECON_META, BODY_META } from "./meta";

const STAR_WEIGHTS: [StarType, number][] = [
  ["M", 38], ["K", 18], ["G", 12], ["F", 8], ["A", 5],
  ["B", 2], ["O", 0.6], ["whitedwarf", 5], ["neutron", 2],
  ["pulsar", 1.4], ["binary", 6], ["blackhole", 1],
  ["quasar", 0.1], ["magnetar", 0.2], ["protostar", 0.8], ["dyson_swarm", 0.05],
];

const ECON_WEIGHTS: [EconomicStatus, number][] = [
  ["stable", 50], ["boom", 14], ["recession", 18], ["blockaded", 5], ["untapped", 13],
];

const EMPIRE_PREFIXES = [
  "United", "Imperial", "Grand", "Divine", "Holy", "Zenith", "Omega", "Alpha", 
  "Sovereign", "Celestial", "Interstellar", "Galactic", "Solar", "Lunar", 
  "Stellar", "Cosmic", "Astral", "Eternal", "Iron", "Gold", "Void",
  "Shadow", "Crystal", "Nebula", "Star", "Core", "Rim", "Nexus", "Techno",
  "Xenon", "Prime", "Ancient", "Vanguard", "Sentinel", "Scion"
];
const EMPIRE_NOUNS = [
  "Hegemony", "Republic", "Empire", "Alliance", "Federation", "Union", "League",
  "Directorate", "Concordat", "Syndicate", "Combine", "Corp", "Cartel",
  "Pact", "Covenant", "Dominion", "Kingdom", "Sovereignty", "Council", "Assembly",
  "Collective", "Swarm", "Consensus", "Authority", "Throne", "State", "Coalition",
  "Accord", "Order", "Foundry", "Network", "Hierarchy", "Dominance"
];

function buildEmpires(rng: Rng): Empire[] {
  const count = 36;
  const empires: Empire[] = [];
  const usedTags = new Set<string>();

  for (let i = 0; i < count; i++) {
    const pre = pick(rng, EMPIRE_PREFIXES);
    const noun = pick(rng, EMPIRE_NOUNS);
    const name = `${pre} ${noun}`;
    
    // Generate a unique 3-letter tag
    let tag = (pre[0] + noun[0] + noun[noun.length - 1]).toUpperCase();
    if (usedTags.has(tag)) tag = (pre[0] + pre[1] + noun[0]).toUpperCase();
    if (usedTags.has(tag)) tag = (pre[0] + noun[0] + String.fromCharCode(65 + (i % 26))).toUpperCase();
    usedTags.add(tag);

    empires.push({
      id: `emp-${i}`,
      name,
      tag,
      hue: (i * (360 / count)) % 360, // Distributed hues
    });
  }
  return empires;
}

/** Place sectors as gaussian blobs in a disk; then drop systems inside each sector. */
/** Place sectors across the galaxy disk using a Poisson-disk-ish or spiral distribution. */
function generateSectors(rng: Rng, count: number): Sector[] {
  const sectors: Sector[] = [];
  const minR = 600;
  const maxR = 4400;
  for (let i = 0; i < count; i++) {
    // Distribute centroids within the star-populated torus
    const r = minR + (i / count) * (maxR - minR);
    const angle = (i / count) * Math.PI * 22; // Maintain spiral density
    
    const x = Math.cos(angle) * r + (rng() - 0.5) * 300;
    const z = Math.sin(angle) * r + (rng() - 0.5) * 300;
    const y = (rng() - 0.5) * 100;

    sectors.push({
      id: `sec-${i}`,
      name: sectorName(rng),
      hue: Math.floor(rng() * 360),
      centroid: [x, y, z],
      radius: 0,
      systemIds: [],
    });
  }
  return sectors;
}

const getAtmosphere = (subtype: PlanetSubtype, zone: "hot" | "temperate" | "cold"): string | null => {
  // Pure vacuum bodies
  if (["barren", "shattered", "broken", "asteroid", "moon", "rocky_moon", "asteroid"].includes(subtype)) return null;
  
  // Gas giants have massive H-He atmospheres
  if (subtype.startsWith("gas_giant")) return "Hydrogen-Helium";

  // Terrestrial variants
  const MAP: Record<string, string> = {
    continental: "Nitrogen-Oxygen",
    ocean: "Nitrogen-Oxygen",
    tropical: "Nitrogen-Oxygen",
    gaia: "Nitrogen-Oxygen",
    savanna: "Nitrogen-Oxygen",
    arid: "Nitrogen-Oxygen",
    arctic: "Nitrogen-Methane",
    alpine: "Nitrogen-Methane",
    tundra: "Nitrogen-Methane",
    frozen: "Nitrogen-Methane",
    desert: "Carbon Dioxide",
    toxic: "Corrosive Acid",
    super_earth: "Carbon Dioxide",
    molten: "Silicate Vapors",
    machine: "Synthetic Trace",
    ecumenopolis: "Synthetic Trace",
    nanite: "Trace Nanites",
    hive: "Organic Particulates",
    infested: "Organic Particulates",
    shrouded: "Psionic Haze",
    tomb: "Irradiated Dust",
    relic: "Ancient Ozone",
    shielded: "Artificially Regulated"
  };

  return MAP[subtype as string] || (zone === "hot" ? "Thin Carbon" : zone === "temperate" ? "Trace Nitrogen" : null);
};

function generateBodies(rng: Rng, systemId: string, systemName: string, starType: StarType): Body[] {
  const bodies: Body[] = [];

  // Ultra-exotic stars: quasars/whiteholes produce extreme high-energy environments,
  // mostly accretion debris, not stable planetary systems.
  const ultraExotic = starType === "quasar" || starType === "whitehole";
  // Compact remnants: sparse debris fields.
  const compactExotic = starType === "blackhole" || starType === "neutron" || starType === "pulsar" || starType === "magnetar";
  // Dyson swarms: engineered bodies only, no naturals
  const isDyson = starType === "dyson_swarm";

  const planetCount = ultraExotic ? 0 : compactExotic ? randInt(rng, 0, 3) : isDyson ? 0 : randInt(rng, 3, 12);

  // Ultra-exotic: generate accretion disk debris and anomalous bodies instead
  if (ultraExotic) {
    const debrisCount = randInt(rng, 3, 7);
    let debrisOrbit = 12;
    for (let d = 0; d < debrisCount; d++) {
      debrisOrbit += randInt(rng, 20, 40);
      bodies.push({
        id: `${systemId}-b${d}`,
        systemId,
        name: `${systemName} Accretion Fragment ${d + 1}`,
        type: "asteroid" as BodyType,
        subtype: d % 3 === 0 ? "carbon" : "asteroid",
        orbit: debrisOrbit,
        phase: rng() * Math.PI * 2,
        size: 0.3 + rng() * 0.4,
        hue: Math.floor(rng() * 360),
        ownerId: null,
        population: 0,
        deposits: [
          { resource: "Exotic Matter", richness: "moderate", depleted: false },
          { resource: "Radiogenic Elements", richness: "rich", depleted: false }
        ],
        economy: "untapped",
        children: [],
        temperature: 8000 + Math.floor(rng() * 4000),
        habitabilityZone: "hot",
        flora: "none",
        fauna: "none",
        hazards: ["Extreme Radiation", "Tidal Forces", "Relativistic Jets"],
      });
    }
    return bodies;
  }

  // Dyson swarms: only artificial structures
  if (isDyson) {
    const structureCount = randInt(rng, 4, 8);
    let dysonOrbit = 8;
    for (let d = 0; d < structureCount; d++) {
      dysonOrbit += randInt(rng, 15, 30);
      const isStation = d === 0 || rng() < 0.4;
      bodies.push({
        id: `${systemId}-b${d}`,
        systemId,
        name: isStation ? `${systemName} Dyson Node ${d + 1}` : `${systemName} Collector ${d + 1}`,
        type: isStation ? "station" as BodyType : "asteroid" as BodyType,
        subtype: isStation ? "station" : "machine",
        orbit: dysonOrbit,
        phase: rng() * Math.PI * 2,
        size: isStation ? 0.8 : 0.4 + rng() * 0.3,
        hue: 50,
        ownerId: null,
        population: isStation ? Math.floor(rng() * 50) / 10 : 0,
        deposits: [
          { resource: isStation ? "Exotic Technology" : "Solar Energy", richness: "abundant", depleted: false }
        ],
        economy: "boom",
        children: [],
        temperature: 300,
        habitabilityZone: "temperate",
        flora: "none",
        fauna: "none",
        hazards: [],
      });
    }
    return bodies;
  }

  // Base starting distance scales down for dim stars so they can have planets
  // Cap spacing multiplier for ultra-bright stars to prevent invisible orbits
  const luminosity = STAR_LUMINOSITY[starType];
  const cappedLuminosity = Math.min(luminosity, 5.0); // cap at F-star luminosity for orbit scaling

  // Base starting distance scales with star size to ensure no planets overlap the star surface
  let orbit = STAR_BASE_SIZE[starType] * 2.2 + randInt(rng, 10, 20);
  
  for (let i = 0; i < planetCount; i++) {
    // Spacing scales with luminosity but capped so ultra-bright stars don't produce invisible orbits
    const spacingMult = Math.max(0.6, Math.pow(cappedLuminosity, 0.25));
    orbit += randInt(rng, 60, 110) * spacingMult;
    
    const isGas = rng() < (i > 2 ? 0.55 : 0.15);
    const type: BodyType = isGas ? "gas_giant" : "terrestrial";
    const id = `${systemId}-b${i}`;
    
    // Solar modelling: Temperature in K (Metadata only)
    const temp = Math.floor(350 * Math.pow(luminosity, 0.35) / Math.pow(orbit / 80, 0.8));

    // --- SYNCHRONIZED ZONE CALCULATION (Matches UnifiedMap.tsx overlay) ---
    const lPow = Math.pow(luminosity || 1, 0.5);
    const hotEnd = 120 * lPow;
    const tempEnd = 240 * lPow;
    
    let zone: "hot" | "temperate" | "cold" = "cold";
    if (orbit < hotEnd) zone = "hot";
    else if (orbit < tempEnd) zone = "temperate";
    
    let isShielded = false;
    let subtype: PlanetSubtype = "barren";
    
    if (isGas) {
      if (zone === "hot") subtype = "gas_giant_hot";
      else if (zone === "cold") subtype = "gas_giant_cold";
      else subtype = "gas_giant";
    } else {
      const isExotic = rng() < 0.05; // 5% chance of a special world
      
      // Handle base subtype selection first
      if (zone === "hot") {
        subtype = weightedPick(rng, [["molten", 40], ["toxic", 40], ["barren", 20]]) as PlanetSubtype;
        if (isExotic) {
          const special = weightedPick(rng, [["shattered", 35], ["broken", 35], ["shielded", 30]]);
          if (special === "shielded") isShielded = true;
          else subtype = special as PlanetSubtype;
        }
      } else if (zone === "cold") {
        subtype = weightedPick(rng, [["frozen", 60], ["barren", 40]]) as PlanetSubtype;
        if (isExotic) {
          const special = weightedPick(rng, [["shrouded", 40], ["infested", 40], ["shielded", 20]]);
          if (special === "shielded") isShielded = true;
          else subtype = special as PlanetSubtype;
        }
      } else {
        // Temperate zone (Habitable!)
        if (isExotic) {
          const special = weightedPick(rng, [["gaia", 25], ["relic", 20], ["ecumenopolis", 15], ["tomb", 15], ["hive", 10], ["machine", 15]]);
          subtype = special as PlanetSubtype;
          if (rng() < 0.2) isShielded = true; // Extra chance for shielded temperate worlds
        } else {
          // Sub-divide temperate zone for variety
          const range = tempEnd - hotEnd;
          const relPos = (orbit - hotEnd) / range;
          if (relPos < 0.33) subtype = weightedPick(rng, [["desert", 40], ["arid", 40], ["savanna", 20]]) as PlanetSubtype;
          else if (relPos < 0.66) subtype = weightedPick(rng, [["continental", 40], ["ocean", 40], ["tropical", 20]]) as PlanetSubtype;
          else subtype = weightedPick(rng, [["arctic", 40], ["tundra", 40], ["alpine", 20]]) as PlanetSubtype;
        }
      }
    }

    const name = planetName(systemName, subtype, i);

    const isHabitable = !isGas && ["desert", "arid", "savanna", "continental", "ocean", "tropical", "arctic", "alpine", "tundra", "gaia", "relic", "ecumenopolis", "hive", "machine"].includes(subtype);
    const flora: Body["flora"] = isHabitable && !["machine", "ecumenopolis", "relic"].includes(subtype) ? weightedPick(rng, [["none", 10], ["sparse", 40], ["abundant", 40], ["exotic", 10]]) : "none";
    const fauna: Body["fauna"] = isHabitable && flora !== "none" ? weightedPick(rng, [["none", 10], ["sparse", 40], ["abundant", 40], ["hostile", 10]]) : "none";
    
    const possibleHazards = ["Extreme Pressure", "Corrosive Rain", "Seismic Instability", "High Radiation", "Toxic Atmosphere", "Cryo-Storms"];
    const hazards: string[] = [];
    if (rng() < 0.3) hazards.push(pick(rng, possibleHazards));
    if (zone === "hot" && rng() < 0.5) hazards.push("Extreme Heat");
    if (zone === "cold" && rng() < 0.5) hazards.push("Extreme Cold");

    // Aesthetic randomization
    let landColor: string | undefined;
    let seaColor: string | undefined;
    if (["temperate", "continental", "tropical", "ocean", "gaia", "hive", "infested", "super_earth", "ecumenopolis", "relic"].includes(subtype)) {
      const landHues = [120, 40, 280, 20]; // Green, Beige, Purple, Red-brown
      const seaHues = [210, 180, 340, 260]; // Blue, Cyan, Red, Violet
      landColor = new THREE.Color().setHSL(pick(rng, landHues) / 360, 0.4, 0.3).getStyle();
      seaColor = new THREE.Color().setHSL(pick(rng, seaHues) / 360, 0.5, 0.4).getStyle();
    }

    const planet: Body = {
      id,
      systemId,
      name,
      type,
      subtype,
      orbit,
      phase: rng() * Math.PI * 2,
      size: isGas ? 1.4 + rng() * 1.2 : 0.6 + rng() * 0.7,
      hue: Math.floor(rng() * 360),
      isShielded,
      ownerId: null,
      population: type === "terrestrial" ? Math.floor(rng() * 12000) / 10 : 0,
      deposits: pickResources(rng, type),
      economy: weightedPick(rng, ECON_WEIGHTS),
      children: [],
      temperature: temp,
      habitabilityZone: zone,
      flora,
      fauna,
      hazards,
      landColor,
      seaColor,
      atmosphere: getAtmosphere(subtype, zone),
      // Gas giants beyond the frost line (~cold zone) have a higher ring probability
      hasRings: isGas && rng() < (zone === "cold" ? 0.45 : 0.22),
      ringHue: Math.floor(rng() * 360),
    };

    // Moons
    const moonCount = isGas ? randInt(rng, 1, 5) : randInt(rng, 0, 3);
    for (let m = 0; m < moonCount; m++) {
      // Moon orbits are local to the planet. Tighter scaling to prevent inter-planetary interference.
      const moonOrbit = planet.size * 1.5 + 2.0 + m * 2.5;
      
      let moonSubtype: Body["subtype"] = "barren";
      const parentZone = planet.habitabilityZone;
      // Moon subtypes are strictly zone-locked to prevent environmental mismatches.
      if (parentZone === "hot") {
        moonSubtype = weightedPick(rng, [["molten", 50], ["barren", 30], ["toxic", 20]]);
      } else if (parentZone === "cold") {
        moonSubtype = weightedPick(rng, [["frozen", 65], ["barren", 35]]);
      } else {
        // temperate zone moons
        moonSubtype = weightedPick(rng, [["barren", 50], ["tundra", 20], ["arid", 20], ["frozen", 10]]);
      }

      // Moon temperature: derived from same luminosity/orbit formula as planets,
      // slightly cooler since moons are in the shadow of their parent body some of the time.
      const moonTemp = Math.max(20, planet.temperature - randInt(rng, 10, 40));

      const isMoonHabitable = ["tundra", "arid"].includes(moonSubtype);
      const moonFlora: Body["flora"] = isMoonHabitable ? weightedPick(rng, [["none", 20], ["sparse", 50], ["abundant", 30]]) : "none";
      const moonFauna: Body["fauna"] = isMoonHabitable && moonFlora !== "none" ? weightedPick(rng, [["none", 30], ["sparse", 50], ["abundant", 20]]) : "none";

      const moon: Body = {
        id: `${id}-m${m}`,
        systemId,
        parentId: id,
        name: moonName(name, m),
        type: "moon",
        subtype: moonSubtype,
        orbit: moonOrbit,
        phase: rng() * Math.PI * 2,
        size: 0.2 + rng() * 0.3,
        hue: 30 + Math.floor(rng() * 60),
        ownerId: null,
        population: 0,
        deposits: moonSubtype === "molten" 
          ? [{ resource: "Ore", richness: "moderate", depleted: false }, { resource: "Crystals", richness: "trace", depleted: false }]
          : [{ resource: "Ore", richness: "trace", depleted: false }, { resource: "Silicates", richness: "moderate", depleted: false }],
        economy: "untapped",
        temperature: moonTemp,
        habitabilityZone: planet.habitabilityZone,
        flora: moonFlora,
        fauna: moonFauna,
        hazards: [],
        landColor: undefined,
        seaColor: undefined,
        atmosphere: getAtmosphere(moonSubtype, planet.habitabilityZone),
        hasRings: false,
        terrainSeed: rng() * 10000,
      };
      planet.children!.push(moon);
      bodies.push(moon);
    }
    planet.terrainSeed = rng() * 10000;
    if (isHabitable) {
      planet.geographyType = weightedPick(rng, [["continental", 50], ["pangaea", 25], ["islands", 25]]);
    }
    bodies.push(planet);
  }

  // Asteroid belt(s)
  const beltCount = randInt(rng, 0, 2);
  for (let b = 0; b < beltCount; b++) {
    orbit += randInt(rng, 3, 5);
    const rocks = randInt(rng, 6, 14);
    for (let r = 0; r < rocks; r++) {
      bodies.push({
        id: `${systemId}-a${b}-${r}`,
        systemId,
        name: `${systemId.split("-")[1]}-Belt-${b + 1}-${r + 1}`,
        type: "asteroid",
        subtype: "asteroid",
        orbit: orbit + (rng() - 0.5) * 1.2,
        phase: rng() * Math.PI * 2,
        size: 0.12 + rng() * 0.18,
        hue: 30,
        ownerId: null,
        population: 0,
        deposits: [{ resource: "Ore", richness: "moderate", depleted: false }],
        economy: "untapped",
        temperature: 150,
        habitabilityZone: "cold",
        flora: "none",
        fauna: "none",
        hazards: [],
      });
    }
  }

  // Stations
  if (rng() < 0.45) {
    bodies.push({
      id: `${systemId}-stn`,
      systemId,
      name: `${systemId.split("-")[1]} Anchor`,
      type: "station",
      subtype: "station",
      orbit: orbit + 4,
      phase: rng() * Math.PI * 2,
      size: 0.5,
      hue: 180,
      ownerId: null,
      population: Math.floor(rng() * 20) / 10,
      deposits: [{ resource: "Trade Hub", richness: "abundant", depleted: false }],
      economy: "stable",
      temperature: 290,
      habitabilityZone: "temperate",
      flora: "none",
      fauna: "none",
      hazards: [],
    });
  }

  return bodies;
}

function pickResources(rng: Rng, type: BodyType): ResourceDeposit[] {
  const pool = type === "gas_giant"
    ? ["Helium-3", "Energy Crystals", "Hydrogen"]
    : ["Ore", "Organics", "Rare Earths", "Silicates", "Water Ice"];
  const count = randInt(rng, 1, 3);
  const out: ResourceDeposit[] = [];
  const richnessLevels: ResourceDeposit["richness"][] = ["trace", "moderate", "significant", "rich", "abundant"];
  
  for (let i = 0; i < count; i++) {
    const p = pick(rng, pool);
    if (!out.some(d => d.resource === p)) {
      out.push({
        resource: p,
        richness: pick(rng, richnessLevels),
        depleted: false
      });
    }
  }
  return out;
}

/** Scale-free hyperlane network: most systems 2-3 connections, hub systems 6-10. */
function generateHyperlanes(rng: Rng, systems: StarSystem[]): Hyperlane[] {
  const lanes: Hyperlane[] = [];
  const seen = new Set<string>();
  const key = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

  const distance = (a: StarSystem, b: StarSystem) => {
    const dx = a.pos[0] - b.pos[0];
    const dy = a.pos[1] - b.pos[1];
    const dz = a.pos[2] - b.pos[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };

  // For each system, link to 2-3 nearest neighbours; chance of long-haul jump.
  for (const s of systems) {
    const sorted = systems
      .filter((o) => o.id !== s.id)
      .map((o) => [o, distance(s, o)] as const)
      .sort((a, b) => a[1] - b[1]);

    const MAX_LOCAL_DIST = 600;
    const MAX_HUB_DIST = 1400;

    const localLinks = randInt(rng, 2, 3);
    for (let i = 0; i < localLinks && i < sorted.length; i++) {
      const [target, dist] = sorted[i];
      if (dist > MAX_LOCAL_DIST) continue; // Don't link across voids
      
      const k = key(s.id, target.id);
      if (seen.has(k)) continue;
      seen.add(k);
      lanes.push({ id: `lane-${lanes.length}`, a: s.id, b: target.id });
    }

    // Hub systems (~5%) get extra long-range jumps.
    if (rng() < 0.05) {
      const extras = randInt(rng, 2, 5);
      for (let i = 0; i < extras; i++) {
        const idx = randInt(rng, 4, Math.min(30, sorted.length - 1));
        const [target, dist] = sorted[idx];
        if (dist > MAX_HUB_DIST) continue; 

        const k = key(s.id, target.id);
        if (seen.has(k)) continue;
        seen.add(k);
        lanes.push({ id: `lane-${lanes.length}`, a: s.id, b: target.id });
      }
    }
  }
  return lanes;
}

function attachJumpGates(systems: StarSystem[], lanes: Hyperlane[]) {
  const byId: Record<string, StarSystem> = Object.fromEntries(systems.map((s) => [s.id, s]));
  for (const lane of lanes) {
    const a = byId[lane.a];
    const b = byId[lane.b];
    if (!a || !b) continue;

    // Bidirectional gates — both systems get a gate to each other
a.gates.push({ id: `${lane.id}-g0`, systemId: a.id, targetSystemId: b.id, ownerId: null, toll: 0 });
    // Return gates to the central white hole are locked — the structure exists but is non-traversable
    const returnLocked = a.id === "sys-center";
    b.gates.push({ id: `${lane.id}-g1`, systemId: b.id, targetSystemId: a.id, ownerId: null, toll: 0, locked: returnLocked });
  }
}

function assignOwnership(rng: Rng, systems: StarSystem[], empires: Empire[]) {
  const remaining = new Set(systems.map((s) => s.id));
  
  for (const emp of empires) {
    const seed = pick(rng, [...remaining]);
    if (!seed) continue;
    
    // Claim a blob of systems — empires are now more aggressive
    const claimSize = randInt(rng, 8, 16);
    const queue = [seed];
    const claimedInThisBlob: string[] = [];
    
    while (queue.length && claimedInThisBlob.length < claimSize) {
      const id = queue.shift()!;
      const sys = systems.find((s) => s.id === id)!;
      if (!sys) continue;

      // Even if already 'claimed' by someone else's seed, we can still contest it
      const alreadyClaimed = !remaining.has(id);
      
      // Ownership types: High Control or Heavy Contestation
      const mode = rng();
      
      for (const body of sys.bodies) {
        if (body.type === "terrestrial" || body.type === "gas_giant" || body.type === "station") {
          // If the system was already claimed, we have a high chance of creating a contested environment
          if (alreadyClaimed) {
            if (rng() < 0.4) body.ownerId = emp.id; // Ninja some bodies
          } else {
            // New territory
            if (mode > 0.4) {
              // SOLID CONTROL (90% ownership of bodies)
              if (rng() < 0.9) body.ownerId = emp.id;
            } else {
              // SHARED CONTROL
              if (rng() < 0.5) body.ownerId = emp.id;
              else if (rng() < 0.4) {
                const other = empires[randInt(rng, 0, empires.length - 1)];
                body.ownerId = other.id;
              }
            }
          }
        }
      }

      if (remaining.has(id)) {
        remaining.delete(id);
        claimedInThisBlob.push(id);
      }

      // Expand to neighbours (even if already claimed, to create friction)
      const neighbours = systems
        .map((o) => {
          const d = Math.hypot(o.pos[0] - sys.pos[0], o.pos[2] - sys.pos[2]);
          return [o.id, d] as const;
        })
        .filter(n => n[0] !== id && n[1] < 800)
        .sort((a, b) => a[1] - b[1])
        .slice(0, 3);
      
      for (const [nid] of neighbours) {
        if (!queue.includes(nid) && (remaining.has(nid) || rng() < 0.3)) {
          queue.push(nid);
        }
      }
    }
  }

  // Compute contestation per system
  for (const sys of systems) {
    const owners = new Set<string>();
    for (const b of sys.bodies) if (b.ownerId) owners.add(b.ownerId);
    if (owners.size === 0) sys.contest = remaining.has(sys.id) ? "frontier" : "anarchic";
    else if (owners.size === 1) sys.contest = "controlled";
    else sys.contest = "contested";
  }
}

export function generateGalaxy(seed: number = 42, opts?: {
  sectors?: number;
  systemsPerSector?: [number, number];
}): Galaxy {
  const rng = mulberry32(seed);
  const sectorCount = opts?.sectors ?? 80;
  const systemsCount = sectorCount * randInt(rng, 10, 14); // ~800-1000 systems total

  const sectors = generateSectors(rng, sectorCount);
  const systems: StarSystem[] = [];

  // 0. Sagittarius Z* - The Center
  const zStar: StarSystem = {
    id: "sys-center",
    sectorId: "sec-0",
    name: "Sagittarius Z*",
    pos: [0, 0, 0],
    starType: "whitehole",
    contest: "frontier",
    economy: "stable",
    bodies: [],
    gates: [],
    sectorHue: sectors[0].hue,
  };
  systems.push(zStar);

  // 1. The 12 Inner Rim Pillars (Equidistant)
  const innerRimRadius = 450;
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const pos: [number, number, number] = [
      Math.cos(angle) * innerRimRadius,
      (rng() - 0.5) * 4,
      Math.sin(angle) * innerRimRadius,
    ];
    const id = `sys-inner-${i}`;
    const sys: StarSystem = {
      id,
      sectorId: sectors[i % 4].id,
      name: `Sanctum ${i + 1}`,
      pos,
      starType: "O",
      contest: "frontier",
      economy: "boom",
      bodies: generateBodies(rng, id, `Sanctum ${i + 1}`, "O"),
      gates: [],
      sectorHue: sectors[i % 4].hue,
    };
    systems.push(sys);
    sectors[i % 4].systemIds.push(id);
  }

  // 2. Generate remaining systems following Hubble Sb classification (bulge + arms)
  const remainingCount = systemsCount - 13;
  const bulgeRadius = 900;
  const spiralArms = 4;
  const armTightness = 0.35;
  const armWidth = 350;

  for (let i = 0; i < remainingCount; i++) {
    const t = i / remainingCount;
    let pos: [number, number, number];

    if (t < 0.25) {
      // Bulge Distribution: Uniform random within bulge radius, but OUTSIDE inner rim
      const minBulge = 550;
      const r = minBulge + rng() * (bulgeRadius - 20); // Distribution between 100 and 190
      const angle = rng() * Math.PI * 2;
      pos = [
        Math.cos(angle) * r,
        (rng() - 0.5) * 15,
        Math.sin(angle) * r,
      ];
    } else {
      // Spiral Arms: Fibonacci spiral with jitter
      const spiralT = (t - 0.25) / 0.75;
      const arm = i % spiralArms;
      const angle = spiralT * Math.PI * 6 + (arm * Math.PI * 2) / spiralArms;
      const r = 1100 + spiralT * 3200; // Arms start at 1100 and go to 4300
      const jitter = armWidth * (1.0 - spiralT * 0.3);
      
      pos = [
        Math.cos(angle) * r + (rng() - 0.5) * jitter,
        (rng() - 0.5) * 10,
        Math.sin(angle) * r + (rng() - 0.5) * jitter,
      ];
    }

    const starType = weightedPick(rng, STAR_WEIGHTS);
    const id = `sys-${i}`;
    const sys: StarSystem = {
      id,
      sectorId: "", // assigned below
      name: systemName(rng),
      pos,
      starType,
      contest: "frontier",
      economy: weightedPick(rng, ECON_WEIGHTS),
      bodies: [],
      gates: [],
      sectorHue: 0,
    };
    sys.bodies = generateBodies(rng, id, sys.name, starType);
    systems.push(sys);
  }

  // 2b. Guaranteed rare star spawns — without this, low-weight types may never appear
  const guaranteedTypes: StarType[] = ["quasar", "magnetar", "dyson_swarm", "whitehole"];
  for (const rareType of guaranteedTypes) {
    const hasIt = systems.some(s => s.starType === rareType);
    if (!hasIt) {
      const angle = rng() * Math.PI * 2;
      const r = 2500 + rng() * 1500; // outer rim
      const id = `sys-rare-${rareType}`;
      const name = systemName(rng);
      const rarePos: [number, number, number] = [Math.cos(angle) * r, (rng() - 0.5) * 8, Math.sin(angle) * r];
      const rareSys: StarSystem = {
        id,
        sectorId: "",
        name,
        pos: rarePos,
        starType: rareType,
        contest: "frontier",
        economy: "untapped",
        bodies: generateBodies(rng, id, name, rareType),
        gates: [],
        sectorHue: 0,
      };
      systems.push(rareSys);
    }
  }

  // 2. Assign each system to the nearest sector centroid (Voronoi partitioning)
  for (const sys of systems) {
    if (sys.id === "sys-center") continue; // Z* is special
    let nearestDist = Infinity;
    let nearestSector = sectors[0];
    for (const sec of sectors) {
      const dx = sys.pos[0] - sec.centroid[0];
      const dz = sys.pos[2] - sec.centroid[2];
      const dSq = dx * dx + dz * dz;
      if (dSq < nearestDist) {
        nearestDist = dSq;
        nearestSector = sec;
      }
    }
    sys.sectorId = nearestSector.id;
    sys.sectorHue = nearestSector.hue;
    nearestSector.systemIds.push(sys.id);
  }

  // 2.5. Recalculate centroids for perfect label centering (average of all systems in sector)
  const sectorSums = new Map<string, { x: number, y: number, z: number, count: number }>();
  for (const sys of systems) {
    if (!sys.sectorId) continue;
    const current = sectorSums.get(sys.sectorId) || { x: 0, y: 0, z: 0, count: 0 };
    current.x += sys.pos[0];
    current.y += sys.pos[1];
    current.z += sys.pos[2];
    current.count++;
    sectorSums.set(sys.sectorId, current);
  }
  for (const sec of sectors) {
    const sum = sectorSums.get(sec.id);
    if (sum && sum.count > 0) {
      sec.centroid = [sum.x / sum.count, sum.y / sum.count, sum.z / sum.count];
    }
  }

  // 3. Link Z* to the 12 Inner Rim systems only
  const innerRimSystems = systems.filter(s => s.id.startsWith("sys-inner-"));
  
  const hyperlanes = generateHyperlanes(rng, systems.filter(s => s.id !== "sys-center" && !s.id.startsWith("sys-inner-")));
  
  // Connect Z* to inner rim
  for (const inner of innerRimSystems) {
    hyperlanes.push({ id: `lane-z-${inner.id}`, a: "sys-center", b: inner.id });
  }

  // Connect inner rim to nearest outer systems to ensure connectivity
  const outerSystems = systems.filter(s => !s.id.startsWith("sys-inner-") && s.id !== "sys-center");
  for (const inner of innerRimSystems) {
    const nearest = outerSystems
      .map(s => ({ id: s.id, d: Math.hypot(s.pos[0] - inner.pos[0], s.pos[2] - inner.pos[2]) }))
      .sort((a, b) => a.d - b.d)[0];
    if (nearest) {
      hyperlanes.push({ id: `lane-connect-${inner.id}`, a: inner.id, b: nearest.id });
    }
  }
  attachJumpGates(systems, hyperlanes);

  const empires = buildEmpires(rng);
  assignOwnership(rng, systems, empires);

  const systemById = Object.fromEntries(systems.map((s) => [s.id, s]));
  const sectorById = Object.fromEntries(sectors.map((s) => [s.id, s]));

  return { seed, sectors, systems, hyperlanes, empires, systemById, sectorById };
}
