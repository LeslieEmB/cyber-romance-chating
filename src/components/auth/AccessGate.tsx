"use client";

import { useEffect, type ReactNode } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

type AccessGateProps = {
  children: ReactNode;
  memberOnly?: boolean;
};

export function AccessGate({ children, memberOnly = false }: AccessGateProps) {
  const router = useRouter();
  const viewer = useAuthStore((state) => state.viewer);
  const ready = useAuthStore((state) => state.ready);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const signOut = useAuthStore((state) => state.signOut);

  useEffect(() => {
    if (!ready) {
      void restoreSession();
    }
  }, [ready, restoreSession]);

  useEffect(() => {
    if (ready && viewer.mode === "anonymous") {
      router.replace("/");
    }
  }, [ready, router, viewer.mode]);

  if (!ready || viewer.mode === "anonymous") {
    return (
      <main className="gate-loading scanline-layer">
        <span className="eyebrow">IDENTITY CHECK</span>
        <p>正在确认你的身份...</p>
      </main>
    );
  }

  if (memberOnly && viewer.mode === "guest") {
    return (
      <main className="restricted-screen scanline-layer">
        <section className="restricted-panel">
          <LockKeyhole size={28} />
          <span className="eyebrow">MEMBER ACCESS</span>
          <h1>访客体验暂不开放此区域</h1>
          <p>聊天可以继续体验。注册账号后，你才能保存人格设定，并使用记忆与设置中心。</p>
          <button className="primary-action" onClick={() => router.push("/chat")} type="button">
            返回聊天
            <ArrowRight size={18} />
          </button>
          <button
            className="secondary-action"
            onClick={() => {
              void signOut().then(() => router.push("/"));
            }}
            type="button"
          >
            注册账号
          </button>
        </section>
      </main>
    );
  }

  return children;
}
