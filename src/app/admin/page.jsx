'use client';
import Sidebar from '../components/admin/sidebar';
import AdminDashboardForm from '../components/admin/AdminDashboardForm';

export default function AdminDashboardPage() {

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        <section className="mt-6">
          <AdminDashboardForm />
        </section>
      </main>
    </div>
  );
}
