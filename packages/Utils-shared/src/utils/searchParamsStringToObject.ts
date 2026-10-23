/**
 * Parses a query string (with or without a leading `?`) into a plain object.
 * Keys and values are decoded like `URLSearchParams`.
 * If the same key appears more than once, the last value wins.
 */
export function searchParamsStringToObject(
  searchParams: string,
): Record<string, string> {
  const trimmed = searchParams.trim();
  if (!trimmed) {
    return {};
  }

  const withoutQuestion = trimmed.startsWith("?")
    ? trimmed.slice(1)
    : trimmed;

  const params = new URLSearchParams(withoutQuestion);
  const out: Record<string, string> = {};

  for (const [key, value] of params) {
    out[key] = value;
  }

  return out;
}
