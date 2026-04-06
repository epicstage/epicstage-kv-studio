"use client";

import { useState } from "react";
import { MASTER_CATALOG, CATEGORIES } from "./constants";

export default function CatalogSelector() {
  const [category, setCategory] = useState("전체");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const filtered = category === "전체"
    ? MASTER_CATALOG
    : MASTER_CATALOG.filter((item) => item.category === category);

  function toggle(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-nacelle text-sm font-semibold text-white">
          제작물 선택 <span className="text-indigo-400">({selected.size}/{MASTER_CATALOG.length})</span>
        </h3>
        <div className="flex gap-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                category === cat
                  ? "bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {cat}
              <span className="ml-1 text-gray-600">
                ({cat === "전체"
                  ? MASTER_CATALOG.length
                  : MASTER_CATALOG.filter((i) => i.category === cat).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filtered.map((item, i) => {
          const globalIdx = MASTER_CATALOG.indexOf(item);
          const isSelected = selected.has(globalIdx);
          return (
            <button
              key={globalIdx}
              onClick={() => toggle(globalIdx)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-all ${
                isSelected
                  ? "border-indigo-500/50 bg-indigo-500/5 text-indigo-300"
                  : "border-gray-800 bg-gray-950/50 text-gray-400 hover:border-gray-700 hover:text-gray-300"
              }`}
            >
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[9px] ${
                isSelected
                  ? "border-indigo-500 bg-indigo-500 text-white"
                  : "border-gray-700"
              }`}>
                {isSelected && "✓"}
              </span>
              <span className="truncate">{item.name}</span>
              <span className="ml-auto shrink-0 font-mono text-[10px] text-gray-600">{item.ratio}</span>
            </button>
          );
        })}
      </div>

      {selected.size > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-gray-500">{selected.size}종 선택됨</span>
          <button className="btn rounded-lg bg-gradient-to-t from-indigo-600 to-indigo-500 px-6 py-2 text-sm font-medium text-white">
            제작물 이미지 생성 →
          </button>
        </div>
      )}
    </div>
  );
}
