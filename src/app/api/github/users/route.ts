import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getOctokit } from "@/lib/github";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 1) {
    return NextResponse.json({ users: [] });
  }

  try {
    const octokit = getOctokit(session.accessToken);
    const { data } = await octokit.rest.search.users({
      q,
      per_page: 5,
    });
    const users = data.items.map((u) => ({
      login: u.login,
      avatarUrl: u.avatar_url,
    }));
    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 });
  }
}
