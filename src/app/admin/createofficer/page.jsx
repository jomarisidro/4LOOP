'use client';

import Sidebar from '../../components/admin/sidebar';
import CreateOfficerForm from '@/app/components/admin/CreateOfficerform';

export default function ProfileSettingsPage() {
  return (
    <div className="min-h-screen flex relative">
      {/* 🧭 Sidebar */}
      <Sidebar />

      {/* 📄 Main Content */}
      <main className="flex-1 p-8">
        <CreateOfficerForm />
      </main>
    </div>
  );
}
