'use client';

import CompletedRequestForm from '../../components/businessaccount/CompletedForm';

export default function CompletedRequestPage() {
  return (
    <div className="min-h-screen flex relative">

      {/* 📄 Main Content */}
      <main className="flex-1 p-8">
        <CompletedRequestForm />
      </main>
    </div>
  );
}
