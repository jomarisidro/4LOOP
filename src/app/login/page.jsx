"use client";
import React, { useState } from 'react';
import LoginForm from "@/app/components/user/LoginForm";

export default function LoginPage() {
  const [loginError, setLoginError] = useState("");

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-xl font-bold">WELCOME!</h1>

        {loginError && (
          <p className="text-red-500 font-medium">{loginError}</p>
        )}

        <LoginForm setLoginError={setLoginError} />
      </main>
    </div>
  );
}
