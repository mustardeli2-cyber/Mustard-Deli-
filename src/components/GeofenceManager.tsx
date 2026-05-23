import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { STOCKISTS, Stockist } from '../constants';
import { calculateDistance, getClosestLocations } from '../lib/locationUtils';

export default function GeofenceManager() {
  const { user } = useAuth();
  const { geofencingEnabled, addLocalNotification, earnPoints } = useNotifications();
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const notifiedStockists = useRef<Set<string>>(new Set());
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!geofencingEnabled || !user) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!("geolocation" in navigator)) {
      console.warn("Geolocation not supported");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setCurrentLocation({ lat, lng });
      },
      (error) => {
        console.error("GeofenceManager position error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 5000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [geofencingEnabled, user]);

  useEffect(() => {
    if (!currentLocation || !geofencingEnabled) return;

    // Find closest 20 stockists based on current search area
    const closest = getClosestLocations(currentLocation, STOCKISTS, 20);

    // Filter by geofence (500m for tighter rewards)
    closest.forEach((stockist: Stockist & { distance: number }) => {
      if (stockist.distance <= 0.5) {
        if (!notifiedStockists.current.has(stockist.id)) {
          addLocalNotification(
            "Mustard Proximity Alert! 🍯",
            `You're within 500m of ${stockist.name} in ${stockist.city}! Perfect time to restock.`
          );
          
          // Micro reward for discovery
          earnPoints(2, `Stockist Discovery: ${stockist.name}`);
          
          notifiedStockists.current.add(stockist.id);
        }
      } else if (stockist.distance > 1.5) {
        // allowing re-notify if they leave area and come back
        notifiedStockists.current.delete(stockist.id);
      }
    });

  }, [currentLocation, geofencingEnabled]);

  return null;
}
