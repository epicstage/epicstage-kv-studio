import { API_BASE, isLocal } from "../../config";
import { ratioToSize } from "./ratio-to-size";
import type { GenerateRequest, ImageProvider } from "./types";

const OPENAI_URL = () =>
  isLocal() ? "/api/generate-openai/" : `${API_BASE}/api/generate-openai`;

/**
 * GPT Image 2 provider. The worker proxy accepts a normalized
 * `{prompt, size, quality, refs}` payload and responds with
 * `{imageUrl: "data:<mime>;base64,..."}` so the frontend never touches the
 * OpenAI wire format directly.
 */
export const openaiProvider: ImageProvider = {
  id: "openai",
  async generate(req: GenerateRequest): Promise<string> {
    // OpenAI Images API has no separate system prompt field — merge into
    // the user prompt exactly the way the existing Gemini adapter does.
    const prompt = req.system
      ? `${req.system}\n\n---\n\n${req.prompt}`
      : req.prompt;

    const size = ratioToSize(req.ratio, req.size ?? "2K");

    const body = {
      prompt,
      size,
      quality: req.quality ?? "high",
      n: 1,
      output_format: "png" as const,
      refs: req.refs && req.refs.length > 0 ? req.refs : undefined,
    };

    const resp = await fetch(OPENAI_URL(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`OpenAI 생성 실패 (${resp.status}): ${text.slice(0, 200)}`);
    }

    const data = (await resp.json()) as { imageUrl?: string; error?: string };
    if (data.error) throw new Error(data.error);
    if (!data.imageUrl) throw new Error("OpenAI 응답에 imageUrl 없음");
    return data.imageUrl;
  },
};
