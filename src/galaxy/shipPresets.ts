
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

export const SHIP_PARTS: Record<ShipComponentType, ShipPart[]> = {
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
