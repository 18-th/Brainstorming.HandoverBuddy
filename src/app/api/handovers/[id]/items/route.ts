import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getHandoverForUser(id: string, githubId: string) {
  const user = await prisma.user.findUnique({ where: { githubId } });
  if (!user) return null;
  return prisma.handover.findFirst({ where: { id, creatorId: user.id } });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user.githubId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const handover = await getHandoverForUser(id, session.user.githubId);
  if (!handover) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const items = await prisma.handoverItem.findMany({
    where: { handoverId: id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ items });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user.githubId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const handover = await getHandoverForUser(id, session.user.githubId);
  if (!handover) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const { prNumber, prTitle, prUrl, repoFullName } = body as {
    prNumber: number;
    prTitle: string;
    prUrl: string;
    repoFullName: string;
  };

  if (!prNumber || !prTitle || !prUrl || !repoFullName) {
    return NextResponse.json({ error: "Missing required PR fields" }, { status: 400 });
  }

  const item = await prisma.handoverItem.create({
    data: { prNumber, prTitle, prUrl, repoFullName, handoverId: id },
  });

  return NextResponse.json({ item }, { status: 201 });
}
