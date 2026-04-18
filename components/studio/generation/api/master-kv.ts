import { IMAGE_URL, isLocal } from "../../config";
import type { Guideline, ImageData } from "../../types";
import { extractDesignSystemForProduction } from "../design-system";
import {
  extractFirstImage,
  splitDataUrl,
  toInlineDataParts,
  type GeminiResponse,
  type InlineDataPart,
} from "../gemini-utils";
import { PRINT_SPEC_INSTRUCTION, PRODUCTION_SYSTEM } from "../prompts";

const MAX_GUIDE_IMAGES = 4;

function guideImagesToParts(guideImages?: Record<string, string>): InlineDataPart[] {
  if (!guideImages) return [];
  const parts: InlineDataPart[] = [];
  for (const url of Object.values(guideImages)) {
    if (!url) continue;
    const split = splitDataUrl(url);
    if (!split) continue;
    parts.push({ inlineData: { mimeType: split.mime, data: split.base64 } });
    if (parts.length >= MAX_GUIDE_IMAGES) break;
  }
  return parts;
}

function guideImagesToUrls(guideImages?: Record<string, string>): string[] {
  if (!guideImages) return [];
  return Object.values(guideImages).filter(Boolean).slice(0, MAX_GUIDE_IMAGES);
}

/**
 * Build the user-facing prompt for the master KV. Pure function — exposed
 * separately so the UI can preview exactly what will be sent to Gemini.
 */
export function buildMasterKvPrompt(
  guideline: Guideline,
  ratio: string,
  kvName: string,
  refAnalysis?: string,
): { system: string; user: string } {
  const designSystem = extractDesignSystemForProduction(guideline, "kv");

  const user = `Professional event key visual (master KV). Production-ready.
Aspect ratio: ${ratio}.
Type: ${kvName}

${designSystem}

=== TEXTS TO RENDER ===
- HEADLINE: "${guideline.event_summary?.name}"
${guideline.event_summary?.date ? `- DATE: "${guideline.event_summary.date}"` : ""}
${guideline.event_summary?.slogan ? `- SLOGAN: "${guideline.event_summary.slogan}"` : ""}

=== VISUAL STYLE ===
This is the MASTER Key Visual. Make it bold, memorable, and visually striking.
All graphic motifs, colors, and mood from the design system must be fully expressed.
Attached guide images (color palette, moodboard, motif board, layout sketches) define the visual direction — extract palette, graphic motifs, and compositional language from them and apply faithfully.
${refAnalysis ? `Reference direction: ${refAnalysis}` : ""}

RENDERING:
${PRINT_SPEC_INSTRUCTION}

REQUIREMENTS:
- This is the hero image — highest visual impact
- Render ONLY the text listed above
- Professional print/digital quality`;

  return { system: PRODUCTION_SYSTEM, user };
}

/**
 * Generate the master KV — the hero image all 54 production variants derive
 * from. Returns a `data:` URL.
 */
export async function generateMasterKV(
  guideline: Guideline,
  ratio: string,
  kvName: string,
  ciImages?: ImageData[],
  refAnalysis?: string,
  guideImages?: Record<string, string>,
): Promise<string> {
  const { system, user: userContent } = buildMasterKvPrompt(guideline, ratio, kvName, refAnalysis);

  const url = IMAGE_URL();

  if (isLocal()) {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: userContent,
        system,
        ciImages: ciImages ?? [],
        guideImageUrls: guideImagesToUrls(guideImages),
      }),
    });
    if (!resp.ok) throw new Error(`KV 생성 실패: ${resp.status}`);
    const data = (await resp.json()) as { error?: string; imageUrl?: string };
    if (data.error) throw new Error(data.error);
    return data.imageUrl ?? "";
  }

  const parts = [
    ...toInlineDataParts(ciImages ?? [], 3),
    ...guideImagesToParts(guideImages),
    { text: `${system}\n\n---\n\n${userContent}` },
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

  if (!resp.ok) throw new Error(`KV 생성 실패: ${resp.status}`);
  return extractFirstImage((await resp.json()) as GeminiResponse, "KV 이미지 미포함 응답");
}
