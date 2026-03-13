import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { HandoverStatus } from "@/generated/prisma/enums";

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
        <div className="space-y-3">
          {handovers.map((h) => {
            const confirmed = h.items.filter((i) => i.confirmedAt).length;
            const total = h.items.length;
            return (
              <Link
                key={h.id}
                href={`/handovers/${h.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-400 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="font-semibold truncate">{h.title}</h2>
                    {h.leavingDate && (
                      <p className="text-sm text-gray-500 mt-0.5">
                        Leave date: {new Date(h.leavingDate).toLocaleDateString()}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-0.5">
                      {total === 0
                        ? "No PRs added"
                        : `${confirmed}/${total} PRs confirmed`}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[h.status]}`}
                  >
                    {STATUS_LABELS[h.status]}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
