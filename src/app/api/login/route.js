import connectMongoDB from "@/lib/ConnectMongodb";
import { NextResponse } from "next/server";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { login } from "@/lib/Auth";

export async function POST(request) {
  await connectMongoDB();

  try {
    const { email, password } = await request.json();

    // 🔍 Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.warn(`Login failed: user not found for email ${email}`);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // 🔐 Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`Login failed: password mismatch for email ${email}`);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // ✅ Set session cookie via helper
    await login(user);

    // 🧼 Sanitize user object before sending
    const safeUser = {
      _id: user._id,
      email: user.email,
      role: user.role, // ✅ Explicitly include this for redirect logic
    };

    return NextResponse.json({
      msg: "Login successful",
      user: safeUser,
    });

  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
