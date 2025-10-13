import connectMongoDB from "@/lib/ConnectMongodb";
import { NextResponse } from "next/server";
import User from "@/models/User";

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

    const user = await User.findOne({ email });

    if (!user)
      return NextResponse.json({ error: "User not found." }, { status: 404 });

    if (user.verified)
      return NextResponse.json({ error: "Email is already verified." }, { status: 400 });

    if (user.verificationCode !== code)
      return NextResponse.json({ error: "Invalid verification code." }, { status: 400 });

    // Optional: You can check expiration if you store codeExpiry
    // if (user.codeExpiry && user.codeExpiry < new Date()) {
    //   return NextResponse.json({ error: "Verification code expired." }, { status: 400 });
    // }

    user.verified = true;
    user.verificationCode = null;
    user.codeExpiry = null;
    await user.save();

    return NextResponse.json(
      { msg: "Email verified successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Server error while verifying email." },
      { status: 500 }
    );
  }
}
