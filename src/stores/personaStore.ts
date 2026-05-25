"use client";

import { create } from "zustand";
import { defaultPersona, defaultSettings, initialMemories, initialMessages } from "@/lib/defaults";
import { humanizePersona } from "@/lib/personaOptions";
import { createClientId, nowIso } from "@/lib/runtime";
import type { AppSettings, ChatMessage, Memory, Persona } from "@/lib/types";

type ExperienceSnapshot = {
  persona: Persona;
  messages: ChatMessage[];
  memories: Memory[];
  settings: AppSettings;
  hasOnboarded: boolean;
};

type ActivateScopeOptions = {
  scope: string;
  persona?: Persona | null;
  hasOnboarded?: boolean;
  ephemeral?: boolean;
};

type CyberRomanceState = ExperienceSnapshot & {
  scope: string | null;
  ephemeral: boolean;
  activateScope: (options: ActivateScopeOptions) => void;
  clearScope: () => void;
  updatePersona: (persona: Partial<Persona>) => void;
  setAvatar: (avatar: Persona["avatar"]) => void;
  completeOnboarding: (persona: Persona) => void;
  addMessage: (message: ChatMessage) => void;
  addMemory: (memory: Memory) => void;
  updateMemory: (id: string, memory: Partial<Omit<Memory, "id" | "updatedAt">>) => void;
  removeMemory: (id: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  clearChat: () => void;
  resetAll: () => void;
};

const storagePrefix = "cyber-romance-member:";

function initialSnapshot(): ExperienceSnapshot {
  return {
    persona: defaultPersona,
    messages: initialMessages,
    memories: initialMemories,
    settings: defaultSettings,
    hasOnboarded: false
  };
}

function storageKey(scope: string) {
  return `${storagePrefix}${scope}`;
}

function readStoredSnapshot(scope: string): ExperienceSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(storageKey(scope));
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as Partial<ExperienceSnapshot>;
    return {
      ...initialSnapshot(),
      ...parsed,
      persona: humanizePersona(parsed.persona ?? defaultPersona)
    };
  } catch {
    return null;
  }
}

function saveStoredSnapshot(state: CyberRomanceState) {
  if (typeof window === "undefined" || state.ephemeral || !state.scope) {
    return;
  }

  const snapshot: ExperienceSnapshot = {
    persona: state.persona,
    messages: state.messages,
    memories: state.memories,
    settings: state.settings,
    hasOnboarded: state.hasOnboarded
  };

  window.localStorage.setItem(storageKey(state.scope), JSON.stringify(snapshot));
}

function updatedState(state: CyberRomanceState, update: Partial<ExperienceSnapshot>) {
  const next = { ...state, ...update };
  saveStoredSnapshot(next);
  return update;
}

export const usePersonaStore = create<CyberRomanceState>()((set) => ({
  ...initialSnapshot(),
  scope: null,
  ephemeral: true,
  activateScope: ({ scope, persona, hasOnboarded, ephemeral = false }) =>
    set(() => {
      const stored = ephemeral ? null : readStoredSnapshot(scope);
      const next = {
        ...(stored ?? initialSnapshot()),
        scope,
        ephemeral,
        persona: persona ? humanizePersona(persona) : stored?.persona ?? defaultPersona,
        hasOnboarded: hasOnboarded ?? stored?.hasOnboarded ?? false
      };
      saveStoredSnapshot(next as CyberRomanceState);
      return next;
    }),
  clearScope: () => set({ ...initialSnapshot(), scope: null, ephemeral: true }),
  updatePersona: (persona) =>
    set((state) =>
      updatedState(state, {
        persona: {
          ...state.persona,
          ...persona,
          avatar: persona.avatar ?? state.persona.avatar
        }
      })
    ),
  setAvatar: (avatar) =>
    set((state) =>
      updatedState(state, {
        persona: {
          ...state.persona,
          avatar
        }
      })
    ),
  completeOnboarding: (persona) =>
    set((state) =>
      updatedState(state, {
        persona,
        hasOnboarded: true,
        messages: [
          {
            id: createClientId("hello"),
            role: "assistant",
            content: `嗨，我是 ${persona.name}。很高兴认识你，今天想从什么聊起？`,
            createdAt: nowIso()
          }
        ]
      })
    ),
  addMessage: (message) =>
    set((state) => updatedState(state, { messages: [...state.messages, message] })),
  addMemory: (memory) =>
    set((state) =>
      updatedState(state, {
        memories: [
          memory,
          ...state.memories.filter(
            (item) => item.content.trim().toLowerCase() !== memory.content.trim().toLowerCase()
          )
        ].slice(0, 30)
      })
    ),
  updateMemory: (id, memoryUpdate) =>
    set((state) =>
      updatedState(state, {
        memories: state.memories.map((memory) =>
          memory.id === id ? { ...memory, ...memoryUpdate, updatedAt: nowIso() } : memory
        )
      })
    ),
  removeMemory: (id) =>
    set((state) => updatedState(state, { memories: state.memories.filter((memory) => memory.id !== id) })),
  updateSettings: (settings) =>
    set((state) => updatedState(state, { settings: { ...state.settings, ...settings } })),
  clearChat: () => set((state) => updatedState(state, { messages: initialMessages })),
  resetAll: () => set((state) => updatedState(state, initialSnapshot()))
}));
