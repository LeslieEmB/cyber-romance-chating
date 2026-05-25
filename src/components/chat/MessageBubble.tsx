"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { PixelAvatar } from "@/components/avatar/PixelAvatar";
import { formatChatTime } from "@/lib/runtime";
import type { ChatMessage, Persona } from "@/lib/types";

type MessageBubbleProps = {
  message: ChatMessage;
  persona: Persona;
};

export const MessageBubble = forwardRef<HTMLElement, MessageBubbleProps>(function MessageBubble({
  message,
  persona
}, ref) {
  const isUser = message.role === "user";
  const time = formatChatTime(message.createdAt);

  return (
    <motion.article
      ref={ref}
      className={`message-row ${isUser ? "from-user" : "from-ai"}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
    >
      {!isUser ? <PixelAvatar persona={persona} mini /> : null}
      <div className="message-content">
        <div className="message-meta">
          <span>{isUser ? "你" : persona.name}</span>
          <time>{time}</time>
        </div>
        <div className="message-bubble">{message.content}</div>
      </div>
    </motion.article>
  );
});
