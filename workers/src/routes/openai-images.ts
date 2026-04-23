import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Env } from "../env";
import { OPENAI_BASE } from "../env";

// GPT Image 2 supports arbitrary WxH within these constraints:
//   - each edge multiple of 16
//   - max edge ≤ 3840
//   - aspect ratio between 1:3 and 3:1
//   - total pixels between 655,360 and 8,294,400
// Callers pre-resolve ratio → pixel size and pass it as `size`.

interface OpenAIImage {
  b64_json?: string;
  url?: string;
}

interface OpenAIImagesResponse {
  data?: OpenAIImage[];
  error?: { message?: string };
}

interface RefImage {
  mime: string;
  base64: string;
}

interface OpenAIGenerateBody {
  prompt: string;
  size?: string; // e.g. "2048x2048" or "auto"
  quality?: "low" | "medium" | "high" | "auto";
  n?: number;
  refs?: RefImage[]; // reference images for /edits endpoint
  output_format?: "png" | "jpeg" | "webp";
}

function base64ToBlob(mime: string, b64: string): Blob {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function extensionFor(mime: string): string {
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("webp")) return "webp";
  return "png";
}

export const openaiImageRoutes = new Hono<{ Bindings: Env }>();

// Unified OpenAI image-generation proxy. Branches to /v1/images/edits when
// reference images are provided, otherwise /v1/images/generations. Response
// shape is normalized to `{ imageUrl: "data:<mime>;base64,<payload>" }` so
// the frontend can treat Gemini and OpenAI responses interchangeably.
openaiImageRoutes.post("/api/generate-openai", async (c) => {
  const apiKey = c.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new HTTPException(500, { message: "OPENAI_API_KEY not configured" });
  }

  const body = await c.req.json<OpenAIGenerateBody>();
  if (!body.prompt) {
    throw new HTTPException(400, { message: "prompt required" });
  }

  const model = "gpt-image-2";
  const size = body.size ?? "auto";
  const quality = body.quality ?? "high";
  const outputFormat = body.output_format ?? "png";
  const n = body.n ?? 1;

  let response: Response;

  if (body.refs?.length) {
    // Edits endpoint — multipart form-data with image[] files.
    const form = new FormData();
    form.append("model", model);
    form.append("prompt", body.prompt);
    form.append("size", size);
    form.append("quality", quality);
    form.append("n", String(n));
    form.append("output_format", outputFormat);
    body.refs.forEach((ref, idx) => {
      const blob = base64ToBlob(ref.mime, ref.base64);
      form.append("image[]", blob, `ref-${idx}.${extensionFor(ref.mime)}`);
    });
    response = await fetch(`${OPENAI_BASE}/images/edits`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
  } else {
    // Generations endpoint — plain JSON.
    response = await fetch(`${OPENAI_BASE}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt: body.prompt,
        size,
        quality,
        n,
        output_format: outputFormat,
      }),
    });
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new HTTPException(response.status as 400, {
      message: `OpenAI error: ${errText}`,
    });
  }

  const payload = (await response.json()) as OpenAIImagesResponse;
  const b64 = payload.data?.[0]?.b64_json;
  if (!b64) {
    throw new HTTPException(500, {
      message: payload.error?.message ?? "OpenAI 응답에 이미지 없음",
    });
  }

  const mime = `image/${outputFormat}`;
  return c.json({ imageUrl: `data:${mime};base64,${b64}` });
});
