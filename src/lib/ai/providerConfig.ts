import { chmod, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export type ProviderConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

type StoredProviderConfig = ProviderConfig & {
  updatedAt: string;
};

export type ProviderStatus = {
  configured: boolean;
  connected: boolean;
  keyHint: string | null;
  baseUrl: string;
  model: string;
  source: "file" | "environment" | "none";
};

export class ProviderConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderConfigError";
  }
}

function providerConfigPath() {
  return (
    process.env.PROVIDER_CONFIG_FILE?.trim() || path.join(process.cwd(), "data", "provider-config.json")
  );
}

function normalizeConfig(config: ProviderConfig): ProviderConfig {
  return {
    apiKey: config.apiKey.trim(),
    baseUrl: (config.baseUrl.trim() || "https://api.deepseek.com").replace(/\/+$/, ""),
    model: config.model.trim() || "deepseek-chat"
  };
}

function validateConfig(config: ProviderConfig) {
  if (!config.apiKey) {
    throw new ProviderConfigError("请输入 API Key 后再测试连接。");
  }

  try {
    new URL(config.baseUrl);
  } catch {
    throw new ProviderConfigError("请输入有效的 Base URL。");
  }

  return config;
}

function keyHint(apiKey: string) {
  return apiKey ? `****${apiKey.slice(-4)}` : null;
}

async function readSavedConfig(): Promise<StoredProviderConfig | null> {
  try {
    return JSON.parse(await readFile(providerConfigPath(), "utf8")) as StoredProviderConfig;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function writeSavedConfig(config: ProviderConfig) {
  const destination = providerConfigPath();
  const tempPath = `${destination}.${process.pid}.tmp`;
  const stored: StoredProviderConfig = { ...config, updatedAt: new Date().toISOString() };
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(tempPath, JSON.stringify(stored, null, 2), { encoding: "utf8", mode: 0o600 });
  await rename(tempPath, destination);
  await chmod(destination, 0o600);
}

export async function resolveProviderConfig(modelOverride?: string): Promise<ProviderConfig> {
  const saved = await readSavedConfig();
  const source = saved ?? {
    apiKey: process.env.DEEPSEEK_API_KEY?.trim() ?? "",
    baseUrl: process.env.DEEPSEEK_BASE_URL?.trim() || "https://api.deepseek.com",
    model: process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat"
  };

  return normalizeConfig({
    apiKey: source.apiKey,
    baseUrl: source.baseUrl,
    model: modelOverride?.trim() || source.model
  });
}

export async function getProviderStatus(): Promise<ProviderStatus> {
  const saved = await readSavedConfig();
  const config = await resolveProviderConfig();
  const source: ProviderStatus["source"] = saved ? "file" : config.apiKey ? "environment" : "none";

  return {
    configured: Boolean(config.apiKey),
    connected: Boolean(config.apiKey),
    keyHint: keyHint(config.apiKey),
    baseUrl: config.baseUrl,
    model: config.model,
    source
  };
}

export async function testAndSaveProviderConfig(
  candidate: ProviderConfig,
  testConnection: (config: ProviderConfig) => Promise<void>
): Promise<ProviderStatus> {
  const normalized = validateConfig(normalizeConfig(candidate));

  try {
    await testConnection(normalized);
  } catch {
    throw new ProviderConfigError("连接失败，请检查 API Key、Base URL 与模型名称。");
  }

  await writeSavedConfig(normalized);
  return {
    configured: true,
    connected: true,
    keyHint: keyHint(normalized.apiKey),
    baseUrl: normalized.baseUrl,
    model: normalized.model,
    source: "file"
  };
}
