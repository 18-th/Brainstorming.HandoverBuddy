import { test, expect } from "@playwright/test";
import path from "node:path";
import Database from "better-sqlite3";

// Helper: seed a HandoverItem directly into the DB for confirm flow tests
function seedConfirmItem(overrides: {
  prTitle?: string;
  prNumber?: number;
  notes?: string;
  newOwnerLogin?: string;
  confirmedAt?: string | null;
} = {}) {
  const dbPath = path.join(process.cwd(), "prisma/dev.db");
  const db = new Database(dbPath);

  const token = `test-token-${Date.now()}`;

  // Ensure a user and handover exist
  let userId = db
    .prepare("SELECT id FROM User WHERE githubId = ?")
    .get("test-user-123") as { id: string } | undefined;

  if (!userId) {
    const cuid = `test-user-${Date.now()}`;
    db.prepare(
      "INSERT INTO User (id, githubId, githubLogin, createdAt) VALUES (?, ?, ?, ?)"
    ).run(cuid, "test-user-123", "testuser", new Date().toISOString());
    userId = { id: cuid };
  }

  let handoverId = db
    .prepare("SELECT id FROM Handover WHERE creatorId = ? LIMIT 1")
    .get(userId.id) as { id: string } | undefined;

  if (!handoverId) {
    const hid = `test-handover-${Date.now()}`;
    db.prepare(
      "INSERT INTO Handover (id, title, status, creatorId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(hid, "Test Handover", "ACTIVE", userId.id, new Date().toISOString(), new Date().toISOString());
    handoverId = { id: hid };
  }

  const itemId = `test-item-${Date.now()}`;
  db.prepare(
    `INSERT INTO HandoverItem
     (id, prNumber, prTitle, prUrl, repoFullName, newOwnerLogin, notes, confirmToken, confirmedAt, handoverId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    itemId,
    overrides.prNumber ?? 42,
    overrides.prTitle ?? "Fix login bug",
    "https://github.com/org/repo/pull/42",
    "org/repo",
    overrides.newOwnerLogin ?? "janedoe",
    overrides.notes ?? "Context: this PR fixes the auth redirect loop. See issue #38.",
    token,
    overrides.confirmedAt ?? null,
    handoverId.id,
    new Date().toISOString(),
    new Date().toISOString(),
  );

  db.close();
  return { token, itemId };
}

// ─── Landing page ──────────────────────────────────────────────────────────

test("landing page shows app name and sign-in button", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Handover Buddy" })).toBeVisible();
  await expect(page.getByRole("button", { name: /continue with github/i })).toBeVisible();
});

test("landing page shows the 4 steps", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Connect your GitHub account")).toBeVisible();
  await expect(page.getByText("See your open PRs in one place")).toBeVisible();
  await expect(page.getByText("Assign new owners and write handover notes")).toBeVisible();
  await expect(page.getByText(/share confirmation links/i)).toBeVisible();
});

// ─── Auth redirects ────────────────────────────────────────────────────────

test("dashboard redirects to login when not authenticated", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("handovers new page redirects to login when not authenticated", async ({ page }) => {
  await page.goto("/handovers/new");
  await expect(page).toHaveURL(/\/login/);
});

test("handover detail redirects to login when not authenticated", async ({ page }) => {
  await page.goto("/handovers/some-id");
  await expect(page).toHaveURL(/\/login/);
});

test("login page shows sign-in button", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: /continue with github/i })).toBeVisible();
});

// ─── Confirm page (public — no auth needed) ────────────────────────────────

test("confirm page shows PR details and confirm button", async ({ page }) => {
  const { token } = seedConfirmItem({
    prTitle: "Refactor auth middleware",
    prNumber: 99,
    notes: "Please merge the feature branch first before picking this up.",
    newOwnerLogin: "bobsmith",
  });

  await page.goto(`/confirm/${token}`);

  await expect(page.getByText("Refactor auth middleware")).toBeVisible();
  await expect(page.getByText("org/repo")).toBeVisible();
  await expect(page.getByText("#99")).toBeVisible();
  await expect(page.getByText("bobsmith")).toBeVisible();
  await expect(page.getByText("Please merge the feature branch first")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /i have received and understood/i })
  ).toBeVisible();
});

test("confirm page allows user to confirm a handover item", async ({ page }) => {
  const { token } = seedConfirmItem({
    prTitle: "Add dark mode support",
    newOwnerLogin: "alice",
  });

  await page.goto(`/confirm/${token}`);

  // Optionally fill in name
  await page.getByPlaceholder("e.g. Jane Smith").fill("Test Reviewer");

  // Click confirm
  await page.getByRole("button", { name: /i have received and understood/i }).click();

  // Should show success state
  await expect(page.getByText("Handover confirmed!")).toBeVisible();
  // PR title appears in the success message (scope to avoid strict mode on duplicate elements)
  await expect(page.locator("text=You've confirmed receipt of:")).toBeVisible();
});

test("confirm page shows already-confirmed state", async ({ page }) => {
  const { token } = seedConfirmItem({
    prTitle: "Update dependencies",
    confirmedAt: new Date().toISOString(),
  });

  await page.goto(`/confirm/${token}`);

  await expect(page.getByRole("heading", { name: "Already confirmed" })).toBeVisible();
  await expect(page.getByText("Update dependencies")).toBeVisible();
  // No confirm button
  await expect(
    page.getByRole("button", { name: /i have received and understood/i })
  ).not.toBeVisible();
});

test("confirm page shows not-found for invalid token", async ({ page }) => {
  await page.goto("/confirm/totally-invalid-token-xyz");
  // Next.js notFound() renders the 404 page
  await expect(page).toHaveURL(/confirm\/totally-invalid-token-xyz/);
  // The page should show a 404 indicator
  await expect(page.getByText(/404|not found/i)).toBeVisible();
});

// ─── API smoke tests ───────────────────────────────────────────────────────

test("GET /api/github/prs returns 401 when not authenticated", async ({ request }) => {
  const res = await request.get("/api/github/prs");
  expect(res.status()).toBe(401);
});

test("POST /api/handovers returns 401 when not authenticated", async ({ request }) => {
  const res = await request.post("/api/handovers", {
    data: { title: "Test" },
  });
  expect(res.status()).toBe(401);
});

test("POST /api/confirm/[token] confirms a pending item", async ({ request }) => {
  const { token } = seedConfirmItem({
    prTitle: "API confirm test PR",
  });

  const res = await request.post(`/api/confirm/${token}`, {
    data: { confirmedByName: "API Tester" },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.success).toBe(true);
  expect(body.prTitle).toBe("API confirm test PR");
});

test("POST /api/confirm/[token] returns 409 for already-confirmed item", async ({ request }) => {
  const { token } = seedConfirmItem({
    confirmedAt: new Date().toISOString(),
  });

  const res = await request.post(`/api/confirm/${token}`, {
    data: {},
  });
  expect(res.status()).toBe(409);
});

test("POST /api/confirm/[token] returns 404 for invalid token", async ({ request }) => {
  const res = await request.post("/api/confirm/bad-token-xyz", {
    data: {},
  });
  expect(res.status()).toBe(404);
});
