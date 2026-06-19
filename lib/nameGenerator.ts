const DAY_ADJECTIVES = [
  'Sunny', 'Bright', 'Golden', 'Early', 'Solar', 
  'Radiant', 'Dawning', 'Vibrant', 'Warm', 'Rising', 
  'Morning', 'Dewy', 'Breezy', 'Sparkling', 'Fresh', 
  'Active', 'Glowing', 'Shining', 'Cheerful', 'Nomadic',
  'Zealous', 'Meadow', 'Blissful', 'Amber', 'Zephyr'
];

const DAY_NOUNS = [
  'Swallow', 'Lark', 'Early Bird', 'Robin', 'Sunseeker', 
  'Breeze', 'Cloud', 'Petal', 'River', 'Pioneer', 
  'Traveler', 'Sailor', 'Seedling', 'Sunflower', 'Ray', 
  'Meadow', 'Fawn', 'Sprout', 'Harvester', 'Glade',
  'Sparrow', 'Lotus', 'Forest', 'Mountain', 'Pebble'
];

const NIGHT_ADJECTIVES = [
  'Midnight', 'Stellar', 'Starry', 'Dreamy', 'Shadowy', 
  'Luminous', 'Quiet', 'Ethereal', 'Silent', 'Dusk', 
  'Cosmic', 'Sleepy', 'Drifting', 'Velvet', 'Swaying', 
  'Glimmering', 'Restless', 'Indigo', 'Obsidian', 'Nebula',
  'Mysterious', 'Gentle', 'Pensive', 'Serene', 'Melancholy'
];

const NIGHT_NOUNS = [
  'Owl', 'Stargazer', 'Firefly', 'Wanderer', 'Echo', 
  'Lantern', 'Shadow', 'Comet', 'Cosmos', 'Dreamer', 
  'Moonlight', 'Moth', 'Bat', 'Cricket', 'Drifter', 
  'Sleeper', 'Nova', 'Specter', 'Siren', 'Aurora',
  'Willow', 'Octopus', 'Stardust', 'Spectra', 'Glowworm'
];

export function generateRandomName(isNightOverride?: boolean): string {
  let isNight = isNightOverride;
  
  if (isNight === undefined) {
    try {
      const now = new Date();
      // Check the current hour in Asia/Manila (PHT) timezone
      const phOptionsHour = { timeZone: 'Asia/Manila', hour: '2-digit', hour12: false } as const;
      const formatterHour = new Intl.DateTimeFormat('en-US', phOptionsHour);
      const hour = parseInt(formatterHour.format(now), 10);
      isNight = hour >= 18 || hour < 6;
    } catch (e) {
      // Fallback to local server time hour
      const hour = new Date().getHours();
      isNight = hour >= 18 || hour < 6;
    }
  }

  const adjectives = isNight ? NIGHT_ADJECTIVES : DAY_ADJECTIVES;
  const nouns = isNight ? NIGHT_NOUNS : DAY_NOUNS;

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${adjective} ${noun}`;
}
