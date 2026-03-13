import { getOctokit } from "@/lib/github";
import { isEmailConfigured, sendEmail } from "@/lib/email";

type HandoverNotificationItem = {
  prTitle: string;
  prUrl: string;
  repoFullName: string;
  prNumber: number;
  newOwnerLogin: string | null;
  confirmToken: string;
  confirmedAt?: Date | null;
  refusedAt?: Date | null;
};

type SendActivationEmailsArgs = {
  handoverTitle: string;
  creatorLogin: string;
  items: HandoverNotificationItem[];
  accessToken: string;
  appUrl: string;
};

type SendCompletionEmailsArgs = {
  handoverTitle: string;
  creatorLogin: string;
  items: HandoverNotificationItem[];
  accessToken: string;
};

type NotificationResult = {
  attempted: number;
  sent: number;
  skippedOwners: string[];
  error?: string;
};

async function resolveOwnerEmail(login: string, accessToken: string) {
  const octokit = getOctokit(accessToken);

  try {
    const { data } = await octokit.rest.users.getByUsername({ username: login });
    if (data.email) return data.email;
  } catch {
    // Best effort lookup; skip if unavailable.
  }

  const domain = process.env.HANDOVER_EMAIL_DOMAIN;
  if (!domain) return null;
  return `${login}@${domain}`;
}

export async function sendActivationEmails({
  handoverTitle,
  creatorLogin,
  items,
  accessToken,
  appUrl,
}: SendActivationEmailsArgs) {
  if (!isEmailConfigured()) {
    return <NotificationResult>{
      attempted: 0,
      sent: 0,
      skippedOwners: [] as string[],
      error: "SMTP is not configured",
    };
  }

  const itemsByOwner = new Map<string, HandoverNotificationItem[]>();
  for (const item of items) {
    if (!item.newOwnerLogin) continue;
    const ownerItems = itemsByOwner.get(item.newOwnerLogin) ?? [];
    ownerItems.push(item);
    itemsByOwner.set(item.newOwnerLogin, ownerItems);
  }

  let sent = 0;
  const skippedOwners: string[] = [];

  for (const [ownerLogin, ownerItems] of itemsByOwner.entries()) {
    const to = await resolveOwnerEmail(ownerLogin, accessToken);
    if (!to) {
      skippedOwners.push(ownerLogin);
      continue;
    }

    const lines = ownerItems.map((item) => {
      const confirmUrl = `${appUrl}/confirm/${item.confirmToken}`;
      return [
        `- ${item.repoFullName} #${item.prNumber}: ${item.prTitle}`,
        `  PR: ${item.prUrl}`,
        `  Confirm: ${confirmUrl}`,
      ].join("\n");
    });

    const subject = `Handover request: ${handoverTitle}`;
    const text = [
      `Hi @${ownerLogin},`,
      "",
      `@${creatorLogin} started a handover and assigned you ${ownerItems.length} PR${ownerItems.length === 1 ? "" : "s"}.`,
      "Please review and confirm each item:",
      "",
      ...lines,
    ].join("\n");

    try {
      const result = await sendEmail({ to, subject, text });
      if (result.sent) sent += 1;
    } catch {
      skippedOwners.push(ownerLogin);
    }
  }

  return {
    attempted: itemsByOwner.size,
    sent,
    skippedOwners,
  };
}

export async function sendCompletionEmails({
  handoverTitle,
  creatorLogin,
  items,
  accessToken,
}: SendCompletionEmailsArgs) {
  if (!isEmailConfigured()) {
    return <NotificationResult>{
      attempted: 0,
      sent: 0,
      skippedOwners: [] as string[],
      error: "SMTP is not configured",
    };
  }

  const itemsByOwner = new Map<string, HandoverNotificationItem[]>();
  for (const item of items) {
    if (!item.newOwnerLogin) continue;
    const ownerItems = itemsByOwner.get(item.newOwnerLogin) ?? [];
    ownerItems.push(item);
    itemsByOwner.set(item.newOwnerLogin, ownerItems);
  }

  let sent = 0;
  const skippedOwners: string[] = [];

  for (const [ownerLogin, ownerItems] of itemsByOwner.entries()) {
    const to = await resolveOwnerEmail(ownerLogin, accessToken);
    if (!to) {
      skippedOwners.push(ownerLogin);
      continue;
    }

    const lines = ownerItems.map((item) => {
      const status = item.confirmedAt ? "Confirmed" : item.refusedAt ? "Declined" : "Pending";
      return [
        `- ${item.repoFullName} #${item.prNumber}: ${item.prTitle}`,
        `  Status: ${status}`,
        `  PR: ${item.prUrl}`,
      ].join("\n");
    });

    const subject = `Handover complete: ${handoverTitle}`;
    const text = [
      `Hi @${ownerLogin},`,
      "",
      `@${creatorLogin} marked this handover as complete.`,
      "Final status of your assigned PRs:",
      "",
      ...lines,
    ].join("\n");

    try {
      const result = await sendEmail({ to, subject, text });
      if (result.sent) sent += 1;
    } catch {
      skippedOwners.push(ownerLogin);
    }
  }

  return {
    attempted: itemsByOwner.size,
    sent,
    skippedOwners,
  };
}
