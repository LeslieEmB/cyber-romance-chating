import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RainBackdrop } from "@/components/layout/RainBackdrop";
import "./globals.css";

export const metadata: Metadata = {
  title: "赛博之恋",
  description: "暗色像素风 AI 伴侣即时聊天前端"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <RainBackdrop />
        <div className="application-stage">{children}</div>
      </body>
    </html>
  );
}
