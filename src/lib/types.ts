export type GenderExpression = "feminine" | "masculine" | "androgynous" | "custom";
export type MoodState = "calm" | "spark" | "shy" | "focus";
export type RelationshipStyle = "warm" | "playful" | "slow-burn" | "quiet";
export type MemoryType = "preference" | "boundary" | "summary" | "fact";
export type ChatRole = "user" | "assistant";

export type AvatarConfig = {
  hairShape: "bob" | "spike" | "wave" | "short" | "long";
  eyeColor: string;
  accessory: "halo" | "visor" | "earring" | "none";
  outfitColor: string;
  mood: MoodState;
};

export type Persona = {
  name: string;
  gender: GenderExpression;
  personality: string;
  relationshipStyle: RelationshipStyle;
  visualVibe: string;
  boundaries: string[];
  speechStyle: string;
  background: string;
  tone: string;
  avatar: AvatarConfig;
};

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
};

export type Memory = {
  id: string;
  type: MemoryType;
  content: string;
  importance: number;
  source: "user_message" | "summary" | "manual_edit";
  updatedAt: string;
};

export type AppSettings = {
  model: string;
  baseUrl: string;
  stream: boolean;
  localMemory: boolean;
  privacyMode: boolean;
};
