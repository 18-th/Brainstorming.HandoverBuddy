import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user.githubId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { githubId: session.user.githubId },
    include: {
      handovers: {
        include: { items: { select: { id: true, confirmedAt: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return NextResponse.json({ handovers: user?.handovers ?? [] });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user.githubId || !session.user.githubLogin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, leavingDate } = body as { title: string; leavingDate?: string };

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (!leavingDate) {
    return NextResponse.json({ error: "Leave start date is required" }, { status: 400 });
  }

  const user = await prisma.user.upsert({
    where: { githubId: session.user.githubId },
    update: {
      githubLogin: session.user.githubLogin,
      avatarUrl: session.user.avatarUrl,
    },
    create: {
      githubId: session.user.githubId,
      githubLogin: session.user.githubLogin,
      avatarUrl: session.user.avatarUrl,
    },
  });

  const handover = await prisma.handover.create({
    data: {
      title: title.trim(),
      leavingDate: leavingDate ? new Date(leavingDate) : null,
      creatorId: user.id,
    },
  });

  return NextResponse.json({ handover }, { status: 201 });
}
