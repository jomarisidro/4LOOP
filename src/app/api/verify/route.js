import connectMongoDB from "@/lib/ConnectMongodb";
import { NextResponse } from "next/server";
import User from "@/models/User";

export async function POST(req) {
  await connectMongoDB();
  const { email, code } = await req.json();

  if (!email || !code)
    return NextResponse.json({ error: "Email and code required" }, { status: 400 });

  const user = await User.findOne({ email });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.verified) return NextResponse.json({ error: "Already verified" }, { status: 400 });

  if (user.verificationCode !== code) {
    return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
  }

  user.verified = true;
  user.verificationCode = null;
  await user.save();

  return NextResponse.json({ msg: "Email verified successfully" }, { status: 200 });
}
