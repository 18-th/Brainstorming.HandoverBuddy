"use client";

import { useState, useEffect, useRef } from "react";

interface Props {
  token: string;
  prTitle: string;
  prUrl: string;
  repoFullName: string;
  prNumber: number;
}

export default function ConfirmButton({ token, prTitle, prUrl, repoFullName, prNumber }: Props) {
  const [name, setName] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [refusing, setRefusing] = useState(false);
  const [showRefuseForm, setShowRefuseForm] = useState(false);
  const [refusalMessage, setRefusalMessage] = useState("");
  const [refusalSuggestedOwner, setRefusalSuggestedOwner] = useState("");
  const [done, setDone] = useState(false);
  const [confirmedAt, setConfirmedAt] = useState<string | null>(null);
  const [refused, setRefused] = useState(false);
  const [refusedAt, setRefusedAt] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<{ login: string; avatarUrl: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestInputRef = useRef<HTMLDivElement>(null);
  const suggestInputFocusedRef = useRef(false);
  const isMounted = useRef(false);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (refusalSuggestedOwner.length < 1) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/github/users?q=${encodeURIComponent(refusalSuggestedOwner)}`);
      const data = await res.json();
      setSuggestions(data.users ?? []);
      if (suggestInputFocusedRef.current) {
        setShowSuggestions(true);
      }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [refusalSuggestedOwner]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestInputRef.current && !suggestInputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleConfirm() {
    setConfirming(true);
    setError("");
    try {
      const res = await fetch(`/api/confirm/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmedByName: name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to confirm");
      setConfirmedAt(data.confirmedAt ?? new Date().toISOString());
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setConfirming(false);
    }
  }

  async function handleRefuse() {
    setRefusing(true);
    setError("");
    try {
      const res = await fetch(`/api/confirm/${token}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refusedByName: name,
          refusalMessage,
          refusalSuggestedOwner,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit refusal");
      setRefusedAt(data.refusedAt ?? new Date().toISOString());
      setRefused(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setRefusing(false);
    }
  }

  if (done) {
    const confirmedDate = confirmedAt
      ? new Date(confirmedAt).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "Just now";

    return (
      <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/50 p-6 shadow-sm">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-100/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
            <span className="text-sm" aria-hidden>
              ✓
            </span>
            Confirmed
          </div>

          <div>
            <p className="text-lg font-semibold text-primary">Responsibility accepted</p>
            <p className="mt-1 text-sm text-primary/80">
              We&apos;ve recorded your confirmation for this pull request.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-200/80 bg-white/80 p-4">
            <a
              href={prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-accent-purple hover:underline"
            >
              {prTitle} ↗
            </a>
            <p className="mt-1 text-sm text-gray-600">
              {repoFullName} #{prNumber}
            </p>
            <p className="mt-2 text-xs text-gray-500">Confirmed: {confirmedDate}</p>
          </div>

          <p className="text-xs text-gray-500">You can close this tab now.</p>
        </div>
      </div>
    );
  }

  if (refused) {
    const refusedDate = refusedAt
      ? new Date(refusedAt).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "Just now";

    return (
      <div className="relative overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 via-white to-red-100/60 p-6 shadow-sm">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-100/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-800">
            <span className="text-sm" aria-hidden>
              !
            </span>
            Declined
          </div>

          <div>
            <p className="text-lg font-semibold text-accent-red">Handover declined</p>
            <p className="mt-1 text-sm text-accent-red/90">
              We&apos;ve recorded that you cannot take ownership of this pull request.
            </p>
          </div>

          <div className="rounded-xl border border-red-200/80 bg-white/85 p-4">
            <a
              href={prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-accent-purple hover:underline"
            >
              {prTitle} ↗
            </a>
            <p className="mt-1 text-sm text-gray-600">
              {repoFullName} #{prNumber}
            </p>
            <p className="mt-2 text-xs text-gray-500">Declined: {refusedDate}</p>
          </div>

          <p className="text-xs text-gray-500">The sender has been notified. You can close this tab.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-accent-red-light border border-accent-red-border px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your name <span className="text-gray-400">(optional)</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Jane Smith"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {!showRefuseForm ? (
        <>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            {confirming ? "Confirming..." : "I accept responsibility for this PR"}
          </button>
          <button
            onClick={() => setShowRefuseForm(true)}
            disabled={confirming}
            className="w-full rounded-lg border border-accent-red-border px-4 py-2 text-sm font-medium text-accent-red hover:bg-accent-red-light disabled:opacity-50 transition-colors"
          >
            I cannot take this on
          </button>
        </>
      ) : (
        <div className="rounded-xl border border-accent-red-border bg-accent-red-light/40 p-4 space-y-3">
          <p className="text-sm font-medium text-accent-red">Declining this handover</p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Message <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={refusalMessage}
              onChange={(e) => setRefusalMessage(e.target.value)}
              rows={2}
              placeholder="e.g. Already at capacity until end of quarter"
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-red resize-none"
            />
          </div>
          <div ref={suggestInputRef} className="relative">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Suggest someone else <span className="text-gray-400">(GitHub username, optional)</span>
            </label>
            <input
              type="text"
              value={refusalSuggestedOwner}
              onChange={(e) => { setRefusalSuggestedOwner(e.target.value); setShowSuggestions(true); }}
              onFocus={() => {
                suggestInputFocusedRef.current = true;
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              onBlur={() => {
                suggestInputFocusedRef.current = false;
              }}
              placeholder="e.g. octocat"
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-red"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
                {suggestions.map((u) => (
                  <li key={u.login}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setRefusalSuggestedOwner(u.login);
                        setSuggestions([]);
                        setShowSuggestions(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 text-left"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u.avatarUrl} alt="" className="w-5 h-5 rounded-full" />
                      <span>{u.login}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleRefuse}
              disabled={refusing}
              className="flex-1 rounded-lg bg-accent-red px-4 py-2 text-sm font-medium text-white hover:bg-accent-red-dark disabled:opacity-50 transition-colors"
            >
              {refusing ? "Submitting..." : "Submit refusal"}
            </button>
            <button
              onClick={() => setShowRefuseForm(false)}
              disabled={refusing}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-white disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
