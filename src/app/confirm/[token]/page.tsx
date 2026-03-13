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
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md w-full space-y-4 text-center">
          <div className="text-5xl">✅</div>
          <h1 className="text-2xl font-bold">Already confirmed</h1>
          <p className="text-gray-600">
            This PR was confirmed on{" "}
            {new Date(item.confirmedAt).toLocaleDateString()}
            {item.confirmedByName && ` by ${item.confirmedByName}`}.
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

  if (item.refusedAt) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md w-full space-y-4 text-center">
          <div className="text-5xl">🚫</div>
          <h1 className="text-2xl font-bold">Already declined</h1>
          <p className="text-gray-600">
            This PR was declined on{" "}
            {new Date(item.refusedAt).toLocaleDateString()}
            {item.refusedByName && ` by ${item.refusedByName}`}.
          </p>
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-left space-y-2">
            <p className="font-semibold">{item.prTitle}</p>
            <p className="text-sm text-gray-500">
              {item.repoFullName} #{item.prNumber}
            </p>
            {item.refusalMessage && (
              <p className="text-sm text-gray-700 border-t border-gray-100 pt-2">{item.refusalMessage}</p>
            )}
            {item.refusalSuggestedOwner && (
              <p className="text-sm text-gray-600 border-t border-gray-100 pt-2">
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

        <ConfirmButton token={token} prTitle={item.prTitle} />
      </div>
    </main>
  );
}
