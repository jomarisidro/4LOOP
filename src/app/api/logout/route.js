import { logout } from "@/lib/Auth";
import { NextResponse } from "next/server";

export async function POST() {
  // 🔒 Clear the session cookie
  await logout();

  // ✅ Respond to frontend
  return NextResponse.json({ message: "Logged out successfully." });
}
