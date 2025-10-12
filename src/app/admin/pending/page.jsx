'use client';

import { Box, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import ViewPendingForm from '../../components/admin/ViewPendingForm';

export default function ViewPendingPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/admin');
  };

  return (
    <div className="min-h-screen flex">
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

        <ViewPendingForm />
      </main>
    </div>
  );
}
