'use client';
import Link from "next/link";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import RHFTextField from "@/app/components/ReactHookFormElements/RHFTextField";
import { useRouter } from "next/navigation";
import { useState } from "react";

const schema = yup.object().shape({
  email: yup.string().email("Provide valid email").required("Email is required"),
  password: yup.string().required("Password is required").min(8, "Password must be at least 8 characters"),
});

export default function LoginForm() {
  const router = useRouter();
  const [loginError, setLoginError] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: yupResolver(schema),
  });

  const onSubmit = async ({ email, password }) => {
    setLoginError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        // ✅ Handle unverified account
        if (res.status === 403 && data.error?.includes("not verified")) {
          router.push(`/registration/verifyemail?email=${encodeURIComponent(email)}`);
          return;
        }

        setLoginError(data.error || "Login failed.");
        return;
      }

      const { user } = data;

      if (!user?._id || !user?.role) {
        setLoginError("Invalid user data received.");
        return;
      }

      // ✅ Check if officer account is disabled
      if (user.role === "officer" && user.accountDisabled === true) {
        setLoginError("Your account has been locked by the admin.");
        return;
      }

      // ✅ Save user session
      sessionStorage.setItem("userId", user._id);
      sessionStorage.setItem("userRole", user.role);
      localStorage.setItem("loggedUserId", user._id);
      localStorage.setItem("loggedUserRole", user.role);

      await new Promise((resolve) => setTimeout(resolve, 300));

      // ✅ Redirect based on role
      switch (user.role.toLowerCase()) {
        case "admin":
          router.push("/admin");
          break;
        case "business":
          router.push("/businessaccount");
          break;
        case "officer":
          router.push("/officers");
          break;
        default:
          router.push("/login");
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("Something went wrong during login.");
    }
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: "url('/home.png')" }}
    >
      {/* Overlay for contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-blue-900/90"></div>

      {/* LEFT TEXT SECTION */}
      <div className="absolute inset-0 z-0 flex flex-col justify-center px-10 text-white -mt-10">
        <div>
          <h1 className="text-5xl font-semibold leading-tight">PASIG CITY</h1>
          <h2 className="text-4xl font-light leading-tight mt-2">SANITATION</h2>
          <h2 className="text-4xl font-light leading-tight">ONLINE SERVICE</h2>
        </div>
      </div>

      {/* LOGIN FORM */}
      <div className="relative z-10 bg-white p-8 rounded-lg shadow-lg w-full max-w-md -mt-20">
        <h1 className="text-2xl font-semibold text-center text-gray-800 mb-6">
          Login to Your Account
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <RHFTextField
            control={control}
            name="email"
            label="Email*"
            placeholder="Email*"
            type="email"
            error={!!errors.email}
            helperText={errors?.email?.message}
          />

          <RHFTextField
            control={control}
            name="password"
            label="Password*"
            placeholder="Password*"
            type="password"
            error={!!errors.password}
            helperText={errors?.password?.message}
          />

          {loginError && (
            <p className="text-red-600 text-sm text-center">{loginError}</p>
          )}

          <div className="flex gap-4 justify-center mt-4">
            <button
              type="submit"
              className="bg-blue-900 text-white px-6 py-2 rounded-md hover:bg-blue-800 transition"
            >
              Login
            </button>
            <Link href="/registration">
              <button
                type="button"
                className="border border-blue-900 text-blue-900 px-6 py-2 rounded-md hover:bg-blue-50 transition"
              >
                Register
              </button>
            </Link>
          </div>
        </form>

        <footer className="mt-10 text-center text-xs text-gray-400">
          © 2025 CITY GOVERNMENT OF PASIG
        </footer>
      </div>
    </div>
  );
}
