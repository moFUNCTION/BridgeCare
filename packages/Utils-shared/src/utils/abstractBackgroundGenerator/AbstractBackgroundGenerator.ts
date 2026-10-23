import {
  BACKGROUND_ASPECT_RATIOS,
  BACKGROUND_PATTERN_PRESETS,
  getPreset,
} from "./presets";
import { renderPattern } from "./renderPattern";
import { createSeededRng, type Rng } from "./random";
import { buildFullSvg, svgToPngBlob } from "./svg";
import type {
  AspectRatioId,
  BackgroundPatternConfig,
  BackgroundPatternId,
  BackgroundPatternPreset,
  CanvasSize,
} from "./types";

export interface AbstractBackgroundGeneratorOptions {
  seed?: number;
  aspectRatio?: AspectRatioId;
  bgType?: BackgroundPatternId;
  config?: Partial<BackgroundPatternConfig>;
}

export class AbstractBackgroundGenerator {
  static readonly PRESETS = BACKGROUND_PATTERN_PRESETS;
  static readonly ASPECT_RATIOS = BACKGROUND_ASPECT_RATIOS;

  private seed: number;
  private size: CanvasSize;
  private config: BackgroundPatternConfig;

  constructor(options: AbstractBackgroundGeneratorOptions = {}) {
    this.seed = options.seed ?? Date.now();
    const aspect = options.aspectRatio ?? "16:9";
    this.size = { ...BACKGROUND_ASPECT_RATIOS[aspect] };
    const preset = getPreset(options.bgType ?? "side-wave");
    const bgType = (options.config?.bgType ??
      options.bgType ??
      preset?.id ??
      "side-wave") as BackgroundPatternId;
    this.config = {
      bgColor: "#ffffff",
      bgTransparent: true,
      colors: ["#6366f1", "#8b5cf6"],
      ...preset?.defaultValues,
      ...options.config,
      bgType,
    };
  }

  getRng(): Rng {
    return createSeededRng(this.seed);
  }

  getSeed(): number {
    return this.seed;
  }

  getSize(): CanvasSize {
    return { ...this.size };
  }

  getConfig(): BackgroundPatternConfig {
    return { ...this.config, colors: [...(this.config.colors ?? [])] };
  }

  getPreset(): BackgroundPatternPreset | undefined {
    return getPreset(this.config.bgType);
  }

  setSeed(seed: number): this {
    this.seed = seed;
    return this;
  }

  regenerate(): this {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this;
  }

  setAspectRatio(ratio: AspectRatioId): this {
    this.size = { ...BACKGROUND_ASPECT_RATIOS[ratio] };
    return this;
  }

  setSize(width: number, height: number): this {
    this.size = { w: width, h: height };
    return this;
  }

  setPatternType(bgType: BackgroundPatternId): this {
    const preset = getPreset(bgType);
    this.config = {
      bgType,
      bgColor: this.config.bgColor,
      bgTransparent: this.config.bgTransparent,
      colors: [
        ...(preset?.defaultValues.colors ?? this.config.colors ?? ["#6366f1"]),
      ],
      ...preset?.defaultValues,
    };
    return this;
  }

  updateConfig(patch: Partial<BackgroundPatternConfig>): this {
    this.config = { ...this.config, ...patch };
    if (patch.colors) {
      this.config.colors = [...patch.colors];
    }
    return this;
  }

  renderPatternNodes() {
    return renderPattern(
      this.config.bgType,
      { ...this.config, seed: this.seed },
      this.size,
      this.getRng(),
    );
  }

  toSvgString(): string {
    return buildFullSvg({
      width: this.size.w,
      height: this.size.h,
      bgColor: this.config.bgColor ?? "#ffffff",
      transparent: Boolean(this.config.bgTransparent),
      nodes: this.renderPatternNodes(),
      blur: Number(this.config.blur ?? 0),
    });
  }

  async toPngBlob(scale = 2): Promise<Blob> {
    return svgToPngBlob(
      this.toSvgString(),
      this.size.w,
      this.size.h,
      scale,
      Boolean(this.config.bgTransparent),
    );
  }

  async downloadPng(filename = "background.png", scale = 2): Promise<void> {
    const blob = await this.toPngBlob(scale);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
