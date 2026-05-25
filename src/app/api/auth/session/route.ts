import { NextResponse, type NextRequest } from "next/server";
import { getUserBySessionToken } from "@/lib/auth/store";
import { clearSessionCookie, sessionCookieName } from "@/lib/auth/sessionCookie";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(sessionCookieName)?.value;
  const user = await getUserBySessionToken(token);
  const response = NextResponse.json({ user });

  if (token && !user) {
    clearSessionCookie(response);
  }

  return response;
}
