"use client";

import { useEffect, useState } from "react";

interface Account {
  id: string;
  platform: string;
  username: string;
  profileUrl: string;
  isActive: boolean;
  createdAt: string;
  _count: { posts: number };
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [platform, setPlatform] = useState<"threads" | "x">("threads");
  const [username, setUsername] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [isFetching, setIsFetching] = useState(false);

  const fetchAccounts = async () => {
    const res = await fetch("/api/accounts");
    const data = await res.json();
    setAccounts(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleAdd = async () => {
    if (!username.trim() || !profileUrl.trim()) {
      alert("ユーザー名とURLを入力してください");
      return;
    }

    await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, username, profileUrl }),
    });

    setUsername("");
    setProfileUrl("");
    setShowForm(false);
    fetchAccounts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このアカウントを削除しますか？")) return;
    await fetch(`/api/accounts?id=${id}`, { method: "DELETE" });
    fetchAccounts();
  };

  const handleFetchPosts = async () => {
    setIsFetching(true);
    try {
      const res = await fetch("/api/threads/fetch", { method: "POST" });
      const data = await res.json();
      alert(`${data.fetched}件の新しい投稿を取得しました`);
    } catch {
      alert("投稿の取得に失敗しました");
    } finally {
      setIsFetching(false);
    }
  };

  const threadsAccounts = accounts.filter((a) => a.platform === "threads");
  const xAccounts = accounts.filter((a) => a.platform === "x");

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold mb-1">監視アカウント</h2>
          <p className="text-[var(--color-text-secondary)] text-sm">
            投稿を監視するSNSアカウントを管理
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleFetchPosts}
            disabled={isFetching}
            className="bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-50"
          >
            {isFetching ? "取得中..." : "🔄 投稿を取得"}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-[var(--color-bg)] rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            + アカウント追加
          </button>
        </div>
      </div>

      {/* 追加フォーム */}
      {showForm && (
        <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)] mb-6">
          <h3 className="font-medium mb-3">新しいアカウントを追加</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as "threads" | "x")}
              className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
            >
              <option value="threads">Threads</option>
              <option value="x">X (手動監視)</option>
            </select>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ユーザー名 (例: @openai)"
              className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="url"
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              placeholder="プロフィールURL"
              className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
            />
            <button
              onClick={handleAdd}
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-[var(--color-bg)] rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              追加
            </button>
          </div>
          {platform === "x" && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-2">
              ※ X アカウントはFreeプランのため自動取得不可。手動でURLを貼り付けて投稿を作成してください。
            </p>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-[var(--color-text-secondary)]">
          読み込み中...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Threads アカウント */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="bg-gray-700 text-white text-xs px-2 py-0.5 rounded">
                Threads
              </span>
              <span className="text-sm text-[var(--color-text-secondary)] font-normal">
                自動監視 ({threadsAccounts.length}アカウント)
              </span>
            </h3>

            {threadsAccounts.length === 0 ? (
              <div className="bg-[var(--color-surface)] rounded-xl p-8 text-center border border-[var(--color-border)]">
                <p className="text-[var(--color-text-secondary)] text-sm">
                  Threadsアカウントが未登録です
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {threadsAccounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>

          {/* X アカウント */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="bg-black text-white text-xs px-2 py-0.5 rounded">
                X
              </span>
              <span className="text-sm text-[var(--color-text-secondary)] font-normal">
                手動監視 ({xAccounts.length}アカウント)
              </span>
            </h3>

            {xAccounts.length === 0 ? (
              <div className="bg-[var(--color-surface)] rounded-xl p-8 text-center border border-[var(--color-border)]">
                <p className="text-[var(--color-text-secondary)] text-sm">
                  Xアカウントが未登録です
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {xAccounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AccountCard({
  account,
  onDelete,
}: {
  account: Account;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)] flex items-center gap-3">
      <div className="w-10 h-10 bg-[var(--color-primary)]/20 rounded-full flex items-center justify-center text-[var(--color-primary)] font-bold text-sm">
        {account.username.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{account.username}</p>
        <p className="text-xs text-[var(--color-text-secondary)]">
          取得済み: {account._count.posts}件
        </p>
      </div>
      <button
        onClick={() => onDelete(account.id)}
        className="text-xs text-red-400 hover:text-red-300 px-2 py-1"
      >
        削除
      </button>
    </div>
  );
}
