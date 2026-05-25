import { resolveProviderConfig, type ProviderConfig } from "@/lib/ai/providerConfig";

export type ModelMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type DeepSeekChoice = {
  message?: {
    content?: string;
  };
};

type DeepSeekResponse = {
  choices?: DeepSeekChoice[];
};

export class DeepSeekConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeepSeekConfigError";
  }
}

export async function getDeepSeekConfig(modelOverride?: string) {
  return resolveProviderConfig(modelOverride);
}

export async function hasDeepSeekApiKey() {
  return Boolean((await getDeepSeekConfig()).apiKey);
}

async function postDeepSeekChat(messages: ModelMessage[], config: ProviderConfig, temperature: number) {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature,
      stream: false
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`DeepSeek request failed: ${response.status} ${detail.slice(0, 240)}`);
  }

  const data = (await response.json()) as DeepSeekResponse;
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("DeepSeek response did not include message content.");
  }

  return content;
}

export async function requestDeepSeekChat(messages: ModelMessage[], modelOverride?: string) {
  const config = await getDeepSeekConfig(modelOverride);

  if (!config.apiKey) {
    throw new DeepSeekConfigError("DEEPSEEK_API_KEY is not configured.");
  }

  return postDeepSeekChat(messages, config, 0.82);
}

export async function testDeepSeekConnection(config: ProviderConfig) {
  if (!config.apiKey) {
    throw new DeepSeekConfigError("DEEPSEEK_API_KEY is not configured.");
  }

  await postDeepSeekChat(
    [
      {
        role: "user",
        content: "请只回复 OK。"
      }
    ],
    config,
    0
  );
}
