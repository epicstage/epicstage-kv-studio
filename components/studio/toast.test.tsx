import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider, useToast, type ToastContextValue } from "./toast";

function Harness({ onReady }: { onReady: (ctx: ToastContextValue) => void }) {
  const ctx = useToast();
  onReady(ctx);
  return null;
}

function mount() {
  let captured: ToastContextValue | null = null;
  render(
    <ToastProvider>
      <Harness onReady={(ctx) => (captured = ctx)} />
    </ToastProvider>,
  );
  if (!captured) throw new Error("Toast context not captured");
  return captured as ToastContextValue;
}

describe("ToastProvider", () => {
  it("shows and auto-dismisses an info toast", () => {
    vi.useFakeTimers();
    try {
      const ctx = mount();

      act(() => {
        ctx.show({ kind: "info", title: "저장됨" });
      });
      expect(screen.getByText("저장됨")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(3100);
      });
      expect(screen.queryByText("저장됨")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps progress toasts until explicitly dismissed", () => {
    vi.useFakeTimers();
    try {
      const ctx = mount();
      let id = "";
      act(() => {
        id = ctx.show({
          kind: "progress",
          title: "생성 중",
          progress: 0,
          duration: null,
        });
      });
      expect(screen.getByText("생성 중")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(10_000);
      });
      expect(screen.getByText("생성 중")).toBeInTheDocument();

      act(() => {
        ctx.dismiss(id);
      });
      expect(screen.queryByText("생성 중")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("updates progress in place", () => {
    const ctx = mount();
    let id = "";
    act(() => {
      id = ctx.show({
        kind: "progress",
        title: "생성 중 (0 / 3)",
        progress: 0,
        duration: null,
      });
    });
    expect(screen.getByText("생성 중 (0 / 3)")).toBeInTheDocument();

    act(() => {
      ctx.update(id, { title: "생성 중 (2 / 3)", progress: 2 / 3 });
    });
    expect(screen.getByText("생성 중 (2 / 3)")).toBeInTheDocument();

    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "67");
  });

  it("renders action button and triggers callback", () => {
    const ctx = mount();
    const onClick = vi.fn();
    act(() => {
      ctx.show({
        kind: "progress",
        title: "작업 중",
        progress: 0.1,
        duration: null,
        action: { label: "중단", onClick },
      });
    });

    const btn = screen.getByRole("button", { name: "중단" });
    act(() => {
      btn.click();
    });
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
