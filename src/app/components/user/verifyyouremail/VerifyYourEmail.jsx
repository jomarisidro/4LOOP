'use client';

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";

export default function VerifyYourEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [resendMsg, setResendMsg] = useState("");

  useEffect(() => {
    if (!email) router.push("/login");
  }, [email, router]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await axios.post("/api/verify", { email, code });
      if (res.status === 200) {
        setMessage("✅ Email verified successfully! Redirecting to login...");
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch (err) {
      setMessage(err.response?.data?.error || "❌ Invalid or expired verification code.");
    }
  };

  const handleResend = async () => {
    try {
      setResendMsg("Sending new code...");
      await axios.post("/api/resend-code", { email });
      setResendMsg("✅ A new verification code has been sent to your email.");
    } catch {
      setResendMsg("❌ Failed to resend code. Try again later.");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: "url('/home.png')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-blue-900/90"></div>

      <div className="relative bg-white p-8 rounded-lg shadow-lg w-full max-w-md z-10 text-center">
        <h1 className="text-2xl font-semibold mb-2 text-gray-800">Verify Your Email</h1>
        <p className="text-sm text-gray-600 mb-4">
          We’ve sent a 6-digit verification code to{" "}
          <span className="font-semibold">{email}</span>.
          <br />Please check your inbox or spam folder.
        </p>

        <form onSubmit={handleVerify} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Enter verification code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm text-center"
          />
          <button
            type="submit"
            className="bg-blue-900 text-white py-2 rounded-md hover:bg-blue-800 transition"
          >
            Verify Email
          </button>
        </form>

        {message && (
          <p
            className={`text-sm mt-3 ${
              message.startsWith("✅") ? "text-green-700" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}

        <button
          onClick={handleResend}
          className="text-blue-700 text-sm mt-4 underline hover:text-blue-900"
        >
          Resend Verification Code
        </button>

        {resendMsg && <p className="text-xs text-gray-600 mt-1">{resendMsg}</p>}
      </div>

      <footer className="text-white text-xs mt-10 z-10">
        © 2025 CITY GOVERNMENT OF PASIG
      </footer>
    </div>
  );
}
