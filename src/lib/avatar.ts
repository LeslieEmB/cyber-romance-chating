import type { AvatarConfig, GenderExpression } from "@/lib/types";

const eyeColors = ["#2df8ff", "#ff3df2", "#39ff88", "#ffd166"];
const outfits = ["#2df8ff", "#ff3df2", "#39ff88", "#7c5cff"];
const neutralHairShapes: AvatarConfig["hairShape"][] = ["bob", "wave"];
const customHairShapes: AvatarConfig["hairShape"][] = ["bob", "spike", "wave", "short", "long"];
const accessories: AvatarConfig["accessory"][] = ["halo", "visor", "earring", "none"];

function hashSeed(seed: string) {
  return Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function createAvatarConfig(
  seed: string,
  gender: GenderExpression,
  vibe: string
): AvatarConfig {
  const value = hashSeed(`${seed}-${gender}-${vibe}`);
  const hairShape =
    gender === "feminine"
      ? "long"
      : gender === "masculine"
        ? "short"
        : gender === "androgynous"
          ? neutralHairShapes[value % neutralHairShapes.length]
          : customHairShapes[value % customHairShapes.length];

  return {
    hairShape,
    eyeColor: eyeColors[(value + 1) % eyeColors.length],
    accessory:
      gender === "feminine"
        ? "earring"
        : gender === "masculine"
          ? "visor"
          : accessories[(value + 2) % accessories.length],
    outfitColor: outfits[(value + 3) % outfits.length],
    mood: value % 3 === 0 ? "spark" : value % 3 === 1 ? "shy" : "calm"
  };
}
