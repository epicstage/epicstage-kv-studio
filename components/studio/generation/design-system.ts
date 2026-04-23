import type { Guideline } from "../types";

/**
 * Pick the subset of guideline fields that matters for a given guide-image
 * item (e.g. the palette sheet only needs colors + mood). Keeps the JSON sent
 * to the model small and focused.
 */
export function extractGuideFieldsForItem(
  guideline: Guideline,
  itemId: string,
): Partial<Guideline> {
  const g = guideline;
  switch (itemId) {
    case "color_palette_sheet":
      return { color_palette: g.color_palette, mood: g.mood };
    case "typography_sheet":
      return {
        typography: g.typography,
        color_palette: {
          primary: g.color_palette?.primary,
          background: g.color_palette?.background,
          text_dark: g.color_palette?.text_dark,
        } as Guideline["color_palette"],
      };
    case "motif_board":
      return {
        graphic_motifs: g.graphic_motifs,
        color_palette: g.color_palette,
        mood: g.mood,
      };
    case "logo_usage_sheet":
      return {
        logo_usage: g.logo_usage,
        color_palette: {
          primary: g.color_palette?.primary,
          background: g.color_palette?.background,
        } as Guideline["color_palette"],
      };
    case "mood_board":
      return {
        mood: g.mood,
        color_palette: g.color_palette,
        graphic_motifs: g.graphic_motifs,
        event_summary: {
          name: g.event_summary?.name,
          theme: g.event_summary?.theme,
        } as Guideline["event_summary"],
      };
    default:
      return {
        color_palette: g.color_palette,
        typography: g.typography,
        graphic_motifs: g.graphic_motifs,
        mood: g.mood,
      };
  }
}

/**
 * Build the DESIGN SYSTEM description block that's embedded into both master
 * KV and per-production prompts. Output format is stable — downstream prompts
 * rely on it.
 */
export function extractDesignSystemForProduction(guideline: Guideline): string {
  const g = guideline;
  const c = g.color_palette || {};
  const t = g.typography || {};
  const m = g.graphic_motifs || {};
  const mood = g.mood || {};
  const event = g.event_summary || ({} as Guideline["event_summary"]);

  const colorLine = Object.entries(c)
    .filter(([, v]) => v?.hex)
    .map(([k, v]) => `${k}: ${v.hex}`)
    .join(", ");

  return `EVENT: "${event.name}"${event.name_en ? ` / "${event.name_en}"` : ""}${event.date ? `, ${event.date}` : ""}${event.venue ? `, ${event.venue}` : ""}${event.organizer ? `, ${event.organizer}` : ""}${event.slogan ? ` — "${event.slogan}"` : ""}

DESIGN SYSTEM:
Colors — ${colorLine}
Typography — Headline: ${t.headline?.font} ${t.headline?.size_range}, Sub: ${t.subheading?.font}, Body: ${t.body?.font}
Style: ${m.style}${m.elements?.length ? `. Elements: ${m.elements.join(", ")}` : ""}${m.texture ? `. Texture: ${m.texture}` : ""}${m.icon_style ? `. Icons: ${m.icon_style}` : ""}
Mood: ${mood.tone}${mood.keywords?.length ? ` (${mood.keywords.join(", ")})` : ""}`;
}
