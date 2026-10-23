import { svgPath } from "blobs/v2";

/** Generate SVG path `d` for organic blob shapes (blobs/v2, same as Platform backdrops). */
export function createBlobPath(
  size: number,
  edges = 6,
  smoothness = 4,
  seed?: string | number
): string {
  const roundedSize = Math.max(8, Math.round(size));
  const complexity = Math.max(4, Math.min(14, Math.round(edges)));
  const randomness = Math.max(1, Math.min(10, Math.round(smoothness)));

  return svgPath({
    size: roundedSize,
    extraPoints: complexity - 3,
    randomness,
    seed: seed !== undefined && seed !== "" ? String(seed) : "0",
  });
}
