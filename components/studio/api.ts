import { API_BASE } from "./config";

export async function searchReferences(query: string, eventType?: string, count = 12) {
  const resp = await fetch(`${API_BASE}/api/search/smart-references`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_type: eventType || undefined,
      theme_keywords: query.split(/\s+/).filter(Boolean),
      count,
    }),
  });
  if (!resp.ok) throw new Error(`Search failed: ${resp.status}`);
  return resp.json();
}

export async function analyzeStyle(imageUrls: string[], projectId?: string) {
  const resp = await fetch(`${API_BASE}/api/analyze/style`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_urls: imageUrls, project_id: projectId }),
  });
  if (!resp.ok) throw new Error(`Analyze failed: ${resp.status}`);
  return resp.json();
}

export async function sendChat(messages: Array<{ role: string; content: string }>, context?: any) {
  const resp = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, context }),
  });
  if (!resp.ok) throw new Error(`Chat failed: ${resp.status}`);
  return resp.json();
}

export async function generate(contents: any, model?: string) {
  const resp = await fetch(`${API_BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents, model }),
  });
  if (!resp.ok) throw new Error(`Generate failed: ${resp.status}`);
  return resp.json();
}

export async function uploadImage(file: Blob, filename = "image.png") {
  const formData = new FormData();
  formData.append("file", file, filename);
  const resp = await fetch(`${API_BASE}/api/upload`, { method: "POST", body: formData });
  if (!resp.ok) throw new Error(`Upload failed: ${resp.status}`);
  return resp.json();
}

export async function requestUpscale(file: Blob, scale = 4) {
  const formData = new FormData();
  formData.append("file", file, "image.png");
  formData.append("scale", String(scale));
  const resp = await fetch(`${API_BASE}/api/upscale`, { method: "POST", body: formData });
  if (!resp.ok) throw new Error(`Upscale failed: ${resp.status}`);
  return resp.json();
}

export function imageUrl(key: string) {
  return `${API_BASE}/api/images/${encodeURIComponent(key)}`;
}
