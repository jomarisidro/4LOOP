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

// ✅ Validation schema
const schema = yup.object().shape({
  email: yup.string().email("Provide a valid email").required("Email is required"),
  password: yup.string().required("Password is required").min(8, "Minimum 8 characters"),
  confirmPassword: yup
    .string()
    .required("Confirm your password")
    .oneOf([yup.ref("password")], "Passwords do not match"),
});

export default function RegistrationForm() {
  const router = useRouter();
  const [emailError, setEmailError] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    resolver: yupResolver(schema),
  });

  // ✅ Register mutation
  const { mutate, isLoading } = useMutation({
    mutationFn: signUpWithCompleteInfo,
    onSuccess: (data) => {
      // When registration succeeds, redirect to verify email page
      if (data?.data?.email) {
        router.push(`/registration/verifyemail?email=${encodeURIComponent(data.data.email)}`);
      } else {
        router.push("/registration/verifyemail");
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

  // ✅ Submit handler
  const onSubmit = ({ email, password }) => {
    setEmailError("");
    mutate({ role: "business", email, password });
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: "url('/home.png')" }}
    >
      {/* Overlay for contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-blue-900/90"></div>

      {/* Left Section (Pasig Branding) */}
      <div
        className="w-full absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/home.png')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>

        <div className="relative z-10 h-full flex flex-col justify-center px-10 text-white">
          <div>
            <h1 className="text-5xl font-semibold leading-tight">PASIG CITY</h1>
            <h2 className="text-4xl font-light leading-tight mt-2">SANITATION</h2>
            <h2 className="text-4xl font-light leading-tight">ONLINE SERVICE</h2>
          </div>
        </div>
      </div>

      {/* Registration Form */}
      <div className="relative z-10 bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-semibold text-center text-gray-800 mb-6">
          Create Your Account
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} autoComplete="off" className="flex flex-col gap-4">
          <input type="text" name="fakeuser" autoComplete="off" style={{ display: "none" }} />
          <input type="password" name="fakepassword" autoComplete="off" style={{ display: "none" }} />

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

          <RHFTextField
            control={control}
            name="password"
            label="Password*"
            placeholder="Password*"
            type="password"
            autoComplete="new-password"
            error={!!errors.password}
            helperText={errors?.password?.message}
          />

          <RHFTextField
            control={control}
            name="confirmPassword"
            label="Confirm Password*"
            placeholder="Confirm Password*"
            type="password"
            autoComplete="new-password"
            error={!!errors.confirmPassword}
            helperText={errors?.confirmPassword?.message}
          />

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

        <footer className="mt-10 text-center text-xs text-gray-400">
          © 2025 CITY GOVERNMENT OF PASIG
        </footer>
      </div>
    </div>
  );
}
