'use client';

import Sidebar from '../components/officers/sidebar';
import OfficerDashboardForm from '../components/officers/OfficerDashboardForm';

export default function OfficerDashboardPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
  

        <section className="mt-6">
         <OfficerDashboardForm/>
        </section>
      </main>
    </div>
  );
}
