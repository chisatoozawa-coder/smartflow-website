import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "SmartFlow SNS - 自動投稿ツール",
  description: "AI駆動のSNS自動投稿管理ツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className="antialiased"
        style={{
          fontFamily:
            "'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif",
        }}
      >
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
