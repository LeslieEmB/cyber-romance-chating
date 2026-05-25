import { NextResponse, type NextRequest } from "next/server";
import { saveUserPersona } from "@/lib/auth/store";
import { authenticatedUser, authErrorResponse } from "@/lib/auth/sessionCookie";

export const runtime = "nodejs";

export async function PUT(request: NextRequest) {
  try {
    const currentUser = await authenticatedUser(request);
    const body = (await request.json()) as { persona?: unknown };

    const user = await saveUserPersona(currentUser.id, body.persona);
    return NextResponse.json({ user });
  } catch (error) {
    return authErrorResponse(error);
  }
}
