const ADJECTIVES = [
  'Silent', 'Mysterious', 'Gentle', 'Wandering', 'Pensive', 
  'Ethereal', 'Swaying', 'Restless', 'Luminous', 'Dreamy', 
  'Serene', 'Drifting', 'Vibrant', 'Melancholy', 'Glowing', 
  'Quiet', 'Curious', 'Hidden', 'Fading', 'Rising',
  'Warm', 'Solitary', 'Nomadic', 'Velvet', 'Midnight'
];

const NOUNS = [
  'Wanderer', 'Stargazer', 'Cloud', 'Swallow', 'Ocean', 
  'Forest', 'Sparrow', 'Lotus', 'Breeze', 'Mountain', 
  'River', 'Echo', 'Shadow', 'Petal', 'Pebble', 
  'Lantern', 'Willow', 'Firefly', 'Cosmos', 'Octopus',
  'Pioneer', 'Traveler', 'Sailor', 'Comet', 'Seedling'
];

export function generateRandomName(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adjective} ${noun}`;
}
