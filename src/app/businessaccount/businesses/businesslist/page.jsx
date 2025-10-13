'use client';

import { usePathname } from 'next/navigation';
import BusinesslistForm from '../../../components/businessaccount/BusinesslistForm';

export default function BusinessListPage() {

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">

      <main className="flex-grow p-8 relative">
        <BusinesslistForm />
      </main>
    </div>
  );
}
