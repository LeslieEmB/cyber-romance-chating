"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Eraser, Send, Signal, Sparkles } from "lucide-react";
import { PixelAvatar } from "@/components/avatar/PixelAvatar";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { memoryTypeMeta, normalizeMemoryType } from "@/lib/memory/meta";
import { createClientId, nowIso } from "@/lib/runtime";
import type { ChatMessage, Memory } from "@/lib/types";
import { usePersonaStore } from "@/stores/personaStore";

const quickPrompts = ["今天有点累", "讲讲你记得的我", "陪我安静一会儿", "夸夸我吧"];

type ChatApiResponse = {
  reply?: string;
  memory?: Memory | null;
  provider?: "deepseek" | "local" | "local-fallback";
  error?: string;
};

export function ChatWindow() {
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [backendState, setBackendState] = useState("LOCAL API");
  const endRef = useRef<HTMLDivElement | null>(null);
  const thinkingRef = useRef<HTMLDivElement | null>(null);
  const latestAssistantRef = useRef<HTMLElement | null>(null);
  const persona = usePersonaStore((state) => state.persona);
  const messages = usePersonaStore((state) => state.messages);
  const memories = usePersonaStore((state) => state.memories);
  const settings = usePersonaStore((state) => state.settings);
  const addMessage = usePersonaStore((state) => state.addMessage);
  const addMemory = usePersonaStore((state) => state.addMemory);
  const clearChat = usePersonaStore((state) => state.clearChat);
  const latestAssistantId = [...messages].reverse().find((message) => message.role === "assistant")?.id;

  useEffect(() => {
    const target = typing ? thinkingRef.current : latestAssistantRef.current ?? endRef.current;
    const block = typing ? "center" : latestAssistantRef.current ? "center" : "end";

    function alignView() {
      target?.scrollIntoView({
        behavior: "smooth",
        block
      });
    }

    const firstFrame = window.requestAnimationFrame(() => {
      alignView();
      window.requestAnimationFrame(alignView);
    });
    const settleTimer = window.setTimeout(alignView, 220);

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.clearTimeout(settleTimer);
    };
  }, [messages.length, typing, latestAssistantId]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || typing) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createClientId("user"),
      role: "user",
      content,
      createdAt: nowIso()
    };

    addMessage(userMessage);
    setInput("");
    setTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: content,
          persona,
          messages: messages.slice(-10),
          memories,
          settings
        })
      });
      const payload = (await response.json()) as ChatApiResponse;

      if (!response.ok || !payload.reply) {
        throw new Error(payload.error || "聊天接口暂时没有返回内容。");
      }

      if (payload.memory) {
        addMemory(payload.memory);
      }

      setBackendState(
        payload.provider === "deepseek"
          ? "DEEPSEEK"
          : payload.provider === "local-fallback"
            ? "LOCAL FALLBACK"
            : "LOCAL API"
      );

      addMessage({
        id: createClientId("assistant"),
        role: "assistant",
        content: payload.reply,
        createdAt: nowIso()
      });
    } catch (error) {
      setBackendState("API ERROR");
      addMessage({
        id: createClientId("assistant"),
        role: "assistant",
        content:
          error instanceof Error
            ? `信号有点抖：${error.message}`
            : "信号有点抖，后端接口暂时没有接稳。",
        createdAt: nowIso()
      });
    } finally {
      setTyping(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(input);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();
    void send(input);
  }

  return (
    <section className="chat-layout">
      <aside className="companion-panel">
        <PixelAvatar persona={persona} />
        <div className="signal-strip">
          <span>
            <Signal size={15} />
            LINK STABLE
          </span>
          <span>{backendState}</span>
        </div>
        <div className="memory-hints">
          <div className="panel-label">
            <Sparkles size={15} />
            长期记忆
          </div>
          {[...memories]
            .sort((a, b) => b.importance - a.importance)
            .slice(0, 4)
            .map((memory) => {
              const memoryType = normalizeMemoryType(memory.type);

              return (
                <article className="memory-hint-card" key={memory.id}>
                  <span>
                    {memoryTypeMeta[memoryType].label} / {memory.importance >= 4 ? "强影响" : "轻影响"}
                  </span>
                  <p>{memory.content}</p>
                </article>
              );
            })}
        </div>
      </aside>

      <div className="chat-panel">
        <header className="chat-header">
          <div>
            <span className="eyebrow">PRIVATE CHANNEL / LIVE</span>
            <h1>{persona.name}</h1>
          </div>
          <div className="channel-tools">
            <div className="channel-state">
              <span className="status-dot" />
              <span>{persona.tone}</span>
              <strong>{backendState}</strong>
            </div>
            <button className="icon-button danger" type="button" onClick={clearChat} title="清空聊天">
              <Eraser size={18} />
            </button>
          </div>
        </header>

        <div className="message-stream" aria-live="polite">
          {messages.map((message) => {
            const isLatestAssistant = message.role === "assistant" && message.id === latestAssistantId;

            return (
              <MessageBubble
                key={message.id}
                ref={isLatestAssistant ? latestAssistantRef : undefined}
                message={message}
                persona={persona}
              />
            );
          })}
          {typing ? (
            <motion.div
              ref={thinkingRef}
              className="message-row from-ai thinking-row"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <PixelAvatar persona={persona} mini />
              <div className="message-content">
                <div className="message-meta">
                  <span>{persona.name}</span>
                  <span>正在思考</span>
                </div>
                <div className="thinking-bubble">
                  <span className="thinking-scan" />
                  <span className="thinking-copy">正在想怎么回复你</span>
                  <span className="thinking-dots">
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
              </div>
            </motion.div>
          ) : null}
          <div ref={endRef} />
        </div>

        <div className="quick-row">
          {quickPrompts.map((prompt) => (
            <button key={prompt} type="button" onClick={() => void send(prompt)}>
              {prompt}
            </button>
          ))}
        </div>

        <form className="composer" onSubmit={handleSubmit}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            placeholder="输入讯息..."
            rows={1}
          />
          <button className="send-button" type="submit" title="发送" disabled={typing}>
            <Send size={19} />
          </button>
        </form>
      </div>
    </section>
  );
}
