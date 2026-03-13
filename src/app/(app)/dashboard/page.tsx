import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { HandoverStatus } from "@/generated/prisma/enums";
import DeleteHandoverButton from "@/components/delete-handover-button";

const STATUS_LABELS: Record<HandoverStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  COMPLETE: "Complete",
};

const STATUS_STYLES: Record<HandoverStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  ACTIVE: "bg-accent-purple-light text-accent-purple",
  COMPLETE: "bg-primary/10 text-primary",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { githubId: session.user.githubId },
    include: {
      handovers: {
        include: { items: { select: { id: true, confirmedAt: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const STATUS_ORDER: Record<HandoverStatus, number> = { DRAFT: 0, ACTIVE: 1, COMPLETE: 2 };
  const handovers = (user?.handovers ?? []).sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
  );
  const openHandovers = handovers.filter((h) => h.status !== "COMPLETE");
  const completedHandovers = handovers.filter((h) => h.status === "COMPLETE");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Handovers</h1>
        <Link
          href="/handovers/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          + New Handover
        </Link>
      </div>

      {handovers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">No handovers yet.</p>
          <p className="mt-1 text-sm text-gray-400">
            Create one to start handing over your open PRs.
          </p>
          <Link
            href="/handovers/new"
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Create your first handover
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {openHandovers.length > 0 && (
            <div className="space-y-3">
              {openHandovers.map((h) => {
                const confirmed = h.items.filter((i) => i.confirmedAt).length;
                const total = h.items.length;
                return (
                  <div
                    key={h.id}
                    className="rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-400"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <Link href={`/handovers/${h.id}`} className="min-w-0 flex-1">
                        <h2 className="font-semibold truncate">{h.title}</h2>
                        {h.leavingDate && (
                          <p className="text-sm text-gray-500 mt-0.5">
                            Leave date: {new Date(h.leavingDate).toLocaleDateString()}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 mt-0.5">
                          {total === 0 ? "No PRs added" : `${confirmed}/${total} PRs confirmed`}
                        </p>
                      </Link>
                      <div className="flex items-center gap-2">
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[h.status]}`}
                        >
                          {STATUS_LABELS[h.status]}
                        </span>
                        <DeleteHandoverButton handoverId={h.id} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {completedHandovers.length > 0 && (
            <details className="rounded-xl border border-gray-200 bg-white p-4" open={openHandovers.length === 0}>
              <summary className="cursor-pointer text-sm font-semibold text-gray-800">
                <span className="inline-flex items-center gap-2">
                  <span>Completed handovers</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {completedHandovers.length}
                  </span>
                </span>
              </summary>
              <div className="mt-4 space-y-3">
                {completedHandovers.map((h) => {
                  const confirmed = h.items.filter((i) => i.confirmedAt).length;
                  const total = h.items.length;
                  return (
                    <div
                      key={h.id}
                      className="rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-400"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <Link href={`/handovers/${h.id}`} className="min-w-0 flex-1">
                          <h2 className="font-semibold truncate">{h.title}</h2>
                          {h.leavingDate && (
                            <p className="text-sm text-gray-500 mt-0.5">
                              Leave date: {new Date(h.leavingDate).toLocaleDateString()}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 mt-0.5">
                            {total === 0 ? "No PRs added" : `${confirmed}/${total} PRs confirmed`}
                          </p>
                        </Link>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[h.status]}`}
                        >
                          {STATUS_LABELS[h.status]}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
