"use client";

import { useRef } from "react";
import { useStore } from "./use-store";

/**
 * 파일 확장자 → MIME 추론. Mac 브라우저에서 file.type이 빈 문자열일 때 사용.
 */
const EXT_TO_MIME: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  gif: "image/gif", webp: "image/webp", svg: "image/svg+xml",
  pdf: "application/pdf", txt: "text/plain",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

function resolveMime(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_MIME[ext] || "application/octet-stream";
}

/**
 * base64 문자열 정규화 — Safari에서 발생하는 패딩 누락/공백 문제 방지.
 * Safari는 대용량 base64에서 whitespace를 삽입하거나 패딩(=)을 누락시킬 수 있음.
 */
function sanitizeBase64(raw: string): string {
  // data: prefix 잔여분 제거 + 공백/개행 제거
  let b64 = raw.replace(/^data:[^,]*,/, "").replace(/\s/g, "");
  // base64 패딩 보정 (길이가 4의 배수가 되어야 함)
  const pad = b64.length % 4;
  if (pad === 2) b64 += "==";
  else if (pad === 3) b64 += "=";
  return b64;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const idx = result.indexOf(",");
      const raw = idx >= 0 ? result.substring(idx + 1) : result;
      resolve(sanitizeBase64(raw));
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
  const { ciImages, addCiImage, removeCiImage, ciDocs, addCiDoc, removeCiDoc, styleOverride, setStyleOverride } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const remaining = 8 - ciImages.length;
    const toProcess = Array.from(files).slice(0, remaining);
    for (const file of toProcess) {
      const base64 = await fileToBase64(file);
      addCiImage({
        id: "ci_" + Date.now() + "_" + Math.random().toString(36).slice(2),
        name: file.name,
        mime: resolveMime(file),
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
      addCiDoc({
        id: "doc_" + Date.now() + "_" + Math.random().toString(36).slice(2),
        name: file.name,
        mime: resolveMime(file),
        base64,
      });
    }
  }

  return (
    <div className="space-y-3">
      {/* Event info */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
        <h3 className="mb-3 flex items-center gap-2 font-nacelle text-sm font-semibold text-white">
          <svg className="h-4 w-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
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
        <h3 className="mb-3 flex items-center gap-2 font-nacelle text-sm font-semibold text-white">
          <svg className="h-4 w-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          CI 이미지
          <span className="ml-1 text-xs font-normal text-gray-500">로고·{ciImages.length}/8장</span>
        </h3>

        <label
          className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-700 bg-gray-950/50 px-4 py-5 text-sm text-gray-500 transition-colors hover:border-indigo-500/50 hover:bg-indigo-500/5 hover:text-gray-400"
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
          <svg className="h-5 w-5 text-gray-600 transition-colors group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
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
        <h3 className="mb-3 flex items-center gap-2 font-nacelle text-sm font-semibold text-white">
          <svg className="h-4 w-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          CI 가이드 문서
          <span className="ml-1 text-xs font-normal text-gray-500">PDF 등·{ciDocs.length}/5개</span>
        </h3>

        <label
          className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-700 bg-gray-950/50 px-4 py-4 text-sm text-gray-500 transition-colors hover:border-indigo-500/50 hover:bg-indigo-500/5 hover:text-gray-400"
          onDrop={(e) => { e.preventDefault(); handleDocs(e.dataTransfer.files); }}
          onDragOver={(e) => e.preventDefault()}
        >
          <input
            ref={docRef}
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
            multiple
            className="hidden"
            onChange={(e) => { handleDocs(e.target.files); e.target.value = ""; }}
          />
          <svg className="h-5 w-5 text-gray-600 transition-colors group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span>클릭하거나 파일을 드롭</span>
          <span className="text-xs text-gray-600">PDF · PPT · DOC · TXT</span>
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
        <h3 className="mb-3 flex items-center gap-2 font-nacelle text-sm font-semibold text-white">
          <svg className="h-4 w-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          추가 스타일 지시
          <span className="ml-1 rounded bg-gray-800 px-1.5 py-0.5 text-[10px] font-normal text-gray-500">선택</span>
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
