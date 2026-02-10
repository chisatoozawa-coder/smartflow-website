"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

interface Stats {
  total: number;
  drafts: number;
  scheduled: number;
  published: number;
  failed: number;
}

export default function Dashboard() {
  const [posts, setPosts] = useState<Draft[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    drafts: 0,
    scheduled: 0,
    published: 0,
    failed: 0,
  });

  useEffect(() => {
    fetch("/api/posts")
      .then((res) => res.json())
      .then((data: Draft[]) => {
        setPosts(data);
        setStats({
          total: data.length,
          drafts: data.filter((d) => d.status === "draft").length,
          scheduled: data.filter((d) => d.status === "scheduled").length,
          published: data.filter((d) => d.status === "published").length,
          failed: data.filter((d) => d.status === "failed").length,
        });
      });
  }, []);

  const statCards = [
    { label: "全投稿", value: stats.total, color: "var(--color-primary)" },
    { label: "下書き", value: stats.drafts, color: "var(--color-yellow)" },
    { label: "予約中", value: stats.scheduled, color: "var(--color-purple)" },
    { label: "投稿済", value: stats.published, color: "#22C55E" },
    { label: "失敗", value: stats.failed, color: "#EF4444" },
  ];

  const recentPosts = posts.slice(0, 5);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1">ダッシュボード</h2>
        <p className="text-[var(--color-text-secondary)] text-sm">
          SNS自動投稿の管理画面
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)]"
          >
            <p className="text-[var(--color-text-secondary)] text-xs mb-1">
              {card.label}
            </p>
            <p className="text-2xl font-bold" style={{ color: card.color }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* クイックアクション */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link
          href="/posts/new"
          className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-[var(--color-bg)] rounded-xl p-6 text-center transition-colors font-medium"
        >
          ✏️ 新しい投稿を作成
        </Link>
        <Link
          href="/accounts"
          className="bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] rounded-xl p-6 text-center transition-colors border border-[var(--color-border)]"
        >
          👥 監視アカウントを管理
        </Link>
      </div>

      {/* 最近の投稿 */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
        <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
          <h3 className="font-semibold">最近の投稿</h3>
          <Link
            href="/posts"
            className="text-sm text-[var(--color-primary)] hover:underline"
          >
            すべて見る →
          </Link>
        </div>

        {recentPosts.length === 0 ? (
          <div className="p-8 text-center text-[var(--color-text-secondary)]">
            <p className="text-4xl mb-2">📝</p>
            <p>まだ投稿がありません</p>
            <Link
              href="/posts/new"
              className="text-[var(--color-primary)] hover:underline text-sm mt-1 inline-block"
            >
              最初の投稿を作成する →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {recentPosts.map((post) => (
              <div key={post.id} className="p-4 flex items-start gap-3">
                <StatusBadge status={post.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{post.rewrittenText}</p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    {new Date(post.createdAt).toLocaleString("ja-JP")}
                    {post.scheduledAt &&
                      ` | 予約: ${new Date(post.scheduledAt).toLocaleString("ja-JP")}`}
                  </p>
                </div>
                <PlatformBadges platforms={post.platforms} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    draft: { label: "下書き", color: "var(--color-yellow)" },
    scheduled: { label: "予約中", color: "var(--color-purple)" },
    publishing: { label: "投稿中", color: "var(--color-primary)" },
    published: { label: "投稿済", color: "#22C55E" },
    failed: { label: "失敗", color: "#EF4444" },
  };

  const { label, color } = config[status] || config.draft;

  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {label}
    </span>
  );
}

function PlatformBadges({ platforms }: { platforms: string }) {
  const parsed: string[] = JSON.parse(platforms);
  return (
    <div className="flex gap-1">
      {parsed.includes("x") && (
        <span className="text-xs bg-black text-white px-2 py-0.5 rounded">
          X
        </span>
      )}
      {parsed.includes("threads") && (
        <span className="text-xs bg-gray-700 text-white px-2 py-0.5 rounded">
          Threads
        </span>
      )}
    </div>
  );
}
