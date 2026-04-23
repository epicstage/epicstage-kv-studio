import { describe, expect, it } from "vitest";
import type { Guideline } from "../types";
import {
  extractDesignSystemForProduction,
  extractGuideFieldsForItem,
} from "./design-system";

function guideline(overrides: Partial<Guideline> = {}): Guideline {
  return {
    event_summary: {
      name: "행사",
      name_en: "Event",
      date: "2026-01-01",
      venue: "서울",
      organizer: "오가나이저",
      theme: "테마",
      slogan: "슬로건",
    },
    color_palette: {
      primary: { hex: "#112233", usage: "메인" },
      secondary: { hex: "#445566", usage: "보조" },
    },
    typography: {
      headline: { font: "Inter", size_range: "48-72", note: "" },
      subheading: { font: "Inter", size_range: "24-36", note: "" },
      body: { font: "Inter", size_range: "14-16", note: "" },
      caption: { font: "Inter", size_range: "10-12", note: "" },
    },
    graphic_motifs: {
      style: "modern",
      elements: ["dots", "lines"],
      texture: "matte",
      icon_style: "outline",
    },
    logo_usage: { primary_placement: "우하단", min_size: "30mm", clear_space: "1x", on_dark: "", on_light: "" },
    mood: { keywords: ["bold", "clean"], tone: "정돈된" },
    guide_items_to_visualize: [],
    ...overrides,
  };
}

describe("extractGuideFieldsForItem", () => {
  it("returns only palette + mood for color_palette_sheet", () => {
    const fields = extractGuideFieldsForItem(guideline(), "color_palette_sheet");
    expect(Object.keys(fields).sort()).toEqual(["color_palette", "mood"]);
  });

  it("returns the default broad set for unknown ids", () => {
    const fields = extractGuideFieldsForItem(guideline(), "unknown_id");
    expect(Object.keys(fields).sort()).toEqual([
      "color_palette",
      "graphic_motifs",
      "mood",
      "typography",
    ]);
  });
});

describe("extractDesignSystemForProduction", () => {
  it("inlines hex colors and mood keywords", () => {
    const s = extractDesignSystemForProduction(guideline());
    expect(s).toContain("primary: #112233");
    expect(s).toContain("secondary: #445566");
    expect(s).toContain("(bold, clean)");
    expect(s).toContain('EVENT: "행사"');
  });

  it("does not emit any layout line", () => {
    const s = extractDesignSystemForProduction(guideline());
    expect(s).not.toContain("Layout:");
  });
});
