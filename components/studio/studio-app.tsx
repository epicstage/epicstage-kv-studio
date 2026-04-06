"use client";

import { useState } from "react";
import TierSelector from "./tier-selector";
import EventInput from "./event-input";
import ReferenceSearch from "./reference-search";
import ChatPanel from "./chat-panel";
import CatalogSelector from "./catalog-selector";

type Step = 1 | 2 | 3;

export default function StudioApp() {
  const [step, setStep] = useState<Step>(1);
  const [tier, setTier] = useState<string>("self");
  const [eventInfo, setEventInfo] = useState("");
  const [selectedRefs, setSelectedRefs] = useState<string[]>([]);
  const [guideline, setGuideline] = useState<any>(null);

  return (
    <div>
      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <button
            key={s}
            onClick={() => setStep(s as Step)}
            className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              step === s
                ? "bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-xs font-bold">
              {s}
            </span>
            {s === 1 && "입력 & 가이드라인"}
            {s === 2 && "가이드 산출물"}
            {s === 3 && "제작물 이미지"}
          </button>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6">
          {/* Service tier */}
          <TierSelector selected={tier} onSelect={setTier} />

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: Inputs */}
            <div className="space-y-6">
              <EventInput value={eventInfo} onChange={setEventInfo} />
              <ReferenceSearch
                selectedRefs={selectedRefs}
                onSelectRef={(url) =>
                  setSelectedRefs((prev) =>
                    prev.includes(url)
                      ? prev.filter((u) => u !== url)
                      : [...prev, url]
                  )
                }
              />
            </div>

            {/* Right: Chat + Actions */}
            <div className="space-y-6">
              <ChatPanel guideline={guideline} />

              {/* Generate button */}
              <button
                onClick={() => {
                  // TODO: call generate API
                  setStep(2);
                }}
                className="btn group w-full bg-gradient-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] py-3 text-white shadow-[inset_0px_1px_0px_0px_theme(colors.white/.16)] hover:bg-[length:100%_150%]"
              >
                <span className="relative inline-flex items-center">
                  가이드라인 생성
                  <span className="ml-1 tracking-normal text-white/50 transition-transform group-hover:translate-x-0.5">
                    -&gt;
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="text-center text-gray-400">
          <p className="text-lg">가이드 산출물 뷰어 — 구현 예정</p>
          <button
            onClick={() => setStep(3)}
            className="btn mt-4 bg-gradient-to-t from-indigo-600 to-indigo-500 text-white"
          >
            Step 3 →
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <CatalogSelector />
        </div>
      )}
    </div>
  );
}
