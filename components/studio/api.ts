// Cloudflare Workers backend base.
export const API_BASE = "https://epic-studio-api.kbm-32f.workers.dev";

export interface FetchJsonOptions extends Omit<RequestInit, "body" | "headers"> {
  headers?: HeadersInit;
  json?: unknown;
  body?: BodyInit;
  /** Abort signal to cancel the request. */
  signal?: AbortSignal;
  /** Millisecond timeout. Defaults to no timeout. */
  timeoutMs?: number;
}

export class ApiError extends Error {
  status: number;
  statusText: string;
  body: string | undefined;
  constructor(status: number, statusText: string, message: string, body?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }
}

/**
 * Unified JSON fetch. Adds JSON headers when `json` is provided, supports
 * AbortController composition via the `signal` option, and an optional
 * `timeoutMs` that auto-aborts. Errors are normalized to `ApiError` so callers
 * get status + body for display.
 */
export async function fetchJson<T = unknown>(
  url: string,
  opts: FetchJsonOptions = {},
): Promise<T> {
  const { json, body, headers, signal, timeoutMs, ...rest } = opts;

  const finalHeaders = new Headers(headers);
  let finalBody = body;
  if (json !== undefined) {
    finalHeaders.set("Content-Type", "application/json");
    finalBody = JSON.stringify(json);
  }

  const controller = new AbortController();
  const onAbort = () => controller.abort(signal?.reason);
  if (signal) {
    if (signal.aborted) controller.abort(signal.reason);
    else signal.addEventListener("abort", onAbort, { once: true });
  }
  const timeoutId =
    timeoutMs != null ? setTimeout(() => controller.abort(new Error("timeout")), timeoutMs) : null;

  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      body: finalBody,
      headers: finalHeaders,
      signal: controller.signal,
    });
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    signal?.removeEventListener("abort", onAbort);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(
      res.status,
      res.statusText,
      `${rest.method || "GET"} ${url} failed: ${res.status} ${res.statusText}`,
      text,
    );
  }

  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}

// ---------- Typed endpoint helpers ----------

export interface SearchReferencesResponse {
  images?: Array<{ url: string; title?: string; source?: string }>;
  [key: string]: unknown;
}

export function searchReferences(
  query: string,
  eventType?: string,
  count = 12,
  signal?: AbortSignal,
): Promise<SearchReferencesResponse> {
  return fetchJson<SearchReferencesResponse>(`${API_BASE}/api/search/smart-references`, {
    method: "POST",
    json: {
      event_type: eventType || undefined,
      theme_keywords: query.split(/\s+/).filter(Boolean),
      count,
    },
    signal,
  });
}

export function analyzeStyle(
  imageUrls: string[],
  projectId?: string,
  signal?: AbortSignal,
): Promise<unknown> {
  return fetchJson(`${API_BASE}/api/analyze/style`, {
    method: "POST",
    json: { image_urls: imageUrls, project_id: projectId },
    signal,
  });
}

export function sendChat(
  messages: Array<{ role: string; content: string }>,
  context?: unknown,
  signal?: AbortSignal,
): Promise<unknown> {
  return fetchJson(`${API_BASE}/api/chat`, {
    method: "POST",
    json: { messages, context },
    signal,
  });
}

export function generate(
  contents: unknown,
  model?: string,
  signal?: AbortSignal,
): Promise<unknown> {
  return fetchJson(`${API_BASE}/api/generate`, {
    method: "POST",
    json: { contents, model },
    signal,
  });
}

export async function uploadImage(
  file: Blob,
  filename = "image.png",
  signal?: AbortSignal,
): Promise<unknown> {
  const formData = new FormData();
  formData.append("file", file, filename);
  return fetchJson(`${API_BASE}/api/upload`, { method: "POST", body: formData, signal });
}

export async function requestUpscale(
  file: Blob,
  scale = 4,
  signal?: AbortSignal,
): Promise<unknown> {
  const formData = new FormData();
  formData.append("file", file, "image.png");
  formData.append("scale", String(scale));
  return fetchJson(`${API_BASE}/api/upscale`, { method: "POST", body: formData, signal });
}

export function imageUrl(key: string): string {
  return `${API_BASE}/api/images/${encodeURIComponent(key)}`;
}
