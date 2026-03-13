"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/confirm-dialog";

export default function DeleteHandoverButton({ handoverId }: { handoverId: string }) {
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const router = useRouter();

  async function handleConfirmDelete() {
    setLoading(true);
    const res = await fetch(`/api/handovers/${handoverId}`, { method: "DELETE" });

    if (!res.ok) {
      setLoading(false);
      return;
    }

    setConfirmOpen(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
        className="shrink-0 rounded-lg border border-accent-red-border px-4 py-2 text-sm font-medium text-accent-red hover:bg-accent-red-light disabled:opacity-50 transition-colors"
      >
        {loading ? "Deleting..." : "Delete handover"}
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this handover?"
        description="This action cannot be undone."
        confirmLabel="Yes, delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
        loading={loading}
        tone="danger"
      />
    </>
  );
}
