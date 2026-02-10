import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postToX, postToXWithImage } from "@/lib/x-client";
import { postToThreads, postToThreadsWithImage } from "@/lib/threads-client";

// Vercel Cron: 予約投稿の自動実行
// vercel.json で設定: 5分ごとに実行
export async function GET(request: NextRequest) {
  // Cronシークレットの検証
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // 予約時間が過ぎている投稿を取得
  const scheduledDrafts = await prisma.draft.findMany({
    where: {
      status: "scheduled",
      scheduledAt: { lte: now },
    },
    orderBy: { scheduledAt: "asc" },
  });

  if (scheduledDrafts.length === 0) {
    return NextResponse.json({ message: "No scheduled posts to publish", published: 0 });
  }

  let published = 0;

  for (const draft of scheduledDrafts) {
    const platforms: string[] = JSON.parse(draft.platforms);
    const results: Record<string, string> = {};
    const errors: string[] = [];

    await prisma.draft.update({
      where: { id: draft.id },
      data: { status: "publishing" },
    });

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

    if (platforms.includes("threads")) {
      try {
        if (draft.imageUrl) {
          const result = await postToThreadsWithImage(draft.rewrittenText, draft.imageUrl);
          results.threadsPostId = result.id;
        } else {
          const result = await postToThreads(draft.rewrittenText);
          results.threadsPostId = result.id;
        }
      } catch (error) {
        errors.push(`Threads: ${error instanceof Error ? error.message : "Failed"}`);
      }
    }

    const hasSuccess = Object.keys(results).length > 0;
    await prisma.draft.update({
      where: { id: draft.id },
      data: {
        status: hasSuccess ? "published" : "failed",
        publishedAt: hasSuccess ? new Date() : null,
        xPostId: results.xPostId || null,
        threadsPostId: results.threadsPostId || null,
        errorMessage: errors.length > 0 ? errors.join("; ") : null,
      },
    });

    if (hasSuccess) published++;
  }

  return NextResponse.json({ message: `Published ${published} posts`, published });
}
