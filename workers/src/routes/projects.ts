import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Env } from "../env";

interface ProjectRow {
  id: string;
  name: string;
  event_info: string;
  created_at: string;
  updated_at: string;
}

interface GenerationRow {
  id: string;
  item_type: string;
  prompt: string;
  image_r2_key: string;
  size_spec: string;
  status: string;
  created_at: string;
}

export const projectRoutes = new Hono<{ Bindings: Env }>();

projectRoutes.post("/api/projects", async (c) => {
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
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(id, name.trim(), JSON.stringify(event_info ?? {}), now, now)
    .run();

  return c.json({ id, name, event_info, created_at: now, updated_at: now }, 201);
});

projectRoutes.get("/api/projects", async (c) => {
  const { results } = await c.env.EPIC_DB.prepare(
    `SELECT id, name, event_info, created_at, updated_at
     FROM projects ORDER BY created_at DESC LIMIT 50`,
  ).all<ProjectRow>();

  const projects = results.map((r) => ({
    ...r,
    event_info: JSON.parse(r.event_info),
  }));

  return c.json({ projects });
});

projectRoutes.get("/api/projects/:id", async (c) => {
  const id = c.req.param("id");

  const project = await c.env.EPIC_DB.prepare(
    `SELECT id, name, event_info, created_at, updated_at
     FROM projects WHERE id = ?`,
  )
    .bind(id)
    .first<ProjectRow>();

  if (!project) {
    throw new HTTPException(404, { message: "Project not found" });
  }

  const generations = await c.env.EPIC_DB.prepare(
    `SELECT id, item_type, prompt, image_r2_key, size_spec, status, created_at
     FROM generations WHERE project_id = ? ORDER BY created_at DESC`,
  )
    .bind(id)
    .all<GenerationRow>();

  return c.json({
    ...project,
    event_info: JSON.parse(project.event_info),
    generations: generations.results.map((g) => ({
      ...g,
      size_spec: JSON.parse(g.size_spec),
    })),
  });
});
