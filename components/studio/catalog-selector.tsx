"use client";

import { useMemo, useState } from "react";
import { useStore } from "./use-store";
import { MASTER_CATALOG, CATEGORIES } from "./constants";
import type { CatalogItem } from "./types";

type AnyCatalogItem = CatalogItem | (typeof MASTER_CATALOG)[number];

interface GroupEntry {
  key: string;          // 그룹 식별 — group 값 또는 단독 항목의 globalIdx
  label: string;        // 카드 헤더 이름
  category: string;
  variants: Array<{ item: AnyCatalogItem; globalIdx: number }>;
}

export default function CatalogSelector() {
  const { selectedItems, toggleItem, selectAllItems, deselectAllItems, customItems, addCustomItem, removeCustomItem } = useStore();
  const [category, setCategory] = useState<string>("전체");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");

  const allItems: AnyCatalogItem[] = useMemo(
    () => [...MASTER_CATALOG, ...customItems],
    [customItems],
  );

  // 그룹 단위로 묶기 — group 필드가 있으면 묶고, 없으면 단독 카드
  const groups: GroupEntry[] = useMemo(() => {
    const byKey = new Map<string, GroupEntry>();
    allItems.forEach((item, globalIdx) => {
      const groupName = (item as CatalogItem).group;
      const key = groupName ? `${item.category}::${groupName}` : `solo::${globalIdx}`;
      const label = groupName ?? item.name;
      if (!byKey.has(key)) {
        byKey.set(key, { key, label, category: item.category, variants: [] });
      }
      byKey.get(key)!.variants.push({ item, globalIdx });
    });
    return Array.from(byKey.values());
  }, [allItems]);

  const visibleGroups = category === "전체"
    ? groups
    : groups.filter((g) => g.category === category);

  function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }

  function addCustom() {
    if (!customName.trim()) return;
    const w = parseFloat(customW) || 1;
    const h = parseFloat(customH) || 1;
    const g = gcd(Math.round(w * 10), Math.round(h * 10));
    const ratio = `${Math.round(w * 10 / g)}:${Math.round(h * 10 / g)}`;
    addCustomItem({ name: customName.trim(), ratio, category: "커스텀" });
    setCustomName("");
    setCustomW("");
    setCustomH("");
    setShowCustom(false);
  }

  function toggleExpanded(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleGroup(group: GroupEntry) {
    const allSelected = group.variants.every((v) => selectedItems.has(v.globalIdx));
    group.variants.forEach((v) => {
      const isOn = selectedItems.has(v.globalIdx);
      if (allSelected && isOn) toggleItem(v.globalIdx);
      else if (!allSelected && !isOn) toggleItem(v.globalIdx);
    });
  }

  const totalVariants = allItems.length;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-nacelle text-sm font-semibold text-white">
          제작물 선택 <span className="text-indigo-400">({selectedItems.size}/{totalVariants})</span>
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[...CATEGORIES, ...(customItems.length > 0 ? ["커스텀" as const] : [])].map((cat) => (
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
              </button>
            ))}
          </div>
          <div className="h-4 w-px bg-gray-800" />
          <button onClick={selectAllItems} className="text-[10px] text-gray-500 hover:text-gray-300">전체선택</button>
          <button onClick={deselectAllItems} className="text-[10px] text-gray-500 hover:text-gray-300">해제</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibleGroups.map((group) => {
          const selectedCount = group.variants.filter((v) => selectedItems.has(v.globalIdx)).length;
          const allSelected = selectedCount === group.variants.length;
          const isSolo = group.variants.length === 1 && !(group.variants[0].item as CatalogItem).group;
          const isOpen = expanded.has(group.key) || isSolo;

          return (
            <div
              key={group.key}
              className={`rounded-lg border transition-colors ${
                selectedCount > 0
                  ? "border-indigo-500/40 bg-indigo-500/5"
                  : "border-gray-800 bg-gray-950/50"
              }`}
            >
              {/* 헤더 */}
              <div className="flex items-center gap-2 px-3 py-2">
                <button
                  onClick={() => toggleGroup(group)}
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[9px] ${
                    allSelected
                      ? "border-indigo-500 bg-indigo-500 text-white"
                      : selectedCount > 0
                        ? "border-indigo-500 bg-indigo-500/50 text-white"
                        : "border-gray-700 hover:border-gray-500"
                  }`}
                  title={allSelected ? "그룹 전체 해제" : "그룹 전체 선택"}
                >
                  {allSelected ? "✓" : selectedCount > 0 ? "−" : ""}
                </button>
                <button
                  onClick={() => !isSolo && toggleExpanded(group.key)}
                  className="flex flex-1 items-center gap-2 text-left"
                  disabled={isSolo}
                >
                  <span className="truncate text-xs font-medium text-gray-200">{group.label}</span>
                  {!isSolo && (
                    <span className="shrink-0 text-[10px] text-gray-500">
                      {selectedCount > 0 ? `${selectedCount}/${group.variants.length}` : group.variants.length}
                    </span>
                  )}
                  {!isSolo && (
                    <span className={`ml-auto shrink-0 text-gray-600 transition-transform ${isOpen ? "rotate-90" : ""}`}>
                      ›
                    </span>
                  )}
                  {isSolo && (
                    <span className="ml-auto shrink-0 font-mono text-[10px] text-gray-500">
                      {group.variants[0].item.ratio}
                    </span>
                  )}
                </button>
              </div>

              {/* variant 칩 */}
              {isOpen && !isSolo && (
                <div className="flex flex-wrap gap-1 border-t border-gray-800/50 px-3 py-2">
                  {group.variants.map((v) => {
                    const isSelected = selectedItems.has(v.globalIdx);
                    const isCustom = v.globalIdx >= MASTER_CATALOG.length;
                    return (
                      <button
                        key={v.globalIdx}
                        onClick={() => toggleItem(v.globalIdx)}
                        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-all ${
                          isSelected
                            ? "border-indigo-500/60 bg-indigo-500/10 text-indigo-200"
                            : "border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700 hover:text-gray-200"
                        }`}
                      >
                        {isSelected && <span className="text-[9px] text-indigo-400">✓</span>}
                        <span className="truncate">{v.item.name}</span>
                        <span className="font-mono text-[9px] text-gray-600">{v.item.ratio}</span>
                        {isCustom && (
                          <span
                            onClick={(e) => { e.stopPropagation(); removeCustomItem(v.globalIdx - MASTER_CATALOG.length); }}
                            className="text-[9px] text-red-500 hover:text-red-400"
                          >
                            ✕
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
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
              onClick={addCustom}
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
