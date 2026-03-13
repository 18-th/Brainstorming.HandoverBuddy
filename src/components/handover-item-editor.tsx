"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Item {
  id: string;
  prNumber: number;
  prTitle: string;
  prUrl: string;
  repoFullName: string;
  newOwnerLogin: string | null;
  notes: string | null;
  confirmedAt: Date | null;
}

interface Props {
  item: Item;
  handoverId: string;
}

export default function HandoverItemEditor({ item, handoverId }: Props) {
  const router = useRouter();
  const [owner, setOwner] = useState(item.newOwnerLogin ?? "");
  const [notes, setNotes] = useState(item.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [suggestions, setSuggestions] = useState<{ login: string; avatarUrl: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ownerInputRef = useRef<HTMLDivElement>(null);
  const ownerInputFocusedRef = useRef(false);
  const isMounted = useRef(false);
  const skipNextFetch = useRef(false);
  const fetchGenRef = useRef(0);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    if (owner.length < 1) {
      setSuggestions([]);
      return;
    }
    const gen = ++fetchGenRef.current;
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/github/users?q=${encodeURIComponent(owner)}`);
      const data = await res.json();
      if (fetchGenRef.current !== gen) return;
      setSuggestions(data.users ?? []);
      if (ownerInputFocusedRef.current) {
        setShowSuggestions(true);
      }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [owner]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ownerInputRef.current && !ownerInputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (deleted) return null;

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/handovers/${handoverId}/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newOwnerLogin: owner, notes }),
    });
    router.refresh();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/handovers/${handoverId}/items/${item.id}`, {
      method: "DELETE",
    });
    setDeleted(true);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <a
            href={item.prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold hover:underline text-accent-purple truncate block"
          >
            {item.prTitle} ↗
          </a>
          <p className="text-sm text-gray-500">
            {item.repoFullName} #{item.prNumber}
          </p>
        </div>
          <button
            onClick={() => setConfirmingDelete(true)}
            className="shrink-0 text-xs text-accent-red hover:text-accent-red-dark"
          >
            Remove
          </button>
      </div>

      <div className="space-y-3">
        <div ref={ownerInputRef} className="relative">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            New owner (GitHub username)
          </label>
          <input
            type="text"
            value={owner}
            onChange={(e) => { setOwner(e.target.value); setShowSuggestions(true); }}
            onFocus={() => {
              ownerInputFocusedRef.current = true;
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onBlur={() => {
              ownerInputFocusedRef.current = false;
            }}
            placeholder="e.g. octocat"
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
              {suggestions.map((u) => (
                <li key={u.login}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      skipNextFetch.current = true;
                      setOwner(u.login);
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
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Handover notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Context, blockers, next steps, related issues..."
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {saved && <span className="text-sm text-accent-purple">Saved ✓</span>}
      </div>

      {confirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-4">
            <p className="font-semibold text-gray-900">Remove PR from handover?</p>
            <p className="text-sm text-gray-500">{item.prTitle}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-accent-red px-4 py-2 text-sm font-medium text-white hover:bg-accent-red-dark disabled:opacity-50"
              >
                {deleting ? "Removing..." : "Yes, remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
