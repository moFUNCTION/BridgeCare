/** Cached by URL so multiple `CountryInput` instances share one request. */
const cca3ByUrl = new Map<string, Promise<string | null>>();

export function fetchCca3FromCountryFromIpUrl(url: string): Promise<string | null> {
  const key = url.trim();
  if (!key) return Promise.resolve(null);
  let p = cca3ByUrl.get(key);
  if (!p) {
    p = (async () => {
      try {
        const res = await fetch(key, { method: "GET", credentials: "omit" });
        if (!res.ok) return null;
        const data = (await res.json()) as { cca3?: unknown };
        const raw = data.cca3;
        if (typeof raw !== "string") return null;
        const cca3 = raw.trim().toUpperCase();
        return /^[A-Z]{3}$/.test(cca3) ? cca3 : null;
      } catch {
        return null;
      }
    })();
    cca3ByUrl.set(key, p);
  }
  return p;
}

/**
 * Resolves the HTTP URL for `getCountryFromIp` when not passed explicitly.
 * Uses Vite env when available; otherwise falls back to the default Firebase Cloud Functions URL.
 */
export function resolveCountryFromIpUrl(explicit?: string | null): string | null {
  const trimmed = explicit?.trim();
  if (trimmed) return trimmed;
  try {
    const env = (import.meta as ImportMeta & {
      env?: { VITE_FIREBASE_FUNCTIONS_URL?: string };
    }).env;
    const base = env?.VITE_FIREBASE_FUNCTIONS_URL?.trim();
    const name = "getCountryFromIp";
    if (base) {
      return `${base.replace(/\/$/, "")}/${name}`;
    }
    return `https://us-central1-layder-edu.cloudfunctions.net/${name}`;
  } catch {
    /* non-Vite */
  }
  return "https://us-central1-layder-edu.cloudfunctions.net/getCountryFromIp";
}
