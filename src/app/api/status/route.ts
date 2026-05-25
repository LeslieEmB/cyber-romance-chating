import { NextResponse, type NextRequest } from "next/server";
import { getProviderStatus } from "@/lib/ai/providerConfig";
import { authenticatedUser, authErrorResponse } from "@/lib/auth/sessionCookie";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await authenticatedUser(request);
    return NextResponse.json({ ok: true, provider: "deepseek", ...(await getProviderStatus()) });
  } catch (error) {
    return authErrorResponse(error);
  }
}
