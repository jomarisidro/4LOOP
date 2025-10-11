'use client';

import { useRouter } from 'next/navigation';
import { Typography, Button, Stack, Box } from '@mui/material';

export default function LogoutForm() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("loggedUserId");
    localStorage.removeItem("profilePicture");
    // 🔒 Insert your logout logic here (e.g. clearing tokens, session)
    router.push('http://localhost:3000/login'); // Redirect to login page
  };

  return (
    <Box textAlign="center">
      <Typography variant="h4" fontWeight="bold" mb={2}>
        Log Out
      </Typography>

      <Typography variant="body1" color="text.secondary" mb={4}>
        Are you sure you want to log out from your profile?
      </Typography>

      <Stack direction="row" spacing={2} justifyContent="center">
        <Button variant="contained" color="error" onClick={handleLogout}>
          Yes, Log Out
        </Button>
        <Button
          variant="contained"
          color="inherit"
          onClick={() => router.push('/businessaccount')} // ✅ Redirect to dashboard
        >
          Cancel
        </Button>
      </Stack>
    </Box>
  );
}
