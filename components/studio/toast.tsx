"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastKind = "info" | "success" | "error" | "progress";

export interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
  // Progress 0–1 for kind === "progress". Undefined = indeterminate.
  progress?: number;
  // Optional action button (e.g. "취소" or "되돌리기")
  action?: { label: string; onClick: () => void };
  // Auto-dismiss in ms. `null` disables (used for progress toasts).
  duration?: number | null;
}

export interface ToastContextValue {
  toasts: Toast[];
  show: (t: Omit<Toast, "id"> & { id?: string }) => string;
  update: (id: string, patch: Partial<Toast>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS: Record<ToastKind, number | null> = {
  info: 3000,
  success: 3000,
  error: 6000,
  progress: null,
};

let counter = 0;
function genId() {
  counter += 1;
  return `toast_${Date.now()}_${counter}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const scheduleAutoDismiss = useCallback(
    (toast: Toast) => {
      const duration =
        toast.duration === undefined ? DEFAULT_DURATION_MS[toast.kind] : toast.duration;
      if (duration == null) return;
      const existing = timers.current.get(toast.id);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => dismiss(toast.id), duration);
      timers.current.set(toast.id, timer);
    },
    [dismiss],
  );

  const show = useCallback<ToastContextValue["show"]>(
    (input) => {
      const id = input.id ?? genId();
      const toast: Toast = { ...input, id };
      setToasts((prev) => {
        const withoutExisting = prev.filter((t) => t.id !== id);
        return [...withoutExisting, toast];
      });
      scheduleAutoDismiss(toast);
      return id;
    },
    [scheduleAutoDismiss],
  );

  const update = useCallback<ToastContextValue["update"]>(
    (id, patch) => {
      setToasts((prev) => {
        const idx = prev.findIndex((t) => t.id === id);
        if (idx < 0) return prev;
        const next = { ...prev[idx], ...patch };
        const copy = prev.slice();
        copy[idx] = next;
        scheduleAutoDismiss(next);
        return copy;
      });
    },
    [scheduleAutoDismiss],
  );

  useEffect(() => {
    const current = timers.current;
    return () => {
      current.forEach((timer) => clearTimeout(timer));
      current.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, show, update, dismiss }),
    [toasts, show, update, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div
      role="region"
      aria-label="알림"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:right-4 sm:left-auto sm:items-end"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const kindStyle: Record<ToastKind, string> = {
    info: "border-gray-700 bg-gray-900/95 text-gray-100",
    success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
    error: "border-red-500/40 bg-red-500/10 text-red-100",
    progress: "border-indigo-500/40 bg-indigo-500/10 text-indigo-100",
  };
  return (
    <div
      role={toast.kind === "error" ? "alert" : "status"}
      aria-live={toast.kind === "error" ? "assertive" : "polite"}
      className={`pointer-events-auto w-full max-w-sm rounded-xl border px-4 py-3 shadow-lg backdrop-blur ${kindStyle[toast.kind]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{toast.title}</div>
          {toast.description && (
            <div className="mt-0.5 text-xs opacity-80">{toast.description}</div>
          )}
          {toast.kind === "progress" && (
            <div
              className="mt-2 h-1 w-full overflow-hidden rounded bg-indigo-500/20"
              role="progressbar"
              aria-valuenow={
                toast.progress != null ? Math.round(toast.progress * 100) : undefined
              }
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={
                  toast.progress == null
                    ? "h-full w-1/3 animate-pulse rounded bg-indigo-400"
                    : "h-full rounded bg-indigo-400 transition-[width] duration-200"
                }
                style={
                  toast.progress != null
                    ? { width: `${Math.round(toast.progress * 100)}%` }
                    : undefined
                }
              />
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="rounded border border-current/40 px-2 py-0.5 text-[11px] font-medium opacity-90 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/40"
            >
              {toast.action.label}
            </button>
          )}
          <button
            onClick={() => onDismiss(toast.id)}
            aria-label="알림 닫기"
            className="rounded p-0.5 text-current/60 hover:text-current/100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/40"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
