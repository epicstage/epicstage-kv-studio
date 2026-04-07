"use client";

import { SERVICE_TIERS } from "./constants";

export default function TierSelector({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {SERVICE_TIERS.map((tier) => (
        <button
          key={tier.id}
          onClick={() => onSelect(tier.id)}
          className={`relative rounded-xl border p-5 text-left transition-all ${
            selected === tier.id
              ? "border-indigo-500/50 bg-indigo-500/5 shadow-lg shadow-indigo-500/10"
              : "border-gray-800 bg-gray-900/50 hover:border-gray-700"
          }`}
        >
          {selected === tier.id && (
            <span className="absolute -top-2.5 right-3 rounded-full bg-indigo-500 px-3 py-0.5 text-[10px] font-bold text-white">
              선택됨
            </span>
          )}
          <div className="mb-1 font-nacelle text-lg font-semibold text-white">
            {tier.name}
          </div>
          <div className="mb-3 text-sm text-gray-500">{tier.desc}</div>
          <div className="mb-3 font-nacelle text-sm font-semibold text-gray-600">
            {tier.price}
          </div>
          <ul className="space-y-1">
            {tier.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                <svg className="h-3.5 w-3.5 shrink-0 fill-indigo-400" viewBox="0 0 16 16">
                  <path d="M14.3.3c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4l-8 8c-.2.2-.4.3-.7.3-.3 0-.5-.1-.7-.3l-4-4c-.4-.4-.4-1 0-1.4.4-.4 1-.4 1.4 0L7 7.6 14.3.3z" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
        </button>
      ))}
    </div>
  );
}
