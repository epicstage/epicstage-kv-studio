import type { ImageSize } from "./types";

// GPT Image 2 `size` constraints:
//   - each edge multiple of 16
//   - max edge ≤ 3840
//   - aspect ratio between 1:3 and 3:1
//   - total pixels between 655,360 and 8,294,400
// Pre-computed tables satisfy all constraints for the four quality buckets
// our UI exposes. Unknown ratios fall back to 1:1 at the requested size.

const SIZE_1K: Record<string, string> = {
  "1:1": "1024x1024",
  "16:9": "1024x576",
  "9:16": "576x1024",
  "4:3": "1024x768",
  "3:4": "768x1024",
  "3:2": "1024x688",
  "2:3": "688x1024",
  "4:5": "848x1056",
  "5:4": "1056x848",
  "21:9": "1344x576",
  "9:21": "576x1344",
  "1:3": "576x1728",
  "3:1": "1728x576",
  "5:3": "960x576",
  "3:5": "576x960",
  "1:1.414": "720x1024",
  "1.414:1": "1024x720",
  "5:7": "720x1024",
  "7:5": "1024x720",
};

const SIZE_2K: Record<string, string> = {
  "1:1": "2048x2048",
  "16:9": "2048x1152",
  "9:16": "1152x2048",
  "4:3": "2048x1536",
  "3:4": "1536x2048",
  "3:2": "2048x1360",
  "2:3": "1360x2048",
  "4:5": "1632x2048",
  "5:4": "2048x1632",
  "21:9": "2688x1152",
  "9:21": "1152x2688",
  "1:3": "1152x3456",
  "3:1": "3456x1152",
  "5:3": "1920x1152",
  "3:5": "1152x1920",
  "1:1.414": "1456x2048",
  "1.414:1": "2048x1456",
  "5:7": "1456x2048",
  "7:5": "2048x1456",
};

const SIZE_4K: Record<string, string> = {
  "1:1": "3840x3840",
  "16:9": "3840x2160",
  "9:16": "2160x3840",
  "4:3": "3840x2880",
  "3:4": "2880x3840",
  "3:2": "3840x2560",
  "2:3": "2560x3840",
  "4:5": "2880x3600",
  "5:4": "3600x2880",
  "21:9": "3840x1648",
  "9:21": "1648x3840",
  "1:3": "1280x3840",
  "3:1": "3840x1280",
  "5:3": "3600x2160",
  "3:5": "2160x3600",
  "1:1.414": "2384x3360",
  "1.414:1": "3360x2384",
  "5:7": "2400x3360",
  "7:5": "3360x2400",
};

const SIZE_512: Record<string, string> = {
  "1:1": "512x512",
  "16:9": "768x432",
  "9:16": "432x768",
  "4:3": "640x480",
  "3:4": "480x640",
  "3:2": "672x448",
  "2:3": "448x672",
  "4:5": "512x640",
  "5:4": "640x512",
  "21:9": "896x384",
  "9:21": "384x896",
  "1:3": "384x1152",
  "3:1": "1152x384",
  "5:3": "640x384",
  "3:5": "384x640",
  "1:1.414": "448x640",
  "1.414:1": "640x448",
  "5:7": "448x640",
  "7:5": "640x448",
};

const TABLES: Record<ImageSize, Record<string, string>> = {
  "512": SIZE_512,
  "1K": SIZE_1K,
  "2K": SIZE_2K,
  "4K": SIZE_4K,
};

/**
 * Resolve a logical ratio + resolution bucket to the exact `size` string
 * GPT Image 2 expects. Falls back to the matching square when the ratio is
 * unknown. Returns "auto" when the bucket itself is missing.
 */
export function ratioToSize(ratio: string, bucket: ImageSize = "2K"): string {
  const table = TABLES[bucket];
  if (!table) return "auto";
  return table[ratio] ?? table["1:1"];
}

export const OPENAI_SUPPORTED_RATIOS = Object.keys(SIZE_2K);
