import { NextResponse, type NextRequest } from "next/server";
import { testDeepSeekConnection } from "@/lib/ai/deepseek";
import { ProviderConfigError, testAndSaveProviderConfig } from "@/lib/ai/providerConfig";
import { authenticatedUser, authErrorResponse } from "@/lib/auth/sessionCookie";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await authenticatedUser(request);
    const body = (await request.json()) as { apiKey?: string; baseUrl?: string; model?: string };
    const status = await testAndSaveProviderConfig(
      {
        apiKey: body.apiKey ?? "",
        baseUrl: body.baseUrl ?? "https://api.deepseek.com",
        model: body.model ?? "deepseek-chat"
      },
      testDeepSeekConnection
    );
    return NextResponse.json(status);
  } catch (error) {
    if (error instanceof ProviderConfigError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return authErrorResponse(error);
  }
}
