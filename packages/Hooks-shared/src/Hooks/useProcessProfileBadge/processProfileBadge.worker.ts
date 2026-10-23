/// <reference lib="webworker" />

import * as blobs2 from "blobs/v2";

export type ProcessProfileBadgeBlobOptions = {
  seed?: number | string;
  extraPoints?: number;
  randomness?: number;
};

export type ProcessProfileMessage = {
  type: "process-profile-badge";
  id: number;
  imageBuffer: ArrayBuffer;
  mimeType: string;
  blobOptions?: ProcessProfileBadgeBlobOptions;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
};

type WorkerOutPayload =
  | { type: "progress"; current: number; total: number }
  | { type: "result"; buffer: ArrayBuffer }
  | { type: "error"; message: string };

type WorkerOutMessage = WorkerOutPayload & { id: number };

const DEFAULT_FILL = "#0A4D5C";
const DEFAULT_STROKE = "#B2D34B";
const BLOB_SIZE_RATIO = 0.75;
const SUBJECT_SCALE = 0.92;
const SUBJECT_DOWN_SHIFT_RATIO = 0.08;

const ctx = self as unknown as DedicatedWorkerGlobalScope;

function post(
  id: number,
  payload: WorkerOutPayload,
  transfer?: Transferable[],
) {
  ctx.postMessage({ id, ...payload }, transfer ?? []);
}

function drawSubject(
  c2d: OffscreenCanvasRenderingContext2D,
  bmp: ImageBitmap,
  canvasSize: number,
  downShiftRatio: number,
) {
  const scale =
    Math.min(canvasSize / bmp.width, canvasSize / bmp.height) * SUBJECT_SCALE;
  const dw = bmp.width * scale;
  const dh = bmp.height * scale;
  const dx = (canvasSize - dw) / 2;
  const dy = (canvasSize - dh) / 2 + canvasSize * downShiftRatio;
  c2d.drawImage(bmp, dx, dy, dw, dh);
}

async function runProcessProfile(
  id: number,
  imageBuffer: ArrayBuffer,
  mimeType: string,
  blobOptions: ProcessProfileBadgeBlobOptions | undefined,
  fillColor: string,
  strokeColor: string,
  strokeWidth: number | undefined,
) {
  const file = new File([imageBuffer], "source", {
    type: mimeType || "image/png",
  });

  const { removeBackground } = await import("@imgly/background-removal");
  const transparentBlob = await removeBackground(file, {
    model: "isnet_quint8",
    output: { format: "image/png" },
    progress: (_key, current, total) => {
      post(id, { type: "progress", current, total });
    },
  });

  const bmp = await createImageBitmap(transparentBlob);
  try {
    const canvasSize = Math.max(bmp.width, bmp.height, 1);
    const blobSize = Math.round(canvasSize * BLOB_SIZE_RATIO);
    const offset = Math.round((canvasSize - blobSize) / 2);

    const seed =
      blobOptions?.seed !== undefined
        ? blobOptions.seed
        : `profile-${Date.now()}`;
    const extraPoints = blobOptions?.extraPoints ?? 8;
    const randomness = blobOptions?.randomness ?? 4;

    const libraryBlobPath = blobs2.canvasPath(
      { seed, extraPoints, randomness, size: blobSize },
      { offsetX: offset, offsetY: offset },
    );

    const canvas = new OffscreenCanvas(canvasSize, canvasSize);
    const c2d = canvas.getContext("2d");
    if (!c2d) {
      throw new Error("Canvas unsupported");
    }

    const lineWidth =
      strokeWidth !== undefined && Number.isFinite(strokeWidth)
        ? Math.max(0, strokeWidth)
        : Math.max(2, Math.round(blobSize * 0.014));

    c2d.fillStyle = fillColor;
    c2d.fill(libraryBlobPath);

    c2d.strokeStyle = strokeColor;
    c2d.lineWidth = lineWidth;
    c2d.lineJoin = "round";
    c2d.stroke(libraryBlobPath);

    c2d.save();
    c2d.clip(libraryBlobPath);
    drawSubject(c2d, bmp, canvasSize, SUBJECT_DOWN_SHIFT_RATIO);
    c2d.restore();

    c2d.save();
    c2d.beginPath();
    c2d.rect(0, 0, canvasSize, canvasSize / 2);
    c2d.clip();
    drawSubject(c2d, bmp, canvasSize, SUBJECT_DOWN_SHIFT_RATIO);
    c2d.restore();

    const outBlob = await canvas.convertToBlob({ type: "image/png" });
    const buf = await outBlob.arrayBuffer();
    post(id, { type: "result", buffer: buf }, [buf]);
  } finally {
    bmp.close();
  }
}

ctx.onmessage = async (ev: MessageEvent<ProcessProfileMessage>) => {
  const data = ev.data;
  if (!data || data.type !== "process-profile-badge") {
    return;
  }

  const {
    id,
    imageBuffer,
    mimeType,
    blobOptions,
    fillColor = DEFAULT_FILL,
    strokeColor = DEFAULT_STROKE,
    strokeWidth,
  } = data;

  try {
    await runProcessProfile(
      id,
      imageBuffer,
      mimeType,
      blobOptions,
      fillColor,
      strokeColor,
      strokeWidth,
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    post(id, { type: "error", message });
  }
};

export {};
