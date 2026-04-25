// Procedural galaxy generator. Deterministic from a single seed.
// Targets bible-spec scale: ~40 sectors, ~400 systems, ~2000 bodies.

import * as THREE from "three";
import {
  Body, BodyType, ContestState, EconomicStatus, Empire,
  Galaxy, Hyperlane, JumpGate, Sector, StarSystem, StarType,
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

const EMPIRE_NAMES: { name: string; tag: string; hue: number }[] = [
  { name: "Hegemony Sovereign", tag: "HSO", hue: 185 },
  { name: "Vorlan Concordat", tag: "VLC", hue: 28 },
  { name: "Crimson Pact", tag: "CMP", hue: 358 },
  { name: "Ashen Directorate", tag: "ASD", hue: 280 },
  { name: "Mira League", tag: "MRL", hue: 145 },
  { name: "Sable Throne", tag: "SBT", hue: 320 },
  { name: "Korren Combine", tag: "KRC", hue: 50 },
  { name: "Free Drift Cooperative", tag: "FDC", hue: 200 },
];

function buildEmpires(): Empire[] {
  return EMPIRE_NAMES.map((e, i) => ({ id: `emp-${i}`, ...e }));
}

/** Place sectors as gaussian blobs in a disk; then drop systems inside each sector. */
/** Place sectors across the galaxy disk using a Poisson-disk-ish or spiral distribution. */
function generateSectors(rng: Rng, count: number): Sector[] {
  const sectors: Sector[] = [];
  const galaxyRadius = 10000; 
  for (let i = 0; i < count; i++) {
    // Linear distribution for more spread-out outer regions
    const r = (i / count) * galaxyRadius;
    const angle = (i / count) * Math.PI * 18; // spiral arms
    
    const x = Math.cos(angle) * r + (rng() - 0.5) * 1000;
    const z = Math.sin(angle) * r + (rng() - 0.5) * 1000;
    const y = (rng() - 0.5) * 250;

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

function generateBodies(rng: Rng, systemId: string, systemName: string, starType: StarType): Body[] {
  const bodies: Body[] = [];

  // Black holes / neutrons / pulsars rarely have planets; usually asteroid debris.
  const exotic = starType === "blackhole" || starType === "neutron" || starType === "pulsar";
  const planetCount = exotic ? randInt(rng, 0, 3) : randInt(rng, 3, 12);

  // Base starting distance scales down for dim stars so they can have planets
  let orbit = 8 + STAR_BASE_SIZE[starType] * 2.0;
  
  for (let i = 0; i < planetCount; i++) {
    // Spacing scales with luminosity but has a much higher floor to prevent lunar orbit crossing
    const spacingMult = Math.max(0.6, Math.pow(STAR_LUMINOSITY[starType], 0.25));
    orbit += randInt(rng, 60, 110) * spacingMult;
    
    const isGas = rng() < (i > 2 ? 0.55 : 0.15);
    const type: BodyType = isGas ? "gas_giant" : "terrestrial";
    const id = `${systemId}-b${i}`;
    
    // Solar modelling: Temperature in K
    // Game-balanced curve so HZ is reachable for all star types
    const luminosity = STAR_LUMINOSITY[starType];
    const temp = Math.floor(350 * Math.pow(luminosity, 0.35) / Math.pow(orbit / 80, 0.8));
    
    let zone: "hot" | "temperate" | "cold" = "cold";
    if (temp > 373) zone = "hot";
    else if (temp > 250) zone = "temperate";
    
    let subtype: Body["subtype"];
    if (isGas) {
      if (temp > 400) subtype = "gas_giant_hot";
      else if (temp < 150) subtype = "gas_giant_cold";
      else subtype = "gas_giant";
    } else {
      // Terrestrial subtypes are strictly zone-locked.
      const exotic = rng() < 0.08; // 8% chance of a special exotic type
      if (zone === "hot") {
        subtype = exotic ? "carbon" : (temp > 700 ? "lava" : rng() < 0.5 ? "lava" : "desert");
      } else if (zone === "temperate") {
        if (exotic) {
          subtype = rng() < 0.5 ? "hive" : "machine";
        } else {
          subtype = weightedPick(rng, [["temperate", 35], ["ocean", 25], ["gaia", 15], ["super_earth", 15], ["desert", 10]]);
        }
      } else {
        // cold zone
        subtype = exotic ? "rogue" : (rng() < 0.7 ? "ice" : "rocky_moon");
      }
    }

    const name = planetName(systemName, subtype, i);

    const isHabitable = !isGas && zone === "temperate";
    const flora: Body["flora"] = isHabitable ? weightedPick(rng, [["none", 10], ["sparse", 40], ["abundant", 40], ["exotic", 10]]) : "none";
    const fauna: Body["fauna"] = isHabitable && flora !== "none" ? weightedPick(rng, [["none", 10], ["sparse", 40], ["abundant", 40], ["hostile", 10]]) : "none";
    
    const possibleHazards = ["Extreme Pressure", "Corrosive Rain", "Seismic Instability", "High Radiation", "Toxic Atmosphere", "Cryo-Storms"];
    const hazards: string[] = [];
    if (rng() < 0.3) hazards.push(pick(rng, possibleHazards));
    if (zone === "hot" && rng() < 0.5) hazards.push("Extreme Heat");
    if (zone === "cold" && rng() < 0.5) hazards.push("Extreme Cold");

    // Aesthetic randomization
    let landColor: string | undefined;
    let seaColor: string | undefined;
    if (subtype === "temperate" || subtype === "ocean") {
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
      size: isGas ? 1.8 + rng() * 1.5 : 0.7 + rng() * 0.8,
      hue: Math.floor(rng() * 360),
      ownerId: null,
      population: type === "terrestrial" ? Math.floor(rng() * 12000) / 10 : 0,
      resources: pickResources(rng, type),
      economy: weightedPick(rng, ECON_WEIGHTS),
      children: [],
      temperature: temp,
      habitabilityZone: zone,
      flora,
      fauna,
      hazards,
      landColor,
      seaColor,
      // Gas giants beyond the frost line (~cold zone) have a higher ring probability
      hasRings: isGas && rng() < (zone === "cold" ? 0.45 : 0.22),
      ringHue: Math.floor(rng() * 360),
    };

    // Moons
    const moonCount = isGas ? randInt(rng, 1, 5) : randInt(rng, 0, 3);
    for (let m = 0; m < moonCount; m++) {
      // Moon orbits are local to the planet. Tighter scaling to prevent inter-planetary interference.
      const moonOrbit = planet.size * 1.5 + 2.0 + m * 2.5;
      
      let moonSubtype: Body["subtype"] = "rocky_moon";
      const parentZone = planet.habitabilityZone;
      // Moon subtypes are strictly zone-locked to prevent environmental mismatches.
      if (parentZone === "hot") {
        moonSubtype = weightedPick(rng, [["lava", 50], ["desert", 30], ["rocky_moon", 20]]);
      } else if (parentZone === "cold") {
        moonSubtype = weightedPick(rng, [["ice", 65], ["rocky_moon", 35]]);
      } else {
        // temperate zone moons
        moonSubtype = weightedPick(rng, [["rocky_moon", 40], ["moon", 30], ["desert", 20], ["ice", 10]]);
      }

      // Moon temperature: derived from same luminosity/orbit formula as planets,
      // slightly cooler since moons are in the shadow of their parent body some of the time.
      const moonTemp = Math.max(20, planet.temperature - randInt(rng, 10, 40));

      const moonFlora: Body["flora"] = moonSubtype === "temperate" ? weightedPick(rng, [["none", 20], ["sparse", 50], ["abundant", 30]]) : "none";
      const moonFauna: Body["fauna"] = moonSubtype === "temperate" && moonFlora !== "none" ? weightedPick(rng, [["none", 30], ["sparse", 50], ["abundant", 20]]) : "none";

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
        resources: moonSubtype === "lava" ? ["Ore", "Crystals"] : ["Ore", "Silicates"],
        economy: "untapped",
        temperature: moonTemp,
        habitabilityZone: planet.habitabilityZone,
        flora: moonFlora,
        fauna: moonFauna,
        hazards: [],
      };
      planet.children!.push(moon);
      bodies.push(moon);
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
        resources: ["Ore"],
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
      resources: ["Trade Hub"],
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

function pickResources(rng: Rng, type: BodyType): string[] {
  const pool = type === "gas_giant"
    ? ["Helium-3", "Energy Crystals", "Hydrogen"]
    : ["Ore", "Organics", "Rare Earths", "Silicates", "Water Ice"];
  const count = randInt(rng, 1, 3);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const p = pick(rng, pool);
    if (!out.includes(p)) out.push(p);
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

    const localLinks = randInt(rng, 2, 3);
    for (let i = 0; i < localLinks && i < sorted.length; i++) {
      const target = sorted[i][0];
      const k = key(s.id, target.id);
      if (seen.has(k)) continue;
      seen.add(k);
      lanes.push({ id: `lane-${lanes.length}`, a: s.id, b: target.id });
    }

    // Hub systems (~5%) get extra long-range jumps.
    if (rng() < 0.05) {
      const extras = randInt(rng, 3, 7);
      for (let i = 0; i < extras; i++) {
        const target = sorted[randInt(rng, 4, Math.min(40, sorted.length - 1))][0];
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
  // Empires claim contiguous-ish blobs by picking seed systems then nearest neighbours.
  const remaining = new Set(systems.map((s) => s.id));
  for (const emp of empires) {
    const seed = pick(rng, [...remaining]);
    if (!seed) continue;
    const claimSize = randInt(rng, 18, 38);
    const queue = [seed];
    const claimed: string[] = [];
    while (queue.length && claimed.length < claimSize) {
      const id = queue.shift()!;
      if (!remaining.has(id)) continue;
      remaining.delete(id);
      claimed.push(id);
      const sys = systems.find((s) => s.id === id)!;
      // claim some bodies (not all → contestation possible)
      for (const body of sys.bodies) {
        if ((body.type === "terrestrial" || body.type === "gas_giant" || body.type === "station") && rng() < 0.7) {
          body.ownerId = emp.id;
        }
      }
      // expand to nearest unclaimed
      const neighbours = systems
        .filter((o) => remaining.has(o.id))
        .map((o) => {
          const d = Math.hypot(o.pos[0] - sys.pos[0], o.pos[2] - sys.pos[2]);
          return [o.id, d] as const;
        })
        .sort((a, b) => a[1] - b[1])
        .slice(0, 3);
      for (const [nid] of neighbours) queue.push(nid);
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

  const empires = buildEmpires();
  assignOwnership(rng, systems, empires);

  const systemById = Object.fromEntries(systems.map((s) => [s.id, s]));
  const sectorById = Object.fromEntries(sectors.map((s) => [s.id, s]));

  return { seed, sectors, systems, hyperlanes, empires, systemById, sectorById };
}
