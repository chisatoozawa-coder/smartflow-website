"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Draft {
  id: string;
  rewrittenText: string;
  originalText: string | null;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  platforms: string;
  imageUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
}

const STATUS_FILTERS = [
  { value: "", label: "すべて" },
  { value: "draft", label: "下書き" },
  { value: "scheduled", label: "予約中" },
  { value: "published", label: "投稿済" },
  { value: "failed", label: "失敗" },
];

export default function PostsList() {
  const [posts, setPosts] = useState<Draft[]>([]);
  const [filter, setFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = async () => {
    setIsLoading(true);
    const url = filter ? `/api/posts?status=${filter}` : "/api/posts";
    const res = await fetch(url);
    const data = await res.json();
    setPosts(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const handleDelete = async (id: string) => {
    if (!confirm("この投稿を削除しますか？")) return;
    await fetch(`/api/posts?id=${id}`, { method: "DELETE" });
    fetchPosts();
  };

  const handlePublishNow = async (id: string) => {
    if (!confirm("今すぐ投稿しますか？")) return;
    const res = await fetch("/api/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.error) {
      alert(`投稿失敗: ${data.error}`);
    }
    fetchPosts();
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    draft: { label: "下書き", color: "var(--color-yellow)" },
    scheduled: { label: "予約中", color: "var(--color-purple)" },
    publishing: { label: "投稿中", color: "var(--color-primary)" },
    published: { label: "投稿済", color: "#22C55E" },
    failed: { label: "失敗", color: "#EF4444" },
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold mb-1">投稿一覧</h2>
          <p className="text-[var(--color-text-secondary)] text-sm">
            {posts.length}件の投稿
          </p>
        </div>
        <Link
          href="/posts/new"
          className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-[var(--color-bg)] rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          ✏️ 新規作成
        </Link>
      </div>

      {/* フィルター */}
      <div className="flex gap-2 mb-6">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === f.value
                ? "bg-[var(--color-primary)] text-[var(--color-bg)]"
                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 投稿リスト */}
      {isLoading ? (
        <div className="text-center py-12 text-[var(--color-text-secondary)]">
          読み込み中...
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-xl p-12 text-center border border-[var(--color-border)]">
          <p className="text-4xl mb-2">📝</p>
          <p className="text-[var(--color-text-secondary)]">
            投稿がありません
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const { label, color } =
              statusConfig[post.status] || statusConfig.draft;
            const platformList: string[] = JSON.parse(post.platforms);

            return (
              <div
                key={post.id}
                className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* 画像サムネイル */}
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${color}20`,
                          color,
                        }}
                      >
                        {label}
                      </span>
                      {platformList.map((p) => (
                        <span
                          key={p}
                          className="text-xs bg-black/30 px-1.5 py-0.5 rounded"
                        >
                          {p === "x" ? "X" : "Threads"}
                        </span>
                      ))}
                    </div>

                    <p className="text-sm line-clamp-2">
                      {post.rewrittenText}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-xs text-[var(--color-text-secondary)]">
                      <span>
                        作成: {new Date(post.createdAt).toLocaleString("ja-JP")}
                      </span>
                      {post.scheduledAt && (
                        <span>
                          予約:{" "}
                          {new Date(post.scheduledAt).toLocaleString("ja-JP")}
                        </span>
                      )}
                      {post.publishedAt && (
                        <span>
                          投稿:{" "}
                          {new Date(post.publishedAt).toLocaleString("ja-JP")}
                        </span>
                      )}
                    </div>

                    {post.errorMessage && (
                      <p className="text-xs text-red-400 mt-1">
                        {post.errorMessage}
                      </p>
                    )}
                  </div>

                  {/* アクション */}
                  <div className="flex gap-2 flex-shrink-0">
                    {(post.status === "draft" ||
                      post.status === "scheduled") && (
                      <button
                        onClick={() => handlePublishNow(post.id)}
                        className="text-xs bg-[var(--color-primary)] text-[var(--color-bg)] px-3 py-1.5 rounded-lg hover:opacity-90"
                      >
                        今すぐ投稿
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-xs text-red-400 hover:text-red-300 px-2 py-1.5"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
