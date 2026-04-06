"use client";

import { useState, useEffect } from "react";
import { useStore } from "./use-store";
import { saveProject, loadProject, listProjects, deleteProject, saveSetting, loadSetting } from "./use-indexeddb";

interface ProjectEntry {
  id: string;
  name: string;
  lastModifiedAt: number;
  step: number;
  versionCount: number;
}

export default function ProjectMenu() {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const store = useStore();

  useEffect(() => {
    // Restore last project on mount
    (async () => {
      try {
        const lastId = await loadSetting("lastProjectId");
        if (lastId) {
          const saved = await loadProject(lastId);
          if (saved) {
            if (saved.eventInfo) store.setEventInfo(saved.eventInfo);
            if (saved.tier) store.setTier(saved.tier);
            if (saved.versions?.length) {
              for (const v of saved.versions) store.addVersion(v);
            }
            store.addLog("이전 세션 복원됨", "ok");
          }
        }
      } catch (e) {
        console.warn("프로젝트 복원 실패:", e);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    const projectId = "proj_" + (store.versions[0]?.id || Date.now());
    const data = {
      projectId,
      eventInfo: store.eventInfo,
      tier: store.tier,
      step: store.step,
      versions: store.versions,
      selectedVersionId: store.selectedVersionId,
      selectedItems: Array.from(store.selectedItems),
      lastModifiedAt: Date.now(),
    };
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
    if (saved.eventInfo) store.setEventInfo(saved.eventInfo);
    if (saved.tier) store.setTier(saved.tier);
    if (saved.versions?.length) {
      for (const v of saved.versions) store.addVersion(v);
    }
    if (saved.step) store.setStep(saved.step);
    await saveSetting("lastProjectId", id);
    setOpen(false);
    store.addLog("프로젝트 불러옴", "ok");
  }

  async function handleDelete(id: string) {
    await deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  function handleNew() {
    window.location.reload();
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleSave}
        className="rounded-lg border border-gray-800 bg-gray-900/50 px-3 py-1.5 text-xs text-gray-400 transition-colors hover:border-gray-700 hover:text-gray-300"
      >
        저장
      </button>

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
