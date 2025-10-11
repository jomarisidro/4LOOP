'use client';

import { useRouter } from 'next/navigation';
import { Typography, Button, Stack, Box } from '@mui/material';

const steps = [
  { label: 'Online Requests', path: '/officers/workbench/onlinerequest' },
  { label: 'Verifications', path: '/officers/workbench/verification' },
  { label: 'Encoding', path: '/officers/workbench/encoding' },
  { label: 'Permit Approval', path: '/officers/workbench/permitapproval' },
  { label: 'Release', path: '/officers/workbench/release' },
];

export default function WorkbenchForm() {
  const router = useRouter();

  const handleNavigate = (path) => {
    router.push(path);
  };

  const handleBack = () => {
    router.push('/officers');
  };

  return (
    <Box p={4}>

      {/* 🔙 Back Button */}
      <Button variant="outlined" color="inherit" onClick={handleBack} sx={{ mb: 4 }}>
        ← Back
      </Button>

      {/* 🧭 Title */}
      <Typography variant="h4" fontWeight="bold" mb={2}>
        Officer Workbench
      </Typography>

      {/* 🔘 Navigation Buttons */}
      <Stack direction="row" spacing={2} flexWrap="wrap">
        {steps.map((step) => (
          <Button
            key={step.label}
            variant="contained"
            color="primary"
            onClick={() => handleNavigate(step.path)}
          >
            {step.label}
          </Button>
        ))}
      </Stack>
    </Box>
  );
}
