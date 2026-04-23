import type { ColorEntry, Guideline, ImageProviderId, Version } from "../types";

/**
 * Create a new Version wrapper around a freshly generated guideline. Derives
 * a small preview (first 4 palette colors + mood keywords) for the list UI.
 * The provider selected at Step 1 is stamped on the version so Step 2/3/4
 * image generation calls stay consistent within a single version.
 */
export function createVersion(
  num: number,
  guideline: Guideline,
  provider: ImageProviderId = "gemini",
): Version {
  return {
    id: "ver_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
    num,
    label: `Ver.${num}`,
    guideline,
    preview: {
      colors: Object.values(guideline.color_palette || {})
        .slice(0, 4)
        .map((c: ColorEntry) => c.hex)
        .filter(Boolean),
      mood: guideline.mood?.keywords?.slice(0, 3) || [],
      tone: guideline.mood?.tone || "",
    },
    guideImages: {},
    provider,
  };
}
