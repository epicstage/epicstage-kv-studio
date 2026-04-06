import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";

export interface Env {
  EPIC_DB: D1Database;
  EPIC_STORAGE: R2Bucket;
  EPIC_KV: KVNamespace;
  GEMINI_API_KEY: string;
  EPIC_SEARCH_URL: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS — allow local dev + deployed frontend
app.use(
  "*",
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://epic-studio.epicstage.co.kr",
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })
);

// ─── Health ──────────────────────────────────────────────────────────────────

app.get("/", (c) => c.json({ status: "ok", service: "epic-studio-api" }));

// ─── Gemini Proxy ────────────────────────────────────────────────────────────

app.post("/api/generate", async (c) => {
  const apiKey = c.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new HTTPException(500, { message: "GEMINI_API_KEY not configured" });
  }

  const body = await c.req.json();

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${
    body.model ?? "gemini-2.0-flash-exp-image-generation"
  }:generateContent?key=${apiKey}`;

  const response = await fetch(geminiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: body.contents,
      generationConfig: body.generationConfig,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new HTTPException(response.status as any, {
      message: `Gemini error: ${err}`,
    });
  }

  const data = await response.json();
  return c.json(data);
});

// ─── R2 Image Storage ─────────────────────────────────────────────────────────

app.post("/api/upload", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    throw new HTTPException(400, { message: "No file provided" });
  }

  const ext = file.name.split(".").pop() ?? "png";
  const key = `images/${crypto.randomUUID()}.${ext}`;

  await c.env.EPIC_STORAGE.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  return c.json({ id: key, url: `/api/images/${encodeURIComponent(key)}` });
});

app.get("/api/images/:id{.+}", async (c) => {
  const key = decodeURIComponent(c.req.param("id"));
  const object = await c.env.EPIC_STORAGE.get(key);

  if (!object) {
    throw new HTTPException(404, { message: "Image not found" });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return new Response(object.body, { headers });
});

// ─── Projects (D1) ───────────────────────────────────────────────────────────

app.post("/api/projects", async (c) => {
  const { name, event_info } = await c.req.json<{
    name: string;
    event_info?: Record<string, unknown>;
  }>();

  if (!name?.trim()) {
    throw new HTTPException(400, { message: "Project name is required" });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await c.env.EPIC_DB.prepare(
    `INSERT INTO projects (id, name, event_info, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`
  )
    .bind(id, name.trim(), JSON.stringify(event_info ?? {}), now, now)
    .run();

  return c.json({ id, name, event_info, created_at: now, updated_at: now }, 201);
});

app.get("/api/projects", async (c) => {
  const { results } = await c.env.EPIC_DB.prepare(
    `SELECT id, name, event_info, created_at, updated_at
     FROM projects ORDER BY created_at DESC LIMIT 50`
  ).all<{
    id: string;
    name: string;
    event_info: string;
    created_at: string;
    updated_at: string;
  }>();

  const projects = results.map((r) => ({
    ...r,
    event_info: JSON.parse(r.event_info),
  }));

  return c.json({ projects });
});

app.get("/api/projects/:id", async (c) => {
  const id = c.req.param("id");

  const project = await c.env.EPIC_DB.prepare(
    `SELECT id, name, event_info, created_at, updated_at
     FROM projects WHERE id = ?`
  )
    .bind(id)
    .first<{
      id: string;
      name: string;
      event_info: string;
      created_at: string;
      updated_at: string;
    }>();

  if (!project) {
    throw new HTTPException(404, { message: "Project not found" });
  }

  const generations = await c.env.EPIC_DB.prepare(
    `SELECT id, item_type, prompt, image_r2_key, size_spec, status, created_at
     FROM generations WHERE project_id = ? ORDER BY created_at DESC`
  )
    .bind(id)
    .all<{
      id: string;
      item_type: string;
      prompt: string;
      image_r2_key: string;
      size_spec: string;
      status: string;
      created_at: string;
    }>();

  return c.json({
    ...project,
    event_info: JSON.parse(project.event_info),
    generations: generations.results.map((g) => ({
      ...g,
      size_spec: JSON.parse(g.size_spec),
    })),
  });
});

// ─── EpicSearch Proxy (reference images) ─────────────────────────────────────

app.post("/api/search/references", async (c) => {
  const { query, engine = "all", limit = 20 } = await c.req.json<{
    query: string;
    engine?: string;
    limit?: number;
  }>();

  if (!query?.trim()) {
    throw new HTTPException(400, { message: "Query is required" });
  }

  const searchBase = c.env.EPIC_SEARCH_URL ?? "http://158.247.193.215:8788";
  const url = `${searchBase}/api/search?q=${encodeURIComponent(query)}&engine=${engine}&limit=${limit}`;

  const response = await fetch(url, {
    headers: { "User-Agent": "epic-studio-api/1.0" },
  });

  if (!response.ok) {
    throw new HTTPException(502, { message: "EpicSearch unavailable" });
  }

  const data = await response.json();
  return c.json(data);
});

// ─── Error Handler ────────────────────────────────────────────────────────────

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  console.error("[epic-studio-api]", err);
  return c.json({ error: "Internal server error" }, 500);
});

app.notFound((c) => c.json({ error: "Not found" }, 404));

export default app;
