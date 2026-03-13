import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getHandoverForUser(id: string, githubId: string) {
  const user = await prisma.user.findUnique({ where: { githubId } });
  if (!user) return null;
  return prisma.handover.findFirst({
    where: { id, creatorId: user.id },
    include: { items: { orderBy: { createdAt: "asc" } } },
  });
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
  return NextResponse.json({ handover });
}

export async function PATCH(
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
  const { title, leavingDate, status } = body as {
    title?: string;
    leavingDate?: string | null;
    status?: "DRAFT" | "ACTIVE" | "COMPLETE";
  };

  const updated = await prisma.handover.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(leavingDate !== undefined && {
        leavingDate: leavingDate ? new Date(leavingDate) : null,
      }),
      ...(status !== undefined && { status }),
    },
  });

  return NextResponse.json({ handover: updated });
}
