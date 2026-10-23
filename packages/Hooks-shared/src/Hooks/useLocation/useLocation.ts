import { useEffect, useState, useCallback } from "react";

export interface GeolocationCoords {
  /** Longitude */
  x: number;
  /** Latitude */
  y: number;
}

export type LocationPermissionState = "granted" | "denied" | "prompt" | null;

export interface UseLocationOptions {
  /** Whether to fetch location on mount. Default: true */
  enabled?: boolean;
  /** Maximum age of cached position in ms. Default: 60000 (1 min) */
  maximumAge?: number;
  /** Timeout in ms. Default: 10000 */
  timeout?: number;
}

export interface UseLocationReturn {
  /** Coordinates in schema format: { x: longitude, y: latitude } */
  location: GeolocationCoords | null;
  /** Whether location permission is enabled: granted | denied | prompt | null (null when Permissions API unavailable) */
  permissionState: LocationPermissionState;
  loading: boolean;
  error: string | null;
  /** Manually trigger a location fetch */
  refetch: () => void;
  /** Request user permission (triggers browser permission prompt) and fetches location */
  requestPermission: () => void;
}

export function useLocation(
  options: UseLocationOptions = {},
): UseLocationReturn {
  const { enabled = true, maximumAge = 60000, timeout = 10000 } = options;

  const [location, setLocation] = useState<GeolocationCoords | null>(null);
  const [permissionState, setPermissionState] =
    useState<LocationPermissionState>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ x: longitude, y: latitude });
        setPermissionState("granted");
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setPermissionState("denied");
        setLoading(false);
      },
      { maximumAge, timeout, enableHighAccuracy: false },
    );
  }, [maximumAge, timeout]);

  const requestPermission = useCallback(() => {
    fetchLocation();
  }, [fetchLocation]);

  useEffect(() => {
    if (enabled) {
      fetchLocation();
    } else {
      setLoading(false);
    }
  }, [enabled, fetchLocation]);

  useEffect(() => {
    if (
      typeof navigator === "undefined" ||
      !("permissions" in navigator) ||
      !navigator.permissions
    ) {
      return;
    }

    navigator.permissions
      .query({ name: "geolocation" } as PermissionDescriptor)
      .then((result) => {
        setPermissionState(result.state as LocationPermissionState);
        result.onchange = () => {
          setPermissionState(result.state as LocationPermissionState);
        };
      })
      .catch(() => {});
  }, []);

  return {
    location,
    permissionState,
    loading,
    error,
    refetch: fetchLocation,
    requestPermission,
  };
}
