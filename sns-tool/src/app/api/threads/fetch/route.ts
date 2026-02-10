import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchUserPosts } from "@/lib/threads-client";

// POST: 監視中のThreadsアカウントの投稿を取得
export async function POST() {
  try {
    const accounts = await prisma.account.findMany({
      where: { platform: "threads", isActive: true },
    });

    if (accounts.length === 0) {
      return NextResponse.json({ message: "No Threads accounts to monitor", fetched: 0 });
    }

    let totalFetched = 0;

    for (const account of accounts) {
      try {
        const posts = await fetchUserPosts(account.username, 5);

        for (const post of posts) {
          if (!post.text) continue;

          // 重複チェック
          const existing = await prisma.sourcePost.findUnique({
            where: {
              platform_originalUrl: {
                platform: "threads",
                originalUrl: post.permalink || post.id,
              },
            },
          });

          if (!existing) {
            await prisma.sourcePost.create({
              data: {
                accountId: account.id,
                platform: "threads",
                originalUrl: post.permalink || post.id,
                originalText: post.text,
                mediaUrls: post.media_url
                  ? JSON.stringify([post.media_url])
                  : null,
                engagement: post.like_count || 0,
              },
            });
            totalFetched++;
          }
        }
      } catch (error) {
        console.error(`Failed to fetch posts for ${account.username}:`, error);
      }
    }

    return NextResponse.json({
      message: `Fetched ${totalFetched} new posts`,
      fetched: totalFetched,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
