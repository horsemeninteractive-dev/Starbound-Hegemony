import { VesselClass } from "./types";

export type ShipComponentType = 'hull' | 'wings' | 'engines' | 'bridge';

export interface ShipPart {
  id: string;
  name: string;
  description: string;
  type: ShipComponentType;
  thumbnail: string; // Base64 or path
}

export interface ShipConfiguration {
  name: string;
  hullId: string;
  wingsId: string;
  enginesId: string;
  bridgeId: string;
  primaryColor: string;
  accentColor: string;
}

export const SHIP_PARTS: Record<VesselClass, Record<ShipComponentType, ShipPart[]>> = {
  commander: {
    hull: [
      { id: 'hull_vanguard', name: 'Vanguard Alpha', description: 'Standard balanced military hull.', type: 'hull', thumbnail: '' },
      { id: 'hull_sleek', name: 'Ghost S-1', description: 'Streamlined hull designed for high-speed transit.', type: 'hull', thumbnail: '' },
      { id: 'hull_heavy', name: 'Ironclad M-4', description: 'Reinforced heavy-duty plating for maximum durability.', type: 'hull', thumbnail: '' },
      { id: 'hull_scout', name: 'Pathfinder X', description: 'Lightweight agile hull for deep space exploration.', type: 'hull', thumbnail: '' },
      { id: 'hull_royal', name: 'Monarch G-9', description: 'Ornate and prestigious command hull for elite officers.', type: 'hull', thumbnail: '' },
    ],
    wings: [
      { id: 'wings_delta', name: 'Delta Swept', description: 'High-maneuverability wings for atmospheric and vacuum flight.', type: 'wings', thumbnail: '' },
      { id: 'wings_split', name: 'Twin-Fork', description: 'Dual-pylon stabilizers with integrated sensors.', type: 'wings', thumbnail: '' },
      { id: 'wings_forward', name: 'Forward Swept', description: 'Experimental design for aggressive combat profiles.', type: 'wings', thumbnail: '' },
      { id: 'wings_solar', name: 'Solar Sails', description: 'Extended panels for passive energy collection and stability.', type: 'wings', thumbnail: '' },
      { id: 'wings_heavy', name: 'Broadside Fin', description: 'Thick defensive wings with auxiliary thruster mounts.', type: 'wings', thumbnail: '' },
    ],
    engines: [
      { id: 'engine_plasma', name: 'Nova Drive', description: 'Standard blue-ion plasma propulsion.', type: 'engines', thumbnail: '' },
      { id: 'engine_triple', name: 'Tri-Cluster', description: 'Three small engines for precision control.', type: 'engines', thumbnail: '' },
      { id: 'engine_heavy', name: 'Titan Burner', description: 'Massive single-nozzle engine for brute force.', type: 'engines', thumbnail: '' },
      { id: 'engine_dual', name: 'Twin Velocity', description: 'Balanced dual-engine setup for reliable performance.', type: 'engines', thumbnail: '' },
      { id: 'engine_stealth', name: 'Void Pulse', description: 'Low-signature engine for clandestine operations.', type: 'engines', thumbnail: '' },
    ],
    bridge: [
      { id: 'bridge_panoramic', name: 'Panorama', description: 'Wide-angle viewing deck for command and control.', type: 'bridge', thumbnail: '' },
      { id: 'bridge_armored', name: 'Bunker', description: 'Internal bridge with sensor-only navigation.', type: 'bridge', thumbnail: '' },
      { id: 'bridge_sleek', name: 'Spire', description: 'Aerodynamic vertical command tower.', type: 'bridge', thumbnail: '' },
      { id: 'bridge_bubble', name: 'Observatory', description: 'Full-sphere glass bridge for maximum visibility.', type: 'bridge', thumbnail: '' },
      { id: 'bridge_integrated', name: 'Embedded', description: 'Seamlessly integrated bridge for structural integrity.', type: 'bridge', thumbnail: '' },
    ],
  },
  freighter: {
    hull: [
      { id: 'hull_freighter_bulk', name: 'Bulk Carrier', description: 'Massive rectangular hull with maximum cargo volume.', type: 'hull', thumbnail: '' },
      { id: 'hull_freighter_modular', name: 'Modular Frame', description: 'Open-lattice frame for carrying external containers.', type: 'hull', thumbnail: '' },
      { id: 'hull_freighter_armored', name: 'Convoy Lead', description: 'Reinforced hull for hazardous shipping lanes.', type: 'hull', thumbnail: '' },
    ],
    wings: [
      { id: 'wings_freighter_stabi', name: 'Stabilizers', description: 'Wide fins for steadying heavy loads.', type: 'wings', thumbnail: '' },
      { id: 'wings_freighter_crane', name: 'Gantry Arms', description: 'Industrial arms with integrated cargo manipulators.', type: 'wings', thumbnail: '' },
    ],
    engines: [
      { id: 'engine_freighter_quad', name: 'Quad Burner', description: 'Four large engines for heavy lifting.', type: 'engines', thumbnail: '' },
      { id: 'engine_freighter_industrial', name: 'Industrial Drive', description: 'High-torque low-speed propulsion.', type: 'engines', thumbnail: '' },
    ],
    bridge: [
      { id: 'bridge_freighter_top', name: 'Command Tower', description: 'High-mounted bridge for viewing cargo decks.', type: 'bridge', thumbnail: '' },
      { id: 'bridge_freighter_front', name: 'Fore Bridge', description: 'Nose-mounted bridge for precision docking.', type: 'bridge', thumbnail: '' },
    ],
  },
  science: {
    hull: [
      { id: 'hull_science_dish', name: 'Sensor Array', description: 'Hull integrated with massive signal collectors.', type: 'hull', thumbnail: '' },
      { id: 'hull_science_sleek', name: 'Lab Vessel', description: 'Clean-room pressurized hull for sensitive experiments.', type: 'hull', thumbnail: '' },
    ],
    wings: [
      { id: 'wings_science_solar', name: 'Array Wings', description: 'Large solar collectors for scientific instruments.', type: 'wings', thumbnail: '' },
      { id: 'wings_science_sensors', name: 'Sensor Pylons', description: 'Extended booms for long-range scanning.', type: 'wings', thumbnail: '' },
    ],
    engines: [
      { id: 'engine_science_blue', name: 'Ion Pulse', description: 'Clean emission engine for minimal interference.', type: 'engines', thumbnail: '' },
      { id: 'engine_science_twin', name: 'Precision Dual', description: 'Small thrusters for station-keeping.', type: 'engines', thumbnail: '' },
    ],
    bridge: [
      { id: 'bridge_science_bubble', name: 'Dome Bridge', description: 'Transparent dome for celestial observation.', type: 'bridge', thumbnail: '' },
      { id: 'bridge_science_sleek', name: 'Integrated Lab', description: 'Combined bridge and research station.', type: 'bridge', thumbnail: '' },
    ],
  },
  corvette: { hull: [], wings: [], engines: [], bridge: [] },
  destroyer: { hull: [], wings: [], engines: [], bridge: [] },
};

export const DEFAULT_SHIP_CONFIG: ShipConfiguration = {
  name: 'Aegis VII',
  hullId: 'hull_vanguard',
  wingsId: 'wings_delta',
  enginesId: 'engine_plasma',
  bridgeId: 'bridge_panoramic',
  primaryColor: '#c8d0dc',
  accentColor: '#00ffff',
};

export const CLASS_DEFAULTS: Record<VesselClass, ShipConfiguration> = {
  commander: DEFAULT_SHIP_CONFIG,
  freighter: {
    name: 'Heavy Hauler',
    hullId: 'hull_freighter_bulk',
    wingsId: 'wings_freighter_stabi',
    enginesId: 'engine_freighter_quad',
    bridgeId: 'bridge_freighter_top',
    primaryColor: '#eab308', // Industrial yellow
    accentColor: '#fb923c', // Orange energy
  },
  science: {
    name: 'Discovery One',
    hullId: 'hull_science_dish',
    wingsId: 'wings_science_sensors',
    enginesId: 'engine_science_blue',
    bridgeId: 'bridge_science_bubble',
    primaryColor: '#f8fafc', // Clean white
    accentColor: '#38bdf8', // Light blue energy
  },
  corvette: DEFAULT_SHIP_CONFIG,
  destroyer: DEFAULT_SHIP_CONFIG,
};
