'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Typography,
  Box,
  Paper,
  Button,
  Stack,
  CircularProgress,
} from '@mui/material';
import { getSanitationOnlineRequest } from '@/app/services/OnlineRequest';

export default function OnlineRequestsForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['online-request'],
    queryFn: async () => {
      const onlinerequest = await getSanitationOnlineRequest();
      const allRequests = [...(onlinerequest?.data || [])];
      // Show all submitted requests
      return allRequests.filter((req) => req.status === 'submitted');
    },
    refetchInterval: 5000,
  });

  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (data) {
      setRequests(data);
    }
  }, [data]);

  // 🔑 Open request instead of accept
  const handleOpenRequest = (_id) => {
    const opened = requests.find((req) => req._id === _id);
    console.log('📂 Opened request:', opened);

    // Optionally store last opened request
    localStorage.setItem('openedRequestId', _id);

    // Navigate to details page
    router.push(`/officers/workbench/acceptedonlinerequest?id=${_id}`);
  };

  const handleNavigate = (path) => {
    router.push(path);
  };

  return (
    <Box position="relative" p={2}>
      {/* 🔙 Back Button */}
      <Button
        variant="outlined"
        onClick={() => router.push('/officers/workbench')}
        sx={{ mb: 2 }}
      >
        ← Back
      </Button>

      {/* 🚀 Quick Navigation */}
      <Stack
        direction="row"
        spacing={2}
        sx={{ position: 'absolute', top: 16, right: 16 }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleNavigate('/officers/workbench/verification')}
        >
          Go to Verifications
        </Button>
      </Stack>

      {/* 📄 Title */}
      <Typography variant="h6" fontWeight="bold" mb={2} mt={6}>
        📄 View Online Requests
      </Typography>

      {/* ⏳ Loading State */}
      {isLoading && (
        <Stack alignItems="center" mt={4}>
          <CircularProgress />
          <Typography variant="body2" mt={2}>
            Loading requests...
          </Typography>
        </Stack>
      )}

      {/* ❌ Error State */}
      {isError && (
        <Typography variant="body2" color="error" mt={2}>
          Error fetching requests: {error.message}
        </Typography>
      )}

      {/* 🧾 Request List */}
      {!isLoading && !isError && requests.length > 0 ? (
        <Stack spacing={4}>
          {requests.map((req) => (
            <Paper
              key={req._id}
              elevation={2}
              sx={{ p: 2, borderLeft: '6px solid #1976d2' }}
            >
              <Typography variant="subtitle1">
                <b>Request Type:</b> {req.requestType}
              </Typography>
              <Typography variant="subtitle1">
                <b>BID Number:</b> {req.bidNumber}
              </Typography>
              <Typography variant="subtitle1">
                <b>Name of Company:</b> {req.businessName}
              </Typography>
              <Typography variant="subtitle1">
                <b>Trade Name:</b> {req.businessNickname}
              </Typography>
              <Typography variant="subtitle1">
                <b>Business Type:</b> {req.businessType}
              </Typography>
              <Typography variant="subtitle1">
                <b>Address:</b> {req.businessAddress}
              </Typography>
              <Typography variant="subtitle1">
                <b>Submitted on:</b>{' '}
                {new Date(req.createdAt).toLocaleString('en-PH')}
              </Typography>

              <Button
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
                onClick={() => handleOpenRequest(req._id)}
              >
                Open Request
              </Button>
            </Paper>
          ))}
        </Stack>
      ) : (
        !isLoading &&
        !isError && (
          <Typography variant="body2" color="text.secondary" mt={4}>
            No pending online requests at the moment.
          </Typography>
        )
      )}
    </Box>
  );
}
