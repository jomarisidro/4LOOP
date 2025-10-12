'use client';

import CreateTicketInspectionForm from "@/app/components/admin/CreateTicketInspectionForm";

export default function InspectionsPage() {
  return (
    <div className="flex min-h-screen">
       {/* <Sidebar /> */}
      <main className="flex-1 p-6 relative">
          <CreateTicketInspectionForm />
      </main>
    </div>
  );
}
