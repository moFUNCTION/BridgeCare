import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useForm } from "react-hook-form";
import type {
  Control,
  UseFormWatch,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormSetError,
  UseFormClearErrors,
} from "react-hook-form";
import type { z } from "zod";

/** Props passed to each step component (control, watch, errors, register, setValue). */
export type StepComponentProps<T extends Record<string, unknown>> = {
  control: Control<T, any, any>;
  watch: UseFormWatch<T>;
  errors: FieldErrors<T>;
  register: UseFormRegister<T>;
  setValue: UseFormSetValue<T>;
  setError: UseFormSetError<T>;
  clearErrors: UseFormClearErrors<T>;
  handleNext?: () => void;
  handlePrev?: () => void;
  goToStep?: (index: number) => void;
};

export type StepComponent<T extends Record<string, unknown>> =
  React.ComponentType<StepComponentProps<T>>;

export interface FormStepConfig<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  Component?: StepComponent<T>;
  fieldsRequired?: (keyof T)[];
  [key: string]: any;
}

export type TransitionOrientation = "left" | "right";

/**
 * Path in IndexedDB where form state is cached.
 * File/Blob fields are stored as Blob natively (not as text).
 */

export interface UseMultipleFormStepsOptions<
  T extends Record<string, unknown>,
> {
  steps: FormStepConfig<T>[];
  schema?: z.ZodType<T>;
  defaultValues?: T;
  mode?: "all" | "onChange" | "onBlur" | "onSubmit" | "onTouched";
  animationDirection?: "horizontal" | "vertical";
  /**
   * When set, form values and current step are cached in IndexedDB.
   * Files are stored as Blob (not text). Key is the path where data is stored.
   */
  /** Debounce ms for writing to IndexedDB (default 400) */
  indexedDBDebounceMs?: number;
  /** Called when the step changes */
  onStepChange?: (stepIndex: number) => void;
  /** Called when navigation is attempted with validation errors */
  onNavigationError?: (errors: unknown) => void;
  /**
   * Language / direction for animation. In RTL (ar), horizontal animation
   * direction is flipped so "next" and "prev" feel correct.
   */
  lang?: "en" | "ar";
  /**
   * Animation preset:
   * - "smooth" (default): Gentle spring with subtle scale
   * - "snappy": Quick, responsive iOS-style
   * - "bouncy": Playful with more spring bounce
   * - "minimal": Simple fade with no spatial movement
   */
  animationPreset?: "smooth" | "snappy" | "bouncy" | "minimal";
}

export interface WrapperTransitionStyles {
  transition: {
    type: string;
    stiffness?: number;
    damping?: number;
    mass?: number;
    duration?: number;
  };
  animate: { opacity: number; x?: number; y?: number; scale?: number };
  initial: {
    opacity: number;
    x?: string | number;
    y?: string | number;
    scale?: number;
  };
  exit?: {
    opacity: number;
    x?: string | number;
    y?: string | number;
    scale?: number;
  };
}

// Optimized spring configurations for different feels
const ANIMATION_PRESETS = {
  smooth: {
    type: "spring",
    stiffness: 300,
    damping: 30,
    mass: 0.8,
  },
  snappy: {
    type: "spring",
    stiffness: 400,
    damping: 40,
    mass: 0.5,
  },
  bouncy: {
    type: "spring",
    stiffness: 260,
    damping: 20,
    mass: 1,
  },
  minimal: {
    type: "tween",
    duration: 0.3,
  },
} as const;

export function useMultipleFormSteps<T extends Record<string, unknown>>({
  steps = [],
  schema,
  defaultValues,
  mode = "all",
  animationDirection = "horizontal",
  onStepChange,
  onNavigationError,
  lang = "en",
  animationPreset = "smooth",
}: UseMultipleFormStepsOptions<T>) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [transitionOrientation, setTransitionOrientation] =
    useState<TransitionOrientation>("right");

  // Refs to prevent re-renders and manage state
  const currentStepIndexRef = useRef(currentStepIndex);
  const isInitialMount = useRef(true);

  // Memoize form configuration to prevent unnecessary re-initialization
  const formConfig = useMemo(
    () => ({
      ...(schema && { resolver: zodResolver(schema) as never }),
      defaultValues,
      mode,
    }),
    [], // defaultValues intentionally excluded as it should only apply on mount
  );

  const form = useForm<T>(formConfig as any);

  // Memoize steps length to prevent recalculation
  const stepsLength = useMemo(() => steps.length, [steps.length]);

  // Memoize current step data
  const currentStep = useMemo(
    () => steps[currentStepIndex],
    [steps, currentStepIndex],
  );

  // Update ref when step changes
  useEffect(() => {
    currentStepIndexRef.current = currentStepIndex;

    // Skip callback on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    onStepChange?.(currentStepIndex);
  }, [currentStepIndex]);

  // Navigation handlers
  const handleNext = useCallback(async () => {
    if (currentStepIndex + 1 >= stepsLength) return;

    const fieldsRequired = currentStep?.fieldsRequired;

    if (fieldsRequired?.length) {
      try {
        const valid = await form.trigger(fieldsRequired as any);

        if (!valid) {
          onNavigationError?.(form.formState.errors);
          return;
        }
      } catch (error) {
        console.error("Validation error:", error);
        onNavigationError?.(error);
        return;
      }
    }

    setTransitionOrientation("right");
    setCurrentStepIndex((prev) => prev + 1);
  }, [
    currentStepIndex,
    stepsLength,
    JSON.stringify(currentStep?.fieldsRequired),
  ]);

  const handlePrev = useCallback(() => {
    if (currentStepIndex <= 0) return;

    setTransitionOrientation("left");
    setCurrentStepIndex((prev) => prev - 1);
  }, [currentStepIndex]);

  const handleChangeCurrentStepIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= stepsLength || index === currentStepIndex) {
        return;
      }

      setTransitionOrientation(index > currentStepIndex ? "right" : "left");
      setCurrentStepIndex(index);
    },
    [currentStepIndex, stepsLength],
  );

  const goToStep = useCallback(
    async (index: number, skipValidation = false) => {
      if (index < 0 || index >= stepsLength || index === currentStepIndex) {
        return false;
      }

      // Validate current step before navigating forward
      if (!skipValidation && index > currentStepIndex) {
        const fieldsRequired = currentStep?.fieldsRequired;

        if (fieldsRequired?.length) {
          try {
            const valid = await form.trigger(fieldsRequired as any);

            if (!valid) {
              onNavigationError?.(form.formState.errors);
              return false;
            }
          } catch (error) {
            console.error("Validation error:", error);
            onNavigationError?.(error);
            return false;
          }
        }
      }

      setTransitionOrientation(index > currentStepIndex ? "right" : "left");
      setCurrentStepIndex(index);
      return true;
    },
    [
      currentStepIndex,
      stepsLength,
      JSON.stringify(currentStep?.fieldsRequired),
    ],
  );

  // Enhanced transition styles with smoother animations
  const wrapperTransitionStyles = useMemo((): WrapperTransitionStyles => {
    const isForward = transitionOrientation === "right";
    const isRtl = lang === "ar";
    const preset = ANIMATION_PRESETS[animationPreset];

    // Calculate movement distance based on direction
    const getHorizontalOffset = () => {
      if (animationDirection !== "horizontal") return undefined;

      // For RTL, flip the direction
      if (isRtl) {
        return isForward ? "-50%" : "50%";
      }
      return isForward ? "50%" : "-50%";
    };

    const getVerticalOffset = () => {
      if (animationDirection !== "vertical") return undefined;
      return isForward ? "100%" : "-100%";
    };

    // Scale effects for depth (disabled for minimal preset)
    const useScale = animationPreset !== "minimal";
    const initialScale = useScale ? 0.95 : 1;
    const exitScale = useScale ? 0.95 : 1;

    return {
      transition: preset,
      animate: {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
      },
      initial: {
        opacity: 0,
        x: getHorizontalOffset() ?? 0,
        y: getVerticalOffset() ?? 0,
        scale: initialScale,
      },
      exit: {
        opacity: 0,
        x:
          animationDirection === "horizontal"
            ? isRtl
              ? isForward
                ? "-50%"
                : "50%"
              : isForward
                ? "50%"
                : "-50%"
            : 0,
        y:
          animationDirection === "vertical"
            ? isForward
              ? "-100%"
              : "100%"
            : 0,
        scale: exitScale,
      },
    };
  }, [transitionOrientation, animationDirection, lang, animationPreset]);

  // Derived state (memoized)
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex + 1 === stepsLength;
  const progress = useMemo(
    () => ((currentStepIndex + 1) / stepsLength) * 100,
    [currentStepIndex, stepsLength],
  );

  const CurrentStep = currentStep?.Component ?? (() => null);

  return {
    // Navigation
    handleNext,
    handlePrev,
    handleChangeCurrentStepIndex,
    goToStep,

    // Current step info
    CurrentStep,
    CurrentStepProps: currentStep,
    currentStepIndex,

    // State helpers
    isFirstStep,
    isLastStep,
    progress,
    totalSteps: stepsLength,

    // Transition
    transitionOrientation,
    wrapperTransitionStyles,

    // Form methods (spread at the end to allow overriding)
    ...form,
  };
}
