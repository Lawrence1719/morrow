export interface GeolocationResult {
  latitude: number;
  longitude: number;
  country: string;
}

const FALLBACK_CITIES: GeolocationResult[] = [
  { latitude: 40.7128, longitude: -74.0060, country: 'United States' }, // New York
  { latitude: 35.6762, longitude: 139.6503, country: 'Japan' },         // Tokyo
  { latitude: 51.5074, longitude: -0.1278, country: 'United Kingdom' }, // London
  { latitude: 48.8566, longitude: 2.3522, country: 'France' },         // Paris
  { latitude: -33.8688, longitude: 151.2093, country: 'Australia' },   // Sydney
  { latitude: 30.0444, longitude: 31.2357, country: 'Egypt' },         // Cairo
  { latitude: -22.9068, longitude: -43.1729, country: 'Brazil' },      // Rio de Janeiro
  { latitude: 19.0760, longitude: 72.8777, country: 'India' },         // Mumbai
  { latitude: -33.9249, longitude: 18.4241, country: 'South Africa' },  // Cape Town
  { latitude: 53.5511, longitude: 9.9937, country: 'Germany' }         // Hamburg
];

function getRandomFallback(): GeolocationResult {
  return FALLBACK_CITIES[Math.floor(Math.random() * FALLBACK_CITIES.length)];
}

export async function getGeolocation(ipAddress: string): Promise<GeolocationResult> {
  // Clean IP
  let ip = ipAddress.trim();
  if (ip.includes('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }

  // Check for localhost or private IPs
  if (
    ip === '127.0.0.1' || 
    ip === '::1' || 
    ip === 'localhost' ||
    ip.startsWith('10.') || 
    ip.startsWith('192.168.') || 
    ip.startsWith('172.')
  ) {
    return getRandomFallback();
  }

  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: {
        'User-Agent': 'morrow-world-notes-app'
      },
      // Timeout after 3 seconds
      signal: AbortSignal.timeout(3000)
    });

    if (!res.ok) {
      console.warn(`Geolocation lookup failed with status: ${res.status}`);
      return getRandomFallback();
    }

    const data = await res.json();
    
    if (data.error || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
      console.warn('Geolocation lookup returned error or invalid coordinates:', data);
      return getRandomFallback();
    }

    return {
      latitude: data.latitude,
      longitude: data.longitude,
      country: data.country_name || 'Unknown'
    };
  } catch (err) {
    console.error('Error during geolocation lookup:', err);
    return getRandomFallback();
  }
}
