import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  Search, 
  Book, 
  ChevronRight, 
  Target, 
  Box, 
  Zap, 
  Shield, 
  Scale, 
  Globe, 
  Briefcase, 
  Database, 
  Map, 
  Activity, 
  Info,
  ExternalLink,
  ChevronDown,
  Building,
  User,
  Coins,
  Hammer,
  Rocket,
  Lock,
  ChevronLeft
} from "lucide-react";

import { PageHeader } from "./PageHeader";

/* ========================================================================
   GALAXY ARCHIVES (WIKI) COMPONENT
   ======================================================================== */

export interface WikiSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string;
  category: string;
  status?: "Live" | "Partial" | "Planned" | "Reference" | "Active";
}

const WIKI_CATEGORIES = [
  "Core Systems",
  "Economy",
  "Infrastructure",
  "Military",
  "Exploration",
  "Politics",
  "Commander",
  "World",
  "Reference"
];

export const WIKI_DATA: WikiSection[] = [
  {
    id: "vision",
    title: "The Vision",
    category: "Core Systems",
    icon: <Globe className="w-4 h-4" />,
    status: "Live",
    content: `
      <p><strong>Starbound Hegemony</strong> is a persistent, browser-based space-opera simulation. It is a world driven entirely by player actions — every ship in the sky, every crate of ore on the market, and every law passed in Congress is the result of a commander's decision.</p>
      <div class="card">
        <h4>Core Gameplay Loop</h4>
        <p>Command your vessel through the Viridian Expanse. Gather resources, refine materials, and construct massive fleet ships. Participate in inter-empire politics, run corporate networks, and fight for control of strategic star systems.</p>
      </div>
      <div class="callout callout-blue">
        <p><strong>Asymmetric Design:</strong> The game is built on the principle of asymmetric goals. A solo miner, a corporate CEO, and an empire general all play the same game but with completely different win conditions and mechanical focuses.</p>
      </div>
    `
  },
  {
    id: "ap-system",
    title: "Action Points (AP)",
    category: "Core Systems",
    icon: <Zap className="w-4 h-4" />,
    status: "Live",
    content: `
      <p>Action Points (AP) are the "time currency" of the galaxy. Almost every significant action — jumping between systems, working a factory shift, or contributing to a battle — consumes AP.</p>
      <table class="wiki-table">
        <thead><tr><th>Metric</th><th>Value</th></tr></thead>
        <tbody>
          <tr><td>Max Capacity</td><td>240 AP</td></tr>
          <tr><td>Regen Rate</td><td>20 AP / Hour</td></tr>
          <tr><td>Full Recharge</td><td>12 Hours</td></tr>
        </tbody>
      </table>
      <div class="callout callout-blue">
        <p><strong>Strategic Tip:</strong> AP is the ultimate bottleneck. A player with 100,000 credits but 0 AP is momentarily powerless. Manage your energy across the day to ensure you can respond to critical events like battles or market shifts.</p>
      </div>
      <h3>Travel Costs</h3>
      <p>Moving between systems via hyperlanes costs AP. The base cost is <strong>10 AP + distance modifier</strong>. This can be reduced through Navigator skills and commander ship upgrades.</p>
    `
  },
  {
    id: "xp-levels",
    title: "XP & Progression",
    category: "Core Systems",
    icon: <Activity className="w-4 h-4" />,
    status: "Live",
    content: `
      <p>Experience (XP) represents your commander's growing influence and neural integration. Gaining XP increases your Level, which unlocks Skill Points and improves your standing in the Hegemony.</p>
      <div class="card">
        <h4>XP Formula</h4>
        <p>Each level requires <code>level × 1,000 XP</code> to advance. Level 2 costs 2,000 XP, Level 3 costs 3,000 XP, and so on. There is no level cap — progression naturally slows as the XP cost scales.</p>
      </div>
      <h3>XP Sources</h3>
      <table class="wiki-table">
        <thead><tr><th>Action</th><th>XP</th></tr></thead>
        <tbody>
          <tr><td>Discover system</td><td>50</td></tr>
          <tr><td>Visit body</td><td>10</td></tr>
          <tr><td>Work factory shift</td><td>20</td></tr>
          <tr><td>Build factory</td><td>100</td></tr>
          <tr><td>Claim citizenship</td><td>75</td></tr>
          <tr><td>Market trade completed</td><td>25</td></tr>
          <tr><td>Article upvoted (received)</td><td>5</td></tr>
        </tbody>
      </table>
    `
  },
  {
    id: "onboarding",
    title: "New Player Onboarding",
    category: "Core Systems",
    icon: <Info className="w-4 h-4" />,
    status: "Planned",
    content: `
      <p>Every new commander begins their journey at the <strong>White Hole system</strong> — the Sanctum's central nexus. PvP is permanently disabled in Sanctum systems, providing a protected environment to learn the basics.</p>
      <div class="card-grid grid-2">
        <div class="card">
          <h4>Starting Conditions</h4>
          <p><strong>1,000 SC</strong> starting credits and <strong>Full AP</strong> pool. You start with a Commander Ship with <strong>5,000 units</strong> of cargo capacity.</p>
        </div>
        <div class="card">
          <h4>Tutorial</h4>
          <p>A guided loop: travel → claim citizenship → work shift → sell on market. Each step grants XP and SC rewards.</p>
        </div>
      </div>
    `
  },
  {
    id: "resources",
    title: "Resource Tiers",
    category: "Economy",
    icon: <Coins className="w-4 h-4" />,
    status: "Live",
    content: `
      <p>The economy is divided into three tiers. Players must progress through these tiers to unlock the most advanced ships and infrastructure.</p>
      <div class="flow">
        <div class="flow-row">
          <div class="flow-node fn-t1">Tier 1: Raw Materials</div>
          <span>→</span>
          <p>Ore, Silicates, Organics, Hydrogen, Water Ice.</p>
        </div>
        <div class="flow-row">
          <div class="flow-node fn-t2">Tier 2: Refined Materials</div>
          <span>→</span>
          <p>Steel Alloy, Glass, Polymers, Plasma Cells, Rare Alloys.</p>
        </div>
        <div class="flow-row">
          <div class="flow-node fn-t3">Tier 3: Advanced Components</div>
          <span>→</span>
          <p>Warp Drives, Quantum Reactors, Neural Arrays, Xenotech Frames.</p>
        </div>
      </div>
      <div class="callout callout-gold">
        <p><strong>Refining:</strong> Tier 2 materials require Tier 1 inputs. Tier 3 components require Tier 2 inputs. This industrial chain creates constant demand for even basic resources.</p>
      </div>
    `
  },
  {
    id: "industry",
    title: "Factories & Production",
    category: "Economy",
    icon: <Briefcase className="w-4 h-4" />,
    status: "Live",
    content: `
      <p>Factories are the engines of the Hegemony. They are permanent personal property — once you build a factory, it is yours forever, even if the system changes hands between empires.</p>
      <div class="card-grid grid-2">
        <div class="card">
          <h4>Factory Treasury</h4>
          <p>Owners must fund their factory treasury. Wages for workers are drawn from here. If the treasury hits zero, the factory stops producing.</p>
        </div>
        <div class="card">
          <h4>Royalty Income</h4>
          <p>Every time a worker completes a shift at your factory, you receive a percentage of the output as a royalty, delivered to your cargo.</p>
        </div>
      </div>
      <h3>Factory Upgrades</h3>
      <table class="wiki-table">
        <thead><tr><th>Upgrade</th><th>Effect</th><th>Cost</th></tr></thead>
        <tbody>
          <tr><td>Tier Upgrade</td><td>Unlocks T2/T3 production</td><td>SC + T2 Materials</td></tr>
          <tr><td>Storage Silo</td><td>Increases factory storage capacity</td><td>SC + Steel Alloy</td></tr>
          <tr><td>Expansion</td><td>Increases maximum job slots</td><td>SC + Polymers</td></tr>
        </tbody>
      </table>
    `
  },
  {
    id: "commerce",
    title: "Global Market",
    category: "Economy",
    icon: <Box className="w-4 h-4" />,
    status: "Live",
    content: `
      <p>The Global Market is a unified interstellar exchange. Players can post buy and sell orders from any location in the galaxy.</p>
      <div class="card-grid grid-2">
        <div class="card">
          <h4>Player Market</h4>
          <p>Fully player-driven order book. 2% transaction fee flows to the controlling empire's treasury.</p>
        </div>
        <div class="card">
          <h4>NPC Liquidation</h4>
          <p>Instant sell to NPC at 65% of current price. Instant buy from NPC at 185% price. Guaranteed liquidity at a premium.</p>
        </div>
      </div>
      <h3>Market Conditions</h3>
      <table class="wiki-table">
        <thead><tr><th>Status</th><th>Multiplier</th><th>Cause</th></tr></thead>
        <tbody>
          <tr><td>Boom</td><td>×1.25</td><td>High demand, low supply</td></tr>
          <tr><td>Stable</td><td>×1.00</td><td>Normal conditions</td></tr>
          <tr><td>Recession</td><td>×0.85</td><td>Oversupply</td></tr>
          <tr><td>Blockaded</td><td>×0.50</td><td>Military action (NPC offline)</td></tr>
        </tbody>
      </table>
    `
  },
  {
    id: "station-market",
    title: "Station Market",
    category: "Economy",
    icon: <Building className="w-4 h-4" />,
    status: "Planned",
    content: `
      <p>Unlike the Global Market, the Station Market is location-bound. You must be physically docked at a Space Station to use its local trading floor.</p>
      <div class="callout callout-blue">
        <p><strong>Physical Hubs:</strong> Station markets have their own independent order books and prices. Station owners earn a custom cut of every trade, making stations strategic economic prizes.</p>
      </div>
    `
  },
  {
    id: "corporations",
    title: "Corporations",
    category: "Economy",
    icon: <Coins className="w-4 h-4" />,
    status: "Planned",
    content: `
      <p>Corporations are purely economic entities that can operate across empire borders. They have industrial scale that solo players cannot match.</p>
      <div class="card-grid grid-2">
        <div class="card">
          <h4>Multi-Ownership</h4>
          <p>Corps can own up to 3 factories of the same type on one body (solo limit: 1). This enables massive extraction operations.</p>
        </div>
        <div class="card">
          <h4>Bounty Board</h4>
          <p>Corps can post "Delivery Contracts". Any player can fulfill these to earn SC from the corp treasury.</p>
        </div>
      </div>
    `
  },
  {
    id: "player-infra",
    title: "Personal Infrastructure",
    category: "Infrastructure",
    icon: <Hammer className="w-4 h-4" />,
    status: "Live",
    content: `
      <p>Infrastructure buildings enable storage, construction, and advanced logistics. They remain your personal property forever.</p>
      <div class="card">
        <h4>Resource Silo</h4>
        <p>Essential for T3 production. Allows bulk storage of thousands of units of resources, bypassing ship cargo limits.</p>
        <table class="wiki-table">
          <thead><tr><th>Tier</th><th>Capacity</th><th>Cost</th></tr></thead>
          <tbody>
            <tr><td>T1</td><td>5,000 Units</td><td>2k SC + T1 Mats</td></tr>
            <tr><td>T2</td><td>20,000 Units</td><td>5k SC + T2 Mats</td></tr>
            <tr><td>T3</td><td>75,000 Units</td><td>15k SC + T3 Mats</td></tr>
          </tbody>
        </table>
      </div>
      <div class="card">
        <h4>Shipyard & Drydock</h4>
        <p>Shipyards are the exclusive construction sites for specialized vessels like <strong>Science Ships</strong> and <strong>Cargo Freighters</strong>. Drydocks enable fleet storage and provide passive hull regeneration for your persistent fleet.</p>
      </div>
    `
  },
  {
    id: "state-infra",
    title: "State Infrastructure",
    category: "Infrastructure",
    icon: <Building className="w-4 h-4" />,
    status: "Planned",
    content: `
      <p>State buildings are funded by the empire treasury and benefit all players in the territory. Unlike personal buildings, <strong>state infrastructure transfers to the conqueror</strong> upon successful invasion.</p>
      <div class="card-grid grid-2">
        <div class="card">
          <h4>Orbital Defense</h4>
          <p>Auto-contributes combat points to defenders during the Orbital stage of a battle.</p>
        </div>
        <div class="card">
          <h4>Planetary Fortress</h4>
          <p>Provides massive defensive bonuses during the Ground stage of a battle.</p>
        </div>
        <div class="card">
          <h4>Imperial Shipyard</h4>
          <p>Mass-produces cheap "Empire Corvettes" and massive "Dreadnoughts" for the state military.</p>
        </div>
        <div class="card">
          <h4>Starport</h4>
          <p>Reduces travel AP costs for all allies arriving at the body.</p>
        </div>
      </div>
    `
  },
  {
    id: "fleet-ships",
    title: "Fleet Ships",
    category: "Military",
    icon: <Rocket className="w-4 h-4" />,
    status: "Live",
    content: `
      <p>Fleet ships are persistent entities. If they are destroyed in battle, they are gone forever. They are the primary sink for the T3 component economy.</p>
      <h3>Warships</h3>
      <table class="wiki-table">
        <thead><tr><th>Class</th><th>Build Time</th><th>AP Multiplier</th></tr></thead>
        <tbody>
          <tr><td>Corvette</td><td>24h</td><td>+20%</td></tr>
          <tr><td>Destroyer</td><td>48h</td><td>+50%</td></tr>
          <tr><td>Battlecruiser</td><td>96h</td><td>+100%</td></tr>
        </tbody>
      </table>
      <div class="callout callout-red">
        <p><strong>Note:</strong> Battlecruisers are Orbital-only. They cannot participate in Aerial or Ground stages.</p>
      </div>
      <h3>Logistics & Science</h3>
      <div class="card-grid grid-2">
        <div class="card">
          <h4>Freighters</h4>
          <p>Massive cargo capacity. Built at personal <strong>Shipyards</strong>, these enable automated trade routes and bulk logistics between star systems.</p>
        </div>
        <div class="card">
          <h4>Science Vessels</h4>
          <p>The only ships capable of surveying <strong>Sites of Interest</strong>. They use specialized sensors to extract knowledge, resources, and rare artifacts.</p>
        </div>
      </div>
    `
  },
  {
    id: "combat",
    title: "Conquest Battles",
    category: "Military",
    icon: <Shield className="w-4 h-4" />,
    status: "Planned",
    content: `
      <p>Conquest is the mechanism for territorial expansion. Battles are scheduled events with a 12-hour mobilization window.</p>
      <div class="stages">
        <div class="stage-box s-orbital">
          <div class="stage-num">Stage 1</div>
          <div class="stage-name">Orbital</div>
          <p>Space superiority. All warships multipliers active. Defense platforms contribute.</p>
        </div>
        <div class="stage-box s-aerial">
          <div class="stage-num">Stage 2</div>
          <div class="stage-name">Aerial</div>
          <p>Atmospheric control. Battlecruisers inactive. Ground troops begin contributing.</p>
        </div>
        <div class="stage-box s-ground">
          <div class="stage-num">Stage 3</div>
          <div class="stage-name">Ground</div>
          <p>Surface occupation. No ship multipliers. Pure AP + Troops. Defenders get +25% home turf bonus.</p>
        </div>
      </div>
      <div class="callout callout-gold">
        <p><strong>Win Condition:</strong> The attacker must win ALL THREE stages to take the body. The defender only needs to hold ONE stage to repel the invasion.</p>
      </div>
    `
  },
  {
    id: "rebellion",
    title: "Rebellion",
    category: "Military",
    icon: <Activity className="w-4 h-4" />,
    status: "Planned",
    content: `
      <p>Rebellion allows citizens to overthrow an empire. A successful rebellion flips the body to <strong>Unclaimed</strong> and destroys all state infrastructure.</p>
      <div class="card">
        <h4>Triggering</h4>
        <p>Requires 40% of the body's citizens to sign the rebellion within a 24-hour window. Each signature requires a 2,000 SC commitment.</p>
      </div>
      <p>Rebellion battles are "Flash Battles" — 30-minute stages with total cumulative scoring deciding the winner.</p>
    `
  },
  {
    id: "citizenship",
    title: "Citizenship",
    category: "Politics",
    icon: <User className="w-4 h-4" />,
    status: "Partial",
    content: `
      <p>Citizenship is your political anchor. You can be a citizen of exactly one body at a time. It grants you the right to vote in that body's elections and sign rebellions against its controllers.</p>
      <div class="callout callout-gold">
        <p><strong>Residency:</strong> Conquering empires cannot remove existing citizens. Hostile populations must be managed through policy or they will eventually revolt.</p>
      </div>
    `
  },
  {
    id: "empire-system",
    title: "Empire & Treasury",
    category: "Politics",
    icon: <Lock className="w-4 h-4" />,
    status: "Partial",
    content: `
      <p>Empires are the top-level political entities. They collect taxes from all factories and market fees from all trades within their borders.</p>
      <div class="card-grid grid-3">
        <div class="card">
          <h4>Market Fees</h4>
          <p>2% of all sales flow to the treasury. The lifeblood of the state.</p>
        </div>
        <div class="card">
          <h4>Factory Tax</h4>
          <p>Wage taxes set per-body. Workers pay this on every shift.</p>
        </div>
        <div class="card">
          <h4>Donations</h4>
          <p>Wealthy members can donate SC directly to fund state projects.</p>
        </div>
      </div>
    `
  },
  {
    id: "government",
    title: "Government Types",
    category: "Politics",
    icon: <Scale className="w-4 h-4" />,
    status: "Planned",
    content: `
      <p>The government type determines how power is distributed. Congress can vote to change the empire's government type through the law system.</p>
      <div class="gov-grid">
        <div class="gov-card">
          <div class="gov-name" style="color: #60a5fa">Democracy</div>
          <p>Elections every 30 days. Broadest participation. Most susceptible to populism.</p>
          <div class="gov-tag" style="background:rgba(59,130,246,.1);color:#93c5fd;border:1px solid rgba(59,130,246,.3)">Elections 30d</div>
        </div>
        <div class="gov-card">
          <div class="gov-name" style="color: #34d399">Republic</div>
          <p>Elections every 60 days. Parties require 5+ members. High stability.</p>
          <div class="gov-tag" style="background:rgba(16,185,129,.1);color:#6ee7b7;border:1px solid rgba(16,185,129,.3)">Elections 60d</div>
        </div>
        <div class="gov-card">
          <div class="gov-name" style="color: #fcd34d">Oligarchy</div>
          <p>No elections. Congress seats are purchased from the treasury. Wealth dominates.</p>
          <div class="gov-tag" style="background:rgba(245,158,11,.1);color:#fcd34d;border:1px solid rgba(245,158,11,.3)">Wealth Weighted</div>
        </div>
        <div class="gov-card">
          <div class="gov-name" style="color: #f87171">Dictatorship</div>
          <p>No Congress. Head of State has absolute power. Maximum rebellion risk.</p>
          <div class="gov-tag" style="background:rgba(239,68,68,.1);color:#fca5a5;border:1px solid rgba(239,68,68,.3)">Absolute Power</div>
        </div>
      </div>
    `
  },
  {
    id: "elections",
    title: "Elections & Congress",
    category: "Politics",
    icon: <Activity className="w-4 h-4" />,
    status: "Planned",
    content: `
      <p>Elections use proportional representation. Seats are distributed to parties based on their share of the total vote.</p>
      <div class="card">
        <h4>The Process</h4>
        <p>1. Citizens vote for parties. 2. Seats assigned to party members. 3. Congress elects a Head of State. 4. HoS appoints Ministers.</p>
      </div>
      <p>Parties are founded on specific bodies, giving them geographic roots and local interest groups to satisfy.</p>
    `
  },
  {
    id: "laws",
    title: "Laws & Taxation",
    category: "Politics",
    icon: <Scale className="w-4 h-4" />,
    status: "Planned",
    content: `
      <p>Laws are the primary tool of governance. They are proposed by Congress and debated for 48 hours before a vote.</p>
      <div class="card">
        <h4>Per-Body Taxation</h4>
        <p>Tax rates (0-15%) are set individually for each body. A high-yield body can be taxed more to fund state defenses for that system.</p>
      </div>
      <div class="callout callout-blue">
        <p><strong>Delay:</strong> All passed laws have a 48-hour implementation delay. This gives citizens time to react, protest, or prepare for rebellion.</p>
      </div>
    `
  },
  {
    id: "diplomacy",
    title: "Diplomacy",
    category: "Politics",
    icon: <Globe className="w-4 h-4" />,
    status: "Planned",
    content: `
      <p>Formal relationships between empires require bilateral law passing. Both empires must pass matching laws to formalize an alliance.</p>
      <div class="card-grid grid-2">
        <div class="card">
          <h4>Alliance</h4>
          <p>Matching laws. Allies get +10% combat bonus when fighting together.</p>
        </div>
        <div class="card">
          <h4>Sworn Enemy</h4>
          <p>Unilateral declaration. Members get +15% combat bonus when fighting the enemy.</p>
        </div>
      </div>
    `
  },
  {
    id: "commander-ship",
    title: "Commander Ship",
    category: "Commander",
    icon: <Rocket className="w-4 h-4" />,
    status: "Live",
    content: `
      <p>Your flagship is your persistent presence in the galaxy. It cannot be destroyed. It is the platform for all your travel and industrial actions.</p>
      <div class="card">
        <h4>Customisation</h4>
        <p>Modular slots for Hull, Wings, Engines, and Bridge. Support for primary paint and energy glow colors.</p>
      </div>
      <h3>Functional Upgrades</h3>
      <table class="wiki-table">
        <thead><tr><th>Upgrade</th><th>Effect</th><th>Cost</th></tr></thead>
        <tbody>
          <tr><td>Expanded Hold III</td><td>+2,000 Cargo</td><td>Planned Upgrade</td></tr>
          <tr><td>Fleet Beacon II</td><td>+20% Combat for fleet</td><td>Planned Upgrade</td></tr>
          <tr><td>Warp Efficiency II</td><td>-25% Travel AP</td><td>Planned Upgrade</td></tr>
        </tbody>
      </table>
    `
  },
  {
    id: "skills",
    title: "Skill Tree",
    category: "Commander",
    icon: <Zap className="w-4 h-4" />,
    status: "Live",
    content: `
      <p>Each level-up grants one Skill Point. Spend them to specialize in one of five branches.</p>
      <div class="card-grid grid-3">
        <div class="card">
          <h4>Navigation</h4>
          <p>Reduces jump costs, increases exploration XP, and extends sensor range.</p>
        </div>
        <div class="card">
          <h4>Industry</h4>
          <p>Improves factory shift rewards, construction efficiency, and job slots.</p>
        </div>
        <div class="card">
          <h4>Commerce</h4>
          <p>Reduces market fees and significantly increases cargo capacity.</p>
        </div>
        <div class="card">
          <h4>Diplomacy</h4>
          <p>Increases XP from article upvotes, residency, and party founding.</p>
        </div>
        <div class="card">
          <h4>Command</h4>
          <p>Increases AP regeneration rate and flagship hull integrity.</p>
        </div>
      </div>
    `
  },
  {
    id: "missions",
    title: "Daily & Weekly Missions",
    category: "Commander",
    icon: <Target className="w-4 h-4" />,
    status: "Planned",
    content: `
      <p>Missions provide a structured way to earn bonus XP and Requisition Crates. They refresh on a daily and weekly cycle.</p>
      <div class="callout callout-green">
        <p><strong>7/10 Rule:</strong> Completing 7 out of 10 missions in a pool triggers a massive bonus XP reward and a crate bundle.</p>
      </div>
      <p>Missions are drawn from your normal playstyle: mining, trading, fighting, and exploring.</p>
    `
  },
  {
    id: "crates",
    title: "Requisition Crates",
    category: "Commander",
    icon: <Box className="w-4 h-4" />,
    status: "Planned",
    content: `
      <p>Crates are loot containers earned through gameplay. They contain XP, SC, Resources, and temporary Buffs.</p>
      <table class="wiki-table">
        <thead><tr><th>Tier</th><th>Rarity</th><th>Colour</th></tr></thead>
        <tbody>
          <tr><td>Common</td><td>Standard</td><td>Grey</td></tr>
          <tr><td>Rare</td><td>Rare</td><td>Blue</td></tr>
          <tr><td>Epic</td><td>Exotic</td><td>Purple</td></tr>
          <tr><td>Legendary</td><td>Artifact</td><td>Gold</td></tr>
        </tbody>
      </table>
      <div class="card">
        <h4>Timed Buffs</h4>
        <p>Open a crate to find 24h buffs like "Production Surge" (+25% shift yield) or "Warp Overdrive" (-20% jump cost).</p>
      </div>
    `
  },
  {
    id: "void-tokens",
    title: "Void Tokens (VT)",
    category: "Commander",
    icon: <Coins className="w-4 h-4" />,
    status: "Planned",
    content: `
      <p>Void Tokens are a premium currency designed for convenience and visual flair. <strong>Zero pay-to-win.</strong> VT cannot buy combat power or resource yield.</p>
      <div class="card">
        <h4>Uses for VT</h4>
        <p>• Premium ship parts and liveries.<br/>• Consolidated Factory Dashboard.<br/>• Market Watch alerts.<br/>• Extended Commander's Log history.</p>
      </div>
    `
  },
  {
    id: "incursions",
    title: "Incursion Zones",
    category: "Exploration",
    icon: <Shield className="w-4 h-4" />,
    status: "Live",
    content: `
      <p>Incursion Zones are unstable regions where the fabric of space-time is frayed. These zones are identified by a <strong>Shield Alert</strong> icon on the stellar navigation map and represent specialized regional hazards.</p>
      
      <div class="card-grid grid-2">
        <div class="card">
          <h4>Nebulas</h4>
          <p>Densed ionized gas clouds that generate dimensional drag. <strong>Warp Speed is reduced by 35-50%</strong> while transiting or jumping from these systems.</p>
        </div>
        <div class="card">
          <h4>Dust Clouds</h4>
          <p>Thick particulate matter that absorbs sensor sweeps. <strong>Sensor Range is reduced to 1 jump</strong> (effectively blinding long-range scans).</p>
        </div>
        <div class="card">
          <h4>Ion Storms</h4>
          <p>Violent electromagnetic disturbances that scatter neural links. <strong>AP costs for local actions are increased</strong> due to interference.</p>
        </div>
        <div class="card">
          <h4>Gravity Rifts</h4>
          <p>Intense gravitational wells that warp subspace. <strong>AP cost to jump OUT of these systems is increased by 50%</strong>.</p>
        </div>
      </div>

      <div class="callout callout-red">
        <p><strong>Environmental Hazards:</strong> Navigating these zones requires specialized ship configurations or increased operational budgets to compensate for the efficiency losses.</p>
      </div>
    `
  },
  {
    id: "soi",
    title: "Sites of Interest (SoI)",
    category: "Exploration",
    icon: <Target className="w-4 h-4" />,
    status: "Planned",
    content: `
      <p>Sites of Interest (SoIs) are high-value tactical and archaeological locations that randomly spawn across the Viridian Expanse. They represent the primary source of "Deep Space" rewards.</p>
      <div class="card-grid grid-2">
        <div class="card">
          <h4>Rarity & Difficulty</h4>
          <p>Sites vary from Common to Legendary. Harder sites take significantly more time to complete but offer vastly superior loot pools.</p>
        </div>
        <div class="card">
          <h4>Extraction</h4>
          <p>Surveying a site requires a <strong>Science Ship</strong>. Sending a vessel to a site starts a completion timer; once finished, the rewards are delivered to the owner.</p>
        </div>
      </div>
      <h3>Potential Rewards</h3>
      <ul class="wiki-list">
        <li><strong>Credits (SC):</strong> Massive knowledge data-dumps sold to the Hegemony.</li>
        <li><strong>T3 Resources:</strong> Direct extraction of exotic materials.</li>
        <li><strong>Void Tokens:</strong> Rare premium currency found in ancient vaults.</li>
        <li><strong>Skill Points:</strong> Direct neural integration spikes.</li>
        <li><strong>Ship Parts:</strong> Unique blueprints for your Commander Flagship.</li>
      </ul>
    `
  },
  {
    id: "star-types",
    title: "Star Types",
    category: "World",
    icon: <Zap className="w-4 h-4" />,
    status: "Planned",
    content: `
      <p>The system star applies passive modifiers to every body in the system.</p>
      <table class="wiki-table">
        <thead><tr><th>Star Type</th><th>Economic Effect</th><th>Military Effect</th></tr></thead>
        <tbody>
          <tr><td>G-Class</td><td>None (Baseline)</td><td>None</td></tr>
          <tr><td>B-Class</td><td>+20% Market Prices</td><td>+10% Combat Points</td></tr>
          <tr><td>O-Class</td><td>+30% Market Prices</td><td>+15% Combat, +20% Hull Damage</td></tr>
          <tr><td>Black Hole</td><td>Exotic Matter Deposits</td><td>No Docking Possible</td></tr>
          <tr><td>Dyson Swarm</td><td>+50% Factory Yield</td><td>None</td></tr>
        </tbody>
      </table>
    `
  },
  {
    id: "body-types",
    title: "Body Types",
    category: "World",
    icon: <Globe className="w-4 h-4" />,
    status: "Live",
    content: `
      <p>Planets and stations have fixed types that determine their potential for industry and construction.</p>
      <table class="wiki-table">
        <thead><tr><th>Type</th><th>Resources</th><th>Shipyard Eligible</th></tr></thead>
        <tbody>
          <tr><td>Terrestrial</td><td>Ore, Silicates, Organics</td><td>Yes</td></tr>
          <tr><td>Gas Giant</td><td>Hydrogen, Helium-3</td><td>No</td></tr>
          <tr><td>Moon</td><td>Ice, Silicates</td><td>No</td></tr>
          <tr><td>Asteroid</td><td>Rare Earths, Crystals</td><td>No</td></tr>
          <tr><td>Station</td><td>Varies</td><td>Yes</td></tr>
        </tbody>
      </table>
    `
  },
  {
    id: "db-schema",
    title: "Database Reference",
    category: "Reference",
    icon: <Database className="w-4 h-4" />,
    status: "Reference",
    content: `
      <p>Technical reference for the Hegemony persistent state. All tables are hosted in a unified Supabase instance.</p>
      <div class="code-block">
<span class="cm">-- Core infrastructure</span>
infrastructure  <span class="ck">id</span>, body_id, type, owner_id
fleet_ships     <span class="ck">id</span>, class, hull, status, location

<span class="cm">-- Military & Politics</span>
battles         <span class="ck">id</span>, target_body, status, winner
empires         <span class="ck">id</span>, name, treasury, government
laws            <span class="ck">id</span>, type, passed, takes_effect_at</div>
    `
  },
  {
    id: "roadmap",
    title: "Build Roadmap",
    category: "Reference",
    icon: <Map className="w-4 h-4" />,
    status: "Active",
    content: `
      <p>Current development status for the Viridian Expanse.</p>
      <table class="wiki-table">
        <thead><tr><th>Phase</th><th>Focus</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>1-3</td><td>Economic Loop & Markets</td><td>✅ Complete</td></tr>
          <tr><td>4-8</td><td>Logistics & Ships</td><td>✅ Complete</td></tr>
          <tr><td>9-15</td><td>Politics & Conquest</td><td>🔄 In Progress</td></tr>
          <tr><td>16+</td><td>Corps & Deep Space</td><td>⬜ Future</td></tr>
        </tbody>
      </table>
    `
  }
];


export function WikiView({ app, onBack }: { app: any; onBack?: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const activeSection = useMemo(() => 
    WIKI_DATA.find(s => s.id === app.wikiSectionId) || WIKI_DATA[0]
  , [app.wikiSectionId]);

  const filteredSections = useMemo(() => {
    if (!searchQuery) return WIKI_DATA;
    return WIKI_DATA.filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const sectionsByCategory = useMemo(() => {
    const grouped: Record<string, WikiSection[]> = {};
    WIKI_CATEGORIES.forEach(cat => {
      grouped[cat] = filteredSections.filter(s => s.category === cat);
    });
    return grouped;
  }, [filteredSections]);

  useEffect(() => {
    // Reset to top of content when section changes
    const mainEl = document.getElementById("wiki-content-area");
    if (mainEl) mainEl.scrollTop = 0;
    // On mobile, close sidebar after selection
    if (window.innerWidth < 1024) {
      setIsMobileSidebarOpen(false);
    }
  }, [app.wikiSectionId]);

  // Handle internal wiki links
  useEffect(() => {
    const handleWikiLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor && anchor.hash && anchor.hash.startsWith("#")) {
        const id = anchor.hash.substring(1);
        if (WIKI_DATA.some(s => s.id === id)) {
          e.preventDefault();
          app.setWikiSectionId(id);
        }
      }
    };

    const contentArea = document.getElementById("wiki-content-area");
    contentArea?.addEventListener("click", handleWikiLinkClick);
    return () => contentArea?.removeEventListener("click", handleWikiLinkClick);
  }, []);

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-primary/10 bg-primary/5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Search archives..."
            className="w-full bg-background/50 border border-primary/30 rounded pl-10 pr-4 py-2 font-mono-hud text-[10px] focus:outline-none focus:border-primary transition-colors hover:bg-primary/5"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
        {Object.entries(sectionsByCategory).map(([cat, sections]) => {
          if (sections.length === 0) return null;

          return (
            <div key={cat} className="space-y-2">
              <h3 className="font-display text-[9px] text-primary/60 uppercase tracking-widest border-l-2 border-primary/20 pl-2">{cat}</h3>
              <div className="space-y-1">
                {sections.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      app.setWikiSectionId(s.id);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left group transition-all ${
                      app.wikiSectionId === s.id 
                        ? "bg-primary/20 text-primary border border-primary/30 shadow-[inset_0_0_10px_rgba(var(--primary-rgb),0.1)]" 
                        : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
                    }`}
                  >
                    <span className={`shrink-0 ${app.wikiSectionId === s.id ? "text-primary" : "text-primary/40 group-hover:text-primary/60"}`}>
                      {s.icon}
                    </span>
                    <span className="font-display text-[11px] uppercase tracking-wider truncate">{s.title}</span>
                    {s.status === "Planned" && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary/20 border border-primary/30" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background relative">
      {/* Sidebar Backdrop and Sidebar for mobile - Portalled to body to cover everything including TopBar */}
      {typeof document !== "undefined" && createPortal(
        <div className={`lg:hidden fixed inset-0 z-[200] pointer-events-none ${isMobileSidebarOpen ? "pointer-events-auto" : ""}`}>
          {isMobileSidebarOpen && (
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          )}

          {/* Mobile Sidebar - absolute inset-y-0 within fixed portal covers full page height */}
          <aside className={`
            absolute inset-y-0 left-0 w-[280px] bg-background border-r border-primary/20 flex flex-col
            transition-transform duration-300 ease-in-out z-[210] pointer-events-auto shadow-[0_0_50px_rgba(0,0,0,0.5)]
            ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}>
            {sidebarContent}
          </aside>
        </div>,
        document.body
      )}
      {/* Styles integration */}
      <style>{`
        .wiki-content p { margin-bottom: 1rem; line-height: 1.6; color: #a1a1aa; }
        .wiki-content p strong { color: #fff; }
        .wiki-content h3 { font-family: 'Orbitron', sans-serif; font-size: 11px; font-weight: 700; color: #3b82f6; text-transform: uppercase; margin-top: 2rem; margin-bottom: 0.75rem; letter-spacing: 0.15em; }
        .wiki-content h4 { font-family: 'Orbitron', sans-serif; font-size: 10px; font-weight: 600; color: #e2e8f0; margin-top: 1.5rem; margin-bottom: 0.5rem; }
        .wiki-content .card { background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem; }
        .wiki-content .card h4 { font-size: 10px; font-weight: 700; color: #60a5fa; text-transform: uppercase; margin-top: 0; margin-bottom: 0.75rem; letter-spacing: 0.1em; }
        .wiki-content .card-grid { display: grid; gap: 1rem; margin-bottom: 1rem; }
        .wiki-content .grid-2 { grid-template-columns: 1fr 1fr; }
        .wiki-content .grid-3 { grid-template-columns: 1fr 1fr 1fr; }
        .wiki-content .grid-4 { grid-template-columns: repeat(4, 1fr); }
        .wiki-content .callout { padding: 1rem; border-left: 4px solid; border-radius: 4px; margin-bottom: 1.5rem; font-size: 0.875rem; }
        .wiki-content .callout-blue { background: rgba(59, 130, 246, 0.1); border-color: #3b82f6; }
        .wiki-content .callout-gold { background: rgba(245, 158, 11, 0.1); border-color: #f59e0b; }
        .wiki-content .callout-red { background: rgba(239, 68, 68, 0.1); border-color: #ef4444; }
        .wiki-content .callout-purple { background: rgba(168, 85, 247, 0.1); border-color: #a855f7; }
        .wiki-content .callout-green { background: rgba(34, 197, 94, 0.1); border-color: #22c55e; }
        .wiki-content .wiki-table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; font-size: 0.75rem; }
        .wiki-content .wiki-table th { text-align: left; background: rgba(30, 41, 59, 0.5); padding: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .wiki-content .wiki-table td { padding: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.05); color: #e2e8f0; vertical-align: top; }
        .wiki-content .wiki-table td:first-child { color: #fff; font-weight: 600; }
        .wiki-content .flow { background: rgba(0,0,0,0.2); padding: 1.25rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 1.5rem; }
        .wiki-content .flow-row { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem; }
        .wiki-content .flow-node { padding: 0.4rem 0.75rem; border-radius: 4px; font-family: monospace; font-size: 10px; min-width: 150px; text-align: center; }
        .wiki-content .fn-t1 { background: #475569; color: #fff; border: 1px solid rgba(255,255,255,0.1); }
        .wiki-content .fn-t2 { background: #1e40af; color: #fff; border: 1px solid rgba(255,255,255,0.1); }
        .wiki-content .fn-t3 { background: #92400e; color: #fff; border: 1px solid rgba(255,255,255,0.1); }
        .wiki-content .badge { display: inline-block; padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; margin-right: 0.25rem; }
        .wiki-content .b-t1 { background: rgba(71, 85, 105, 0.3); border: 1px solid #475569; color: #cbd5e1; }
        .wiki-content .b-t2 { background: rgba(59, 130, 246, 0.2); border: 1px solid #3b82f6; color: #93c5fd; }
        .wiki-content .b-t3 { background: rgba(245, 158, 11, 0.2); border: 1px solid #f59e0b; color: #fcd34d; }
        .wiki-content .gov-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin: 1.5rem 0; }
        .wiki-content .gov-card { background: rgba(30, 41, 59, 0.3); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
        .wiki-content .gov-name { font-family: 'Orbitron', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 0.05em; }
        .wiki-content .gov-tag { font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; padding: 0.4rem 0.75rem; border-radius: 6px; }
        .wiki-content .stages { display: flex; gap: 1rem; margin: 1.5rem 0; flex-wrap: wrap; }
        .wiki-content .stage-box { flex: 1; min-width: 200px; padding: 1.25rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); }
        .wiki-content .stage-num { font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.4); text-transform: uppercase; margin-bottom: 0.25rem; }
        .wiki-content .stage-name { font-family: 'Orbitron', sans-serif; font-size: 13px; font-weight: 700; margin-bottom: 0.75rem; color: #fff; }
        .wiki-content .s-orbital { background: rgba(59, 130, 246, 0.05); border-color: rgba(59, 130, 246, 0.2); }
        .wiki-content .s-aerial { background: rgba(168, 85, 247, 0.05); border-color: rgba(168, 85, 247, 0.2); }
        .wiki-content .s-ground { background: rgba(34, 197, 94, 0.05); border-color: rgba(34, 197, 94, 0.2); }
        .wiki-content .code-block { font-family: monospace; background: #040810; padding: 1.25rem; border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.2); color: #7dd3fc; font-size: 11px; overflow-x: auto; white-space: pre; }
        .wiki-content .ck { color: #f472b6; font-weight: 700; }
        .wiki-content .cv { color: #facc15; }
        .wiki-content .cm { color: #94a3b8; font-style: italic; }
        .wiki-content .formula { font-family: monospace; color: #34d399; background: rgba(0,0,0,0.3); padding: 0.75rem; border-radius: 4px; border: 1px solid rgba(52, 211, 153, 0.2); margin: 0.5rem 0; white-space: pre-wrap; font-size: 10px; }
      `}</style>

      <PageHeader 
        title="Galaxy Archives"
        subtitle="Hegemony Knowledge Base & Universal Reference"
        icon={<Book className="w-5 h-5 text-primary" />}
        onBack={onBack || (() => app?.setPage("map"))}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Tab Trigger */}
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="lg:hidden fixed left-0 top-1/2 -translate-y-1/2 z-[45] bg-primary/20 backdrop-blur-md border border-l-0 border-primary/30 p-2 rounded-r-xl text-primary hover:bg-primary/30 transition-all flex flex-col items-center gap-1 shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]"
        >
          <Book className="w-4 h-4" />
          <span className="[writing-mode:vertical-lr] text-[8px] font-mono-hud uppercase tracking-widest mt-1">Archive Index</span>
          <ChevronRight className="w-4 h-4 mt-1" />
        </button>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex relative z-10 bg-background/20 backdrop-blur-none border-r border-primary/20 flex flex-col w-[280px] shrink-0">
          {sidebarContent}
        </aside>

        {/* Main Content Area */}
        <main id="wiki-content-area" className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
          <div className="max-w-4xl mx-auto px-6 lg:px-12 py-10">
            <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-primary/20 pb-8 relative">
              <div className="absolute -bottom-px left-0 w-32 h-0.5 bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary font-mono-hud text-[8px] uppercase tracking-tighter">
                    {activeSection.category}
                  </span>
                  {activeSection.status && (
                    <span className={`
                      px-2 py-0.5 rounded border font-mono-hud text-[8px] uppercase tracking-tighter
                      ${activeSection.status === "Live" ? "bg-success/10 border-success/30 text-success" : 
                        activeSection.status === "Active" ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" :
                        activeSection.status === "Reference" ? "bg-purple-500/10 border-purple-500/30 text-purple-400" :
                        "bg-primary/5 border-primary/20 text-primary/40"}
                    `}>
                      Status: {activeSection.status}
                    </span>
                  )}
                </div>
                <h1 className="font-display text-3xl sm:text-4xl text-foreground text-glow uppercase tracking-[0.1em]">{activeSection.title}</h1>
              </div>
              <div className="flex items-center gap-2 text-primary/40 text-[10px] font-mono-hud uppercase">
                <Shield className="w-3 h-3" />
                <span>Verified Archive Node 07-X</span>
              </div>
            </div>

            <div 
              className="wiki-content animate-in fade-in slide-in-from-bottom-4 duration-500"
              dangerouslySetInnerHTML={{ __html: activeSection.content }}
            />

            <div className="mt-20 pt-8 border-t border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-6 opacity-40 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/5 border border-primary/10">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="font-display text-[10px] text-primary uppercase tracking-widest">End of Entry</span>
                  <span className="font-mono-hud text-[8px] text-muted-foreground uppercase">Reference ID: ARCH-{activeSection.id.toUpperCase()}</span>
                </div>
              </div>
              <button 
                onClick={() => document.getElementById("wiki-content-area")?.scrollTo({ top: 0, behavior: 'smooth' })}
                className="font-mono-hud text-[10px] text-primary hover:text-white uppercase tracking-widest flex items-center gap-2 group"
              >
                Top of Record <ChevronRight className="w-3 h-3 rotate-[-90deg] group-hover:translate-y-[-2px] transition-transform" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
