"use client";

import { useStore } from "./use-store";
import { generateGuideline, createVersion } from "./guideline-generator";
import TierSelector from "./tier-selector";
import EventInput from "./event-input";
import ReferenceSearch from "./reference-search";
import ChatPanel from "./chat-panel";
import GuidelineViewer from "./guideline-viewer";
import CatalogSelector from "./catalog-selector";
import ProductionGrid from "./production-grid";

export default function StudioApp() {
  const {
    step, setStep, tier, setTier,
    eventInfo, setEventInfo, styleOverride,
    selectedRefs, toggleRef,
    versions, activeVersionId, selectedVersionId,
    addVersion, setActiveVersion, selectVersionForStep3,
    isProcessing, setProcessing, addLog,
  } = useStore();

  const activeVersion = versions.find((v) => v.id === activeVersionId);
  const confirmedVersion = versions.find((v) => v.id === selectedVersionId);

  async function handleGenerate() {
    if (!eventInfo.trim()) return;
    setProcessing(true);
    addLog(`Ver.${versions.length + 1} 가이드라인 생성 중...`);

    try {
      const existingTones = versions.map((v) => v.guideline?.mood?.tone).filter(Boolean);
      const guideline = await generateGuideline(eventInfo, styleOverride, existingTones);
      const version = createVersion(versions.length + 1, guideline);
      addVersion(version);
      addLog(`Ver.${version.num} 생성 완료 — "${guideline.event_summary.name}"`, "ok");
      setStep(2);
    } catch (err: any) {
      addLog(`생성 실패: ${err.message}`, "err");
    }

    setProcessing(false);
  }

  return (
    <div>
      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-center gap-1 sm:gap-2">
        {([1, 2, 3] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStep(s)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              step === s
                ? "bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-xs font-bold">
              {s}
            </span>
            <span className="hidden sm:inline">
              {s === 1 && "입력 & 가이드라인"}
              {s === 2 && "가이드 산출물"}
              {s === 3 && "제작물 이미지"}
            </span>
          </button>
        ))}
      </div>

      {/* Step 1: Input */}
      {step === 1 && (
        <div className="space-y-6">
          <TierSelector selected={tier} onSelect={setTier} />

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <EventInput value={eventInfo} onChange={setEventInfo} />
              <ReferenceSearch selectedRefs={selectedRefs} onSelectRef={toggleRef} />
            </div>

            <div className="space-y-6">
              <ChatPanel guideline={activeVersion?.guideline} />

              <button
                onClick={handleGenerate}
                disabled={isProcessing || !eventInfo.trim()}
                className="btn group w-full bg-gradient-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] py-3 text-white shadow-[inset_0px_1px_0px_0px_theme(colors.white/.16)] hover:bg-[length:100%_150%] disabled:opacity-50"
              >
                <span className="relative inline-flex items-center">
                  {isProcessing ? (
                    "생성 중..."
                  ) : versions.length === 0 ? (
                    <>가이드라인 생성 <span className="ml-1 text-white/50">-&gt;</span></>
                  ) : (
                    <>새 버전 생성 <span className="ml-1 text-white/50">+</span></>
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Guideline viewer */}
      {step === 2 && (
        <div className="space-y-6">
          {versions.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <p>Step 1에서 가이드라인을 생성해주세요</p>
              <button onClick={() => setStep(1)} className="mt-4 text-indigo-400 hover:underline">
                ← Step 1
              </button>
            </div>
          ) : (
            <>
              {/* Version tabs */}
              <div className="flex flex-wrap gap-2">
                {versions.map((ver) => (
                  <button
                    key={ver.id}
                    onClick={() => setActiveVersion(ver.id)}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
                      ver.id === activeVersionId
                        ? "bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {ver.label}
                    <div className="flex gap-0.5">
                      {ver.preview.colors.map((c, i) => (
                        <span key={i} className="inline-block h-3 w-3 rounded-full" style={{ background: c }} />
                      ))}
                    </div>
                    {ver.id === selectedVersionId && (
                      <span className="text-[10px] text-emerald-400">✓확정</span>
                    )}
                  </button>
                ))}
                <button
                  onClick={() => { setStep(1); }}
                  className="rounded-full px-4 py-2 text-sm text-gray-600 hover:text-gray-400"
                >
                  + 새 버전
                </button>
              </div>

              {/* Active version viewer */}
              {activeVersion && (
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <GuidelineViewer version={activeVersion} />
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={() => selectVersionForStep3(activeVersion.id)}
                      className={`w-full rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                        selectedVersionId === activeVersion.id
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                          : "border-gray-800 text-gray-400 hover:border-indigo-500/50 hover:text-indigo-400"
                      }`}
                    >
                      {selectedVersionId === activeVersion.id ? "✓ Step 3 확정됨" : "이 버전으로 Step 3 확정"}
                    </button>

                    {selectedVersionId && (
                      <button
                        onClick={() => setStep(3)}
                        className="btn w-full bg-gradient-to-t from-indigo-600 to-indigo-500 py-3 text-white"
                      >
                        Step 3: 제작물 생성 →
                      </button>
                    )}

                    {/* Mood keywords */}
                    <div className="rounded-lg border border-gray-800 p-3">
                      <div className="mb-2 text-[10px] uppercase tracking-wider text-gray-600">미리보기</div>
                      <div className="flex flex-wrap gap-1">
                        {activeVersion.preview.mood.map((m) => (
                          <span key={m} className="rounded-full bg-gray-800 px-2 py-0.5 text-[10px] text-gray-400">
                            {m}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 flex gap-1">
                        {activeVersion.preview.colors.map((c, i) => (
                          <span key={i} className="inline-block h-6 w-6 rounded" style={{ background: c }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Step 3: Production */}
      {step === 3 && (
        <div className="space-y-6">
          <CatalogSelector />
          <ProductionGrid />
        </div>
      )}
    </div>
  );
}
