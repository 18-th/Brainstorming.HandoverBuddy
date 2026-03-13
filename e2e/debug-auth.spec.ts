import { test } from "@playwright/test";

test("debug: trace GitHub sign-in button click", async ({ page }) => {
  const logs: string[] = [];

  page.on("request", (req) => {
    logs.push(`→ ${req.method()} ${req.url().slice(0, 120)}`);
  });
  page.on("response", (res) => {
    const loc = res.headers()["location"] ?? "";
    logs.push(`← ${res.status()} ${res.url().slice(0, 120)}${loc ? ` → ${loc}` : ""}`);
  });

  await page.goto("/");
  await page.screenshot({ path: "e2e/screenshots/1-landing.png" });

  // Click and wait for the external GitHub redirect — allow navigation outside localhost
  const [popup] = await Promise.all([
    // If it opens a new tab, catch it; if same-tab we'll catch via URL change
    Promise.resolve(undefined),
    page.getByRole("button", { name: /continue with github/i }).click(),
  ]);

  // Wait up to 5s for either: GitHub URL or an error page
  try {
    await page.waitForURL((url) => !url.toString().startsWith("http://localhost"), {
      timeout: 5000,
    });
  } catch {
    // Still on localhost — probably an error redirect
  }

  await page.screenshot({ path: "e2e/screenshots/2-after-click.png" });

  console.log("\n=== Full request trace ===");
  logs.forEach((l) => console.log(l));
  console.log("\n=== Final URL:", page.url());

  try {
    const bodyText = await page.locator("body").innerText({ timeout: 3000 });
    console.log("=== Page content (first 500 chars):\n", bodyText.slice(0, 500));
  } catch {
    console.log("=== (page navigated before body could be read)");
  }
});
