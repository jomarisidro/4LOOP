'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Typography, Box, Paper, Button, Stack } from '@mui/material';
import { getSanitationOnlineRequest } from '@/app/services/OnlineRequest';
import {useRouter} from 'next/navigation';


export default function CompletedRequestForm() {

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

const pendingStatuses = ['pending', 'pending2', 'pending 3', 'pending 4'];
const pending = allRequests.filter(req => pendingStatuses.includes(req.status));

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
 
    <h1 className="text-3xl font-bold text-gray-800 mb-4">Completed Requests</h1>

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
