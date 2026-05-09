import { Step } from "react-joyride";

export const TUTORIAL_STEPS: Record<string, Step[]> = {
  map_main: [
    {
      target: '#floating-logo',
      title: 'Navigation Menu',
      content: 'Access all Hegemony systems, including your Profile, Fleets, Factories, Market, and Neural Uplink (Skills) from this command menu.',
      skipBeacon: true,
    },
    {
      target: '#tour-ap',
      title: 'Action Potential (AP)',
      content: 'This represents your available command bandwidth. FTL jumps, voting, and interacting with factories require AP. It regenerates slowly over time.',
    },
    {
      target: '#tour-sc',
      title: 'Standard Credits (SC)',
      content: 'The primary currency of the Hegemony. Used for purchasing ships, trading on the market, paying factory workers, and establishing residencies.',
    },
    {
      target: '#tour-cargo',
      title: 'Cargo Hold',
      content: 'Your current cargo capacity. Upgrading your ship\'s hull will allow you to carry more resources across systems.',
    },
    {
      target: '#tour-breadcrumbs',
      title: 'Navigation Path',
      content: 'These breadcrumbs show your current location context. Click them to easily zoom back out to the galaxy or system view.',
    },
    {
      target: '.tour-overview-target',
      title: 'Overview Panel',
      content: 'This panel shows detailed information about your current selection. On mobile, tap or swipe it up to view full details. It contains jump controls and scanning tools.',
      placement: 'left',
    },
    {
      target: 'body',
      title: 'Galactic Map',
      content: 'Click on a star system to view its details. If you have enough AP, you can initiate an FTL jump to travel there. Welcome to Starbound Hegemony, Commander.',
      placement: 'center',
    }
  ],
  map_system: [
    {
      target: '.tour-overview-target',
      title: 'System Overview',
      content: 'Welcome to the Star System view. From here you can see all planets, stations, and jump gates in this sector.',
      skipBeacon: true,
      placement: 'left',
    },
    {
      target: 'body',
      title: 'System Bodies',
      content: 'Click on any planet or body to inspect it. Some planets have factories, while others might be ripe for claiming.',
      placement: 'center',
    }
  ],
  map_body: [
    {
      target: '.tour-overview-target',
      title: 'Planetary Operations',
      content: 'You are now viewing a specific celestial body. This panel contains tools to Establish Residency, View Factories, or scan the local environment.',
      skipBeacon: true,
      placement: 'left',
    }
  ],
  profile: [
    {
      target: '.hud-panel',
      title: 'Commander Profile',
      content: 'This is your identity in the Hegemony. Here you can see your level, current ship, active residency, and political affiliation.',
      skipBeacon: true,
      placement: 'center'
    }
  ],
  fleets: [
    {
      target: '.hud-panel',
      title: 'Fleet Command',
      content: 'Manage all your vessels here. You can construct new freighters at shipyards, view their current transit status, or assign them to trade routes.',
      skipBeacon: true,
      placement: 'center'
    }
  ],
  articles: [
    {
      target: 'body',
      title: 'Galactic News Network',
      content: 'Stay updated with the latest happenings across the Hegemony. Articles cover game updates, lore, and political events.',
      skipBeacon: true,
      placement: 'center'
    }
  ],
  market: [
    {
      target: 'body',
      title: 'Global Market',
      content: 'The central hub for galactic trade. Buy and sell resources, ship components, and commodities with other players to amass wealth.',
      skipBeacon: true,
      placement: 'center'
    }
  ],
  factories: [
    {
      target: 'body',
      title: 'Industrial Output',
      content: 'Monitor and manage all your manufacturing facilities across different planetary bodies. Keep them supplied to maximize efficiency.',
      skipBeacon: true,
      placement: 'center'
    }
  ],
  party: [
    {
      target: 'body',
      title: 'Political Parties',
      content: 'Engage in the political sphere of the Hegemony. Form or join a party to run for Governor, propose laws, and shape the laws of your resident planet.',
      skipBeacon: true,
      placement: 'center'
    }
  ],
  skills: [
    {
      target: 'body',
      title: 'Neural Uplink (Skills)',
      content: 'As you earn XP, you can unlock new capabilities here. Specialize in trading, combat, industry, or governance to define your playstyle.',
      skipBeacon: true,
      placement: 'center'
    }
  ],
  wiki: [
    {
      target: 'body',
      title: 'Hegemony Archives',
      content: 'The repository of all known information. Consult the wiki for detailed guides on gameplay mechanics and planetary data.',
      skipBeacon: true,
      placement: 'center'
    }
  ]
};
