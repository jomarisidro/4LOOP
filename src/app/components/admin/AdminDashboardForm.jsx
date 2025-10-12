'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';
export default function AdminForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const role = localStorage.getItem("loggedUserRole");
      const userId = localStorage.getItem("loggedUserId");

      if (role === "admin" && userId) {
        setIsAdmin(true);
      } else {
        router.push("/login");
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <Box mt={4} textAlign="center">
        <CircularProgress />
        <Typography mt={2}>Checking access...</Typography>
      </Box>
    );
  }

  if (!isAdmin) {
    return null; // already redirected
  }


  
  return (  
    <>
      <h1 className="text-2xl font-semibold mb-6">Welcome to Admin Dashboard</h1>
      <div>
        <h2 className="text-xl font-semibold mb-4">Admin Information</h2>
        <h1 className="text-lg font-medium">WELCOME</h1>
      </div>
    </>
  );
}
