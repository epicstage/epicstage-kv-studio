"use client";

import type { Version } from "./use-store";

function ColorSwatch({ label, hex, usage }: { label: string; hex: string; usage: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 shrink-0 rounded-lg border border-gray-700" style={{ background: hex }} />
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

export default function GuidelineViewer({ version }: { version: Version }) {
  const g = version.guideline;
  if (!g) return null;

  return (
    <div className="space-y-4">
      {/* Event summary */}
      <div className="rounded-lg border border-gray-800 bg-gray-950/50 p-4">
        <h4 className="mb-2 font-nacelle text-sm font-semibold text-white">
          {g.event_summary.name}
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
          {g.event_summary.date && <div>날짜: {g.event_summary.date}</div>}
          {g.event_summary.venue && <div>장소: {g.event_summary.venue}</div>}
          {g.event_summary.organizer && <div>주최: {g.event_summary.organizer}</div>}
          {g.event_summary.theme && <div>테마: {g.event_summary.theme}</div>}
        </div>
        {g.event_summary.slogan && (
          <div className="mt-2 text-sm italic text-indigo-300">"{g.event_summary.slogan}"</div>
        )}
      </div>

      {/* Color palette */}
      <div className="rounded-lg border border-gray-800 bg-gray-950/50 p-4">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          컬러 팔레트
        </h4>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(g.color_palette).map(([key, val]) => (
            <ColorSwatch key={key} label={key} hex={val.hex} usage={val.usage} />
          ))}
        </div>
      </div>

      {/* Typography */}
      <div className="rounded-lg border border-gray-800 bg-gray-950/50 p-4">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          타이포그래피
        </h4>
        <div className="space-y-2">
          {Object.entries(g.typography).map(([key, val]) => (
            <div key={key} className="flex items-baseline justify-between text-xs">
              <span className="font-medium text-gray-300">{key}</span>
              <span className="text-gray-500">
                {val.font} · {val.size_range}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mood */}
      <div className="rounded-lg border border-gray-800 bg-gray-950/50 p-4">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          무드
        </h4>
        <div className="flex flex-wrap gap-2">
          {g.mood.keywords?.map((kw) => (
            <span
              key={kw}
              className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs text-indigo-400 ring-1 ring-indigo-500/20"
            >
              {kw}
            </span>
          ))}
        </div>
        {g.mood.tone && <div className="mt-2 text-xs text-gray-500">톤: {g.mood.tone}</div>}
      </div>

      {/* Graphic motifs */}
      <div className="rounded-lg border border-gray-800 bg-gray-950/50 p-4">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          그래픽 모티프
        </h4>
        <div className="space-y-1 text-xs text-gray-400">
          <div>스타일: {g.graphic_motifs.style}</div>
          <div>텍스처: {g.graphic_motifs.texture}</div>
          <div>아이콘: {g.graphic_motifs.icon_style}</div>
          <div className="flex flex-wrap gap-1 pt-1">
            {g.graphic_motifs.elements?.map((el) => (
              <span key={el} className="rounded bg-gray-800 px-2 py-0.5 text-[10px] text-gray-400">
                {el}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
