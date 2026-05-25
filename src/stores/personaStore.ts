"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { defaultPersona, defaultSettings, initialMemories, initialMessages } from "@/lib/defaults";
import { humanizePersona } from "@/lib/personaOptions";
import { createClientId, nowIso } from "@/lib/runtime";
import type { AppSettings, ChatMessage, Memory, Persona } from "@/lib/types";

type CyberRomanceState = {
  persona: Persona;
  messages: ChatMessage[];
  memories: Memory[];
  settings: AppSettings;
  hasOnboarded: boolean;
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

export const usePersonaStore = create<CyberRomanceState>()(
  persist(
    (set) => ({
      persona: defaultPersona,
      messages: initialMessages,
      memories: initialMemories,
      settings: defaultSettings,
      hasOnboarded: false,
      updatePersona: (persona) =>
        set((state) => ({
          persona: {
            ...state.persona,
            ...persona,
            avatar: persona.avatar ?? state.persona.avatar
          }
        })),
      setAvatar: (avatar) =>
        set((state) => ({
          persona: {
            ...state.persona,
            avatar
          }
        })),
      completeOnboarding: (persona) =>
        set({
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
        }),
      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message]
        })),
      addMemory: (memory) =>
        set((state) => ({
          memories: [
            memory,
            ...state.memories.filter(
              (item) => item.content.trim().toLowerCase() !== memory.content.trim().toLowerCase()
            )
          ].slice(0, 30)
        })),
      updateMemory: (id, memoryUpdate) =>
        set((state) => ({
          memories: state.memories.map((memory) =>
            memory.id === id
              ? {
                  ...memory,
                  ...memoryUpdate,
                  updatedAt: nowIso()
                }
              : memory
          )
        })),
      removeMemory: (id) =>
        set((state) => ({
          memories: state.memories.filter((memory) => memory.id !== id)
        })),
      updateSettings: (settings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...settings
          }
        })),
      clearChat: () => set({ messages: initialMessages }),
      resetAll: () =>
        set({
          persona: defaultPersona,
          messages: initialMessages,
          memories: initialMemories,
          settings: defaultSettings,
          hasOnboarded: false
        })
    }),
    {
      name: "cyber-romance-state",
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as CyberRomanceState;

        return {
          ...state,
          persona: humanizePersona(state.persona ?? defaultPersona)
        };
      }
    }
  )
);
