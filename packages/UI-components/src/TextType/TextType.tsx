'use client';

import React, {
  useEffect,
  useRef,
  useState,
  createElement,
  useMemo,
  useCallback,
  type CSSProperties,
} from 'react';
import { gsap } from 'gsap';
import './TextType.css';

export interface TextTypeProps {
  text: string | string[];
  as?: keyof React.JSX.IntrinsicElements;
  typingSpeed?: number;
  initialDelay?: number;
  pauseDuration?: number;
  deletingSpeed?: number;
  loop?: boolean;
  className?: string;
  showCursor?: boolean;
  hideCursorWhileTyping?: boolean;
  cursorCharacter?: string;
  cursorClassName?: string;
  cursorBlinkDuration?: number;
  textColors?: string[];
  variableSpeed?: { min: number; max: number };
  onSentenceComplete?: (text: string, index: number) => void;
  startOnVisible?: boolean;
  /**
   * Only applies when `startOnVisible` is true. Same idea as `SplitText`: if `true`, the typing
   * run starts once when the block first enters the viewport and is not reset when you scroll away.
   * If `false` (default), leaving and re-entering the viewport resets and replays the animation.
   */
  once?: boolean;
  /** Root margin for the visibility observer when `startOnVisible` is true. Default `0px`. */
  rootMargin?: string;
  reverseMode?: boolean;
  /**
   * When true (default), layout width matches the full current sentence from the start (invisible
   * measure text) so the box does not grow/shrink as characters type. When false, width follows the
   * partial text only (legacy behavior).
   */
  reserveWidth?: boolean;
  /** Horizontal alignment of the typed line (reserve-width mode uses grid `justify-self` via `data-text-align`). */
  textAlign?: CSSProperties['textAlign'];
  style?: CSSProperties;
}

const TextType = ({
  text,
  as: Component = 'div',
  typingSpeed = 50,
  initialDelay = 0,
  pauseDuration = 2000,
  deletingSpeed = 30,
  loop = true,
  className = '',
  showCursor = true,
  hideCursorWhileTyping = false,
  cursorCharacter = '|',
  cursorClassName = '',
  cursorBlinkDuration = 0.5,
  textColors = [],
  variableSpeed,
  onSentenceComplete,
  startOnVisible = false,
  once = false,
  rootMargin = "0px",
  reverseMode = false,
  reserveWidth = true,
  textAlign,
  style: rootStyle,
  ...props
}: TextTypeProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(!startOnVisible);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLElement>(null);

  const textArray = useMemo(() => (Array.isArray(text) ? text : [text]), [text]);

  const resetTypingState = useCallback(() => {
    setDisplayedText('');
    setCurrentCharIndex(0);
    setIsDeleting(false);
    setCurrentTextIndex(0);
  }, []);

  const getRandomSpeed = useCallback(() => {
    if (!variableSpeed) return typingSpeed;
    const { min, max } = variableSpeed;
    return Math.random() * (max - min) + min;
  }, [variableSpeed, typingSpeed]);

  const getCurrentTextColor = (): string | undefined => {
    if (textColors.length === 0) return undefined;
    return textColors[currentTextIndex % textColors.length];
  };

  useEffect(() => {
    if (!startOnVisible || !containerRef.current) return;

    const el = containerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (once) {
              observer.disconnect();
            }
          } else if (!once) {
            setIsVisible(false);
            resetTypingState();
          }
        });
      },
      { threshold: 0.1, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [startOnVisible, once, rootMargin, resetTypingState]);

  useEffect(() => {
    if (showCursor && cursorRef.current) {
      gsap.set(cursorRef.current, { opacity: 1 });
      gsap.to(cursorRef.current, {
        opacity: 0,
        duration: cursorBlinkDuration,
        repeat: -1,
        yoyo: true,
        ease: 'power2.inOut'
      });
    }
  }, [showCursor, cursorBlinkDuration]);

  useEffect(() => {
    if (!isVisible) return;

    let timeout: ReturnType<typeof setTimeout>;
    const currentText = textArray[currentTextIndex];
    const processedText = reverseMode ? currentText.split('').reverse().join('') : currentText;

    const executeTypingAnimation = () => {
      if (isDeleting) {
        if (displayedText === '') {
          setIsDeleting(false);
          if (currentTextIndex === textArray.length - 1 && !loop) {
            return;
          }

          onSentenceComplete?.(currentText, currentTextIndex);

          setCurrentTextIndex((prev) => (prev + 1) % textArray.length);
          setCurrentCharIndex(0);
          timeout = setTimeout(() => {}, pauseDuration);
        } else {
          timeout = setTimeout(() => {
            setDisplayedText((prev) => prev.slice(0, -1));
          }, deletingSpeed);
        }
      } else {
        if (currentCharIndex < processedText.length) {
          timeout = setTimeout(
            () => {
              setDisplayedText((prev) => prev + processedText[currentCharIndex]);
              setCurrentCharIndex((prev) => prev + 1);
            },
            variableSpeed ? getRandomSpeed() : typingSpeed
          );
        } else if (textArray.length >= 1) {
          if (!loop && currentTextIndex === textArray.length - 1) return;
          timeout = setTimeout(() => {
            setIsDeleting(true);
          }, pauseDuration);
        }
      }
    };

    if (currentCharIndex === 0 && !isDeleting && displayedText === '') {
      timeout = setTimeout(executeTypingAnimation, initialDelay);
    } else {
      executeTypingAnimation();
    }

    return () => clearTimeout(timeout);
  }, [
    currentCharIndex,
    displayedText,
    isDeleting,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
    textArray,
    currentTextIndex,
    loop,
    initialDelay,
    isVisible,
    reverseMode,
    variableSpeed,
    onSentenceComplete,
    getRandomSpeed
  ]);

  const shouldHideCursor =
    hideCursorWhileTyping && (currentCharIndex < textArray[currentTextIndex]?.length || isDeleting);

  const currentText = textArray[currentTextIndex] ?? '';
  const processedTextForLayout = reverseMode
    ? currentText.split('').reverse().join('')
    : currentText;

  const contentStyle: React.CSSProperties = {
    color: getCurrentTextColor() || 'inherit',
  };

  const contentSpan = createElement(
    'span',
    { className: 'text-type__content', style: contentStyle },
    displayedText
  );

  const cursorEl =
    showCursor &&
    createElement(
      'span',
      {
        ref: cursorRef,
        className: `text-type__cursor ${cursorClassName} ${shouldHideCursor ? 'text-type__cursor--hidden' : ''}`,
      },
      cursorCharacter
    );

  const stacked = createElement(
    'span',
    { className: 'text-type__stack' },
    createElement(
      'span',
      {
        className: 'text-type__measure',
        'aria-hidden': true,
      },
      processedTextForLayout
    ),
    createElement('span', { className: 'text-type__line' }, contentSpan, cursorEl)
  );

  const rootStyleMerged: CSSProperties = {
    ...(textAlign !== undefined ? { textAlign } : {}),
    ...rootStyle,
  };

  const dataAlignProp =
    textAlign !== undefined && Boolean(textAlign)
      ? { 'data-text-align': String(textAlign) }
      : {};

  return reserveWidth
    ? createElement(
        Component as string,
        {
          ref: containerRef,
          className: `text-type text-type--reserve-width ${className}`,
          style: rootStyleMerged,
          ...dataAlignProp,
          ...props,
        },
        stacked
      )
    : createElement(
        Component as string,
        {
          ref: containerRef,
          className: `text-type ${className}`,
          style: rootStyleMerged,
          ...dataAlignProp,
          ...props,
        },
        contentSpan,
        cursorEl
      );
};

export default TextType;
