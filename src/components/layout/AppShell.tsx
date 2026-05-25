"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, LogOut, MessageCircle, Settings, Sparkles, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { PixelSignalTitle } from "@/components/brand/PixelSignalTitle";
import { useAuthStore } from "@/stores/authStore";
import { usePersonaStore } from "@/stores/personaStore";

const navItems = [
  { href: "/chat", label: "聊天", icon: MessageCircle },
  { href: "/persona", label: "人格", icon: UserRound },
  { href: "/memory", label: "记忆", icon: Brain },
  { href: "/settings", label: "设置", icon: Settings }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const persona = usePersonaStore((state) => state.persona);
  const viewer = useAuthStore((state) => state.viewer);
  const signOut = useAuthStore((state) => state.signOut);
  const nickname = viewer.mode === "member" ? viewer.user.nickname : viewer.mode === "guest" ? viewer.nickname : "";
  const visitor = viewer.mode === "guest";

  return (
    <div className="app-shell scanline-layer">
      <aside className="sidebar-shell">
        <Link href="/" className="brand-lockup" aria-label="赛博之恋首页">
          <span className="brand-mark">
            <Sparkles size={18} />
          </span>
          <span>
            <PixelSignalTitle className="brand-title" compact />
            <span className="brand-subtitle">CYBER ROMANCE</span>
          </span>
        </Link>

        <nav className="side-nav" aria-label="主导航">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${active ? "is-active" : ""} ${visitor && item.href !== "/chat" ? "is-locked" : ""}`}
                title={visitor && item.href !== "/chat" ? `${item.label}需要注册后使用` : item.label}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-status">
          <span className="status-dot" />
          <div>
            <strong>{nickname || persona.name}</strong>
            <span>{visitor ? "访客体验 / 临时" : persona.visualVibe}</span>
          </div>
        </div>
        <button
          className="session-exit"
          onClick={() => {
            void signOut().then(() => router.push("/"));
          }}
          type="button"
        >
          <LogOut size={16} />
          {visitor ? "结束体验" : "退出登录"}
        </button>
      </aside>

      <main className="app-main">{children}</main>

      <nav className="mobile-nav" aria-label="移动端导航">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-link ${active ? "is-active" : ""} ${visitor && item.href !== "/chat" ? "is-locked" : ""}`}
              title={visitor && item.href !== "/chat" ? `${item.label}需要注册后使用` : item.label}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
