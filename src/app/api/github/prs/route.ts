import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchUserPRs } from "@/lib/github";

export async function GET() {
  const session = await auth();
  if (!session?.accessToken || !session.user.githubLogin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const prs = await fetchUserPRs(session.accessToken, session.user.githubLogin);
    return NextResponse.json({ prs });
  } catch {
    return NextResponse.json({ error: "Failed to fetch PRs from GitHub" }, { status: 500 });
  }
}
