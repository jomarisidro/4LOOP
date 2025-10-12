'use client';

import { Box, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import CompletedRequestForm from '../../components/admin/CompletedForm';

export default function CompletedRequestPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/admin');
  };

  return (
    <div className="min-h-screen flex relative">
      {/* 📄 Main Content */}
      <main className="flex-1 p-8 relative">
        {/* 🔙 Back Button */}
        <Button
          variant="outlined"
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          ← Back to Officers Dashboard
        </Button>

        <CompletedRequestForm />
      </main>
    </div>
  );
}
