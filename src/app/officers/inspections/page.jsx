'use client';

import InspectionsForm from '../../components/officers/InspectionsForm';

export default function InspectionsPage() {
  return (
    <div className="flex min-h-screen">
       {/* <Sidebar /> */}
      <main className="flex-1 p-6 relative">

          <InspectionsForm />
       
      </main>
    </div>
  );
}
