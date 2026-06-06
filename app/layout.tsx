import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "2026 世界杯 AI+玄学数据平台 | 美加墨世界杯",
  description:
    "2026 FIFA 世界杯美加墨，全球顶级 AI 对冲模型与玄学运势分析，即时对冲精算，12 小组全覆盖赛况预测。",
  keywords: "世界杯2026,美加墨,AI预测,对冲,玄学,足球",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
