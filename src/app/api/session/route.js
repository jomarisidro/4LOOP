import { decrypt } from "@/lib/Auth";
import { NextResponse } from "next/server";

export async function GET(request) {
  const token = request.cookies.get("session")?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const session = await decrypt(token);
    if (!session?.user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const { id, email, role } = session.user; // expose only safe fields
    return NextResponse.json({ authenticated: true, user: { id, email, role } });
  } catch (err) {
    console.error("❌ Session decrypt failed:", err);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
