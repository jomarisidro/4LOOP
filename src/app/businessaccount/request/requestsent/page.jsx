'use client';


import RequestSentForm from '../../../components/businessaccount/RequestSentForm';

export default function RequestSentPage() {
  return (
    <div className="min-h-screen flex">

      {/* 📄 Main Content */}
      <main className="flex-1 p-8">
        <RequestSentForm />
      </main>
    </div>
  );
}
