import connectMongoDB from "@/lib/ConnectMongodb";
import { NextResponse } from "next/server";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

// ✅ Helper: Send verification email
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
    subject: "Verify your email - Pasig Sanitation Online Service",
    html: `
      <h2>Welcome to Pasig Sanitation Online Service</h2>
      <p>Use the code below to verify your account:</p>
      <h1 style="font-size: 24px; letter-spacing: 3px;">${code}</h1>
      <p>This code will expire in <strong>15 minutes</strong>. Please verify your account promptly.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function GET(request) {
  await connectMongoDB();

  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    const query = role ? { role } : {};
const users = await User.find(query)
  .select("_id fullName email role businessAccount profilePicture assignedArea verified accountDisabled")
  .lean();

const formattedUsers = users.map(u => ({
  ...u,
  status: u.accountDisabled ? 'disabled' : 'active',
}));

return NextResponse.json({ users: formattedUsers }, { status: 200 });



    return NextResponse.json({ users }, { status: 200 });
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request) {
  await connectMongoDB();

  try {
    const body = await request.json();
    const { role, email, password, fullName } = body;

    // ✅ Role normalization
    const normalizedRole =
      role === "Business Owner" || role === "business"
        ? "business"
        : role === "officer"
        ? "officer"
        : null;

    if (!normalizedRole) {
      return NextResponse.json(
        { error: "Invalid role. Only Business Owner or Officer allowed." },
        { status: 403 }
      );
    }

    // ✅ Required fields
    if (normalizedRole === "officer" && (!fullName || !email || !password)) {
      return NextResponse.json(
        { error: "Full name, email, and password are required for officer accounts." },
        { status: 400 }
      );
    }

    if (normalizedRole === "business" && (!email || !password)) {
      return NextResponse.json(
        { error: "Email and password are required for business accounts." },
        { status: 400 }
      );
    }

    // ✅ Check for duplicates
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Generate verification code & expiration (for business)
    let verificationCode = null;
    let verificationExpiry = null;

    if (normalizedRole === "business") {
      verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      verificationExpiry = new Date(Date.now() + 15 * 60 * 1000); // expires in 15 minutes
    }

    // ✅ Create user
    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: normalizedRole,
      fullName: normalizedRole === "officer" ? fullName : undefined,
      verified: normalizedRole === "officer",
      verificationCode,
      verificationExpiry,
    });

    // ✅ Business users link to themselves
    if (normalizedRole === "business") {
      newUser.businessAccount = newUser._id;
      await newUser.save();
    }

   // ✅ Send verification email for business users
if (normalizedRole === "business" && verificationCode) {
  try {
    console.log("📨 Attempting to send email to:", email);
    await sendVerificationEmail(email, verificationCode);
    console.log("✅ Verification email sent to", email);
  } catch (emailErr) {
    console.error("❌ Failed to send verification email:", emailErr.response || emailErr.message || emailErr);
  }
}
return NextResponse.json(
  {
    msg: "Registration successful! Please check your email for the verification code.",
    userId: newUser._id,
    email: newUser.email,
  },
  { status: 201 }
);

  
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json({ error: "Failed to register user" }, { status: 500 });
  }
}
