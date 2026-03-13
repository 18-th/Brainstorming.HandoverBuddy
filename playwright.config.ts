import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        channel: "chrome",
      },
    },
  ],
  webServer: {
    command: "DATABASE_URL=file:./prisma/dev.db npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    env: {
      DATABASE_URL: "file:./prisma/dev.db",
      AUTH_SECRET: "test-secret-for-e2e-testing-only",
      AUTH_GITHUB_ID: "fake-github-id",
      AUTH_GITHUB_SECRET: "fake-github-secret",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    },
  },
});
