import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Env } from "../env";

export const imageRoutes = new Hono<{ Bindings: Env }>();

// Recraft V4 KV generation. V4 doesn't accept `style` / `style_id` — colors
// + prompt are the only style levers.
imageRoutes.post("/api/recraft/generate-kv", async (c) => {
  const token = c.env.RECRAFT_API_TOKEN;
  if (!token) throw new HTTPException(500, { message: "RECRAFT_API_TOKEN not configured" });

  const { prompt, size, colors, vector } = await c.req.json<{
    prompt: string;
    size?: string;
    colors?: Array<{ rgb: [number, number, number] }>;
    vector?: boolean;
  }>();

  if (!prompt) throw new HTTPException(400, { message: "prompt required" });

  const body: Record<string, unknown> = {
    prompt,
    model: vector ? "recraftv4_vector" : "recraftv4",
    size: size || (vector ? "16:9" : "1344x768"),
    response_format: "b64_json",
    n: 1,
  };
  if (colors?.length) body.controls = { colors };

  const resp = await fetch("https://external.api.recraft.ai/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.text();
    return c.text(`Recraft error: ${err}`, resp.status as 400);
  }

  const data = (await resp.json()) as {
    data?: Array<{ b64_json?: string; url?: string }>;
  };
  const item = data?.data?.[0];
  if (!item) throw new HTTPException(500, { message: "Recraft: empty response" });

  return c.json({
    b64: item.b64_json,
    url: item.url,
    content_type: vector ? "image/svg+xml" : "image/png",
  });
});

// Vectorize a raster image → SVG. Two providers: vectorizer.ai (default) or
// Recraft AI. Both return `image/svg+xml` text.
imageRoutes.post("/api/vectorize", async (c) => {
  const formData = await c.req.formData();
  const image = formData.get("image") as File | null;
  const provider = (formData.get("provider") as string) || "vectorizer";

  if (!image) {
    throw new HTTPException(400, { message: "image required" });
  }

  if (provider === "recraft") {
    const token = c.env.RECRAFT_API_TOKEN;
    if (!token) throw new HTTPException(500, { message: "RECRAFT_API_TOKEN not configured" });

    const form = new FormData();
    form.append("file", image);
    form.append("response_format", "b64_json");

    const resp = await fetch("https://external.api.recraft.ai/v1/images/vectorize", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!resp.ok) {
      const err = await resp.text();
      return c.text(`Recraft error: ${err}`, resp.status as 400);
    }
    const data = (await resp.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
    const b64 = data?.data?.[0]?.b64_json;
    if (b64) {
      return c.text(atob(b64), 200, { "Content-Type": "image/svg+xml" });
    }
    const url = data?.data?.[0]?.url;
    if (url) {
      const svgResp = await fetch(url);
      return c.text(await svgResp.text(), 200, { "Content-Type": "image/svg+xml" });
    }
    return c.text("Recraft: no SVG in response", 500);
  }

  const apiId = c.env.VECTORIZER_API_ID;
  const apiSecret = c.env.VECTORIZER_API_SECRET;
  if (!apiId || !apiSecret) {
    throw new HTTPException(500, { message: "VECTORIZER_API_ID/SECRET not configured" });
  }

  const form = new FormData();
  form.append("image", image);
  form.append("output.file_format", "svg");
  form.append("output.svg.version", "svg_1_1");
  form.append("processing.max_colors", "0");

  const resp = await fetch("https://api.vectorizer.ai/api/v1/vectorize", {
    method: "POST",
    headers: { Authorization: "Basic " + btoa(`${apiId}:${apiSecret}`) },
    body: form,
  });
  if (!resp.ok) {
    const err = await resp.text();
    return c.text(`Vectorizer.ai error: ${err}`, resp.status as 400);
  }
  return c.text(await resp.text(), 200, { "Content-Type": "image/svg+xml" });
});
