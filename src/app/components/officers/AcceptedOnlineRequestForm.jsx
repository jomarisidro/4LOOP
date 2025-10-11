
'use client';
export const dynamic = "force-dynamic";
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

export default function AcceptedOnlineRequestForm() {
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
        body: JSON.stringify({
          newRemarks: remark,
          newStatus: 'pending',
        }),
      });

      if (!res.ok) throw new Error(`Server responded with ${res.status}`);

      const result = await res.json();
      setRemark('');
      refetch();

      localStorage.removeItem('acceptedRequestId');
      router.push('/officers/workbench/onlinerequest');
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
        <Typography color="error">
          ❌ Failed to load business: {error?.message}
        </Typography>
      </Box>
    );
  }

  const explicitFields = [
    'id',
    '_id',
    'bidNumber',
    'businessName',
    'businessNickname',
    'businessType',
    'businessAddress',
    'requestType',
    'status',
    'contactPerson',
    'contactNumber',
    'landmark',
    'remarks',
    'createdAt',
    'updatedAt',
    'sanitaryPermitChecklist',
    'healthCertificateChecklist',
    'msrChecklist',
    'checklist',
    'onlineRequest',
    'businessAccount',
    '__v',
    'requirements',
  ];

  return (
    <Box p={4}>
      <Button
        variant="outlined"
        color="secondary"
        sx={{ ml: 2 }}
        onClick={() => router.push('/officers/workbench/onlinerequest')}
      >
        ↩️ Back to Online Request Lists
      </Button>

      <Typography variant="h5" fontWeight="bold" mb={2} mt={2}>
         All Business Data
      </Typography>

      <Stack spacing={1} mb={3}>
        {[
          { label: 'BID Number', value: business.bidNumber },
          { label: 'Business Name', value: business.businessName },
          { label: 'Trade Name', value: business.businessNickname },
          { label: 'Business Type', value: business.businessType },
          { label: 'Business Address', value: business.businessAddress },
          { label: 'Request Type', value: business.requestType || 'Sanitation' },
          { label: 'Status', value: business.status },
          { label: 'Contact Person', value: business.contactPerson },
          { label: 'Contact Number', value: business.contactNumber },
          { label: 'Landmark', value: business.landmark },
          { label: 'Remarks', value: business.remarks || 'None' },
          { label: 'Created At', value: new Date(business.createdAt).toLocaleString('en-PH') },
          { label: 'Updated At', value: new Date(business.updatedAt).toLocaleString('en-PH') },
        ].map(({ label, value }) => (
          <Box key={label} sx={{ display: 'flex', mb: 1 }}>
            <Typography sx={{ minWidth: 400, fontWeight: 'bold' }}>{label}:</Typography>
            <Typography>{value}</Typography>
          </Box>
        ))}
      </Stack>

      {/* ✅ Explicit Checklist Rendering */}
      {business.sanitaryPermitChecklist?.length > 0 && (
        <Box sx={{ display: 'flex', mb: 3 }}>
          <Typography sx={{ minWidth: 400, fontWeight: 'bold' }}>Sanitary Permit Checklist:</Typography>
          <Box>
            <ul className="list-disc list-inside text-sm text-gray-700">
              {business.sanitaryPermitChecklist.map((item, idx) => (
                <li key={idx}>{item.label}</li>
              ))}
            </ul>
          </Box>
        </Box>
      )}

      {business.healthCertificateChecklist?.length > 0 && (
        <Box sx={{ display: 'flex', mb: 3 }}>
          <Typography sx={{ minWidth: 400, fontWeight: 'bold' }}>Health Certificate Checklist:</Typography>
          <Box>
            <ul className="list-disc list-inside text-sm text-gray-700">
              {business.healthCertificateChecklist.map((item, idx) => (
                <li key={idx}>{item.label}</li>
              ))}
            </ul>
          </Box>
        </Box>
      )}

      {business.msrChecklist?.length > 0 && (
        <Box sx={{ display: 'flex', mb: 3 }}>
          <Typography sx={{ minWidth: 400, fontWeight: 'bold' }}>MSR Checklist:</Typography>
          <Box>
            <ul className="list-disc list-inside text-sm text-gray-700">
              {business.msrChecklist.map((item, idx) => (
                <li key={idx}>
                  {item.label}
                  {item.dueDate && (
                    <span className="text-red-700 ml-2">
                      (Due: {new Date(item.dueDate).toLocaleDateString('en-PH')})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Box>
        </Box>
      )}

      {/* ✅ Dynamic Rendering for Remaining Fields */}
      

      <Stack spacing={1} mb={3}>
        {Object.entries(business).map(([key, value]) => {
          if (explicitFields.includes(key)) return null;

          if (typeof value === 'object') {
            return (
              <Box key={key} sx={{ display: 'flex', mb: 1 }}>
                <Typography sx={{ minWidth: 400, fontWeight: 'bold' }}>{key}:</Typography>
                <Typography>{JSON.stringify(value)}</Typography>
              </Box>
            );
          }

          return (
            <Box key={key} sx={{ display: 'flex', mb: 1 }}>
              <Typography sx={{ minWidth: 400, fontWeight: 'bold' }}>{key}:</Typography>
              <Typography>{String(value)}</Typography>
            </Box>
          );
        })}
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
