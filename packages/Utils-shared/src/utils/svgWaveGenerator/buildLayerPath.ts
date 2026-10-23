import { buildWavePath } from "../abstractBackgroundGenerator/wavePath";
import { getRandomValue, type Rng } from "../abstractBackgroundGenerator/random";
import type { SvgWavePlacement, SvgWaveShapeId } from "./types";

export interface BuildLayerPathOptions {
  width: number;
  height: number;
  /** Y of the wave edge (separates fill from open area). */
  baselineY: number;
  amplitude: number;
  complexity: number;
  waveShape: SvgWaveShapeId;
  placement: SvgWavePlacement;
  layerIndex: number;
  rng: Rng;
}

function resolvePlacement(
  placement: SvgWavePlacement,
  flip: boolean,
): SvgWavePlacement {
  if (!flip) return placement;
  return placement === "bottom" ? "top" : "bottom";
}

function closeAlongEdge(
  width: number,
  height: number,
  baselineY: number,
  placement: SvgWavePlacement,
  curveToWidth: string,
): string {
  if (placement === "top") {
    return `${curveToWidth} L ${width} 0 L 0 0 Z`;
  }
  return `${curveToWidth} L ${width} ${height} L 0 ${height} Z`;
}

/** Cubic bezier wave (svgwave-style smooth). */
function buildSmoothWavePath(
  width: number,
  height: number,
  baselineY: number,
  amplitude: number,
  peaks: number,
  placement: SvgWavePlacement,
  layerIndex: number,
  rng: Rng,
): string {
  const peakW = width / Math.max(1, peaks);
  const sign = placement === "bottom" ? -1 : 1;
  const phase = layerIndex * 0.35;

  let curve = `M 0 ${baselineY.toFixed(2)}`;
  for (let i = 0; i <= peaks; i++) {
    const x1 = i * peakW;
    const x2 = Math.min(width, (i + 1) * peakW);
    const wobble =
      sign *
      amplitude *
      (0.55 + 0.45 * Math.sin(i * 1.7 + phase + rng() * 0.5));
    const cp1x = x1 + peakW * 0.33;
    const cp2x = x1 + peakW * 0.66;
    const cpY = baselineY + wobble;
    curve += ` C ${cp1x.toFixed(2)} ${cpY.toFixed(2)} ${cp2x.toFixed(2)} ${cpY.toFixed(2)} ${x2.toFixed(2)} ${baselineY.toFixed(2)}`;
  }
  if (curve.includes(` ${width} `) === false) {
    curve += ` L ${width} ${baselineY.toFixed(2)}`;
  }
  return closeAlongEdge(width, height, baselineY, placement, curve);
}

function buildSharpWavePath(
  width: number,
  height: number,
  baselineY: number,
  amplitude: number,
  peaks: number,
  placement: SvgWavePlacement,
  rng: Rng,
): string {
  const peakW = width / Math.max(1, peaks);
  const sign = placement === "bottom" ? -1 : 1;
  let curve = `M 0 ${baselineY.toFixed(2)}`;
  for (let i = 0; i < peaks; i++) {
    const midX = (i + 0.5) * peakW;
    const endX = Math.min(width, (i + 1) * peakW);
    const peakY =
      baselineY + sign * getRandomValue(amplitude, amplitude * 0.4, rng);
    curve += ` L ${midX.toFixed(2)} ${peakY.toFixed(2)} L ${endX.toFixed(2)} ${baselineY.toFixed(2)}`;
  }
  curve += ` L ${width} ${baselineY.toFixed(2)}`;
  return closeAlongEdge(width, height, baselineY, placement, curve);
}

function buildSineWavePath(
  width: number,
  height: number,
  baselineY: number,
  amplitude: number,
  peaks: number,
  placement: SvgWavePlacement,
  layerIndex: number,
): string {
  const sign = placement === "bottom" ? -1 : 1;
  const steps = Math.max(48, peaks * 32);
  const freq = (peaks * Math.PI * 2) / width;
  const phase = layerIndex * 0.55;
  let curve = `M 0 ${baselineY.toFixed(2)}`;
  for (let i = 1; i <= steps; i++) {
    const x = (width * i) / steps;
    const y = baselineY + sign * amplitude * Math.sin(x * freq + phase);
    curve += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return closeAlongEdge(width, height, baselineY, placement, curve);
}

function buildStepsWavePath(
  width: number,
  height: number,
  baselineY: number,
  amplitude: number,
  peaks: number,
  placement: SvgWavePlacement,
  layerIndex: number,
): string {
  const sign = placement === "bottom" ? -1 : 1;
  const stepW = width / Math.max(1, peaks);
  let curve = `M 0 ${baselineY.toFixed(2)}`;
  for (let i = 0; i < peaks; i++) {
    const x1 = Math.min(width, (i + 1) * stepW);
    const high =
      baselineY +
      sign * amplitude * (i % 2 === layerIndex % 2 ? 1 : 0.35);
    curve += ` L ${x1.toFixed(2)} ${high.toFixed(2)} L ${x1.toFixed(2)} ${baselineY.toFixed(2)}`;
  }
  curve += ` L ${width} ${baselineY.toFixed(2)}`;
  return closeAlongEdge(width, height, baselineY, placement, curve);
}

export function buildSvgWaveLayerPath(
  options: BuildLayerPathOptions & { flip?: boolean },
): string {
  const {
    width,
    height,
    baselineY,
    amplitude,
    complexity,
    waveShape,
    placement,
    layerIndex,
    flip = false,
    rng,
  } = options;

  const peaks = Math.max(1, Math.min(12, Math.round(complexity)));
  const resolved = resolvePlacement(placement, flip);
  const amp = Math.max(8, amplitude);

  if (waveShape === "smooth") {
    return buildSmoothWavePath(
      width,
      height,
      baselineY,
      amp,
      peaks,
      resolved,
      layerIndex,
      rng,
    );
  }

  if (waveShape === "sharp") {
    return buildSharpWavePath(
      width,
      height,
      baselineY,
      amp,
      peaks,
      resolved,
      rng,
    );
  }

  if (waveShape === "sine") {
    return buildSineWavePath(
      width,
      height,
      baselineY,
      amp,
      peaks,
      resolved,
      layerIndex,
    );
  }

  if (waveShape === "steps") {
    return buildStepsWavePath(
      width,
      height,
      baselineY,
      amp,
      peaks,
      resolved,
      layerIndex,
    );
  }

  /* chaos — proven super-designer S-curve stack */
  const peakW = (width + 160) / peaks;
  return buildWavePath({
    size: { w: width, h: height },
    peaks,
    height: amp,
    width: peakW,
    layout: layerIndex % 2 === 0 ? "parallel" : "overlap",
    startX: -peakW * 0.35,
    pathHeight: baselineY,
    lineNumber: layerIndex,
    direction: resolved === "top" ? "top" : "bottom",
    paddingY: Math.max(height * 0.35, amp * 1.5),
    paddingX: 6,
    rng,
  });
}
