"use client";

export default function EventInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
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

      {/* CI Upload */}
      <div className="mt-4">
        <label className="mb-2 block text-xs font-medium text-gray-500">
          CI 이미지 (로고, 최대 8장)
        </label>
        <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-700 bg-gray-950/50 px-4 py-6 text-sm text-gray-500 transition-colors hover:border-gray-600 hover:text-gray-400">
          <input type="file" accept="image/*" multiple className="hidden" />
          클릭하거나 이미지를 드롭
        </label>
      </div>

      {/* Style override */}
      <div className="mt-4">
        <label className="mb-2 block text-xs font-medium text-gray-500">
          추가 스타일 지시 (선택)
        </label>
        <input
          type="text"
          placeholder="예: 전체적으로 미니멀하고 모던하게. 네온 계열 금지."
          className="w-full rounded-lg border border-gray-800 bg-gray-950 px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/25"
        />
      </div>
    </div>
  );
}
