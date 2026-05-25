import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { chmod, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Persona, PublicAuthUser } from "@/lib/types";

const sessionLifetimeMs = 1000 * 60 * 60 * 24 * 7;

type StoredUser = PublicAuthUser & {
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
};

type StoredSession = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
};

type AuthStoreData = {
  users: StoredUser[];
  sessions: StoredSession[];
};

type RegisterInput = {
  email: string;
  nickname: string;
  password: string;
};

export type CreatedSession = {
  token: string;
  expiresAt: Date;
};

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}

let mutationQueue = Promise.resolve();

function getStorePath() {
  return process.env.AUTH_DATA_FILE?.trim() || path.join(process.cwd(), "data", "auth-store.json");
}

function createEmptyStore(): AuthStoreData {
  return { users: [], sessions: [] };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function validateCredentials(input: RegisterInput) {
  const email = normalizeEmail(input.email);
  const nickname = input.nickname.trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AuthError("请输入有效的邮箱地址。", 400);
  }

  if (nickname.length < 2 || nickname.length > 16) {
    throw new AuthError("昵称需要为 2 至 16 个字符。", 400);
  }

  if (input.password.length < 6) {
    throw new AuthError("密码至少需要 6 位。", 400);
  }

  return { email, nickname, password: input.password };
}

function publicUser(user: StoredUser): PublicAuthUser {
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    hasOnboarded: user.hasOnboarded,
    persona: user.persona
  };
}

function tokenDigest(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function passwordDigest(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

function passwordMatches(password: string, user: StoredUser) {
  const expected = Buffer.from(user.passwordHash, "hex");
  const supplied = Buffer.from(passwordDigest(password, user.passwordSalt), "hex");
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

async function readStore(): Promise<AuthStoreData> {
  try {
    const contents = await readFile(getStorePath(), "utf8");
    const store = JSON.parse(contents) as AuthStoreData;
    return {
      users: Array.isArray(store.users) ? store.users : [],
      sessions: Array.isArray(store.sessions) ? store.sessions : []
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return createEmptyStore();
    }
    throw error;
  }
}

async function writeStore(store: AuthStoreData) {
  const destination = getStorePath();
  const tempFile = `${destination}.${process.pid}.tmp`;
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(tempFile, JSON.stringify(store, null, 2), { encoding: "utf8", mode: 0o600 });
  await rename(tempFile, destination);
  await chmod(destination, 0o600);
}

async function mutateStore<T>(mutation: (store: AuthStoreData) => T | Promise<T>): Promise<T> {
  const action = mutationQueue.then(async () => {
    const store = await readStore();
    const result = await mutation(store);
    await writeStore(store);
    return result;
  });

  mutationQueue = action.then(
    () => undefined,
    () => undefined
  );

  return action;
}

export async function registerUser(input: RegisterInput): Promise<PublicAuthUser> {
  const validInput = validateCredentials(input);

  return mutateStore((store) => {
    if (store.users.some((user) => user.email === validInput.email)) {
      throw new AuthError("该邮箱已经注册，请直接登录。", 409);
    }

    const passwordSalt = randomBytes(16).toString("hex");
    const user: StoredUser = {
      id: randomUUID(),
      email: validInput.email,
      nickname: validInput.nickname,
      passwordSalt,
      passwordHash: passwordDigest(validInput.password, passwordSalt),
      hasOnboarded: false,
      persona: null,
      createdAt: new Date().toISOString()
    };

    store.users.push(user);
    return publicUser(user);
  });
}

export async function authenticateUser(email: string, password: string): Promise<PublicAuthUser> {
  await mutationQueue;
  const store = await readStore();
  const user = store.users.find((candidate) => candidate.email === normalizeEmail(email));

  if (!user || !passwordMatches(password, user)) {
    throw new AuthError("邮箱或密码不正确。", 401);
  }

  return publicUser(user);
}

export async function createSession(userId: string): Promise<CreatedSession> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionLifetimeMs);

  await mutateStore((store) => {
    store.sessions = store.sessions.filter(
      (session) => session.userId !== userId && Date.parse(session.expiresAt) > Date.now()
    );
    store.sessions.push({
      id: randomUUID(),
      userId,
      tokenHash: tokenDigest(token),
      expiresAt: expiresAt.toISOString()
    });
  });

  return { token, expiresAt };
}

export async function getUserBySessionToken(token: string | undefined): Promise<PublicAuthUser | null> {
  if (!token) {
    return null;
  }

  await mutationQueue;
  const store = await readStore();
  const now = Date.now();
  const session = store.sessions.find(
    (candidate) => candidate.tokenHash === tokenDigest(token) && Date.parse(candidate.expiresAt) > now
  );
  const user = session ? store.users.find((candidate) => candidate.id === session.userId) : undefined;

  return user ? publicUser(user) : null;
}

export async function removeSession(token: string | undefined) {
  if (!token) {
    return;
  }

  await mutateStore((store) => {
    store.sessions = store.sessions.filter((session) => session.tokenHash !== tokenDigest(token));
  });
}

function validText(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
}

function assertValidPersona(value: unknown): asserts value is Persona {
  if (!value || typeof value !== "object") {
    throw new AuthError("人物设定无效，请重新设置。", 400);
  }

  const persona = value as Partial<Persona>;
  const avatar = persona.avatar;
  const validGender = ["feminine", "masculine", "androgynous", "custom"].includes(persona.gender ?? "");
  const validRelationship = ["warm", "playful", "slow-burn", "quiet"].includes(persona.relationshipStyle ?? "");
  const validBoundaries =
    Array.isArray(persona.boundaries) &&
    persona.boundaries.length <= 8 &&
    persona.boundaries.every((boundary) => validText(boundary, 60));
  const validAvatar =
    Boolean(avatar) &&
    ["bob", "spike", "wave", "short", "long"].includes(avatar?.hairShape ?? "") &&
    ["halo", "visor", "earring", "none"].includes(avatar?.accessory ?? "") &&
    ["calm", "spark", "shy", "focus"].includes(avatar?.mood ?? "") &&
    /^#[0-9a-f]{6}$/i.test(avatar?.eyeColor ?? "") &&
    /^#[0-9a-f]{6}$/i.test(avatar?.outfitColor ?? "");

  if (
    !validText(persona.name, 24) ||
    !validGender ||
    !validText(persona.personality, 160) ||
    !validRelationship ||
    !validText(persona.visualVibe, 40) ||
    !validBoundaries ||
    !validText(persona.speechStyle, 160) ||
    !validText(persona.background, 80) ||
    !validText(persona.tone, 40) ||
    !validAvatar
  ) {
    throw new AuthError("人物设定无效，请重新设置。", 400);
  }
}

export async function saveUserPersona(userId: string, persona: unknown): Promise<PublicAuthUser> {
  assertValidPersona(persona);

  return mutateStore((store) => {
    const user = store.users.find((candidate) => candidate.id === userId);

    if (!user) {
      throw new AuthError("用户不存在。", 404);
    }

    user.persona = persona;
    user.hasOnboarded = true;
    return publicUser(user);
  });
}
