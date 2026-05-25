"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, MessageCircle, Settings, Sparkles, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { usePersonaStore } from "@/stores/personaStore";

const navItems = [
  { href: "/chat", label: "聊天", icon: MessageCircle },
  { href: "/persona", label: "人格", icon: UserRound },
  { href: "/memory", label: "记忆", icon: Brain },
  { href: "/settings", label: "设置", icon: Settings }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const persona = usePersonaStore((state) => state.persona);

  return (
    <div className="app-shell scanline-layer">
      <aside className="sidebar-shell">
        <Link href="/" className="brand-lockup" aria-label="赛博恋爱首页">
          <span className="brand-mark">
            <Sparkles size={18} />
          </span>
          <span>
            <span className="brand-title">赛博恋爱</span>
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
                className={`nav-link ${active ? "is-active" : ""}`}
                title={item.label}
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
            <strong>{persona.name}</strong>
            <span>{persona.visualVibe}</span>
          </div>
        </div>
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
              className={`mobile-nav-link ${active ? "is-active" : ""}`}
              title={item.label}
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
