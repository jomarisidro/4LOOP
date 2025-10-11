'use client';

import Link from "next/link";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Button from "@mui/material/Button";
import RHFTextField from "@/app/components/ReactHookFormElements/RHFTextField";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Typography, Box } from "@mui/material";

const schema = yup.object().shape({
  email: yup
    .string()
    .email("Provide valid email")
    .required("Email is required"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters"),
});

const LoginForm = () => {
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
        credentials: "include", // ✅ ensures cookies are sent and stored
      });

      const data = await res.json();
      console.log("🔐 Login response:", data);

      if (!res.ok) {
        setLoginError(data.error || "Login failed.");
        return;
      }

      const { user } = data;
      console.log("🧾 User data from backend:", user); // 👈 ADD THIS LINE

      if (!user?._id || !user?.role) {
        setLoginError("Invalid user data received.");
        return;
      }

      // ✅ Store session info locally (optional)
      sessionStorage.setItem("userId", user._id);
      sessionStorage.setItem("userRole", user.role);
      localStorage.setItem("loggedUserId", user._id);
      localStorage.setItem("loggedUserRole", user.role);

      // ✅ Small delay to ensure session cookie is set
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 🚀 Redirect user based on their role
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
          router.push("/login"); // fallback
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      setLoginError("Something went wrong during login.");
    }
  };

  return (
    <Box className="max-w-96 w-full mx-auto mt-12">
      <Typography variant="h5" align="center" gutterBottom>
        Login to Your Account
      </Typography>

      <form className="login-form form-container" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-4">
          <RHFTextField
            control={control}
            name="email"
            label="Email*"
            placeholder="Email*"
            error={!!errors.email}
            helperText={errors?.email?.message}
            type="email"
          />

          <RHFTextField
            control={control}
            name="password"
            label="Password*"
            placeholder="Password*"
            error={!!errors.password}
            helperText={errors?.password?.message}
            type="password"
          />

          {loginError && (
            <Typography color="error" variant="body2">
              {loginError}
            </Typography>
          )}

          <div className="flex gap-4 justify-center mt-4">
            <Button type="submit" variant="contained">
              Login
            </Button>
            <Link href="/registration" passHref>
              <Button variant="outlined" color="secondary">
                Register
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </Box>
  );
};

export default LoginForm;
