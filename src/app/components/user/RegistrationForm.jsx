'use client';

import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
import * as yup from "yup";
import RHFTextField from "@/app/components/ReactHookFormElements/RHFTextField";
import { signUpWithCompleteInfo } from "@/app/services/UserService";
import { useState } from "react";
import Link from "next/link";

// ✅ Password rules (same as ProfileForm)
const passwordRules =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

// ✅ Validation schema
const schema = yup.object().shape({
  email: yup.string().email("Provide a valid email").required("Email is required"),
  password: yup
    .string()
    .required("Password is required")
    .matches(passwordRules, {
      message:
        "Must be at least 8 chars, include uppercase, lowercase, number, and special character",
    }),
  confirmPassword: yup
    .string()
    .required("Confirm your password")
    .oneOf([yup.ref("password")], "Passwords do not match"),
});

export default function RegistrationForm() {
  const router = useRouter();
  const [emailError, setEmailError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    resolver: yupResolver(schema),
  });

  const passwordValue = watch("password");

  // ✅ Check password strength dynamically
  const checkPasswordStrength = (password) => {
    const lengthReq = password.length >= 8;
    const upperReq = /[A-Z]/.test(password);
    const lowerReq = /[a-z]/.test(password);
    const numReq = /[0-9]/.test(password);
    const specialReq = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const passed = [lengthReq, upperReq, lowerReq, numReq, specialReq].filter(Boolean).length;

    if (password.length === 0) return setPasswordStrength("");
    if (passed <= 2) return setPasswordStrength("Weak");
    if (passed === 3 || passed === 4) return setPasswordStrength("Medium");
    if (passed === 5) return setPasswordStrength("Strong");
  };

  // Watch password input for strength checking
  watch((values) => checkPasswordStrength(values.password || ""));

  // ✅ Mutation handler
  const { mutate, isLoading } = useMutation({
    mutationFn: signUpWithCompleteInfo,
    onSuccess: (data) => {
      const { email, verified } = data?.data || {};
      console.log("Registration successful:", data?.data);

      if (!verified && email) {
        router.push(`/registration/verifyemail?email=${email}`);
      } else {
        router.push("/login");
      }
    },
    onError: (err) => {
      const status = err?.response?.status;
      const errorData = err?.response?.data;

      if (status === 409 || errorData?.error === "Email already registered") {
        setEmailError("This email is already registered. Please use a different one.");
      } else {
        setEmailError("Registration failed. Please try again.");
      }
    },
  });

  const onSubmit = ({ email, password }) => {
    setEmailError("");
    mutate({ role: "business", email, password });
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: "url('/home.png')" }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-blue-900/90"></div>

      {/* Registration Form Container */}
      <div className="relative z-10 bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-semibold text-center text-gray-800 mb-6">
          Create Your Account
        </h1>

        {/* Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} autoComplete="off" className="flex flex-col gap-4">
          {/* Hidden fields to prevent autofill */}
          <input type="text" name="fakeuser" autoComplete="off" style={{ display: "none" }} />
          <input type="password" name="fakepassword" autoComplete="off" style={{ display: "none" }} />

          {/* Email */}
          <RHFTextField
            control={control}
            name="email"
            label="Email*"
            placeholder="Email*"
            type="email"
            autoComplete="off"
            error={!!errors.email || !!emailError}
            helperText={errors?.email?.message || emailError}
          />

          {/* Password (with format hint in placeholder) */}
          <div>
            <RHFTextField
              control={control}
              name="password"
              label="Password*"
              placeholder="Password (min 8 chars, A-Z, a-z, 0-9, symbol)"
              type="password"
              autoComplete="new-password"
              error={!!errors.password}
              helperText={errors?.password?.message}
            />
            {passwordStrength && (
              <p
                className={`text-sm mt-1 ${
                  passwordStrength === "Weak"
                    ? "text-red-500"
                    : passwordStrength === "Medium"
                    ? "text-yellow-600"
                    : "text-green-600"
                }`}
              >
                Password Strength: {passwordStrength}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <RHFTextField
            control={control}
            name="confirmPassword"
            label="Confirm Password*"
            placeholder="Re-enter your password"
            type="password"
            autoComplete="new-password"
            error={!!errors.confirmPassword}
            helperText={errors?.confirmPassword?.message}
          />

          {/* Register Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-blue-900 text-white py-3 rounded-md hover:bg-blue-800 transition ${
              isLoading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? "Registering..." : "Register"}
          </button>
        </form>

        {/* Footer Links */}
        <div className="text-center mt-6">
          <hr className="border-t border-gray-300 mb-4" />
          <p className="text-sm text-gray-700 mb-2">
            Already have an account? <span className="font-semibold">Login Now!</span>
          </p>
          <Link href="/login">
            <div className="inline-block px-6 py-2 bg-blue-50 text-blue-600 border border-blue-400 rounded-md font-medium hover:bg-blue-100 hover:text-blue-800 transition">
              Click Here!
            </div>
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-10 text-center text-xs text-gray-400">
          © 2025 CITY GOVERNMENT OF PASIG
        </footer>
      </div>
    </div>
  );
}
