export const runtime = "nodejs";

import connectMongoDB from "@/lib/ConnectMongodb";
import { NextResponse } from "next/server";
import User from "@/models/User";
import crypto from "crypto";

export async function POST(req) {
  try {
    await connectMongoDB();

    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and verification code are required." },
        { status: 400 }
      );
    }

    console.log(`🔍 Verification attempt for ${email} with code ${code}`);

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (user.verified) {
      return NextResponse.json({ error: "Email is already verified." }, { status: 400 });
    }

    // ✅ Check if code is expired
    if (user.verificationExpiry && user.verificationExpiry < new Date()) {
      return NextResponse.json({ error: "Verification code expired." }, { status: 400 });
    }

    // ✅ Use constant-time comparison to prevent timing attacks
    const codeBuffer = Buffer.from(code);
    const storedBuffer = Buffer.from(user.verificationCode || "");

    if (
      codeBuffer.length !== storedBuffer.length ||
      !crypto.timingSafeEqual(codeBuffer, storedBuffer)
    ) {
      return NextResponse.json({ error: "Invalid verification code." }, { status: 400 });
    }

    // ✅ Mark user as verified and clear code
    user.verified = true;
    user.verificationCode = null;
    user.verificationExpiry = null;
    await user.save();

    return NextResponse.json(
      {
        msg: "Email verified successfully!",
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Verification error:", error);
    return NextResponse.json(
      { error: "Server error while verifying email." },
      { status: 500 }
    );
  }
}
