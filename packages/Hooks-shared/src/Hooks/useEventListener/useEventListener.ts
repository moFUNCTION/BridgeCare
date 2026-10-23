import { useEffect, type RefObject } from "react";

export function useEventListener<K extends keyof WindowEventMap>(
  event: K,
  handler: (event: WindowEventMap[K]) => void,
  element?: RefObject<HTMLElement | null> | Window | Document | null
): void {
  useEffect(() => {
    const target =
      element && "current" in element ? element.current : element ?? window;
    if (!target) return;
    const fn = handler as EventListener;
    target.addEventListener(event, fn);
    return () => target.removeEventListener(event, fn);
  }, [event, handler, element]);
}
