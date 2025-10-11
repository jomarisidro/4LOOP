'use client';

import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from 'next/navigation';
import * as yup from "yup";
import Button from '@mui/material/Button';
import RHFTextField from "@/app/components/ReactHookFormElements/RHFTextField";
import { signUpWithCompleteInfo } from "@/app/services/UserService";
import { useState } from "react";

const schema = yup.object().shape({
  email: yup.string().email("Provide valid email").required("Email is required"),
  password: yup.string().required('Password required').min(8, 'Minimum 8 characters'),
  confirmPassword: yup.string().required("Confirm password").oneOf([yup.ref('password')], 'Passwords do not match'),
});

export default function RegistrationForm() {
  const router = useRouter();
  const [emailError, setEmailError] = useState("");

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    resolver: yupResolver(schema),
  });

  const { mutate } = useMutation({
    mutationFn: signUpWithCompleteInfo,
    onSuccess: () => {
      router.push("/login");
    },
    onError: async (err) => {
      const status = err?.response?.status;
      const errorData = err?.response?.data;

      if (status === 409 || errorData?.error === "Email already registered") {
        setEmailError("This email is already registered. Please use a different one.");
      } else {
        console.error("Unexpected registration error:", err);
        setEmailError("Registration failed. Please try again.");
      }
    }
  });

  const onSubmit = ({ email, password }) => {
    setEmailError("");
    // Hard-code role as "business"
    mutate({ role: "business", email, password });
  };

  return (
    <div className='max-w-96 w-full mx-auto'>
      <h1 className="title">TO CREATE AN ACCOUNT, KINDLY FILL IN ALL THE REQUIRED INFORMATION</h1>
      <form className="login-form form-container" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-4">

          <RHFTextField
            control={control}
            name="email"
            label="Email*"
            placeholder="Email*"
            error={!!errors.email || !!emailError}
            helperText={errors?.email?.message || emailError}
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

          <RHFTextField
            control={control}
            name="confirmPassword"
            label="Confirm Password*"
            placeholder="Confirm Password*"
            error={!!errors.confirmPassword}
            helperText={errors?.confirmPassword?.message}
            type="password"
          />

          <div className="flex gap-4 justify-center">
            <Button type="submit" variant="contained">Register</Button>
          </div>

          <div className="mt-8 text-center">
            <hr className="border-t border-gray-300 mb-4" />
            <p className="text-sm text-gray-700 mb-2">
              Already have an account? <span className="font-semibold">Login Now!</span>
            </p>
            <a href="/login">
              <div className="inline-block px-6 py-2 bg-blue-50 text-blue-600 border border-blue-400 rounded-md font-medium hover:bg-blue-100 hover:text-blue-800 transition">
                Click Here!
              </div>
            </a>
          </div>
        </div>
      </form>
    </div>
  );
}
