/**
 * Location Utilities for Proximity-Based Attendance
 * Implements geolocation capture and distance validation
 */

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Get current device location using browser Geolocation API
 * @returns Promise with latitude and longitude
 * @throws Error if location access is denied or unavailable
 */
export const getCurrentLocation = (): Promise<LocationCoordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let errorMessage = 'Failed to get location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location services and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Please check your device settings.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
        }
        
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Calculate distance between two geographical points using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in meters
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Check if student is within acceptable proximity of instructor
 * @param studentLat - Student's latitude
 * @param studentLon - Student's longitude
 * @param instructorLat - Instructor's latitude
 * @param instructorLon - Instructor's longitude
 * @param maxDistanceMeters - Maximum allowed distance in meters (default: 100m)
 * @returns Object with validation result and distance
 */
export const isWithinProximity = (
  studentLat: number,
  studentLon: number,
  instructorLat: number,
  instructorLon: number,
  maxDistanceMeters: number = 100
): { isValid: boolean; distance: number } => {
  const distance = calculateDistance(
    studentLat,
    studentLon,
    instructorLat,
    instructorLon
  );

  return {
    isValid: distance <= maxDistanceMeters,
    distance: Math.round(distance),
  };
};

/**
 * Format distance for display
 * @param meters - Distance in meters
 * @returns Formatted string (e.g., "50m" or "1.2km")
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};
