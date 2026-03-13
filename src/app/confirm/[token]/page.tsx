import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ConfirmButton from "@/components/confirm-button";

export default async function ConfirmPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const item = await prisma.handoverItem.findUnique({
    where: { confirmToken: token },
    include: { handover: { select: { title: true, creator: { select: { githubLogin: true } } } } },
  });

  if (!item) notFound();

  if (!item.newOwnerLogin) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md w-full space-y-4 text-center">
          <h1 className="text-2xl font-bold">No owner assigned</h1>
          <p className="text-gray-600">
            This PR hasn&apos;t been assigned to anyone yet. The handover creator needs to assign an owner first.
          </p>
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-left">
            <p className="font-semibold">{item.prTitle}</p>
            <p className="text-sm text-gray-500">
              {item.repoFullName} #{item.prNumber}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (item.confirmedAt) {
    const confirmedDate = new Date(item.confirmedAt).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });

    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/50 p-6 shadow-sm">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-100/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                <span className="text-sm" aria-hidden>
                  ✓
                </span>
                Already confirmed
              </div>

              <div>
                <p className="text-lg font-semibold text-primary">This handover is complete</p>
                <p className="mt-1 text-sm text-primary/80">
                  Confirmed on {confirmedDate}
                  {item.confirmedByName && ` by ${item.confirmedByName}`}.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200/80 bg-white/80 p-4 text-left">
                <a
                  href={item.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-accent-purple hover:underline"
                >
                  {item.prTitle} ↗
                </a>
                <p className="mt-1 text-sm text-gray-600">
                  {item.repoFullName} #{item.prNumber}
                </p>
              </div>

              <p className="text-xs text-gray-500">You can close this tab now.</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (item.refusedAt) {
    const refusedDate = new Date(item.refusedAt).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });

    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="relative overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 via-white to-red-100/60 p-6 shadow-sm">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-100/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-800">
                <span className="text-sm" aria-hidden>
                  !
                </span>
                Already declined
              </div>

              <div>
                <p className="text-lg font-semibold text-accent-red">This handover was declined</p>
                <p className="mt-1 text-sm text-accent-red/90">
                  Declined on {refusedDate}
                  {item.refusedByName && ` by ${item.refusedByName}`}.
                </p>
              </div>

              <div className="rounded-xl border border-red-200/80 bg-white/85 p-4 text-left space-y-2">
                <a
                  href={item.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-accent-purple hover:underline"
                >
                  {item.prTitle} ↗
                </a>
                <p className="text-sm text-gray-600">
                  {item.repoFullName} #{item.prNumber}
                </p>
                {item.refusalMessage && (
                  <p className="border-t border-red-100 pt-2 text-sm text-gray-700">{item.refusalMessage}</p>
                )}
                {item.refusalSuggestedOwner && (
                  <p className="border-t border-red-100 pt-2 text-sm text-gray-600">
                    Suggested owner:{" "}
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

              <p className="text-xs text-gray-500">You can close this tab now.</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        <div>
          <p className="text-sm text-gray-500">
            Handover from <span className="font-medium">@{item.handover.creator.githubLogin}</span>
          </p>
          <h1 className="mt-1 text-2xl font-bold">PR Handover</h1>
          <p className="text-sm text-gray-500">{item.handover.title}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
          <div>
            <a
              href={item.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold hover:underline text-accent-purple"
            >
              {item.prTitle} ↗
            </a>
            <p className="text-sm text-gray-500 mt-0.5">
              {item.repoFullName} #{item.prNumber}
            </p>
          </div>

          {item.newOwnerLogin && (
            <p className="text-sm text-gray-600">
              Assigned to: <span className="font-medium">@{item.newOwnerLogin}</span>
            </p>
          )}

          {item.notes && (
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Handover notes
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.notes}</p>
            </div>
          )}
        </div>

        <ConfirmButton
          token={token}
          prTitle={item.prTitle}
          prUrl={item.prUrl}
          repoFullName={item.repoFullName}
          prNumber={item.prNumber}
        />
      </div>
    </main>
  );
}
