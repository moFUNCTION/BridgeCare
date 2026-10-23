import React, { useRef, useMemo, useState, useEffect, CSSProperties } from "react";
import { motion } from "motion/react";

export const SPLIT_ANIMATION_PRESETS: Record<
  string,
  { from: Record<string, any>; to: Record<string, any> }
> = {
  fadeUp: {
    from: { opacity: 0, y: 40 },
    to: { opacity: 1, y: 0 },
  },
  fadeDown: {
    from: { opacity: 0, y: -40 },
    to: { opacity: 1, y: 0 },
  },
  fadeLeft: {
    from: { opacity: 0, x: 50 },
    to: { opacity: 1, x: 0 },
  },
  fadeRight: {
    from: { opacity: 0, x: -50 },
    to: { opacity: 1, x: 0 },
  },
  zoomIn: {
    from: { opacity: 0, scale: 0.2 },
    to: { opacity: 1, scale: 1 },
  },
  blurFade: {
    from: { opacity: 0, filter: "blur(12px)", y: 25 },
    to: { opacity: 1, filter: "blur(0px)", y: 0 },
  },
  rotateX: {
    from: { opacity: 0, rotateX: -90, transformPerspective: 1000 },
    to: { opacity: 1, rotateX: 0, transformPerspective: 1000 },
  },
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
};

const EASING_MAP: Record<string, any> = {
  "power3.out": [0.215, 0.61, 0.355, 1],
  "power2.out": [0.25, 0.46, 0.45, 0.94],
  "power4.out": [0.165, 0.84, 0.44, 1],
  "back.out(1.7)": [0.34, 1.56, 0.64, 1],
  "back.out": [0.34, 1.56, 0.64, 1],
  "elastic.out(1, 0.3)": [0.175, 0.885, 0.32, 1.275],
  "bounce.out": [0.34, 1.56, 0.64, 1],
};

export interface SplitTextProps {
  text?: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: "words" | "chars" | "lines" | "words, chars" | string;
  animation?: keyof typeof SPLIT_ANIMATION_PRESETS | string;
  from?: Record<string, any>;
  to?: Record<string, any>;
  threshold?: number;
  rootMargin?: string;
  /** When true, animates immediately instead of waiting for scroll into view. */
  playImmediately?: boolean;
  disableScrollTrigger?: boolean;
  /** When true, animates only the first time text enters view. When false (default), replays on scroll. */
  once?: boolean;
  textAlign?: CSSProperties["textAlign"];
  tag?: keyof React.JSX.IntrinsicElements;
  as?: keyof React.JSX.IntrinsicElements;
  onLetterAnimationComplete?: () => void;
  style?: CSSProperties;
}

export const SplitText = ({
  text = "",
  className = "",
  delay = 50,
  duration = 0.5,
  ease = "power3.out",
  splitType = "words",
  animation = "fadeUp",
  from,
  to,
  threshold = 0.1,
  rootMargin = "0px",
  playImmediately = false,
  disableScrollTrigger,
  once = false,
  textAlign = "center",
  tag,
  as,
  onLetterAnimationComplete,
  style,
}: SplitTextProps) => {
  const Component = as || tag || "span";
  const ref = useRef<HTMLElement>(null);

  const shouldPlayImmediately = playImmediately || disableScrollTrigger || false;
  const [inView, setInView] = useState(shouldPlayImmediately);

  useEffect(() => {
    if (shouldPlayImmediately) {
      setInView(true);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const isVisibleNow =
      rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
      rect.bottom > 0;

    if (isVisibleNow) {
      setInView(true);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldPlayImmediately, once, threshold, rootMargin, text]);

  const isInView = shouldPlayImmediately || inView;

  const preset = SPLIT_ANIMATION_PRESETS[animation] || SPLIT_ANIMATION_PRESETS.fadeUp;
  const initialStyles = from || preset.from;
  const targetStyles = to || preset.to;
  const resolvedEase = EASING_MAP[ease] || ease || [0.215, 0.61, 0.355, 1];

  const flexJustify = useMemo((): CSSProperties["justifyContent"] => {
    if (!textAlign || textAlign === "inherit") return undefined;
    if (textAlign === "center") return "center";
    if (textAlign === "end" || textAlign === "right") return "flex-end";
    if (textAlign === "start" || textAlign === "left") return "flex-start";
    return undefined;
  }, [textAlign]);

  // Structure segments according to splitType
  const { renderedElements, totalItems } = useMemo(() => {
    const rawText = text || "";
    const normSplit = (splitType || "words").toLowerCase();

    if (normSplit.includes("line")) {
      const lines = rawText.split("\n");
      return {
        totalItems: lines.length,
        renderedElements: lines.map((line, lIdx) => ({
          key: `line-${lIdx}`,
          type: "line" as const,
          content: line,
          globalIndex: lIdx,
        })),
      };
    }

    if (normSplit.includes("char") && normSplit.includes("word")) {
      const words = rawText.split(" ");
      let charCounter = 0;
      const elements = words.map((word, wIdx) => {
        const chars = word.split("").map((ch) => ({
          char: ch,
          globalIndex: charCounter++,
        }));
        return {
          key: `word-${wIdx}`,
          type: "word-chars" as const,
          chars,
          isLastWord: wIdx === words.length - 1,
        };
      });
      return {
        totalItems: charCounter,
        renderedElements: elements,
      };
    }

    if (normSplit.includes("char")) {
      const chars = rawText.split("");
      return {
        totalItems: chars.length,
        renderedElements: chars.map((ch, cIdx) => ({
          key: `char-${cIdx}`,
          type: "char" as const,
          content: ch,
          globalIndex: cIdx,
        })),
      };
    }

    // Default: Words
    const words = rawText.split(" ");
    return {
      totalItems: words.length,
      renderedElements: words.map((word, wIdx) => ({
        key: `word-${wIdx}`,
        type: "word" as const,
        content: word,
        globalIndex: wIdx,
        isLastWord: wIdx === words.length - 1,
      })),
    };
  }, [text, splitType]);

  return React.createElement(
    Component,
    {
      ref,
      className: `split-text-container ${className}`.trim(),
      style: {
        display: "flex",
        flexWrap: "wrap",
        width: "100%",
        margin: 0,
        padding: 0,
        lineHeight: "inherit",
        fontSize: "inherit",
        fontWeight: "inherit",
        color: "inherit",
        letterSpacing: "inherit",
        perspective: 1000,
        ...(textAlign ? { textAlign } : {}),
        ...(flexJustify ? { justifyContent: flexJustify } : {}),
        ...style,
      },
    },
    renderedElements.map((item: any) => {
      if (item.type === "word-chars") {
        return (
          <span
            key={item.key}
            style={{
              display: "inline-flex",
              whiteSpace: "nowrap",
              lineHeight: "inherit",
              marginRight: item.isLastWord ? "0" : "0.28em",
            }}
          >
            {item.chars.map((c: any) => {
              const itemDelay = (c.globalIndex * delay) / 1000;
              return (
                <motion.span
                  key={c.globalIndex}
                  style={{
                    display: "inline-block",
                    willChange: "transform, opacity, filter",
                    lineHeight: "inherit",
                  }}
                  initial={initialStyles}
                  animate={isInView ? targetStyles : initialStyles}
                  transition={{
                    duration,
                    delay: itemDelay,
                    ease: resolvedEase,
                  }}
                  onAnimationComplete={
                    c.globalIndex === totalItems - 1
                      ? onLetterAnimationComplete
                      : undefined
                  }
                >
                  {c.char === " " ? "\u00A0" : c.char}
                </motion.span>
              );
            })}
          </span>
        );
      }

      const itemDelay = (item.globalIndex * delay) / 1000;

      if (item.type === "line") {
        return (
          <span
            key={item.key}
            style={{
              display: "block",
              width: "100%",
              overflow: "hidden",
              lineHeight: "inherit",
            }}
          >
            <motion.span
              style={{
                display: "block",
                willChange: "transform, opacity, filter",
                lineHeight: "inherit",
              }}
              initial={initialStyles}
              animate={isInView ? targetStyles : initialStyles}
              transition={{
                duration,
                delay: itemDelay,
                ease: resolvedEase,
              }}
              onAnimationComplete={
                item.globalIndex === totalItems - 1
                  ? onLetterAnimationComplete
                  : undefined
              }
            >
              {item.content || "\u00A0"}
            </motion.span>
          </span>
        );
      }

      if (item.type === "char") {
        return (
          <motion.span
            key={item.key}
            style={{
              display: "inline-block",
              willChange: "transform, opacity, filter",
              lineHeight: "inherit",
              whiteSpace: item.content === " " ? "pre" : "normal",
            }}
            initial={initialStyles}
            animate={isInView ? targetStyles : initialStyles}
            transition={{
              duration,
              delay: itemDelay,
              ease: resolvedEase,
            }}
            onAnimationComplete={
              item.globalIndex === totalItems - 1
                ? onLetterAnimationComplete
                : undefined
            }
          >
            {item.content === " " ? "\u00A0" : item.content}
          </motion.span>
        );
      }

      // Default: word
      return (
        <motion.span
          key={item.key}
          style={{
            display: "inline-block",
            willChange: "transform, opacity, filter",
            lineHeight: "inherit",
            whiteSpace: "nowrap",
          }}
          initial={initialStyles}
          animate={isInView ? targetStyles : initialStyles}
          transition={{
            duration,
            delay: itemDelay,
            ease: resolvedEase,
          }}
          onAnimationComplete={
            item.globalIndex === totalItems - 1
              ? onLetterAnimationComplete
              : undefined
          }
        >
          {item.content}
          {!item.isLastWord && "\u00A0"}
        </motion.span>
      );
    })
  );
};

export default SplitText;
