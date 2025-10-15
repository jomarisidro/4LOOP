import { decrypt } from "@/lib/Auth";
import { NextResponse } from "next/server";

export async function GET(request) {
  const token = request.cookies.get("session")?.value;
  if (!token) return NextResponse.json({ authenticated: false });

  try {
    const session = await decrypt(token);
    return NextResponse.json({ authenticated: true, user: session.user });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
