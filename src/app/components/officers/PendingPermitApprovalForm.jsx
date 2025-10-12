'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Stack,
} from '@mui/material';
import { useState } from 'react';

export default function PendingPermitApprovalForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [remark, setRemark] = useState('');

  const {
    data: business,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['business', id],
    queryFn: async () => {
      const res = await fetch(`/api/business/${id}`);
      if (!res.ok) throw new Error(`Failed with status ${res.status}`);
      return res.json();
    },
    enabled: !!id,
  });

  const handleUpdate = async () => {
    try {
      const res = await fetch(`/api/business/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newRemarks: remark, newStatus: 'completed' }),
      });

      const result = await res.json();
      console.log('✅ Updated:', result);
      setRemark('');
      refetch();

      // 🧹 Clear accepted request lock
      localStorage.removeItem('permitapprovalRequestId');
      router.push('/officers/workbench/permitapproval');
    } catch (err) {
      console.error('❌ Update failed:', err);
    }
  };

  if (isLoading) {
    return (
      <Box mt={4} textAlign="center">
        <CircularProgress />
        <Typography mt={2}>Loading business details...</Typography>
      </Box>
    );
  }

  if (isError || !business || business.error) {
    return (
      <Box mt={4} textAlign="center">
        <Typography color="error">❌ Failed to load business: {error?.message}</Typography>
      </Box>
    );
  }

  return (
    <Box p={4}>

      {/* 🔁 Back to Online Request List */}
      <Button
        variant="outlined"
        color="secondary"
        sx={{ ml: 2 }}
        onClick={() => router.push('/officers/workbench/permitapproval')}
      >
        ↩️ Back to Verification Request Lists
      </Button>

      <Typography variant="h5" fontWeight="bold" mb={2} mt={2}>
        Officer View: Business Request
      </Typography>

      <Stack spacing={1} mb={3}>
        <Typography><strong>BID Number:</strong> {business.bidNumber}</Typography>
        <Typography><strong>Business Name:</strong> {business.businessName}</Typography>
        <Typography><strong>Trade Name:</strong> {business.businessNickname}</Typography>
        <Typography><strong>Business Type:</strong> {business.businessType}</Typography>
        <Typography><strong>Business Address:</strong> {business.businessAddress}</Typography>
        <Typography><strong>Request Type:</strong> {business.requestType || 'Sanitation'}</Typography>
        <Typography><strong>Status:</strong> {business.status}</Typography>
        <Typography><strong>Remarks:</strong> {business.remarks || 'None'}</Typography>
        <Typography><strong>Created At:</strong> {new Date(business.createdAt).toLocaleString('en-PH')}</Typography>
        <Typography><strong>Updated At:</strong> {new Date(business.updatedAt).toLocaleString('en-PH')}</Typography>
      </Stack>

      <TextField
        label="Add Remark"
        multiline
        rows={4}
        fullWidth
        value={remark}
        onChange={(e) => setRemark(e.target.value)}
      />

      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 2 }}
        onClick={handleUpdate}
      >
        Save Remark and Proceed
      </Button>
    </Box>
  );
}
