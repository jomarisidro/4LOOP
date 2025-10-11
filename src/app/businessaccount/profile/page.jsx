'use client';

import Sidebar from '../../components/businessaccount/sidebar';
import ProfileSettingsForm from '../../components/businessaccount/ProfileForm';

export default function ProfileSettingsPage() {
  return (
    <div className="min-h-screen flex relative">
      <Sidebar />
      <main className="flex-1 p-8">
        <ProfileSettingsForm />
      </main>
    </div>
  );
}
