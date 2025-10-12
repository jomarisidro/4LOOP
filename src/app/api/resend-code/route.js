import connectMongoDB from "@/lib/ConnectMongodb";
import { NextResponse } from "next/server";
import User from "@/models/User";
import nodemailer from "nodemailer";

async function sendVerificationEmail(email, code) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Pasig Sanitation" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "New Verification Code - Pasig Sanitation",
    html: `
      <h2>Your new verification code</h2>
      <p>Use this code to verify your email:</p>
      <h1 style="font-size: 24px; letter-spacing: 3px;">${code}</h1>
      <p>This code will expire in <strong>15 minutes</strong>.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function POST(req) {
  await connectMongoDB();
  const { email } = await req.json();

  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const user = await User.findOne({ email });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.verified)
    return NextResponse.json({ error: "Email already verified" }, { status: 400 });

  const newCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.verificationCode = newCode;
  await user.save();

  try {
    await sendVerificationEmail(email, newCode);
    return NextResponse.json({ msg: "New code sent" }, { status: 200 });
  } catch (err) {
    console.error("Email send error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
