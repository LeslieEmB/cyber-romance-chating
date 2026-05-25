import type { AvatarConfig } from "@/lib/types";
import { accessoryOptions, eyeOptions, hairOptions, outfitOptions } from "@/lib/personaOptions";

type AppearanceControlsProps = {
  avatar: AvatarConfig;
  onChange: (value: Partial<AvatarConfig>) => void;
  note?: string;
};

export function AppearanceControls({ avatar, onChange, note }: AppearanceControlsProps) {
  return (
    <div className="appearance-controls">
      {note ? <p className="appearance-note">{note}</p> : null}
      <div className="appearance-grid">
        <label className="field-stack">
          <span>发型</span>
          <select
            value={avatar.hairShape}
            onChange={(event) => onChange({ hairShape: event.target.value as AvatarConfig["hairShape"] })}
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
            value={avatar.accessory}
            onChange={(event) => onChange({ accessory: event.target.value as AvatarConfig["accessory"] })}
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
                aria-label={`眼睛颜色 ${color}`}
                className={avatar.eyeColor === color ? "is-selected" : ""}
                key={color}
                onClick={() => onChange({ eyeColor: color })}
                style={{ background: color }}
                type="button"
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
                aria-label={`外套颜色 ${color}`}
                className={avatar.outfitColor === color ? "is-selected" : ""}
                key={color}
                onClick={() => onChange({ outfitColor: color })}
                style={{ background: color }}
                type="button"
                title={color}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
