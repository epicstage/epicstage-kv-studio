import { describe, expect, it } from "vitest";
import { ratioToSize, resolveRatio } from "./ratio-to-size";

function parse(size: string): { w: number; h: number } {
  const [w, h] = size.split("x").map(Number);
  return { w, h };
}

const API_MIN = 655_360;
const API_MAX = 8_294_400;
const API_MAX_EDGE = 3840;

function assertApiValid(size: string) {
  const { w, h } = parse(size);
  expect(w % 16).toBe(0);
  expect(h % 16).toBe(0);
  expect(Math.max(w, h)).toBeLessThanOrEqual(API_MAX_EDGE);
  const pixels = w * h;
  expect(pixels).toBeGreaterThanOrEqual(API_MIN);
  expect(pixels).toBeLessThanOrEqual(API_MAX);
  const aspect = w / h;
  expect(aspect).toBeGreaterThanOrEqual(1 / 3 - 1e-6);
  expect(aspect).toBeLessThanOrEqual(3 + 1e-6);
}

describe("resolveRatio", () => {
  it("returns API-valid size for common square ratio", () => {
    const r = resolveRatio("1:1", "2K");
    expect(r.clamped).toBe(false);
    assertApiValid(r.size);
    expect(r.effectiveRatio).toBe("1:1");
  });

  it.each([
    ["16:9"], ["9:16"], ["4:3"], ["3:4"], ["3:2"], ["2:3"],
    ["21:9"], ["9:21"], ["3:1"], ["1:3"],
  ])("returns API-valid size for %s at 2K", (ratio) => {
    const r = resolveRatio(ratio, "2K");
    expect(r.clamped).toBe(false);
    assertApiValid(r.size);
  });

  it("clamps 5:1 to 3:1 and flags clamped=true (big banner bug)", () => {
    const r = resolveRatio("5:1", "2K");
    expect(r.clamped).toBe(true);
    assertApiValid(r.size);
    // Effective aspect should hug 3:1 after rounding to multiples of 16
    const { w, h } = parse(r.size);
    const aspect = w / h;
    expect(aspect).toBeGreaterThan(2.5);
    expect(aspect).toBeLessThanOrEqual(3 + 1e-6);
  });

  it("clamps 1:4 to 1:3", () => {
    const r = resolveRatio("1:4", "2K");
    expect(r.clamped).toBe(true);
    assertApiValid(r.size);
    const { w, h } = parse(r.size);
    const aspect = w / h;
    expect(aspect).toBeLessThan(0.4);
    expect(aspect).toBeGreaterThanOrEqual(1 / 3 - 1e-6);
  });

  it("never returns a square fallback for out-of-range requests", () => {
    const r = resolveRatio("6:1", "2K");
    const { w, h } = parse(r.size);
    expect(w).not.toBe(h);
  });

  it("handles all quality buckets", () => {
    for (const bucket of ["512", "1K", "2K", "4K"] as const) {
      assertApiValid(resolveRatio("16:9", bucket).size);
    }
  });

  it("handles decimal ratios", () => {
    const r = resolveRatio("1.414:1", "2K");
    expect(r.clamped).toBe(false);
    assertApiValid(r.size);
  });

  it("throws on malformed ratio", () => {
    expect(() => resolveRatio("foo", "2K")).toThrow();
    expect(() => resolveRatio("1:0", "2K")).toThrow();
    expect(() => resolveRatio("-1:1", "2K")).toThrow();
  });
});

describe("ratioToSize (back-compat)", () => {
  it("returns only the size string", () => {
    const size = ratioToSize("16:9", "2K");
    expect(size).toMatch(/^\d+x\d+$/);
    assertApiValid(size);
  });
});
