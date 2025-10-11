'use client';


import NewSanitationForm from '../../../components/businessaccount/NewSanitationForm';

export default function BusinessRequestPage() {
  return (
    <div className="min-h-screen flex">
   

      {/* 📄 Main Content */}
      <main className="flex-1 p-8">
        <NewSanitationForm />
      </main>
    </div>
  );
}
