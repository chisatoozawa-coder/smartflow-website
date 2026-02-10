import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: 監視アカウント一覧
export async function GET() {
  const accounts = await prisma.account.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { posts: true } } },
  });

  return NextResponse.json(accounts);
}

// POST: アカウント追加
export async function POST(request: NextRequest) {
  const body = await request.json();

  const account = await prisma.account.create({
    data: {
      platform: body.platform,
      username: body.username,
      profileUrl: body.profileUrl,
    },
  });

  return NextResponse.json(account, { status: 201 });
}

// DELETE: アカウント削除
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  await prisma.account.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
