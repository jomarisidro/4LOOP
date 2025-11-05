'use client';

import { useRouter } from 'next/navigation';
import { Typography, Button, Stack, Box } from '@mui/material';

export default function LogoutForm() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // 🔒 Call backend to clear session cookie
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      // 🧹 Optional: Clear localStorage hints
      localStorage.removeItem("loggedUserId");
      localStorage.removeItem("loggedUserRole");
      localStorage.removeItem("profilePicture");

      // 🚪 Redirect to login
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      // Optionally show error to user
    }
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
          onClick={() => router.push('/admin')}
        >
          Cancel
        </Button>
      </Stack>
    </Box>
  );
}
