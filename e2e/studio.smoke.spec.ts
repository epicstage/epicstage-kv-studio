import { expect, test } from "@playwright/test";

test.describe("Studio smoke", () => {
  test("renders /studio with step indicator and event input", async ({ page }) => {
    const console_errors: string[] = [];
    page.on("pageerror", (err) => console_errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") console_errors.push(msg.text());
    });

    await page.goto("/studio", { waitUntil: "domcontentloaded" });

    // Step indicator should show 4 steps
    await expect(page.getByText("입력 & 레퍼런스")).toBeVisible();
    await expect(page.getByText("가이드라인 확인")).toBeVisible();
    await expect(page.getByText("마스터 KV")).toBeVisible();
    await expect(page.getByText("바리에이션 생성")).toBeVisible();

    // No fatal errors
    const fatal = console_errors.filter(
      (e) => !/favicon|manifest|chrome-extension/.test(e),
    );
    expect(fatal).toEqual([]);
  });
});
