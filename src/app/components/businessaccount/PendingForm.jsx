'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Typography, Box, Paper, Button, Stack } from '@mui/material';
import { getSanitationOnlineRequest } from '@/app/services/OnlineRequest';
import {useRouter} from 'next/navigation';


export default function PendingRequestForm() {

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

const pending = allRequests.filter(req => req.status === 'pending2');

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

  return (
    <>


    
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Pending Requests</h1>

      

      {/* 🗂️ List of Pending Requests Placeholder
      <section className="bg-white shadow p-6 rounded space-y-4">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">📌 Your Pending Requests</h2>
        <p className="text-gray-600">
          No pending requests found at the moment. This section will display ongoing requests such as new business registrations, renewals, and compliance submissions awaiting action.
        </p>
      </section> */}

        <Stack spacing={4}>
                {requests.map((req) => (
                  <Paper key={req._id || req.id || `${req.businessName}-${req.createdAt}`} elevation={2} sx={{ p: 2 }}>
                    <Typography variant="subtitle1">
                      <p><b>BID Number: </b>{req.bidNumber}</p>
                    </Typography>
                    <Typography variant="subtitle1">
                      <p><b>Name of Company: </b>{req.businessName}</p>
                    </Typography>
                    <Typography variant="subtitle1">
                      <p><b>Trade Name: </b>{req.businessNickname}</p>
                    </Typography>
                    <Typography variant="subtitle1">
                      <p><b>Business Type: </b>{req.businessType}</p>
                    </Typography>
                    <Typography variant="subtitle1">
                      <p><b>Address: </b>{req.businessAddress}</p>
                    </Typography>
                    <Typography variant="subtitle1">
                      <p><b>Request Type: </b>{req.requestType}</p>
                    </Typography>
                    <Typography variant="subtitle1">
                      <p><b>Submitted on: </b>{new Date(req.createdAt).toLocaleString('en-PH')}</p>
                    </Typography>
      
                    
                  </Paper>
                ))}
              </Stack>
    </>
  );
}
