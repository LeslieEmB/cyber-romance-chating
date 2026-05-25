"use client";

import type { CSSProperties } from "react";
import { getVisualVibeClass } from "@/lib/personaOptions";
import type { Persona } from "@/lib/types";

type PixelAvatarProps = {
  persona: Persona;
  compact?: boolean;
  mini?: boolean;
};

export function PixelAvatar({ persona, compact = false, mini = false }: PixelAvatarProps) {
  const avatar = persona.avatar;
  const sceneClass = getVisualVibeClass(persona.visualVibe);
  const style = {
    "--eye": avatar.eyeColor,
    "--outfit": avatar.outfitColor,
    "--hair-glow":
      avatar.hairShape === "spike"
        ? "#39ff88"
        : avatar.hairShape === "wave"
          ? "#ff3df2"
          : "#2df8ff"
  } as CSSProperties;

  if (mini) {
    return (
      <div
        className={`chat-avatar-mini gender-${persona.gender} hair-${avatar.hairShape}`}
        style={style}
        aria-label={`${persona.name} 的像素头像`}
      >
        <span className="mini-hair-back" />
        <span className="mini-face" />
        <span className="mini-hair-top" />
        <span className="mini-hair-left" />
        <span className="mini-hair-right" />
        <span className="mini-eye left" />
        <span className="mini-eye right" />
        <span className="mini-mouth" />
      </div>
    );
  }

  return (
    <div
      className={`pixel-avatar-frame ${compact ? "is-compact" : ""} ${mini ? "is-mini" : ""}`}
      style={style}
      aria-label={`${persona.name} 的像素头像`}
    >
      <div className={`avatar-scene ${sceneClass}`} aria-hidden="true">
        <span className="scene-layer primary" />
        <span className="scene-layer secondary" />
        <span className="scene-layer signal" />
      </div>
      <div className={`pixel-avatar gender-${persona.gender} hair-${avatar.hairShape} mood-${avatar.mood}`}>
        {avatar.accessory === "halo" ? <span className="avatar-halo" /> : null}
        {avatar.accessory === "visor" ? <span className="avatar-visor" /> : null}
        <span className="avatar-hair avatar-hair-back" />
        <span className="avatar-hair avatar-hair-top" />
        <span className="avatar-hair avatar-bang left" />
        <span className="avatar-hair avatar-bang center" />
        <span className="avatar-hair avatar-bang right" />
        <span className="avatar-hair avatar-hair-left" />
        <span className="avatar-hair avatar-hair-right" />
        <span className="avatar-face" />
        <span className="avatar-brow left" />
        <span className="avatar-brow right" />
        <span className="avatar-eye left" />
        <span className="avatar-eye right" />
        <span className="avatar-blush left" />
        <span className="avatar-blush right" />
        <span className="avatar-mouth" />
        <span className="avatar-neck" />
        <span className="avatar-body" />
        <span className="avatar-collar" />
        {avatar.accessory === "earring" ? <span className="avatar-earring" /> : null}
      </div>
      <div className="avatar-nameplate">
        <strong>{persona.name}</strong>
        <span>{persona.gender}</span>
      </div>
    </div>
  );
}
