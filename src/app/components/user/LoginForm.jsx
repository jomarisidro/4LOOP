'use client';
import Link from "next/link";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import RHFTextField from "@/app/components/ReactHookFormElements/RHFTextField";
import { useRouter } from "next/navigation";
import { useState } from "react";

const loginSchema = yup.object().shape({
  email: yup.string().email("Provide valid email").required("Email is required"),
  password: yup.string().required("Password is required").min(8, "Password must be at least 8 characters"),
});

const changePasswordSchema = yup.object().shape({
  email: yup.string().email("Provide valid email").required("Email is required"),
  oldPassword: yup.string().required("Old password is required"),
  newPassword: yup
    .string()
    .required("New password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/,
      "Must include uppercase, lowercase, number & special character"
    ),
  confirmPassword: yup
    .string()
    .required("Confirm new password")
    .oneOf([yup.ref("newPassword")], "Passwords do not match"),
});

export default function LoginForm() {
  const router = useRouter();
  const [loginError, setLoginError] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // ✅ React Hook Form setup (will dynamically swap schema)
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    resolver: yupResolver(showChangePassword ? changePasswordSchema : loginSchema),
  });

  // ==========================
  // LOGIN SUBMIT
  // ==========================
  const onSubmitLogin = async ({ email, password }) => {
    setLoginError("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
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

      if (user.role === "officer" && user.accountDisabled === true) {
        setLoginError("Your account has been locked by the admin.");
        return;
      }

      // Save user info
      sessionStorage.setItem("userId", user._id);
      sessionStorage.setItem("userRole", user.role);
      localStorage.setItem("loggedUserId", user._id);
      localStorage.setItem("loggedUserRole", user.role);

      // Redirect based on role
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

  // ==========================
  // CHANGE PASSWORD SUBMIT
  // ==========================
const onSubmitChangePassword = async ({ email, oldPassword, newPassword }) => {
  setLoginError("");
  setSuccessMessage("");

  try {
    const userId = sessionStorage.getItem("userId");

    const res = await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "forgotPassword",
        email,
        oldPassword,
        newPassword,
        confirmPassword: newPassword,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setLoginError(data.error || "Password change failed.");
      return;
    }

    // ✅ Success message appears briefly
    setSuccessMessage("Password changed successfully! You can now log in.");
    setLoginError("");
    reset();

    // Hide success message and go back to login form after 3 seconds
    setTimeout(() => {
      setSuccessMessage("");
      setShowChangePassword(false);
    }, 3000);
  } catch (error) {
    console.error("Change password error:", error);
    setLoginError("Something went wrong. Please try again.");
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

      {/* FORM CARD */}
      <div className="relative z-10 bg-white p-8 rounded-lg shadow-lg w-full max-w-md -mt-20">
        <h1 className="text-2xl font-semibold text-center text-gray-800 mb-6">
          {showChangePassword ? "Change Your Password" : "Login to Your Account"}
        </h1>

        <form
          onSubmit={handleSubmit(
            showChangePassword ? onSubmitChangePassword : onSubmitLogin
          )}
          className="flex flex-col gap-4"
        >
          {/* Email Field */}
          <RHFTextField
            control={control}
            name="email"
            label="Email*"
            placeholder="Email*"
            type="email"
            error={!!errors.email}
            helperText={errors?.email?.message}
          />

          {!showChangePassword ? (
            <>
              {/* Password Field */}
              <RHFTextField
                control={control}
                name="password"
                label="Password*"
                placeholder="Password*"
                type="password"
                error={!!errors.password}
                helperText={errors?.password?.message}
              />

              {/* Forgot Password link */}
              <div className="text-right mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(true);
                    setLoginError("");
                    setSuccessMessage("");
                    reset();
                  }}
                  className="text-sm text-blue-700 hover:text-blue-900 font-medium"
                >
                  Forgot Password?
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Old Password */}
              <RHFTextField
                control={control}
                name="oldPassword"
                label="Old Password*"
                placeholder="Enter your old password"
                type="password"
                error={!!errors.oldPassword}
                helperText={errors?.oldPassword?.message}
              />

              {/* New Password */}
              <RHFTextField
                control={control}
                name="newPassword"
                label="New Password*"
                placeholder="New password (8+ chars, A-Z, a-z, #)"
                type="password"
                error={!!errors.newPassword}
                helperText={errors?.newPassword?.message}
              />

              {/* Confirm Password */}
              <RHFTextField
                control={control}
                name="confirmPassword"
                label="Confirm New Password*"
                placeholder="Re-enter new password"
                type="password"
                error={!!errors.confirmPassword}
                helperText={errors?.confirmPassword?.message}
              />

              {/* Back to Login */}
              <div className="text-right mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setLoginError("");
                    setSuccessMessage("");
                    reset();
                  }}
                  className="text-sm text-blue-700 hover:text-blue-900 font-medium"
                >
                  ← Back to Login
                </button>
              </div>
            </>
          )}

          {/* Errors / Success */}
          {loginError && (
            <p className="text-red-600 text-sm text-center">{loginError}</p>
          )}
          {successMessage && (
            <p className="text-green-600 text-sm text-center">{successMessage}</p>
          )}

          {/* Buttons */}
          <div className="flex gap-4 justify-center mt-4">
            <button
              type="submit"
              className="bg-blue-900 text-white px-6 py-2 rounded-md hover:bg-blue-800 transition"
            >
              {showChangePassword ? "Change Password" : "Login"}
            </button>

            {!showChangePassword && (
              <Link href="/registration">
                <button
                  type="button"
                  className="border border-blue-900 text-blue-900 px-6 py-2 rounded-md hover:bg-blue-50 transition"
                >
                  Register
                </button>
              </Link>
            )}
          </div>
        </form>

        <footer className="mt-10 text-center text-xs text-gray-400">
          © 2025 CITY GOVERNMENT OF PASIG
        </footer>
      </div>
    </div>
  );
}
