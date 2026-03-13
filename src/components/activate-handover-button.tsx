"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ActivateHandoverButton({ handoverId }: { handoverId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleActivate() {
    setLoading(true);
    await fetch(`/api/handovers/${handoverId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACTIVE" }),
    });
    router.refresh();
  }

  return (
    <button
      onClick={handleActivate}
      disabled={loading}
      className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
    >
      {loading ? "Starting..." : "Start tracking"}
    </button>
  );
}
