import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Env } from "../env";

export const storageRoutes = new Hono<{ Bindings: Env }>();

// R2 upload → returns opaque key + a worker-served URL.
storageRoutes.post("/api/upload", async (c) => {
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

// R2 fetch with immutable cache — keys are UUID-scoped.
storageRoutes.get("/api/images/:id{.+}", async (c) => {
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
