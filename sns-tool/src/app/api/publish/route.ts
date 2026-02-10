import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postToX, postToXWithImage } from "@/lib/x-client";
import { postToThreads, postToThreadsWithImage } from "@/lib/threads-client";

// POST: 投稿を公開
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "Draft ID is required" }, { status: 400 });
  }

  const draft = await prisma.draft.findUnique({ where: { id } });
  if (!draft) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  // ステータスを「投稿中」に更新
  await prisma.draft.update({
    where: { id },
    data: { status: "publishing" },
  });

  const platforms: string[] = JSON.parse(draft.platforms);
  const results: Record<string, string> = {};
  const errors: string[] = [];

  // X に投稿
  if (platforms.includes("x")) {
    try {
      if (draft.imageUrl && draft.imageUrl.startsWith("data:")) {
        const base64Data = draft.imageUrl.split(",")[1];
        const buffer = Buffer.from(base64Data, "base64");
        const result = await postToXWithImage(draft.rewrittenText, buffer);
        results.xPostId = result.id;
      } else {
        const result = await postToX(draft.rewrittenText);
        results.xPostId = result.id;
      }
    } catch (error) {
      errors.push(`X: ${error instanceof Error ? error.message : "Failed"}`);
    }
  }

  // Threads に投稿
  if (platforms.includes("threads")) {
    try {
      if (draft.imageUrl) {
        const imageUrl = draft.imageUrl.startsWith("data:")
          ? draft.imageUrl
          : draft.imageUrl;
        const result = await postToThreadsWithImage(draft.rewrittenText, imageUrl);
        results.threadsPostId = result.id;
      } else {
        const result = await postToThreads(draft.rewrittenText);
        results.threadsPostId = result.id;
      }
    } catch (error) {
      errors.push(`Threads: ${error instanceof Error ? error.message : "Failed"}`);
    }
  }

  // 結果を更新
  const hasSuccess = Object.keys(results).length > 0;
  await prisma.draft.update({
    where: { id },
    data: {
      status: hasSuccess ? "published" : "failed",
      publishedAt: hasSuccess ? new Date() : null,
      xPostId: results.xPostId || null,
      threadsPostId: results.threadsPostId || null,
      errorMessage: errors.length > 0 ? errors.join("; ") : null,
    },
  });

  if (errors.length > 0 && !hasSuccess) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 500 });
  }

  return NextResponse.json({ success: true, results, errors });
}
