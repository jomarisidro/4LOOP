'use client';

import Sidebar from '../../components/officers/sidebar';
import ProfileSettingsForm from '../../components/officers/ProfileForm';

export default function ProfileSettingsPage() {
  return (
    <div className="min-h-screen flex relative">
      {/* 🧭 Sidebar */}
      <Sidebar />

      {/* 📄 Main Content */}
      <main className="flex-1 p-8">
        <ProfileSettingsForm />
      </main>
    </div>
  );
}
