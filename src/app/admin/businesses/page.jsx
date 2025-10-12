'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Button } from '@mui/material';
import BusinessesForm from '../../components/admin/BusinessesForm';

export default function BusinessesPage() {
  const router = useRouter();
  const [selectedOwner, setSelectedOwner] = useState(null);

  const handleBackToOfficers = () => {
    router.push('/admin');
  };

  const handleBackToList = () => {
    setSelectedOwner(null);
  };

  return (
    <Box p={4} sx={{ position: 'relative' }}>
 
      {/* 🔙 Back to Officers Dashboard — only show when not viewing details */}
      {!selectedOwner && (
        <Button variant="outlined" onClick={handleBackToOfficers} sx={{ mb: 2 }}>
          ← Back to Officers Dashboard
        </Button>
      )}

      <Typography variant="h6" fontWeight="medium" mb={2}>
        Registered Business Owners
      </Typography>

      <BusinessesForm
        selectedOwner={selectedOwner}
        onSelectOwner={setSelectedOwner}
        onBack={handleBackToList}
      />
    </Box>
  );
}
