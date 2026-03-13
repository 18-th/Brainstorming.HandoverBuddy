import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const item = await prisma.handoverItem.findUnique({
    where: { confirmToken: token },
  });

  if (!item) {
    return NextResponse.json({ error: "Invalid confirmation link" }, { status: 404 });
  }

  if (item.confirmedAt) {
    return NextResponse.json({ error: "Already confirmed" }, { status: 409 });
  }

  if (item.refusedAt) {
    return NextResponse.json({ error: "Already refused" }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const { refusedByName, refusalMessage, refusalSuggestedOwner } = body as {
    refusedByName?: string;
    refusalMessage?: string;
    refusalSuggestedOwner?: string;
  };

  try {
    await prisma.handoverItem.update({
      where: { id: item.id },
      data: {
        refusedAt: new Date(),
        refusedByName: refusedByName?.trim() || null,
        refusalMessage: refusalMessage?.trim() || null,
        refusalSuggestedOwner: refusalSuggestedOwner?.trim() || null,
      },
    });
  } catch (e) {
    console.error("Failed to record refusal:", e);
    return NextResponse.json({ error: "Failed to record refusal" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const item = await prisma.handoverItem.findUnique({
    where: { confirmToken: token },
  });

  if (!item) {
    return NextResponse.json({ error: "Invalid confirmation link" }, { status: 404 });
  }

  if (item.confirmedAt) {
    return NextResponse.json(
      { error: "Already confirmed", confirmedAt: item.confirmedAt },
      { status: 409 }
    );
  }

  if (item.refusedAt) {
    return NextResponse.json({ error: "Already refused" }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const { confirmedByName } = body as { confirmedByName?: string };

  const updated = await prisma.handoverItem.update({
    where: { id: item.id },
    data: {
      confirmedAt: new Date(),
      confirmedByName: confirmedByName?.trim() || null,
    },
  });

  // Check if all items in the handover are now confirmed
  const allItems = await prisma.handoverItem.findMany({
    where: { handoverId: item.handoverId },
    select: { confirmedAt: true },
  });

  const allConfirmed = allItems.every((i) => i.confirmedAt !== null);

  if (allConfirmed) {
    await prisma.handover.update({
      where: { id: item.handoverId },
      data: { status: "COMPLETE" },
    });
  }

  return NextResponse.json({
    success: true,
    prTitle: updated.prTitle,
    confirmedAt: updated.confirmedAt,
    handoverComplete: allConfirmed,
  });
}
