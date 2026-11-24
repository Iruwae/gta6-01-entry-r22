export const MISSIONS = [
  {
    id: 'first-errand',
    title: 'FIRST ERRAND',
    giver: 'LENA CRUZ',
    brief: 'Vic left a Comet at the garage. Drive it to the Coral Keys pier. Don’t scratch it. Don’t attract the law.',
    reward: 800,
    rp: 40,
    stages: [
      { id: 'pickup', text: 'Pick up the Comet at Lena’s Garage', type: 'enter', vehicle: 'comet' },
      { id: 'deliver', text: 'Deliver the Comet to the Coral Keys pier', type: 'reach', marker: 'coral-pier' },
    ],
  },
  {
    id: 'gold-paint',
    title: 'GOLD PAINT',
    giver: 'LENA CRUZ',
    brief: 'Marco Vane parks his gold Phantom at the docks every dusk. Take it. Bring it to Juno’s shop. If the alarm goes, drive like you mean it.',
    reward: 2200,
    rp: 90,
    stages: [
      { id: 'steal', text: 'Steal the gold Phantom at the docks', type: 'enter', vehicle: 'phantom', wanted: 2 },
      { id: 'escape', text: 'Lose the heat, then reach Juno’s shop', type: 'reach', marker: 'juno-shop', needsWanted: 0 },
    ],
  },
  {
    id: 'market-sweep',
    title: 'MARKET SWEEP',
    giver: 'VIC TORRES',
    brief: 'Vane’s guards own the night market tonight. Clear them out, on foot. Juno is watching the exits — don’t let anyone slip past.',
    reward: 3200,
    rp: 140,
    stages: [
      { id: 'clear', text: 'Clear Vane’s guards from the night market', type: 'clear', area: 'night-market', count: 6 },
      { id: 'meet', text: 'Meet Pilar at the Coral Keys pier', type: 'reach', marker: 'coral-pier' },
    ],
  },
  {
    id: 'bridge-run',
    title: 'BRIDGE RUN',
    giver: 'PILAR',
    brief: 'Sunset race across Solmar Bridge to Coral Keys. Beat the Vane Phantom, or walk home. Winner takes the bay.',
    reward: 5000,
    rp: 200,
    stages: [
      { id: 'race', text: 'Race the Phantom across Solmar Bridge', type: 'race', marker: 'coral-pier', rival: 'phantom' },
    ],
  },
];
export const DIALOGUE = {
  intro: {
    name: 'LENA CRUZ', role: 'FIXER — HARBOR DISTRICT',
    lines: [
      'Solmar Bay runs on favors, kid. You want in? Start by driving.',
      'Vic left a Comet at my garage. Get it to the Coral Keys pier.',
      'Scratch it and you owe me. Lose it and you owe me more.',
    ],
  },
  goldPaint: {
    name: 'LENA CRUZ', role: 'FIXER — HARBOR DISTRICT',
    lines: [
      'Marco Vane thinks the docks are his. Tonight they are not.',
      'His gold Phantom parks at the docks every dusk. Take it.',
      'Juno will strip the tracker. Just get it to the shop.',
    ],
  },
  marketSweep: {
    name: 'VIC TORRES', role: 'DRIVER — CORAL KEYS',
    lines: [
      'Vane’s guards own the night market tonight. Not anymore.',
      'Clear them out, on foot. Juno is watching the exits.',
      'Don’t let anyone slip past. I want the market quiet by midnight.',
    ],
  },
  bridgeRun: {
    name: 'PILAR', role: 'LOOKOUT — CORAL KEYS',
    lines: [
      'Sunset race. Bridge to Coral Keys. Beat the Phantom or walk home.',
      'Vane’s driver thinks the bridge is his. Show him it isn’t.',
      'Winner takes the bay. Loser takes the bus.',
    ],
  },
  fail: {
    name: 'LENA CRUZ', role: 'FIXER — HARBOR DISTRICT',
    lines: ['That went sideways. Come back when you can drive straight.'],
  },
  complete: {
    name: 'LENA CRUZ', role: 'FIXER — HARBOR DISTRICT',
    lines: ['Clean work. The bay is starting to notice you.'],
  },
};