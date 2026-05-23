
export interface Location {
  lat: number;
  lng: number;
}

/**
 * Calculates the Haversine distance between two points in km.
 */
export function calculateDistance(loc1: Location, loc2: Location): number {
  const R = 6371; // Earth's radius in km
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
  const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Returns the 20 closest locations from a list.
 */
export function getClosestLocations(current: Location, targets: any[], max: number = 20): any[] {
  return [...targets]
    .map(target => ({
      ...target,
      distance: calculateDistance(current, target.location)
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, max);
}
