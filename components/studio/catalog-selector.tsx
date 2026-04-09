"use client";

import { useState } from "react";
import { useStore } from "./use-store";
import { MASTER_CATALOG, CATEGORIES } from "./constants";

const CATEGORY_ORDER = ["메인 비주얼", "현장 설치", "인쇄", "디지털", "굿즈"] as const;

export default function CatalogSelector() {
  const { selectedItems, toggleItem, selectAllItems, deselectAllItems } = useStore();
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");

  // 카테고리별 그룹
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: MASTER_CATALOG.map((item, idx) => ({ ...item, globalIdx: idx })).filter(
      (item) => item.category === cat
    ),
  }));

  function selectCategory(cat: string) {
    MASTER_CATALOG.forEach((item, idx) => {
      if (item.category === cat && !selectedItems.has(idx)) toggleItem(idx);
    });
  }

  function deselectCategory(cat: string) {
    MASTER_CATALOG.forEach((item, idx) => {
      if (item.category === cat && selectedItems.has(idx)) toggleItem(idx);
    });
  }

  function categorySelectedCount(cat: string) {
    return MASTER_CATALOG.filter((item, idx) => item.category === cat && selectedItems.has(idx)).length;
  }

  function categoryTotal(cat: string) {
    return MASTER_CATALOG.filter((item) => item.category === cat).length;
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-nacelle text-sm font-semibold text-white">
          제작물 선택 <span className="text-indigo-400">({selectedItems.size}/{MASTER_CATALOG.length})</span>
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={selectAllItems} className="text-[10px] text-gray-500 hover:text-gray-300">전체선택</button>
          <button onClick={deselectAllItems} className="text-[10px] text-gray-500 hover:text-gray-300">전체해제</button>
        </div>
      </div>

      {/* Category sections */}
      <div className="space-y-4">
        {grouped.map(({ category, items }) => {
          const selCount = categorySelectedCount(category);
          const total = categoryTotal(category);
          const allSelected = selCount === total;

          return (
            <div key={category}>
              {/* Category header */}
              <div className="mb-2 flex items-center gap-2">
                <button
                  onClick={() => allSelected ? deselectCategory(category) : selectCategory(category)}
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[9px] transition-colors ${
                    allSelected
                      ? "border-indigo-500 bg-indigo-500 text-white"
                      : selCount > 0
                        ? "border-indigo-500/50 bg-indigo-500/20 text-indigo-400"
                        : "border-gray-700 hover:border-gray-600"
                  }`}
                >
                  {allSelected ? "✓" : selCount > 0 ? "−" : ""}
                </button>
                <span className="text-xs font-semibold text-gray-300">{category}</span>
                <span className="text-[10px] text-gray-600">({selCount}/{total})</span>
              </div>

              {/* Items grid */}
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {items.map((item) => {
                  const isSelected = selectedItems.has(item.globalIdx);
                  return (
                    <button
                      key={item.globalIdx}
                      onClick={() => toggleItem(item.globalIdx)}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition-all ${
                        isSelected
                          ? "border-indigo-500/50 bg-indigo-500/5 text-indigo-300"
                          : "border-gray-800 bg-gray-950/50 text-gray-400 hover:border-gray-700 hover:text-gray-300"
                      }`}
                    >
                      <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border text-[8px] ${
                        isSelected ? "border-indigo-500 bg-indigo-500 text-white" : "border-gray-700"
                      }`}>
                        {isSelected && "✓"}
                      </span>
                      <span className="truncate">{item.name}</span>
                      <span className="ml-auto shrink-0 font-mono text-[9px] text-gray-600">{item.ratio}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom size input */}
      <div className="mt-4 border-t border-gray-800 pt-4">
        {!showCustom ? (
          <button
            onClick={() => setShowCustom(true)}
            className="text-xs text-gray-500 hover:text-indigo-400"
          >
            + 커스텀 사이즈 추가
          </button>
        ) : (
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="mb-1 block text-[10px] text-gray-600">이름</label>
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="예: 특대 현수막"
                className="w-32 rounded border border-gray-800 bg-gray-950 px-2 py-1.5 text-xs text-gray-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-gray-600">가로 cm</label>
              <input
                value={customW}
                onChange={(e) => setCustomW(e.target.value)}
                type="number"
                placeholder="600"
                className="w-20 rounded border border-gray-800 bg-gray-950 px-2 py-1.5 text-xs text-gray-200"
              />
            </div>
            <div className="pb-1.5 text-xs text-gray-600">x</div>
            <div>
              <label className="mb-1 block text-[10px] text-gray-600">세로 cm</label>
              <input
                value={customH}
                onChange={(e) => setCustomH(e.target.value)}
                type="number"
                placeholder="180"
                className="w-20 rounded border border-gray-800 bg-gray-950 px-2 py-1.5 text-xs text-gray-200"
              />
            </div>
            {customW && customH && (
              <div className="pb-1.5 font-mono text-[10px] text-indigo-400">
                = {customW}:{customH}
              </div>
            )}
            <button
              onClick={() => { setShowCustom(false); }}
              className="rounded bg-indigo-600 px-3 py-1.5 text-xs text-white hover:bg-indigo-500"
            >
              추가
            </button>
            <button
              onClick={() => setShowCustom(false)}
              className="text-xs text-gray-600 hover:text-gray-400"
            >
              취소
            </button>
          </div>
        )}
      </div>

      {selectedItems.size > 0 && (
        <div className="mt-4 border-t border-gray-800 pt-3">
          <span className="text-xs text-gray-500">{selectedItems.size}종 선택됨</span>
        </div>
      )}
    </div>
  );
}
