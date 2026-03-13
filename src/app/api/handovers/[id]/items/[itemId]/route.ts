import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getItemForUser(itemId: string, githubId: string) {
  const user = await prisma.user.findUnique({ where: { githubId } });
  if (!user) return null;
  return prisma.handoverItem.findFirst({
    where: { id: itemId, handover: { creatorId: user.id } },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await auth();
  if (!session?.user.githubId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { itemId } = await params;
  const item = await getItemForUser(itemId, session.user.githubId);
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const { newOwnerLogin, notes } = body as {
    newOwnerLogin?: string;
    notes?: string;
  };

  const updated = await prisma.handoverItem.update({
    where: { id: itemId },
    data: {
      ...(newOwnerLogin !== undefined && { newOwnerLogin }),
      ...(notes !== undefined && { notes }),
    },
  });

  return NextResponse.json({ item: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await auth();
  if (!session?.user.githubId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { itemId } = await params;
  const item = await getItemForUser(itemId, session.user.githubId);
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.handoverItem.delete({ where: { id: itemId } });
  return NextResponse.json({ success: true });
}
