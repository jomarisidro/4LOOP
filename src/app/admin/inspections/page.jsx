'use client';

import ViewTicketInspectionForm from "@/app/components/admin/ViewTicketInspectionForm";

export default function ViewTicketInspectionPage() {
  return (

    
    <div className="flex min-h-screen">
       {/* <Sidebar /> */}
      <main className="flex-1 p-6 relative">
          <ViewTicketInspectionForm />
      </main>
    </div>
  );
}
