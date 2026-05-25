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

export function getDeepSeekConfig(modelOverride?: string) {
  return {
    apiKey: process.env.DEEPSEEK_API_KEY?.trim() ?? "",
    baseUrl: (process.env.DEEPSEEK_BASE_URL?.trim() || "https://api.deepseek.com").replace(/\/$/, ""),
    model: modelOverride?.trim() || process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat"
  };
}

export function hasDeepSeekApiKey() {
  return Boolean(getDeepSeekConfig().apiKey);
}

export async function requestDeepSeekChat(messages: ModelMessage[], modelOverride?: string) {
  const config = getDeepSeekConfig(modelOverride);

  if (!config.apiKey) {
    throw new DeepSeekConfigError("DEEPSEEK_API_KEY is not configured.");
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.82,
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
