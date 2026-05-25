import { NextResponse } from "next/server";
import { createSession, registerUser } from "@/lib/auth/store";
import { authErrorResponse, writeSessionCookie } from "@/lib/auth/sessionCookie";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; nickname?: string; password?: string };
    const user = await registerUser({
      email: body.email ?? "",
      nickname: body.nickname ?? "",
      password: body.password ?? ""
    });
    const session = await createSession(user.id);
    const response = NextResponse.json({ user }, { status: 201 });
    writeSessionCookie(response, session);
    return response;
  } catch (error) {
    return authErrorResponse(error);
  }
}
