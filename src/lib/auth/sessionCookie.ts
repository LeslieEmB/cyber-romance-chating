import { NextResponse, type NextRequest } from "next/server";
import { AuthError, getUserBySessionToken, type CreatedSession } from "@/lib/auth/store";
import type { PublicAuthUser } from "@/lib/types";

export const sessionCookieName = "cyber-love-session";

export function writeSessionCookie(response: NextResponse, session: CreatedSession) {
  response.cookies.set(sessionCookieName, session.token, {
    expires: session.expiresAt,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.AUTH_COOKIE_SECURE === "true"
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(sessionCookieName, "", {
    expires: new Date(0),
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.AUTH_COOKIE_SECURE === "true"
  });
}

export async function authenticatedUser(request: NextRequest): Promise<PublicAuthUser> {
  const user = await getUserBySessionToken(request.cookies.get(sessionCookieName)?.value);

  if (!user) {
    throw new AuthError("请先登录后再继续。", 401);
  }

  return user;
}

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return NextResponse.json({ error: "服务暂时不可用，请稍后重试。" }, { status: 500 });
}
