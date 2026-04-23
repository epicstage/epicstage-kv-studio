import type { ImageSize } from "./types";

// GPT Image 2 `size` constraints (OpenAI /v1/images/generations + /edits):
//   - each edge must be a multiple of 16
//   - max edge ≤ 3840
//   - aspect ratio between 1:3 and 3:1 (inclusive)
//   - total pixels in [655,360, 8,294,400]
//
// This module resolves a logical `"W:H"` ratio + quality bucket to a concrete
// `WxH` size string, computed from the requested aspect — not looked up in a
// table. Aspects outside the API range are clamped to 3:1 / 1:3 and the caller
// is told via `clamped: true` so it can surface the adjustment (never silent).

const API_MAX_EDGE = 3840;
const API_MIN_PIXELS = 655_360;
const API_MAX_PIXELS = 8_294_400;
const API_MAX_ASPECT = 3; // 3:1 — symmetric minimum is 1/3
const STEP = 16;

const BUCKET_TARGET_PIXELS: Record<ImageSize, number> = {
  // 512 bucket is below the API floor if taken literally — nudge to 1K so
  // previews still satisfy the OpenAI minimum.
  "512": 1024 * 1024,
  "1K": 1024 * 1024,
  "2K": 2048 * 2048,
  "4K": API_MAX_PIXELS,
};

function roundStep(n: number): number {
  return Math.max(STEP, Math.round(n / STEP) * STEP);
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export interface ResolvedRatio {
  /** `WxH` string accepted by OpenAI's `size` field. */
  size: string;
  /** Reduced `W:H` matching the actual pixel dimensions (may differ from the request if clamped). */
  effectiveRatio: string;
  /** True when the requested aspect was outside [1:3, 3:1] and we clamped. */
  clamped: boolean;
}

/**
 * Resolve a `"W:H"` ratio + quality bucket to the concrete pixel size GPT
 * Image 2 expects. No table, no silent fallback — the size is computed to
 * match the requested aspect as closely as API constraints allow.
 *
 * Throws on malformed ratios so callers fail loudly instead of falling back
 * to an arbitrary default.
 */
export function resolveRatio(ratio: string, bucket: ImageSize = "2K"): ResolvedRatio {
  const parts = ratio.split(":");
  if (parts.length !== 2) throw new Error(`Invalid ratio "${ratio}" — expected "W:H"`);
  const w = Number(parts[0]);
  const h = Number(parts[1]);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    throw new Error(`Invalid ratio "${ratio}" — W and H must be positive numbers`);
  }

  let aspect = w / h;
  let clamped = false;
  if (aspect > API_MAX_ASPECT) {
    aspect = API_MAX_ASPECT;
    clamped = true;
  } else if (aspect < 1 / API_MAX_ASPECT) {
    aspect = 1 / API_MAX_ASPECT;
    clamped = true;
  }

  const target = BUCKET_TARGET_PIXELS[bucket];
  if (!target) throw new Error(`Unknown size bucket "${bucket}"`);

  // Solve W×H = target, W/H = aspect
  let H = Math.sqrt(target / aspect);
  let W = aspect * H;

  // Respect max-edge ceiling before rounding.
  const maxEdge = Math.max(W, H);
  if (maxEdge > API_MAX_EDGE) {
    const scale = API_MAX_EDGE / maxEdge;
    W *= scale;
    H *= scale;
  }

  let Wi = roundStep(W);
  let Hi = roundStep(H);

  // Rounding may push total pixels out of range; nudge back in.
  while (Wi * Hi > API_MAX_PIXELS) {
    if (Wi >= Hi) Wi -= STEP;
    else Hi -= STEP;
    if (Wi < STEP || Hi < STEP) break;
  }
  while (Wi * Hi < API_MIN_PIXELS) {
    const canGrowW = Wi + STEP <= API_MAX_EDGE;
    const canGrowH = Hi + STEP <= API_MAX_EDGE;
    if (!canGrowW && !canGrowH) break;
    if (canGrowW && (Wi <= Hi || !canGrowH)) Wi += STEP;
    else Hi += STEP;
  }

  const g = gcd(Wi, Hi);
  return {
    size: `${Wi}x${Hi}`,
    effectiveRatio: `${Wi / g}:${Hi / g}`,
    clamped,
  };
}

/**
 * Back-compat thin wrapper around {@link resolveRatio} that returns only the
 * size string. Prefer {@link resolveRatio} when you also need the effective
 * ratio (e.g. to embed in a prompt) or want to know about clamping.
 */
export function ratioToSize(ratio: string, bucket: ImageSize = "2K"): string {
  return resolveRatio(ratio, bucket).size;
}

// Logical aspect ratios the UI currently exposes. "5:1" / "6:1" / "4:1" /
// "1:4" are NOT listed here because they exceed the 3:1 API limit and would
// be silently clamped — surface them through `resolveRatio` if you want the
// clamping to be explicit.
export const OPENAI_SUPPORTED_RATIOS = [
  "1:1",
  "16:9",
  "9:16",
  "4:3",
  "3:4",
  "3:2",
  "2:3",
  "4:5",
  "5:4",
  "21:9",
  "9:21",
  "1:3",
  "3:1",
  "5:3",
  "3:5",
  "1:1.414",
  "1.414:1",
  "5:7",
  "7:5",
];
