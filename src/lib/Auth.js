import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// 🔐 Use environment variable for secret
const secretKey = process.env.JWT_SECRET || "fallback_secret";
const key = new TextEncoder().encode(secretKey);

// 🧠 Session duration (15 days)
const SESSION_DURATION_MS = 15 * 24 * 60 * 60 * 1000;

// 🔑 Generate a secure random nonce (Edge-compatible)
function generateNonce() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

// 🔒 Encrypt a payload into a JWT
export async function encrypt(payload) {
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({
    ...payload,
    iat: now,
    exp: now + SESSION_DURATION_MS / 1000,
  })
    .setProtectedHeader({ alg: "HS256" })
    .sign(key);
}

// 🔓 Decrypt and verify a JWT
export async function decrypt(token) {
  const { payload } = await jwtVerify(token, key, {
    algorithms: ["HS256"],
  });
  return payload;
}

// 👤 Login helper — sets cookie securely
export async function login(user) {
  const sessionPayload = {
    user: {
      id: user._id?.toString?.() || user.id,
      email: user.email,
      role: user.role,
    },
    nonce: generateNonce(),
  };

  const session = await encrypt(sessionPayload);

  const cookieStore = await cookies(); // ✅ must be awaited
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

// 🚪 Logout helper — clears the cookie
export async function logout() {
  const cookieStore = await cookies(); // ✅ must be awaited
  cookieStore.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}

// 🧩 Get the current session (decoded JWT)
export async function getSession() {
  const cookieStore = await cookies(); // ✅ must be awaited
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  try {
    const session = await decrypt(token);
    return session;
  } catch (err) {
    if (err.code === "ERR_JWT_EXPIRED") {
      console.warn("Session expired");
    } else {
      console.error("Session decode failed:", err);
    }
    return null;
  }
}

// ♻️ Refresh or update an existing session
export async function updateSession(request) {
  const token = request.cookies.get("session")?.value;
  if (!token) return NextResponse.next();

  try {
    const parsed = await decrypt(token);
    parsed.nonce = generateNonce();

    const refreshed = await encrypt(parsed);
    const res = NextResponse.next();
    res.cookies.set("session", refreshed, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_MS / 1000,
    });

    return res;
  } catch (err) {
    console.warn("Session refresh failed:", err);
    return NextResponse.next();
  }
}

// 🔍 Check if user is authenticated
export async function isAuthenticated() {
  const session = await getSession();
  return !!session?.user;
}
