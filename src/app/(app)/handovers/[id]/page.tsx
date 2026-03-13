import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import HandoverItemEditor from "@/components/handover-item-editor";
import AddPRsToHandover from "@/components/add-prs-to-handover";
import CopyLinkButton from "@/components/copy-link-button";
import ActivateHandoverButton from "@/components/activate-handover-button";
import FinishHandoverButton from "@/components/finish-handover-button";

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const confirmed = handover.items.filter((i) => i.confirmedAt).length;
  const total = handover.items.length;

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
          <p className="text-sm text-gray-500 mt-0.5">
            {confirmed}/{total} PRs confirmed
          </p>
        </div>
        <div className="flex items-center gap-3">
          {handover.status === "DRAFT" && <ActivateHandoverButton handoverId={id} />}
          {handover.status !== "COMPLETE" && <FinishHandoverButton handoverId={id} />}
          {handover.status === "COMPLETE" ? (
            <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              Complete
            </span>
          ) : handover.status === "ACTIVE" ? (
            <span className="shrink-0 rounded-full bg-accent-purple-light px-3 py-1 text-sm font-medium text-accent-purple">
              Active
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
              Draft
            </span>
          )}
        </div>
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
        <div className="space-y-6">
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

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Share links &amp; confirmations</h2>
            {handover.items.map((item) => {
              const confirmUrl = `${appUrl}/confirm/${item.confirmToken}`;
              return (
                <div
                  key={`share-${item.id}`}
                  className="rounded-xl border border-gray-200 bg-white p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <a
                        href={item.prUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold hover:underline"
                      >
                        {item.prTitle}
                      </a>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {item.repoFullName} #{item.prNumber}
                      </p>
                      {item.newOwnerLogin && (
                        <p className="text-sm text-gray-600 mt-1">
                          New owner:{" "}
                          <a
                            href={`https://github.com/${item.newOwnerLogin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:underline"
                          >
                            @{item.newOwnerLogin}
                          </a>
                        </p>
                      )}
                    </div>
                    {item.confirmedAt ? (
                      <span className="shrink-0 rounded-full bg-accent-purple-light px-2.5 py-0.5 text-xs font-medium text-accent-purple">
                        ✓ Confirmed
                        {item.confirmedByName && ` by ${item.confirmedByName}`}
                      </span>
                    ) : item.refusedAt ? (
                      <span className="shrink-0 rounded-full bg-accent-red-light px-2.5 py-0.5 text-xs font-medium text-accent-red">
                        ✗ Declined
                        {item.refusedByName && ` by ${item.refusedByName}`}
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                        Pending
                      </span>
                    )}
                  </div>

                  {item.notes && (
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 whitespace-pre-wrap">
                      {item.notes}
                    </p>
                  )}

                  {item.refusedAt && (item.refusalMessage || item.refusalSuggestedOwner) && (
                    <div className="rounded-lg bg-accent-red-light border border-accent-red-border px-3 py-2 space-y-1">
                      {item.refusalMessage && (
                        <p className="text-sm text-accent-red">{item.refusalMessage}</p>
                      )}
                      {item.refusalSuggestedOwner && (
                        <p className="text-sm text-gray-600">
                          Suggested:{" "}
                          <a
                            href={`https://github.com/${item.refusalSuggestedOwner}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-accent-purple hover:underline"
                          >
                            @{item.refusalSuggestedOwner}
                          </a>
                        </p>
                      )}
                    </div>
                  )}

                  {item.newOwnerLogin ? (
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={confirmUrl}
                        className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-mono text-gray-600"
                      />
                      <CopyLinkButton url={confirmUrl} />
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">Assign an owner before sharing.</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
