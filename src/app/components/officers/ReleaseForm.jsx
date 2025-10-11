'use client';
import { getSanitationOnlineRequest } from '@/app/services/OnlineRequest';
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

export default function ReleaseForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['release-requests'],
    queryFn: async () => {
      const onlinerequest = await getSanitationOnlineRequest();
      const allRequests = [...(onlinerequest?.data || [])];

      const pending = allRequests.filter(req => req.status === 'completed');

      const uniqueRequests = Array.from(
        new Map(
          pending.map(req => [`${req._id}`, req])
        ).values()
      );

      return uniqueRequests;
    },
    refetchInterval: 5000,
  });

  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (data) setRequests(data);
  }, [data]);

  const handleVerify = async (_id) => {
    const release = requests.find((req) => req._id === _id);
    console.log('Release of Permit', release);

    try {
      const res = await fetch(`/api/officer/${_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });


      localStorage.setItem('releaseRequestId', _id);
      router.push(`/officers/workbench/releaseofpermit?id=${_id}`);
    } catch (err) {
      console.error('❌ Failed to update status:', err);
    }

    setRequests((prev) =>
      prev.filter((req) => !(req._id === _id))
    );

    queryClient.invalidateQueries(['release-requests']);
  };

  return (
    <Box p={2}>
    
  <Box component="span" sx={{ display: 'inline-block', verticalAlign: 'middle', mr: 2 }}>
    <Button variant="outlined" color="secondary" onClick={() => router.push('/officers/workbench')}>
      ← Back to Workbench
    </Button>
  </Box>

  <Box component="span" sx={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <Typography variant="h6" fontWeight="bold">
      🧾 Requests Awaiting to be Released
    </Typography>
  </Box>



      {isLoading && (
        <Stack alignItems="center" mt={4}>
          <CircularProgress />
          <Typography mt={2}>Loading requests...</Typography>
        </Stack>
      )}

      {isError && (
        <Typography color="error" mt={2}>
          Error loading requests: {error.message}
        </Typography>
      )}

      {!isLoading && !isError && requests.length > 0 ? (
        <Stack spacing={4}>
          {requests.map((req) => (
            <Paper key={`${req._id}`} sx={{ p: 2 }}>
              <Typography variant="subtitle1"><b>Request Type:</b> {req.requestType}</Typography>
              <Typography variant="subtitle1"><b>BID Number:</b> {req.bidNumber}</Typography>
              <Typography variant="subtitle1"><b>Name of Company:</b> {req.businessName}</Typography>
              <Typography variant="subtitle1"><b>Trade Name:</b> {req.businessNickname}</Typography>
              <Typography variant="subtitle1"><b>Business Type:</b> {req.businessType}</Typography>
              <Typography variant="subtitle1"><b>Address:</b> {req.businessAddress}</Typography>
              <Typography variant="subtitle1">
                <b>Submitted on:</b> {new Date(req.createdAt).toLocaleString('en-PH')}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
                onClick={() => handleVerify(req._id)}
              >
                Open Request
              </Button>
            </Paper>
          ))}
        </Stack>
      ) : (
        !isLoading && !isError && (
          <Typography mt={4} color="text.secondary">
            No pending requests to verify.
          </Typography>
        )
      )}
    </Box>
  );
}
