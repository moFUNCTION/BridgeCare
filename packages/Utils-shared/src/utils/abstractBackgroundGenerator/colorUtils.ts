export function convertHexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "").trim();
  if (normalized.length !== 6) return [0, 0, 0];
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}

export function convertRgbToHex([r, g, b]: [number, number, number]): string {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function generateShadesBetweenTwoColors(
  from: string,
  to: string,
  steps: number
): string[] {
  if (steps <= 1) return [from];
  const a = convertHexToRgb(from);
  const b = convertHexToRgb(to || "#ffffff");
  const shades: string[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    shades.push(
      convertRgbToHex([
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
      ])
    );
  }
  return shades;
}

export function interpolatePalette(colors: string[], position: number): string {
  if (!colors.length) return "#6366f1";
  if (colors.length === 1) return colors[0]!;
  const scaled = Math.max(0, Math.min(1, position)) * (colors.length - 1);
  const index = Math.min(Math.floor(scaled), colors.length - 2);
  const t = scaled - index;
  const from = convertHexToRgb(colors[index]!);
  const to = convertHexToRgb(colors[Math.min(index + 1, colors.length - 1)]!);
  return convertRgbToHex([
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t,
    from[2] + (to[2] - from[2]) * t,
  ]);
}
