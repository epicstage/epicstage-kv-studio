"use client";

import { useState } from "react";
import { searchReferences } from "./api";
import { EVENT_TYPES } from "./constants";

interface RefResult {
  title: string;
  url: string;
  thumbnail: string;
  source: string;
}

export default function ReferenceSearch({
  selectedRefs,
  onSelectRef,
}: {
  selectedRefs: string[];
  onSelectRef: (url: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [eventType, setEventType] = useState("");
  const [results, setResults] = useState<RefResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await searchReferences(query, eventType);
      setResults(data.images || []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
      <h3 className="mb-3 font-nacelle text-sm font-semibold text-white">
        레퍼런스 검색
      </h3>

      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="예: 기업 세미나 포토월 모던"
          className="flex-1 rounded-lg border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/25"
        />
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2.5 text-sm text-gray-400"
        >
          <option value="">전체</option>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "..." : "검색"}
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8 text-sm text-gray-500">
          이미지 검색 중...
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {results.map((r, i) => {
              const isSelected = selectedRefs.includes(r.url);
              return (
                <button
                  key={i}
                  onClick={() => onSelectRef(r.url)}
                  className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                    isSelected
                      ? "border-indigo-500 shadow-lg shadow-indigo-500/20"
                      : "border-transparent hover:border-gray-700"
                  }`}
                >
                  {r.thumbnail ? (
                    <img
                      src={r.thumbnail}
                      alt={r.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-800 text-[10px] text-gray-500">
                      {r.source}
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-indigo-600/30">
                      <svg className="h-6 w-6 fill-white" viewBox="0 0 16 16">
                        <path d="M14.3.3c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4l-8 8c-.2.2-.4.3-.7.3-.3 0-.5-.1-.7-.3l-4-4c-.4-.4-.4-1 0-1.4.4-.4 1-.4 1.4 0L7 7.6 14.3.3z" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-3 text-xs text-gray-500">
            {selectedRefs.length}장 선택됨
          </div>
        </>
      )}
    </div>
  );
}
