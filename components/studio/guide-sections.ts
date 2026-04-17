import type { GuideItem } from "./types";

// Maps a guideline section key to the matching `guide_items_to_visualize` id.
export const SECTION_IMAGE_ID: Record<string, string> = {
  color_palette: "color_palette_sheet",
  typography: "typography_sheet",
  mood: "mood_board",
  graphic_motifs: "motif_board",
  layout_guide: "layout_sketches",
  logo_usage: "logo_usage_sheet",
};

// Fallback definitions used when the guideline doesn't include a matching
// `guide_items_to_visualize` entry.
export const SECTION_DEFAULTS: Record<string, GuideItem> = {
  color_palette: {
    id: "color_palette_sheet",
    label: "컬러 팔레트 시트",
    description: "컬러 팔레트 예시 이미지",
  },
  typography: {
    id: "typography_sheet",
    label: "타이포그래피 가이드 시트",
    description: "폰트 패밀리 + 사이즈 시스템",
  },
  mood: { id: "mood_board", label: "무드보드", description: "무드보드 예시 이미지" },
  graphic_motifs: {
    id: "motif_board",
    label: "모티프 보드",
    description: "그래픽 모티프 예시 이미지",
  },
  layout_guide: {
    id: "layout_sketches",
    label: "레이아웃 스케치",
    description: "레이아웃 가이드 예시 이미지",
  },
  logo_usage: {
    id: "logo_usage_sheet",
    label: "로고 사용 가이드",
    description: "배치·최소 크기·여백 규정",
  },
};

export const SECTION_KEYS = Object.keys(SECTION_IMAGE_ID);
