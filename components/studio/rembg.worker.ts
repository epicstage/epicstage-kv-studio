/// <reference lib="webworker" />
// Dedicated Web Worker for @imgly/background-removal. The model + WASM runs
// in this worker context so the main thread stays responsive during heavy
// transparent-PNG exports.

import { removeBackground } from "@imgly/background-removal";

type RembgRequest = { id: string; blob: Blob };
type RembgResponse =
  | { id: string; ok: true; blob: Blob }
  | { id: string; ok: false; error: string };

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = async (event: MessageEvent<RembgRequest>) => {
  const { id, blob } = event.data;
  try {
    const result = await removeBackground(blob);
    const response: RembgResponse = { id, ok: true, blob: result };
    ctx.postMessage(response);
  } catch (err) {
    const response: RembgResponse = {
      id,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
    ctx.postMessage(response);
  }
};
