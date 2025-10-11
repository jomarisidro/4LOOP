'use client';

import Sidebar from '../../components/officers/sidebar';
import LogoutForm from '../../components/officers/LogoutForm';

export default function LogoutPage() {
  return (
    <div className="min-h-screen flex relative">
      {/* 🧭 Sidebar */}
      <Sidebar />

      {/* 📄 Main Content */}
      <main className="flex-1 p-8 flex items-center justify-center">
        <LogoutForm />
      </main>
    </div>
  );
}
