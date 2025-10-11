'use client';

import Sidebar from '@/app/components/businessaccount/sidebar';
import BusinessRequestForm from '../../components/businessaccount/RequestForm';

export default function BusinessRequestPage() {
  return (
    <div className="min-h-screen flex">
      {/* 🧭 Sidebar */}
      <Sidebar/>

      {/* 📄 Main Content */}
      <main className="flex-1 p-8">
        <BusinessRequestForm />
      </main>
    </div>
  );
}
