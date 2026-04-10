"use client";

import { SERVICE_TIERS } from "./constants";

const TIER_META = {
  self: {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    accent: "gray",
    badge: null,
    selectedBorder: "border-gray-500/50",
    selectedBg: "bg-gray-500/5",
    selectedShadow: "shadow-gray-500/10",
    iconColor: "text-gray-400",
    iconBg: "bg-gray-800",
    priceColor: "text-gray-300",
  },
  basic: {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
    ),
    accent: "indigo",
    badge: "인기",
    selectedBorder: "border-indigo-500/50",
    selectedBg: "bg-indigo-500/5",
    selectedShadow: "shadow-indigo-500/15",
    iconColor: "text-indigo-400",
    iconBg: "bg-indigo-500/10",
    priceColor: "text-indigo-400",
  },
  full: {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    accent: "purple",
    badge: "올인원",
    selectedBorder: "border-purple-500/50",
    selectedBg: "bg-purple-500/5",
    selectedShadow: "shadow-purple-500/15",
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/10",
    priceColor: "text-purple-400",
  },
} as const;

export default function TierSelector({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {SERVICE_TIERS.map((tier) => {
        const meta = TIER_META[tier.id];
        const isSelected = selected === tier.id;
        return (
          <button
            key={tier.id}
            onClick={() => onSelect(tier.id)}
            className={`relative rounded-xl border p-5 text-left transition-all duration-200 ${
              isSelected
                ? `${meta.selectedBorder} ${meta.selectedBg} shadow-lg ${meta.selectedShadow}`
                : "border-gray-800 bg-gray-900/50 hover:border-gray-700 hover:bg-gray-900"
            }`}
          >
            {/* Badge */}
            {meta.badge && (
              <span className={`absolute -top-2.5 right-3 rounded-full px-3 py-0.5 text-[10px] font-bold text-white ${
                tier.id === "basic" ? "bg-indigo-500" : "bg-purple-500"
              }`}>
                {meta.badge}
              </span>
            )}

            {/* Icon + Name row */}
            <div className="mb-3 flex items-center gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${meta.iconBg} ${meta.iconColor}`}>
                {meta.icon}
              </span>
              <div>
                <div className="font-nacelle text-base font-semibold text-white">{tier.name}</div>
                <div className="text-xs text-gray-500">{tier.desc}</div>
              </div>
            </div>

            {/* Price */}
            <div className={`mb-3 font-nacelle text-sm font-semibold ${meta.priceColor}`}>
              {tier.price}
            </div>

            {/* Features */}
            <ul className="space-y-1.5">
              {tier.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                  <svg className={`h-3.5 w-3.5 shrink-0 ${meta.iconColor}`} viewBox="0 0 16 16" fill="currentColor">
                    <path d="M14.3.3c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4l-8 8c-.2.2-.4.3-.7.3-.3 0-.5-.1-.7-.3l-4-4c-.4-.4-.4-1 0-1.4.4-.4 1-.4 1.4 0L7 7.6 14.3.3z" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            {/* Selected indicator */}
            {isSelected && (
              <div className={`absolute bottom-3 right-3 flex h-5 w-5 items-center justify-center rounded-full ${
                tier.id === "full" ? "bg-purple-500" : tier.id === "basic" ? "bg-indigo-500" : "bg-gray-500"
              }`}>
                <svg className="h-3 w-3 fill-white" viewBox="0 0 16 16">
                  <path d="M14.3.3c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4l-8 8c-.2.2-.4.3-.7.3-.3 0-.5-.1-.7-.3l-4-4c-.4-.4-.4-1 0-1.4.4-.4 1-.4 1.4 0L7 7.6 14.3.3z" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
