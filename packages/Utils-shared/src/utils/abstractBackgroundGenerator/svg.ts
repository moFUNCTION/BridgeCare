import type { SvgAttrs, SvgNode } from "./types";

function escapeAttr(value: string | number): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function camelToKebab(str: string): string {
  return str.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);
}

function attrsToString(attrs: SvgAttrs = {}): string {
  return Object.entries(attrs)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${camelToKebab(k)}="${escapeAttr(v as string | number)}"`)
    .join(" ");
}

export function node(
  tag: string,
  attrs?: SvgAttrs,
  children?: SvgNode[],
): SvgNode {
  return { tag, attrs, children };
}

export function renderNode(n: SvgNode): string {
  const attrs = attrsToString(n.attrs);
  const open = attrs ? `<${n.tag} ${attrs}>` : `<${n.tag}>`;
  if (n.text !== undefined) return `${open}${n.text}</${n.tag}>`;
  if (!n.children?.length) {
    const attrPart = attrs ? ` ${attrs}` : "";
    return `<${n.tag}${attrPart} />`;
  }
  return `${open}${n.children.map(renderNode).join("")}</${n.tag}>`;
}

export function renderNodes(nodes: SvgNode[]): string {
  return nodes.map(renderNode).join("");
}

export interface FullSvgOptions {
  width: number;
  height: number;
  bgColor: string;
  transparent?: boolean;
  nodes: SvgNode[];
  blur?: number;
  patternBlur?: number;
}

export function buildFullSvg({
  width,
  height,
  bgColor,
  transparent = false,
  nodes,
  blur = 0,
  patternBlur = 0,
}: FullSvgOptions): string {
  const stdDev = patternBlur / 10 || 0;
  const scale = blur > 0 ? 1 + blur / 1000 : 1;
  const inner = renderNodes(nodes);
  const filterAttr = stdDev > 0 ? ' filter="url(#canvas-blur)"' : "";
  const transformAttr = scale !== 1 ? ` transform="scale(${scale})"` : "";
  const defs =
    stdDev > 0
      ? `<defs><filter id="canvas-blur"><feGaussianBlur in="SourceGraphic" stdDeviation="${stdDev}"/></filter></defs>`
      : "";
  const bgRect = transparent
    ? ""
    : `<rect class="bg" x="0" y="0" width="${width}" height="${height}" fill="${bgColor}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" preserveAspectRatio="none">
  ${defs}
  ${bgRect}
  <g${filterAttr}${transformAttr}>${inner}</g>
</svg>`;
}

export async function svgToPngBlob(
  svg: string,
  width: number,
  height: number,
  scale = 2,
  transparent = false,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(
      new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
    );
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas not supported"));
        return;
      }
      if (!transparent) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("PNG export failed")),
        "image/png",
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load SVG"));
    };
    img.src = url;
  });
}
