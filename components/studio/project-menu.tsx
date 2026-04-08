"use client";

import { useState, useEffect, useRef } from "react";
import { useStore } from "./use-store";
import { saveProject, loadProject, listProjects, deleteProject, saveSetting, loadSetting } from "./use-indexeddb";
import { downloadAsZip } from "./export-utils";

interface ProjectEntry {
  id: string;
  name: string;
  lastModifiedAt: number;
  step: number;
  versionCount: number;
}

/** Store에서 직렬화 가능한 전체 상태를 추출 */
function getSerializableState() {
  const s = useStore.getState();
  return {
    eventInfo: s.eventInfo,
    tier: s.tier,
    step: s.step,
    styleOverride: s.styleOverride,
    versions: s.versions,
    activeVersionId: s.activeVersionId,
    selectedVersionId: s.selectedVersionId,
    selectedItems: Array.from(s.selectedItems),
    productions: s.productions,
    productionPlan: s.productionPlan,
    refAnalysis: s.refAnalysis,
    ciImages: s.ciImages,
    ciDocs: s.ciDocs,
    refFiles: s.refFiles,
    selectedRefs: s.selectedRefs,
  };
}

/** 저장된 데이터를 store에 복원 */
function restoreState(saved: any) {
  const s = useStore.getState();
  // 기존 상태 초기화
  s.setEventInfo(saved.eventInfo || "");
  s.setTier(saved.tier || "self");
  s.setStyleOverride(saved.styleOverride || "");
  s.setRefAnalysis(saved.refAnalysis || "");

  // versions — 기존 것 교체 (addVersion 누적 아님)
  useStore.setState({
    versions: saved.versions || [],
    activeVersionId: saved.activeVersionId || null,
    selectedVersionId: saved.selectedVersionId || null,
    selectedItems: new Set(saved.selectedItems || []),
    productions: saved.productions || [],
    productionPlan: saved.productionPlan || null,
    ciImages: saved.ciImages || [],
    ciDocs: saved.ciDocs || [],
    refFiles: saved.refFiles || [],
    selectedRefs: saved.selectedRefs || [],
  });

  if (saved.step) s.setStep(saved.step);
}

export default function ProjectMenu() {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const store = useStore();

  useEffect(() => {
    // Restore last project on mount
    (async () => {
      try {
        const lastId = await loadSetting("lastProjectId");
        if (lastId) {
          const saved = await loadProject(lastId);
          if (saved) {
            restoreState(saved);
            store.addLog("이전 세션 복원됨", "ok");
          }
        }
      } catch (e) {
        console.warn("프로젝트 복원 실패:", e);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── IndexedDB 저장/불러오기 ───

  async function handleSave() {
    const state = getSerializableState();
    const projectId = "proj_" + (state.versions[0]?.id || Date.now());
    const data = { projectId, ...state, lastModifiedAt: Date.now() };
    await saveProject(data);
    await saveSetting("lastProjectId", projectId);
    store.addLog("프로젝트 저장됨", "ok");
  }

  async function handleOpen() {
    const list = await listProjects();
    setProjects(list);
    setOpen(!open);
  }

  async function handleLoad(id: string) {
    const saved = await loadProject(id);
    if (!saved) return;
    restoreState(saved);
    await saveSetting("lastProjectId", id);
    setOpen(false);
    store.addLog("프로젝트 불러옴", "ok");
  }

  async function handleDelete(id: string) {
    await deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleNew() {
    await saveSetting("lastProjectId", "");
    window.location.reload();
  }

  // ─── ZIP 내보내기/가져오기 ───

  async function handleExportZip() {
    const state = getSerializableState();
    const json = JSON.stringify(state, null, 2);
    const name = state.versions[0]?.guideline?.event_summary?.name || "epic-studio";
    const safeName = name.replace(/[/\\:*?"<>|]/g, "_");

    const items: Array<{ name: string; data: string | Blob }> = [
      { name: "project.json", data: new Blob([json], { type: "application/json" }) },
    ];

    await downloadAsZip(items, `${safeName}-프로젝트.zip`);
    store.addLog("ZIP 내보내기 완료", "ok");
  }

  async function handleImportZip(file: File) {
    try {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(file);
      const jsonFile = zip.file("project.json");
      if (!jsonFile) throw new Error("project.json 없음");
      const text = await jsonFile.async("string");
      const saved = JSON.parse(text);
      restoreState(saved);
      store.addLog(`ZIP 불러오기 완료 — ${saved.versions?.length || 0}개 버전`, "ok");
    } catch (e: any) {
      store.addLog(`ZIP 불러오기 실패: ${e.message}`, "err");
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* 저장 */}
      <button
        onClick={handleSave}
        className="rounded-lg border border-gray-800 bg-gray-900/50 px-3 py-1.5 text-xs text-gray-400 transition-colors hover:border-gray-700 hover:text-gray-300"
      >
        저장
      </button>

      {/* ZIP 내보내기 */}
      <button
        onClick={handleExportZip}
        className="rounded-lg border border-gray-800 bg-gray-900/50 px-3 py-1.5 text-xs text-gray-400 transition-colors hover:border-gray-700 hover:text-gray-300"
        title="ZIP으로 내보내기"
      >
        내보내기
      </button>

      {/* ZIP 불러오기 */}
      <label
        className="cursor-pointer rounded-lg border border-gray-800 bg-gray-900/50 px-3 py-1.5 text-xs text-gray-400 transition-colors hover:border-gray-700 hover:text-gray-300"
        title="ZIP 불러오기"
      >
        불러오기
        <input
          ref={fileRef}
          type="file"
          accept=".zip"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImportZip(f);
            e.target.value = "";
          }}
        />
      </label>

      {/* 프로젝트 메뉴 */}
      <div className="relative">
        <button
          onClick={handleOpen}
          className="rounded-lg border border-gray-800 bg-gray-900/50 px-3 py-1.5 text-xs text-gray-400 transition-colors hover:border-gray-700 hover:text-gray-300"
        >
          프로젝트 {store.versions.length > 0 && <span className="text-indigo-400">({store.versions.length}v)</span>}
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-gray-800 bg-gray-900 shadow-xl">
            <div className="max-h-60 overflow-y-auto p-2">
              {projects.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-gray-600">저장된 프로젝트 없음</div>
              ) : (
                projects.map((p) => (
                  <div
                    key={p.id}
                    className="group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-xs hover:bg-gray-800"
                    onClick={() => handleLoad(p.id)}
                  >
                    <div>
                      <div className="text-gray-300">{p.name}</div>
                      <div className="text-gray-600">Step {p.step} · {p.versionCount}v · {new Date(p.lastModifiedAt).toLocaleDateString("ko")}</div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                      className="text-gray-600 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                    >
                      x
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-gray-800 p-2">
              <button
                onClick={handleNew}
                className="w-full rounded-lg px-3 py-2 text-left text-xs text-gray-400 hover:bg-gray-800 hover:text-gray-300"
              >
                + 새 프로젝트
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
