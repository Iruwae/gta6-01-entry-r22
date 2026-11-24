export const MISSIONS = [
  {id: 'first-errand', title: 'Meet Lena', act: 1, payout: 300, contact: 'Lena Cruz',
   steps: [
     {kind: 'drive', text: "Pick up the Comet at Lena's Garage", next: 'Deliver the Comet to the Coral Keys pier', target: 'garage'},
     {kind: 'deliver', text: 'Deliver the Comet to the Coral Keys pier', next: 'Job done', target: 'piergate'}
   ],
   dialogue: [
     {who: 'Lena Cruz', role: 'FIXER · GARAGE', text: "Vic. You're back. The Comet's yours — take it to the pier, no questions."},
     {who: 'Vic Torres', role: 'DRIVER', text: "No questions. That's how I like it."}
   ]},
  {id: 'gold-paint', title: 'The Red Sprint', act: 1, payout: 1500, contact: 'Lena Cruz',
   steps: [
     {kind: 'steal', text: 'Steal the gold Phantom at the docks', next: 'Lose the heat', target: 'docks'},
     {kind: 'escape', text: 'Lose the heat', next: 'Bring it to the garage', target: 'garage', timer: 150}
   ],
   dialogue: [
     {who: 'Lena Cruz', role: 'FIXER · GARAGE', text: "A gold Phantom's sitting at the docks. Bring it home and the SBPD will notice."},
     {who: 'Vic Torres', role: 'DRIVER', text: "They always notice. That's the fun part."}
   ]},
  {id: 'three-drops', title: 'Three Drops', act: 2, payout: 1200, contact: 'Lena Cruz',
   steps: [
     {kind: 'collect', text: 'Collect the three marked pickups', next: 'Deliver them to the food stand', target: 'foodstand', count: 3},
     {kind: 'deliver', text: 'Deliver them to the food stand', next: 'Job done', target: 'foodstand'}
   ],
   dialogue: [
     {who: 'Lena Cruz', role: 'FIXER · GARAGE', text: "Three packages, three corners. Fast and quiet, Vic."}
   ]},
  {id: 'harbor-lights', title: 'Harbor Lights', act: 2, payout: 2500, contact: 'Lena Cruz',
   steps: [
     {kind: 'drive', text: 'Drive Lena to the docks', next: 'Then on to the island club', target: 'docks'},
     {kind: 'drive', text: 'Take Lena to the island club', next: 'Job done', target: 'club'}
   ],
   dialogue: [
     {who: 'Lena Cruz', role: 'FIXER · GARAGE', text: "Drive me to the docks first. Then the club on Coral Keys. And Vic — don't speed."},
     {who: 'Vic Torres', role: 'DRIVER', text: "No promises."}
   ]},
  {id: 'raid-stand', title: 'Raid at the Stand', act: 2, payout: 3000, contact: 'Marco',
   steps: [
     {kind: 'kill', text: 'Clear the raid at the food stand', next: 'Get Marco out safe', target: 'foodstand', count: 4},
     {kind: 'drive', text: 'Get Marco to the safehouse', next: 'Job done', target: 'safehouse'}
   ],
   dialogue: [
     {who: 'Marco', role: 'CREW · DRIVER', text: "They hit the stand! Four of them, Vic — get me out of here!"},
     {who: 'Vic Torres', role: 'DRIVER', text: "Stay behind me. Nobody touches my crew."}
   ]},
  {id: 'night-shift', title: 'Night Shift', act: 2, payout: 4000, contact: 'Lena Cruz',
   steps: [
     {kind: 'steal', text: 'Take the wanted export from the chop shop', next: 'Deliver it to the pier', target: 'chopshop'},
     {kind: 'deliver', text: 'Deliver the export to the pier', next: 'Job done', target: 'piergate'}
   ],
   dialogue: [
     {who: 'Lena Cruz', role: 'FIXER · GARAGE', text: "The chop shop's first export is hot. Move it to the pier before the SBPD wakes up."}
   ]},
  {id: 'tower-garage', title: 'The Tower Garage', act: 3, payout: 6000, contact: 'Lena Cruz',
   steps: [
     {kind: 'kill', text: 'Clear the four guards at the tower garage', next: 'Take the boat', target: 'tower', count: 4},
     {kind: 'drive', text: 'Race the boat back to the pier', next: 'Job done', target: 'piergate'}
   ],
   dialogue: [
     {who: 'Lena Cruz', role: 'FIXER · GARAGE', text: "Solmar Tower's garage. Four guards, one boat. This is the big one, Vic."}
   ]},
  {id: 'high-tide', title: 'High Tide', act: 3, payout: 25000, contact: 'Lena Cruz',
   steps: [
     {kind: 'kill', text: 'Take down the eight tower guards', next: 'Then the boss', target: 'tower', count: 8},
     {kind: 'boss', text: 'Take down the boss', next: 'Job done', target: 'tower'}
   ],
   dialogue: [
     {who: 'Lena Cruz', role: 'FIXER · GARAGE', text: "Eight guards and the boss himself. End this, Vic — and the bay is ours."},
     {who: 'Vic Torres', role: 'DRIVER', text: "High tide it is."}
   ]}
];
export function createStory(g) {
  const s = {list: MISSIONS, done: 0, byId(id) { return MISSIONS.find(m => m.id === id); }};
  g.story = s;
  return s;
}
