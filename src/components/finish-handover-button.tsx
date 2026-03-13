"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FinishHandoverButton({ handoverId }: { handoverId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleFinish() {
    if (!confirm("Mark this handover as complete? This cannot be undone.")) return;
    setLoading(true);
    await fetch(`/api/handovers/${handoverId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETE" }),
    });
    router.refresh();
  }

  return (
    <button
      onClick={handleFinish}
      disabled={loading}
      className="shrink-0 rounded-lg bg-accent-red px-4 py-2 text-sm font-medium text-white hover:bg-accent-red-dark disabled:opacity-50 transition-colors"
    >
      {loading ? "Finishing..." : "Finish handover"}
    </button>
  );
}
