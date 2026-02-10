"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "ダッシュボード", icon: "📊" },
  { href: "/posts/new", label: "新規投稿", icon: "✏️" },
  { href: "/posts", label: "投稿一覧", icon: "📋" },
  { href: "/accounts", label: "監視アカウント", icon: "👥" },
  { href: "/schedule", label: "スケジュール", icon: "📅" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-[var(--color-surface)] border-r border-[var(--color-border)] p-4 flex flex-col">
      <div className="mb-8 px-2">
        <h1 className="text-xl font-bold text-[var(--color-primary)]">
          SmartFlow SNS
        </h1>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          自動投稿ツール
        </p>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-[var(--color-border)] px-2">
        <p className="text-xs text-[var(--color-text-secondary)]">
          SmartFlow v1.0
        </p>
      </div>
    </aside>
  );
}
