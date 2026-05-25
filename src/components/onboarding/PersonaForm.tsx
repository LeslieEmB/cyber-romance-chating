"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { PixelAvatar } from "@/components/avatar/PixelAvatar";
import { createAvatarConfig } from "@/lib/avatar";
import { defaultPersona } from "@/lib/defaults";
import {
  backgroundOptions,
  boundaryOptions,
  genderOptions,
  joinChoices,
  personalityOptions,
  relationshipOptions,
  speechStyleOptions,
  splitChoices,
  toggleChoice,
  toneOptions,
  visualVibeOptions
} from "@/lib/personaOptions";
import type { GenderExpression, Persona } from "@/lib/types";
import { usePersonaStore } from "@/stores/personaStore";

export function PersonaForm() {
  const router = useRouter();
  const completeOnboarding = usePersonaStore((state) => state.completeOnboarding);
  const [draft, setDraft] = useState<Persona>(defaultPersona);

  const previewPersona = useMemo(
    () => ({
      ...draft,
      avatar: createAvatarConfig(draft.name || "NOVA", draft.gender, draft.visualVibe)
    }),
    [draft]
  );

  function updateDraft(value: Partial<Persona>) {
    setDraft((current) => ({ ...current, ...value }));
  }

  function chooseGender(gender: GenderExpression) {
    setDraft((current) => ({
      ...current,
      gender,
      avatar: createAvatarConfig(current.name || "NOVA", gender, current.visualVibe)
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    completeOnboarding(previewPersona);
    router.push("/chat");
  }

  return (
    <main className="onboarding-screen scanline-layer">
      <motion.section
        className="onboarding-grid"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="onboarding-copy">
          <span className="brand-chip">
            <Sparkles size={16} />
            CYBER ROMANCE
          </span>
          <h1>赛博恋爱</h1>
          <p>创建一个有温度的聊天对象，选好性格与相处方式，然后开始第一句对话。</p>
          <PixelAvatar persona={previewPersona} />
        </div>

        <form className="onboarding-form" onSubmit={handleSubmit}>
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
            </div>
          </div>

          <div className="field-stack">
            <span>视觉氛围</span>
            <div className="segmented-grid three-cols">
              {visualVibeOptions.map((option) => (
                <button
                  key={option}
                  className={draft.visualVibe === option ? "is-selected" : ""}
                  type="button"
                  onClick={() =>
                    updateDraft({
                      visualVibe: option,
                      avatar: createAvatarConfig(draft.name || "NOVA", draft.gender, option)
                    })
                  }
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

          <button className="primary-action" type="submit">
            接通信道
            <ArrowRight size={18} />
          </button>
        </form>
      </motion.section>
    </main>
  );
}
