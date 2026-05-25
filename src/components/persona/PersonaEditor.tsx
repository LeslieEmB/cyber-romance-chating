"use client";

import { Save, SlidersHorizontal } from "lucide-react";
import { PixelAvatar } from "@/components/avatar/PixelAvatar";
import { createAvatarConfig } from "@/lib/avatar";
import {
  accessoryOptions,
  backgroundOptions,
  boundaryOptions,
  eyeOptions,
  genderOptions,
  hairOptions,
  joinChoices,
  outfitOptions,
  personalityOptions,
  relationshipOptions,
  speechStyleOptions,
  splitChoices,
  toggleChoice,
  toneOptions,
  visualVibeOptions
} from "@/lib/personaOptions";
import type { AvatarConfig, GenderExpression } from "@/lib/types";
import { usePersonaStore } from "@/stores/personaStore";

export function PersonaEditor() {
  const persona = usePersonaStore((state) => state.persona);
  const updatePersona = usePersonaStore((state) => state.updatePersona);
  const setAvatar = usePersonaStore((state) => state.setAvatar);

  function updateAvatar(value: Partial<AvatarConfig>) {
    setAvatar({ ...persona.avatar, ...value });
  }

  function chooseGender(gender: GenderExpression) {
    updatePersona({
      gender,
      avatar: createAvatarConfig(persona.name || "NOVA", gender, persona.visualVibe)
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
            已同步
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
            <span>视觉氛围</span>
            <div className="segmented-grid three-cols">
              {visualVibeOptions.map((option) => (
                <button
                  key={option}
                  className={persona.visualVibe === option ? "is-selected" : ""}
                  type="button"
                  onClick={() =>
                    updatePersona({
                      visualVibe: option,
                      avatar: createAvatarConfig(persona.name || "NOVA", persona.gender, option)
                    })
                  }
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
            </div>
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
            像素参数
          </div>

          <label className="field-stack">
            <span>发型</span>
            <select
              value={persona.avatar.hairShape}
              onChange={(event) => updateAvatar({ hairShape: event.target.value as AvatarConfig["hairShape"] })}
            >
              {hairOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field-stack">
            <span>配饰</span>
            <select
              value={persona.avatar.accessory}
              onChange={(event) => updateAvatar({ accessory: event.target.value as AvatarConfig["accessory"] })}
            >
              {accessoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="field-stack">
            <span>眼睛</span>
            <div className="swatch-row">
              {eyeOptions.map((color) => (
                <button
                  key={color}
                  className={persona.avatar.eyeColor === color ? "is-selected" : ""}
                  style={{ background: color }}
                  type="button"
                  onClick={() => updateAvatar({ eyeColor: color })}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="field-stack">
            <span>外套</span>
            <div className="swatch-row">
              {outfitOptions.map((color) => (
                <button
                  key={color}
                  className={persona.avatar.outfitColor === color ? "is-selected" : ""}
                  style={{ background: color }}
                  type="button"
                  onClick={() => updateAvatar({ outfitColor: color })}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
}
