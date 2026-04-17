// Main-thread façade around the rembg Web Worker. Isolates the @imgly
// background-removal model's heavy WASM work so transparent-PNG exports no
// longer freeze the UI.
//
// Falls back to an inline dynamic import of the library when Worker creation
// fails (e.g. Safari private mode, some corp proxies). This preserves
// behaviour while preferring the non-blocking path when available.

type WorkerMessage =
  | { id: string; ok: true; blob: Blob }
  | { id: string; ok: false; error: string };

let cachedWorker: Worker | null = null;
let cachedFailed = false;

function acquireWorker(): Worker | null {
  if (cachedFailed) return null;
  if (cachedWorker) return cachedWorker;
  try {
    cachedWorker = new Worker(new URL("./rembg.worker.ts", import.meta.url), {
      type: "module",
    });
    return cachedWorker;
  } catch {
    cachedFailed = true;
    cachedWorker = null;
    return null;
  }
}

/**
 * Remove the background from a raster image blob. Runs inside a dedicated
 * Web Worker when possible so the main thread can keep painting during the
 * 1–5s model inference.
 */
export async function removeBackgroundOffMain(input: Blob): Promise<Blob> {
  const worker = acquireWorker();
  if (!worker) return removeBackgroundInline(input);

  return new Promise<Blob>((resolve, reject) => {
    const id = `rembg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const onMessage = (event: MessageEvent<WorkerMessage>) => {
      if (event.data.id !== id) return;
      cleanup();
      if (event.data.ok) resolve(event.data.blob);
      else reject(new Error(event.data.error));
    };

    const onError = (event: ErrorEvent) => {
      cleanup();
      // Retire the worker so subsequent calls either fall back or get a fresh
      // instance rather than a poisoned one.
      if (cachedWorker === worker) {
        cachedWorker = null;
        cachedFailed = true;
      }
      worker.terminate();
      removeBackgroundInline(input).then(resolve, reject);
      // Surface the underlying error in the console for diagnostics.
      console.warn("[rembg worker] fatal, falling back to main thread:", event.message);
    };

    function cleanup() {
      worker?.removeEventListener("message", onMessage);
      worker?.removeEventListener("error", onError);
    }

    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onError);
    worker.postMessage({ id, blob: input });
  });
}

async function removeBackgroundInline(input: Blob): Promise<Blob> {
  const { removeBackground } = await import("@imgly/background-removal");
  return removeBackground(input);
}

/**
 * Tear down the cached worker. Useful if the page detects it has gone idle
 * or wants to reclaim memory.
 */
export function disposeRembgWorker(): void {
  cachedWorker?.terminate();
  cachedWorker = null;
  cachedFailed = false;
}
