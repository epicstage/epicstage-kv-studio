"use client";

import { create } from "zustand";

export interface Guideline {
  event_summary: { name: string; name_en: string; date: string; venue: string; organizer: string; theme: string; slogan: string };
  color_palette: Record<string, { hex: string; usage: string }>;
  typography: Record<string, { font: string; size_range: string; note: string }>;
  graphic_motifs: { style: string; elements: string[]; texture: string; icon_style: string };
  layout_guide: Record<string, string>;
  logo_usage: Record<string, string>;
  mood: { keywords: string[]; tone: string };
  guide_items_to_visualize: Array<{ id: string; label: string; description: string }>;
}

export interface Version {
  id: string;
  num: number;
  label: string;
  guideline: Guideline;
  preview: { colors: string[]; mood: string[]; tone: string };
  guideImages: Record<string, string>; // id → base64 data URL
}

export interface Production {
  id: string;
  name: string;
  ratio: string;
  category: string;
  status: "pending" | "generating" | "done" | "error";
  imageUrl?: string;
  error?: string;
  upscaleStatus?: "pending" | "done" | "error";
  upscaleUrl?: string;
}

interface StudioStore {
  step: 1 | 2 | 3;
  setStep: (s: 1 | 2 | 3) => void;

  tier: string;
  setTier: (t: string) => void;

  eventInfo: string;
  setEventInfo: (v: string) => void;
  styleOverride: string;
  setStyleOverride: (v: string) => void;
  ciImages: Array<{ id: string; name: string; mime: string; base64: string }>;
  addCiImage: (img: { id: string; name: string; mime: string; base64: string }) => void;
  removeCiImage: (id: string) => void;

  selectedRefs: string[];
  toggleRef: (url: string) => void;

  versions: Version[];
  activeVersionId: string | null;
  selectedVersionId: string | null;
  addVersion: (v: Version) => void;
  setActiveVersion: (id: string) => void;
  selectVersionForStep3: (id: string) => void;
  setGuideImage: (verId: string, itemId: string, dataUrl: string) => void;

  selectedItems: Set<number>;
  toggleItem: (idx: number) => void;
  selectAllItems: () => void;
  deselectAllItems: () => void;

  productions: Production[];
  setProductions: (p: Production[]) => void;
  updateProduction: (id: string, patch: Partial<Production>) => void;

  isProcessing: boolean;
  setProcessing: (v: boolean) => void;

  logs: Array<{ time: string; message: string; type?: string }>;
  addLog: (msg: string, type?: string) => void;
}

function timeStr() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
}

export const useStore = create<StudioStore>((set, get) => ({
  step: 1,
  setStep: (s) => set({ step: s }),

  tier: "self",
  setTier: (t) => set({ tier: t }),

  eventInfo: "",
  setEventInfo: (v) => set({ eventInfo: v }),
  styleOverride: "",
  setStyleOverride: (v) => set({ styleOverride: v }),
  ciImages: [],
  addCiImage: (img) => set((s) => ({ ciImages: [...s.ciImages, img] })),
  removeCiImage: (id) => set((s) => ({ ciImages: s.ciImages.filter((i) => i.id !== id) })),

  selectedRefs: [],
  toggleRef: (url) =>
    set((s) => ({
      selectedRefs: s.selectedRefs.includes(url)
        ? s.selectedRefs.filter((u) => u !== url)
        : [...s.selectedRefs, url],
    })),

  versions: [],
  activeVersionId: null,
  selectedVersionId: null,
  addVersion: (v) =>
    set((s) => ({
      versions: [...s.versions, v],
      activeVersionId: v.id,
    })),
  setActiveVersion: (id) => set({ activeVersionId: id }),
  selectVersionForStep3: (id) =>
    set((s) => ({
      selectedVersionId: s.selectedVersionId === id ? null : id,
    })),
  setGuideImage: (verId, itemId, dataUrl) =>
    set((s) => ({
      versions: s.versions.map((v) =>
        v.id === verId ? { ...v, guideImages: { ...v.guideImages, [itemId]: dataUrl } } : v
      ),
    })),

  selectedItems: new Set(),
  toggleItem: (idx) =>
    set((s) => {
      const next = new Set(s.selectedItems);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return { selectedItems: next };
    }),
  selectAllItems: () => set({ selectedItems: new Set(Array.from({ length: 55 }, (_, i) => i)) }),
  deselectAllItems: () => set({ selectedItems: new Set() }),

  productions: [],
  setProductions: (p) => set({ productions: p }),
  updateProduction: (id, patch) =>
    set((s) => ({
      productions: s.productions.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })),

  isProcessing: false,
  setProcessing: (v) => set({ isProcessing: v }),

  logs: [],
  addLog: (msg, type) =>
    set((s) => ({
      logs: [...s.logs, { time: timeStr(), message: msg, type }],
    })),
}));
