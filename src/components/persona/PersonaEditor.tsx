"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PencilLine, Save, SlidersHorizontal } from "lucide-react";
import { AppearanceControls } from "@/components/avatar/AppearanceControls";
import { PixelAvatar } from "@/components/avatar/PixelAvatar";
import { createAvatarConfig } from "@/lib/avatar";
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
import type { AvatarConfig, GenderExpression } from "@/lib/types";
import { useAuthStore } from "@/stores/authStore";
import { usePersonaStore } from "@/stores/personaStore";

export function PersonaEditor() {
  const persona = usePersonaStore((state) => state.persona);
  const updatePersona = usePersonaStore((state) => state.updatePersona);
  const viewer = useAuthStore((state) => state.viewer);
  const savePersona = useAuthStore((state) => state.savePersona);
  const memberInitialized = viewer.mode === "member" && viewer.user.hasOnboarded;
  const [syncState, setSyncState] = useState<"saved" | "saving" | "error">("saved");
  const [customBackground, setCustomBackground] = useState(
    isCustomBackground(persona.background) ? persona.background : ""
  );

  useEffect(() => {
    if (!memberInitialized) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSyncState("saving");
      void savePersona(persona)
        .then(() => setSyncState("saved"))
        .catch(() => setSyncState("error"));
    }, 320);

    return () => window.clearTimeout(timer);
  }, [memberInitialized, persona, savePersona]);

  function updateAvatar(value: Partial<AvatarConfig>) {
    updatePersona({ gender: "custom", avatar: { ...persona.avatar, ...value } });
  }

  function chooseGender(gender: GenderExpression) {
    updatePersona({
      gender,
      avatar: gender === "custom" ? persona.avatar : createAvatarConfig(persona.name || "NOVA", gender)
    });
  }

  function togglePersonality(choice: string) {
    updatePersona({
      personality: joinChoices(toggleChoice(splitChoices(persona.personality), choice))
    });
  }

  function toggleSpeechStyle(choice: string) {
    updatePersona({
      speechStyle: joinChoices(toggleChoice(splitChoices(persona.speechStyle), choice))
    });
  }

  function toggleBoundary(choice: string) {
    updatePersona({
      boundaries: toggleChoice(persona.boundaries, choice)
    });
  }

  return (
    <section className="workspace-grid">
      <div className="workspace-main">
        <header className="workspace-header">
          <div>
            <span className="eyebrow">PERSONA CORE</span>
            <h1>人格编辑</h1>
          </div>
          <span className="save-state">
            <Save size={16} />
            {syncState === "saving" ? "保存中" : syncState === "error" ? "保存失败" : "已同步"}
          </span>
        </header>

        <div className="editor-grid">
          <label className="field-stack">
            <span>姓名 / 代号</span>
            <input
              value={persona.name}
              onChange={(event) => updatePersona({ name: event.target.value.slice(0, 12) })}
            />
          </label>

          <div className="field-stack">
            <span>场景氛围</span>
            <div className="segmented-grid three-cols">
              {visualVibeOptions.map((option) => (
                <button
                  key={option}
                  className={persona.visualVibe === option ? "is-selected" : ""}
                  type="button"
                  onClick={() => updatePersona({ visualVibe: option })}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="field-stack span-2">
            <span>性别表达</span>
            <div className="option-grid gender-choice-grid">
              {genderOptions.map((option) => (
                <button
                  key={option.value}
                  className={persona.gender === option.value ? "is-selected" : ""}
                  type="button"
                  onClick={() => chooseGender(option.value)}
                >
                  <strong>{option.label}</strong>
                  <small>{option.hint}</small>
                </button>
              ))}
            </div>
            <AnimatePresence initial={false}>
              {persona.gender === "custom" ? (
                <motion.p
                  className="gender-mode-note"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                >
                  当前处于自由塑造模式，只会影响外观，不会改写 TA 的说话身份。
                </motion.p>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="field-stack span-2">
            <span>人格底色</span>
            <div className="chip-grid">
              {personalityOptions.map((option) => (
                <button
                  key={option}
                  className={splitChoices(persona.personality).includes(option) ? "is-selected" : ""}
                  type="button"
                  onClick={() => togglePersonality(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="field-stack span-2">
            <span>生活背景</span>
            <div className="segmented-grid single-line">
              {backgroundOptions.map((option) => (
                <button
                  key={option}
                  className={persona.background === option ? "is-selected" : ""}
                  type="button"
                  onClick={() => updatePersona({ background: option })}
                >
                  {option}
                </button>
              ))}
              <button
                className={`custom-background-toggle ${isCustomBackground(persona.background) ? "is-selected" : ""}`}
                type="button"
                onClick={() => updatePersona({ background: customBackground })}
              >
                <PencilLine size={15} />
                自定义背景
              </button>
            </div>
            <AnimatePresence initial={false}>
              {isCustomBackground(persona.background) ? (
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
                      updatePersona({ background: event.target.value });
                    }}
                    placeholder="例如：独立游戏音乐人"
                    value={persona.background}
                  />
                </motion.label>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="field-stack">
            <span>语气</span>
            <div className="segmented-grid three-cols">
              {toneOptions.map((option) => (
                <button
                  key={option}
                  className={persona.tone === option ? "is-selected" : ""}
                  type="button"
                  onClick={() => updatePersona({ tone: option })}
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
                  className={splitChoices(persona.speechStyle).includes(option) ? "is-selected" : ""}
                  type="button"
                  onClick={() => toggleSpeechStyle(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="field-stack span-2">
            <span>关系风格</span>
            <div className="segmented-grid">
              {relationshipOptions.map((option) => (
                <button
                  key={option.value}
                  className={persona.relationshipStyle === option.value ? "is-selected" : ""}
                  type="button"
                  onClick={() => updatePersona({ relationshipStyle: option.value })}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field-stack span-2">
            <span>边界</span>
            <div className="chip-grid">
              {boundaryOptions.map((option) => (
                <button
                  key={option}
                  className={persona.boundaries.includes(option) ? "is-selected" : ""}
                  type="button"
                  onClick={() => toggleBoundary(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <aside className="workspace-side">
        <PixelAvatar persona={persona} />
        <div className="avatar-controls">
          <div className="panel-label">
            <SlidersHorizontal size={15} />
            自由塑造外观
          </div>
          <AppearanceControls
            avatar={persona.avatar}
            onChange={updateAvatar}
            note={persona.gender === "custom" ? "当前为自由塑造模式。" : "修改任一外观参数将切换至自由塑造。"}
          />
        </div>
      </aside>
    </section>
  );
}
