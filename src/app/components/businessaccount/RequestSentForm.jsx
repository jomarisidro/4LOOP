'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Typography,
  Box,
  Paper,
  Button,
  Stack,
  CircularProgress,
  TextField,
} from '@mui/material';
import {
  getSanitationOnlineRequest,
  updateSanitationOnlineRequest,
} from '@/app/services/OnlineRequest';

export default function RequestSentForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['online-request'],
    queryFn: async () => {
      const response = await getSanitationOnlineRequest();
      const allRequests = Array.isArray(response) ? response : response?.data || [];
      const submitted = allRequests.filter(req => req.status === 'submitted');
      const uniqueRequests = Array.from(
        new Map(submitted.map(req => [`${req._id}-${req.requestType}`, req])).values()
      );
      return uniqueRequests;
    },
    refetchInterval: 5000,
  });

  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const mutation = useMutation({
    mutationFn: ({ id, payload }) => updateSanitationOnlineRequest(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['online-request']);
      setSelectedRequest(null);
    },
    onError: (err) => {
      console.error('Update failed:', err);
    },
  });

  useEffect(() => {
    if (data) setRequests(data);
  }, [data]);

  const handleEditClick = (req) => setSelectedRequest(req);

  const handleSoftDelete = (req) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    mutation.mutate({ id: req._id, payload: { newStatus: 'draft' } });
  };

  const handleFieldChange = (field, value) => {
    setSelectedRequest(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const { _id, ...rest } = selectedRequest;
    const payload = {
      newBusinessName: rest.businessName || '',
      newBusinessNickname: rest.businessNickname || '',
      newBusinessType: rest.businessType || '',
      newBusinessAddress: rest.businessAddress || '',
      newBidNumber: rest.bidNumber || '',
      newRequestType: rest.requestType || '',
      newStatus: rest.status || '',
      newRequirements: rest.requirements || '',
      newContactPerson: rest.contactPerson || '',
      newContactNumber: rest.contactNumber || '',
      newLandmark: rest.landmark || '',
      newRemarks: rest.remarks || '',
    };
    mutation.mutate({ id: _id, payload });
  };

  const renderField = (label, field, req) => (
    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
      <Typography variant="subtitle1" sx={{ minWidth: 180 }}>
        <b>{label}:</b>
      </Typography>
      {selectedRequest?._id === req._id ? (
        <TextField
          size="small"
          value={selectedRequest[field] || ''}
          onChange={(e) => handleFieldChange(field, e.target.value)}
        />
      ) : (
        <Typography>{req[field]}</Typography>
      )}
    </Stack>
  );

  return (
    <Box position="relative" p={2}>
      <Button
        variant="outlined"
        onClick={() => router.push('/businessaccount/request')}
        sx={{ mb: 2 }}
      >
        ← Back
      </Button>

      <Typography variant="h6" fontWeight="bold" mb={2} mt={6}>
        📄 View Request Sent
      </Typography>

      {isLoading && (
        <Stack alignItems="center" mt={4}>
          <CircularProgress />
          <Typography variant="body2" mt={2}>Loading requests...</Typography>
        </Stack>
      )}

      {isError && (
        <Typography variant="body2" color="error" mt={2}>
          Error fetching requests: {error.message}
        </Typography>
      )}

      {!isLoading && !isError && requests.length > 0 ? (
        <Stack spacing={4}>
          {requests.map((req, index) => (
            <Paper
              key={`${req._id}-${req.requestType}-${index}`}
              elevation={2}
              sx={{ p: 2, borderLeft: '6px solid #1976d2' }}
            >
              {renderField('BID Number', 'bidNumber', req)}
              {renderField('Business Name', 'businessName', req)}
              {renderField('Trade Name', 'businessNickname', req)}
              {renderField('Business Type', 'businessType', req)}
              {renderField('Address', 'businessAddress', req)}
              {renderField('Request Type', 'requestType', req)}
              {renderField('Status', 'status', req)}
              {renderField('Requirements', 'requirements', req)}
              {renderField('Contact Person', 'contactPerson', req)}
              {renderField('Contact Number', 'contactNumber', req)}
              {renderField('Landmark', 'landmark', req)}
              {renderField('Remarks', 'remarks', req)}

              <Typography variant="subtitle1" sx={{ mt: 1 }}>
                <b>Submitted on:</b> {new Date(req.createdAt).toLocaleString('en-PH')}
              </Typography>

              {selectedRequest?._id === req._id ? (
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSave}
                    disabled={mutation.isLoading}
                  >
                    {mutation.isLoading ? 'Saving...' : 'Save'}
                  </Button>
                  <Button variant="outlined" onClick={() => setSelectedRequest(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleSoftDelete(req)}
                  >
                    Delete Request
                  </Button>
                </Stack>
              ) : (
                <Button
                  variant="contained"
                  color="success"
                  sx={{ mt: 2 }}
                  onClick={() => handleEditClick(req)}
                >
                  Edit / View
                </Button>
              )}
            </Paper>
          ))}
        </Stack>
      ) : (
        !isLoading && !isError && (
          <Typography variant="body2" color="text.secondary" mt={4}>
            No submitted online requests at the moment.
          </Typography>
        )
      )}
    </Box>
  );
}
