import { useCallback, useState } from "react";
import type { Place } from "@/data/models";

export type GeolocationFailure = "denied" | "unavailable";

export function devicePlace(latitude: number, longitude: number): Place {
  const lat = Math.round(latitude * 100) / 100;
  const lon = Math.round(longitude * 100) / 100;
  return {
    id: `device-${lat}-${lon}`,
    name: "",
    admin1: "",
    country: "",
    countryCode: "",
    latitude: lat,
    longitude: lon,
    timezone: "auto",
    source: "device",
  };
}

/** Opt-in geolocation: nothing is requested until `locate()` is called from a user gesture. */
export function useGeolocation(onPlace: (place: Place) => void) {
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<GeolocationFailure | null>(null);

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setFailure("unavailable");
      return;
    }
    setLoading(true);
    setFailure(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLoading(false);
        onPlace(devicePlace(position.coords.latitude, position.coords.longitude));
      },
      (error) => {
        setLoading(false);
        setFailure(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  }, [onPlace]);

  return { locate, loading, failure, clearFailure: () => setFailure(null) };
}
