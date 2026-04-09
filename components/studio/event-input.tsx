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

function compressImage(file: File, maxDim = 1024, quality = 0.8): Promise<{ base64: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve({ base64: dataUrl.split(",")[1], mime: "image/jpeg" });
    };
    img.onerror = reject;
    const reader = new FileReader();
    reader.onload = () => { img.src = reader.result as string; };
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
  const { ciImages, addCiImage, removeCiImage, ciDocs, addCiDoc, removeCiDoc, styleOverride, setStyleOverride } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const remaining = 8 - ciImages.length;
    const toProcess = Array.from(files).slice(0, remaining);
    for (const file of toProcess) {
      const { base64, mime } = await compressImage(file, 1024, 0.8);
      addCiImage({
        id: "ci_" + Date.now() + "_" + Math.random().toString(36).slice(2),
        name: file.name,
        mime,
        base64,
      });
    }
  }

  async function handleDocs(files: FileList | null) {
    if (!files) return;
    const remaining = 5 - ciDocs.length;
    const toProcess = Array.from(files).slice(0, remaining);
    for (const file of toProcess) {
      const base64 = await fileToBase64(file);
      const mime = file.name.endsWith(".ai") ? "application/pdf" : file.type;
      addCiDoc({
        id: "doc_" + Date.now() + "_" + Math.random().toString(36).slice(2),
        name: file.name,
        mime,
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

      {/* CI Guide Docs */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
        <h3 className="mb-3 font-nacelle text-sm font-semibold text-white">
          CI 가이드 문서 <span className="text-gray-500 font-normal">PDF 등, 최대 5개 ({ciDocs.length}/5)</span>
        </h3>

        <label
          className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-700 bg-gray-950/50 px-4 py-4 text-sm text-gray-500 transition-colors hover:border-indigo-500/50 hover:text-gray-400"
          onDrop={(e) => { e.preventDefault(); handleDocs(e.dataTransfer.files); }}
          onDragOver={(e) => e.preventDefault()}
        >
          <input
            ref={docRef}
            type="file"
            accept=".pdf,.ai,.doc,.docx,.ppt,.pptx,.txt"
            multiple
            className="hidden"
            onChange={(e) => { handleDocs(e.target.files); e.target.value = ""; }}
          />
          클릭하거나 파일을 드롭 (PDF, PPT, DOC, TXT)
        </label>

        {ciDocs.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {ciDocs.map((doc) => (
              <div key={doc.id} className="group flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-2">
                <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-medium text-indigo-400">
                  {doc.name.split(".").pop()?.toUpperCase()}
                </span>
                <span className="flex-1 truncate text-xs text-gray-400">{doc.name}</span>
                <span className="text-[10px] text-gray-600">{(doc.base64.length * 0.75 / 1024).toFixed(0)}KB</span>
                <button
                  onClick={() => removeCiDoc(doc.id)}
                  className="text-gray-600 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
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
