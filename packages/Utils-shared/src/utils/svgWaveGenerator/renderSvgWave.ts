import { node, renderNodes } from "../abstractBackgroundGenerator/svg";
import type { SvgNode } from "../abstractBackgroundGenerator/types";
import { createSeededRng } from "../abstractBackgroundGenerator/random";
import {
  buildPathMorphCss,
  buildSvgWaveCubicPath,
  buildSvgWaveMorphKeyframes,
} from "./svgWaveCubicPath";
import type { SvgWaveConfig, SvgWaveLayerConfig } from "./types";

export interface LayerRenderResult {
  index: number;
  layer: SvgWaveLayerConfig;
  d: string;
  morphKeyframes?: string[];
}

function resolveLayers(config: SvgWaveConfig): SvgWaveLayerConfig[] {
  const layerCount = Math.max(1, Math.min(8, config.layerCount));
  const layers: SvgWaveLayerConfig[] = [];
  for (let i = 0; i < layerCount; i++) {
    layers.push(
      config.layers[i] ?? {
        fillMode: "solid",
        color: "#94a3b8",
        opacity: 0.75,
      },
    );
  }
  return layers;
}

function layerGeometry(
  config: SvgWaveConfig,
  width: number,
  height: number,
  layerIndex: number,
  layerCount: number,
) {
  const placement = config.placement;
  const stackPct = Math.max(10, Math.min(100, config.waveHeight)) / 100;
  const stackHeight = height * stackPct;
  const bandStep = stackHeight / layerCount;
  const peaks = Math.max(1, Math.min(12, Math.round(config.complexity)));
  const peakW = (width + 120) / peaks;
  const layerAmplitude = Math.max(
    12,
    Math.min(stackHeight * 0.5, peakW * 0.4),
  );

  const bandIndex = layerCount - 1 - layerIndex;
  const anchorY =
    placement === "bottom"
      ? height - bandStep * bandIndex - bandStep * 0.12
      : bandStep * bandIndex + bandStep * 0.12;

  return { anchorY, layerAmplitude, placement };
}

export function renderSvgWaveLayers(
  config: SvgWaveConfig,
  width: number,
  height: number,
  seed: number,
): LayerRenderResult[] {
  const layers = resolveLayers(config);
  const layerCount = layers.length;
  const results: LayerRenderResult[] = [];

  for (let i = 0; i < layerCount; i++) {
    const layer = layers[i]!;
    const { anchorY, layerAmplitude, placement } = layerGeometry(
      config,
      width,
      height,
      i,
      layerCount,
    );
    const layerSeed = (seed + i * 9781) >>> 0;
    const rng = createSeededRng(layerSeed);

    const cubicOpts = {
      width,
      height,
      anchorY,
      amplitude: layerAmplitude,
      complexity: config.complexity,
      waveShape: config.waveShape,
      placement,
      layerIndex: i,
      flip: config.flip,
      rng,
    };

    if (config.animate) {
      const morphKeyframes = buildSvgWaveMorphKeyframes(cubicOpts, seed);
      results.push({
        index: i,
        layer,
        d: morphKeyframes[0]!,
        morphKeyframes,
      });
    } else {
      const d = buildSvgWaveCubicPath(cubicOpts);
      results.push({ index: i, layer, d });
    }
  }

  return results;
}

function pathFillAttrs(
  layer: SvgWaveLayerConfig,
  index: number,
  animate: boolean,
): Record<string, string | number> {
  const opacity = Math.max(0.05, Math.min(1, layer.opacity));
  const base: Record<string, string | number> = {
    stroke: "none",
    "stroke-width": 0,
  };

  if (animate || layer.fillMode !== "gradient" || !layer.colorEnd) {
    return {
      ...base,
      fill: layer.color,
      "fill-opacity": opacity,
    };
  }

  return {
    ...base,
    fill: `url(#wave-grad-${index})`,
    "fill-opacity": opacity,
  };
}

function gradientDefs(layers: SvgWaveLayerConfig[]): string {
  const nodes: SvgNode[] = [];
  layers.forEach((layer, i) => {
    if (layer.fillMode !== "gradient" || !layer.colorEnd) return;
    nodes.push(
      node(
        "linearGradient",
        {
          id: `wave-grad-${i}`,
          x1: "0%",
          y1: "0%",
          x2: "0%",
          y2: "100%",
          gradientUnits: "objectBoundingBox",
        },
        [
          node("stop", { offset: "0%", "stop-color": layer.color }),
          node("stop", { offset: "100%", "stop-color": layer.colorEnd }),
        ],
      ),
    );
  });
  return nodes.length ? `      <defs>${renderNodes(nodes)}</defs>\n` : "";
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function buildSvgWaveMarkup(
  config: SvgWaveConfig,
  width: number,
  height: number,
  seed: number,
): string {
  const layerResults = renderSvgWaveLayers(config, width, height, seed);
  const duration = Math.max(1, config.animationSpeed);
  const atBottom = config.placement === "bottom";
  const preserve = atBottom ? "xMidYMax meet" : "xMidYMin meet";

  const styleSection = config.animate
    ? `      <style>\n${layerResults
        .map((lr) =>
          buildPathMorphCss(
            lr.index,
            lr.morphKeyframes ?? [lr.d],
            duration,
          ),
        )
        .join("\n")}\n      </style>\n`
    : "";

  const defsSection = config.animate
    ? ""
    : gradientDefs(layerResults.map((r) => r.layer));

  const bgRect = config.bgTransparent
    ? ""
    : `      <rect x="0" y="0" width="${width}" height="${height}" fill="${config.bgColor}"/>\n`;

  const pathsMarkup = layerResults
    .map((lr) => {
      const attrs = pathFillAttrs(lr.layer, lr.index, config.animate);
      const attrStr = Object.entries(attrs)
        .map(([k, v]) => `${k}="${v}"`)
        .join(" ");
      const cls = config.animate ? `path-${lr.index}` : "";
      const classAttr = cls ? ` class="${cls}"` : "";
      return `      <path d="${escapeAttr(lr.d)}" ${attrStr}${classAttr} />`;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" preserveAspectRatio="${preserve}">
${styleSection}${defsSection}${bgRect}${pathsMarkup}
</svg>`;
}

export function renderSvgWaveNodes(
  config: SvgWaveConfig,
  width: number,
  height: number,
  seed: number,
): SvgNode[] {
  const results = renderSvgWaveLayers(config, width, height, seed);
  return [
    node(
      "g",
      {},
      results.map((lr) =>
        node("path", {
          d: lr.d,
          fill: lr.layer.color,
          "fill-opacity": lr.layer.opacity,
          class: config.animate ? `path-${lr.index}` : undefined,
        }),
      ),
    ),
  ];
}

export function buildSvgWaveCssBackground(
  svgMarkup: string,
  placement: "bottom" | "top",
): string {
  const encoded = encodeURIComponent(svgMarkup.replace(/\s+/g, " ").trim());
  const pos = placement === "top" ? "center top" : "center bottom";
  return `url("data:image/svg+xml,${encoded}") ${pos} / 100% 100% no-repeat`;
}

export function interpolateLayerColors(
  start: string,
  end: string,
  count: number,
): string[] {
  const parse = (hex: string) => {
    const h = hex.replace("#", "").trim();
    const full =
      h.length === 3
        ? h
            .split("")
            .map((c) => c + c)
            .join("")
        : h.slice(0, 6);
    const n = Number.parseInt(full, 16);
    if (Number.isNaN(n)) return [99, 102, 241] as const;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
  };
  const [r1, g1, b1] = parse(start);
  const [r2, g2, b2] = parse(end);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = count <= 1 ? 0 : i / (count - 1);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    out.push(
      `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`,
    );
  }
  return out;
}
