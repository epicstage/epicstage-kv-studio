"use client";

import { useRef } from "react";
import { useStore } from "./use-store";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]); // strip data:...;base64,
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function EventInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { ciImages, addCiImage, removeCiImage, styleOverride, setStyleOverride } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const remaining = 8 - ciImages.length;
    const toProcess = Array.from(files).slice(0, remaining);
    for (const file of toProcess) {
      const base64 = await fileToBase64(file);
      addCiImage({
        id: "ci_" + Date.now() + "_" + Math.random().toString(36).slice(2),
        name: file.name,
        mime: file.type,
        base64,
      });
    }
  }

  return (
    <div className="space-y-4">
      {/* Event info */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
        <h3 className="mb-3 font-nacelle text-sm font-semibold text-white">
          행사 정보
        </h3>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          placeholder="행사명, 날짜, 장소, 주최기관, 테마, 슬로건 등 자유롭게 입력..."
          className="w-full resize-none rounded-lg border border-gray-800 bg-gray-950 px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/25"
        />
      </div>

      {/* CI Upload */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
        <h3 className="mb-3 font-nacelle text-sm font-semibold text-white">
          CI 이미지 <span className="text-gray-500 font-normal">로고, 최대 8장 ({ciImages.length}/8)</span>
        </h3>

        <label
          className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-700 bg-gray-950/50 px-4 py-6 text-sm text-gray-500 transition-colors hover:border-indigo-500/50 hover:text-gray-400"
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          onDragOver={(e) => e.preventDefault()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          클릭하거나 이미지를 드롭
        </label>

        {ciImages.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {ciImages.map((img) => (
              <div key={img.id} className="group relative h-16 w-16 overflow-hidden rounded-lg border border-gray-800">
                <img
                  src={`data:${img.mime};base64,${img.base64}`}
                  alt={img.name}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => removeCiImage(img.id)}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Style override */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
        <h3 className="mb-3 font-nacelle text-sm font-semibold text-white">
          추가 스타일 지시 <span className="text-gray-500 font-normal">선택</span>
        </h3>
        <input
          type="text"
          value={styleOverride}
          onChange={(e) => setStyleOverride(e.target.value)}
          placeholder="예: 전체적으로 미니멀하고 모던하게. 네온 계열 금지."
          className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/25"
        />
      </div>
    </div>
  );
}
