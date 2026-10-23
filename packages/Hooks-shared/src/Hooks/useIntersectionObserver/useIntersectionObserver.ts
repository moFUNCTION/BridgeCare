import { useState, useRef, useEffect, useMemo, useCallback, type RefCallback } from "react";

export interface UseIntersectionObserverOptions {
  /** Whether the intersection observation should only trigger once. Default: false */
  once?: boolean;
  /** Intersection threshold. Can be 'some' (0), 'all' (1), or a numeric value (0 to 1). Default: 0 */
  amount?: "some" | "all" | number;
  /** Margin around the root element. Similar to CSS margin. Default: "0px" */
  margin?: string;
  /** Root element used for intersection. Default: null (viewport) */
  root?: Element | Document | null;
  /** Whether observation is enabled. Default: true */
  enabled?: boolean;
  /** Initial inView state before first observer execution. Default: false */
  initialInView?: boolean;
  /** Callback fired whenever intersection state changes */
  onChange?: (isIntersecting: boolean, entry: IntersectionObserverEntry) => void;
}

export interface UseIntersectionObserverReturn<T extends HTMLElement = HTMLElement> {
  /** Boolean indicating if the observed element is currently in view */
  inView: boolean;
  /** Alias for inView */
  isIntersecting: boolean;
  /** Ref callback and object to attach to the target element: `<div ref={ref} />` */
  ref: RefCallback<T | null> & { current: T | null };
  /** The latest IntersectionObserverEntry reported by the browser */
  entry: IntersectionObserverEntry | null;
}

export function useIntersectionObserver<T extends HTMLElement = HTMLElement>(
  options: UseIntersectionObserverOptions = {},
): UseIntersectionObserverReturn<T> {
  const {
    once = false,
    amount = 0,
    margin = "0px",
    root = null,
    enabled = true,
    initialInView = false,
    onChange,
  } = options;

  const [inView, setInView] = useState<boolean>(initialInView);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [element, setElement] = useState<T | null>(null);

  const rawRef = useRef<T | null>(null);

  // Dual ref: works as a callback ref (`ref={ref}`) and has `.current`
  const ref = useMemo(() => {
    const fn: any = (node: any) => {
      rawRef.current = node;
      if (!node) {
        setElement(null);
        fn.current = null;
        return;
      }

      // Automatically unwrap `display: contents` elements to observe their concrete child box
      const targetNode =
        node.style?.display === "contents" && node.firstElementChild
          ? (node.firstElementChild as T)
          : (node as T);

      setElement(targetNode);
      fn.current = targetNode;
    };
    fn.current = null;
    return fn;
  }, []);

  const threshold = useMemo(() => {
    if (amount === "all") return 1.0;
    if (amount === "some") return 0.0;
    if (typeof amount === "number") return Math.min(Math.max(amount, 0), 1);
    return 0.0;
  }, [amount]);

  useEffect(() => {
    if (!enabled || !element) {
      if (!enabled) setInView(false);
      return;
    }

    // Use current document/window context (handles <iframe> environments cleanly)
    const win = element.ownerDocument?.defaultView || (typeof window !== "undefined" ? window : null);
    if (!win) return;

    // 1. Immediate bounding box check on mount
    const checkBoundingBox = () => {
      try {
        const rect = element.getBoundingClientRect();
        const vh = win.innerHeight || 1000;
        const vw = win.innerWidth || 1000;

        const isVisible =
          rect.top < vh &&
          rect.bottom > 0 &&
          rect.left < vw &&
          rect.right > 0;

        if (isVisible) {
          setInView(true);
        }
      } catch (e) {}
    };

    checkBoundingBox();

    // 2. IntersectionObserver initialization
    const ObserverClass = win.IntersectionObserver || (typeof window !== "undefined" ? window.IntersectionObserver : null);
    if (!ObserverClass) {
      setInView(true);
      return;
    }

    let observer: IntersectionObserver | null = null;

    try {
      observer = new ObserverClass(
        ([latestEntry]) => {
          if (!latestEntry) return;

          const isNowIntersecting = latestEntry.isIntersecting;
          setEntry(latestEntry);
          setInView(isNowIntersecting);

          if (onChange) {
            onChange(isNowIntersecting, latestEntry);
          }

          if (isNowIntersecting && once) {
            observer?.disconnect();
          }
        },
        {
          root: root || null,
          rootMargin: margin,
          threshold,
        },
      );

      observer.observe(element);
    } catch (e) {
      setInView(true);
    }

    return () => {
      observer?.disconnect();
    };
  }, [element, enabled, once, threshold, margin, root, onChange]);

  return {
    inView,
    isIntersecting: inView,
    ref,
    entry,
  };
}
