import React from "react";
import { 
  Globe, Mountain, Gem, Snowflake, Hammer, Zap, Hexagon, Disc, Sun, Award, Shield, BatteryFull, Radiation,
  Moon, CircleDot, Shapes, Rocket, Sparkles, Droplets, Orbit, Waves, Leaf, Cpu,
  Layers, FlaskConical, CircuitBoard, Flame, Atom, Radio, Eclipse, BatteryCharging, Network, Microscope, Radar, Layers2
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties; size?: number | string }>> = {
  // Materials
  Mountain, Gem, Snowflake, Hammer, Zap, Hexagon, Disc, Sun, Award, Shield, BatteryFull, Radiation,
  Sparkles, Droplets, Orbit, Waves, Leaf, Cpu,
  Layers, FlaskConical, CircuitBoard, Flame, Atom, Radio, Eclipse, BatteryCharging, Network, Microscope, Radar, Layers2,
  // Celestial / UI
  Moon, CircleDot, Shapes, Rocket, Globe
};

export function GalaxyIcon({ name, className, color }: { name: string; className?: string; color?: string }) {
  const Icon = ICON_MAP[name] || Globe;
  return <Icon className={className} style={color ? { color } : undefined} />;
}
