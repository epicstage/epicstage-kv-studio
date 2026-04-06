"use client";

import { useStore, type Production } from "./use-store";
import { MASTER_CATALOG } from "./constants";

function ProductionCard({ prod }: { prod: Production }) {
  const updateProduction = useStore((s) => s.updateProduction);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50">
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-nacelle text-sm font-semibold text-white">{prod.name}</span>
          <span className="font-mono text-[10px] text-gray-600">{prod.ratio}</span>
          <span className="text-[10px] text-gray-600">{prod.category}</span>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
            prod.status === "done"
              ? "bg-emerald-500/10 text-emerald-400"
              : prod.status === "generating"
                ? "bg-indigo-500/10 text-indigo-400"
                : prod.status === "error"
                  ? "bg-red-500/10 text-red-400"
                  : "bg-gray-800 text-gray-500"
          }`}
        >
          {prod.status === "done" ? "완료" : prod.status === "generating" ? "생성 중..." : prod.status === "error" ? "오류" : "대기"}
        </span>
      </div>

      <div className="p-4">
        {/* Image area */}
        <div className="flex aspect-video items-center justify-center rounded-lg bg-gray-950">
          {prod.status === "generating" && (
            <div className="animate-pulse text-sm text-gray-600">생성 중...</div>
          )}
          {prod.status === "done" && prod.imageUrl && (
            <img src={prod.imageUrl} alt={prod.name} className="h-full w-full rounded-lg object-cover" />
          )}
          {prod.status === "error" && (
            <div className="text-xs text-red-400">{prod.error || "생성 실패"}</div>
          )}
          {prod.status === "pending" && (
            <div className="text-xs text-gray-600">생성 전</div>
          )}
        </div>

        {/* Upscale bar */}
        {prod.status === "done" && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-2">
            <select className="rounded border border-gray-800 bg-gray-950 px-2 py-1 text-xs text-gray-400">
              <option value="2">2x</option>
              <option value="4" selected>4x</option>
              <option value="8">8x</option>
            </select>
            <span className="text-[10px] text-gray-600">인쇄용 150dpi</span>
            {prod.upscaleStatus && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                prod.upscaleStatus === "done" ? "bg-emerald-500/10 text-emerald-400" : "bg-indigo-500/10 text-indigo-400"
              }`}>
                {prod.upscaleStatus === "done" ? "완료" : "대기"}
              </span>
            )}
            <button className="ml-auto rounded bg-gray-800 px-3 py-1 text-[10px] text-gray-300 transition-colors hover:bg-gray-700">
              업스케일
            </button>
          </div>
        )}

        {/* Bridge video preview */}
        {prod.status === "done" && prod.imageUrl && (
          <div className="mt-3">
            <div className="text-[10px] text-gray-600 mb-1">브릿지 영상 프리뷰</div>
            <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
              <img
                src={prod.imageUrl}
                alt=""
                className="h-full w-full object-cover animate-[kenBurns_8s_ease-in-out_infinite_alternate]"
              />
              <div className="absolute bottom-0 left-0 right-0 flex gap-1 bg-gradient-to-t from-black/80 p-2">
                <button className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-white">Zoom</button>
                <button className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-white">Pan</button>
                <button className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-white">Tilt</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductionGrid() {
  const { productions, selectedItems, isProcessing } = useStore();
  const activeVersion = useStore((s) => s.versions.find((v) => v.id === s.selectedVersionId));

  if (!activeVersion) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <div className="text-lg">Step 2에서 버전을 확정해주세요</div>
      </div>
    );
  }

  if (productions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center text-gray-400">
          <p>선택된 제작물: {selectedItems.size}종</p>
          <p className="text-xs text-gray-600 mt-1">
            {Array.from(selectedItems).map((i) => MASTER_CATALOG[i]?.name).filter(Boolean).join(", ")}
          </p>
        </div>
        <button
          disabled={selectedItems.size === 0 || isProcessing}
          className="btn mx-auto block w-full max-w-sm bg-gradient-to-t from-indigo-600 to-indigo-500 py-3 text-white disabled:opacity-50"
        >
          {isProcessing ? "생성 중..." : `${selectedItems.size}종 이미지 생성 시작`}
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {productions.map((prod) => (
        <ProductionCard key={prod.id} prod={prod} />
      ))}
    </div>
  );
}
