/// <reference lib="webworker" />

type RemoveMessage = {
  type: "remove";
  id: number;
  mode: "solid" | "ai";
  imageBuffer: ArrayBuffer;
  mimeType: string;
  targetR?: number;
  targetG?: number;
  targetB?: number;
  tolerance?: number;
};

const ctx = self as unknown as DedicatedWorkerGlobalScope;

function post(
  id: number,
  payload: Record<string, unknown>,
  transfer?: Transferable[],
) {
  ctx.postMessage({ id, ...payload }, transfer ?? []);
}

async function runSolid(
  id: number,
  imageBuffer: ArrayBuffer,
  mimeType: string,
  target: { r: number; g: number; b: number },
  tolerance: number,
) {
  const blob = new Blob([imageBuffer], { type: mimeType || "image/png" });
  const bmp = await createImageBitmap(blob);
  const w = bmp.width;
  const h = bmp.height;
  if (!w || !h) throw new Error("Invalid image dimensions");

  const canvas = new OffscreenCanvas(w, h);
  const c2d = canvas.getContext("2d", { willReadFrequently: true });
  if (!c2d) throw new Error("Canvas unsupported");
  c2d.drawImage(bmp, 0, 0);
  bmp.close();

  const { data } = c2d.getImageData(0, 0, w, h);
  const T = Math.max(0, Math.min(100, tolerance));
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (
      Math.abs(r - target.r) <= T &&
      Math.abs(g - target.g) <= T &&
      Math.abs(b - target.b) <= T
    ) {
      data[i + 3] = 0;
    }
  }
  c2d.putImageData(new ImageData(data, w, h), 0, 0);
  const outBlob = await canvas.convertToBlob({ type: "image/png" });
  const buf = await outBlob.arrayBuffer();
  post(id, { type: "result", buffer: buf }, [buf]);
}

async function runAi(id: number, imageBuffer: ArrayBuffer, mimeType: string) {
  const file = new File([imageBuffer], "source", {
    type: mimeType || "image/png",
  });
  const { removeBackground } = await import("@imgly/background-removal");
  const outBlob = await removeBackground(file, {
    model: "isnet_quint8",
    output: { format: "image/png" },
    progress: (_key, current, total) => {
      post(id, { type: "progress", current, total });
    },
  });
  const buf = await outBlob.arrayBuffer();
  post(id, { type: "result", buffer: buf }, [buf]);
}

ctx.onmessage = async (ev: MessageEvent<RemoveMessage>) => {
  const d = ev.data;
  if (!d || d.type !== "remove") return;
  const { id, mode, imageBuffer, mimeType } = d;
  try {
    if (mode === "solid") {
      const tr = d.tolerance ?? 28;
      if (
        d.targetR === undefined ||
        d.targetG === undefined ||
        d.targetB === undefined
      ) {
        throw new Error("Missing solid target RGB");
      }
      await runSolid(
        id,
        imageBuffer,
        mimeType,
        { r: d.targetR, g: d.targetG, b: d.targetB },
        tr,
      );
    } else {
      await runAi(id, imageBuffer, mimeType);
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    post(id, { type: "error", message });
  }
};

export {};
