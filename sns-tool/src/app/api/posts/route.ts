import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: 投稿一覧取得
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where = status ? { status } : {};

  const drafts = await prisma.draft.findMany({
    where,
    include: { sourcePost: { include: { account: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(drafts);
}

// POST: 新規投稿作成
export async function POST(request: NextRequest) {
  const body = await request.json();

  const draft = await prisma.draft.create({
    data: {
      sourcePostId: body.sourcePostId || null,
      originalText: body.originalText || null,
      rewrittenText: body.rewrittenText,
      imageUrl: body.imageUrl || null,
      imageSource: body.imageSource || null,
      status: body.scheduledAt ? "scheduled" : "draft",
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      platforms: JSON.stringify(body.platforms || ["x", "threads"]),
    },
  });

  return NextResponse.json(draft, { status: 201 });
}

// PUT: 投稿更新
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...data } = body;

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (data.rewrittenText !== undefined) updateData.rewrittenText = data.rewrittenText;
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
  if (data.imageSource !== undefined) updateData.imageSource = data.imageSource;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.scheduledAt !== undefined) updateData.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
  if (data.platforms !== undefined) updateData.platforms = JSON.stringify(data.platforms);

  const draft = await prisma.draft.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(draft);
}

// DELETE: 投稿削除
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  await prisma.draft.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
