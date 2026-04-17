import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Env } from "../env";
import { naverSearch, type NaverSearchResult } from "../services/naver-search";

// Keyword templates for supported event types. Each produces 2 queries that
// expand the event theme into a Korean search phrase.
const QUERY_TEMPLATES: Record<string, string[]> = {
  세미나: ["{theme} 세미나 무대 디자인", "{theme} 포럼 포토월"],
  컨퍼런스: ["{theme} 컨퍼런스 백드롭", "{theme} 대형 행사 무대"],
  시상식: ["{theme} 시상식 무대 연출", "{theme} 어워드 포토월"],
  전시: ["{theme} 전시부스 디자인", "{theme} 박람회 부스 연출"],
  네트워킹: ["{theme} 네트워킹 행사 디자인", "{theme} 밋업 공간 연출"],
  교육: ["{theme} 교육 행사 배너", "{theme} 수료식 무대"],
  축제: ["{theme} 페스티벌 디자인", "{theme} 축제 현장 연출"],
};

export const searchRoutes = new Hono<{ Bindings: Env }>();

searchRoutes.post("/api/search/references", async (c) => {
  const { query, limit = 20 } = await c.req.json<{ query: string; limit?: number }>();

  if (!query?.trim()) {
    throw new HTTPException(400, { message: "Query is required" });
  }

  const results = await naverSearch(c.env, query, Math.min(limit, 20));
  return c.json({ results, total: results.length, query });
});

searchRoutes.post("/api/search/smart-references", async (c) => {
  const { event_type, theme_keywords = [], count = 12 } = await c.req.json<{
    event_type?: string;
    theme_keywords?: string[];
    count?: number;
  }>();

  const theme = theme_keywords.join(" ") || "모던";
  const templates = QUERY_TEMPLATES[event_type ?? ""] ?? ["{theme} 행사 디자인"];
  const queries = templates.map((t) => t.replace("{theme}", theme));

  const allResults: NaverSearchResult[] = [];
  for (const q of queries) {
    try {
      const items = await naverSearch(c.env, q, Math.ceil(count / queries.length));
      allResults.push(...items);
    } catch {
      /* skip failed queries */
    }
  }

  const seen = new Set<string>();
  const unique = allResults
    .filter((r) => {
      if (!r.url || seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    })
    .slice(0, count);

  return c.json({ results: unique, queries_used: queries });
});
