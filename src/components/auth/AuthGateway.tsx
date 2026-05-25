"use client";

import { FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Sparkles, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { PixelSignalTitle } from "@/components/brand/PixelSignalTitle";
import { useAuthStore } from "@/stores/authStore";

type AuthMode = "login" | "register";

function ApproachingCompanion() {
  return (
    <div className="arrival-scene" aria-hidden="true">
      <div className="arrival-horizon" />
      <div className="arrival-path">
        <span />
        <span />
        <span />
      </div>
      <div className="arrival-shadow" />
      <div className="arrival-avatar">
        <span className="walker-glow" />
        <span className="walker-hair" />
        <span className="walker-face" />
        <span className="walker-eye left" />
        <span className="walker-eye right" />
        <span className="walker-mouth" />
        <span className="walker-body" />
        <span className="walker-arm left" />
        <span className="walker-arm right" />
        <span className="walker-leg left" />
        <span className="walker-leg right" />
      </div>
    </div>
  );
}

export function AuthGateway() {
  const router = useRouter();
  const viewer = useAuthStore((state) => state.viewer);
  const ready = useAuthStore((state) => state.ready);
  const pending = useAuthStore((state) => state.pending);
  const error = useAuthStore((state) => state.error);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const register = useAuthStore((state) => state.register);
  const login = useAuthStore((state) => state.login);
  const startGuest = useAuthStore((state) => state.startGuest);
  const signOut = useAuthStore((state) => state.signOut);
  const clearError = useAuthStore((state) => state.clearError);
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [guestOpen, setGuestOpen] = useState(false);
  const [guestNickname, setGuestNickname] = useState("");

  useEffect(() => {
    if (!ready) {
      void restoreSession();
    }
  }, [ready, restoreSession]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      if (mode === "register") {
        await register({ nickname, email, password });
        router.push("/onboarding");
      } else {
        const user = await login({ email, password });
        router.push(user.hasOnboarded ? "/chat" : "/onboarding");
      }
    } catch {
      // The store presents the API error inline.
    }
  }

  function enterGuestPreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (guestNickname.trim().length < 2 || guestNickname.trim().length > 16) {
      return;
    }
    startGuest(guestNickname);
    router.push("/onboarding");
  }

  return (
    <main className="auth-screen scanline-layer">
      <section className="auth-grid">
        <motion.div
          className="auth-cinematic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <span className="brand-chip">
            <Sparkles size={16} />
            CYBER ROMANCE
          </span>
          <div className="auth-promise">
            <span className="eyebrow">PRIVATE ENCOUNTER / 00</span>
            <PixelSignalTitle as="h1" className="auth-wordmark" />
            <p>在灯光熄灭之前，有人正走向你。之后的每句话，都由你们慢慢定义。</p>
          </div>
          <ApproachingCompanion />
          <div className="arrival-caption">
            <span className="status-dot" />
            <span>距离正在缩短</span>
            <strong>02.4 m</strong>
          </div>
        </motion.div>

        <motion.aside
          className="auth-panel"
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.42, delay: 0.16 }}
        >
          <header className="auth-panel-header">
            <span className="eyebrow">{mode === "login" ? "WELCOME BACK" : "NEW ACCOUNT"}</span>
            <h2>{mode === "login" ? "再次见面" : "开始相遇"}</h2>
            <p>{mode === "login" ? "登录后继续你们的对话。" : "注册账号，保留昵称与你设定的聊天对象。"}</p>
          </header>

          {ready && viewer.mode === "member" ? (
            <div className="signed-in-resume">
              <span className="eyebrow">ACTIVE PROFILE</span>
              <strong>{viewer.user.nickname}</strong>
              <p>你已经登录，可以继续上次设定的人物。</p>
              <button
                className="primary-action"
                onClick={() => router.push(viewer.user.hasOnboarded ? "/chat" : "/onboarding")}
                type="button"
              >
                继续进入
                <ArrowRight size={18} />
              </button>
              <button
                className="secondary-action"
                onClick={() => {
                  void signOut();
                }}
                type="button"
              >
                切换账号
              </button>
            </div>
          ) : (
            <>
          <div className="auth-mode-switch" role="tablist" aria-label="账号方式">
            {(["login", "register"] as AuthMode[]).map((item) => (
              <button
                aria-selected={mode === item}
                className={mode === item ? "is-selected" : ""}
                key={item}
                onClick={() => {
                  setMode(item);
                  clearError();
                }}
                role="tab"
                type="button"
              >
                {item === "login" ? "登录" : "注册"}
                {mode === item ? <motion.span className="auth-mode-glow" layoutId="auth-mode" /> : null}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              className="auth-form"
              key={mode}
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              {mode === "register" ? (
                <label className="auth-field">
                  <span>昵称</span>
                  <div>
                    <UserRound size={17} />
                    <input
                      autoComplete="nickname"
                      maxLength={16}
                      minLength={2}
                      onChange={(event) => setNickname(event.target.value)}
                      placeholder="登录后显示的名字"
                      required
                      value={nickname}
                    />
                  </div>
                </label>
              ) : null}
              <label className="auth-field">
                <span>邮箱</span>
                <div>
                  <Mail size={17} />
                  <input
                    autoComplete="email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                    type="email"
                    value={email}
                  />
                </div>
              </label>
              <label className="auth-field">
                <span>密码</span>
                <div>
                  <LockKeyhole size={17} />
                  <input
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    minLength={6}
                    placeholder="至少 6 位"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type={showPassword ? "text" : "password"}
                  />
                  <button
                    className="password-toggle"
                    onClick={() => setShowPassword((visible) => !visible)}
                    title={showPassword ? "隐藏密码" : "显示密码"}
                    type="button"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>

              <label className="auth-consent">
                <input required={mode === "register"} type="checkbox" />
                <span>{mode === "login" ? "在此设备记住我" : "我同意服务条款与隐私政策"}</span>
              </label>

              <button className="primary-action auth-submit" disabled={pending} type="submit">
                {pending ? "正在连接..." : mode === "login" ? "进入聊天" : "创建账号并初始化"}
                <ArrowRight size={18} />
              </button>
              {error ? <p className="auth-error">{error}</p> : null}
            </motion.form>
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {guestOpen ? (
              <motion.form
                className="guest-entry"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={enterGuestPreview}
              >
                <label className="auth-field">
                  <span>访客昵称</span>
                  <div>
                    <UserRound size={17} />
                    <input
                      maxLength={16}
                      minLength={2}
                      onChange={(event) => setGuestNickname(event.target.value)}
                      placeholder="仅用于本次体验"
                      required
                      value={guestNickname}
                    />
                  </div>
                </label>
                <p>访客仅可体验初始化与聊天，不会保存人物或记忆。</p>
                <button className="secondary-action" type="submit">
                  开始临时体验
                </button>
              </motion.form>
            ) : (
              <button className="auth-demo" onClick={() => setGuestOpen(true)} type="button">
                先以访客身份预览
              </button>
            )}
          </AnimatePresence>
            </>
          )}
        </motion.aside>
      </section>
    </main>
  );
}
