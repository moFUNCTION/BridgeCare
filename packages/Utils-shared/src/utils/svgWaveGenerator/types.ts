import type { AspectRatioId, CanvasSize } from "../abstractBackgroundGenerator/types";

export type { AspectRatioId, CanvasSize };

export const SVG_WAVE_ASPECT_RATIOS: Record<AspectRatioId, CanvasSize> = {
  "1:1": { w: 800, h: 800 },
  "2:1": { w: 1200, h: 600 },
  "1:2": { w: 600, h: 1200 },
  "3:4": { w: 900, h: 1200 },
  "4:3": { w: 1200, h: 900 },
  "9:16": { w: 720, h: 1280 },
  "16:9": { w: 1440, h: 500 },
  "4:5": { w: 800, h: 1000 },
  "5:4": { w: 1000, h: 800 },
};

/** Wave curve style (svgwave.in-style presets). */
export type SvgWaveShapeId =
  | "smooth"
  | "sharp"
  | "sine"
  | "steps"
  | "chaos";

/** Where the wave stack anchors on the canvas. */
export type SvgWavePlacement = "bottom" | "top";

export type SvgWaveLayerFillMode = "solid" | "gradient";

export interface SvgWaveLayerConfig {
  fillMode: SvgWaveLayerFillMode;
  color: string;
  colorEnd?: string;
  opacity: number;
  /** Degrees, for linear gradient on layer fill. */
  gradientAngle?: number;
}

export interface SvgWaveConfig {
  waveShape: SvgWaveShapeId;
  /** Number of stacked wave layers (1–8). */
  layerCount: number;
  layers: SvgWaveLayerConfig[];
  /** Wave stack height as % of canvas (10–100). */
  waveHeight: number;
  /** Wave cycles / peaks across width (1–12). */
  complexity: number;
  placement: SvgWavePlacement;
  /** Mirror vertically (svgwave Flip). */
  flip: boolean;
  animate: boolean;
  /** Animation duration in seconds. */
  animationSpeed: number;
  bgColor: string;
  bgTransparent: boolean;
}

export interface SvgWaveShapePreset {
  id: SvgWaveShapeId;
  label: string;
}

export const SVG_WAVE_SHAPE_PRESETS: SvgWaveShapePreset[] = [
  { id: "smooth", label: "Smooth" },
  { id: "sharp", label: "Sharp" },
  { id: "sine", label: "Sine" },
  { id: "steps", label: "Steps" },
  { id: "chaos", label: "Chaos" },
];

export const DEFAULT_SVG_WAVE_CONFIG: SvgWaveConfig = {
  waveShape: "smooth",
  layerCount: 3,
  layers: [
    {
      fillMode: "solid",
      color: "#5227FF",
      opacity: 1,
    },
    {
      fillMode: "solid",
      color: "#7cff67",
      opacity: 0.85,
    },
    {
      fillMode: "gradient",
      color: "#FF9FFC",
      colorEnd: "#5227FF",
      opacity: 0.7,
      gradientAngle: 0,
    },
  ],
  waveHeight: 55,
  complexity: 3,
  placement: "bottom",
  flip: false,
  animate: false,
  animationSpeed: 4,
  bgColor: "#ffffff",
  bgTransparent: true,
};
