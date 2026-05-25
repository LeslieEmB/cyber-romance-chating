import { NextResponse, type NextRequest } from "next/server";
import { removeSession } from "@/lib/auth/store";
import { clearSessionCookie, sessionCookieName } from "@/lib/auth/sessionCookie";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  await removeSession(request.cookies.get(sessionCookieName)?.value);
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
