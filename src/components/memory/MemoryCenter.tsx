"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Brain,
  Fingerprint,
  Plus,
  RadioTower,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { memoryTypeMeta, memoryTypeOptions, normalizeMemoryType } from "@/lib/memory/meta";
import { createClientId, formatShortDate, nowIso } from "@/lib/runtime";
import type { MemoryType } from "@/lib/types";
import { usePersonaStore } from "@/stores/personaStore";

const quickDrafts = [
  {
    type: "preference",
    content: "我低落时先陪我安静待一会儿，不要急着讲道理。"
  },
  {
    type: "boundary",
    content: "不要用过度暧昧的语气。"
  },
  {
    type: "summary",
    content: "我这周在准备作品集，压力有点大。"
  },
  {
    type: "fact",
    content: "我叫 Leslie，现在在上海做产品设计。"
  }
] satisfies Array<{ type: MemoryType; content: string }>;

const memoryTypeIcons: Record<MemoryType, LucideIcon> = {
  preference: Sparkles,
  boundary: ShieldCheck,
  summary: RadioTower,
  fact: Fingerprint
};

function importanceLabel(value: number) {
  if (value >= 5) {
    return "强影响";
  }
  if (value >= 4) {
    return "常用";
  }
  if (value >= 3) {
    return "普通";
  }
  return "轻量";
}

export function MemoryCenter() {
  const [content, setContent] = useState("");
  const [type, setType] = useState<MemoryType>("preference");
  const [importance, setImportance] = useState(4);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MemoryType | "all">("all");
  const memories = usePersonaStore((state) => state.memories);
  const addMemory = usePersonaStore((state) => state.addMemory);
  const updateMemory = usePersonaStore((state) => state.updateMemory);
  const removeMemory = usePersonaStore((state) => state.removeMemory);
  const selectedTypeMeta = memoryTypeMeta[type];
  const visibleMemories = useMemo(
    () =>
      memories.map((memory) => ({
        ...memory,
        type: normalizeMemoryType(memory.type)
      })),
    [memories]
  );
  const filteredMemories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return visibleMemories
      .filter((memory) => filter === "all" || memory.type === filter)
      .filter((memory) => !normalizedQuery || memory.content.toLowerCase().includes(normalizedQuery))
      .sort((a, b) => b.importance - a.importance);
  }, [filter, query, visibleMemories]);
  const strongMemoryCount = visibleMemories.filter((memory) => memory.importance >= 4).length;
  const memoryCounts = useMemo(
    () =>
      memoryTypeOptions.reduce(
        (counts, item) => ({
          ...counts,
          [item.value]: visibleMemories.filter((memory) => memory.type === item.value).length
        }),
        {} as Record<MemoryType, number>
      ),
    [visibleMemories]
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) {
      return;
    }

    addMemory({
      id: createClientId("manual"),
      type,
      content: trimmed,
      importance: type === "boundary" ? 5 : importance,
      source: "manual_edit",
      updatedAt: nowIso()
    });
    setContent("");
  }

  function applyDraft(draft: (typeof quickDrafts)[number]) {
    setType(draft.type);
    setContent(draft.content);
    setImportance(memoryTypeMeta[draft.type].defaultImportance);
  }

  function chooseType(nextType: MemoryType) {
    setType(nextType);
    setImportance(memoryTypeMeta[nextType].defaultImportance);
  }

  return (
    <section className="workspace-grid memory-workspace">
      <div className="workspace-main">
        <header className="workspace-header">
          <div>
            <span className="eyebrow">MEMORY CENTER</span>
            <h1>记忆中心</h1>
          </div>
          <span className="save-state">
            <Brain size={16} />
            {memories.length} 条
          </span>
        </header>

        <div className="memory-quickbar" aria-label="选择记忆类型">
          {memoryTypeOptions.map((item) => {
            const TypeIcon = memoryTypeIcons[item.value];

            return (
              <button
                className={`memory-type-choice ${type === item.value ? "is-active" : ""}`}
                key={item.value}
                type="button"
                onClick={() => chooseType(item.value)}
              >
                <TypeIcon size={16} />
                <span>{item.label}</span>
                <small>{memoryCounts[item.value]}</small>
              </button>
            );
          })}
        </div>

        <form className="memory-composer memory-composer-primary" onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={`添加${selectedTypeMeta.label}：${selectedTypeMeta.example}`}
            rows={3}
          />
          <div className="memory-composer-actions">
            <span className={`memory-type type-${type}`}>{selectedTypeMeta.label}</span>
            <p>{selectedTypeMeta.hint}</p>
            <label className="memory-importance-compact">
              <span>{importanceLabel(type === "boundary" ? 5 : importance)}</span>
              <input
                type="range"
                min="1"
                max="5"
                value={type === "boundary" ? 5 : importance}
                disabled={type === "boundary"}
                onChange={(event) => setImportance(Number(event.target.value))}
              />
            </label>
            <button className="primary-action compact" type="submit">
              <Plus size={17} />
              添加记忆
            </button>
          </div>
        </form>

        <div className="memory-tools">
          <div className="memory-search">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索记忆" />
          </div>
          <div className="memory-filter-tabs">
            <button className={filter === "all" ? "is-selected" : ""} type="button" onClick={() => setFilter("all")}>
              全部
            </button>
            {memoryTypeOptions.map((item) => (
              <button
                key={item.value}
                className={filter === item.value ? "is-selected" : ""}
                type="button"
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="memory-list">
          {filteredMemories.map((memory) => (
            <article className="memory-card" key={memory.id}>
              <div className="memory-card-head">
                <span className={`memory-type type-${memory.type}`}>
                  {memoryTypeMeta[memory.type].label}
                </span>
                <span className="memory-score">重要度 {memory.importance}/5</span>
                <button className="icon-button danger" type="button" onClick={() => removeMemory(memory.id)} title="删除">
                  <Trash2 size={17} />
                </button>
              </div>
              <div className="memory-card-controls">
                <select
                  value={memory.type}
                  onChange={(event) => updateMemory(memory.id, { type: event.target.value as MemoryType })}
                >
                  {memoryTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <label>
                  <span>{importanceLabel(memory.importance)}</span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={memory.importance}
                    onChange={(event) => updateMemory(memory.id, { importance: Number(event.target.value) })}
                  />
                </label>
              </div>
              <textarea
                value={memory.content}
                onChange={(event) => updateMemory(memory.id, { content: event.target.value })}
                rows={3}
              />
              <div className="memory-meta">
                <span>{memoryTypeMeta[memory.type].hint}</span>
                <span>{formatShortDate(memory.updatedAt)}</span>
              </div>
            </article>
          ))}
          {filteredMemories.length === 0 ? (
            <div className="empty-memory-state">
              <Brain size={28} />
              <span>没有匹配的记忆</span>
            </div>
          ) : null}
        </div>
      </div>

      <aside className="workspace-side">
        <div className="side-readout memory-coach">
          <span className="eyebrow">QUICK DRAFT</span>
          <h2>常用写法</h2>
          {quickDrafts.map((draft) => (
            <button key={draft.content} type="button" onClick={() => applyDraft(draft)}>
              <span className={`memory-type type-${draft.type}`}>{memoryTypeMeta[draft.type].label}</span>
              {draft.content}
            </button>
          ))}
        </div>
        <div className="side-readout memory-stats">
          <span className="eyebrow">MEMORY SIGNAL</span>
          <h2>{strongMemoryCount} 条强影响</h2>
          <p>DeepSeek 会优先读取边界和高重要度记忆。其他记忆只在相关话题里参与回复。</p>
          <div className="memory-stat-line">
            <SlidersHorizontal size={15} />
            当前共有 {visibleMemories.length} 条记忆
          </div>
        </div>
      </aside>
    </section>
  );
}
