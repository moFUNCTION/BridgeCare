import { createSeededRng, type Rng } from "../abstractBackgroundGenerator/random";
import type { SvgWavePlacement, SvgWaveShapeId } from "./types";

export interface SvgWaveCubicPathOptions {
  width: number;
  height: number;
  /** Nominal Y of the wave edge (svgwave anchor). */
  anchorY: number;
  amplitude: number;
  complexity: number;
  waveShape: SvgWaveShapeId;
  placement: SvgWavePlacement;
  layerIndex: number;
  flip?: boolean;
  rng: Rng;
  /** 0–1 phase for morph keyframes (shifts wave without reshaping topology). */
  morphPhase?: number;
}

type Point = { x: number; y: number };

function resolvePlacement(
  placement: SvgWavePlacement,
  flip: boolean,
): SvgWavePlacement {
  if (!flip) return placement;
  return placement === "bottom" ? "top" : "bottom";
}

function formatPath(parts: string[]): string {
  return parts.join(" ");
}

/** How many cubic segments along the wave edge (svgwave uses many small smooth C's). */
function segmentCount(complexity: number, waveShape: SvgWaveShapeId): number {
  const c = Math.max(1, Math.min(12, Math.round(complexity)));
  if (waveShape === "sharp" || waveShape === "steps") {
    return Math.max(3, c * 2);
  }
  return Math.max(8, c * 5);
}

/**
 * Smooth wave height at normalized x ∈ [0,1]. Sum-of-sines keeps C1-friendly motion
 * (same structure as svgwave / DefaultHeroWaveSlot exports).
 * seedPhase and freqJitter are derived from rng() before the sample loop so the
 * seed drives a full-range phase shift on every regenerate.
 */
function waveOffsetAt(
  t: number,
  complexity: number,
  waveShape: SvgWaveShapeId,
  layerIndex: number,
  morphPhase: number,
  seedPhase: number,
  freqJitter: number,
  rng: Rng,
): number {
  const cycles = Math.max(1, Math.min(6, Math.round(complexity)));
  const p = seedPhase + layerIndex * 0.55 + morphPhase * Math.PI * 2;

  if (waveShape === "sine") {
    return (
      0.72 * Math.sin(t * Math.PI * 2 * cycles + p) +
      0.28 * Math.sin(t * Math.PI * 2 * (cycles + 1.3 + freqJitter) + p * 0.6)
    );
  }

  if (waveShape === "chaos") {
    const a = Math.sin(t * Math.PI * 2 * cycles + p);
    const b = Math.sin(t * Math.PI * 2 * (cycles * 1.7 + 0.4 + freqJitter) + p * 1.1);
    const n = (rng() - 0.5) * 0.35;
    return 0.5 * a + 0.38 * b + n;
  }

  /* smooth (default) */
  return (
    0.5 * Math.sin(t * Math.PI * 2 * cycles + p) +
    0.32 * Math.sin(t * Math.PI * 2 * (cycles * 1.45 + 0.8 + freqJitter) + p * 0.85) +
    0.12 * Math.sin(t * Math.PI * 2 * (cycles * 2.1 + layerIndex * 0.3) + p * 0.4) +
    (rng() - 0.5) * 0.06
  );
}

function sampleWaveEdgePoints(options: SvgWaveCubicPathOptions): Point[] {
  const {
    width,
    anchorY,
    amplitude,
    complexity,
    waveShape,
    placement,
    layerIndex,
    flip = false,
    rng,
    morphPhase = 0,
  } = options;

  const resolved = resolvePlacement(placement, flip);
  const sign = resolved === "bottom" ? -1 : 1;
  const amp = Math.max(6, amplitude);
  const segments = segmentCount(complexity, waveShape);

  // Consume rng upfront so the seed drives a full-range phase shift on every call.
  const seedPhase = rng() * Math.PI * 2;
  const freqJitter = rng() * 1.2;

  const points: Point[] = [{ x: 0, y: anchorY }];

  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const x = (width * i) / segments;
    const offset = waveOffsetAt(
      t,
      complexity,
      waveShape,
      layerIndex,
      morphPhase,
      seedPhase,
      freqJitter,
      rng,
    );
    points.push({
      x,
      y: anchorY + sign * amp * offset,
    });
  }

  points.push({ x: width, y: anchorY });
  return points;
}

/** Catmull–Rom → cubic Bézier (same smooth chaining as svgwave.in). */
function catmullRomCubics(points: Point[]): string[] {
  const curves: string[] = [];
  const n = points.length;
  if (n < 2) return curves;

  for (let i = 0; i < n - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[Math.min(n - 1, i + 2)]!;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    curves.push(
      `C ${cp1x.toFixed(5)},${cp1y.toFixed(5)} ${cp2x.toFixed(5)},${cp2y.toFixed(5)} ${p2.x.toFixed(2)},${p2.y.toFixed(5)}`,
    );
  }

  return curves;
}

function buildSharpEdgePoints(
  options: SvgWaveCubicPathOptions,
): Point[] {
  const { width, anchorY, amplitude, complexity, placement, layerIndex, flip, rng } =
    options;
  const resolved = resolvePlacement(placement, flip ?? false);
  const sign = resolved === "bottom" ? -1 : 1;
  const amp = Math.max(6, amplitude);
  const peaks = Math.max(2, Math.round(complexity) * 2);
  const peakW = width / peaks;

  // Full-range seed-driven phase and amplitude scale per regenerate.
  const seedPhase = rng() * Math.PI * 2;
  const ampScale = 0.55 + rng() * 0.45;

  const points: Point[] = [{ x: 0, y: anchorY }];

  for (let i = 0; i < peaks; i++) {
    const midX = (i + 0.5) * peakW;
    const nextX = Math.min(width, (i + 1) * peakW);
    const peakY =
      anchorY + sign * amp * ampScale * (0.5 + 0.5 * Math.sin(i * 1.4 + layerIndex * 0.5 + seedPhase));
    points.push({ x: midX, y: peakY });
    points.push({ x: nextX, y: anchorY });
  }

  if (points[points.length - 1]!.x < width) {
    points.push({ x: width, y: anchorY });
  }
  return points;
}

function buildStepsEdgePoints(options: SvgWaveCubicPathOptions): Point[] {
  const { width, anchorY, amplitude, complexity, placement, flip, rng } =
    options;
  const resolved = resolvePlacement(placement, flip ?? false);
  const sign = resolved === "bottom" ? -1 : 1;
  const amp = Math.max(6, amplitude);
  const steps = Math.max(2, Math.round(complexity) * 2);
  const stepW = width / steps;

  // Seed-driven step heights so each regenerate produces a distinct staircase.
  const stepHeights = Array.from({ length: steps }, () => 0.25 + rng() * 0.75);

  const points: Point[] = [{ x: 0, y: anchorY }];

  for (let i = 1; i <= steps; i++) {
    const x = Math.min(width, i * stepW);
    const high = anchorY + sign * amp * stepHeights[i - 1]!;
    points.push({ x, y: high });
    points.push({ x, y: anchorY });
  }
  return points;
}

/**
 * svgwave-style closed wave: M 0,extend L 0,anchor C ... L width,extend Z
 */
export function buildSvgWaveCubicPath(options: SvgWaveCubicPathOptions): string {
  const {
    width,
    height,
    anchorY,
    waveShape,
    placement,
    flip = false,
  } = options;

  const resolved = resolvePlacement(placement, flip);
  const pad = Math.max(10, height * 0.03);
  const extendY = resolved === "bottom" ? height + pad : 0;

  let edgePoints: Point[];
  if (waveShape === "sharp") {
    edgePoints = buildSharpEdgePoints(options);
  } else if (waveShape === "steps") {
    edgePoints = buildStepsEdgePoints(options);
  } else {
    edgePoints = sampleWaveEdgePoints(options);
  }

  const parts: string[] =
    resolved === "bottom"
      ? [`M 0,${extendY.toFixed(2)}`, `L 0,${anchorY.toFixed(2)}`]
      : [`M 0,0`, `L 0,${anchorY.toFixed(2)}`];

  if (waveShape === "smooth" || waveShape === "sine" || waveShape === "chaos") {
    parts.push(...catmullRomCubics(edgePoints));
  } else {
    for (let i = 1; i < edgePoints.length; i++) {
      const p = edgePoints[i]!;
      parts.push(`L ${p.x.toFixed(2)},${p.y.toFixed(5)}`);
    }
  }

  if (resolved === "bottom") {
    parts.push(
      `L ${width},${extendY.toFixed(2)}`,
      `L 0,${extendY.toFixed(2)}`,
      `Z`,
    );
  } else {
    parts.push(`L ${width},0`, `L 0,0`, `Z`);
  }

  return formatPath(parts);
}

const MORPH_FRAME_COUNT = 4;

/** Morph frames share topology; only phase shifts (small Y deltas like hero slot). */
export function buildSvgWaveMorphKeyframes(
  options: SvgWaveCubicPathOptions,
  baseSeed: number,
): string[] {
  const paths: string[] = [];
  for (let f = 0; f < MORPH_FRAME_COUNT; f++) {
    const frameRng = createSeededRng(
      (baseSeed + options.layerIndex * 9781) >>> 0,
    );
    const morphPhase = f / MORPH_FRAME_COUNT;
    paths.push(
      buildSvgWaveCubicPath({
        ...options,
        rng: frameRng,
        morphPhase,
      }),
    );
  }
  return paths;
}

export function escapePathForCss(pathD: string): string {
  return pathD.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function buildPathMorphCss(
  layerIndex: number,
  keyframePaths: string[],
  durationSec: number,
): string {
  const animName = `pathAnim-${layerIndex}`;
  const loopPath = keyframePaths[0] ?? keyframePaths[keyframePaths.length - 1] ?? "";
  const frames = keyframePaths
    .map(
      (d, i) =>
        `            ${i * 25}%{\n              d: path("${escapePathForCss(d)}");\n            }`,
    )
    .join("\n");

  return `          .path-${layerIndex}{
            animation:${animName} ${durationSec}s;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
          }
          @keyframes ${animName}{
${frames}
            100%{
              d: path("${escapePathForCss(loopPath)}");
            }
          }`;
}
