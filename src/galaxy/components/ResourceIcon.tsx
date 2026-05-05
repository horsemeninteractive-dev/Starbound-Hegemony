import { 
  Globe, Mountain, Gem, Snowflake, Hammer, Zap, Hexagon, Disc, Sun, Award, Shield, BatteryFull, Radiation,
  Moon, CircleDot, Shapes, Rocket, Sparkles, Droplets, Orbit, Waves, Leaf, Cpu
} from "lucide-react";

const ICON_MAP: Record<string, any> = {
  // Materials
  Mountain, Gem, Snowflake, Hammer, Zap, Hexagon, Disc, Sun, Award, Shield, BatteryFull, Radiation,
  Sparkles, Droplets, Orbit, Waves, Leaf, Cpu,
  // Celestial / UI
  Moon, CircleDot, Shapes, Rocket, Globe
};

export function GalaxyIcon({ name, className, color }: { name: string; className?: string; color?: string }) {
  const Icon = ICON_MAP[name] || Globe;
  return <Icon className={className} style={color ? { color } : undefined} />;
}
