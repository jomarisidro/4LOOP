"use client";
import React, { useState } from 'react';
import LoginForm from "@/app/components/user/LoginForm";

export default function LoginPage() {
  const [loginError, setLoginError] = useState("");

  return (
    <div>
      <main>
        {loginError && (
          <p className="text-red-500 font-medium">{loginError}</p>
        )}

        <LoginForm setLoginError={setLoginError} />
      </main>
    </div>
  );
}
