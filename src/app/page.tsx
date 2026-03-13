import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import SignInButton from "@/components/sign-in-button";

export default async function LandingPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Handover Buddy</h1>
          <p className="mt-3 text-lg text-gray-600">
            Make sure your open PRs don&apos;t get dropped when you&apos;re away.
          </p>
        </div>

        <div className="space-y-3 text-left bg-white rounded-xl border border-gray-200 p-6">
          {[
            "Connect your GitHub account",
            "See your open PRs in one place",
            "Assign new owners and write handover notes",
            "Share confirmation links — no login needed for recipients",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span className="text-gray-700">{step}</span>
            </div>
          ))}
        </div>

        <SignInButton />

        <p className="text-xs text-gray-400">
          Only reads your open PRs. No write access to your repositories.
        </p>
      </div>
    </main>
  );
}
