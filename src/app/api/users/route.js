import connectMongoDB from "@/lib/ConnectMongodb";
import { NextResponse } from "next/server";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { decrypt } from "@/lib/Auth"; // 🔐 Session validation

// ✅ Helper: Send verification email using Resend
async function sendVerificationEmail(email, code) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: "Pasig City Sanitation <noreply@pasigsanitation-project.site>",
      to: email,
      subject: "Verify your email - Pasig Sanitation Online Service",
      html: `
        <h2>Welcome to Pasig Sanitation Online Service</h2>
        <p>Use the code below to verify your account:</p>
        <h1 style="font-size: 24px; letter-spacing: 3px;">${code}</h1>
        <p>This code will expire in <strong>15 minutes</strong>. Please verify your account promptly.</p>
      `,
    });

    console.log("✅ Verification email sent to", email);
  } catch (err) {
    console.error("❌ Failed to send verification email:", err);
    throw err;
  }
}

export async function GET(request) {
  await connectMongoDB();

  const token = request.cookies.get("session")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const session = await decrypt(token);
    const { id: sessionId, role } = session?.user || {};

    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get("id");       // Used to fetch specific user
    const filterRole = searchParams.get("role");   // Used by admin to filter

    if (!sessionId || !role) {
      return NextResponse.json({ error: "Invalid session" }, { status: 403 });
    }

    // 🔐 Admin can fetch any user list
    if (role === "admin") {
      const query = filterRole ? { role: filterRole } : {};
      const users = await User.find(query)
        .select("_id fullName email role businessAccount profilePicture assignedArea verified accountDisabled")
        .lean();

      const formattedUsers = users.map(u => ({
        ...u,
        status: u.accountDisabled ? "disabled" : "active",
      }));

      return NextResponse.json({ users: formattedUsers }, { status: 200 });
    }

    // 🔐 Business or Officer can only fetch their own data
    if (targetId && targetId !== sessionId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await User.findById(sessionId)
      .select("_id fullName email role businessAccount profilePicture assignedArea verified accountDisabled")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== role) {
      return NextResponse.json({ error: "Role mismatch" }, { status: 403 });
    }

    return NextResponse.json({
      user: {
        ...user,
        status: user.accountDisabled ? "disabled" : "active",
      },
    }, { status: 200 });
  } catch (err) {
    console.error("❌ Error fetching user:", err);
    return NextResponse.json({ error: "Failed to fetch user." }, { status: 500 });
  }
}

export async function POST(request) {
  await connectMongoDB();

  try {
    const body = await request.json();
    const { role, email, password, fullName } = body;

    // ✅ Normalize role
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

    // ✅ Required fields validation
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

    // ✅ Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        {
          error: "Email already registered",
          data: {
            email: existingUser.email,
            verified: existingUser.verified,
          },
        },
        { status: 409 }
      );
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create verification code for business
    let verificationCode = null;
    let verificationExpiry = null;

    if (normalizedRole === "business") {
      verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      verificationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
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

    // ✅ Link business account
    if (normalizedRole === "business") {
      newUser.businessAccount = newUser._id;
      await newUser.save();
    }

    // ✅ Send verification email for business
    if (normalizedRole === "business" && verificationCode) {
      try {
        console.log("📨 Sending verification email to:", email);
        await sendVerificationEmail(email, verificationCode);
      } catch (emailErr) {
        console.error("❌ Email send failed:", emailErr);
        // Optional: You could still return success but warn frontend
      }
    }

    // ✅ Response (formatted for frontend)
    return NextResponse.json(
      {
        msg: "Registration successful! Please check your email for the verification code.",
        userId: newUser._id,
        email: newUser.email,
        verified: newUser.verified,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("❌ Registration error:", err);
    return NextResponse.json({ error: "Failed to register user." }, { status: 500 });
  }
}
