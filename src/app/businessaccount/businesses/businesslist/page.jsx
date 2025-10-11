'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '../../../components/businessaccount/sidebar';
import BusinesslistForm from '../../../components/businessaccount/BusinesslistForm';

export default function BusinessListPage() {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      <Sidebar activePath={pathname} />

      <main className="flex-grow p-8 relative">
        <BusinesslistForm />
      </main>
    </div>
  );
}
