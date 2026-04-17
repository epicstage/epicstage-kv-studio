import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, fetchJson } from "./api";

describe("fetchJson", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  function mockResponse(init: { status?: number; body?: string; json?: unknown }) {
    const status = init.status ?? 200;
    const body =
      init.json !== undefined ? JSON.stringify(init.json) : (init.body ?? "");
    const headers = new Headers(
      init.json !== undefined ? { "content-type": "application/json" } : {},
    );
    return new Response(body || null, { status, headers });
  }

  it("sends JSON bodies and parses JSON responses", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(mockResponse({ json: { ok: true } }));

    const out = await fetchJson<{ ok: boolean }>("https://example.test/x", {
      method: "POST",
      json: { a: 1 },
    });

    expect(out).toEqual({ ok: true });
    const call = fetchMock.mock.calls[0];
    expect(call[0]).toBe("https://example.test/x");
    const init = call[1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ a: 1 }));
    const headers = new Headers(init.headers);
    expect(headers.get("content-type")).toBe("application/json");
  });

  it("throws ApiError on non-2xx with body preserved", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockResponse({ status: 503, body: "upstream down" }),
    );

    let caught: unknown;
    try {
      await fetchJson("https://example.test/y");
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ApiError);
    const err = caught as ApiError;
    expect(err.status).toBe(503);
    expect(err.body).toBe("upstream down");
  });

  it("returns undefined for 204 responses", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(fetchJson("https://example.test/z")).resolves.toBeUndefined();
  });

  it("aborts when timeoutMs elapses", async () => {
    vi.mocked(fetch).mockImplementationOnce(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          (init?.signal as AbortSignal | undefined)?.addEventListener("abort", () => {
            reject(new DOMException("aborted", "AbortError"));
          });
        }),
    );

    await expect(fetchJson("https://example.test/slow", { timeoutMs: 5 })).rejects.toThrow();
  });
});
