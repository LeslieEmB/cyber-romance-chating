"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, PencilLine, Sparkles } from "lucide-react";
import { AppearanceControls } from "@/components/avatar/AppearanceControls";
import { PixelAvatar } from "@/components/avatar/PixelAvatar";
import { createAvatarConfig } from "@/lib/avatar";
import { defaultPersona } from "@/lib/defaults";
import {
  backgroundOptions,
  boundaryOptions,
  genderOptions,
  isCustomBackground,
  joinChoices,
  personalityOptions,
  relationshipOptions,
  speechStyleOptions,
  splitChoices,
  toggleChoice,
  toneOptions,
  visualVibeOptions
} from "@/lib/personaOptions";
import type { AvatarConfig, GenderExpression, Persona } from "@/lib/types";
import { useAuthStore } from "@/stores/authStore";
import { usePersonaStore } from "@/stores/personaStore";

export function PersonaForm() {
  const router = useRouter();
  const completeOnboarding = usePersonaStore((state) => state.completeOnboarding);
  const viewer = useAuthStore((state) => state.viewer);
  const savePersona = useAuthStore((state) => state.savePersona);
  const [draft, setDraft] = useState<Persona>(defaultPersona);
  const [customBackground, setCustomBackground] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  const previewPersona = draft;

  function updateDraft(value: Partial<Persona>) {
    setDraft((current) => ({ ...current, ...value }));
  }

  function chooseGender(gender: GenderExpression) {
    setDraft((current) => ({
      ...current,
      gender,
      avatar: gender === "custom" ? current.avatar : createAvatarConfig(current.name || "NOVA", gender)
    }));
  }

  function updateAvatar(value: Partial<AvatarConfig>) {
    setDraft((current) => ({
      ...current,
      gender: "custom",
      avatar: { ...current.avatar, ...value }
    }));
  }

  function togglePersonality(choice: string) {
    setDraft((current) => ({
      ...current,
      personality: joinChoices(toggleChoice(splitChoices(current.personality), choice))
    }));
  }

  function toggleSpeechStyle(choice: string) {
    setDraft((current) => ({
      ...current,
      speechStyle: joinChoices(toggleChoice(splitChoices(current.speechStyle), choice))
    }));
  }

  function toggleBoundary(boundary: string) {
    setDraft((current) => {
      const exists = current.boundaries.includes(boundary);
      return {
        ...current,
        boundaries: exists
          ? current.boundaries.filter((item) => item !== boundary)
          : [...current.boundaries, boundary]
      };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSubmitError("");

    try {
      await savePersona(previewPersona);
      completeOnboarding(previewPersona);
      router.push("/chat");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "暂时无法保存人物设定。");
      setSaving(false);
    }
  }

  return (
    <main className="onboarding-screen initialization-screen scanline-layer">
      <motion.section
        className="onboarding-grid initialization-grid"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="onboarding-copy">
          <span className="brand-chip">
            <Sparkles size={16} />
            {viewer.mode === "guest" ? "GUEST PREVIEW / TEMP" : "INITIALIZATION / 01"}
          </span>
          <div className="initialization-copy">
            <span className="eyebrow">COMPANION SETUP</span>
            <h1>定义初遇</h1>
            <p>为这位刚刚来到你面前的人选择名字、气质和相处方式。外观属于界面，回应会尽量像真实的人。</p>
          </div>
          <PixelAvatar persona={previewPersona} />
          <div className="initialization-progress" aria-label="初始化流程">
            <span className="is-finished">注册</span>
            <span className="is-current">定义人物</span>
            <span>开始聊天</span>
          </div>
        </div>

        <form className="onboarding-form" onSubmit={handleSubmit}>
          <header className="initializer-header">
            <span className="eyebrow">PROFILE CALIBRATION</span>
            <h2>初始化聊天对象</h2>
          </header>
          <label className="field-stack">
            <span>姓名 / 代号</span>
            <input
              value={draft.name}
              onChange={(event) => updateDraft({ name: event.target.value.slice(0, 12) })}
              placeholder="例如：NOVA、绫、夜航"
            />
          </label>

          <div className="field-stack">
            <span>性别表达</span>
            <div className="option-grid gender-choice-grid">
              {genderOptions.map((option) => (
                <button
                  key={option.value}
                  className={draft.gender === option.value ? "is-selected" : ""}
                  type="button"
                  onClick={() => chooseGender(option.value)}
                >
                  <strong>{option.label}</strong>
                  <small>{option.hint}</small>
                </button>
              ))}
            </div>
            <AnimatePresence initial={false}>
              {draft.gender === "custom" ? (
                <motion.p
                  className="gender-mode-note"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                >
                  这个模式只开放外观编辑，不会改动 TA 的对话身份。
                </motion.p>
              ) : null}
            </AnimatePresence>
            <AnimatePresence initial={false}>
              {draft.gender === "custom" ? (
                <motion.div
                  className="freeform-appearance-reveal"
                  initial={{ height: 0, opacity: 0, y: -5 }}
                  animate={{ height: "auto", opacity: 1, y: 0 }}
                  exit={{ height: 0, opacity: 0, y: -5 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <AppearanceControls avatar={draft.avatar} onChange={updateAvatar} note="只调整外观，不改变 TA 的对话身份。" />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="field-stack">
            <span>人格底色</span>
            <div className="chip-grid">
              {personalityOptions.map((option) => (
                <button
                  key={option}
                  className={splitChoices(draft.personality).includes(option) ? "is-selected" : ""}
                  type="button"
                  onClick={() => togglePersonality(option)}
                >
                  <Check size={15} />
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="field-stack">
            <span>关系风格</span>
            <div className="segmented-grid">
              {relationshipOptions.map((option) => (
                <button
                  key={option.value}
                  className={draft.relationshipStyle === option.value ? "is-selected" : ""}
                  type="button"
                  onClick={() => updateDraft({ relationshipStyle: option.value })}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field-stack">
            <span>语气</span>
            <div className="segmented-grid three-cols">
              {toneOptions.map((option) => (
                <button
                  key={option}
                  className={draft.tone === option ? "is-selected" : ""}
                  type="button"
                  onClick={() => updateDraft({ tone: option })}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="field-stack">
            <span>说话方式</span>
            <div className="chip-grid">
              {speechStyleOptions.map((option) => (
                <button
                  key={option}
                  className={splitChoices(draft.speechStyle).includes(option) ? "is-selected" : ""}
                  type="button"
                  onClick={() => toggleSpeechStyle(option)}
                >
                  <Check size={15} />
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="field-stack">
            <span>生活背景</span>
            <div className="segmented-grid single-line">
              {backgroundOptions.map((option) => (
                <button
                  key={option}
                  className={draft.background === option ? "is-selected" : ""}
                  type="button"
                  onClick={() => updateDraft({ background: option })}
                >
                  {option}
                </button>
              ))}
              <button
                className={`custom-background-toggle ${isCustomBackground(draft.background) ? "is-selected" : ""}`}
                type="button"
                onClick={() => updateDraft({ background: customBackground })}
              >
                <PencilLine size={15} />
                自定义背景
              </button>
            </div>
            <AnimatePresence initial={false}>
              {isCustomBackground(draft.background) ? (
                <motion.label
                  className="custom-background-field"
                  initial={{ height: 0, opacity: 0, y: -5 }}
                  animate={{ height: "auto", opacity: 1, y: 0 }}
                  exit={{ height: 0, opacity: 0, y: -5 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <span>写下 TA 的现实生活背景</span>
                  <input
                    maxLength={24}
                    onChange={(event) => {
                      setCustomBackground(event.target.value);
                      updateDraft({ background: event.target.value });
                    }}
                    placeholder="例如：独立游戏音乐人"
                    required
                    value={draft.background}
                  />
                </motion.label>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="field-stack">
            <span>场景氛围</span>
            <div className="segmented-grid three-cols">
              {visualVibeOptions.map((option) => (
                <button
                  key={option}
                  className={draft.visualVibe === option ? "is-selected" : ""}
                  type="button"
                  onClick={() => updateDraft({ visualVibe: option })}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="field-stack">
            <span>边界</span>
            <div className="checkbox-grid">
              {boundaryOptions.map((boundary) => (
                <button
                  key={boundary}
                  className={draft.boundaries.includes(boundary) ? "is-selected" : ""}
                  type="button"
                  onClick={() => toggleBoundary(boundary)}
                >
                  <Check size={15} />
                  {boundary}
                </button>
              ))}
            </div>
          </div>

          <button className="primary-action" disabled={saving} type="submit">
            {saving ? "正在保存..." : "完成并开始聊天"}
            <ArrowRight size={18} />
          </button>
          {submitError ? <p className="auth-error">{submitError}</p> : null}
        </form>
      </motion.section>
    </main>
  );
}
