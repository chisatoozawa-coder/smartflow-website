"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewPost() {
  const router = useRouter();
  const [originalText, setOriginalText] = useState("");
  const [rewrittenText, setRewrittenText] = useState("");
  const [style, setStyle] = useState<"informative" | "casual" | "professional">(
    "informative"
  );
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["x", "threads"]);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [charCount, setCharCount] = useState(0);

  // AIリライト
  const handleRewrite = async () => {
    if (!originalText.trim()) return;
    setIsRewriting(true);
    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: originalText, style }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRewrittenText(data.rewrittenText);
      setCharCount(data.rewrittenText.length);
    } catch (error) {
      alert(
        `リライト失敗: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsRewriting(false);
    }
  };

  // Gemini画像生成
  const handleGenerateImage = async () => {
    const text = rewrittenText || originalText;
    if (!text.trim()) return;
    setIsGeneratingImage(true);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postText: text }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setImageUrl(data.imageData);
    } catch (error) {
      alert(
        `画像生成失敗: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // 保存
  const handleSave = async (status: "draft" | "scheduled") => {
    if (!rewrittenText.trim()) {
      alert("投稿テキストを入力してください");
      return;
    }
    if (status === "scheduled" && !scheduledAt) {
      alert("予約日時を設定してください");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalText,
          rewrittenText,
          imageUrl,
          imageSource: imageUrl ? "gemini" : null,
          scheduledAt: status === "scheduled" ? scheduledAt : null,
          platforms,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      router.push("/posts");
    } catch (error) {
      alert(
        `保存失敗: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  // プラットフォーム切り替え
  const togglePlatform = (platform: string) => {
    setPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1">新規投稿作成</h2>
        <p className="text-[var(--color-text-secondary)] text-sm">
          元のテキストからAIでリライト → 画像生成 → 予約投稿
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左カラム: 入力 */}
        <div className="space-y-4">
          {/* 元テキスト入力 */}
          <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)]">
            <label className="block text-sm font-medium mb-2">
              元のテキスト / URL
            </label>
            <textarea
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              placeholder="バズっている投稿のテキストを貼り付け、またはURLを入力..."
              rows={6}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-[var(--color-primary)]"
            />

            <div className="flex items-center gap-3 mt-3">
              <select
                value={style}
                onChange={(e) =>
                  setStyle(
                    e.target.value as "informative" | "casual" | "professional"
                  )
                }
                className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
              >
                <option value="informative">📰 情報発信型</option>
                <option value="casual">💬 カジュアル</option>
                <option value="professional">💼 プロフェッショナル</option>
              </select>

              <button
                onClick={handleRewrite}
                disabled={isRewriting || !originalText.trim()}
                className="flex-1 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:opacity-50 text-[var(--color-bg)] rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                {isRewriting ? "🔄 リライト中..." : "🤖 AIでリライト"}
              </button>
            </div>
          </div>

          {/* リライト結果 */}
          <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)]">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">投稿テキスト</label>
              <span
                className={`text-xs ${charCount > 280 ? "text-red-400" : "text-[var(--color-text-secondary)]"}`}
              >
                {charCount}/280
              </span>
            </div>
            <textarea
              value={rewrittenText}
              onChange={(e) => {
                setRewrittenText(e.target.value);
                setCharCount(e.target.value.length);
              }}
              placeholder="リライトされたテキストがここに表示されます（直接編集も可能）"
              rows={6}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          {/* 画像生成 */}
          <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)]">
            <label className="block text-sm font-medium mb-2">画像</label>
            <button
              onClick={handleGenerateImage}
              disabled={
                isGeneratingImage ||
                (!rewrittenText.trim() && !originalText.trim())
              }
              className="w-full bg-[var(--color-accent)] hover:opacity-90 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-opacity"
            >
              {isGeneratingImage
                ? "🎨 画像生成中..."
                : "🎨 Gemini で画像を生成"}
            </button>
            {imageUrl && (
              <div className="mt-3 relative">
                <img
                  src={imageUrl}
                  alt="Generated"
                  className="w-full rounded-lg"
                />
                <button
                  onClick={() => setImageUrl(null)}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 text-xs"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 右カラム: 設定 & プレビュー */}
        <div className="space-y-4">
          {/* プラットフォーム選択 */}
          <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)]">
            <label className="block text-sm font-medium mb-3">
              投稿先プラットフォーム
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => togglePlatform("x")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  platforms.includes("x")
                    ? "bg-black text-white border-black"
                    : "border-[var(--color-border)] text-[var(--color-text-secondary)]"
                }`}
              >
                X (Twitter)
              </button>
              <button
                onClick={() => togglePlatform("threads")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  platforms.includes("threads")
                    ? "bg-gray-700 text-white border-gray-700"
                    : "border-[var(--color-border)] text-[var(--color-text-secondary)]"
                }`}
              >
                Threads
              </button>
            </div>
          </div>

          {/* 予約日時 */}
          <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)]">
            <label className="block text-sm font-medium mb-2">
              予約投稿日時
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          {/* プレビュー */}
          <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)]">
            <label className="block text-sm font-medium mb-3">
              プレビュー
            </label>
            <div className="bg-[var(--color-bg)] rounded-lg p-4 border border-[var(--color-border)]">
              {rewrittenText ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-[var(--color-primary)] rounded-full flex items-center justify-center text-xs font-bold text-[var(--color-bg)]">
                      SF
                    </div>
                    <div>
                      <p className="text-sm font-medium">SmartFlow</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        @smartflow_ai
                      </p>
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">
                    {rewrittenText}
                  </p>
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="mt-3 rounded-lg w-full"
                    />
                  )}
                </>
              ) : (
                <p className="text-[var(--color-text-secondary)] text-sm text-center py-4">
                  投稿テキストを入力するとプレビューが表示されます
                </p>
              )}
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-3">
            <button
              onClick={() => handleSave("draft")}
              disabled={isSaving || !rewrittenText.trim()}
              className="flex-1 bg-[var(--color-surface-hover)] hover:bg-[var(--color-border)] disabled:opacity-50 rounded-lg px-4 py-3 text-sm font-medium transition-colors"
            >
              下書き保存
            </button>
            <button
              onClick={() => handleSave("scheduled")}
              disabled={isSaving || !rewrittenText.trim() || !scheduledAt}
              className="flex-1 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:opacity-50 text-[var(--color-bg)] rounded-lg px-4 py-3 text-sm font-medium transition-colors"
            >
              {isSaving ? "保存中..." : "📅 予約投稿"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
