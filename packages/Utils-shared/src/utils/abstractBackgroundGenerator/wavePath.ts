import type { CanvasSize } from "./types";
import { getRandomValue, type Rng } from "./random";

export interface WavePathOptions {
  size: CanvasSize;
  peaks: number;
  height: number;
  width: number;
  layout?: string;
  startX: number;
  pathHeight: number;
  lineNumber?: number;
  direction?: "top" | "bottom";
  paddingY?: number;
  paddingX?: number;
  rng?: Rng;
}

export function buildWavePath({
  size,
  peaks,
  height,
  width,
  layout = "parallel",
  startX,
  pathHeight,
  lineNumber = 0,
  direction,
  paddingY = 200,
  paddingX = 10,
  rng = Math.random,
}: WavePathOptions): string {
  let path = `M ${startX.toFixed(2)} ${pathHeight.toFixed(2)} S`;
  let x = 0;
  for (let i = -1; i < peaks + 1; i++) {
    x = width * i - paddingX;
    if (layout === "overlap" && lineNumber % 2 === 1) {
      path += ` ${(x + getRandomValue(width, width / 2, rng)).toFixed(2)} ${(pathHeight + getRandomValue(height, height / 2, rng)).toFixed(2)}`;
      path += ` ${(width * (i + 1)).toFixed(2)} ${pathHeight.toFixed(2)}`;
    } else {
      path += ` ${(x + width - getRandomValue(width, width / 2, rng)).toFixed(2)} ${(pathHeight - getRandomValue(height, height / 2, rng)).toFixed(2)}`;
      path += ` ${(width * (i + 1)).toFixed(2)} ${pathHeight.toFixed(2)}`;
    }
  }
  if (direction === "top") {
    path += ` h ${100 + paddingX} V ${-paddingY} H ${startX.toFixed(2)} Z`;
  } else {
    path += ` h ${100 + paddingX} V ${size.h + paddingY} H ${startX.toFixed(2)} Z`;
  }
  return path;
}
