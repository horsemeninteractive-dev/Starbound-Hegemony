/**
 * Starbound Hegemony — Skill Tree Definition
 *
 * Five branches reflecting the core gameplay pillars:
 *   NAVIGATION   — Exploration & travel efficiency
 *   INDUSTRY     — Factory ownership & production
 *   COMMERCE     — Trading, market, and credits
 *   DIPLOMACY    — Party, residency, and political power
 *   COMMAND      — Ship, cargo, and fleet capabilities
 *
 * Skill effects are READ by the client and applied locally.
 * The backend only stores which skills are unlocked — effects
 * are computed from the skill definitions here.
 */

export interface SkillNode {
  id: string;
  branch: "navigation" | "industry" | "commerce" | "diplomacy" | "command";
  name: string;
  description: string;
  /** What the skill actually does — used to drive UI tooltip */
  effect: string;
  /** Tier within the branch (1 = root, 2 = mid, 3 = deep) */
  tier: number;
  /** Skill IDs that must be unlocked first */
  prereqs: string[];
  icon: string;
  /** Machine-readable bonus key + value for easy lookup */
  bonus: { key: SkillBonusKey; value: number };
}

export type SkillBonusKey =
  | "jump_cost_reduction"      // % reduction in AP cost for FTL jumps
  | "exploration_xp_bonus"    // flat XP bonus when discovering a system
  | "sensor_range_bonus"      // extra hyperlane-hops visible without exploring
  | "travel_speed_bonus"      // % reduction in travel duration
  | "factory_wage_bonus"      // flat SC added to each shift wage earned
  | "factory_build_discount"  // % discount on factory construction cost
  | "factory_slots_bonus"     // extra job slots on owned factories
  | "factory_xp_bonus"        // flat XP bonus when working a shift
  | "market_fee_reduction"    // % reduction on market listing fees
  | "trade_xp_bonus"          // flat XP bonus when completing a market trade
  | "cargo_capacity_bonus"    // flat extra cargo capacity units
  | "residency_xp_bonus"      // flat XP bonus when claiming residency
  | "party_found_discount"    // % discount on party founding cost
  | "article_xp_bonus"        // flat XP bonus when posting an article
  | "ap_regen_bonus"          // extra AP per regen tick
  | "starting_credits_bonus"  // bonus SC — applied once on account creation (display only)
  | "level_xp_bonus";         // % XP multiplier on all gains

export const SKILL_TREE: SkillNode[] = [
  // ────────────────────────────────────────────
  // NAVIGATION BRANCH
  // ────────────────────────────────────────────
  {
    id: "nav_efficient_drives",
    branch: "navigation",
    name: "Efficient Drives",
    description: "Improved fuel-injection algorithms cut the AP cost of every FTL jump.",
    effect: "-10 AP per jump",
    tier: 1,
    prereqs: [],
    icon: "Zap",
    bonus: { key: "jump_cost_reduction", value: 10 }
  },
  {
    id: "nav_deep_scan",
    branch: "navigation",
    name: "Deep-Space Scanner",
    description: "Enhanced sensors reveal extra XP for mapping unknown systems.",
    effect: "+25 XP per system discovered",
    tier: 1,
    prereqs: [],
    icon: "Radar",
    bonus: { key: "exploration_xp_bonus", value: 25 }
  },
  {
    id: "nav_extended_sensors",
    branch: "navigation",
    name: "Extended Sensor Array",
    description: "Long-range passive sensors show an extra jump's worth of hyperlane topology.",
    effect: "+1 sensor range (hyperlane hops)",
    tier: 2,
    prereqs: ["nav_deep_scan"],
    icon: "Radio",
    bonus: { key: "sensor_range_bonus", value: 1 }
  },
  {
    id: "nav_slipstream",
    branch: "navigation",
    name: "Slipstream Routing",
    description: "Optimised jump trajectories reduce transit duration across all travel types.",
    effect: "-20% travel time",
    tier: 2,
    prereqs: ["nav_efficient_drives"],
    icon: "Wind",
    bonus: { key: "travel_speed_bonus", value: 0.20 }
  },
  {
    id: "nav_void_runner",
    branch: "navigation",
    name: "Void Runner",
    description: "Mastery of deep-space navigation: FTL jumps cost barely any AP.",
    effect: "-20 AP per jump (stacks with Efficient Drives)",
    tier: 3,
    prereqs: ["nav_slipstream", "nav_extended_sensors"],
    icon: "Rocket",
    bonus: { key: "jump_cost_reduction", value: 20 }
  },

  // ────────────────────────────────────────────
  // INDUSTRY BRANCH
  // ────────────────────────────────────────────
  {
    id: "ind_labour_rights",
    branch: "industry",
    name: "Labour Efficiency",
    description: "Your workforce training protocols earn you bonus SC on every shift.",
    effect: "+10 SC per factory shift worked",
    tier: 1,
    prereqs: [],
    icon: "Hammer",
    bonus: { key: "factory_wage_bonus", value: 10 }
  },
  {
    id: "ind_blueprints",
    branch: "industry",
    name: "Prefab Blueprints",
    description: "Pre-fabricated modular kits reduce the cost of building a new factory.",
    effect: "-15% factory construction cost",
    tier: 1,
    prereqs: [],
    icon: "FileText",
    bonus: { key: "factory_build_discount", value: 0.15 }
  },
  {
    id: "ind_foreman",
    branch: "industry",
    name: "Foreman Certification",
    description: "Your facilities run extra job positions, increasing throughput.",
    effect: "+2 job slots on all owned factories",
    tier: 2,
    prereqs: ["ind_blueprints"],
    icon: "Users",
    bonus: { key: "factory_slots_bonus", value: 2 }
  },
  {
    id: "ind_on_the_job",
    branch: "industry",
    name: "On-the-Job Training",
    description: "Hands-on work in the mines and refineries sharpens your skills faster.",
    effect: "+15 XP per factory shift worked",
    tier: 2,
    prereqs: ["ind_labour_rights"],
    icon: "TrendingUp",
    bonus: { key: "factory_xp_bonus", value: 15 }
  },
  {
    id: "ind_industrial_magnate",
    branch: "industry",
    name: "Industrial Magnate",
    description: "A titan of production — your empire of factories is the envy of the sector.",
    effect: "+3 job slots AND +20 SC per shift (stacking)",
    tier: 3,
    prereqs: ["ind_foreman", "ind_on_the_job"],
    icon: "Factory",
    bonus: { key: "factory_slots_bonus", value: 3 }
  },

  // ────────────────────────────────────────────
  // COMMERCE BRANCH
  // ────────────────────────────────────────────
  {
    id: "com_broker_licence",
    branch: "commerce",
    name: "Broker's Licence",
    description: "Galactic trade authority certification slashes your market listing fees.",
    effect: "-20% market listing fees",
    tier: 1,
    prereqs: [],
    icon: "Scale",
    bonus: { key: "market_fee_reduction", value: 0.20 }
  },
  {
    id: "com_logistic_xp",
    branch: "commerce",
    name: "Trade Journals",
    description: "Meticulous record-keeping turns every sale into a learning experience.",
    effect: "+20 XP per market trade completed",
    tier: 1,
    prereqs: [],
    icon: "BookOpen",
    bonus: { key: "trade_xp_bonus", value: 20 }
  },
  {
    id: "com_expanded_hold",
    branch: "commerce",
    name: "Expanded Cargo Hold",
    description: "Retrofitted storage bays significantly increase how much you can carry.",
    effect: "+100 cargo capacity",
    tier: 2,
    prereqs: ["com_broker_licence"],
    icon: "Package",
    bonus: { key: "cargo_capacity_bonus", value: 100 }
  },
  {
    id: "com_galactic_trader",
    branch: "commerce",
    name: "Galactic Trader",
    description: "Your name is known at every exchange — double cargo and more XP from every deal.",
    effect: "+150 cargo AND +30 XP per trade",
    tier: 3,
    prereqs: ["com_expanded_hold", "com_logistic_xp"],
    icon: "Globe",
    bonus: { key: "cargo_capacity_bonus", value: 150 }
  },

  // ────────────────────────────────────────────
  // DIPLOMACY BRANCH
  // ────────────────────────────────────────────
  {
    id: "dip_civic_network",
    branch: "diplomacy",
    name: "Civic Network",
    description: "Your community connections earn bonus XP for establishing residency.",
    effect: "+30 XP when claiming residency on a new world",
    tier: 1,
    prereqs: [],
    icon: "Home",
    bonus: { key: "residency_xp_bonus", value: 30 }
  },
  {
    id: "dip_press_pass",
    branch: "diplomacy",
    name: "Press Pass",
    description: "Recognised as a media correspondent — publishing earns more XP.",
    effect: "+20 XP per article published",
    tier: 1,
    prereqs: [],
    icon: "Newspaper",
    bonus: { key: "article_xp_bonus", value: 20 }
  },
  {
    id: "dip_party_organiser",
    branch: "diplomacy",
    name: "Party Organiser",
    description: "Your organisational expertise reduces the SC cost to found a political party.",
    effect: "-25% party founding cost",
    tier: 2,
    prereqs: ["dip_civic_network"],
    icon: "Flag",
    bonus: { key: "party_found_discount", value: 0.25 }
  },
  {
    id: "dip_statesperson",
    branch: "diplomacy",
    name: "Statesperson",
    description: "A career in galactic politics multiplies the XP you earn across all activities.",
    effect: "+5% XP from all sources",
    tier: 3,
    prereqs: ["dip_party_organiser", "dip_press_pass"],
    icon: "Award",
    bonus: { key: "level_xp_bonus", value: 0.05 }
  },

  // ────────────────────────────────────────────
  // COMMAND BRANCH
  // ────────────────────────────────────────────
  {
    id: "cmd_quick_charge",
    branch: "command",
    name: "Quick Charge Cells",
    description: "High-density energy cells accelerate your AP regeneration rate.",
    effect: "+1 AP per regen tick",
    tier: 1,
    prereqs: [],
    icon: "BatteryFull",
    bonus: { key: "ap_regen_bonus", value: 1 }
  },
  {
    id: "cmd_hardened_hull",
    branch: "command",
    name: "Hardened Hull",
    description: "Reinforced alloy plating lets you carry more supplies safely.",
    effect: "+50 cargo capacity",
    tier: 1,
    prereqs: [],
    icon: "Shield",
    bonus: { key: "cargo_capacity_bonus", value: 50 }
  },
  {
    id: "cmd_neural_link",
    branch: "command",
    name: "Neural Combat Link",
    description: "Direct neural interface with your ship's systems improves all reaction times.",
    effect: "+1 AP per regen tick (stacks with Quick Charge)",
    tier: 2,
    prereqs: ["cmd_quick_charge"],
    icon: "Cpu",
    bonus: { key: "ap_regen_bonus", value: 1 }
  },
  {
    id: "cmd_fleet_admiral",
    branch: "command",
    name: "Fleet Admiral",
    description: "Supreme command capability — your AP regenerates significantly faster.",
    effect: "+2 AP per regen tick (stacks with prior skills)",
    tier: 3,
    prereqs: ["cmd_neural_link", "cmd_hardened_hull"],
    icon: "Anchor",
    bonus: { key: "ap_regen_bonus", value: 2 }
  },
];

/** XP rewards table — centralised so they're easy to balance */
export const XP_REWARDS = {
  system_explored:   50,
  body_visited:      10,
  factory_worked:    20,
  factory_built:    100,
  article_published:  30,
  article_upvoted:    5,   // received
  market_trade:       25,
  residency_claimed: 75,
  party_founded:    150,
  level_up:           0,   // level-ups are automatic — no XP reward for them
} as const;

export type XPReason = keyof typeof XP_REWARDS;

/** Compute total bonus from a list of unlocked skill IDs */
export function computeSkillBonus(key: SkillBonusKey, unlockedIds: string[]): number {
  return SKILL_TREE
    .filter(s => unlockedIds.includes(s.id) && s.bonus.key === key)
    .reduce((sum, s) => sum + s.bonus.value, 0);
}
