import { svgToPngBlob } from "../abstractBackgroundGenerator/svg";
import type { AspectRatioId } from "../abstractBackgroundGenerator/types";
import { buildSvgWaveMarkup, buildSvgWaveCssBackground } from "./renderSvgWave";
import {
  DEFAULT_SVG_WAVE_CONFIG,
  SVG_WAVE_ASPECT_RATIOS,
  type SvgWaveConfig,
} from "./types";

export interface SvgWaveGeneratorOptions {
  seed?: number;
  aspectRatio?: AspectRatioId;
  config?: Partial<SvgWaveConfig>;
}

export class SvgWaveGenerator {
  static readonly ASPECT_RATIOS = SVG_WAVE_ASPECT_RATIOS;
  static readonly DEFAULT_CONFIG = DEFAULT_SVG_WAVE_CONFIG;

  private seed: number;
  private aspectRatio: AspectRatioId;
  private config: SvgWaveConfig;

  constructor(options: SvgWaveGeneratorOptions = {}) {
    this.seed = options.seed ?? Date.now();
    this.aspectRatio = options.aspectRatio ?? "16:9";
    const baseLayers = (
      options.config?.layers ?? DEFAULT_SVG_WAVE_CONFIG.layers
    ).map((l) => ({ ...l }));
    this.config = {
      ...DEFAULT_SVG_WAVE_CONFIG,
      ...options.config,
      layers: baseLayers,
    };
  }

  getSeed(): number {
    return this.seed;
  }

  getAspectRatio(): AspectRatioId {
    return this.aspectRatio;
  }

  getSize() {
    return { ...SVG_WAVE_ASPECT_RATIOS[this.aspectRatio] };
  }

  getConfig(): SvgWaveConfig {
    return {
      ...this.config,
      layers: this.config.layers.map((l) => ({ ...l })),
    };
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
    this.aspectRatio = ratio;
    return this;
  }

  updateConfig(patch: Partial<SvgWaveConfig>): this {
    this.config = { ...this.config, ...patch };
    if (patch.layers) {
      this.config.layers = patch.layers.map((l) => ({ ...l }));
    }
    return this;
  }

  toSvgString(): string {
    const { w, h } = SVG_WAVE_ASPECT_RATIOS[this.aspectRatio];
    return buildSvgWaveMarkup(this.config, w, h, this.seed);
  }

  toCssBackground(): string {
    const placement = this.config.flip
      ? this.config.placement === "bottom"
        ? "top"
        : "bottom"
      : this.config.placement;
    return buildSvgWaveCssBackground(this.toSvgString(), placement);
  }

  async toPngBlob(scale = 2): Promise<Blob> {
    const { w, h } = SVG_WAVE_ASPECT_RATIOS[this.aspectRatio];
    return svgToPngBlob(
      this.toSvgString(),
      w,
      h,
      scale,
      Boolean(this.config.bgTransparent),
    );
  }

  async downloadPng(filename = "wave-background.png", scale = 2): Promise<void> {
    const blob = await this.toPngBlob(scale);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  downloadSvg(filename = "wave-background.svg"): void {
    const blob = new Blob([this.toSvgString()], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
