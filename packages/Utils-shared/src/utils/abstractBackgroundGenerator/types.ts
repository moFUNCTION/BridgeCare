export type BackgroundPatternId =
  | "side-wave"
  | "wave"
  | "peak"
  | "blurry"
  | "split"
  | "material"
  | "code"
  | "rain"
  | "blob"
  | "step"
  | "scattered"
  | "scribbles"
  | "block"
  | "frame"
  | "concentric"
  | "line"
  | "stripe"
  | "stacks"
  | "mirror"
  | "sheet"
  | "confetti"
  | "low-poly";

export type AspectRatioId =
  | "1:1"
  | "2:1"
  | "1:2"
  | "3:4"
  | "4:3"
  | "9:16"
  | "16:9"
  | "4:5"
  | "5:4";

export type FillMode = "fill" | "stroke";

export interface CanvasSize {
  w: number;
  h: number;
}

export interface BackgroundPatternConfig {
  bgType: BackgroundPatternId;
  bgColor: string;
  /** When true, SVG/PNG export has no background fill (alpha). */
  bgTransparent?: boolean;
  colors: string[];
  type?: FillMode | "block" | "random" | "center" | "side";
  layout?: string;
  layers?: number;
  peaks?: number;
  gap?: number;
  angle?: number;
  stroke?: number;
  opacity?: number;
  blur?: number;
  number?: number;
  direction?: string;
  shape?: string;
  side?: string | number;
  steps?: number;
  density?: number;
  zoom?: number;
  roundness?: number;
  col?: number;
  x?: number;
  y?: number;
  cellSize?: number;
  chaos?: number;
  minSize?: number;
  maxSize?: number;
  topCurve?: number;
  bottomCurve?: number;
  circles?: number;
  seed?: string | number;
  [key: string]: string | number | string[] | boolean | undefined;
}

export interface BackgroundPatternPreset {
  id: BackgroundPatternId;
  label: string;
  thumbnail: string;
  defaultValues: Partial<BackgroundPatternConfig>;
}

export type SvgAttrs = Record<string, string | number | undefined>;

export interface SvgNode {
  tag: string;
  attrs?: SvgAttrs;
  children?: SvgNode[];
  text?: string;
}

export interface RenderResult {
  nodes: SvgNode[];
  width: number;
  height: number;
}
