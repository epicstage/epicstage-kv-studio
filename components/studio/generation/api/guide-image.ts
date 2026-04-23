import { IMAGE_URL, isLocal } from "../../config";
import type { GuideItem, Guideline, ImageData, ImageProviderId } from "../../types";
import { extractGuideFieldsForItem } from "../design-system";
import { extractFirstImage, toInlineDataParts, type GeminiResponse } from "../gemini-utils";
import { GUIDE_IMAGE_SYSTEM } from "../prompts";
import { getProvider } from "../providers";

export interface GuideImageOptions {
  provider?: ImageProviderId;
  /**
   * Text-only CI brief (from `analyzeCi`). OpenAI branch merges this into
   * the prompt instead of attaching the CI image. Gemini branch is unchanged
   * — CI is still inlined as image parts there.
   */
  ciBrief?: string;
}

/**
 * Generate a single guideline reference image (palette sheet, mood board,
 * layout sketch, or motif board). Returns a `data:` URL.
 */
export async function generateGuideImage(
  guideline: Guideline,
  item: GuideItem,
  refAnalysis?: string,
  ciImages?: ImageData[],
  options?: GuideImageOptions,
): Promise<string> {
  const relevantFields = extractGuideFieldsForItem(guideline, item.id);
  const provider = options?.provider ?? "gemini";

  // OpenAI branch substitutes the CI image with a text brief so the logo
  // pixels don't reach /images/edits. Gemini branch keeps CI inline (its
  // inline-data prior is less aggressive about reproducing refs).
  const ciBriefBlock = options?.ciBrief?.trim()
    ? `\nBRAND CI BRIEF (text-only, no logo image attached):\n${options.ciBrief.trim()}\nDO NOT draw any logo, wordmark, or emblem. Use only palette/tone/graphic-character cues.`
    : "";

  const userContent = `Create a visual reference for: "${item.label}"
Description: ${item.description}

RELEVANT DESIGN DATA:
${JSON.stringify(relevantFields, null, 2)}
${refAnalysis ? `\nREFERENCE STYLE ANALYSIS (apply this direction):\n${refAnalysis}` : ""}${provider === "openai" ? ciBriefBlock : ""}

INSTRUCTION:
- Generate a clean, professional IMAGE for this design guideline item.
- Clean white background, professional design guide style.
- Aspect ratio: 4:3 horizontal
- Always output as an IMAGE.`;

  if (provider === "openai") {
    const openai = getProvider("openai");
    if (!openai) throw new Error("OpenAI provider not available");
    return openai.generate({
      prompt: userContent,
      system: GUIDE_IMAGE_SYSTEM,
      ratio: "4:3",
      size: "2K",
      refs: [],
    });
  }

  const url = IMAGE_URL();

  if (isLocal()) {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: userContent,
        system: GUIDE_IMAGE_SYSTEM,
        ciImages: ciImages ?? [],
      }),
    });
    if (!resp.ok) throw new Error(`Image gen failed: ${resp.status}`);
    const data = (await resp.json()) as { error?: string; imageUrl?: string };
    if (data.error) throw new Error(data.error);
    return data.imageUrl ?? "";
  }

  const parts = [
    ...toInlineDataParts(ciImages ?? [], 3),
    { text: `${GUIDE_IMAGE_SYSTEM}\n\n---\n\n${userContent}` },
  ];
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gemini-3.1-flash-image-preview",
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        temperature: 1,
        imageConfig: { imageSize: "2K" },
      },
    }),
  });

  if (!resp.ok) throw new Error(`Image gen failed: ${resp.status}`);
  return extractFirstImage((await resp.json()) as GeminiResponse);
}
