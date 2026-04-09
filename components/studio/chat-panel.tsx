"use client";

import { useState, useRef, useEffect } from "react";
import { useStore } from "./use-store";
import type { Guideline } from "./use-store";
import { CHAT_URL } from "./config";
import {
  modifyGuideline,
  generateGuideImage,
  modifyGuideImageMultiTurn,
  GUIDE_ITEM_FIELDS,
} from "./guideline-generator";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  action?: "confirm_modify" | "confirm_regen" | "select_item";
  modifiedData?: Partial<Guideline>;
  targetFields?: string[];
  targetItemId?: string;
}

// 가이드 항목 목록
const GUIDE_ITEMS = [
  { id: "color_palette_sheet", label: "컬러 팔레트 시트" },
  { id: "typography_sheet", label: "타이포그래피 가이드" },
  { id: "motif_board", label: "그래픽 모티프 보드" },
  { id: "layout_sketches", label: "레이아웃 가이드 스케치" },
  { id: "logo_usage_sheet", label: "로고 사용 가이드" },
  { id: "mood_board", label: "무드 보드" },
];

// 가이드 항목 id → 섹션 key (guideline-viewer의 SECTION_IMAGE_ID 역매핑)
const ITEM_TO_SECTION: Record<string, string> = {
  color_palette_sheet: "color_palette",
  mood_board: "mood",
  motif_board: "graphic_motifs",
  layout_sketches: "layout_guide",
};

export default function ChatPanel({ guideline }: { guideline?: Guideline }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"idle" | "all" | "single">("idle");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [pendingModify, setPendingModify] = useState<{
    data: Partial<Guideline>;
    fields?: string[];
    itemId?: string;
    request: string;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { activeVersionId, pushSnapshot, updateGuideline, setGuideImage, guidelineSnapshots } = useStore();
  const snapshots = guidelineSnapshots.filter((s) => s.versionId === activeVersionId);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  // 초기 메시지
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "system",
          content: "가이드라인을 수정하시겠어요? 수정 범위를 선택해주세요.",
          action: "select_item",
        },
      ]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function addMsg(msg: Message) {
    setMessages((prev) => [...prev, msg]);
  }

  // 일반 채팅 (수정 모드가 아닐 때)
  async function handleChat(text: string) {
    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const system = guideline
        ? `너는 행사 브랜딩 디자인 어시스턴트야. 아래는 현재 디자인 가이드라인이다. 사용자의 질문에 이 가이드라인을 참고해서 답하라.\n\n${JSON.stringify(guideline, null, 2)}`
        : "너는 행사 브랜딩 디자인 어시스턴트야.";

      const { ciImages } = useStore.getState();
      const ci = ciImages.map((img) => ({ mime: img.mime, base64: img.base64 }));

      const chatMessages = newMessages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        }));

      const resp = await fetch(CHAT_URL(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, messages: chatMessages, ciImages: ci }),
      });

      if (!resp.ok) throw new Error(`Chat failed: ${resp.status}`);
      const data = await resp.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (err: any) {
      setMessages([...newMessages, { role: "assistant", content: `오류: ${err.message}` }]);
    }
    setLoading(false);
  }

  // 수정 요청 처리
  async function handleModifyRequest(text: string) {
    if (!guideline || !activeVersionId) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const targetFields = mode === "single" && selectedItemId
        ? GUIDE_ITEM_FIELDS[selectedItemId]
        : undefined;

      addMsg({ role: "assistant", content: "수정안을 생성하고 있습니다..." });

      const { modified } = await modifyGuideline(guideline, text, targetFields);

      // 변경 사항 요약
      const changedKeys = Object.keys(modified);
      const summary = changedKeys.map((k) => `• ${k}`).join("\n");

      setPendingModify({
        data: modified,
        fields: targetFields,
        itemId: selectedItemId || undefined,
        request: text,
      });

      setMessages((prev) => [
        ...prev.slice(0, -1), // "생성 중..." 제거
        {
          role: "assistant",
          content: `수정안이 준비되었습니다.\n\n변경 항목:\n${summary}\n\n구현할까요?`,
          action: "confirm_modify",
          modifiedData: modified,
          targetFields,
          targetItemId: selectedItemId || undefined,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: `수정 실패: ${err.message}` },
      ]);
    }
    setLoading(false);
  }

  // 수정 적용
  async function applyModification() {
    if (!pendingModify || !activeVersionId || !guideline) return;

    // 스냅샷 저장
    pushSnapshot(activeVersionId, pendingModify.request);

    // 가이드라인 JSON 업데이트
    updateGuideline(activeVersionId, pendingModify.data);

    addMsg({
      role: "assistant",
      content: "가이드라인이 수정되었습니다. 이미지도 재생성하시겠어요?\n\n• 새로 생성 — 수정된 가이드라인 기반으로 완전히 새 이미지\n• Multi-turn 편집 — 기존 이미지를 기반으로 수정 (⚠️ 텍스트가 깨질 수 있습니다)",
      action: "confirm_regen",
    });

    setPendingModify(null);
  }

  // 이미지 재생성
  async function handleRegen(method: "new" | "multiturn") {
    if (!activeVersionId) return;
    setLoading(true);

    const version = useStore.getState().versions.find((v) => v.id === activeVersionId);
    if (!version) { setLoading(false); return; }

    const { ciImages, refAnalysis } = useStore.getState();
    const ci = ciImages.map((img) => ({ mime: img.mime, base64: img.base64 }));

    // 어떤 이미지를 재생성할지 결정
    const itemsToRegen = mode === "single" && selectedItemId
      ? [selectedItemId]
      : Object.keys(GUIDE_ITEM_FIELDS);

    const itemLabel = mode === "single" && selectedItemId
      ? GUIDE_ITEMS.find((i) => i.id === selectedItemId)?.label || selectedItemId
      : "전체";
    addMsg({ role: "assistant", content: `${itemLabel} 이미지 재생성 중... (${method === "multiturn" ? "Multi-turn" : "새로 생성"})` });

    const updatedGuideline = useStore.getState().versions.find((v) => v.id === activeVersionId)?.guideline;
    if (!updatedGuideline) { setLoading(false); return; }

    let successCount = 0;
    let failCount = 0;

    for (const itemId of itemsToRegen) {
      try {
        let newImageUrl: string;

        if (method === "multiturn" && version.guideImages[itemId]) {
          newImageUrl = await modifyGuideImageMultiTurn(
            version.guideImages[itemId],
            pendingModify?.request || "수정된 가이드라인에 맞게 업데이트"
          );
        } else {
          const guideItem = updatedGuideline.guide_items_to_visualize?.find((i) => i.id === itemId)
            || { id: itemId, label: itemId, description: "" };
          newImageUrl = await generateGuideImage(updatedGuideline, guideItem, refAnalysis || undefined, ci);
        }

        setGuideImage(activeVersionId, itemId, newImageUrl);
        successCount++;
      } catch {
        failCount++;
      }
    }

    setMessages((prev) => [
      ...prev.slice(0, -1),
      {
        role: "assistant",
        content: `이미지 재생성 완료! (성공 ${successCount}개${failCount > 0 ? `, 실패 ${failCount}개` : ""})${mode === "idle" ? "" : "\n\n추가 수정이 필요하면 계속 말씀해주세요."}`,
      },
    ]);
    setLoading(false);
  }

  // 되돌리기
  function handleUndo(snapshotId: string) {
    useStore.getState().undoSnapshot(snapshotId);
    addMsg({ role: "system", content: "이전 상태로 되돌렸습니다." });
  }

  // 전송
  function handleSend() {
    if (!input.trim() || loading) return;
    if (mode === "all" || mode === "single") {
      handleModifyRequest(input.trim());
    } else {
      handleChat(input.trim());
    }
  }

  return (
    <div className="flex h-[480px] flex-col rounded-xl border border-gray-800 bg-gray-900/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-5 py-3">
        <h3 className="font-nacelle text-sm font-semibold text-white">
          AI 어시스턴트
          {mode !== "idle" && (
            <span className="ml-2 text-xs font-normal text-indigo-400">
              {mode === "all" ? "전체 수정" : GUIDE_ITEMS.find((i) => i.id === selectedItemId)?.label || "단일 수정"} 모드
            </span>
          )}
        </h3>
        <div className="flex gap-2">
          {mode !== "idle" && (
            <button
              onClick={() => { setMode("idle"); setSelectedItemId(null); }}
              className="rounded border border-gray-700 px-2 py-0.5 text-[10px] text-gray-500 hover:text-gray-300"
            >
              수정 모드 종료
            </button>
          )}
          {snapshots.length > 0 && (
            <button
              onClick={() => handleUndo(snapshots[snapshots.length - 1].id)}
              className="rounded border border-amber-700/50 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400 hover:bg-amber-500/20"
              title={`되돌리기: ${snapshots[snapshots.length - 1].description}`}
            >
              ↩ 되돌리기 ({snapshots.length})
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div key={i}>
            {/* System message */}
            {m.role === "system" && (
              <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-gray-400">
                {m.content}
                {m.action === "select_item" && (
                  <div className="mt-3 space-y-2">
                    <button
                      onClick={() => { setMode("all"); addMsg({ role: "user", content: "전체 수정" }); addMsg({ role: "assistant", content: "전체 가이드라인 수정 모드입니다. 어떻게 수정할지 말씀해주세요.\n\n예: \"전체적으로 더 따뜻한 톤으로 바꿔줘\", \"컬러를 파스텔 계열로 변경\"" }); }}
                      className="block w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-left text-sm text-gray-300 transition-colors hover:border-indigo-500/50 hover:text-indigo-400"
                    >
                      전체 수정 — 가이드라인 전체를 한번에 수정
                    </button>
                    <div className="text-[10px] text-gray-600 px-1">또는 특정 항목만 선택:</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {GUIDE_ITEMS.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setMode("single");
                            setSelectedItemId(item.id);
                            addMsg({ role: "user", content: `${item.label} 수정` });
                            addMsg({ role: "assistant", content: `${item.label} 수정 모드입니다. 어떻게 수정할지 말씀해주세요.\n\n수정 가능한 필드: ${(GUIDE_ITEM_FIELDS[item.id] || []).join(", ")}` });
                          }}
                          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-400 transition-colors hover:border-indigo-500/50 hover:text-indigo-400"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User message */}
            {m.role === "user" && (
              <div className="ml-auto max-w-[85%] rounded-xl bg-indigo-600 px-4 py-2.5 text-sm text-white">
                {m.content}
              </div>
            )}

            {/* Assistant message */}
            {m.role === "assistant" && (
              <div className="max-w-[85%] space-y-2">
                <div className="rounded-xl bg-gray-800 px-4 py-2.5 text-sm leading-relaxed text-gray-200 whitespace-pre-wrap">
                  {m.content}
                </div>

                {/* 수정 확인 버튼 */}
                {m.action === "confirm_modify" && pendingModify && (
                  <div className="flex gap-2 pl-1">
                    <button
                      onClick={applyModification}
                      disabled={loading}
                      className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                    >
                      네, 구현해주세요
                    </button>
                    <button
                      onClick={() => { setPendingModify(null); addMsg({ role: "assistant", content: "취소했습니다. 다른 수정 요청을 해주세요." }); }}
                      className="rounded-lg border border-gray-700 px-4 py-1.5 text-xs text-gray-500 hover:text-gray-300"
                    >
                      취소
                    </button>
                  </div>
                )}

                {/* 이미지 재생성 방법 선택 */}
                {m.action === "confirm_regen" && (
                  <div className="space-y-1.5 pl-1">
                    <button
                      onClick={() => handleRegen("new")}
                      disabled={loading}
                      className="block w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-left text-xs text-gray-300 hover:border-indigo-500/50 disabled:opacity-50"
                    >
                      새로 생성
                    </button>
                    <button
                      onClick={() => handleRegen("multiturn")}
                      disabled={loading}
                      className="block w-full rounded-lg border border-amber-700/30 bg-amber-500/5 px-4 py-2 text-left text-xs text-gray-300 hover:border-amber-500/50 disabled:opacity-50"
                    >
                      Multi-turn 편집 <span className="text-amber-400">⚠ 텍스트가 깨질 수 있습니다</span>
                    </button>
                    <button
                      onClick={() => addMsg({ role: "assistant", content: "이미지 재생성을 건너뛰었습니다. 추가 수정이 필요하면 말씀해주세요." })}
                      className="block px-4 py-1 text-[10px] text-gray-600 hover:text-gray-400"
                    >
                      건너뛰기
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="max-w-[85%] animate-pulse rounded-xl bg-gray-800 px-4 py-2.5 text-sm text-gray-500">
            처리 중...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2 border-t border-gray-800 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          disabled={loading}
          placeholder={
            mode === "idle"
              ? "디자인에 대해 질문하세요"
              : mode === "all"
                ? "예: 전체적으로 더 따뜻하게 바꿔줘"
                : `${GUIDE_ITEMS.find((i) => i.id === selectedItemId)?.label || ""} 수정 요청...`
          }
          className="flex-1 rounded-full border border-gray-800 bg-gray-950 px-4 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-indigo-500/50 focus:outline-none disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
        >
          전송
        </button>
      </div>
    </div>
  );
}
