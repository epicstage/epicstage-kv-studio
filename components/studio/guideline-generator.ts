import type { Guideline, Version } from "./use-store";

const API_BASE = "https://epic-studio-api.pd-302.workers.dev";

export async function generateGuideline(
  eventInfo: string,
  styleOverride: string,
  existingTones: string[] = []
): Promise<Guideline> {
  const diversityHint =
    existingTones.length > 0
      ? `\n\n## 중요: 기존 버전들과 다른 방향\n기존 무드/톤: ${existingTones.join(", ")}\n→ 완전히 다른 컬러 팔레트, 무드, 스타일로 생성할 것.`
      : "";

  const prompt = `너는 행사 브랜딩 전문 디자이너야.
아래 입력을 바탕으로 디자인 가이드라인을 JSON으로 생성해줘.

## 행사 정보
${eventInfo}
${styleOverride ? `\n## 추가 스타일 지시\n${styleOverride}` : ""}
${diversityHint}

## 출력 형식 (JSON만, 다른 텍스트 금지)
{
  "event_summary": { "name": "", "name_en": "", "date": "", "venue": "", "organizer": "", "theme": "", "slogan": "" },
  "color_palette": {
    "primary": { "hex": "", "usage": "" }, "secondary": { "hex": "", "usage": "" },
    "accent": { "hex": "", "usage": "" }, "background": { "hex": "", "usage": "" },
    "text_dark": { "hex": "", "usage": "" }, "text_light": { "hex": "", "usage": "" }
  },
  "typography": {
    "headline": { "font": "", "size_range": "", "note": "" },
    "subheading": { "font": "", "size_range": "", "note": "" },
    "body": { "font": "", "size_range": "", "note": "" },
    "caption": { "font": "", "size_range": "", "note": "" }
  },
  "graphic_motifs": { "style": "", "elements": [], "texture": "", "icon_style": "" },
  "layout_guide": { "kv": "", "banner_horizontal": "", "sns_square": "", "sns_story": "", "stage_backdrop": "", "entrance_banner": "", "photowall": "" },
  "logo_usage": { "primary_placement": "", "min_size": "", "clear_space": "", "on_dark": "", "on_light": "" },
  "mood": { "keywords": [], "tone": "" },
  "guide_items_to_visualize": [
    { "id": "color_palette_sheet", "label": "컬러 팔레트 시트", "description": "6색 팔레트 + 사용처 표기" },
    { "id": "typography_sheet", "label": "타이포그래피 가이드 시트", "description": "폰트 패밀리 + 사이즈 시스템" },
    { "id": "motif_board", "label": "그래픽 모티프 보드", "description": "패턴, 텍스처, 아이콘 스타일" },
    { "id": "layout_sketches", "label": "레이아웃 가이드 스케치", "description": "KV, 배너, SNS 레이아웃 구성" },
    { "id": "logo_usage_sheet", "label": "로고 사용 가이드", "description": "배치, 최소 크기, 여백 규정" },
    { "id": "mood_board", "label": "무드 보드", "description": "전체 분위기 시각화" }
  ]
}`;

  const resp = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!resp.ok) throw new Error(`Generate failed: ${resp.status}`);
  const data = await resp.json();
  const text = data.reply ?? "";

  return parseJSON(text);
}

export async function generateGuideImage(
  guideline: Guideline,
  item: { id: string; label: string; description: string }
): Promise<string> {
  const prompt = `Create a professional design asset: "${item.label}"
Description: ${item.description}

Design context:
${JSON.stringify(guideline, null, 2)}

Generate a clean, professional visual for this design guideline item.
Return the image.`;

  const resp = await fetch(`${API_BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!resp.ok) throw new Error(`Image gen failed: ${resp.status}`);
  const data = await resp.json();

  // OpenRouter returns choices[].message.content
  const content = data.choices?.[0]?.message?.content ?? "";
  return content;
}

function parseJSON(text: string): Guideline {
  // Strip markdown code fences
  let cleaned = text.replace(/```json?\n?/g, "").replace(/\n?```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("JSON 구조를 찾을 수 없습니다");
  cleaned = cleaned.substring(start, end + 1).replace(/,\s*([}\]])/g, "$1");
  return JSON.parse(cleaned);
}

export function createVersion(num: number, guideline: Guideline): Version {
  return {
    id: "ver_" + Date.now(),
    num,
    label: `Ver.${num}`,
    guideline,
    preview: {
      colors: Object.values(guideline.color_palette || {}).slice(0, 4).map((c) => c.hex).filter(Boolean),
      mood: guideline.mood?.keywords?.slice(0, 3) || [],
      tone: guideline.mood?.tone || "",
    },
    guideImages: {},
  };
}
