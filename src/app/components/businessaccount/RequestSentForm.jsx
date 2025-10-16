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
  Divider,
} from '@mui/material';
import {
  getSanitationOnlineRequest,
  updateSanitationOnlineRequest,
} from '@/app/services/OnlineRequest';
import { HiPencilAlt, HiTrash, HiSave, HiX } from 'react-icons/hi';

export default function RequestSentForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // ✅ Fetch only submitted requests
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

  const handleFieldChange = (field, value) => {
    setSelectedRequest((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const { _id, ...rest } = selectedRequest;
    const payload = {
      newBusinessName: rest.businessName || '',
      newBusinessNickname: rest.businessNickname || '',
      newBusinessType: rest.businessType || '',
      newBusinessAddress: rest.businessAddress || '',
      newBidNumber: rest.bidNumber || '',
      newStatus: rest.status || '',
      newContactPerson: rest.contactPerson || '',
      newContactNumber: rest.contactNumber || '',
      newLandmark: rest.landmark || '',
      newRemarks: rest.remarks || '',
    };
    mutation.mutate({ id: _id, payload });
  };

  const renderValue = (label, field, req) => {
    const value = selectedRequest?._id === req._id
      ? selectedRequest[field] || ''
      : req[field] || '—';

    // Read-only Permit Status
    if (field === 'status') {
      return (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-gray-700">{label}:</span>
          <span className="w-full bg-gray-200 text-gray-600 px-3 py-2 rounded-md border border-gray-300 cursor-not-allowed">
            {req.status || '—'}
          </span>
        </div>
      );
    }

    // Editable dropdown for businessType
    if (selectedRequest?._id === req._id && field === 'businessType') {
      return (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-gray-700">{label}:</span>
          <select
            value={value}
            onChange={(e) => handleFieldChange('businessType', e.target.value)}
            className="w-full bg-white text-gray-800 px-3 py-2 rounded-md border border-gray-400"
          >
            <option value="Food">Food</option>
            <option value="Non-Food">Non-Food</option>
          </select>
        </div>
      );
    }

    // ✅ Custom BID Number input format
    if (selectedRequest?._id === req._id && field === 'bidNumber') {
      return (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-gray-700">{label}:</span>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              let val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
              let formatted = '';
              for (let i = 0; i < val.length; i++) {
                const c = val[i];
                if (i < 2 && /[A-Z]/.test(c)) formatted += c;
                else if (i === 2 && c === '-') formatted += '-';
                else if (i > 2 && i < 7 && /\d/.test(c)) formatted += c;
                else if (i === 7 && c === '-') formatted += '-';
                else if (i > 7 && i < 14 && /\d/.test(c)) formatted += c;
              }
              handleFieldChange('bidNumber', formatted.slice(0, 14));
            }}
            maxLength={14}
            placeholder="e.g. AB-2025-123456"
            className="w-full bg-white text-gray-800 px-3 py-2 rounded-md border border-gray-400"
          />
        </div>
      );
    }

    // ✅ Custom Contact Number input format
    if (selectedRequest?._id === req._id && field === 'contactNumber') {
      return (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-gray-700">{label}:</span>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              let input = e.target.value.replace(/\D/g, '');
              if (!input.startsWith('09')) input = '09';
              const trimmed = input.slice(0, 11);
              handleFieldChange('contactNumber', trimmed);
            }}
            inputMode="numeric"
            maxLength={11}
            placeholder="e.g. 09123456789"
            className="w-full bg-white text-gray-800 px-3 py-2 rounded-md border border-gray-400"
          />
        </div>
      );
    }

    // Default text inputs and read-only values
    return (
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-gray-700">{label}:</span>
        {selectedRequest?._id === req._id ? (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className="w-full bg-white text-gray-800 px-3 py-2 rounded-md border border-gray-400"
          />
        ) : (
          <span className="w-full bg-gray-100 text-gray-800 px-3 py-2 rounded-md border border-gray-300">
            {value}
          </span>
        )}
      </div>
    );
  };

  return (
    <Box className="w-full bg-white shadow rounded-lg p-6">
      {/* Header */}
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
      ) : requests.length > 0 ? (
        requests.map((req) => {
          const isEditing = selectedRequest?._id === req._id;

          return (
            <Paper
              key={req._id}
              elevation={2}
              className="p-6 mb-10 rounded-lg border border-gray-300 bg-white relative"
            >
              {/* Buttons */}
              <div className="absolute -top-5 -right-5">
                {isEditing ? (
                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" color="success" onClick={handleSave} startIcon={<HiSave />}>
                      Save
                    </Button>
                    <Button variant="outlined" color="secondary" onClick={() => setSelectedRequest(null)} startIcon={<HiX />}>
                      Cancel
                    </Button>
                  </Stack>
                ) : (
                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" color="primary" onClick={() => handleEditClick(req)} startIcon={<HiPencilAlt />}>
                      Edit
                    </Button>
                    <Button variant="contained" color="error" onClick={() => handleDelete(req)} startIcon={<HiTrash />}>
                      Delete
                    </Button>
                  </Stack>
                )}
              </div>

              {/* Form layout */}
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
          );
        })
      ) : (
        <Typography variant="body2" color="text.secondary" mt={4}>
          No submitted online requests at the moment.
        </Typography>
      )}
    </Box>
  );
}
