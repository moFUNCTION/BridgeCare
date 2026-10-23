import { useEffect, useState } from "react";

interface Coords {
  latitude: number;
  longitude: number;
}

interface Country {
  name: string;
  code: string;
}

interface UseUserCountryParams {
  isStored?: boolean;
}

interface UseUserCountryReturn {
  country: Country | null;
  coords: Coords | null;
  loading: boolean;
  error: string | null;
}

interface NominatimAddress {
  country?: string;
  country_code?: string;
}

interface NominatimResponse {
  address?: NominatimAddress;
}

/** Module-level cache to prevent re-fetching once we have a result. */
let cachedCountry: Country | null = null;
let cachedCoords: Coords | null = null;

function getCountryFromLocale(): Country | null {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const region = locale.split("-")[1] || locale.split("_")[1];
    if (!region || region.length !== 2) return null;
    const code = region.toUpperCase();
    const name =
      new Intl.DisplayNames(["en"], { type: "region" }).of(region) ?? code;
    return { name, code };
  } catch {
    return null;
  }
}

export const useUserCountry = ({
  isStored,
}: UseUserCountryParams = {}): UseUserCountryReturn => {
  const [country, setCountry] = useState<Country | null>(() => cachedCountry);
  const [coords, setCoords] = useState<Coords | null>(() => cachedCoords);
  const [loading, setLoading] = useState<boolean>(() => !cachedCountry);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedCountry) {
      setCountry(cachedCountry);
      setCoords(cachedCoords);
      setLoading(false);
      return;
    }
    if (isStored) {
      setLoading(false);
      return;
    }
    if (!navigator.geolocation) {
      const fallback = getCountryFromLocale();
      if (fallback) {
        cachedCountry = fallback;
        setCountry(fallback);
      }
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newCoords = { latitude, longitude };
        setCoords(newCoords);
      },
      (err) => {
        const fallback = getCountryFromLocale();
        if (fallback) {
          cachedCountry = fallback;
          setCountry(fallback);
        }
        setError(err.message);
        setLoading(false);
      },
    );
  }, [isStored]);

  useEffect(() => {
    if (!coords || cachedCountry) return;

    const { latitude, longitude } = coords;
    const fetchCountry = async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
        const res = await fetch(url);

        if (!res.ok) throw new Error("Failed to fetch location data");
        const data: NominatimResponse = await res.json();
        const countryName = data.address?.country || "Unknown";
        const countryCode = data.address?.country_code?.toUpperCase() || "";
        const result = { name: countryName, code: countryCode };
        cachedCountry = result;
        cachedCoords = coords;
        setCountry(result);
      } catch (err) {
        const fallback = getCountryFromLocale();
        if (fallback) {
          cachedCountry = fallback;
          setCountry(fallback);
        } else {
          setError(
            err instanceof Error ? err.message : "An unknown error occurred",
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCountry();
  }, [coords]);

  return { country, coords, loading, error };
};
