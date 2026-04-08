"use client";

import { useState, useEffect, useRef } from "react";
import { useStore } from "./use-store";
import { generateGuideImage } from "./guideline-generator";
import type { Version } from "./use-store";

// 섹션별 guide item id + 기본 label/description 매핑
const SECTION_IMAGE_ID: Record<string, string> = {
  color_palette: "color_palette_sheet",
  mood: "mood_board",
  graphic_motifs: "motif_board",
  layout_guide: "layout_sketches",
};

const SECTION_DEFAULTS: Record<string, { id: string; label: string; description: string }> = {
  color_palette: { id: "color_palette_sheet", label: "컬러 팔레트 시트", description: "컬러 팔레트 예시 이미지" },
  mood: { id: "mood_board", label: "무드보드", description: "무드보드 예시 이미지" },
  graphic_motifs: { id: "motif_board", label: "모티프 보드", description: "그래픽 모티프 예시 이미지" },
  layout_guide: { id: "layout_sketches", label: "레이아웃 스케치", description: "레이아웃 가이드 예시 이미지" },
};

function InlineGuideImage({
  version,
  sectionKey,
}: {
  version: Version;
  sectionKey: string;
}) {
  const { setGuideImage, refAnalysis } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const itemId = SECTION_IMAGE_ID[sectionKey];
  const item = version.guideline?.guide_items_to_visualize?.find((i) => i.id === itemId)
    || SECTION_DEFAULTS[sectionKey];
  const imageUrl = version.guideImages?.[itemId];

  if (!item) return null;

  async function handleGenerate() {
    setLoading(true);
    setError("");
    try {
      const { ciImages } = useStore.getState();
      const ci = ciImages.map((img) => ({ mime: img.mime, base64: img.base64 }));
      const url = await generateGuideImage(version.guideline, item!, refAnalysis || undefined, ci);
      setGuideImage(version.id, itemId, url);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  return (
    <div className="mt-4 rounded-lg border border-gray-800 overflow-hidden">
      {imageUrl ? (
        <div className="relative group">
          <img src={imageUrl} alt={item.label} className="w-full" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 transition-opacity">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? "재생성 중..." : "재생성"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-gray-900/60 px-4 py-3">
          <span className="text-xs text-gray-500">{item.description}</span>
          {loading ? (
            <span className="animate-pulse text-xs text-indigo-400">생성 중...</span>
          ) : (
            <button
              onClick={handleGenerate}
              className="rounded border border-gray-700 px-3 py-1 text-xs text-gray-400 hover:border-indigo-500/50 hover:text-indigo-400"
            >
              예시 이미지 생성
            </button>
          )}
          {error && <span className="ml-2 text-[10px] text-red-400">{error}</span>}
        </div>
      )}
    </div>
  );
}

function ColorSwatch({ label, hex, usage }: { label: string; hex: string; usage: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 shrink-0 rounded-lg border border-gray-700" style={{ background: hex }} />
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-300">{label}</span>
          <code className="text-[10px] text-indigo-400">{hex}</code>
        </div>
        <div className="text-[10px] text-gray-500">{usage}</div>
      </div>
    </div>
  );
}

const SECTION_KEYS = Object.keys(SECTION_IMAGE_ID);

export default function GuidelineViewer({ version }: { version: Version }) {
  const g = version.guideline;
  const autoGenRef = useRef<string | null>(null);

  // 자동 생성: 버전이 바뀌면 아직 없는 가이드 이미지를 전부 순차 생성
  useEffect(() => {
    if (!g) return;
    if (autoGenRef.current === version.id) return;
    autoGenRef.current = version.id;

    (async () => {
      const items = g.guide_items_to_visualize || [];
      const missing = SECTION_KEYS.filter((sk) => {
        const itemId = SECTION_IMAGE_ID[sk];
        return !version.guideImages?.[itemId];
      });
      if (missing.length === 0) return;

      const { ciImages, refAnalysis } = useStore.getState();
      const ci = ciImages.map((img) => ({ mime: img.mime, base64: img.base64 }));

      for (const sk of missing) {
        const itemId = SECTION_IMAGE_ID[sk];
        const item = items.find((i) => i.id === itemId) || SECTION_DEFAULTS[sk];
        if (!item) continue;
        // 생성 중 다른 버전으로 바뀌었으면 중단
        if (useStore.getState().activeVersionId !== version.id) break;
        try {
          const url = await generateGuideImage(g, item, refAnalysis || undefined, ci);
          useStore.getState().setGuideImage(version.id, itemId, url);
        } catch {
          // 실패해도 다음 진행
        }
      }
    })();
  }, [version.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!g) return null;

  return (
    <div className="space-y-5">
      {/* Event summary */}
      <div className="rounded-xl border border-gray-800 bg-gray-950/50 p-5">
        <h4 className="mb-2 font-nacelle text-base font-semibold text-white">
          {g.event_summary.name}
        </h4>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
          {g.event_summary.date && <div>날짜: {g.event_summary.date}</div>}
          {g.event_summary.venue && <div>장소: {g.event_summary.venue}</div>}
          {g.event_summary.organizer && <div>주최: {g.event_summary.organizer}</div>}
          {g.event_summary.theme && <div>테마: {g.event_summary.theme}</div>}
        </div>
        {g.event_summary.slogan && (
          <div className="mt-3 text-sm italic text-indigo-300">"{g.event_summary.slogan}"</div>
        )}
      </div>

      {/* Color palette */}
      <div className="rounded-xl border border-gray-800 bg-gray-950/50 p-5">
        <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">컬러 팔레트</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(g.color_palette).map(([key, val]) => (
            <ColorSwatch key={key} label={key} hex={val.hex} usage={val.usage} />
          ))}
        </div>
        <InlineGuideImage version={version} sectionKey="color_palette" />
      </div>

      {/* Mood */}
      <div className="rounded-xl border border-gray-800 bg-gray-950/50 p-5">
        <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">무드</h4>
        <div className="flex flex-wrap gap-2">
          {g.mood.keywords?.map((kw) => (
            <span key={kw} className="rounded-full bg-indigo-500/10 px-3 py-1 text-sm text-indigo-400 ring-1 ring-indigo-500/20">
              {kw}
            </span>
          ))}
        </div>
        {g.mood.tone && <div className="mt-2 text-sm text-gray-500">톤: {g.mood.tone}</div>}
        <InlineGuideImage version={version} sectionKey="mood" />
      </div>

      {/* Graphic motifs */}
      <div className="rounded-xl border border-gray-800 bg-gray-950/50 p-5">
        <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">그래픽 모티프</h4>
        <div className="space-y-1.5 text-sm text-gray-400">
          <div>스타일: {g.graphic_motifs?.style}</div>
          <div>텍스처: {g.graphic_motifs?.texture}</div>
          <div>아이콘: {g.graphic_motifs?.icon_style}</div>
          <div className="flex flex-wrap gap-1 pt-1">
            {g.graphic_motifs?.elements?.map((el) => (
              <span key={el} className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400">{el}</span>
            ))}
          </div>
        </div>
        <InlineGuideImage version={version} sectionKey="graphic_motifs" />
      </div>

      {/* Layout guide */}
      {g.layout_guide && (
        <div className="rounded-xl border border-gray-800 bg-gray-950/50 p-5">
          <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">레이아웃 가이드</h4>
          <div className="space-y-1.5 text-sm text-gray-400">
            {Object.entries(g.layout_guide).map(([key, val]) => val && (
              <div key={key} className="flex gap-2">
                <span className="shrink-0 font-mono text-[10px] text-gray-600 uppercase">{key}</span>
                <span>{val as string}</span>
              </div>
            ))}
          </div>
          <InlineGuideImage version={version} sectionKey="layout_guide" />
        </div>
      )}

    </div>
  );
}
