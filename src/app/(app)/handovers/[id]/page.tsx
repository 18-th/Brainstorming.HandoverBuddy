import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import HandoverItemEditor from "@/components/handover-item-editor";
import AddPRsToHandover from "@/components/add-prs-to-handover";

export default async function HandoverDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { githubId: session.user.githubId },
  });

  if (!user) notFound();

  const handover = await prisma.handover.findFirst({
    where: { id, creatorId: user.id },
    include: { items: { orderBy: { createdAt: "asc" } } },
  });

  if (!handover) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">
            ← Dashboard
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{handover.title}</h1>
          {handover.leavingDate && (
            <p className="text-sm text-gray-500">
              Leave date: {new Date(handover.leavingDate).toLocaleDateString()}
            </p>
          )}
        </div>
        <Link
          href={`/handovers/${id}/share`}
          className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          Share &amp; Track →
        </Link>
      </div>

      {handover.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center space-y-4">
          <div>
            <p className="text-gray-500">No PRs added to this handover.</p>
          </div>
          <AddPRsToHandover
            handoverId={id}
            existingPRs={handover.items.map((i) => ({
              prNumber: i.prNumber,
              repoFullName: i.repoFullName,
            }))}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              For each PR, assign a new owner and add context notes.
            </p>
            <AddPRsToHandover
              handoverId={id}
              existingPRs={handover.items.map((i) => ({
                prNumber: i.prNumber,
                repoFullName: i.repoFullName,
              }))}
            />
          </div>
          {handover.items.map((item) => (
            <HandoverItemEditor key={item.id} item={item} handoverId={id} />
          ))}
        </div>
      )}
    </div>
  );
}
