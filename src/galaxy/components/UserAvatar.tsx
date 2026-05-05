import { Shield, Flag, Globe, Users, Award, Building2, Fingerprint, Sparkles, Rocket, Compass, Crosshair, Target, Sword, Anchor, Zap } from "lucide-react";

const PARTY_ICONS: Record<string, any> = {
  Shield, Flag, Globe, Users, Award, Building2, Fingerprint, 
  Sparkles, Rocket, Compass, Crosshair, Target, Sword, Anchor, Zap
};

interface UserAvatarProps {
  avatarUrl: string;
  level?: number;
  partyIcon?: string;
  partyHue?: number;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function UserAvatar({ avatarUrl, level, partyIcon, partyHue, className = "", size = "md" }: UserAvatarProps) {
  const containerSize = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
    xl: "w-16 h-16"
  }[size];

  const badgeSize = {
    sm: "w-3 h-3 text-[6px]",
    md: "w-4 h-4 text-[7px]",
    lg: "w-5 h-5 text-[9px]",
    xl: "w-7 h-7 text-[12px]"
  }[size];

  const partyBadgeSize = {
    sm: "w-3 h-3 p-0.5",
    md: "w-4 h-4 p-0.5",
    lg: "w-5 h-5 p-1",
    xl: "w-7 h-7 p-1.5"
  }[size];

  const PartyIconComponent = partyIcon ? PARTY_ICONS[partyIcon] : null;

  return (
    <div className={`relative shrink-0 ${className}`}>
      {/* Main Avatar Circle */}
      <div className={`${containerSize} rounded-full border-2 border-primary/40 overflow-hidden shadow-[0_0_10px_hsl(var(--primary)/0.2)] bg-black/40`}>
        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
      </div>

      {/* Party Icon Badge (Bottom Left) */}
      {PartyIconComponent && (
        <div 
          className={`absolute -bottom-1 -left-1 ${partyBadgeSize} bg-background border rounded-sm flex items-center justify-center shadow-lg`}
          style={{ 
            borderColor: `hsla(${partyHue || 200}, 70%, 50%, 0.8)`,
            boxShadow: `0 0 10px hsla(${partyHue || 200}, 70%, 50%, 0.3)`
          }}
        >
          <PartyIconComponent 
            size="100%" 
            style={{ color: `hsl(${partyHue || 200}, 80%, 60%)` }} 
          />
        </div>
      )}

      {/* Level Badge (Bottom Right) */}
      {level !== undefined && (
        <div className={`absolute -bottom-1 -right-1 ${badgeSize} bg-background border border-primary/40 rounded-full flex items-center justify-center shadow-lg`}>
          <span className="font-bold text-primary">{level}</span>
        </div>
      )}
    </div>
  );
}
