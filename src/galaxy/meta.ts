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

export const STAR_BASE_SIZE: Record<StarType, number> = {
  O: 5.2, B: 4.4, A: 3.6, F: 3.0, G: 2.6, K: 2.2, M: 1.8,
  whitedwarf: 1.0, neutron: 0.7, pulsar: 0.8, binary: 3.2, blackhole: 1.6, whitehole: 6.5,
  quasar: 8.0, magnetar: 1.2, protostar: 4.5, dyson_swarm: 10.0,
};

export const STAR_MASS: Record<StarType, number> = {
  O: 16.0, B: 8.0, A: 3.0, F: 1.4, G: 1.0, K: 0.8, M: 0.4,
  whitedwarf: 0.6, neutron: 1.4, pulsar: 1.5, binary: 2.0, blackhole: 10.0, whitehole: 50.0,
  quasar: 100.0, magnetar: 1.6, protostar: 0.8, dyson_swarm: 1.0,
};

export function getOrbitalSpeed(r: number, starType: StarType, isMoon: boolean) {
  if (isMoon) return 0.08; // Moons stay at a fixed relative speed for now
  const mass = STAR_MASS[starType] || 1.0;
  // v = sqrt(GM/r). Greatly slowed down for easier clicking.
  return 0.04 * Math.sqrt(mass / Math.max(1, r));
}

export const STAR_LUMINOSITY: Record<StarType, number> = {
  O: 40.0, B: 15.0, A: 5.0, F: 2.5, G: 1.0, K: 0.4, M: 0.08,
  whitedwarf: 0.01, neutron: 0.005, pulsar: 0.005, binary: 2.0, blackhole: 0.001, whitehole: 100.0,
  quasar: 500.0, magnetar: 0.02, protostar: 0.2, dyson_swarm: 5.0,
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
  neutron: { label: "Neutron Star", description: "Ultra-dense remnant with magnetic jets", color: "text-star-neutron", hex: "d6f7ff", temp: "600,000 K" },
  pulsar: { label: "Pulsar", description: "Rotating neutron star, beamed emission", color: "text-star-pulsar", hex: "8ff5ff", temp: "1,000,000 K" },
  binary: { label: "Binary System", description: "Two stars in mutual orbit", color: "text-star-binary", hex: "ffb066", temp: "varies" },
  blackhole: { label: "Black Hole", description: "Singularity with accretion disk", color: "text-star-blackhole", hex: "1a0033", temp: "—" },
  whitehole: { label: "White Hole", description: "Sagittarius Z* - Galactic Fountain", color: "text-primary", hex: "ffffff", temp: "∞ K" },
  quasar: { label: "Quasar", description: "Active Galactic Nucleus", color: "text-star-pulsar", hex: "ffffff", temp: "10,000,000 K" },
  magnetar: { label: "Magnetar", description: "Extreme magnetic field remnant", color: "text-star-neutron", hex: "bbf7ff", temp: "100,000 K" },
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

export const BODY_META = {
  terrestrial: { label: "Terrestrial", icon: "◉" },
  gas_giant: { label: "Gas Giant", icon: "◎" },
  moon: { label: "Moon", icon: "○" },
  asteroid: { label: "Asteroid", icon: "◇" },
  station: { label: "Station", icon: "⬡" },
  jump_gate: { label: "Jump Gate", icon: "⬢" },
  ship: { label: "Flagship", icon: "🚀" },
} as const;
