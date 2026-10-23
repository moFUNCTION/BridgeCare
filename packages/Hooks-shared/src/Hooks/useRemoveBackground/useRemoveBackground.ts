import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";

export type RemovalMode = "ai" | "solid";

export type RemoveBackgroundProgress = { label: string; pct: number };

export type UseRemoveBackgroundMessages = {
  notImage: string;
  invalidHex: string;
  progressLoadingModel: string;
  progressRunning: string;
  progressDone: string;
};

export type UseRemoveBackgroundOptions = {
  messages: UseRemoveBackgroundMessages;
  mode: RemovalMode;
  solidHex: string;
  tolerance: number;
  file: File | null;
  sourceUrl: string | null;
  onModeChange: (mode: RemovalMode) => void;
  onSolidHexChange: (hex: string) => void;
  onFileChange: (file: File | null) => void;
  /** Set the preview blob URL; revoke the previous `sourceUrl` in the parent when replacing. */
  onSourceUrlChange: (url: string | null) => void;
  /**
   * Worker module URL resolved from the host app (Vite). Falls back to a URL
   * relative to this package when omitted.
   */
  workerUrl?: string | URL;
};

function parseHexRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Ensures color pickers (e.g. Chakra `parseColor`) always receive `#rrggbb`. */
export function normalizeHexForPicker(hex: string): string {
  const t = hex.trim();
  if (/^#[0-9a-f]{6}$/i.test(t)) return t.toLowerCase();
  if (/^[0-9a-f]{6}$/i.test(t)) return `#${t.toLowerCase()}`;
  return "#ffffff";
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = url;
  });
}

type WorkerToMain =
  | { id: number; type: "result"; buffer: ArrayBuffer }
  | { id: number; type: "progress"; current: number; total: number }
  | { id: number; type: "error"; message: string };

function runRemoveBackgroundWorker(params: {
  worker: Worker;
  jobId: number;
  mode: "solid" | "ai";
  buffer: ArrayBuffer;
  mimeType: string;
  solid?: { r: number; g: number; b: number; tolerance: number };
  onAiProgress: (current: number, total: number) => void;
  isCancelled: () => boolean;
}): Promise<Blob> {
  const {
    worker,
    jobId,
    mode,
    buffer,
    mimeType,
    solid,
    onAiProgress,
    isCancelled,
  } = params;

  return new Promise((resolve, reject) => {
    const handler = (ev: MessageEvent<WorkerToMain>) => {
      const d = ev.data;
      if (!d || d.id !== jobId) return;

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

    if (mode === "solid" && solid) {
      worker.postMessage(
        {
          type: "remove",
          id: jobId,
          mode: "solid",
          imageBuffer: buffer,
          mimeType,
          targetR: solid.r,
          targetG: solid.g,
          targetB: solid.b,
          tolerance: solid.tolerance,
        },
        [buffer],
      );
    } else {
      worker.postMessage(
        {
          type: "remove",
          id: jobId,
          mode: "ai",
          imageBuffer: buffer,
          mimeType,
        },
        [buffer],
      );
    }
  });
}

/** Samples border pixels on a downscaled copy; uniform edges → solid chroma, varied → AI segmentation. */
export async function detectRemovalModeFromImageUrl(
  url: string,
): Promise<{ mode: RemovalMode; suggestedHex?: string }> {
  const img = await loadImage(url);
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (!iw || !ih) return { mode: "ai" };

  const maxEdge = 256;
  const scale = Math.min(1, maxEdge / Math.max(iw, ih));
  const dw = Math.max(1, Math.round(iw * scale));
  const dh = Math.max(1, Math.round(ih * scale));

  const canvas = document.createElement("canvas");
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { mode: "ai" };
  ctx.drawImage(img, 0, 0, dw, dh);
  const { data } = ctx.getImageData(0, 0, dw, dh);

  const rgbAt = (x: number, y: number) => {
    const xi = Math.min(dw - 1, Math.max(0, x));
    const yi = Math.min(dh - 1, Math.max(0, y));
    const i = (yi * dw + xi) * 4;
    return { r: data[i], g: data[i + 1], b: data[i + 2] };
  };

  const mx = dw - 1;
  const my = dh - 1;
  const cx = Math.floor(dw / 2);
  const cy = Math.floor(dh / 2);
  const samples = [
    rgbAt(0, 0),
    rgbAt(mx, 0),
    rgbAt(0, my),
    rgbAt(mx, my),
    rgbAt(cx, 0),
    rgbAt(cx, my),
    rgbAt(0, cy),
    rgbAt(mx, cy),
  ];

  const mean = {
    r: Math.round(samples.reduce((s, c) => s + c.r, 0) / samples.length),
    g: Math.round(samples.reduce((s, c) => s + c.g, 0) / samples.length),
    b: Math.round(samples.reduce((s, c) => s + c.b, 0) / samples.length),
  };
  const manhattan = (
    a: { r: number; g: number; b: number },
    b: { r: number; g: number; b: number },
  ) => Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b);
  const maxDev = Math.max(...samples.map((c) => manhattan(c, mean)));

  const uniformEdgeThreshold = 52;
  if (maxDev <= uniformEdgeThreshold) {
    const suggestedHex = `#${[mean.r, mean.g, mean.b]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")}`;
    return { mode: "solid", suggestedHex };
  }
  return { mode: "ai" };
}

function revokeBlobUrl(url: string | null) {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}

/**
 * Client-side remove-background flow: flat color (chroma) or `@imgly/background-removal` AI.
 * Removal runs in a dedicated Web Worker (`removeBackground.worker.ts`).
 * Parent controls `file`, `sourceUrl`, `mode`, `solidHex`, and `tolerance`. Upload auto-detection stays on the main thread.
 * Requires `@imgly/background-removal` in the app (worker dynamic import).
 */
export function useRemoveBackground(options: UseRemoveBackgroundOptions) {
  const {
    messages,
    mode,
    solidHex,
    tolerance,
    file,
    sourceUrl,
    onModeChange,
    onSolidHexChange,
    onFileChange,
    onSourceUrlChange,
    workerUrl,
  } = options;

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const fileRef = useRef<HTMLInputElement>(null);
  const pickGenRef = useRef(0);
  const removeWorkerRef = useRef<Worker | null>(null);
  const removeJobIdRef = useRef(0);
  const removeCancelGenRef = useRef(0);

  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<RemoveBackgroundProgress | null>(
    null,
  );

  useEffect(() => {
    return () => {
      removeWorkerRef.current?.terminate();
      removeWorkerRef.current = null;
    };
  }, []);

  const workerUrlRef = useRef(workerUrl);
  workerUrlRef.current = workerUrl;

  const getRemoveWorker = useCallback(() => {
    if (!removeWorkerRef.current) {
      const w = new Worker(
        workerUrlRef.current ??
          new URL("./removeBackground.worker.ts", import.meta.url),
        { type: "module" },
      );
      w.addEventListener("error", (ev) => {
        const message =
          ev.message ||
          (ev.error instanceof Error ? ev.error.message : "Background worker failed to load");
        setError(message);
        w.terminate();
        if (removeWorkerRef.current === w) removeWorkerRef.current = null;
      });
      removeWorkerRef.current = w;
    }
    return removeWorkerRef.current;
  }, []);

  const revoke = useCallback((url: string | null) => {
    revokeBlobUrl(url);
  }, []);

  const onPickFile = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      e.target.value = "";
      if (!f || !f.type.startsWith("image/")) {
        setError(messages.notImage);
        return;
      }
      setError(null);
      setResultUrl((prev) => {
        revoke(prev);
        return null;
      });
      const nextUrl = URL.createObjectURL(f);
      const gen = ++pickGenRef.current;
      onFileChange(f);
      onSourceUrlChange(nextUrl);
      void (async () => {
        try {
          const { mode: detected, suggestedHex } =
            await detectRemovalModeFromImageUrl(nextUrl);
          if (gen !== pickGenRef.current) return;
          onModeChange(detected);
          if (detected === "solid" && suggestedHex)
            onSolidHexChange(suggestedHex);
        } catch {
          /* leave parent-controlled mode as-is */
        }
      })();
    },
    [
      messages,
      onFileChange,
      onModeChange,
      onSolidHexChange,
      onSourceUrlChange,
      revoke,
    ],
  );

  const clearAll = useCallback(() => {
    pickGenRef.current += 1;
    removeCancelGenRef.current += 1;
    onFileChange(null);
    onSourceUrlChange(null);
    setError(null);
    setProgress(null);
    setResultUrl((prev) => {
      revoke(prev);
      return null;
    });
  }, [onFileChange, onSourceUrlChange, revoke]);

  const onRemove = useCallback(async () => {
    if (!file) {
      setError(messagesRef.current.notImage);
      return;
    }
    const cancelSnap = removeCancelGenRef.current;
    const isCancelled = () => removeCancelGenRef.current !== cancelSnap;

    setBusy(true);
    setError(null);
    setResultUrl((prev) => {
      revoke(prev);
      return null;
    });
    try {
      const imageBuffer = await file.arrayBuffer();
      if (isCancelled()) return;

      const worker = getRemoveWorker();
      const jobId = ++removeJobIdRef.current;

      if (mode === "ai") {
        setProgress({
          label: messagesRef.current.progressLoadingModel,
          pct: 5,
        });
      } else {
        setProgress({
          label: messagesRef.current.progressRunning,
          pct: 40,
        });
      }

      const rgb = parseHexRgb(solidHex);
      if (mode === "solid" && !rgb) {
        throw new Error(messagesRef.current.invalidHex);
      }

      const blob = await runRemoveBackgroundWorker({
        worker,
        jobId,
        mode: mode === "ai" ? "ai" : "solid",
        buffer: imageBuffer,
        mimeType: file.type || "image/png",
        solid:
          mode === "solid" && rgb
            ? { r: rgb.r, g: rgb.g, b: rgb.b, tolerance }
            : undefined,
        onAiProgress: (current, total) => {
          const pct =
            total > 0
              ? Math.min(95, 5 + Math.round((current / total) * 90))
              : 10;
          setProgress({
            label: messagesRef.current.progressRunning,
            pct,
          });
        },
        isCancelled,
      });

      if (isCancelled()) return;

      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setProgress({ label: messagesRef.current.progressDone, pct: 100 });
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      setProgress(null);
    } finally {
      setBusy(false);
    }
  }, [file, getRemoveWorker, mode, revoke, solidHex, sourceUrl, tolerance]);

  const downloadSuffix = mode === "ai" ? "ai-cutout" : "solid-alpha";

  return {
    fileRef,
    resultUrl,
    busy,
    error,
    progress,
    onPickFile,
    clearAll,
    onRemove,
    downloadSuffix,
  };
}
