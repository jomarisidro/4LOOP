'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '../../../components/businessaccount/sidebar';
import AddbusinessForm from '../../../components/businessaccount/AddbusinessForm';

export default function AddBusinessPage() {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      <Sidebar activePath={pathname} />
      <main className="flex-grow p-8 relative">
        <AddbusinessForm />
      </main>
    </div>
  );
}
