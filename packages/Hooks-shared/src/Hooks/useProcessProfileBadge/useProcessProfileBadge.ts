import { useCallback, useEffect, useRef, useState } from "react";

import type { ProcessProfileBadgeBlobOptions } from "./processProfileBadge.worker";

export {
  type ProcessProfileBadgeBlobOptions,
  type ProcessProfileMessage,
} from "./processProfileBadge.worker";

export const PROFILE_BADGE_DEFAULT_FILL = "#0A4D5C";
export const PROFILE_BADGE_DEFAULT_STROKE = "#B2D34B";

export type ProcessProfileBadgeProgress = {
  label: string;
  pct: number;
};

export type UseProcessProfileBadgeMessages = {
  notImage: string;
  progressLoadingModel: string;
  progressCompositing: string;
  progressDone: string;
};

export type UseProcessProfileBadgeOptions = {
  messages?: Partial<UseProcessProfileBadgeMessages>;
  blobOptions?: ProcessProfileBadgeBlobOptions;
  /** Blob fill in the generated PNG (preferred). */
  blobColor?: string;
  /** Alias of `blobColor`. */
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  /**
   * Worker module URL resolved from the host app (Vite). Falls back to a URL
   * relative to this package when omitted.
   */
  workerUrl?: string | URL;
};

/** Per-run overrides for `process(file, overrides)`. */
export type ProcessProfileBadgeRunOptions = Partial<
  Pick<
    UseProcessProfileBadgeOptions,
    "blobOptions" | "blobColor" | "fillColor" | "strokeColor" | "strokeWidth"
  >
>;

const DEFAULT_MESSAGES: UseProcessProfileBadgeMessages = {
  notImage: "Please choose an image file.",
  progressLoadingModel: "Removing background…",
  progressCompositing: "Building profile badge…",
  progressDone: "Done",
};

type WorkerToMain =
  | { id: number; type: "result"; buffer: ArrayBuffer }
  | { id: number; type: "progress"; current: number; total: number }
  | { id: number; type: "error"; message: string };

function revokeBlobUrl(url: string | null) {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

function resolveBlobFillColor(
  ...candidates: (string | undefined)[]
): string {
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) {
      return c.trim();
    }
  }
  return PROFILE_BADGE_DEFAULT_FILL;
}

function runProfileBadgeWorker(params: {
  worker: Worker;
  jobId: number;
  buffer: ArrayBuffer;
  mimeType: string;
  blobOptions?: ProcessProfileBadgeBlobOptions;
  fillColor: string;
  strokeColor: string;
  strokeWidth?: number;
  onAiProgress: (current: number, total: number) => void;
  isCancelled: () => boolean;
}): Promise<Blob> {
  const {
    worker,
    jobId,
    buffer,
    mimeType,
    blobOptions,
    fillColor,
    strokeColor,
    strokeWidth,
    onAiProgress,
    isCancelled,
  } = params;

  return new Promise((resolve, reject) => {
    const handler = (ev: MessageEvent<WorkerToMain>) => {
      const d = ev.data;
      if (!d || d.id !== jobId) {
        return;
      }

      if (isCancelled()) {
        worker.removeEventListener("message", handler);
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }

      if (d.type === "progress") {
        onAiProgress(d.current, d.total);
        return;
      }
      if (d.type === "error") {
        worker.removeEventListener("message", handler);
        reject(new Error(d.message));
        return;
      }
      if (d.type === "result") {
        worker.removeEventListener("message", handler);
        if (isCancelled()) {
          reject(new DOMException("Aborted", "AbortError"));
          return;
        }
        resolve(new Blob([d.buffer], { type: "image/png" }));
      }
    };

    worker.addEventListener("message", handler);
    worker.postMessage(
      {
        type: "process-profile-badge",
        id: jobId,
        imageBuffer: buffer,
        mimeType,
        blobOptions,
        fillColor,
        strokeColor,
        strokeWidth,
      },
      [buffer],
    );
  });
}

/**
 * AI cutout + organic blob frame + head pop-out badge (profile style).
 * Runs in `processProfileBadge.worker.ts` (`blobs/v2` + `@imgly/background-removal`).
 */
export function useProcessProfileBadge(
  options: UseProcessProfileBadgeOptions = {},
) {
  const {
    messages: messagesOverride,
    blobOptions,
    blobColor,
    fillColor,
    strokeColor = PROFILE_BADGE_DEFAULT_STROKE,
    strokeWidth,
    workerUrl,
  } = options;

  const defaultFillColor = resolveBlobFillColor(blobColor, fillColor);

  const messagesRef = useRef({ ...DEFAULT_MESSAGES, ...messagesOverride });
  messagesRef.current = { ...DEFAULT_MESSAGES, ...messagesOverride };

  const blobOptionsRef = useRef(blobOptions);
  blobOptionsRef.current = blobOptions;

  const fillColorRef = useRef(defaultFillColor);
  fillColorRef.current = defaultFillColor;

  const strokeColorRef = useRef(strokeColor);
  strokeColorRef.current = strokeColor;

  const strokeWidthRef = useRef(strokeWidth);
  strokeWidthRef.current = strokeWidth;

  useEffect(() => {
    fillColorRef.current = resolveBlobFillColor(blobColor, fillColor);
  }, [blobColor, fillColor]);

  useEffect(() => {
    strokeColorRef.current = strokeColor;
  }, [strokeColor]);

  useEffect(() => {
    strokeWidthRef.current = strokeWidth;
  }, [strokeWidth]);

  const workerRef = useRef<Worker | null>(null);
  const jobIdRef = useRef(0);
  const cancelGenRef = useRef(0);

  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProcessProfileBadgeProgress | null>(
    null,
  );

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const workerUrlRef = useRef(workerUrl);
  workerUrlRef.current = workerUrl;

  const getWorker = useCallback(() => {
    if (!workerRef.current) {
      const w = new Worker(
        workerUrlRef.current ??
          new URL("./processProfileBadge.worker.ts", import.meta.url),
        { type: "module" },
      );
      w.addEventListener("error", (ev) => {
        const message =
          ev.message ||
          (ev.error instanceof Error
            ? ev.error.message
            : "Profile badge worker failed to load");
        setError(message);
        w.terminate();
        if (workerRef.current === w) {
          workerRef.current = null;
        }
      });
      workerRef.current = w;
    }
    return workerRef.current;
  }, []);

  const clearResult = useCallback(() => {
    cancelGenRef.current += 1;
    setError(null);
    setProgress(null);
    setResultBlob(null);
    setResultUrl((prev) => {
      revokeBlobUrl(prev);
      return null;
    });
  }, []);

  const cancel = useCallback(() => {
    cancelGenRef.current += 1;
    setBusy(false);
    setProgress(null);
  }, []);

  const process = useCallback(
    async (file: File, runOptions?: ProcessProfileBadgeRunOptions) => {
      if (!file.type.startsWith("image/")) {
        setError(messagesRef.current.notImage);
        return null;
      }

      const cancelSnap = cancelGenRef.current;
      const isCancelled = () => cancelGenRef.current !== cancelSnap;

      setBusy(true);
      setError(null);
      setResultBlob(null);
      setResultUrl((prev) => {
        revokeBlobUrl(prev);
        return null;
      });

      try {
        const imageBuffer = await file.arrayBuffer();
        if (isCancelled()) {
          return null;
        }

        const worker = getWorker();
        const jobId = ++jobIdRef.current;

        setProgress({
          label: messagesRef.current.progressLoadingModel,
          pct: 5,
        });

        const resolvedFill = resolveBlobFillColor(
          runOptions?.blobColor,
          runOptions?.fillColor,
          fillColorRef.current,
        );

        const blob = await runProfileBadgeWorker({
          worker,
          jobId,
          buffer: imageBuffer,
          mimeType: file.type || "image/png",
          blobOptions: runOptions?.blobOptions ?? blobOptionsRef.current,
          fillColor: resolvedFill,
          strokeColor: runOptions?.strokeColor ?? strokeColorRef.current,
          strokeWidth: runOptions?.strokeWidth ?? strokeWidthRef.current,
          onAiProgress: (current, total) => {
            const pct =
              total > 0
                ? Math.min(88, 5 + Math.round((current / total) * 83))
                : 12;
            setProgress({
              label: messagesRef.current.progressLoadingModel,
              pct,
            });
          },
          isCancelled,
        });

        if (isCancelled()) {
          return null;
        }

        setProgress({
          label: messagesRef.current.progressCompositing,
          pct: 92,
        });

        const url = URL.createObjectURL(blob);
        setResultBlob(blob);
        setResultUrl(url);
        setProgress({ label: messagesRef.current.progressDone, pct: 100 });
        return blob;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          return null;
        }
        const message = e instanceof Error ? e.message : String(e);
        setError(message);
        setProgress(null);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [getWorker],
  );

  return {
    process,
    resultUrl,
    resultBlob,
    busy,
    error,
    progress,
    cancel,
    clearResult,
  };
}
