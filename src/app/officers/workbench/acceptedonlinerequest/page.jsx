'use client';
export const dynamic = "force-dynamic";
import AcceptedOnlineRequestForm from '../../../components/officers/AcceptedOnlineRequestForm';

export default function AcceptedOnlineRequestPage() {
  return (
    <main className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <AcceptedOnlineRequestForm />
    </main>
  );
}
