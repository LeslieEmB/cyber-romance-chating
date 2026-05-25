import { NextResponse } from "next/server";
import { getDeepSeekConfig, hasDeepSeekApiKey } from "@/lib/ai/deepseek";

export const runtime = "nodejs";

export function GET() {
  const config = getDeepSeekConfig();

  return NextResponse.json({
    ok: true,
    provider: "deepseek",
    configured: hasDeepSeekApiKey(),
    baseUrl: config.baseUrl,
    model: config.model
  });
}
