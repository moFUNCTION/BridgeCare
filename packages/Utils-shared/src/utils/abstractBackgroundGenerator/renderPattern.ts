import type { BackgroundPatternConfig, CanvasSize, SvgNode } from "./types";
import { createBlobPath } from "./blobPath";
import { generateShadesBetweenTwoColors, interpolatePalette } from "./colorUtils";
import { getRandomValue, type Rng } from "./random";
import { buildWavePath } from "./wavePath";
import { node } from "./svg";

type Cfg = BackgroundPatternConfig;
type Size = CanvasSize;

function paintMode(type?: string): "fill" | "stroke" {
  return type === "stroke" ? "stroke" : "fill";
}

function blobPath(
  size: number,
  edges = 6,
  smoothness = 4,
  seed?: string | number
): string {
  return createBlobPath(size, edges, smoothness, seed);
}

function scribbleNext(
  point: [number, number],
  step: number,
  canvas: Size,
  rng: Rng
): [number, number] {
  return [
    Math.max(0, Math.min(canvas.w, point[0] + getRandomValue(step, -step, rng))),
    Math.max(0, Math.min(canvas.h, point[1] + getRandomValue(step, -step, rng))),
  ];
}

export function renderPattern(
  bgType: string,
  config: Cfg,
  size: Size,
  rng: Rng = Math.random
): SvgNode[] {
  const c = config;
  const colors = c.colors?.length ? c.colors : ["#6366f1", "#ec4899"];
  const mode = paintMode(
    c.type === "fill" || c.type === "stroke" ? c.type : undefined
  );
  const strokeW = c.stroke ?? 10;
  const blobSeed = c.seed ?? c.bgType;

  switch (bgType) {
    case "stacks": {
      const layers = c.layers ?? 10;
      const col = c.col ?? 10;
      const layerH = size.h / layers;
      const colW = size.w / col;
      const nodes: SvgNode[] = [];
      for (let row = 0; row < layers; row++) {
        for (let column = 0; column < col; column++) {
          const fill = colors[Math.floor(getRandomValue(colors.length, 0, rng))]!;
          nodes.push(
            node("rect", {
              x: column * colW,
              y: row * layerH - layerH,
              width: colW,
              height: layerH * 3,
              fill,
              ry: (layerH * (c.roundness ?? 60)) / 100,
            })
          );
        }
      }
      return nodes;
    }

    case "side-wave": {
      const peaks = Math.max(1, c.peaks ?? 2);
      const gap = (c.gap ?? 10) * 10;
      const width = Math.max(size.h, size.w) / peaks;
      const nodes: SvgNode[] = [];
      for (let i = 0; i < 2; i++) {
        const h = i % 2 === 0 ? 25 - 75 - gap : 75 + gap;
        const pathY = i % 2 === 0 ? size.h + h - 20 : h + 20;
        const d = buildWavePath({
          size,
          peaks,
          height: h,
          width,
          startX: -width,
          pathHeight: pathY,
          layout: c.layout,
          direction: i % 2 === 0 ? "bottom" : "top",
          paddingY: 600,
          rng,
        });
        const color = colors[i % colors.length]!;
        nodes.push(
          mode === "stroke"
            ? node("path", { d, stroke: color, strokeWidth: strokeW, fill: "none" })
            : node("path", { d, fill: color })
        );
      }
      const angle = c.angle ?? 0;
      return [
        node("g", { transform: `rotate(${angle} ${size.w / 2} ${size.h / 2})` }, nodes),
      ];
    }

    case "wave": {
      const layers = (c.layers ?? 10) + 1;
      const peaks = Math.max(1, c.peaks ?? 2);
      const layerH = size.h / (c.layers ?? 10);
      const peakW = (size.w + 200) / peaks;
      const shades = generateShadesBetweenTwoColors(
        colors[0]!,
        colors[1] ?? "#ffffff",
        layers + 1
      );
      const paths: SvgNode[] = [];
      for (let i = 0; i < layers; i++) {
        const d = buildWavePath({
          size,
          peaks,
          height: layerH,
          width: peakW,
          startX: -peakW / 2,
          pathHeight: layerH * i - 40,
          layout: c.layout === "overlap" ? "overlap" : "parallel",
          lineNumber: i,
          rng,
        });
        const color = shades[i + 1] ?? shades[shades.length - 1]!;
        paths.push(
          mode === "stroke"
            ? node("path", { d, stroke: color, strokeWidth: strokeW, fill: "none" })
            : node("path", { d, fill: color, id: String(i) })
        );
      }
      const angle = c.angle ?? 0;
      return [
        node("g", { transform: `rotate(${angle} ${size.w / 2} ${size.h / 2})` }, paths),
      ];
    }

    case "peak": {
      const layers = c.layers ?? 10;
      const peaks = Math.max(1, c.peaks ?? 5);
      const layerH = size.h / layers;
      const peakW = size.w / peaks;
      const shades = generateShadesBetweenTwoColors(
        colors[0]!,
        colors[1] ?? "#ffffff",
        layers
      );
      const paths: SvgNode[] = [];
      for (let layer = -1; layer < layers; layer++) {
        let d = `M 0 ${layerH * layer} `;
        for (let p = 0; p < peaks + 1; p++) {
          const y = layerH * layer;
          const x = peakW * p;
          if (c.layout === "overlap" && layer % 2 === 1) {
            d += `L ${x - peakW} ${y.toFixed(2)} `;
            d += `L ${(x - peakW + getRandomValue((3 * peakW) / 4, peakW / 3, rng)).toFixed(2)} ${(y + getRandomValue(layerH, layerH / 2, rng)).toFixed(2)} `;
            d += `L ${x} ${y.toFixed(2)} `;
          } else {
            d += `L ${x} ${y.toFixed(2)} `;
            d += `L ${(x + getRandomValue((3 * peakW) / 4, peakW / 3, rng)).toFixed(2)} ${(y + getRandomValue(layerH, layerH / 2, rng)).toFixed(2)} `;
            d += `L ${x + peakW} ${y.toFixed(2)} `;
          }
        }
        const color = shades[layer + 1] ?? shades[shades.length - 1]!;
        if (mode === "stroke") {
          d += ` H ${size.w + 50} V ${size.h + 100} H -100 V ${layerH * layer + 100} H 0 Z`;
          paths.push(node("path", { d, stroke: color, strokeWidth: strokeW, fill: "none" }));
        } else {
          d += ` V ${size.h.toFixed(2)} H 0 V ${(layerH * layer).toFixed(2)} Z`;
          paths.push(node("path", { d, fill: color }));
        }
      }
      return paths;
    }

    case "blurry": {
      const count = c.number ?? 5;
      const blur = c.blur ?? 100;
      const slice = colors.slice(0, count);
      const nodes: SvgNode[] = [
        node("defs", undefined, [
          node("filter", {
            id: "f1",
            x: "-200%",
            y: "-200%",
            width: "500%",
            height: "500%",
          }, [node("feGaussianBlur", { stdDeviation: blur })]),
        ]),
      ];
      const step = 360 / count;
      const offset = Math.floor(getRandomValue(count, 0, rng));
      const radiusBase = Math.max(size.w, size.h) / 2;
      const dist = Math.sqrt(size.w * size.w + size.h * size.h) / count;

      for (let i = 0; i < count; i++) {
        let cx = 0;
        let cy = 0;
        let r = radiusBase;
        if (c.type === "center") {
          cx = radiusBase * Math.cos((Math.PI / 180) * (step * (i + 1))) + size.w / 2;
          cy = radiusBase * Math.sin((Math.PI / 180) * (step * (i + 1))) + size.h / 2;
        } else if (c.type === "side") {
          switch (c.direction) {
            case "tl":
              cx = size.w;
              cy = size.h;
              break;
            case "t":
              cx = size.w / 2;
              cy = 0;
              break;
            case "tr":
              cx = 0;
              cy = size.h;
              break;
            case "l":
              cx = size.w;
              cy = size.h / 2;
              break;
            case "c":
              cx = size.w / 2;
              cy = size.h / 2;
              break;
            case "r":
              cx = 0;
              cy = size.h / 2;
              break;
            case "bl":
              cx = size.w;
              cy = 0;
              break;
            case "b":
              cx = size.w / 2;
              cy = size.h;
              break;
            default:
              cx = 0;
              cy = 0;
          }
          r = dist * (count - i);
        } else {
          cx = getRandomValue(size.w, 0, rng);
          cy = getRandomValue(size.h, 0, rng);
        }
        nodes.push(
          node("circle", {
            cx,
            cy,
            r,
            fill: slice[(i + offset) % slice.length],
            filter: "url(#f1)",
          })
        );
      }
      return nodes;
    }

    case "stripe": {
      const layers = c.layers ?? 60;
      const palette =
        colors.length > 0
          ? colors
          : generateShadesBetweenTwoColors(colors[0]!, "#ffffff", layers + 1);
      const layerH = size.h / layers;
      const widths = [
        size.w / 10,
        size.w / 9,
        size.w / 8,
        size.w / 7,
        size.w / 6,
        size.w / 5,
      ];
      const nodes: SvgNode[] = [];
      for (let row = 0; row < layers; row++) {
        if (c.type === "block") {
          let x = 0;
          while (x < size.w + size.w / 10) {
            const w = widths[Math.floor(getRandomValue(widths.length, 0, rng))]!;
            nodes.push(
              node("rect", {
                x,
                y: row * layerH,
                width: w + 1,
                height: layerH + 2,
                fill: palette[Math.floor(getRandomValue(palette.length, 0, rng))],
              })
            );
            x += w;
          }
        } else {
          const rowY = layerH * row;
          let d = `M -50 ${rowY} C`;
          const totalW = size.w + 20;
          let lx = totalW * 0 - 10;
          d += ` ${(lx + getRandomValue(totalW, totalW / 2, rng)).toFixed(2)} ${(rowY + getRandomValue(layerH, layerH / 2, rng)).toFixed(2)}`;
          d += ` ${(lx + totalW - getRandomValue(totalW, totalW / 2, rng)).toFixed(2)} ${(rowY - getRandomValue(layerH, layerH / 2, rng)).toFixed(2)}`;
          d += ` ${totalW + 50} ${rowY.toFixed(2)}`;
          nodes.push(
            node("path", {
              d,
              stroke: palette[Math.floor(getRandomValue(palette.length, 0, rng))],
              fill: "none",
              strokeWidth: layerH + 4,
            })
          );
        }
      }
      return nodes;
    }

    case "blob": {
      const layers = c.layers ?? 1;
      const side = parseInt(String(c.side ?? "0"), 10);
      const palette = generateShadesBetweenTwoColors(colors[0]!, "#ffffff", layers + 5);
      const blobSize = 1.25 * Math.min(size.w, size.h);
      const half = blobSize / 2;
      const fill = mode === "fill" ? palette[0] : "none";
      const stroke = mode === "fill" ? "none" : palette[0];
      const nodes: SvgNode[] = [];

      if (side === 0 || side === 1) {
        for (let corner = 0; corner < 2; corner++) {
          const path = blobPath(blobSize, 6, 4, `${blobSeed}-${corner}`);
          const scaleStep = 1 / layers;
          const tx = corner % 2 === 0 ? -half : half + (size.w - blobSize);
          const ty = corner % 2 === side ? half + (size.h - blobSize) : -half;
          for (let layer = 0; layer < layers; layer++) {
            nodes.push(
              node(
                "g",
                { transform: `translate(${tx} ${ty}) scale(${scaleStep * (layer + 1)})` },
                [node("path", { d: path, fill, stroke, strokeWidth: strokeW })]
              )
            );
          }
        }
      } else if (side === 3) {
        for (let layer = 0; layer < layers + 5; layer++) {
          const s = blobSize - 25 * layer;
          const path = blobPath(s, 6, 4, `${blobSeed}-center-${layer}`);
          const tx = (size.w - s) / 2;
          const ty = (size.h - s) / 2;
          nodes.push(
            node("g", { transform: `translate(${tx} ${ty})` }, [
              node("path", {
                d: path,
                fill: palette[Math.max(0, palette.length - layer - 3)],
              }),
            ])
          );
        }
      } else {
        for (let qx = 0; qx < 2; qx++) {
          for (let qy = 0; qy < 2; qy++) {
            const path = blobPath(blobSize, 6, 4, `${blobSeed}-${qx}-${qy}`);
            const tx = qx % 2 === 0 ? -half : half + (size.w - blobSize);
            const ty = qy % 2 === 1 ? half + (size.h - blobSize) : -half;
            nodes.push(
              node("g", { transform: `translate(${tx} ${ty})` }, [
                node("path", { d: path, fill, stroke, strokeWidth: strokeW }),
              ])
            );
          }
        }
      }
      return nodes;
    }

    case "line": {
      const layers = (c.layers ?? 25) + 1;
      const xStep = size.w / (c.layers ?? 25);
      const yStep = size.h / (c.layers ?? 25);
      const opacity = (c.opacity ?? 80) / 100;
      const layout = c.layout ?? "horizontal";
      const nodes: SvgNode[] = [];
      if (layout === "horizontal" || layout === "grid") {
        for (let i = 0; i < layers; i++) {
          nodes.push(
            node("line", {
              x1: getRandomValue(64, -64, rng),
              y1: i * yStep + getRandomValue(64, 0, rng),
              x2: size.w + getRandomValue(64, 0, rng) + 64,
              y2: i * yStep + getRandomValue(64, 0, rng),
              stroke: colors[i % colors.length],
              strokeWidth: strokeW,
              opacity,
            })
          );
        }
      }
      if (layout === "vertical" || layout === "grid") {
        for (let i = 0; i < layers; i++) {
          nodes.push(
            node("line", {
              x1: i * xStep + getRandomValue(64, 0, rng),
              y1: getRandomValue(64, -64, rng),
              x2: i * xStep + getRandomValue(64, 0, rng),
              y2: size.h + getRandomValue(64, 0, rng) + 64,
              stroke: colors[i % colors.length],
              strokeWidth: strokeW,
              opacity,
            })
          );
        }
      }
      return nodes;
    }

    case "block": {
      const density = c.density ?? 25;
      const cell = Math.max(size.w, size.h) / density;
      const palette =
        colors.length > 1
          ? colors
          : ["#216e39", "#30a14e", "#40c463", "#9be9a8"];
      const zoom = ((c.zoom ?? 95) - 9) / 100;
      const nodes: SvgNode[] = [];
      for (let row = 0; row < density + 1; row++) {
        for (let col = 0; col < density; col++) {
          nodes.push(
            node("rect", {
              x: cell * col,
              y: cell * row,
              width: cell * zoom,
              height: cell * zoom,
              fill: palette[Math.floor(getRandomValue(palette.length, 0, rng))],
              rx: (cell * (c.roundness ?? 0)) / 100,
            })
          );
        }
      }
      return nodes;
    }

    case "step": {
      const layers = c.layers ?? 15;
      const steps = c.steps ?? 20;
      const gap = c.gap ?? 0;
      const layerH = size.h / layers + gap;
      const stepW = size.w / steps;
      const shades = generateShadesBetweenTwoColors(
        colors[0]!,
        colors[1] ?? colors[0]!,
        layers + 2
      );
      const offsets = [0, layerH / 5, (2 * layerH) / 5, (3 * layerH) / 5];
      const paths: SvgNode[] = [];
      for (let layer = -1; layer < layers; layer++) {
        let d = `M 0 ${layerH * layer}`;
        let parity = Math.floor(getRandomValue(9, 0, rng));
        for (let s = 1; s <= steps; s++) {
          if (parity % 2 === 0) {
            d += `V ${layer * layerH + offsets[Math.floor(getRandomValue(offsets.length, 0, rng))]!} H ${s * stepW} `;
          } else {
            d += `V ${layer * layerH - offsets[Math.floor(getRandomValue(offsets.length, 0, rng))]!} H ${s * stepW} `;
          }
          parity = Math.floor(getRandomValue(3, 0, rng));
        }
        d += `V ${size.h + 1} H 0 V ${layerH * layer} Z`;
        paths.push(
          node("g", undefined, [
            node("path", { d, fill: shades[layer + 1] ?? shades[shades.length - 1] }),
          ])
        );
      }
      return paths;
    }

    case "concentric": {
      const layers = c.layers ?? 10;
      const gap = c.gap ?? 10;
      const shape = c.shape ?? "blob";
      const shadeCount = layers + 6;
      const shades = generateShadesBetweenTwoColors(
        colors[0]!,
        colors[1] ?? colors[0]!,
        shadeCount
      ).reverse();

      if (shape === "circle") {
        const step = Math.max(size.w, size.h) / (2 * layers);
        const nodes: SvgNode[] = [];
        for (let i = layers + 5; i > 0; i--) {
          const color = shades[i] ?? shades[shades.length - 1]!;
          nodes.push(
            node("circle", {
              cx: size.w / 2 + 0.01 * (c.x ?? 0) * (size.w / 2),
              cy: size.h / 2 + 0.01 * (c.y ?? 0) * (size.h / 2),
              r: (step + gap) * i,
              fill: mode === "fill" ? color : "none",
              stroke: mode === "stroke" ? color : "none",
              strokeWidth: strokeW,
            })
          );
        }
        return nodes;
      }

      if (shape === "square") {
        const maxDim = Math.max(size.w, size.h) / layers + gap;
        const cx = size.w / 2 + 0.01 * (c.x ?? 0) * (size.w / 2);
        const cy = size.h / 2 + 0.01 * (c.y ?? 0) * (size.h / 2);
        const nodes: SvgNode[] = [];
        for (let i = layers; i > 0; i--) {
          const s = maxDim * i;
          const color = shades[i % shades.length]!;
          nodes.push(
            node("polygon", {
              points: `0 0, 0 ${s}, ${s} ${s}, ${s} 0`,
              transform: `translate(${cx - s / 2} ${cy - s / 2}) rotate(${c.angle ?? 0} ${s / 2} ${s / 2})`,
              fill: mode === "fill" ? color : "none",
              stroke: mode === "stroke" ? color : "none",
              strokeWidth: strokeW,
            })
          );
        }
        return nodes;
      }

      const blobSize = Math.max(size.w, size.h);
      const path = blobPath(blobSize, 8, 5, blobSeed);
      const scaleBase = (1 / layers) * 1.25 + gap / 100;
      const offsetX = blobSize === size.w ? blobSize : blobSize - size.w / 2;
      const offsetY = blobSize === size.h ? blobSize : blobSize - size.h;
      const nodes: SvgNode[] = [];
      for (let i = layers; i > 0; i--) {
        const scale = Number((scaleBase * i).toFixed(2));
        const color = shades[i] ?? shades[0]!;
        nodes.push(
          node(
            "g",
            {
              transform: `translate(${(1 - scale) * offsetX * 0.5 + offsetX * 0.5 * ((c.x ?? 0) / 100)} ${(1 - scale) * offsetY * 0.5 + offsetY * 0.5 * ((c.y ?? 0) / 100)}) scale(${scale})`,
            },
            [
              node("path", {
                d: path,
                fill: mode === "fill" ? color : "none",
                stroke: mode === "stroke" ? color : "none",
                strokeWidth: strokeW,
              }),
            ]
          )
        );
      }
      return nodes;
    }

    case "circle":
    case "scattered": {
      const count = c.number ?? c.circles ?? 50;
      const opacity = (c.opacity ?? 50) / 100;
      const shape = c.shape ?? "circle";
      const maxR = Math.min(size.w, size.h) / 4;
      const minR = Math.min(size.w, size.h) / 10;
      const nodes: SvgNode[] = [];
      const shapeKinds = ["circle", "rectangle", "triangle", "blob"];

      for (let i = 0; i < count; i++) {
        let sx = getRandomValue(size.w, 0, rng);
        let sy = getRandomValue(size.h, 0, rng);
        if (bgType === "scattered") {
          switch (i % 4) {
            case 0:
              sx = getRandomValue(size.w / 2, size.w / 100, rng);
              sy = getRandomValue(size.h / 2, size.h / 100, rng);
              break;
            case 1:
              sx = getRandomValue(size.w, size.w / 2, rng);
              sy = getRandomValue(size.h / 2, size.h / 100, rng);
              break;
            case 2:
              sx = getRandomValue(size.w / 2, size.w / 100, rng);
              sy = getRandomValue(size.h, size.h / 2, rng);
              break;
            default:
              sx = getRandomValue(size.w, size.w / 2, rng);
              sy = getRandomValue(size.h, size.h / 2, rng);
          }
        }
        const color = colors[i % colors.length]!;
        const kind =
          shape === "circle"
            ? "circle"
            : shape === "rectangle"
              ? "rectangle"
              : shape === "blob"
                ? "blob"
                : shapeKinds[Math.floor(getRandomValue(shapeKinds.length, 0, rng))]!;

        if (kind === "circle") {
          const r = getRandomValue(maxR, minR, rng);
          nodes.push(
            node("circle", {
              cx: sx,
              cy: sy,
              r,
              fill: mode === "fill" ? color : "none",
              stroke: mode === "stroke" ? color : "none",
              strokeWidth: strokeW,
              opacity,
            })
          );
        } else if (kind === "rectangle") {
          const w = getRandomValue(maxR, minR, rng);
          nodes.push(
            node("rect", {
              x: sx,
              y: sy,
              width: w,
              height: w,
              fill: mode === "fill" ? color : "none",
              stroke: mode === "stroke" ? color : "none",
              strokeWidth: strokeW,
              opacity,
            })
          );
        } else if (kind === "triangle") {
          const s = getRandomValue(maxR, minR, rng);
          nodes.push(
            node("polygon", {
              points: `${sx},${sy - s} ${sx + s},${sy + s} ${sx - s},${sy + s}`,
              fill: mode === "fill" ? color : "none",
              stroke: mode === "stroke" ? color : "none",
              strokeWidth: strokeW,
              opacity,
            })
          );
        } else {
          const s = getRandomValue(maxR * 2, minR * 2, rng);
          const d = blobPath(s, 6, 4, `${blobSeed}-scattered-${i}`);
          nodes.push(
            node("path", {
              d,
              transform: `translate(${sx - s / 2} ${sy - s / 2})`,
              fill: mode === "fill" ? color : "none",
              stroke: mode === "stroke" ? color : "none",
              strokeWidth: strokeW,
              opacity,
            })
          );
        }
      }
      return nodes;
    }

    case "frame": {
      const density = c.density ?? 50;
      const cell = Math.max(size.w, size.h) / density;
      const palette =
        colors.length > 1
          ? colors
          : ["#216e39", "#30a14e", "#40c463", "#9be9a8"];
      const heights = [(3 * cell) / 4, cell, (3 * cell) / 2, 2 * cell, 2.5 * cell];
      const zoom = ((c.zoom ?? 50) - 9) / 100;
      const nodes: SvgNode[] = [];
      for (let col = 0; col < density + 1; col++) {
        let y = 0;
        while (y < size.h) {
          const h = heights[Math.floor(getRandomValue(heights.length, 0, rng))]!;
          const filled = Math.floor(getRandomValue(2, 0, rng)) === 1;
          const color = palette[Math.floor(getRandomValue(palette.length, 0, rng))]!;
          nodes.push(
            node("rect", {
              x: cell * col,
              y,
              width: cell * zoom,
              height: h * zoom,
              fill: filled ? color : "none",
              stroke: color,
              strokeWidth: 3,
            })
          );
          y += h;
        }
      }
      return nodes;
    }

    case "mirror": {
      const count = c.number ?? 20;
      const gapFactor = (c.gap ?? 10) / 10;
      const step = Math.max(size.w, size.h) / count;
      const opacity = (c.opacity ?? 80) / 100;
      const shape = c.shape ?? "circle";
      const color = colors[0]!;
      const nodes: SvgNode[] = [];
      for (let i = 0; i < count; i++) {
        const radius = step * (i * gapFactor);
        if (shape === "circle") {
          nodes.push(
            node("circle", { cx: 0, cy: size.h / 2, r: radius, stroke: color, strokeWidth: strokeW, fill: "none", opacity }),
            node("circle", { cx: size.w, cy: size.h / 2, r: radius, stroke: color, strokeWidth: strokeW, fill: "none", opacity }),
            node("circle", { cx: size.w / 2, cy: 0, r: radius, stroke: color, strokeWidth: strokeW, fill: "none", opacity }),
            node("circle", { cx: size.w / 2, cy: size.h, r: radius, stroke: color, strokeWidth: strokeW, fill: "none", opacity })
          );
        } else {
          const o = radius;
          nodes.push(
            node("rect", { x: (size.w - o) / 2, y: -o / 2, width: o, height: o, stroke: color, strokeWidth: strokeW, fill: "none", opacity }),
            node("rect", { x: (size.w - o) / 2, y: size.h - o / 2, width: o, height: o, stroke: color, strokeWidth: strokeW, fill: "none", opacity }),
            node("rect", { x: size.w - o / 2, y: (size.h - o) / 2, width: o, height: o, stroke: color, strokeWidth: strokeW, fill: "none", opacity }),
            node("rect", { x: -o / 2, y: (size.h - o) / 2, width: o, height: o, stroke: color, strokeWidth: strokeW, fill: "none", opacity })
          );
        }
      }
      return nodes;
    }

    case "scribbles": {
      const count = c.number ?? 50;
      const step = Math.max(size.w, size.h) / 4;
      const opacity = (c.opacity ?? 80) / 100;
      const nodes: SvgNode[] = [];
      for (let i = 0; i < count; i++) {
        let point: [number, number] = [
          getRandomValue(size.w, 0, rng),
          getRandomValue(size.h, 0, rng),
        ];
        let d = `M ${point[0]} ${point[1]} S`;
        for (let j = 0; j < 2; j++) {
          point = scribbleNext(point, step, size, rng);
          d += ` ${point[0] / 2} ${point[1] / 2} ${point[0]} ${point[1]}`;
        }
        nodes.push(
          node("path", {
            d,
            stroke: colors[i % colors.length],
            strokeWidth: strokeW,
            fill: "none",
            opacity,
            strokeLinecap: "round",
          })
        );
      }
      return nodes;
    }

    case "rain": {
      const layers = c.layers ?? 25;
      const spacing = Math.max(size.w, size.h) / layers;
      const opacity = (c.opacity ?? 80) / 100;
      const right = c.direction !== "left";
      const nodes: SvgNode[] = [];
      for (let i = 0; i < layers; i++) {
        const x = right ? spacing * i : spacing * (i + 1);
        let y = getRandomValue(3, 0, rng) % 2 === 0
          ? getRandomValue(128, 16, rng)
          : -getRandomValue(128, 16, rng);
        const lines = Math.floor(getRandomValue(8, 3, rng));
        for (let j = 0; j < lines; j++) {
          const y1 = getRandomValue(size.h / lines, size.h / (1.5 * lines), rng);
          const dx = getRandomValue(y1, y1 / 2, rng);
          const sw = getRandomValue(40, 16, rng);
          nodes.push(
            node("line", {
              x1: x,
              y1: y,
              x2: right ? x + dx : x - dx,
              y2: y + dx,
              stroke: colors[Math.floor(getRandomValue(100, 0, rng)) % colors.length],
              strokeWidth: sw,
              strokeLinecap: "round",
              opacity,
            })
          );
          y += y1 + dx;
        }
      }
      return nodes;
    }

    case "code": {
      const layers = c.layers ?? 25;
      const layerH = size.h / layers;
      const pad = layerH / 8;
      const minW = size.w / 10;
      const opacity = (c.opacity ?? 100) / 100;
      const nodes: SvgNode[] = [];
      for (let row = 0; row < layers; row++) {
        let x = -30;
        while (x < size.w) {
          let w = getRandomValue(size.w / 3, size.w / 10, rng);
          if (w < minW && x + w < size.w) w = minW;
          nodes.push(
            node("rect", {
              x: x + 10,
              y: layerH * row + pad,
              width: w,
              height: layerH - 2 * pad,
              rx: (layerH - 2 * pad) / 2,
              fill: colors[Math.floor(getRandomValue(100, 0, rng)) % colors.length],
              opacity,
            })
          );
          x += w + 10;
        }
      }
      return nodes;
    }

    case "material": {
      const diag = Math.sqrt(size.w * size.w + size.h * size.h);
      const half = diag / 2;
      const slices = Math.floor(getRandomValue(10, 5, rng));
      const angleStep = 360 / slices;
      const radius = Math.max(size.w / 2, size.h / 2);
      const nodes: SvgNode[] = [
        node("defs", undefined, [
          node("filter", {
            id: "f1",
            x: "-200%",
            y: "-200%",
            width: "500%",
            height: "500%",
          }, [node("feGaussianBlur", { stdDeviation: 25 })]),
        ]),
      ];
      for (let i = 0; i < slices; i++) {
        const cx = radius * Math.cos((Math.PI / 180) * (angleStep * (i + 1))) + size.w / 2;
        const cy = radius * Math.sin((Math.PI / 180) * (angleStep * (i + 1))) + size.h / 2;
        const rot = Math.floor(getRandomValue(25, 0, rng));
        const fill = colors[i % colors.length]!;
        nodes.push(
          node(
            "g",
            { transform: `translate(${cx - diag} ${cy - half}) rotate(${rot} ${diag / 2} ${half})` },
            [
              node("rect", { x: 8, y: 8, width: 3 * diag, height: half, fill: "black", opacity: 0.4, filter: "url(#f1)" }),
              node("rect", { x: -8, y: -8, width: 3 * diag, height: half, fill: "black", opacity: 0.4, filter: "url(#f1)" }),
              node("rect", { x: 0, y: 0, width: 3 * diag, height: half, fill }),
            ]
          )
        );
      }
      return nodes;
    }

    case "split": {
      const span = 2 * Math.max(size.w, size.h);
      const cx = size.w / 2 + 0.02 * (c.x ?? 0) * (size.w / 2);
      const cy = size.h / 2 + 0.02 * (c.y ?? 0) * (size.h / 2);
      const color = colors[0]!;
      const angle = c.angle ?? 45;
      if (c.shape === "rectangle") {
        const ox = -size.w / 2 + 0.02 * (c.x ?? 0) * (size.w / 2);
        const oy = -size.h / 2 + 0.02 * (c.y ?? 0) * (size.h / 2);
        return [
          node("rect", {
            x: ox,
            y: oy,
            width: span,
            height: span,
            transform: `rotate(${angle} ${ox + span / 2} ${oy + span / 2})`,
            fill: mode === "fill" ? color : "none",
            stroke: mode === "stroke" ? color : "none",
            strokeWidth: strokeW,
          }),
        ];
      }
      return [
        node("circle", {
          cx,
          cy,
          r: span / 2,
          fill: mode === "fill" ? color : "none",
          stroke: mode === "stroke" ? color : "none",
          strokeWidth: strokeW,
        }),
      ];
    }

    case "sheet": {
      const density = c.density ?? 60;
      const spacing = size.w / density;
      const topCurve = c.topCurve ?? 150;
      const bottomCurve = c.bottomCurve ?? 250;
      const direction = c.direction ?? "vertical";
      const color = colors[0] ?? "#6366f1";
      const nodes: SvgNode[] = [];
      for (let i = -25; i < density + 50; i++) {
        if (direction === "vertical" || direction === "mixed") {
          const x = i * spacing;
          nodes.push(
            node("path", {
              d: `M ${x} 0 C ${x - topCurve} ${size.h / 2}, ${x + bottomCurve} ${size.h / 2}, ${x} ${size.h}`,
              fill: "none",
              stroke: color,
              strokeWidth: 3,
            })
          );
        }
        if (direction === "horizontal" || direction === "mixed") {
          const y = i * spacing;
          nodes.push(
            node("path", {
              d: `M 0 ${y} C ${size.w / 2} ${y - topCurve}, ${size.w / 2} ${y + bottomCurve}, ${size.w} ${y}`,
              fill: "none",
              stroke: color,
              strokeWidth: 3,
            })
          );
        }
      }
      return nodes;
    }

    case "confetti": {
      const count = c.number ?? 120;
      const minSize = c.minSize ?? 6;
      const maxSize = c.maxSize ?? 24;
      const opacity = (c.opacity ?? 90) / 100;
      const shape = (c.shape ?? "mixed").toLowerCase();
      const kinds =
        shape === "mixed"
          ? ["circle", "rect", "triangle", "line"]
          : shape === "rectangle"
            ? ["rect"]
            : shape === "triangle"
              ? ["triangle"]
              : shape === "line"
                ? ["line"]
                : ["circle"];
      const nodes: SvgNode[] = [];
      for (let i = 0; i < count; i++) {
        const x = getRandomValue(size.w, 0, rng);
        const y = getRandomValue(size.h, 0, rng);
        const s = minSize + getRandomValue(maxSize - minSize, 0, rng);
        const color = colors[Math.floor(getRandomValue(colors.length, 0, rng))]!;
        const rot = getRandomValue(360, 0, rng);
        const kind = kinds[Math.floor(getRandomValue(kinds.length, 0, rng))]!;
        if (kind === "circle") {
          nodes.push(node("circle", { cx: x, cy: y, r: s / 2, fill: color, opacity }));
        } else if (kind === "rect") {
          const h = s * (0.3 + 0.7 * getRandomValue(1, 0, rng));
          nodes.push(
            node("rect", {
              x: x - s / 2,
              y: y - h / 2,
              width: s,
              height: h,
              fill: color,
              opacity,
              transform: `rotate(${rot.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})`,
            })
          );
        } else if (kind === "triangle") {
          const r = s / 2;
          const points = [
            [x, y - r],
            [x + 0.866 * r, y + 0.5 * r],
            [x - 0.866 * r, y + 0.5 * r],
          ]
            .map((p) => `${p[0]!.toFixed(1)},${p[1]!.toFixed(1)}`)
            .join(" ");
          nodes.push(
            node("polygon", {
              points,
              fill: color,
              opacity,
              transform: `rotate(${rot.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})`,
            })
          );
        } else {
          const len = s * (1 + getRandomValue(1, 0, rng));
          nodes.push(
            node("line", {
              x1: x,
              y1: y,
              x2: x + len,
              y2: y,
              stroke: color,
              strokeWidth: Math.max(1.5, s / 6),
              opacity,
              transform: `rotate(${rot.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})`,
            })
          );
        }
      }
      return nodes;
    }

    case "low-poly": {
      const cellSize = c.cellSize ?? 80;
      const chaos = ((c.chaos ?? 60) / 100) * cellSize * 0.8;
      const cols = Math.ceil(size.w / cellSize) + 2;
      const rows = Math.ceil(size.h / cellSize) + 2;
      const grid: [number, number][][] = [];
      for (let row = 0; row <= rows; row++) {
        grid[row] = [];
        for (let col = 0; col <= cols; col++) {
          const x = (col - 1) * cellSize;
          const y = (row - 1) * cellSize;
          const edge = row === 0 || row === rows || col === 0 || col === cols;
          const jitterX = edge ? 0 : (getRandomValue(1, 0, rng) - 0.5) * 2 * chaos;
          const jitterY = edge ? 0 : (getRandomValue(1, 0, rng) - 0.5) * 2 * chaos;
          grid[row]![col] = [x + jitterX, y + jitterY];
        }
      }
      const nodes: SvgNode[] = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const a = grid[row]![col]!;
          const b = grid[row]![col + 1]!;
          const d = grid[row + 1]![col]!;
          const e = grid[row + 1]![col + 1]!;
          const cx1 = (a[0] + b[0] + d[0]) / 3;
          const cy1 = (a[1] + b[1] + d[1]) / 3;
          const t1 = Math.min(
            1,
            Math.sqrt((cx1 / size.w) ** 2 + (cy1 / size.h) ** 2) / Math.SQRT2
          );
          nodes.push(
            node("polygon", {
              points: `${a[0].toFixed(1)},${a[1].toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)} ${d[0].toFixed(1)},${d[1].toFixed(1)}`,
              fill: interpolatePalette(colors, t1),
            })
          );
          const cx2 = (b[0] + e[0] + d[0]) / 3;
          const cy2 = (b[1] + e[1] + d[1]) / 3;
          const t2 = Math.min(
            1,
            Math.sqrt((cx2 / size.w) ** 2 + (cy2 / size.h) ** 2) / Math.SQRT2
          );
          nodes.push(
            node("polygon", {
              points: `${b[0].toFixed(1)},${b[1].toFixed(1)} ${e[0].toFixed(1)},${e[1].toFixed(1)} ${d[0].toFixed(1)},${d[1].toFixed(1)}`,
              fill: interpolatePalette(colors, t2),
            })
          );
        }
      }
      return nodes;
    }

    default:
      return [];
  }
}
