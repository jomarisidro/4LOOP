'use client';

import { useRouter } from 'next/navigation';
import { Typography, Button, Stack, Box } from '@mui/material';

const tickets = [
  { label: 'Inspect Business', path: '/officers/inspections/createticketinspection' },
  { label: 'Pending Inspections', path: '/officers/inspections/pendinginspections' },

];

export default function InspectionsForm() {
  const router = useRouter();

  const handleNavigate = (path) => {
    router.push(path);
  };


  return (
    <Box p={4}>

  

      {/* 🧭 Title */}
      <Typography variant="h4" fontWeight="bold" mb={2}>
        Ticket For Inspections
      </Typography>

      {/* 🔘 Navigation Buttons */}
      <Stack direction="row" spacing={2} flexWrap="wrap">
        {tickets.map((ticket) => (
          <Button
            key={ticket.label}
            variant="contained"
            color="primary"
            onClick={() => handleNavigate(ticket.path)}
          >
            {ticket.label}
          </Button>
        ))}
      </Stack>
    </Box>
  );
}
