"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface GitHubPR {
  number: number;
  title: string;
  url: string;
  repoFullName: string;
}

interface ExistingPR {
  prNumber: number;
  repoFullName: string;
}

interface Props {
  handoverId: string;
  existingPRs: ExistingPR[];
}

export default function AddPRsToHandover({ handoverId, existingPRs }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [prs, setPrs] = useState<GitHubPR[]>([]);
  const [selectedPRs, setSelectedPRs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [fetched, setFetched] = useState(false);
  const [newPRCount, setNewPRCount] = useState<number | null>(null);

  useEffect(() => {
    fetchPRs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function prKey(pr: GitHubPR) {
    return `${pr.repoFullName}#${pr.number}`;
  }

  async function fetchPRs() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/github/prs");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch PRs");

      const existingKeys = new Set(existingPRs.map((p) => `${p.repoFullName}#${p.prNumber}`));
      const newPRs: GitHubPR[] = data.prs.filter(
        (pr: GitHubPR) => !existingKeys.has(prKey(pr))
      );

      setPrs(newPRs);
      setNewPRCount(newPRs.length);
      setSelectedPRs(new Set(newPRs.map((pr) => prKey(pr))));
      setFetched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch PRs");
    } finally {
      setLoading(false);
    }
  }

  function toggle(key: string) {
    setSelectedPRs((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  async function handleAdd() {
    const toAdd = prs.filter((pr) => selectedPRs.has(prKey(pr)));
    if (toAdd.length === 0) return;

    setAdding(true);
    setError("");
    try {
      await Promise.all(
        toAdd.map((pr) =>
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
      setOpen(false);
      setFetched(false);
      setPrs([]);
      setSelectedPRs(new Set());
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add PRs");
    } finally {
      setAdding(false);
    }
  }

  if (!open) {
    return (
      <div className="flex items-center gap-2">
        {newPRCount !== null && newPRCount > 0 && (
          <span className="text-sm text-amber-600 font-medium">
            {newPRCount} PR{newPRCount === 1 ? "" : "s"} not in handover
          </span>
        )}
        <button
          onClick={() => {
            setOpen(true);
            if (!fetched && !loading) fetchPRs();
          }}
          className="relative rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          + Add PRs
          {loading && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
            </span>
          )}
          {!loading && newPRCount !== null && newPRCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
              {newPRCount > 9 ? "9+" : newPRCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">Add PRs to this handover</h3>
        <div className="flex items-center gap-2">
          {fetched && (
            <button
              onClick={fetchPRs}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? "Fetching..." : "Refresh"}
            </button>
          )}
          <button
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-accent-red-light border border-accent-red-border px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}

      {fetched && prs.length === 0 && (
        <p className="text-sm text-gray-500">
          No new open PRs found — all your current PRs are already in this handover.
        </p>
      )}

      {prs.length > 0 && (
        <>
          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              {selectedPRs.size} of {prs.length} selected
            </p>
            {prs.map((pr) => {
              const key = prKey(pr);
              return (
                <label
                  key={key}
                  className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedPRs.has(key)}
                    onChange={() => toggle(key)}
                    className="mt-0.5 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{pr.title}</p>
                    <p className="text-xs text-gray-500">
                      {pr.repoFullName} #{pr.number}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          <button
            onClick={handleAdd}
            disabled={adding || selectedPRs.size === 0}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {adding ? "Adding..." : `Add ${selectedPRs.size} PR${selectedPRs.size === 1 ? "" : "s"}`}
          </button>
        </>
      )}
    </div>
  );
}
