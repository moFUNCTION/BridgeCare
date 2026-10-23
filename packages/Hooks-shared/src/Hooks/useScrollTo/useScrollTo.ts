import { useCallback, type RefObject } from "react";

export interface ScrollToOptions {
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
  inline?: ScrollLogicalPosition;
}

export function useScrollTo() {
  const scrollTo = useCallback(
    (
      ref: RefObject<HTMLElement | null>,
      options: ScrollToOptions = { behavior: "smooth", block: "start" }
    ) => {
      ref?.current?.scrollIntoView(options);
    },
    []
  );
  return scrollTo;
}
