import { useMemo } from "react";
import { SKILL_TREE, computeSkillBonus } from "@/galaxy/skills";
import type { SkillNode } from "@/galaxy/skills";
import { GalaxyIcon } from "@/galaxy/components/ResourceIcon";
import { Lock, CheckCircle2, ChevronRight, Zap } from "lucide-react";
import { PageHeader } from "./PageHeader";

const BRANCH_META = {
  navigation: { label: "Navigation", color: "cyan",    icon: "Rocket",  hue: 190 },
  industry:   { label: "Industry",   color: "orange",  icon: "Hammer",  hue: 30  },
  commerce:   { label: "Commerce",   color: "yellow",  icon: "Scale",   hue: 50  },
  diplomacy:  { label: "Diplomacy",  color: "purple",  icon: "Award",   hue: 280 },
  command:    { label: "Command",    color: "green",   icon: "Shield",  hue: 140 },
};

interface SkillsViewProps {
  playerLevel: number;
  playerXP: number;
  playerSkills: string[];
  onUnlock: (id: string) => void;
}

export function SkillsView({ playerLevel, playerXP, playerSkills, onUnlock, onBack }: SkillsViewProps & { onBack?: () => void }) {
  const skillPointsTotal = playerLevel - 1;
  const skillPointsUsed = playerSkills.length;
  const skillPointsAvailable = skillPointsTotal - skillPointsUsed;
  const xpToNextLevel = playerLevel * 1000;

  const branches = Object.keys(BRANCH_META) as (keyof typeof BRANCH_META)[];

  function canUnlock(skill: SkillNode): boolean {
    if (playerSkills.includes(skill.id)) return false; // already unlocked
    if (skillPointsAvailable <= 0) return false;
    return skill.prereqs.every(p => playerSkills.includes(p));
  }

  function getStatus(skill: SkillNode): "unlocked" | "available" | "locked" {
    if (playerSkills.includes(skill.id)) return "unlocked";
    if (skill.prereqs.every(p => playerSkills.includes(p))) return "available";
    return "locked";
  }

  return (
    <div className="flex-1 flex flex-col bg-background/40 backdrop-blur-sm animate-fade-in overflow-hidden">
      <PageHeader 
        title="Commander Skills"
        subtitle="Neural Enhancement Profile"
        icon={<Zap />}
        onBack={onBack}
      />

      <main className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-10 flex flex-col gap-8">
        <div className="max-w-4xl mx-auto w-full space-y-8">
          {/* Progress Header */}
          <div className="hud-panel relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div className="flex items-center gap-4">
                {/* Skill Points */}
                <div className="flex flex-col items-center gap-0.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded">
                  <span className="font-display text-xl text-primary font-bold">{skillPointsAvailable}</span>
                  <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-mono-hud">Skill Pts</span>
                </div>
                {/* XP Progress */}
                <div className="flex flex-col gap-1 min-w-[200px]">
                  <div className="flex justify-between text-[9px] font-mono-hud uppercase tracking-wider text-muted-foreground">
                    <span>LVL {playerLevel}</span>
                    <span>{playerXP} / {xpToNextLevel} XP</span>
                  </div>
                  <div className="h-2 bg-primary/10 rounded-full overflow-hidden border border-primary/15">
                    <div
                      className="h-full bg-gradient-to-r from-primary/80 to-primary shadow-[0_0_6px_hsl(var(--primary))] transition-all duration-500"
                      style={{ width: `${Math.min(100, (playerXP / xpToNextLevel) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[8px] text-muted-foreground text-right font-mono-hud">
                    {xpToNextLevel - playerXP} XP to Level {playerLevel + 1}
                  </p>
                </div>
              </div>
            </div>

            {/* Skill point dots */}
            <div className="mt-4 flex items-center gap-1 flex-wrap">
              <span className="text-[8px] font-mono-hud uppercase tracking-widest text-muted-foreground mr-1">Points:</span>
              {Array.from({ length: Math.max(skillPointsTotal, 1) }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full border transition-all ${
                    i < skillPointsUsed
                      ? "bg-primary/40 border-primary/30"
                      : i < skillPointsTotal
                      ? "bg-primary border-primary shadow-[0_0_4px_hsl(var(--primary))] animate-pulse"
                      : "bg-transparent border-primary/20"
                  }`}
                />
              ))}
              {skillPointsTotal === 0 && (
                <span className="text-[8px] text-muted-foreground font-mono-hud italic">Level up to earn skill points</span>
              )}
            </div>
          </div>

          {/* XP Sources Guide */}
          <div className="hud-panel">
            <p className="text-[9px] font-mono-hud uppercase tracking-widest text-primary mb-2">XP Sources</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {([
                ["🌐 Discover System", "50 XP"],
                ["🏗️ Build Factory", "100 XP"],
                ["⚙️ Work Shift", "20 XP"],
                ["👍 Article Upvoted", "5 XP"],
                ["🏠 Claim Residency", "75 XP"],
                ["📈 Market Trade", "25 XP"],
              ] as [string, string][]).map(([action, xp]) => (
                <div key={action} className="flex justify-between items-center px-2 py-1 bg-primary/5 border border-primary/10 rounded text-[9px] font-mono-hud">
                  <span className="text-muted-foreground">{action}</span>
                  <span className="text-primary font-bold">{xp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Skill branches */}
          <div className="flex flex-col gap-4">
        {branches.map(branch => {
          const branchMeta = BRANCH_META[branch];
          const branchSkills = SKILL_TREE.filter(s => s.branch === branch).sort((a, b) => a.tier - b.tier);

          return (
            <div key={branch} className="hud-panel overflow-hidden">
              {/* Branch header */}
              <div
                className="flex items-center gap-2 mb-3 pb-2 border-b"
                style={{ borderColor: `hsl(${branchMeta.hue} 70% 50% / 0.25)` }}
              >
                <div
                  className="w-6 h-6 rounded flex items-center justify-center"
                  style={{ background: `hsl(${branchMeta.hue} 70% 20%)`, border: `1px solid hsl(${branchMeta.hue} 70% 40% / 0.4)` }}
                >
                  <GalaxyIcon name={branchMeta.icon} className="w-3 h-3" color={`hsl(${branchMeta.hue} 70% 65%)`} />
                </div>
                <span
                  className="font-display text-[11px] uppercase tracking-[0.15em] font-bold"
                  style={{ color: `hsl(${branchMeta.hue} 70% 65%)` }}
                >
                  {branchMeta.label}
                </span>
                <span className="ml-auto text-[8px] font-mono-hud text-muted-foreground uppercase tracking-widest">
                  {branchSkills.filter(s => playerSkills.includes(s.id)).length} / {branchSkills.length}
                </span>
              </div>

              {/* Skill rows grouped by tier */}
              <div className="flex flex-col gap-1.5">
                {[1, 2, 3].map(tier => {
                  const tierSkills = branchSkills.filter(s => s.tier === tier);
                  if (!tierSkills.length) return null;
                  return (
                    <div key={tier} className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <div className="h-px flex-1 bg-border/40" />
                        <span className="text-[7px] font-mono-hud uppercase tracking-widest text-muted-foreground/60">Tier {tier}</span>
                        <div className="h-px flex-1 bg-border/40" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {tierSkills.map(skill => {
                          const status = getStatus(skill);
                          const unlockable = canUnlock(skill);
                          return (
                            <SkillCard
                              key={skill.id}
                              skill={skill}
                              status={status}
                              unlockable={unlockable}
                              branchHue={branchMeta.hue}
                              onUnlock={() => onUnlock(skill.id)}
                              playerSkills={playerSkills}
                            />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  </main>
</div>
);
}

function SkillCard({
  skill,
  status,
  unlockable,
  branchHue,
  onUnlock,
  playerSkills,
}: {
  skill: SkillNode;
  status: "unlocked" | "available" | "locked";
  unlockable: boolean;
  branchHue: number;
  onUnlock: () => void;
  playerSkills: string[];
}) {
  const isUnlocked = status === "unlocked";
  const isLocked = status === "locked";

  const borderColor = isUnlocked
    ? `hsl(${branchHue} 70% 45% / 0.6)`
    : unlockable
    ? `hsl(${branchHue} 60% 40% / 0.4)`
    : "hsl(var(--border))";

  const bgColor = isUnlocked
    ? `hsl(${branchHue} 70% 10% / 0.5)`
    : unlockable
    ? `hsl(${branchHue} 60% 8% / 0.3)`
    : "transparent";

  return (
    <div
      className="relative rounded border transition-all duration-200 overflow-hidden"
      style={{ borderColor, background: bgColor }}
    >
      {/* Glow when unlocked */}
      {isUnlocked && (
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 30% 50%, hsl(${branchHue} 70% 50%), transparent 70%)` }}
        />
      )}

      <div className="relative flex items-start gap-2 p-2.5">
        {/* Icon */}
        <div
          className="shrink-0 w-7 h-7 rounded flex items-center justify-center mt-0.5"
          style={{
            background: isUnlocked
              ? `hsl(${branchHue} 70% 20%)`
              : isLocked
              ? "hsl(var(--border) / 0.3)"
              : `hsl(${branchHue} 60% 15%)`,
            border: `1px solid hsl(${branchHue} 60% ${isUnlocked ? 45 : 30}% / 0.4)`
          }}
        >
          <GalaxyIcon
            name={skill.icon}
            className="w-3.5 h-3.5"
            color={isLocked ? "hsl(var(--muted-foreground))" : `hsl(${branchHue} 70% ${isUnlocked ? 70 : 55}%)`}
          />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="font-display text-[10px] uppercase tracking-wide font-bold truncate"
              style={{ color: isLocked ? "hsl(var(--muted-foreground))" : isUnlocked ? `hsl(${branchHue} 70% 70%)` : "hsl(var(--foreground))" }}
            >
              {skill.name}
            </span>
            {isUnlocked && <CheckCircle2 size={9} style={{ color: `hsl(${branchHue} 70% 60%)` }} className="shrink-0" />}
            {isLocked && <Lock size={8} className="shrink-0 text-muted-foreground/60" />}
          </div>
          <p className="text-[8px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">{skill.description}</p>
          <div
            className="mt-1 text-[8px] font-bold font-mono-hud uppercase tracking-wider"
            style={{ color: isLocked ? "hsl(var(--muted-foreground) / 0.5)" : `hsl(${branchHue} 70% 65%)` }}
          >
            {skill.effect}
          </div>

          {/* Prereq pills */}
          {skill.prereqs.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {skill.prereqs.map(p => {
                const prereqSkill = SKILL_TREE.find(s => s.id === p);
                const met = playerSkills.includes(p);
                return (
                  <span
                    key={p}
                    className="text-[7px] px-1.5 py-0.5 rounded-sm font-mono-hud uppercase tracking-wider border"
                    style={{
                      borderColor: met ? `hsl(${branchHue} 60% 40% / 0.4)` : "hsl(var(--border))",
                      color: met ? `hsl(${branchHue} 70% 60%)` : "hsl(var(--muted-foreground))",
                      background: met ? `hsl(${branchHue} 70% 10% / 0.3)` : "transparent"
                    }}
                  >
                    {met ? "✓ " : ""}{prereqSkill?.name ?? p}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Unlock button */}
        {unlockable && (
          <button
            onClick={onUnlock}
            className="shrink-0 mt-1 px-2 py-1 text-[8px] font-bold uppercase tracking-widest rounded border transition-all hover:scale-105 active:scale-95 font-mono-hud"
            style={{
              color: `hsl(${branchHue} 70% 70%)`,
              borderColor: `hsl(${branchHue} 70% 40% / 0.5)`,
              background: `hsl(${branchHue} 70% 10% / 0.4)`,
            }}
          >
            UNLOCK
          </button>
        )}
      </div>
    </div>
  );
}
