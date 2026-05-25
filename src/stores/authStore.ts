"use client";

import { create } from "zustand";
import { createClientId } from "@/lib/runtime";
import type { Persona, PublicAuthUser, Viewer } from "@/lib/types";
import { usePersonaStore } from "@/stores/personaStore";

type AuthResponse = {
  user?: PublicAuthUser | null;
  error?: string;
};

type AuthState = {
  viewer: Viewer;
  ready: boolean;
  pending: boolean;
  error: string | null;
  restoreSession: () => Promise<void>;
  register: (input: { nickname: string; email: string; password: string }) => Promise<PublicAuthUser>;
  login: (input: { email: string; password: string }) => Promise<PublicAuthUser>;
  startGuest: (nickname: string) => void;
  savePersona: (persona: Persona) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

function activateMember(user: PublicAuthUser) {
  usePersonaStore.getState().activateScope({
    scope: `member:${user.id}`,
    persona: user.persona,
    hasOnboarded: user.hasOnboarded
  });
}

async function authRequest(url: string, body?: unknown) {
  const response = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = (await response.json()) as AuthResponse;

  if (!response.ok || !payload.user) {
    throw new Error(payload.error || "身份验证暂时不可用。");
  }

  return payload.user;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  viewer: { mode: "anonymous" },
  ready: false,
  pending: false,
  error: null,
  restoreSession: async () => {
    if (get().viewer.mode === "guest") {
      set({ ready: true });
      return;
    }

    try {
      const response = await fetch("/api/auth/session");
      const payload = (await response.json()) as AuthResponse;
      if (payload.user) {
        activateMember(payload.user);
        set({ viewer: { mode: "member", user: payload.user }, ready: true, error: null });
      } else {
        usePersonaStore.getState().clearScope();
        set({ viewer: { mode: "anonymous" }, ready: true, error: null });
      }
    } catch {
      set({ ready: true, error: "暂时无法恢复登录状态。" });
    }
  },
  register: async (input) => {
    set({ pending: true, error: null });
    try {
      const user = await authRequest("/api/auth/register", input);
      activateMember(user);
      set({ viewer: { mode: "member", user }, ready: true, pending: false });
      return user;
    } catch (error) {
      const message = error instanceof Error ? error.message : "注册失败，请稍后重试。";
      set({ pending: false, error: message });
      throw error;
    }
  },
  login: async (input) => {
    set({ pending: true, error: null });
    try {
      const user = await authRequest("/api/auth/login", input);
      activateMember(user);
      set({ viewer: { mode: "member", user }, ready: true, pending: false });
      return user;
    } catch (error) {
      const message = error instanceof Error ? error.message : "登录失败，请稍后重试。";
      set({ pending: false, error: message });
      throw error;
    }
  },
  startGuest: (nickname) => {
    const normalizedNickname = nickname.trim();
    if (normalizedNickname.length < 2 || normalizedNickname.length > 16) {
      set({ error: "临时昵称需要为 2 至 16 个字符。" });
      return;
    }

    const id = createClientId("guest");
    usePersonaStore.getState().activateScope({ scope: `guest:${id}`, ephemeral: true });
    set({ viewer: { mode: "guest", id, nickname: normalizedNickname }, ready: true, error: null });
  },
  savePersona: async (persona) => {
    const viewer = get().viewer;
    if (viewer.mode !== "member") {
      return;
    }

    const response = await fetch("/api/account/persona", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ persona })
    });
    const payload = (await response.json()) as AuthResponse;
    if (!response.ok || !payload.user) {
      throw new Error(payload.error || "暂时无法保存人物设定。");
    }

    set({ viewer: { mode: "member", user: payload.user } });
  },
  signOut: async () => {
    if (get().viewer.mode === "member") {
      await fetch("/api/auth/logout", { method: "POST" });
    }
    usePersonaStore.getState().clearScope();
    set({ viewer: { mode: "anonymous" }, ready: true, error: null });
  },
  clearError: () => set({ error: null })
}));
