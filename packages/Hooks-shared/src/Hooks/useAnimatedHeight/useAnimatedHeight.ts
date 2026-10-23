import { useEffect, useState } from "react";

export interface UseAnimatedHeightByCountOptions {
  itemCount: number;
  itemHeight?: number;
  spacing?: number;
  extra?: number;
}

export function useAnimatedHeightByCount({
  itemCount,
  itemHeight = 60,
  spacing = 8,
  extra = 0,
}: UseAnimatedHeightByCountOptions): string {
  const [height, setHeight] = useState<string>("auto");

  useEffect(() => {
    const totalHeight =
      itemCount > 0
        ? itemCount * itemHeight + (itemCount - 1) * spacing + extra
        : 0;
    setHeight(`${totalHeight}px`);
  }, [itemCount, itemHeight, spacing, extra]);

  return height;
}
