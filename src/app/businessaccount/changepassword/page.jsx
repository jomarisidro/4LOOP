'use client';

import Sidebar from '../../components/businessaccount/sidebar';
import ChangePasswordForm from "@/app/components/businessaccount/ChangePasswordForm";

export default function ChangePasswordPage() {
  return (
    <div className="min-h-screen flex bg-gray-100">
      <Sidebar />

      <main className="flex justify-center items-center flex-1 p-6">
        <ChangePasswordForm />
      </main>
    </div>
  );
}
