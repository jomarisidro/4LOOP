'use client';

import PendingRequestForm from '../../components/businessaccount/PendingForm';

export default function PendingRequestPage() {
  return (
    <div className="min-h-screen flex">
    

      {/* 📄 Main Content */}
      <main className="flex-1 p-8">
        <PendingRequestForm />
      </main>
    </div>
  );
}
