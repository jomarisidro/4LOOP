'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Typography,
  Box,
  Paper,
  Button,
  Stack,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  getSanitationOnlineRequest,
  updateSanitationOnlineRequest,
} from '@/app/services/OnlineRequest';
import { HiTrash } from 'react-icons/hi';

export default function RequestSentForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['online-request'],
    queryFn: async () => {
      const response = await getSanitationOnlineRequest();
      const allRequests = Array.isArray(response) ? response : response?.data || [];
      const submitted = allRequests.filter((req) => req.status === 'submitted');
      return submitted;
    },
    refetchInterval: 5000,
  });

  const mutation = useMutation({
    mutationFn: ({ id, payload }) => updateSanitationOnlineRequest(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['online-request']);
    },
    onError: (err) => {
      console.error('Update failed:', err);
    },
  });

  const handleDelete = (req) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;

    const payload = {
      newBidNumber: req.bidNumber || '',
      newBusinessName: req.businessName || '',
      newBusinessNickname: req.businessNickname || '',
      newBusinessType: req.businessType || '',
      newBusinessAddress: req.businessAddress || '',
      newContactPerson: req.contactPerson || '',
      newLandmark: req.landmark || '',
      newContactNumber: req.contactNumber || '',
      newRemarks: '',
      newStatus: 'draft',
    };

    mutation.mutate({ id: req._id, payload });
  };

  const renderValue = (label, field, req) => {
    const value = req[field] || '—';

    return (
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-gray-700">{label}:</span>
        <span className="w-full bg-gray-100 text-gray-800 px-3 py-2 rounded-md border border-gray-300">
          {value}
        </span>
      </div>
    );
  };

  return (
    <Box className="w-full bg-white shadow rounded-lg p-6">
      <div className="flex justify-start mb-6">
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => router.push('/businessaccount/request')}
        >
          ↩️ Back to Request Lists
        </Button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-blue-900 uppercase">
          View Request Sent
        </h1>
        <Divider className="my-3" />
      </div>

      {isLoading ? (
        <Stack alignItems="center" mt={4}>
          <CircularProgress />
          <Typography variant="body2" mt={2}>
            Loading requests...
          </Typography>
        </Stack>
      ) : isError ? (
        <Typography variant="body2" color="error" mt={2}>
          Error fetching requests: {error.message}
        </Typography>
      ) : data?.length > 0 ? (
        data.map((req) => (
          <Paper
            key={req._id}
            elevation={2}
            className="p-6 mb-10 rounded-lg border border-gray-300 bg-white relative"
          >
            <div className="absolute -top-5 -right-5">
              <Button
                variant="contained"
                color="error"
                onClick={() => handleDelete(req)}
                startIcon={<HiTrash />}
              >
                Delete
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-4">
              {renderValue('BID Number', 'bidNumber', req)}
              {renderValue('Permit Status', 'status', req)}
            </div>

            <div className="grid grid-cols-2 gap-6 mb-4">
              {renderValue('Business Name', 'businessName', req)}
              {renderValue('Trade Name', 'businessNickname', req)}
            </div>

            <div className="grid grid-cols-2 gap-6 mb-4">
              {renderValue('Business Type', 'businessType', req)}
              {renderValue('Landmark', 'landmark', req)}
            </div>

            <div className="mb-4">{renderValue('Business Address', 'businessAddress', req)}</div>

            <div className="grid grid-cols-2 gap-6 mb-4">
              {renderValue('Contact Person', 'contactPerson', req)}
              {renderValue('Contact Number', 'contactNumber', req)}
            </div>

            <div className="mb-4">{renderValue('Remarks', 'remarks', req)}</div>

            <Typography variant="subtitle2" sx={{ mt: 2, color: 'gray', fontStyle: 'italic' }}>
              Submitted on: {new Date(req.createdAt).toLocaleString('en-PH')}
            </Typography>
          </Paper>
        ))
      ) : (
        <Typography variant="body2" color="text.secondary" mt={4}>
          No submitted online requests at the moment.
        </Typography>
      )}
    </Box>
  );
}
