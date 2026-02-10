"use client";

import { useEffect, useState } from "react";

interface Draft {
  id: string;
  rewrittenText: string;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  platforms: string;
  imageUrl: string | null;
  createdAt: string;
}

export default function SchedulePage() {
  const [posts, setPosts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/posts?status=scheduled")
      .then((res) => res.json())
      .then((data) => {
        setPosts(data);
        setIsLoading(false);
      });
  }, []);

  // 日付ごとにグループ化
  const groupedByDate = posts.reduce(
    (acc, post) => {
      if (!post.scheduledAt) return acc;
      const date = new Date(post.scheduledAt).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      });
      if (!acc[date]) acc[date] = [];
      acc[date].push(post);
      return acc;
    },
    {} as Record<string, Draft[]>
  );

  const handleCancel = async (id: string) => {
    if (!confirm("この予約を取り消して下書きに戻しますか？")) return;
    await fetch("/api/posts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "draft", scheduledAt: null }),
    });
    // リフレッシュ
    const res = await fetch("/api/posts?status=scheduled");
    setPosts(await res.json());
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1">スケジュール</h2>
        <p className="text-[var(--color-text-secondary)] text-sm">
          予約中の投稿一覧（{posts.length}件）
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-[var(--color-text-secondary)]">
          読み込み中...
        </div>
      ) : Object.keys(groupedByDate).length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-xl p-12 text-center border border-[var(--color-border)]">
          <p className="text-4xl mb-2">📅</p>
          <p className="text-[var(--color-text-secondary)]">
            予約中の投稿はありません
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([date, datePosts]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-[var(--color-primary)] mb-3 flex items-center gap-2">
                📅 {date}
                <span className="text-xs text-[var(--color-text-secondary)] font-normal">
                  ({datePosts.length}件)
                </span>
              </h3>

              <div className="space-y-2">
                {datePosts
                  .sort(
                    (a, b) =>
                      new Date(a.scheduledAt!).getTime() -
                      new Date(b.scheduledAt!).getTime()
                  )
                  .map((post) => {
                    const time = new Date(
                      post.scheduledAt!
                    ).toLocaleTimeString("ja-JP", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const platforms: string[] = JSON.parse(post.platforms);

                    return (
                      <div
                        key={post.id}
                        className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)] flex items-start gap-4"
                      >
                        <div className="text-center flex-shrink-0">
                          <p className="text-lg font-bold text-[var(--color-primary)]">
                            {time}
                          </p>
                        </div>

                        {post.imageUrl && (
                          <img
                            src={post.imageUrl}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="text-sm line-clamp-2">
                            {post.rewrittenText}
                          </p>
                          <div className="flex gap-1 mt-2">
                            {platforms.map((p) => (
                              <span
                                key={p}
                                className="text-xs bg-black/30 px-1.5 py-0.5 rounded"
                              >
                                {p === "x" ? "X" : "Threads"}
                              </span>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => handleCancel(post.id)}
                          className="text-xs text-[var(--color-text-secondary)] hover:text-red-400 px-2 py-1 flex-shrink-0"
                        >
                          取消
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
