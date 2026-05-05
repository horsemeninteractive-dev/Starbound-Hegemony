
const { createClient } = require('@supabase/supabase-js');

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const randInt = (rng, min, max) => Math.floor(rng() * (max - min + 1)) + min;
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

// Mock types/constants needed for generation
const STAR_BASE_SIZE = { O: 32.0 };
const STAR_LUMINOSITY = { O: 40.0 };

function pickResources(rng, type) {
  const pool = type === "gas_giant"
    ? ["Helium-3", "Energy Crystals", "Hydrogen"]
    : ["Ore", "Organics", "Rare Earths", "Silicates", "Water Ice"];
  
  const out = [];
  // For Sanctum, let's just give them 2 major resources
  for (let i = 0; i < 2; i++) {
    const p = pool[i % pool.length];
    out.push({
      resource: p,
      richness: "abundant",
    });
  }
  return out;
}

function generateBodies(rng, systemId, systemName, starType) {
  const bodies = [];
  const planetCount = 8;
  let orbit = STAR_BASE_SIZE[starType] * 2.2 + 15;

  for (let i = 0; i < planetCount; i++) {
    orbit += 80;
    const isGas = i > 4;
    const type = isGas ? "gas_giant" : "terrestrial";
    const id = `${systemId}-b${i}`;
    
    const planet = {
      id,
      systemId,
      name: `${systemName} ${String.fromCharCode(98 + i)}`,
      type,
      subtype: isGas ? "gas_giant" : "continental",
      orbit,
      deposits: pickResources(rng, type),
    };
    bodies.push(planet);
  }
  return bodies;
}

const RESOURCE_TO_FACTORY = {
  "Ore": "ore_extractor",
  "Helium-3": "gas_collector",
  "Hydrogen": "gas_collector",
  "Energy Crystals": "crystal_harvester",
  "Organics": "organic_vats",
  "Rare Earths": "mineral_sieve",
  "Silicates": "silicate_extractor",
  "Water Ice": "ice_melter",
};

async function seed() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  const rng = mulberry32(42); // Universal seed

  for (let i = 0; i < 12; i++) {
    const id = `sys-inner-${i}`;
    const bodies = generateBodies(rng, id, `Sanctum ${i + 1}`, "O");
    
    console.log(`Seeding system ${id}...`);
    for (const body of bodies) {
        for (const dep of body.deposits) {
            // Create resources in DB
            await supabase.from('body_resources').upsert({
                body_id: body.id,
                resource_type: dep.resource,
                current_amount: 1000000, 
                max_amount: 1000000,
            });

            // Create NPC factory
            await supabase.from('factories').insert({
                body_id: body.id,
                type: RESOURCE_TO_FACTORY[dep.resource] || "extraction_rig",
                resource_type: dep.resource,
                owner_id: null,
                jobs_available: 50,
                wage: 5,
                is_npc_owned: true
            });
        }
    }
  }
  console.log("Seed complete");
}

seed();
