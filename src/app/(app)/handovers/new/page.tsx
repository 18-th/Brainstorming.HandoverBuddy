"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface GitHubPR {
  number: number;
  title: string;
  url: string;
  repoFullName: string;
}

export default function NewHandoverPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [leavingDate, setLeavingDate] = useState("");
  const [prs, setPrs] = useState<GitHubPR[]>([]);
  const [selectedPRs, setSelectedPRs] = useState<Set<number>>(new Set());
  const [loadingPRs, setLoadingPRs] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [prsFetched, setPrsFetched] = useState(false);

  async function fetchPRs() {
    setLoadingPRs(true);
    setError("");
    try {
      const res = await fetch("/api/github/prs");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch PRs");
      setPrs(data.prs);
      setSelectedPRs(new Set(data.prs.map((p: GitHubPR) => p.number)));
      setPrsFetched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch PRs");
    } finally {
      setLoadingPRs(false);
    }
  }

  function togglePR(number: number) {
    setSelectedPRs((prev) => {
      const next = new Set(prev);
      next.has(number) ? next.delete(number) : next.add(number);
      return next;
    });
  }

  async function handleCreate() {
    if (!title.trim()) {
      setError("Please enter a title for this handover.");
      return;
    }
    if (!leavingDate) {
      setError("Please enter your leave start date.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/handovers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), leavingDate: leavingDate || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create handover");

      const handoverId = data.handover.id;
      const selected = prs.filter((p) => selectedPRs.has(p.number));

      await Promise.all(
        selected.map((pr) =>
          fetch(`/api/handovers/${handoverId}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prNumber: pr.number,
              prTitle: pr.title,
              prUrl: pr.url,
              repoFullName: pr.repoFullName,
            }),
          })
        )
      );

      router.push(`/handovers/${handoverId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setCreating(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold">New Handover</h1>

      {error && (
        <div className="rounded-lg bg-accent-red-light border border-accent-red-border px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="font-semibold text-gray-700">Details</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Handover title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Parental leave April 2026"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Leave start date <span className="text-accent-red">*</span>
          </label>
          <input
            type="date"
            value={leavingDate}
            onChange={(e) => setLeavingDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">Your open PRs</h2>
          <button
            onClick={fetchPRs}
            disabled={loadingPRs}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {loadingPRs ? "Fetching..." : prsFetched ? "Refresh" : "Fetch my PRs"}
          </button>
        </div>

        {prsFetched && prs.length === 0 && (
          <p className="text-sm text-gray-500">No open PRs found.</p>
        )}

        {prs.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              {selectedPRs.size} of {prs.length} selected
            </p>
            {prs.map((pr) => (
              <label
                key={pr.number}
                className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedPRs.has(pr.number)}
                  onChange={() => togglePR(pr.number)}
                  className="mt-0.5 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{pr.title}</p>
                  <p className="text-xs text-gray-500">
                    {pr.repoFullName} #{pr.number}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}
      </section>

      <div className="flex gap-3">
        <button
          onClick={handleCreate}
          disabled={creating || !title.trim() || !leavingDate}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create Handover"}
        </button>
        <a href="/dashboard" className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium hover:bg-gray-50">
          Cancel
        </a>
      </div>
    </div>
  );
}
